import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, Mail, MonitorSmartphone } from 'lucide-react';
import Button from '../../../components/common/Button';
import { useAuthContext } from '../../../context/useAuthContext';
import { notificationService } from '../../../services';

const CATEGORY_META = {
  APPLICATION_UPDATES: {
    label: 'Application updates',
    description: 'Status changes and confirmations for job applications.',
    roles: ['candidate', 'recruiter'],
  },
  MESSAGES: {
    label: 'Messages',
    description: 'New messages from candidates or recruiters. Messages themselves always arrive; this only controls the notification.',
    roles: ['candidate', 'recruiter'],
  },
  INTERVIEW_REMINDERS: {
    label: 'Interviews',
    description: 'Interview scheduling and live-session updates.',
    roles: ['candidate', 'recruiter'],
  },
  JOB_ALERTS: {
    label: 'Job alerts',
    description: 'New jobs matching your saved searches.',
    roles: ['candidate'],
  },
  RECRUITER_ACTIVITY: {
    label: 'Team activity',
    description: 'Team invitations and workspace membership changes.',
    roles: ['recruiter'],
  },
  COMPANY_VERIFICATION: {
    label: 'Company verification',
    description: 'Verification submissions and review decisions.',
    roles: ['recruiter', 'admin'],
  },
  REPORTS: {
    label: 'Reports',
    description: 'New reports filed by candidates or recruiters.',
    roles: ['admin'],
  },
  BILLING: {
    label: 'Billing',
    description: 'Subscription, payment, and credit activity for your company.',
    roles: ['recruiter'],
  },
  SYSTEM: {
    label: 'System',
    description: 'General account activity, such as saving a job.',
    roles: ['candidate', 'recruiter', 'admin'],
  },
};

const NotificationPreferencesPage = () => {
  const { userRole } = useAuthContext();
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await notificationService.getPreferences();
        setPreferences(response.data?.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load your notification preferences.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const visiblePreferences = useMemo(() => {
    return preferences.filter((pref) => {
      const meta = CATEGORY_META[pref.category];
      return meta && meta.roles.includes(userRole);
    });
  }, [preferences, userRole]);

  const toggle = (category, channel) => {
    setSuccess(false);
    setPreferences((current) => current.map((pref) => (
      pref.category === category ? { ...pref, [channel]: !pref[channel] } : pref
    )));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const response = await notificationService.updatePreferences(visiblePreferences);
      setPreferences((current) => {
        const updated = response.data?.data || [];
        const byCategory = new Map(updated.map((pref) => [pref.category, pref]));
        return current.map((pref) => byCategory.get(pref.category) || pref);
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save your notification preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] py-8 text-slate-950">
      <div className="mx-auto max-w-[760px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Bell size={20} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">Notification preferences</h1>
            <p className="mt-1 text-sm text-slate-500">
              Choose which notifications you receive in-app and by email. Messages themselves are never blocked — only their notifications.
            </p>
          </div>
        </div>

        {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {success && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 size={16} /> Preferences saved.
          </div>
        )}

        <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : visiblePreferences.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No configurable notification categories are available for your account yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    <th className="px-6 py-4">Notification type</th>
                    <th className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1"><MonitorSmartphone size={13} /> In-app</span>
                    </th>
                    <th className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1"><Mail size={13} /> Email</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePreferences.map((pref) => {
                    const meta = CATEGORY_META[pref.category];
                    return (
                      <tr key={pref.category} className="border-b border-slate-50 last:border-0">
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-800">{meta.label}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{meta.description}</p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <ToggleSwitch
                            checked={pref.inAppEnabled}
                            onChange={() => toggle(pref.category, 'inAppEnabled')}
                            label={`In-app notifications for ${meta.label}`}
                          />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <ToggleSwitch
                            checked={pref.emailEnabled}
                            onChange={() => toggle(pref.category, 'emailEnabled')}
                            label={`Email notifications for ${meta.label}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && visiblePreferences.length > 0 && (
            <div className="flex justify-end border-t border-slate-100 p-5">
              <Button onClick={handleSave} loading={saving}>Save changes</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ToggleSwitch = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

export default NotificationPreferencesPage;
