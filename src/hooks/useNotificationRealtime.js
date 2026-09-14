import { useEffect, useRef, useState } from 'react';

const getSocketUrl = () => {
  if (import.meta.env.VITE_NOTIFICATION_WS_URL) return import.meta.env.VITE_NOTIFICATION_WS_URL;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws-native`;
};

export const useNotificationRealtime = ({ enabled, onNotification }) => {
  const callbackRef = useRef(onNotification);
  const reconnectRef = useRef(null);
  const attemptsRef = useRef(0);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    callbackRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    if (!enabled) return undefined;
    let socket;
    let stopped = false;

    const connect = () => {
      if (stopped) return;
      setStatus('connecting');
      socket = new WebSocket(getSocketUrl());
      socket.onopen = () => {
        attemptsRef.current = 0;
        const token = localStorage.getItem('authToken');
        socket.send(`CONNECT\naccept-version:1.2\nhost:jobportal\nAuthorization:Bearer ${token}\n\n\0`);
      };
      socket.onmessage = (event) => {
        const frame = String(event.data || '');
        if (frame.startsWith('CONNECTED')) {
          setStatus('connected');
          socket.send('SUBSCRIBE\nid:notifications\ndestination:/user/queue/notifications\nack:auto\n\n\0');
          return;
        }
        if (!frame.startsWith('MESSAGE')) return;
        const body = frame.split('\n\n')[1]?.replace(/\0$/, '');
        try {
          callbackRef.current?.(JSON.parse(body));
        } catch {
          setStatus('connected');
        }
      };
      socket.onerror = () => setStatus('error');
      socket.onclose = () => {
        if (stopped) return;
        setStatus('reconnecting');
        attemptsRef.current += 1;
        reconnectRef.current = window.setTimeout(connect, Math.min(1000 * attemptsRef.current, 8000));
      };
    };

    connect();
    return () => {
      stopped = true;
      window.clearTimeout(reconnectRef.current);
      socket?.close();
      setStatus('idle');
    };
  }, [enabled]);

  return status;
};