import { useCallback, useEffect, useRef, useState } from 'react';

const rtcConfig = {
  iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }],
};

export const useWebRTC = ({ localStream, currentUserId, sendSignal }) => {
  const peersRef = useRef(new Map());
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [networkQuality, setNetworkQuality] = useState('good');

  const ensurePeer = useCallback((peerUserId) => {
    if (peersRef.current.has(peerUserId)) {
      return peersRef.current.get(peerUserId);
    }

    const connection = new RTCPeerConnection(rtcConfig);
    localStream?.getTracks().forEach((track) => connection.addTrack(track, localStream));

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({ type: 'ice-candidate', targetUserId: peerUserId, payload: { candidate: event.candidate } });
      }
    };

    connection.ontrack = (event) => {
      const [stream] = event.streams;
      setRemoteStreams((current) => {
        const existing = current.find((item) => item.userId === peerUserId);
        if (existing) return current.map((item) => (item.userId === peerUserId ? { ...item, stream } : item));
        return [...current, { userId: peerUserId, stream }];
      });
    };

    connection.onconnectionstatechange = () => {
      if (['failed', 'closed', 'disconnected'].includes(connection.connectionState)) {
        setRemoteStreams((current) => current.filter((item) => item.userId !== peerUserId));
      }
    };

    peersRef.current.set(peerUserId, connection);
    return connection;
  }, [localStream, sendSignal]);

  const callPeer = useCallback(async (peerUserId) => {
    if (!peerUserId || peerUserId === currentUserId) return;
    const peer = ensurePeer(peerUserId);
    const offer = await peer.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    await peer.setLocalDescription(offer);
    sendSignal({ type: 'offer', targetUserId: peerUserId, payload: { offer } });
  }, [currentUserId, ensurePeer, sendSignal]);

  const handleSignal = useCallback(async (message) => {
    const peerUserId = message.senderId;
    if (!peerUserId || peerUserId === currentUserId) return;
    const peer = ensurePeer(peerUserId);

    if (message.type === 'offer') {
      await peer.setRemoteDescription(new RTCSessionDescription(message.payload.offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      sendSignal({ type: 'answer', targetUserId: peerUserId, payload: { answer } });
    }

    if (message.type === 'answer') {
      await peer.setRemoteDescription(new RTCSessionDescription(message.payload.answer));
    }

    if (message.type === 'ice-candidate' && message.payload?.candidate) {
      await peer.addIceCandidate(new RTCIceCandidate(message.payload.candidate));
    }
  }, [currentUserId, ensurePeer, sendSignal]);

  const replaceVideoTrack = useCallback(async (newTrack) => {
    peersRef.current.forEach((peer) => {
      const sender = peer.getSenders().find((item) => item.track?.kind === 'video');
      sender?.replaceTrack(newTrack);
    });
  }, []);

  const closePeers = useCallback(() => {
    peersRef.current.forEach((peer) => peer.close());
    peersRef.current.clear();
    setRemoteStreams([]);
  }, []);

  useEffect(() => {
    const id = window.setInterval(async () => {
      const stats = await Promise.all(
        Array.from(peersRef.current.values()).map((peer) => peer.getStats().catch(() => null))
      );
      const connected = stats.filter(Boolean).length;
      setNetworkQuality(connected === 0 ? 'waiting' : connected > 1 ? 'excellent' : 'good');
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => closePeers, [closePeers]);

  return { remoteStreams, networkQuality, callPeer, handleSignal, replaceVideoTrack, closePeers };
};
