import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SquareMenu } from 'lucide-react';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Input from '../../../components/common/Input';
import NotificationIcon from '../../../components/common/NotificationIcon';
import { useAuthContext } from '../../../context/useAuthContext';
import { applicationService, authService, dashboardService, profileService } from '../../../services';
import { normalizeUserRole } from '../../../utils';

const CandidateDashboardPage = () => {
  const navigate = useNavigate();
  const { logout, isLoggedIn, userRole } = useAuthContext();
  const [dashboard, setDashboard] = useState(null);
  const [profile, setProfile] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [dashboardRes, profileRes, viewerRes] = await Promise.allSettled([
          dashboardService.getCandidateDashboard(),
          profileService.getProfile(),
          authService.getCurrentUser(),
        ]);

        if (ignore) return;

        if (viewerRes.status !== 'fulfilled') {
          throw viewerRes.reason;
        }

        const currentViewer = viewerRes.value.data?.data || null;
        setViewer(currentViewer);

        if (normalizeUserRole(currentViewer?.role || userRole) !== 'candidate') {
          logout();
          navigate('/login', { replace: true });
          return;
        }

        if (dashboardRes.status === 'fulfilled') {
          setDashboard(dashboardRes.value.data?.data || null);
        } else {
          throw dashboardRes.reason;
        }

        setProfile(profileRes.status === 'fulfilled' ? profileRes.value.data?.data || null : null);
      } catch (err) {
        console.error('Candidate dashboard load error:', err);
        if (!ignore) {
          if (err.response?.status === 401 || err.response?.status === 403) {
            logout();
            navigate('/login', { replace: true });
            return;
          }
          setError(err.response?.data?.message || 'Failed to load your dashboard.');
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

  const displayName = useMemo(() => {
    const firstName = dashboard?.firstName || viewer?.firstName || profile?.firstName || '';
    if (firstName) {
      return firstName;
    }

    const email = viewer?.email || profile?.email || '';
    return email ? email.split('@')[0] : 'User';
  }, [dashboard, viewer, profile]);

  const fullName = useMemo(() => {
    const parts = [
      viewer?.firstName || profile?.firstName || '',
      viewer?.lastName || profile?.lastName || '',
    ].filter(Boolean);

    return parts.join(' ') || dashboard?.fullName || viewer?.email || profile?.email || 'User';
  }, [dashboard, viewer, profile]);

  const initials = useMemo(() => {
    const source = fullName || viewer?.email || profile?.email || 'U';
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U';
  }, [fullName, viewer, profile]);

  const profileStrength = dashboard?.profileStrength || buildProfileStrengthFallback(profile);
  const activeApplications = dashboard?.activeApplications ?? dashboard?.appliedJobs ?? 0;
  const upcomingInterviewsCount = dashboard?.upcomingInterviews ?? 0;
  const unreadNotifications = dashboard?.unreadNotifications ?? 0;
  const pendingAssessments = dashboard?.pendingAssessments ?? 0;
  const resumeAvailable = dashboard?.resumeAvailable ?? Boolean(profile?.resumePath);
  const nextInterview = dashboard?.nextInterviewAt ? new Date(dashboard.nextInterviewAt) : null;
  const recommendedJobs = dashboard?.recommendedJobs || [];
  const recentActivities = dashboard?.recentActivities || [];
  const interviewSchedule = dashboard?.upcomingInterviewSchedule || [];
  const hasScheduledInterview = interviewSchedule.some((interview) => Boolean(interview.scheduledAt));
  const interviewSubtitle = nextInterview
    ? `Next: ${formatDateTime(nextInterview)}`
    : upcomingInterviewsCount > 0
      ? 'Recruiter moved you to interview stage'
      : 'No interviews scheduled yet';

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    navigate(search.trim() ? `/jobs?keyword=${encodeURIComponent(search.trim())}` : '/jobs');
  };

  const handleResumeAction = async (download = false) => {
    try {
      setResumeLoading(true);
      const targetUserId = profile?.id || viewer?.id;

      if (!targetUserId) {
        navigate('/profile');
        return;
      }

      const response = await applicationService.getResume(targetUserId, download);
      const fileUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));

      if (download) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = 'resume.pdf';
        link.click();
      } else {
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
      }

      setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
    } catch (err) {
      console.error('Resume action failed:', err);
      navigate('/profile');
    } finally {
      setResumeLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fb] px-6 py-10">
        <div className="mx-auto max-w-[1500px] text-sm text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-900">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-6 px-6 py-5">
          <form className="w-full max-w-md" onSubmit={handleSearchSubmit}>
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search jobs, companies..."
              className="rounded-2xl bg-slate-50"
            />
          </form>

          <div className="flex items-center gap-6">
            <div className="hidden items-center gap-3 md:flex">
              <NotificationIcon count={unreadNotifications} />
              <Link
                to="/dashboard"
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                aria-label="Dashboard menu"
              >
                <SquareMenu size={18} />
              </Link>
            </div>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{fullName}</p>
                <p className="text-xs capitalize text-slate-500">{(viewer?.role || userRole || 'user').toLowerCase()}</p>
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
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white">TH</div>
              <div>
                <p className="text-3xl font-semibold leading-none text-blue-600">TalentHub</p>
              </div>
            </div>
          </div>

          <nav className="space-y-1 px-4">
            <SidebarLink label="Dashboard" path="/dashboard" active />
            <SidebarLink label="Find Jobs" path="/jobs" />
            <SidebarLink label="Applications" path="/applications" count={activeApplications} />
            <SidebarLink label="Assessments" path="/candidate/assessments" count={pendingAssessments} />
            <SidebarLink label="Profile" path="/profile" />
          </nav>

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
              <h1 className="text-5xl font-semibold tracking-tight text-slate-900">
                Welcome back, {displayName}!
              </h1>
              <p className="mt-3 text-xl text-slate-500">
                Here&apos;s what&apos;s happening with your job search today.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/jobs">
                <Button variant="outline" className="bg-white">Browse Jobs</Button>
              </Link>
              <Link to="/profile">
                <Button>Update Profile</Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <h2 className="text-2xl font-semibold text-slate-900">Profile Strength</h2>
                <Badge>{profileStrength.level}</Badge>
              </div>
              <div className="flex items-center gap-5">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#2563eb ${profileStrength.completionPercentage}%, #e2e8f0 0)`,
                  }}
                >
                  <div className="flex h-18 w-18 items-center justify-center rounded-full bg-white text-3xl font-semibold text-slate-900">
                    {profileStrength.completionPercentage}%
                  </div>
                </div>
                <p className="max-w-xs text-base leading-7 text-slate-500">{profileStrength.message}</p>
              </div>
              <div className="mt-6">
                <Link to="/profile">
                  <Button variant="outline" className="w-full justify-between bg-slate-50">
                    <span>Update Profile</span>
                    <span>{'>'}</span>
                  </Button>
                </Link>
              </div>
            </div>

            <StatCard
              title="Active Applications"
              value={activeApplications}
              subtitle={activeApplications > 0 ? `${activeApplications} applications in progress` : 'No active applications yet'}
              accent="blue"
            />

            <StatCard
              title="Upcoming Interviews"
              value={upcomingInterviewsCount}
              subtitle={interviewSubtitle}
              accent="green"
            />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-4xl font-semibold text-slate-900">Recommended for You</h2>
                <Link to="/jobs" className="text-base font-medium text-blue-600 hover:text-blue-700">View All Jobs</Link>
              </div>
              {recommendedJobs.length === 0 ? (
                <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-slate-500 shadow-sm">
                  No recommendations available yet. Explore jobs and complete your profile to improve suggestions.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {recommendedJobs.map((job) => (
                    <RecommendedJobCard key={job.id} job={job} />
                  ))}
                </div>
              )}

              <div className="mt-8 rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-3xl font-semibold text-slate-900">Interview Schedule</h2>
                    <p className="mt-1 text-base text-slate-500">Don&apos;t miss your upcoming opportunities.</p>
                  </div>
                  <Button variant="outline">Sync Calendar</Button>
                </div>

                {interviewSchedule.length === 0 ? (
                  <div className="px-6 py-10 text-slate-500">No upcoming interviews scheduled.</div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-[240px_minmax(0,1fr)]">
                    <div className="border-b border-slate-200 px-6 py-8 xl:border-b-0 xl:border-r">
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
                        {hasScheduledInterview ? formatMonthYear(interviewSchedule[0].scheduledAt) : 'Interview stage'}
                      </p>
                      <p className="mt-3 text-5xl font-semibold text-slate-900">
                        {hasScheduledInterview ? new Date(interviewSchedule[0].scheduledAt).getDate() : upcomingInterviewsCount}
                      </p>
                      <p className="mt-2 text-lg text-slate-500">
                        {hasScheduledInterview
                          ? new Date(interviewSchedule[0].scheduledAt).toLocaleDateString(undefined, { weekday: 'long' })
                          : 'Awaiting schedule'}
                      </p>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {interviewSchedule.map((interview) => (
                        <div key={interview.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-4">
                            <div className="rounded-2xl bg-blue-50 px-3 py-2 text-center text-sm font-semibold text-blue-700">
                              {interview.scheduledAt
                                ? new Date(interview.scheduledAt).toLocaleDateString(undefined, { month: 'short' }).toUpperCase()
                                : 'NEW'}
                              <div className="text-2xl">{interview.scheduledAt ? new Date(interview.scheduledAt).getDate() : '!'}</div>
                            </div>
                            <div>
                              <p className="text-xl font-semibold text-slate-900">{interview.jobTitle}</p>
                              <p className="mt-1 text-sm text-slate-500">
                                {interview.recruiterName || viewer?.email || 'Recruiter'} {' • '} {formatTime(interview.scheduledAt)}
                              </p>
                            </div>
                          </div>
                          <Badge>{interview.scheduledAt ? formatLabel(interview.type) : 'Pending Schedule'}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-blue-100 bg-blue-50 p-6 shadow-sm">
                <h3 className="text-3xl font-semibold text-slate-900">Quick Actions</h3>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <ActionTile
                    label={resumeAvailable ? 'View Resume' : 'Upload Resume'}
                    to={resumeAvailable ? undefined : '/profile'}
                    onClick={resumeAvailable ? () => handleResumeAction(false) : undefined}
                    loading={resumeLoading}
                  />
                  <ActionTile label="Job Search" to="/jobs" />
                  <ActionTile label={pendingAssessments > 0 ? `Take Test (${pendingAssessments})` : 'Assessments'} to="/candidate/assessments" />
                  <ActionTile label={unreadNotifications > 0 ? `Alerts (${unreadNotifications})` : 'Alerts'} to="/notifications" />
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-3xl font-semibold text-slate-900">Recent Activity</h3>
                  <Link to="/notifications" className="text-sm text-slate-500 hover:text-slate-700">View all</Link>
                </div>
                {recentActivities.length === 0 ? (
                  <p className="text-slate-500">No recent activity available yet.</p>
                ) : (
                  <div className="space-y-5">
                    {recentActivities.map((item, index) => (
                      <div key={`${item.type}-${index}`} className="flex gap-4">
                        <div className="mt-1 h-3 w-3 rounded-full bg-blue-500" />
                        <div>
                          <p className="text-lg font-medium text-slate-900">{item.title}</p>
                          <p className="mt-1 text-sm text-slate-500">{item.subtitle}</p>
                          <p className="mt-2 text-sm text-slate-400">{formatRelative(item.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-[28px] bg-gradient-to-br from-blue-600 to-blue-500 p-6 text-white shadow-[0_18px_40px_rgba(37,99,235,0.24)]">
                <h3 className="text-3xl font-semibold">Profile Visibility</h3>
                <p className="mt-3 text-blue-50">
                  {profileStrength.completionPercentage >= 80
                    ? 'Your profile is in strong shape. Keep applications moving.'
                    : 'Complete the remaining profile sections to improve discoverability.'}
                </p>
                <Link to="/profile" className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 text-base font-semibold text-blue-700">
                  Go to Profile
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const SidebarLink = ({ label, path, active = false, count }) => {
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
      {typeof count === 'number' && count > 0 && (
        <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
          {count}
        </span>
      )}
    </Link>
  );
};

const StatCard = ({ title, value, subtitle, accent }) => {
  const accentClass = accent === 'green' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600';
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">{title}</p>
          <p className="mt-3 text-5xl font-semibold text-slate-900">{value}</p>
          <p className="mt-2 text-base text-slate-500">{subtitle}</p>
        </div>
        <div className={`rounded-2xl p-4 text-2xl ${accentClass}`}>{accent === 'green' ? 'I' : 'A'}</div>
      </div>
    </div>
  );
};

const RecommendedJobCard = ({ job }) => {
  const skills = job.skills
    ? job.skills.split(',').map((skill) => skill.trim()).filter(Boolean).slice(0, 3)
    : [];

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          {getInitials(job.companyName)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-2xl font-semibold text-slate-900">{job.title}</h3>
          <p className="mt-1 text-lg text-slate-500">{job.companyName}</p>
        </div>
      </div>
      {skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span key={skill} className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {skill}
            </span>
          ))}
        </div>
      )}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500">
        <span>{job.location || 'Remote'}</span>
        <span>{formatSalary(job.minSalary, job.maxSalary)}</span>
      </div>
    </div>
  );
};

const ActionTile = ({ label, to, onClick, loading = false }) => {
  if (to) {
    return (
      <Link to={to} className="rounded-[22px] border border-slate-200 bg-white px-4 py-8 text-center text-lg font-medium text-slate-700 shadow-sm hover:border-blue-200 hover:text-blue-700">
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="rounded-[22px] border border-slate-200 bg-white px-4 py-8 text-center text-lg font-medium text-slate-700 shadow-sm hover:border-blue-200 hover:text-blue-700 disabled:opacity-60"
    >
      {loading ? 'Loading...' : label}
    </button>
  );
};

const formatLabel = (value) => {
  if (!value) return '';
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDateTime = (date) => {
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatTime = (dateString) => {
  if (!dateString) {
    return 'Interview pending schedule';
  }

  return new Date(dateString).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatMonthYear = (dateString) => {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
};

const formatRelative = (dateString) => {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) {
    return 'Yesterday';
  }
  return `${diffDays} days ago`;
};

const getInitials = (value = '') => {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'JB';
};

const formatSalary = (min, max) => {
  if (min && max) {
    return `$${Math.round(min / 1000)}k - $${Math.round(max / 1000)}k`;
  }
  if (min) {
    return `$${Math.round(min / 1000)}k+`;
  }
  if (max) {
    return `Up to $${Math.round(max / 1000)}k`;
  }
  return 'Not disclosed';
};

const buildProfileStrengthFallback = (profile) => {
  const fields = [
    profile?.firstName,
    profile?.lastName,
    profile?.phone,
    profile?.headline,
    profile?.bio,
    profile?.location,
    profile?.resumePath,
  ];
  const completed = fields.filter((value) => value && String(value).trim()).length;
  const completionPercentage = Math.round((completed / fields.length) * 100);

  let level = 'Starter';
  if (completionPercentage >= 80) {
    level = 'Advanced';
  } else if (completionPercentage >= 50) {
    level = 'Intermediate';
  }

  let message = 'Add more profile details to improve recommendations and recruiter visibility.';
  if (completionPercentage >= 90) {
    message = 'Your profile looks strong and recruiter-ready.';
  } else if (completionPercentage >= 60) {
    message = 'Almost there. Complete a few more details to strengthen applications.';
  }

  return {
    completionPercentage,
    level,
    message,
  };
};

export default CandidateDashboardPage;
