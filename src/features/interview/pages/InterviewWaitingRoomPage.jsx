import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, ShieldCheck } from 'lucide-react';
import interviewService from '../services/interviewService';
import { getDeviceMetadata } from '../utils/interviewUtils';

const InterviewWaitingRoomPage = () => {
  const { inviteToken } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [identityConfirmed, setIdentityConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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

  const join = async () => {
    if (!session) return;
    if (session.status !== 'LIVE') {
      setError('Recruiter has not started the interview yet. This page will refresh automatically.');
      return;
    }
    setError('');
    try {
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
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#155e75_0,#07111f_42%,#020617_100%)] px-4 text-white">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-white/10 bg-white/[0.07] shadow-2xl shadow-black/30 backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="p-8 lg:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">Secure Invite</p>
          <h1 className="mt-4 text-4xl font-black">Interview Waiting Room</h1>
          <p className="mt-4 text-slate-300">Check your identity, confirm device readiness, then enter the live interview room.</p>
          <div className="mt-8 rounded-lg border border-white/10 bg-slate-950/70 p-5">
            {loading && <p className="text-slate-400">Loading interview...</p>}
            {session && (
              <>
                <h2 className="text-2xl font-bold">{session.title}</h2>
                <p className="mt-2 text-slate-400">{session.jobTitle}</p>
                <p className="mt-1 text-sm text-slate-400">{new Date(session.scheduledStartAt).toLocaleString()}</p>
              </>
            )}
            {error && <p className="mt-4 rounded-md bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
          </div>
        </section>
        <section className="border-t border-white/10 bg-slate-950/70 p-8 lg:border-l lg:border-t-0 lg:p-10">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-100">
            <Camera size={42} />
          </div>
          <h2 className="mt-6 text-2xl font-black">Before you join</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <p>Camera and microphone permission will be requested in the room.</p>
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
