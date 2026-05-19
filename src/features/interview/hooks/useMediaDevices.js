import { useCallback, useEffect, useState } from 'react';

export const useMediaDevices = () => {
  const [localStream, setLocalStream] = useState(null);
  const [permissionError, setPermissionError] = useState('');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const requestMedia = useCallback(async () => {
    setPermissionError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setIsMicMuted(false);
      setIsCameraOff(false);
      return stream;
    } catch (error) {
      setPermissionError(error.message || 'Camera and microphone permission is required.');
      return null;
    }
  }, []);

  const toggleMic = useCallback(() => {
    setIsMicMuted((current) => {
      localStream?.getAudioTracks().forEach((track) => {
        track.enabled = current;
      });
      return !current;
    });
  }, [localStream]);

  const toggleCamera = useCallback(() => {
    setIsCameraOff((current) => {
      localStream?.getVideoTracks().forEach((track) => {
        track.enabled = current;
      });
      return !current;
    });
  }, [localStream]);

  const stopMedia = useCallback(() => {
    localStream?.getTracks().forEach((track) => track.stop());
    setLocalStream(null);
  }, [localStream]);

  useEffect(() => () => {
    localStream?.getTracks().forEach((track) => track.stop());
  }, [localStream]);

  return {
    localStream,
    permissionError,
    isMicMuted,
    isCameraOff,
    requestMedia,
    toggleMic,
    toggleCamera,
    stopMedia,
  };
};
