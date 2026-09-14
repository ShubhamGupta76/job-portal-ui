import { useEffect, useRef, useState } from 'react';

const socketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws-native`;
};

export const useMessagingRealtime = ({ enabled, onEvent }) => {
  const callbackRef = useRef(onEvent);
  const reconnectRef = useRef(null);
  const attemptsRef = useRef(0);
  const socketRef = useRef(null);
  const [status, setStatus] = useState('idle');

  useEffect(() => { callbackRef.current = onEvent; }, [onEvent]);

  useEffect(() => {
    if (!enabled) return undefined;
    let socket;
    let stopped = false;
    const connect = () => {
      if (stopped) return;
      setStatus('connecting');
      socket = new WebSocket(socketUrl());
      socketRef.current = socket;
      socket.onopen = () => {
        attemptsRef.current = 0;
        socket.send(`CONNECT\naccept-version:1.2\nhost:jobportal\nAuthorization:Bearer ${localStorage.getItem('authToken')}\n\n\0`);
      };
      socket.onmessage = (event) => {
        const frame = String(event.data || '');
        if (frame.startsWith('CONNECTED')) {
          setStatus('connected');
          socket.send('SUBSCRIBE\nid:messages\ndestination:/user/queue/messages\nack:auto\n\n\0');
        } else if (frame.startsWith('MESSAGE')) {
          const body = frame.split('\n\n')[1]?.replace(/\0$/, '');
          try { callbackRef.current?.(JSON.parse(body)); } catch { setStatus('connected'); }
        }
      };
      socket.onerror = () => setStatus('error');
      socket.onclose = () => {
        socketRef.current = null;
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
      socketRef.current = null;
      setStatus('idle');
    };
  }, [enabled]);

  const sendTyping = (conversationId, typing) => {
    const socket = socketRef.current;
    if (!conversationId || !socket || socket.readyState !== WebSocket.OPEN) return;
    const body = JSON.stringify({ typing });
    socket.send(`SEND\ndestination:/app/conversations/${conversationId}/typing\ncontent-type:application/json\ncontent-length:${body.length}\n\n${body}\0`);
  };

  return { status, sendTyping };
};