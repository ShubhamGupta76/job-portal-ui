import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Smartphone, MapPin, Clock3, LogOut, CheckCircle2 } from 'lucide-react';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import { authService } from '../../../services';
import { useAuthContext } from '../../../context/useAuthContext';

const SecuritySettingsPage = () => {
  const { logout } = useAuthContext();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [revokingId, setRevokingId] = useState(null);
  const [busyAction, setBusyAction] = useState('');

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authService.getSessions();
      setSessions(response.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load your active sessions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRevoke = async (sessionId) => {
    setRevokingId(sessionId);
    setError('');
    setSuccess('');
    try {
      await authService.revokeSession(sessionId);
      setSessions((current) => current.filter((session) => session.id !== sessionId));
      setSuccess('Session revoked.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to revoke that session.');
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeOthers = async () => {
    setBusyAction('others');
    setError('');
    setSuccess('');
    try {
      await authService.revokeOtherSessions();
      setSuccess('You have been logged out of all other devices.');
      await loadSessions();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to log out of other devices.');
    } finally {
      setBusyAction('');
    }
  };

  const handleRevokeAll = async () => {
    setBusyAction('all');
    setError('');
    try {
      await authService.revokeAllSessions();
      logout();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to log out of all devices.');
      setBusyAction('');
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] py-8 text-slate-950">
      <div className="mx-auto max-w-[760px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">Security</h1>
            <p className="mt-1 text-sm text-slate-500">
              Review the devices currently signed in to your account and sign out anywhere you don't recognize.
            </p>
          </div>
        </div>

        {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {success && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 size={16} /> {success}
          </div>
        )}

        <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Active sessions</h2>
              <p className="mt-1 text-sm text-slate-500">{sessions.length} device{sessions.length === 1 ? '' : 's'} signed in</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleRevokeOthers}
                loading={busyAction === 'others'}
                disabled={loading || sessions.length < 2}
              >
                Log out other devices
              </Button>
              <Button
                variant="danger"
                onClick={handleRevokeAll}
                loading={busyAction === 'all'}
                disabled={loading}
              >
                <LogOut size={16} /> Log out everywhere
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No active sessions found.</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {sessions.map((session) => (
                <li key={session.id} className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-4">
                    <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                      <Smartphone size={18} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-800">{session.deviceLabel || 'Unknown device'}</p>
                        {session.current && <Badge variant="primary">This device</Badge>}
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin size={12} /> {session.ipAddress || 'Unknown location'}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock3 size={12} /> Last active {formatDate(session.lastUsedAt)}
                      </p>
                    </div>
                  </div>
                  {!session.current && (
                    <Button
                      variant="outline"
                      className="self-start sm:self-center"
                      loading={revokingId === session.id}
                      onClick={() => handleRevoke(session.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

const formatDate = (value) => {
  if (!value) return 'just now';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default SecuritySettingsPage;
