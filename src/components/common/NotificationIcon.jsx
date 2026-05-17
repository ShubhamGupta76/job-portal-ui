import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { notificationService } from '../../services';

const NotificationIcon = ({ count, className = '', dark = false }) => {
  const [unreadCount, setUnreadCount] = useState(Number(count || 0));

  useEffect(() => {
    if (typeof count === 'number') {
      setUnreadCount(count);
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) return;

    let ignore = false;
    notificationService.getUnreadCount()
      .then((response) => {
        if (!ignore) {
          setUnreadCount(Number(response.data?.data || 0));
        }
      })
      .catch(() => {
        if (!ignore) {
          setUnreadCount(0);
        }
      });

    return () => {
      ignore = true;
    };
  }, [count]);

  return (
    <Link
      to="/notifications"
      className={`relative flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
        dark
          ? 'border-white/10 bg-white/8 text-slate-200 hover:bg-white/14 hover:text-white'
          : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600'
      } ${className}`}
      aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
    >
      <Bell size={18} />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white ring-2 ring-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default NotificationIcon;
