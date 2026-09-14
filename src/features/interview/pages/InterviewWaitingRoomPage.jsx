import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Mic, MicOff, ShieldCheck, VideoOff } from 'lucide-react';
import interviewService from '../services/interviewService';
import { getDeviceMetadata } from '../utils/interviewUtils';

const formatCountdown = (scheduledStartAt) => {
  if (!scheduledStartAt) return null;
  const diffMs = new Date(scheduledStartAt).getTime() - Date.now();
  if (diffMs <= 0) return 'Starting soon';
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const seconds = Math.floor((diffMs % 60000) / 1000);
  if (days > 0) return `Starts in ${days}d ${hours}h`;
  if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
  if (minutes > 0) return `Starts in ${minutes}m ${seconds}s`;
  return `Starts in ${seconds}s`;
};

const useDeviceCheck = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const rafRef = useRef(null);
  const [state, setState] = useState('idle');
  const [micLevel, setMicLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const stop = () => {
    window.cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
  };

  const start = async () => {
    setState('requesting');
    setErrorMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(data);
        const average = data.reduce((sum, value) => sum + value, 0) / data.length;
        setMicLevel(Math.min(100, Math.round((average / 255) * 140)));
        rafRef.current = window.requestAnimationFrame(tick);
      };
      tick();
      setState('granted');
    } catch (err) {
      setState('denied');
      setErrorMessage(err?.name === 'NotFoundError' ? 'No camera or microphone was found on this device.' : 'Camera and microphone access was blocked. Enable permissions in your browser to continue.');
    }
  };

  useEffect(() => () => stop(), []);

  return { videoRef, state, micLevel, errorMessage, start, stop };
};

const InterviewWaitingRoomPage = () => {
  const { inviteToken } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [identityConfirmed, setIdentityConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const deviceCheck = useDeviceCheck();

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const response = await interviewService.getSessionByInvite(inviteToken);
        if (!ignore) {
          setSession(response.data);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.message || 'Invite link is invalid or expired.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    load();

    const refreshId = window.setInterval(load, 8000);
    return () => {
      ignore = true;
      window.clearInterval(refreshId);
    };
  }, [inviteToken]);

  useEffect(() => {
    if (!session?.scheduledStartAt || session.status === 'LIVE') {
      setCountdown(null);
      return undefined;
    }
    setCountdown(formatCountdown(session.scheduledStartAt));
    const tickId = window.setInterval(() => setCountdown(formatCountdown(session.scheduledStartAt)), 1000);
    return () => window.clearInterval(tickId);
  }, [session?.scheduledStartAt, session?.status]);

  const join = async () => {
    if (!session) return;
    if (session.status !== 'LIVE') {
      setError('Recruiter has not started the interview yet. This page will refresh automatically.');
      return;
    }
    setError('');
    try {
      deviceCheck.stop();
      await interviewService.joinSession(session.roomToken, {
        inviteToken,
        identityConfirmed,
        deviceMetadata: JSON.stringify(getDeviceMetadata()),
      });
      navigate(`/interview/room/${session.roomToken}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to join interview.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#155e75_0,#07111f_42%,#020617_100%)] px-4 py-10 text-white">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-white/10 bg-white/[0.07] shadow-2xl shadow-black/30 backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="p-8 lg:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">Secure Invite</p>
          <h1 className="mt-4 text-4xl font-black">Interview Waiting Room</h1>
          <p className="mt-4 text-slate-300">Check your identity, test your camera and microphone, then enter the live interview room.</p>
          <div className="mt-8 rounded-lg border border-white/10 bg-slate-950/70 p-5">
            {loading && <p className="text-slate-400">Loading interview...</p>}
            {session && (
              <>
                <h2 className="text-2xl font-bold">{session.title}</h2>
                <p className="mt-2 text-slate-400">{session.jobTitle}</p>
                <p className="mt-1 text-sm text-slate-400">{new Date(session.scheduledStartAt).toLocaleString()}</p>
                {countdown && (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-cyan-400/10 px-3 py-1.5 text-sm font-semibold text-cyan-200">
                    {countdown}
                  </p>
                )}
                {session.status === 'LIVE' && (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-sm font-semibold text-emerald-300">
                    Interview is live — you can join now
                  </p>
                )}
              </>
            )}
            {error && <p className="mt-4 rounded-md bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
          </div>

          <div className="mt-6 rounded-lg border border-white/10 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Device check</h3>
              {deviceCheck.state === 'granted' && (
                <span className="text-xs font-semibold text-emerald-300">Camera and mic ready</span>
              )}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
              <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-md border border-white/10 bg-black">
                {deviceCheck.state === 'granted' ? (
                  <video ref={deviceCheck.videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                ) : (
                  <VideoOff className="text-slate-600" size={28} />
                )}
              </div>
              <div className="flex flex-col justify-center gap-3">
                {deviceCheck.state !== 'granted' && (
                  <button
                    type="button"
                    onClick={deviceCheck.start}
                    disabled={deviceCheck.state === 'requesting'}
                    className="inline-flex h-10 w-fit items-center gap-2 rounded-md bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-60"
                  >
                    <Camera size={16} />
                    {deviceCheck.state === 'requesting' ? 'Requesting access...' : 'Test camera & microphone'}
                  </button>
                )}
                {deviceCheck.state === 'granted' && (
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                      <Mic size={14} /> Microphone level
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-emerald-400 transition-[width]" style={{ width: `${deviceCheck.micLevel}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Speak normally to confirm your microphone is picked up.</p>
                  </div>
                )}
                {deviceCheck.state === 'denied' && (
                  <p className="flex items-start gap-2 text-sm text-rose-200">
                    <MicOff size={16} className="mt-0.5 flex-shrink-0" /> {deviceCheck.errorMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
        <section className="border-t border-white/10 bg-slate-950/70 p-8 lg:border-l lg:border-t-0 lg:p-10">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-100">
            <Camera size={42} />
          </div>
          <h2 className="mt-6 text-2xl font-black">Before you join</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <p>Test your camera and microphone above; access is requested again when you enter the room.</p>
            <p>Device and browser metadata is logged for interview security.</p>
            <label className="flex items-start gap-3 rounded-md border border-white/10 bg-white/5 p-3">
              <input type="checkbox" checked={identityConfirmed} onChange={(event) => setIdentityConfirmed(event.target.checked)} className="mt-1 accent-cyan-400" />
              <span>I confirm my identity and I am the invited candidate.</span>
            </label>
          </div>
          <button
            type="button"
            onClick={join}
            disabled={!session || session.status !== 'LIVE' || (session?.identityVerificationRequired && !identityConfirmed)}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-cyan-400 font-bold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShieldCheck size={18} />
            {session?.status === 'LIVE' ? 'Join Interview' : 'Waiting for Recruiter'}
          </button>
          {session && session.status !== 'LIVE' && (
            <p className="mt-3 text-sm text-slate-400">
              Scheduled interview is not live yet. Keep this page open or come back from your dashboard when recruiter starts.
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default InterviewWaitingRoomPage;
