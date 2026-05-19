import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Search,
  Trophy,
  Video,
} from 'lucide-react';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import { applicationService, interviewService } from '../../../services';
import { useAuthContext } from '../../../context/useAuthContext';

const statusSteps = ['APPLIED', 'SHORTLISTED', 'ASSESSMENT', 'INTERVIEW', 'HIRED'];
const terminalStatuses = ['HIRED', 'REJECTED'];

const CandidateApplicationsPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuthContext();
  const [applications, setApplications] = useState([]);
  const [interviewSessions, setInterviewSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    let ignore = false;

    const loadApplications = async () => {
      setLoading(true);
      setError('');
      try {
        const [response, interviewsResponse] = await Promise.all([
          applicationService.getMyApplications(),
          interviewService.getMySessions(),
        ]);
        if (!ignore) {
          setApplications(response.data?.data || []);
          setInterviewSessions(interviewsResponse.data || []);
        }
      } catch (err) {
        console.error('Candidate applications load error:', err);
        if (!ignore) {
          if (err.response?.status === 401 || err.response?.status === 403) {
            logout();
            navigate('/login', { replace: true });
            return;
          }
          setError(err.response?.data?.message || 'Unable to load your applications.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadApplications();

    return () => {
      ignore = true;
    };
  }, [logout, navigate]);

  const stats = useMemo(() => {
    const active = applications.filter((item) => !terminalStatuses.includes(normalizeStatus(item.status))).length;
    const assessments = applications.filter((item) => Boolean(item.assessmentId)).length;
    const interviews = applications.filter((item) => normalizeStatus(item.status) === 'INTERVIEW').length;
    const offers = applications.filter((item) => normalizeStatus(item.status) === 'HIRED').length;

    return { active, assessments, interviews, offers };
  }, [applications]);

  const availableStatuses = useMemo(() => {
    const statuses = applications.map((item) => normalizeStatus(item.status)).filter(Boolean);
    return ['ALL', ...Array.from(new Set(statuses))];
  }, [applications]);

  const filteredApplications = useMemo(() => {
    if (statusFilter === 'ALL') return applications;
    return applications.filter((item) => normalizeStatus(item.status) === statusFilter);
  }, [applications, statusFilter]);

  const interviewsByJobId = useMemo(() => {
    return interviewSessions.reduce((map, session) => {
      if (!map.has(session.jobId)) {
        map.set(session.jobId, []);
      }
      map.get(session.jobId).push(session);
      return map;
    }, new Map());
  }, [interviewSessions]);

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-900">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">Candidate workspace</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">Application Tracker</h1>
            <p className="mt-2 text-base text-slate-500">Track every job you applied for and see where each application stands.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/dashboard">
              <Button variant="outline" className="bg-white">Dashboard</Button>
            </Link>
            <Link to="/jobs">
              <Button>
                <Search size={16} />
                Find Jobs
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1500px] grid-cols-1 xl:grid-cols-[255px_minmax(0,1fr)]">
        <aside className="border-r border-slate-200 bg-white">
          <div className="px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white">TH</div>
              <p className="text-3xl font-semibold leading-none text-blue-600">TalentHub</p>
            </div>
          </div>
          <nav className="space-y-1 px-4">
            <SidebarLink label="Dashboard" path="/dashboard" />
            <SidebarLink label="Find Jobs" path="/jobs" />
            <SidebarLink label="Applications" path="/applications" active count={applications.length} />
            <SidebarLink label="Assessments" path="/candidate/assessments" count={stats.assessments} />
            <SidebarLink label="Interviews" path="/interviews" count={interviewSessions.length} />
            <SidebarLink label="Profile" path="/profile" />
          </nav>
        </aside>

        <main className="px-6 py-8">
          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Active" value={stats.active} icon={BriefcaseBusiness} tone="blue" />
            <SummaryCard label="Assessments" value={stats.assessments} icon={ClipboardList} tone="purple" />
            <SummaryCard label="Interviews" value={stats.interviews} icon={CalendarDays} tone="emerald" />
            <SummaryCard label="Offers" value={stats.offers} icon={Trophy} tone="amber" />
          </section>

          <section className="mt-6 rounded-[30px] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">Your applications</h2>
                <p className="mt-1 text-sm text-slate-500">Progress updates appear here when recruiters move your application forward.</p>
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-blue-400"
              >
                {availableStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status === 'ALL' ? 'All statuses' : formatLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="px-6 py-12 text-sm text-slate-500">Loading applications...</div>
            ) : filteredApplications.length === 0 ? (
              <EmptyState hasApplications={applications.length > 0} />
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredApplications.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    interviewSessions={interviewsByJobId.get(application.jobId) || []}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

const ApplicationCard = ({ application, interviewSessions }) => {
  const status = normalizeStatus(application.status);
  const currentIndex = getProgressIndex(status);
  const isRejected = status === 'REJECTED';
  const latestInterview = interviewSessions[0] || null;

  return (
    <article className="px-6 py-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={getStatusVariant(status)}>{formatLabel(status || 'APPLIED')}</Badge>
            <span className="text-sm text-slate-500">Applied {formatDate(application.createdAt)}</span>
          </div>
          <h3 className="mt-3 text-2xl font-semibold text-slate-950">{application.jobTitle || 'Untitled role'}</h3>
          <p className="mt-2 text-sm text-slate-500">
            Application #{application.id}
            {application.source ? ` • Source: ${formatLabel(application.source)}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {application.jobId && (
            <Link to={`/jobs/${application.jobId}`}>
              <Button variant="outline" className="bg-white">
                View Job
                <ArrowRight size={16} />
              </Button>
            </Link>
          )}
          {application.assessmentId && (
            <Link to="/candidate/assessments">
              <Button>
                Assessment
                <ArrowRight size={16} />
              </Button>
            </Link>
          )}
          {latestInterview && (
            <Link to={latestInterview.status === 'LIVE' ? `/interview/room/${latestInterview.roomToken}` : `/interview/join/${latestInterview.inviteToken}`}>
              <Button variant={latestInterview.status === 'LIVE' ? 'primary' : 'outline'} className={latestInterview.status === 'LIVE' ? '' : 'bg-white'}>
                <Video size={16} />
                {latestInterview.status === 'LIVE' ? 'Join Interview' : 'View Interview'}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-[24px] bg-slate-50 px-4 py-5">
        {isRejected ? (
          <div>
            <p className="text-sm font-semibold text-rose-700">Application closed</p>
            <p className="mt-1 text-sm text-slate-500">This application was not selected for the next stage.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-5">
            {statusSteps.map((step, index) => {
              const complete = index <= currentIndex;
              return (
                <div key={step} className={`rounded-2xl border px-3 py-3 ${complete ? 'border-blue-200 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-500'}`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className={complete ? 'text-white' : 'text-slate-300'} />
                    <span className="text-xs font-semibold uppercase tracking-[0.12em]">{formatLabel(step)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <InfoTile label="Resume" value={application.resumePath ? 'Submitted' : 'Not attached'} icon={FileText} />
        <InfoTile label="Assessment" value={application.assessmentTitle || 'Not assigned'} icon={ClipboardList} />
        <InfoTile
          label="Score"
          value={formatAssessmentScore(application)}
          icon={Trophy}
          tone={application.assessmentPassed === true ? 'success' : application.assessmentPassed === false ? 'danger' : 'default'}
        />
      </div>

      {latestInterview && (
        <div className={`mt-5 rounded-2xl border px-4 py-4 ${
          latestInterview.status === 'LIVE'
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-blue-200 bg-blue-50'
        }`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className={`text-sm font-semibold ${latestInterview.status === 'LIVE' ? 'text-emerald-900' : 'text-blue-900'}`}>
                {latestInterview.status === 'LIVE' ? 'Interview started' : 'Interview scheduled'}
              </p>
              <p className={`mt-1 text-sm ${latestInterview.status === 'LIVE' ? 'text-emerald-700' : 'text-blue-700'}`}>
                {latestInterview.title} • {new Date(latestInterview.scheduledStartAt).toLocaleString()}
              </p>
            </div>
            <Link to={latestInterview.status === 'LIVE' ? `/interview/room/${latestInterview.roomToken}` : `/interview/join/${latestInterview.inviteToken}`}>
              <Button>
                <Video size={16} />
                {latestInterview.status === 'LIVE' ? 'Join Now' : 'Waiting Room'}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {application.coverLetter && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Cover letter</p>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{application.coverLetter}</p>
        </div>
      )}
    </article>
  );
};

const SummaryCard = ({ label, value, icon: Icon, tone }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-violet-50 text-violet-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-3 text-4xl font-semibold text-slate-950">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]}`}>
          {React.createElement(Icon, { size: 22, 'aria-hidden': 'true' })}
        </div>
      </div>
    </div>
  );
};

const InfoTile = ({ label, value, icon: Icon, tone = 'default' }) => {
  const toneClass = {
    default: 'bg-white text-slate-700',
    success: 'bg-emerald-50 text-emerald-700',
    danger: 'bg-rose-50 text-rose-700',
  }[tone];

  return (
    <div className={`rounded-2xl border border-slate-200 px-4 py-4 ${toneClass}`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] opacity-75">
        {React.createElement(Icon, { size: 15, 'aria-hidden': 'true' })}
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
};

const EmptyState = ({ hasApplications }) => (
  <div className="px-6 py-14 text-center">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
      <BriefcaseBusiness size={28} />
    </div>
    <h3 className="mt-5 text-2xl font-semibold text-slate-950">
      {hasApplications ? 'No applications match this filter' : 'No applications yet'}
    </h3>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
      {hasApplications
        ? 'Try another status filter to view your submitted applications.'
        : 'Apply to jobs from the listings page and your progress will appear here.'}
    </p>
    <Link to="/jobs" className="mt-6 inline-flex">
      <Button>Browse Jobs</Button>
    </Link>
  </div>
);

const SidebarLink = ({ label, path, active = false, count }) => (
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

const normalizeStatus = (status) => String(status || 'APPLIED').toUpperCase();

const getProgressIndex = (status) => {
  const index = statusSteps.indexOf(status);
  return index >= 0 ? index : 0;
};

const getStatusVariant = (status) => {
  if (status === 'HIRED') return 'success';
  if (status === 'REJECTED') return 'danger';
  if (status === 'INTERVIEW' || status === 'ASSESSMENT') return 'primary';
  return 'default';
};

const formatAssessmentScore = (application) => {
  if (typeof application.assessmentScore === 'number') {
    return `${Math.round(application.assessmentScore)}%${application.assessmentPassed === true ? ' • Passed' : application.assessmentPassed === false ? ' • Not passed' : ''}`;
  }
  if (application.correctAnswers != null && application.totalQuestions != null) {
    return `${application.correctAnswers}/${application.totalQuestions}`;
  }
  return 'Pending';
};

const formatLabel = (value) => String(value || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (dateString) => {
  if (!dateString) return 'recently';
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default CandidateApplicationsPage;
