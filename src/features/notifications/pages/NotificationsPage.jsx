import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Clock3, Inbox, Search } from 'lucide-react';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Input from '../../../components/common/Input';
import { notificationService } from '../../../services';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await notificationService.getNotifications();
        setNotifications(response.data?.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load notifications.');
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notifications.filter((notification) => {
      const matchesFilter = filter === 'ALL' || (filter === 'UNREAD' ? !notification.read : notification.read);
      const matchesSearch = !query || [notification.title, notification.message, notification.type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  }, [filter, notifications, search]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId ? { ...notification, read: true } : notification
        )
      );
    } catch (err) {
      console.error('Notification update failed:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    } catch (err) {
      console.error('Bulk notification update failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] py-8 text-slate-950">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_330px]">
            <div className="bg-slate-950 px-6 py-8 text-white md:px-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <Bell size={23} />
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Inbox</p>
                  <h1 className="text-4xl font-semibold tracking-tight text-white">Notifications</h1>
                </div>
              </div>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
                Track application updates, assessment assignments, recruiter actions, and system alerts in one focused workspace.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <FilterButton active={filter === 'ALL'} onClick={() => setFilter('ALL')}>All</FilterButton>
                <FilterButton active={filter === 'UNREAD'} onClick={() => setFilter('UNREAD')}>Unread</FilterButton>
                <FilterButton active={filter === 'READ'} onClick={() => setFilter('READ')}>Read</FilterButton>
              </div>
            </div>

            <div className="bg-[#edf4ff] p-6 md:p-8">
              <div className="grid grid-cols-2 gap-3">
                <StatTile label="Total" value={notifications.length} icon={Inbox} />
                <StatTile label="Unread" value={unreadCount} icon={Bell} />
              </div>
              <Button
                variant="outline"
                className="mt-5 w-full bg-white"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck size={16} />
                Mark all as read
              </Button>
            </div>
          </div>
        </section>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <section className="mt-6 rounded-[34px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Activity stream</h2>
              <p className="mt-1 text-sm text-slate-500">{filteredNotifications.length} notifications shown</p>
            </div>
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notifications..."
                className="rounded-2xl bg-slate-50 pl-11"
              />
            </div>
          </div>

          {loading ? (
            <div className="mt-6 space-y-4">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-28 animate-pulse rounded-[26px] bg-slate-100" />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                <Inbox size={24} />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-950">No notifications found</h3>
              <p className="mt-2 text-sm text-slate-500">Try a different filter or search term.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-[26px] border p-5 transition ${
                    notification.read ? 'border-slate-200 bg-white' : 'border-blue-200 bg-blue-50/70 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-4">
                      <div className={`mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                        notification.read ? 'bg-slate-100 text-slate-500' : 'bg-blue-600 text-white'
                      }`}>
                        <Bell size={20} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-slate-950">{notification.title}</p>
                          {!notification.read && <Badge variant="primary">New</Badge>}
                        </div>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{notification.message}</p>
                        <p className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-400">
                          <Clock3 size={14} />
                          {formatNotificationDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                    {!notification.read && (
                      <Button variant="outline" className="bg-white" onClick={() => handleMarkAsRead(notification.id)}>
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const FilterButton = ({ active, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
      active ? 'bg-white text-slate-950' : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
    }`}
  >
    {children}
  </button>
);

const StatTile = ({ label, value, icon: Icon }) => (
  <div className="rounded-2xl bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <Icon size={17} className="text-blue-600" />
    </div>
    <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
  </div>
);

const formatNotificationDate = (value) => {
  if (!value) return 'Just now';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default NotificationsPage;
