import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SquareMenu } from 'lucide-react';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Input from '../../../components/common/Input';
import NotificationIcon from '../../../components/common/NotificationIcon';
import { useAuthContext } from '../../../context/useAuthContext';
import { authService, dashboardService, recruiterService } from '../../../services';

const RecruiterDashboardPage = () => {
  const navigate = useNavigate();
  const { logout, isLoggedIn, userRole } = useAuthContext();
  const [dashboard, setDashboard] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [company, setCompany] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const viewerRes = await authService.getCurrentUser();
        const currentViewer = viewerRes.data?.data || null;

        if (ignore) return;

        setViewer(currentViewer);

        if ((currentViewer?.role || userRole)?.toLowerCase() !== 'recruiter') {
          logout();
          navigate('/login', { replace: true });
          return;
        }

        const [dashboardRes, companyRes] = await Promise.allSettled([
          dashboardService.getRecruiterDashboard(),
          recruiterService.getCompanyProfile(),
        ]);

        if (ignore) return;

        if (dashboardRes.status === 'fulfilled') {
          setDashboard(dashboardRes.value.data?.data || null);
        } else {
          throw dashboardRes.reason;
        }

        setCompany(companyRes.status === 'fulfilled' ? companyRes.value.data?.data || null : null);
      } catch (err) {
        console.error('Recruiter dashboard load error:', err);
        if (!ignore) {
          if (err.response?.status === 401 || err.response?.status === 403) {
            logout();
            navigate('/login', { replace: true });
            return;
          }
          setError(err.response?.data?.message || 'Failed to load recruiter dashboard.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, [logout, navigate, userRole]);

  const displayName = useMemo(() => dashboard?.firstName || viewer?.firstName || 'Recruiter', [dashboard, viewer]);
  const fullName = useMemo(() => {
    const parts = [viewer?.firstName || '', viewer?.lastName || ''].filter(Boolean);
    return parts.join(' ') || dashboard?.fullName || viewer?.email || 'Recruiter User';
  }, [dashboard, viewer]);

  const initials = useMemo(() => {
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'RU';
  }, [fullName]);
  const unreadNotifications = dashboard?.unreadNotifications ?? 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pipeline = [
    { label: 'Applied', value: dashboard?.totalApplicants ?? 0 },
    { label: 'Screened', value: dashboard?.shortlistedCount ?? 0 },
    { label: 'Interview', value: dashboard?.interviewCount ?? 0 },
    { label: 'Hired', value: dashboard?.hiredCount ?? 0 },
  ];
  const maxPipelineValue = Math.max(...pipeline.map((item) => item.value), 1);

  const searchQuery = search.trim().toLowerCase();
  const filteredRecentApplicants = useMemo(() => {
    const applicants = dashboard?.recentApplicants || [];
    if (!searchQuery) return applicants;

    return applicants.filter((applicant) =>
      [applicant.userName, applicant.jobTitle, applicant.userEmail]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchQuery))
    );
  }, [dashboard, searchQuery]);

  const filteredActiveJobs = useMemo(() => {
    const jobs = dashboard?.activeJobPerformance || [];
    if (!searchQuery) return jobs;

    return jobs.filter((job) =>
      [job.title, job.category, job.status, String(job.applicants ?? '')]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchQuery))
    );
  }, [dashboard, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fb] px-6 py-10">
        <div className="mx-auto max-w-[1500px] text-sm text-slate-500">Loading recruiter dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-900">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-6 px-6 py-5">
          <form className="w-full max-w-md" onSubmit={(event) => event.preventDefault()}>
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search candidates, jobs, status..."
              className="rounded-2xl bg-slate-50"
            />
          </form>
          <div className="flex items-center gap-6">
            <div className="hidden items-center gap-3 md:flex">
              <NotificationIcon count={unreadNotifications} />
              <Link
                to="/recruiter/dashboard"
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                aria-label="Dashboard menu"
              >
                <SquareMenu size={18} />
              </Link>
            </div>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{fullName}</p>
                <p className="text-xs capitalize text-slate-500">{(viewer?.role || userRole || 'recruiter').toLowerCase()}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                {initials}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-81px)] max-w-[1500px] grid-cols-1 xl:grid-cols-[255px_minmax(0,1fr)]">
        <aside className="border-r border-slate-200 bg-white">
          <div className="px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">◇</div>
              <div>
                <p className="text-3xl font-semibold leading-none text-blue-600">TalentHub</p>
              </div>
            </div>
          </div>

          <nav className="space-y-1 px-4">
            <SidebarLink label="Dashboard" path="/recruiter/dashboard" active />
            <SidebarLink label="Manage Jobs" path="/recruiter/manage-jobs" />
            <SidebarLink label="Applicants" path="/recruiter/applicants" />
            <SidebarLink label="Assessments" path="/recruiter/assessments" />
            <SidebarLink label="Analytics" path="/recruiter/analytics" />
          </nav>

          <div className="px-4 pt-8">
            <Link to="/recruiter/post-job">
              <Button className="w-full">Post New Job</Button>
            </Link>
          </div>

          <div className="mt-auto px-6 pb-8 pt-16 text-sm text-slate-500">
            <div className="space-y-4 border-t border-slate-200 pt-6">
              <p>Settings</p>
              {isLoggedIn ? (
                <button type="button" onClick={handleLogout} className="text-rose-500 hover:text-rose-600">
                  Logout
                </button>
              ) : (
                <Link to="/login" className="text-blue-600 hover:text-blue-700">Login</Link>
              )}
            </div>
          </div>
        </aside>

        <section className="bg-[#fbfbfd] px-6 py-8">
          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h1 className="text-5xl font-semibold tracking-tight text-slate-900">Recruiter Dashboard</h1>
              <p className="mt-3 text-xl text-slate-500">
                Welcome back, {displayName}. You have {dashboard?.pendingReviews ?? 0} reviews pending for today.
              </p>
              {searchQuery && (
                <p className="mt-3 text-sm font-medium text-blue-600">
                  Showing results for "{search.trim()}"
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/recruiter/analytics">
                <Button variant="outline" className="bg-white">Reports</Button>
              </Link>
              <Link to="/recruiter/post-job">
                <Button>New Job Posting</Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
            <MetricCard title="Open Positions" value={dashboard?.openPositions ?? 0} subtitle={company?.name || 'Company workspace'} />
            <MetricCard title="Total Applicants" value={dashboard?.totalApplicants ?? 0} subtitle="Across all active jobs" />
            <MetricCard title="Time to Hire" value={`${dashboard?.averageTimeToHireDays ?? 0} Days`} subtitle="Average hire cycle" />
            <MetricCard title="Offer Accept Rate" value={`${Math.round(dashboard?.offerAcceptRate ?? 0)}%`} subtitle="Accepted vs total applicants" />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-4xl font-semibold text-slate-900">Hiring Pipeline Funnel</h2>
              <p className="mt-2 text-base text-slate-500">
                Conversion flow across your current recruitment stages.
              </p>
              <div className="mt-8 space-y-6">
                {pipeline.map((item) => (
                  <div key={item.label} className="grid grid-cols-[110px_minmax(0,1fr)_60px] items-center gap-4">
                    <span className="text-base text-slate-600">{item.label}</span>
                    <div className="h-9 rounded-full bg-slate-100">
                      <div
                        className="h-9 rounded-full bg-emerald-500"
                        style={{ width: `${(item.value / maxPipelineValue) * 100}%` }}
                      />
                    </div>
                    <span className="text-right text-base font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-blue-100 bg-blue-50 p-6 shadow-sm">
                <h3 className="text-3xl font-semibold text-slate-900">Quick Actions</h3>
                <div className="mt-6 space-y-4">
                  <Link to="/recruiter/post-job" className="block rounded-2xl bg-blue-600 px-5 py-4 text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)]">
                    <p className="text-lg font-semibold">Post New Job</p>
                    <p className="mt-1 text-sm text-blue-100">Reach top talent today</p>
                  </Link>
                  <Link to="/recruiter/assessments/create" className="block rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-900">
                    <p className="text-lg font-semibold">Create Assessment</p>
                    <p className="mt-1 text-sm text-slate-500">Screen for technical skills</p>
                  </Link>
                  <Link to="/recruiter/assessments" className="block rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-900">
                    <p className="text-lg font-semibold">Manage Assessments</p>
                    <p className="mt-1 text-sm text-slate-500">Edit, publish, reuse, or delete tests</p>
                  </Link>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-3xl font-semibold text-slate-900">Recent Applicants</h3>
                  <Badge>Live</Badge>
                </div>
                {filteredRecentApplicants.length === 0 ? (
                  <p className="text-slate-500">
                    {searchQuery ? 'No applicants match your search.' : 'No applicants yet.'}
                  </p>
                ) : (
                  <div className="space-y-5">
                    {filteredRecentApplicants.map((applicant) => (
                      <div key={applicant.id} className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                            {getInitials(applicant.userName)}
                          </div>
                          <div>
                            <p className="text-xl font-medium text-slate-900">{applicant.userName}</p>
                            <p className="mt-1 text-sm text-slate-500">{applicant.jobTitle}</p>
                          </div>
                        </div>
                        <p className="text-sm text-slate-400">{formatRelative(applicant.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
                <Link to="/recruiter/applicants" className="mt-6 block text-center text-base font-medium text-blue-600 hover:text-blue-700">
                  View All Candidates
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-semibold text-slate-900">Active Job Performance</h2>
                  <p className="mt-2 text-base text-slate-500">Live tracking of your most active recruitment roles.</p>
                </div>
                <Link to="/recruiter/manage-jobs" className="text-base font-medium text-blue-600 hover:text-blue-700">View All Jobs</Link>
              </div>

              {filteredActiveJobs.length === 0 ? (
                <p className="text-slate-500">
                  {searchQuery ? 'No active jobs match your search.' : 'No job performance data available yet.'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                        <th className="pb-4 font-medium">Role Name</th>
                        <th className="pb-4 font-medium">Category</th>
                        <th className="pb-4 font-medium">Applicants</th>
                        <th className="pb-4 font-medium">Status</th>
                        <th className="pb-4 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredActiveJobs.map((job) => (
                        <tr key={job.jobId} className="border-b border-slate-100">
                          <td className="py-5 text-base font-medium text-slate-900">{job.title}</td>
                          <td className="py-5 text-base text-slate-500">{formatLabel(job.category)}</td>
                          <td className="py-5">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                              {job.applicants}
                            </span>
                          </td>
                          <td className="py-5">
                            <StatusBadge status={job.status} />
                          </td>
                          <td className="py-5 text-slate-500">•••</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">↗</div>
                <p className="text-base leading-7 text-slate-600">
                  Your current application-to-hire ratio is{' '}
                  <span className="font-semibold text-slate-900">
                    {dashboard?.totalApplicants ? `${Math.round((dashboard?.hiredCount ?? 0) * 100 / dashboard.totalApplicants)}%` : '0%'}
                  </span>
                  {' '}based on current recruiter data.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const SidebarLink = ({ label, path, active = false }) => {
  return (
    <Link
      to={path}
      className={`flex items-center justify-between rounded-xl px-4 py-3 text-lg transition ${
        active
          ? 'bg-blue-600 font-semibold text-white shadow-[0_12px_26px_rgba(37,99,235,0.24)]'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <span>{label}</span>
    </Link>
  );
};

const MetricCard = ({ title, value, subtitle }) => {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-5xl font-semibold text-slate-900">{value}</p>
          <p className="mt-3 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-4 text-2xl text-blue-600">□</div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const normalized = (status || '').toUpperCase();
  let variant = 'default';
  if (normalized === 'ACTIVE') variant = 'success';
  if (normalized === 'URGENT') variant = 'danger';
  if (normalized === 'ON_HOLD') variant = 'warning';
  return <Badge variant={variant}>{formatLabel(status)}</Badge>;
};

const formatLabel = (value) => {
  if (!value) return '';
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatRelative = (dateString) => {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
};

const getInitials = (value = '') => {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AP';
};

export default RecruiterDashboardPage;
