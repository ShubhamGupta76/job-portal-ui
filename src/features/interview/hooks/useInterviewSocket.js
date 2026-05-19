import { useCallback, useEffect, useRef, useState } from 'react';
import { getInterviewSocketUrl } from '../utils/interviewUtils';

export const useInterviewSocket = ({ roomToken, enabled, onMessage }) => {
  const socketRef = useRef(null);
  const reconnectRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const connectRef = useRef(null);
  const [status, setStatus] = useState('idle');

  const connect = useCallback(() => {
    if (!roomToken || !enabled) return;
    setStatus('connecting');
    const socket = new WebSocket(getInterviewSocketUrl(roomToken));
    socketRef.current = socket;

    socket.onopen = () => {
      reconnectAttempts.current = 0;
      setStatus('connected');
    };

    socket.onmessage = (event) => {
      try {
        onMessage?.(JSON.parse(event.data));
      } catch {
        // Ignore malformed signaling payloads from stale clients.
      }
    };

    socket.onclose = () => {
      setStatus('disconnected');
      if (enabled) {
        reconnectAttempts.current += 1;
        const delay = Math.min(1000 * reconnectAttempts.current, 6000);
        reconnectRef.current = window.setTimeout(() => connectRef.current?.(), delay);
      }
    };

    socket.onerror = () => {
      setStatus('error');
      socket.close();
    };
  }, [enabled, onMessage, roomToken]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const send = useCallback((message) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ roomToken, ...message }));
    }
  }, [roomToken]);

  useEffect(() => {
    const initialConnect = window.setTimeout(() => connectRef.current?.(), 0);
    return () => {
      window.clearTimeout(initialConnect);
      window.clearTimeout(reconnectRef.current);
      socketRef.current?.close();
    };
  }, [roomToken, enabled]);

  return { status, send };
};
