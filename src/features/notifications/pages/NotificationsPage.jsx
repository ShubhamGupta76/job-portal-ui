import React, { useEffect, useState } from 'react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { notificationService } from '../../../services';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
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
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-10">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="mt-2 text-gray-600">Stay updated on applications, bookmarks, and recruiter actions.</p>
          </div>
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <Card className="p-6">
          {loading ? (
            <p className="text-sm text-gray-500">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-gray-500">No notifications available.</p>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-xl border p-4 ${
                    notification.read ? 'border-gray-200 bg-white' : 'border-purple-200 bg-purple-50'
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{notification.title}</p>
                      <p className="mt-2 text-sm text-gray-600">{notification.message}</p>
                      <p className="mt-2 text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <Button variant="outline" onClick={() => handleMarkAsRead(notification.id)}>
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default NotificationsPage;
