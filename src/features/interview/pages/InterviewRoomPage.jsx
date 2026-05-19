import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import InterviewHeader from '../components/InterviewHeader';
import VideoTile from '../components/VideoTile';
import InterviewControls from '../components/InterviewControls';
import InterviewChat from '../components/InterviewChat';
import ParticipantSidebar from '../components/ParticipantSidebar';
import LiveCodePanel from '../components/LiveCodePanel';
import { useMediaDevices } from '../hooks/useMediaDevices';
import { useInterviewSocket } from '../hooks/useInterviewSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { useInterviewTimer } from '../hooks/useInterviewTimer';
import interviewService from '../services/interviewService';
import { getDeviceMetadata, participantName, readUserIdFromToken } from '../utils/interviewUtils';

const starterCode = `import java.util.*;

class Solution {
    public static boolean isPrime(int n) {
        // Write interview solution here
        return false;
    }
}`;

const InterviewRoomPage = () => {
  const { roomToken } = useParams();
  const navigate = useNavigate();
  const currentUserId = useMemo(() => readUserIdFromToken(), []);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [code, setCode] = useState(starterCode);
  const [error, setError] = useState('');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [onlineParticipantIds, setOnlineParticipantIds] = useState([]);
  const timer = useInterviewTimer(session?.startedAt || session?.scheduledStartAt);

  const {
    localStream,
    permissionError,
    isMicMuted,
    isCameraOff,
    requestMedia,
    toggleMic,
    toggleCamera,
    stopMedia,
  } = useMediaDevices();

  const handleSocketMessage = useCallback((message) => {
    if (['offer', 'answer', 'ice-candidate'].includes(message.type)) {
      pendingSignals.current.push(message);
      return;
    }
    if (message.type === 'chat') {
      setMessages((current) => [...current, message.payload]);
    }
    if (message.type === 'code-update') {
      setCode(message.payload?.code || '');
    }
    if (message.type === 'participant-online' || message.type === 'participant-offline') {
      setOnlineParticipantIds(message.payload?.onlineParticipants || []);
    }
  }, []);

  const { status: socketStatus, send } = useInterviewSocket({
    roomToken,
    enabled: Boolean(session && localStream),
    onMessage: handleSocketMessage,
  });

  const { remoteStreams, networkQuality, callPeer, handleSignal, replaceVideoTrack, closePeers } = useWebRTC({
    localStream,
    currentUserId,
    sendSignal: send,
  });

  const pendingSignals = React.useRef([]);

  useEffect(() => {
    const drain = async () => {
      while (pendingSignals.current.length) {
        await handleSignal(pendingSignals.current.shift());
      }
    };
    drain();
  }, [handleSignal, socketStatus]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await interviewService.getSession(roomToken);
        setSession(response.data);
        await requestMedia();
        await interviewService.joinSession(roomToken, {
          identityConfirmed: true,
          deviceMetadata: JSON.stringify(getDeviceMetadata()),
        });
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Unable to open interview room.');
      }
    };
    load();
  }, [requestMedia, roomToken]);

  useEffect(() => {
    if (!session || !localStream || socketStatus !== 'connected') return;
    session.participants
      .filter((participant) => participant.userId !== currentUserId)
      .forEach((participant) => callPeer(participant.userId));
  }, [callPeer, currentUserId, localStream, session, socketStatus]);

  useEffect(() => {
    if (!session) return;
    interviewService.updateParticipantState(roomToken, {
      microphoneMuted: isMicMuted,
      cameraOff: isCameraOff,
      screenSharing: isScreenSharing,
      networkQuality,
    }).catch(() => {});
  }, [isCameraOff, isMicMuted, isScreenSharing, networkQuality, roomToken, session]);

  const currentParticipant = session?.participants?.find((participant) => participant.userId === currentUserId);
  const canEnd = session?.recruiterId === currentUserId;

  const sendChat = async (content) => {
    const payload = {
      senderId: currentUserId,
      senderName: participantName(currentParticipant),
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, payload]);
    send({ type: 'chat', payload });
    await interviewService.sendMessage(roomToken, { type: 'CHAT', content }).catch(() => {});
  };

  const updateCode = (nextCode) => {
    setCode(nextCode);
    send({ type: 'code-update', payload: { code: nextCode } });
  };

  const shareScreen = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const [screenTrack] = screenStream.getVideoTracks();
      await replaceVideoTrack(screenTrack);
      setIsScreenSharing(true);
      screenTrack.onended = async () => {
        const cameraTrack = localStream?.getVideoTracks()[0];
        if (cameraTrack) await replaceVideoTrack(cameraTrack);
        setIsScreenSharing(false);
      };
    } catch {
      setIsScreenSharing(false);
    }
  };

  const leave = async () => {
    await interviewService.leaveSession(roomToken).catch(() => {});
    closePeers();
    stopMedia();
    navigate('/interviews');
  };

  const end = async () => {
    await interviewService.endSession(roomToken).catch(() => {});
    closePeers();
    stopMedia();
    navigate('/interviews');
  };

  const removeParticipant = async (userId) => {
    const response = await interviewService.removeParticipant(roomToken, userId);
    setSession(response.data);
    send({ type: 'participant-removed', targetUserId: userId, payload: { userId } });
  };

  const remoteTiles = remoteStreams.map((item) => ({
    ...item,
    participant: session?.participants?.find((participant) => participant.userId === item.userId),
  }));

  if (error || permissionError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="max-w-lg rounded-lg border border-rose-400/20 bg-rose-500/10 p-6">
          <h1 className="text-2xl font-bold">Interview room unavailable</h1>
          <p className="mt-3 text-rose-100">{error || permissionError}</p>
          <button onClick={() => navigate('/interviews')} className="mt-5 rounded-md bg-white px-4 py-2 font-semibold text-slate-950">
            Back to interviews
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] pb-28 text-white">
      <InterviewHeader session={session} timer={timer} socketStatus={socketStatus} networkQuality={networkQuality} />
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <VideoTile
              stream={localStream}
              name={participantName(currentParticipant)}
              muted
              isLocal
              cameraOff={isCameraOff}
              micMuted={isMicMuted}
            />
            {remoteTiles.map(({ userId, stream, participant }) => (
              <VideoTile
                key={userId}
                stream={stream}
                name={participantName(participant)}
                cameraOff={participant?.cameraOff}
                micMuted={participant?.microphoneMuted}
              />
            ))}
            {remoteTiles.length === 0 && (
              <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.04] text-center text-slate-400">
                Waiting for another participant to connect...
              </div>
            )}
          </div>
          <LiveCodePanel code={code} onChange={updateCode} />
        </section>

        <aside className="flex min-h-[760px] flex-col gap-4">
          <ParticipantSidebar
            participants={(session?.participants || []).map((participant) => ({
              ...participant,
              status: onlineParticipantIds.includes(participant.userId) ? 'ONLINE' : participant.status,
            }))}
            currentUserId={currentUserId}
            canManage={canEnd}
            onRemove={removeParticipant}
          />
          <InterviewChat messages={messages} onSend={sendChat} />
        </aside>
      </main>

      <InterviewControls
        isMicMuted={isMicMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onShareScreen={shareScreen}
        onLeave={leave}
        onEnd={end}
        onFullscreen={() => document.documentElement.requestFullscreen?.()}
        canEnd={canEnd}
      />
    </div>
  );
};

export default InterviewRoomPage;
