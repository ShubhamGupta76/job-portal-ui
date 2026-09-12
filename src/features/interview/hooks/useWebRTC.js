import { useCallback, useEffect, useRef, useState } from 'react';

const rtcConfig = {
  iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }],
};

const sameUser = (left, right) => String(left) === String(right);

export const useWebRTC = ({ localStream, currentUserId, sendSignal }) => {
  const peersRef = useRef(new Map());
  const pendingCandidatesRef = useRef(new Map());
  const activeVideoTrackRef = useRef(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [networkQuality, setNetworkQuality] = useState('good');
  const [peerStates, setPeerStates] = useState({});

  const updatePeerState = useCallback((peerUserId, state) => {
    setPeerStates((current) => ({ ...current, [String(peerUserId)]: state }));
  }, []);

  const flushPendingCandidates = useCallback(async (peerUserId, connection) => {
    const peerKey = String(peerUserId);
    const pendingCandidates = pendingCandidatesRef.current.get(peerKey) || [];
    if (!pendingCandidates.length || !connection.remoteDescription) return;

    pendingCandidatesRef.current.delete(peerKey);
    await Promise.all(
      pendingCandidates.map((candidate) => connection.addIceCandidate(candidate).catch(() => {}))
    );
  }, []);

  const ensurePeer = useCallback((peerUserId) => {
    const peerKey = String(peerUserId);
    if (peersRef.current.has(peerKey)) {
      return peersRef.current.get(peerKey);
    }

    const connection = new RTCPeerConnection(rtcConfig);
    localStream?.getTracks().forEach((track) => {
      const senderTrack = track.kind === 'video' && activeVideoTrackRef.current ? activeVideoTrackRef.current : track;
      connection.addTrack(senderTrack, localStream);
    });

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({ type: 'ice-candidate', targetUserId: peerUserId, payload: { candidate: event.candidate } });
      }
    };

    connection.ontrack = (event) => {
      const [stream] = event.streams;
      updatePeerState(peerUserId, 'media-received');
      setRemoteStreams((current) => {
        const existing = current.find((item) => sameUser(item.userId, peerUserId));
        if (existing) return current.map((item) => (sameUser(item.userId, peerUserId) ? { ...item, stream } : item));
        return [...current, { userId: peerUserId, stream }];
      });
    };

    connection.onconnectionstatechange = () => {
      updatePeerState(peerUserId, connection.connectionState);
      if (['failed', 'closed'].includes(connection.connectionState)) {
        peersRef.current.delete(peerKey);
        pendingCandidatesRef.current.delete(peerKey);
        setRemoteStreams((current) => current.filter((item) => !sameUser(item.userId, peerUserId)));
      }
    };

    connection.oniceconnectionstatechange = () => {
      updatePeerState(peerUserId, connection.iceConnectionState);
    };

    peersRef.current.set(peerKey, connection);
    return connection;
  }, [localStream, sendSignal, updatePeerState]);

  const removePeer = useCallback((peerUserId) => {
    const peerKey = String(peerUserId);
    const peer = peersRef.current.get(peerKey);
    peer?.close();
    peersRef.current.delete(peerKey);
    pendingCandidatesRef.current.delete(peerKey);
    setRemoteStreams((current) => current.filter((item) => !sameUser(item.userId, peerUserId)));
  }, []);

  const callPeer = useCallback(async (peerUserId) => {
    if (!peerUserId || sameUser(peerUserId, currentUserId)) return;
    const peer = ensurePeer(peerUserId);
    if (peer.signalingState !== 'stable') return;
    updatePeerState(peerUserId, 'offering');
    const offer = await peer.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    await peer.setLocalDescription(offer);
    sendSignal({ type: 'offer', targetUserId: peerUserId, payload: { offer } });
    window.setTimeout(() => {
      if (['connected', 'completed'].includes(peer.iceConnectionState) || peer.connectionState === 'connected') return;
      removePeer(peerUserId);
      updatePeerState(peerUserId, 'retrying');
    }, 7000);
  }, [currentUserId, ensurePeer, removePeer, sendSignal, updatePeerState]);

  const handleSignal = useCallback(async (message) => {
    const peerUserId = message.senderId;
    if (!peerUserId || sameUser(peerUserId, currentUserId)) return;
    const peer = ensurePeer(peerUserId);

    if (message.type === 'offer') {
      updatePeerState(peerUserId, 'offer-received');
      const offerCollision = peer.signalingState !== 'stable';
      const isPolitePeer = String(currentUserId) > String(peerUserId);
      if (offerCollision && !isPolitePeer) return;
      if (offerCollision) {
        await Promise.all([
          peer.setLocalDescription({ type: 'rollback' }),
          peer.setRemoteDescription(new RTCSessionDescription(message.payload.offer)),
        ]);
      } else {
        await peer.setRemoteDescription(new RTCSessionDescription(message.payload.offer));
      }
      await flushPendingCandidates(peerUserId, peer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      sendSignal({ type: 'answer', targetUserId: peerUserId, payload: { answer } });
      updatePeerState(peerUserId, 'answer-sent');
    }

    if (message.type === 'answer') {
      if (peer.signalingState !== 'have-local-offer') return;
      await peer.setRemoteDescription(new RTCSessionDescription(message.payload.answer));
      await flushPendingCandidates(peerUserId, peer);
      updatePeerState(peerUserId, 'answer-received');
    }

    if (message.type === 'ice-candidate' && message.payload?.candidate) {
      const candidate = new RTCIceCandidate(message.payload.candidate);
      if (!peer.remoteDescription) {
        const peerKey = String(peerUserId);
        pendingCandidatesRef.current.set(peerKey, [
          ...(pendingCandidatesRef.current.get(peerKey) || []),
          candidate,
        ]);
        return;
      }
      await peer.addIceCandidate(candidate);
    }
  }, [currentUserId, ensurePeer, flushPendingCandidates, sendSignal, updatePeerState]);

  const replaceVideoTrack = useCallback(async (newTrack) => {
    activeVideoTrackRef.current = newTrack;
    peersRef.current.forEach((peer) => {
      const sender = peer.getSenders().find((item) => item.track?.kind === 'video');
      sender?.replaceTrack(newTrack);
    });
  }, []);

  const closePeers = useCallback(() => {
    peersRef.current.forEach((peer) => peer.close());
    peersRef.current.clear();
    pendingCandidatesRef.current.clear();
    activeVideoTrackRef.current = null;
    setRemoteStreams([]);
    setPeerStates({});
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

  return { remoteStreams, peerStates, networkQuality, callPeer, handleSignal, replaceVideoTrack, closePeers };
};
