import React, { useState, useEffect } from 'react';

const Timer = ({ expiresAt, onTimeUp, onProtoringEvent }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasWarned, setHasWarned] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expireTime = new Date(expiresAt).getTime();
      const diff = expireTime - now;

      if (diff <= 0) {
        setTimeLeft(0);
        onTimeUp();
        clearInterval(interval);
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setTimeLeft(minutes * 60 + seconds);

        // Warn when 5 minutes left
        if (minutes < 5 && !hasWarned) {
          setHasWarned(true);
          onProtoringEvent('TIME_WARNING', 20, { minutesLeft: minutes });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, hasWarned, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = timeLeft < 300; // 5 minutes

  return (
    <div className={`text-center font-semibold ${isWarning ? 'text-red-600' : 'text-gray-600'}`}>
      <div className="text-sm">Time Remaining</div>
      <div className={`text-2xl font-mono ${isWarning ? 'animate-pulse' : ''}`}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
    </div>
  );
};

export default Timer;
