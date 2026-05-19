export const getInterviewSocketUrl = (roomToken) => {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
  const socketBase = apiBase.replace('/api/v1', '').replace(/^http/, 'ws');
  const token = localStorage.getItem('authToken') || '';
  return `${socketBase}/interview-signal?roomToken=${encodeURIComponent(roomToken)}&token=${encodeURIComponent(token)}`;
};

export const getDeviceMetadata = () => ({
  userAgent: navigator.userAgent,
  platform: navigator.platform,
  language: navigator.language,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  screen: `${window.screen.width}x${window.screen.height}`,
});

export const formatDuration = (seconds) => {
  const value = Math.max(0, Number(seconds || 0));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const remainingSeconds = value % 60;
  return [hours, minutes, remainingSeconds].map((item) => String(item).padStart(2, '0')).join(':');
};

export const participantName = (participant) => participant?.name || participant?.email || 'Participant';

export const readUserIdFromToken = () => {
  try {
    const token = localStorage.getItem('authToken');
    const [, payload] = token.split('.');
    const decoded = JSON.parse(window.atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return Number(decoded.userId);
  } catch {
    return null;
  }
};
