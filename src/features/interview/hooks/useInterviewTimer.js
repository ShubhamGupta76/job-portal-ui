import { useEffect, useMemo, useState } from 'react';
import { formatDuration } from '../utils/interviewUtils';

export const useInterviewTimer = (startedAt) => {
  const [now, setNow] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return useMemo(() => {
    const start = startedAt ? new Date(startedAt).getTime() : now;
    return formatDuration(Math.floor((now - start) / 1000));
  }, [now, startedAt]);
};
