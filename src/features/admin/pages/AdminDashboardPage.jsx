import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  BriefcaseBusiness,
  CalendarClock,
  GraduationCap,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import { adminService } from '../../../services/adminService';
import { formatDate } from '../../../utils';

const emptyPage = { content: [], totalElements: 0, totalPages: 0, number: 0 };

const getPageData = (response) => response?.data || emptyPage;
const getListData = (response) => (Array.isArray(response?.data) ? response.data : []);
const getApiData = (response, fallback) => response?.data?.data ?? fallback;

const AdminDashboardPage = () => {
  const [actions, setActions] = useState([]);
  const [selectedAction, setSelectedAction] = useState('');
  const [auditPage, setAuditPage] = useState(emptyPage);
  const [overdueInterviews, setOverdueInterviews] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [managedUsers, setManagedUsers] = useState([]);
  const [managedRole, setManagedRole] = useState('RECRUITER');
  const [userActionLoading, setUserActionLoading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadAdminData = useCallback(async (preferredAction = '') => {
    setError('');
    const actionsResult = await adminService.getActions();
    const nextActions = getListData(actionsResult);
    const actionToLoad = preferredAction || nextActions[0] || '';

    setActions(nextActions);
    setSelectedAction(actionToLoad);

    const [auditResult, overdueResult, userStatsResult, managedUsersResult] = await Promise.allSettled([
      actionToLoad ? adminService.getAuditLogsByAction(actionToLoad) : Promise.resolve({ data: emptyPage }),
      adminService.getOverdueInterviews(),
      adminService.getUserStats(),
      adminService.getUsers(managedRole),
    ]);

    if (auditResult.status === 'fulfilled') {
      setAuditPage(getPageData(auditResult.value));
    }

    if (overdueResult.status === 'fulfilled') {
      setOverdueInterviews(getListData(overdueResult.value));
    }

    if (userStatsResult.status === 'fulfilled') {
      setUserStats(getApiData(userStatsResult.value, null));
    }

    if (managedUsersResult.status === 'fulfilled') {
      setManagedUsers(getApiData(managedUsersResult.value, []));
    }
  }, [managedRole]);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        await loadAdminData();
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load admin dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [loadAdminData]);

  const handleActionChange = async (event) => {
    const action = event.target.value;
    setSelectedAction(action);
    setRefreshing(true);
    try {
      const response = await adminService.getAuditLogsByAction(action);
      setAuditPage(getPageData(response));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load audit logs for this action.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAdminData(selectedAction);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to refresh admin dashboard.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleManagedRoleChange = async (role) => {
    setManagedRole(role);
    setRefreshing(true);
    try {
      const response = await adminService.getUsers(role);
      setManagedUsers(getApiData(response, []));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load users.');
    } finally {
      setRefreshing(false);
    }
  };

  const refreshManagedUsers = async () => {
    const [statsResponse, usersResponse] = await Promise.all([
      adminService.getUserStats(),
      adminService.getUsers(managedRole),
    ]);
    setUserStats(getApiData(statsResponse, null));
    setManagedUsers(getApiData(usersResponse, []));
  };

  const handleBlockToggle = async (user) => {
    setUserActionLoading(`block-${user.id}`);
    try {
      if (user.blocked) {
        await adminService.unblockUser(user.id);
      } else {
        await adminService.blockUser(user.id);
      }
      await refreshManagedUsers();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update user block status.');
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(`Delete ${user.email}? This will block access and soft-delete related records.`);
    if (!confirmed) return;

    setUserActionLoading(`delete-${user.id}`);
    try {
      await adminService.deleteUser(user.id);
      await refreshManagedUsers();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete user account.');
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    navigate('/login', { replace: true });
  };

  const metrics = [
    {
      label: 'Registered students',
      value: userStats?.registeredStudents ?? 0,
      detail: 'Candidate accounts active in the portal',
      icon: GraduationCap,
    },
    {
      label: 'Active recruiters',
      value: userStats?.activeRecruiters ?? 0,
      detail: 'Recruiter accounts allowed to post jobs',
      icon: BriefcaseBusiness,
    },
    {
      label: 'Blocked accounts',
      value: (userStats?.blockedStudents ?? 0) + (userStats?.blockedRecruiters ?? 0),
      detail: `${userStats?.blockedRecruiters ?? 0} recruiters, ${userStats?.blockedStudents ?? 0} students`,
      icon: Ban,
    },
    {
      label: 'Overdue interviews',
      value: overdueInterviews.length,
      detail: overdueInterviews.length ? 'Needs admin attention' : 'No overdue interviews',
      icon: CalendarClock,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="rounded-[28px] bg-slate-950 px-5 py-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:px-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                <ShieldCheck size={26} aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Admin Console</p>
                <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">Platform control center</h1>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={handleRefresh} loading={refreshing}>
                <RefreshCw size={16} aria-hidden="true" />
                Refresh
              </Button>
              <Button type="button" variant="danger" onClick={handleLogout}>
                <LogOut size={16} aria-hidden="true" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle size={18} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">{loading ? '-' : metric.value}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  {React.createElement(metric.icon, { size: 21, 'aria-hidden': 'true' })}
                </div>
              </div>
              <p className="mt-4 min-h-10 text-sm leading-5 text-slate-500">{metric.detail}</p>
            </Card>
          ))}
        </section>

        <Card className="overflow-hidden p-0">
          <div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Manage recruiters and students</h2>
              <p className="mt-1 text-sm text-slate-500">Block email access or delete accounts that violate platform rules.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
              {[
                ['RECRUITER', 'Recruiters'],
                ['USER', 'Students'],
              ].map(([role, label]) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleManagedRoleChange(role)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    managedRole === role ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-950'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {['User', 'Role', managedRole === 'RECRUITER' ? 'Jobs' : 'Applications', 'Status', 'Joined', 'Actions'].map((heading) => (
                    <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading || refreshing ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                      Loading users...
                    </td>
                  </tr>
                ) : managedUsers.length ? (
                  managedUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="min-w-72 px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-sm font-semibold text-blue-700">
                            {getInitials(user)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-950">{getUserName(user)}</p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-700">{formatRole(user.role)}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {managedRole === 'RECRUITER' ? `${user.jobsPosted || 0} jobs` : `${user.applicationsCount || 0} applications`}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          user.blocked ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {user.blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{formatDate(user.createdAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant={user.blocked ? 'success' : 'outline'}
                            size="sm"
                            loading={userActionLoading === `block-${user.id}`}
                            onClick={() => handleBlockToggle(user)}
                            className={user.blocked ? '' : 'bg-white text-red-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700'}
                          >
                            {user.blocked ? <UserCheck size={15} /> : <Ban size={15} />}
                            {user.blocked ? 'Unblock' : 'Block'}
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            loading={userActionLoading === `delete-${user.id}`}
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash2 size={15} />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <Card className="overflow-hidden p-0">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Audit activity</h2>
                <p className="mt-1 text-sm text-slate-500">Admin-only logs grouped by action.</p>
              </div>
              <select
                value={selectedAction}
                onChange={handleActionChange}
                disabled={!actions.length || refreshing}
                className="h-11 min-w-52 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {actions.length ? (
                  actions.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))
                ) : (
                  <option value="">No actions found</option>
                )}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {['Time', 'User', 'Entity', 'Description', 'IP'].map((heading) => (
                      <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading || refreshing ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">
                        Loading audit data...
                      </td>
                    </tr>
                  ) : auditPage.content?.length ? (
                    auditPage.content.map((log) => (
                      <tr key={log.id}>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{formatDate(log.timestamp)}</td>
                        <td className="px-5 py-4 text-sm font-medium text-slate-900">{log.userEmail || `User #${log.userId || '-'}`}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                          {log.entityType || '-'} {log.entityId ? `#${log.entityId}` : ''}
                        </td>
                        <td className="min-w-80 px-5 py-4 text-sm text-slate-600">{log.description || log.action || '-'}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{log.ipAddress || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">
                        No audit logs found for this action.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Overdue interviews</h2>
                <p className="mt-1 text-sm text-slate-500">Interviews exposed by the admin backend endpoint.</p>
              </div>
              <CalendarClock className="text-slate-500" size={22} aria-hidden="true" />
            </div>

            <div className="mt-5 space-y-3">
              {loading ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">Loading interviews...</p>
              ) : overdueInterviews.length ? (
                overdueInterviews.slice(0, 8).map((interview) => (
                  <div key={interview.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{interview.jobTitle || 'Untitled interview'}</p>
                        <p className="mt-1 text-sm text-slate-500">{interview.candidateName || interview.candidateEmail || 'Candidate not available'}</p>
                      </div>
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                        {interview.status || 'Overdue'}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-500">{formatDate(interview.scheduledAt)}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">No overdue interviews right now.</p>
              )}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

const getUserName = (user) => {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.email || 'User';
};

const getInitials = (user) => {
  return getUserName(user)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
};

const formatRole = (role) => {
  if (role === 'USER') return 'Student';
  if (role === 'RECRUITER') return 'Recruiter';
  return role || 'User';
};

export default AdminDashboardPage;
