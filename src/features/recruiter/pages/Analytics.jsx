import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SquareMenu } from 'lucide-react';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Input from '../../../components/common/Input';
import NotificationIcon from '../../../components/common/NotificationIcon';
import { useAuthContext } from '../../../context/useAuthContext';
import { authService, dashboardService, recruiterService } from '../../../services';

const rangeOptions = [
  { key: '7D', label: '7D', days: 7 },
  { key: '30D', label: '30D', days: 30 },
  { key: '90D', label: '90D', days: 90 },
  { key: 'ALL', label: 'All', days: null },
];

const Analytics = () => {
  const navigate = useNavigate();
  const { logout, isLoggedIn, userRole } = useAuthContext();
  const [viewer, setViewer] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState('90D');
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

        const [dashboardRes, jobsRes, applicationsRes] = await Promise.allSettled([
          dashboardService.getRecruiterDashboard(),
          recruiterService.getJobs(),
          recruiterService.getAllApplications({ page: 0, size: 500 }),
        ]);

        if (ignore) return;

        if (dashboardRes.status === 'fulfilled') {
          setDashboard(dashboardRes.value.data?.data || null);
        }

        if (jobsRes.status === 'fulfilled') {
          setJobs(jobsRes.value.data?.data || []);
        }

        if (applicationsRes.status === 'fulfilled') {
          setApplications(applicationsRes.value.data?.data?.content || []);
        }

        if (dashboardRes.status !== 'fulfilled' && jobsRes.status !== 'fulfilled' && applicationsRes.status !== 'fulfilled') {
          throw dashboardRes.reason || jobsRes.reason || applicationsRes.reason;
        }
      } catch (err) {
        console.error('Analytics load error:', err);
        if (ignore) return;

        if (err.response?.status === 401 || err.response?.status === 403) {
          logout();
          navigate('/login', { replace: true });
          return;
        }

        setError(err.response?.data?.message || 'Unable to load analytics.');
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

  const fullName = useMemo(() => {
    const parts = [viewer?.firstName || '', viewer?.lastName || ''].filter(Boolean);
    return parts.join(' ') || viewer?.email || 'Recruiter User';
  }, [viewer]);

  const initials = useMemo(() => {
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'RU';
  }, [fullName]);

  const cutoffDate = useMemo(() => {
    const selectedRange = rangeOptions.find((option) => option.key === range);
    if (!selectedRange?.days) return null;
    const date = new Date();
    date.setDate(date.getDate() - selectedRange.days);
    return date;
  }, [range]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch = !search.trim() || [job.title, job.location, job.jobType, job.experienceLevel]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search.trim().toLowerCase()));

      const jobDate = job.createdAt ? new Date(job.createdAt) : null;
      const matchesRange = !cutoffDate || !jobDate || jobDate >= cutoffDate;
      return matchesSearch && matchesRange;
    });
  }, [jobs, search, cutoffDate]);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const matchesSearch = !search.trim() || [
        application.userName,
        application.userEmail,
        application.jobTitle,
        application.userHeadline,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search.trim().toLowerCase()));

      const applicationDate = application.createdAt ? new Date(application.createdAt) : null;
      const matchesRange = !cutoffDate || !applicationDate || applicationDate >= cutoffDate;
      return matchesSearch && matchesRange;
    });
  }, [applications, search, cutoffDate]);

  const activeJobs = filteredJobs.filter((job) => (job.status || 'ACTIVE').toUpperCase() !== 'CLOSED');
  const totalApplicants = filteredApplications.length;
  const avgTimeToHire = dashboard?.averageTimeToHireDays ?? 0;
  const assessmentScores = filteredApplications.filter((application) => application.assessmentScore != null);
  const candidateQuality = assessmentScores.length
    ? (assessmentScores.reduce((sum, application) => sum + application.assessmentScore, 0) / assessmentScores.length) / 20
    : 0;

  const trendData = useMemo(() => {
    const monthKeys = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString('en-US', { month: 'short' }),
      };
    });

    return monthKeys.map(({ key, label }) => {
      const applicationsCount = filteredApplications.filter((application) => makeMonthKey(application.createdAt) === key).length;
      const interviewsCount = filteredApplications.filter((application) => application.status === 'INTERVIEW' && makeMonthKey(application.updatedAt) === key).length;
      const hiredCount = filteredApplications.filter((application) => application.status === 'HIRED' && makeMonthKey(application.updatedAt) === key).length;
      return {
        label,
        applications: applicationsCount,
        interviews: interviewsCount,
        hired: hiredCount,
      };
    });
  }, [filteredApplications]);

  const trendMax = Math.max(
    1,
    ...trendData.flatMap((point) => [point.applications, point.interviews, point.hired])
  );

  const statusBreakdown = useMemo(() => {
    const counts = filteredApplications.reduce((acc, application) => {
      const key = (application.status || 'APPLIED').toUpperCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([status, count]) => ({ status, count }))
      .sort((first, second) => second.count - first.count);
  }, [filteredApplications]);

  const categoryPerformance = useMemo(() => {
    const grouped = activeJobs.reduce((acc, job) => {
      const key = formatLabel(job.experienceLevel || job.jobType || 'General');
      if (!acc[key]) {
        acc[key] = { label: key, applications: 0, interviews: 0 };
      }
      acc[key].applications += Number(job.applicationCount || 0);
      acc[key].interviews += filteredApplications.filter(
        (application) => application.jobId === job.id && application.status === 'INTERVIEW'
      ).length;
      return acc;
    }, {});

    return Object.values(grouped).slice(0, 5);
  }, [activeJobs, filteredApplications]);

  const topTalent = useMemo(() => {
    return filteredApplications
      .filter((application) => application.assessmentScore != null)
      .sort((first, second) => (second.assessmentScore || 0) - (first.assessmentScore || 0))
      .slice(0, 5);
  }, [filteredApplications]);

  const insightMetrics = {
    hiringTargetMet: totalApplicants ? Math.round(((dashboard?.shortlistedCount ?? 0) / totalApplicants) * 100) : 0,
    interviewsScheduled: filteredApplications.filter((application) => application.status === 'INTERVIEW').length,
    activeOffers: filteredApplications.filter((application) => application.status === 'HIRED').length,
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const exportReport = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Active Jobs', activeJobs.length],
      ['Total Applicants', totalApplicants],
      ['Average Time To Hire', avgTimeToHire],
      ['Candidate Quality', candidateQuality.toFixed(2)],
      ['Top Candidate', topTalent[0]?.userName || 'N/A'],
    ];

    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'recruitment-analytics.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fb] px-6 py-10">
        <div className="mx-auto max-w-[1500px] text-sm text-slate-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-900">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-6 px-6 py-5">
          <div className="w-full max-w-md">
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search candidates..."
              className="rounded-2xl bg-slate-50"
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden items-center gap-3 md:flex">
              <NotificationIcon />
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
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">TH</div>
              <div>
                <p className="text-3xl font-semibold leading-none text-blue-600">TalentHub</p>
              </div>
            </div>
          </div>

          <nav className="space-y-1 px-4">
            <SidebarLink label="Dashboard" path="/recruiter/dashboard" />
            <SidebarLink label="Manage Jobs" path="/recruiter/manage-jobs" />
            <SidebarLink label="Applicants" path="/recruiter/applicants" />
            <SidebarLink label="Assessments" path="/recruiter/assessments" />
            <SidebarLink label="Analytics" path="/recruiter/analytics" active />
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
              <h1 className="text-5xl font-semibold tracking-tight text-slate-900">Recruitment Analytics</h1>
              <p className="mt-3 text-xl text-slate-500">
                Comprehensive performance reporting for your talent pipeline.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {rangeOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setRange(option.key)}
                    className={`px-4 py-3 text-sm font-medium ${
                      range === option.key ? 'bg-slate-100 text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <Button variant="outline" className="bg-white">Date Range</Button>
              <Button onClick={exportReport}>Export Report</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
            <MetricCard title="Active Jobs" value={activeJobs.length} subtitle={`${dashboard?.openPositions ?? 0} recruiter openings overall`} />
            <MetricCard title="Total Applicants" value={totalApplicants} subtitle={`${dashboard?.totalApplicants ?? 0} in recruiter history`} />
            <MetricCard title="Avg. Time to Hire" value={`${avgTimeToHire} Days`} subtitle="Current recruiter cycle average" />
            <MetricCard title="Candidate Quality" value={`${candidateQuality.toFixed(1)}/5`} subtitle={`${assessmentScores.length} scored profiles`} />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-semibold text-slate-900">Hiring Velocity & Trends</h2>
                  <p className="mt-2 text-base text-slate-500">Visualizing candidate flow across the pipeline over time.</p>
                </div>
                <Badge>Last 6 Months</Badge>
              </div>
              <LineChart data={trendData} maxValue={trendMax} />
            </div>

            <div className="rounded-[28px] bg-blue-600 p-6 text-white shadow-[0_18px_40px_rgba(37,99,235,0.22)]">
              <h3 className="text-4xl font-semibold">Performance Insight</h3>
              <p className="mt-5 text-base leading-8 text-blue-100">
                Hiring velocity is strongest where shortlisted candidates are moving cleanly into interviews and hires across your recent pipeline.
              </p>
              <div className="mt-8 space-y-4 border-t border-white/20 pt-6">
                <InsightRow label="Hiring Target Met" value={`${insightMetrics.hiringTargetMet}%`} />
                <InsightRow label="Interviews Scheduled" value={insightMetrics.interviewsScheduled} />
                <InsightRow label="Active Offers" value={insightMetrics.activeOffers} />
              </div>
              <button
                type="button"
                className="mt-8 w-full rounded-2xl bg-white px-5 py-4 text-base font-semibold text-blue-600"
              >
                Review Strategy
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-3xl font-semibold text-slate-900">Pipeline Breakdown</h2>
              <p className="mt-2 text-sm text-slate-500">Distribution of candidates across current recruiter stages.</p>
              <div className="mt-8">
                <DonutChart items={statusBreakdown} />
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-3xl font-semibold text-slate-900">Role Performance</h2>
              <p className="mt-2 text-sm text-slate-500">Application and interview volume by your active role mix.</p>
              <div className="mt-8 space-y-5">
                {categoryPerformance.length === 0 ? (
                  <p className="text-sm text-slate-500">No role performance data available yet.</p>
                ) : (
                  categoryPerformance.map((item) => (
                    <PerformanceBar
                      key={item.label}
                      label={item.label}
                      applications={item.applications}
                      interviews={item.interviews}
                      maxApplications={Math.max(1, ...categoryPerformance.map((entry) => entry.applications))}
                      maxInterviews={Math.max(1, ...categoryPerformance.map((entry) => entry.interviews))}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-2xl text-slate-400">+</div>
                <h3 className="mt-6 text-3xl font-semibold text-slate-900">Add Custom Widget</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  Configure a new data visualization for your dashboard.
                </p>
                <Button variant="outline" className="mt-6 bg-white">Configure Widget</Button>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-semibold text-slate-900">High-Potential Talent</h2>
                <p className="mt-2 text-base text-slate-500">Candidates with top-tier assessment scores in the current cycle.</p>
              </div>
              <Link to="/recruiter/applicants">
                <Button variant="outline" className="bg-white">View All</Button>
              </Link>
            </div>

            {topTalent.length === 0 ? (
              <p className="text-sm text-slate-500">No scored candidates available yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="border-b border-slate-200 text-sm text-slate-500">
                    <tr>
                      <th className="px-4 py-4 font-medium">Candidate</th>
                      <th className="px-4 py-4 font-medium">Target Role</th>
                      <th className="px-4 py-4 font-medium">Source</th>
                      <th className="px-4 py-4 font-medium">Score</th>
                      <th className="px-4 py-4 font-medium">Pipeline Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTalent.map((candidate) => (
                      <tr key={candidate.id} className="border-b border-slate-100">
                        <td className="px-4 py-5">
                          <div>
                            <p className="text-base font-medium text-slate-900">{candidate.userName}</p>
                            <p className="text-sm text-slate-500">{candidate.userEmail || 'No email available'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-5 text-base text-slate-700">{candidate.jobTitle}</td>
                        <td className="px-4 py-5">
                          <Badge variant="default">{formatLabel(candidate.source || 'DIRECT')}</Badge>
                        </td>
                        <td className="px-4 py-5 text-base font-semibold text-blue-600">
                          {Math.round(candidate.assessmentScore)}%
                        </td>
                        <td className="px-4 py-5">
                          <StatusBadge status={candidate.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 text-5xl font-semibold text-slate-900">{value}</p>
      <p className="mt-3 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
};

const InsightRow = ({ label, value }) => {
  return (
    <div className="flex items-center justify-between border-b border-white/15 pb-3 text-sm">
      <span className="text-blue-100">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
};

const LineChart = ({ data, maxValue }) => {
  const width = 720;
  const height = 280;
  const padding = 28;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  const pointsForKey = (key) =>
    data.map((point, index) => {
      const x = padding + (graphWidth / Math.max(1, data.length - 1)) * index;
      const y = padding + graphHeight - ((point[key] || 0) / maxValue) * graphHeight;
      return `${x},${y}`;
    }).join(' ');

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = padding + graphHeight - tick * graphHeight;
          return (
            <line
              key={tick}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#e2e8f0"
              strokeDasharray="4 6"
            />
          );
        })}

        <polyline fill="none" stroke="#ef7b5a" strokeWidth="3" points={pointsForKey('applications')} />
        <polyline fill="none" stroke="#2aa198" strokeWidth="3" strokeDasharray="6 6" points={pointsForKey('interviews')} />
        <polyline fill="none" stroke="#1f4b5f" strokeWidth="3" points={pointsForKey('hired')} />

        {data.map((point, index) => {
          const x = padding + (graphWidth / Math.max(1, data.length - 1)) * index;
          return (
            <text key={point.label} x={x} y={height - 4} textAnchor="middle" fontSize="12" fill="#64748b">
              {point.label}
            </text>
          );
        })}
      </svg>

      <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-500">
        <Legend color="#ef7b5a" label="Applications" />
        <Legend color="#2aa198" label="Interviews" />
        <Legend color="#1f4b5f" label="Hired" />
      </div>
    </div>
  );
};

const Legend = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
    <span>{label}</span>
  </div>
);

const DonutChart = ({ items }) => {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const colors = ['#ef7b5a', '#2aa198', '#1f4b5f', '#f2c14e', '#f4a261', '#7c93ff'];
  let cumulative = 0;

  const circles = items.map((item, index) => {
    const percentage = total ? item.count / total : 0;
    const dash = percentage * 314;
    const offset = -cumulative * 314;
    cumulative += percentage;
    return {
      ...item,
      color: colors[index % colors.length],
      dash,
      offset,
    };
  });

  return (
    <div className="flex flex-col items-center gap-8">
      <svg viewBox="0 0 140 140" className="h-56 w-56">
        <circle cx="70" cy="70" r="50" fill="none" stroke="#e2e8f0" strokeWidth="18" />
        {circles.map((item) => (
          <circle
            key={item.status}
            cx="70"
            cy="70"
            r="50"
            fill="none"
            stroke={item.color}
            strokeWidth="18"
            strokeDasharray={`${item.dash} 314`}
            strokeDashoffset={item.offset}
            transform="rotate(-90 70 70)"
          />
        ))}
      </svg>

      <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600">
        {circles.map((item) => (
          <div key={item.status} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.color }} />
            <span>{formatLabel(item.status)} ({item.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PerformanceBar = ({ label, applications, interviews, maxApplications, maxInterviews }) => {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-slate-700">{label}</p>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-3 flex-1 rounded-full bg-slate-100">
            <div className="h-3 rounded-full bg-[#ef7b5a]" style={{ width: `${(applications / Math.max(1, maxApplications)) * 100}%` }} />
          </div>
          <span className="w-10 text-sm text-slate-500">{applications}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-3 flex-1 rounded-full bg-slate-100">
            <div className="h-3 rounded-full bg-[#f2c14e]" style={{ width: `${(interviews / Math.max(1, maxInterviews)) * 100}%` }} />
          </div>
          <span className="w-10 text-sm text-slate-500">{interviews}</span>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const normalized = (status || '').toUpperCase();
  let variant = 'default';
  if (normalized === 'HIRED') variant = 'success';
  if (normalized === 'REJECTED') variant = 'danger';
  if (normalized === 'INTERVIEW' || normalized === 'ASSESSMENT') variant = 'warning';
  return <Badge variant={variant}>{formatLabel(status)}</Badge>;
};

const makeMonthKey = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}`;
};

const formatLabel = (value) => {
  if (!value) return '';
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

export default Analytics;
