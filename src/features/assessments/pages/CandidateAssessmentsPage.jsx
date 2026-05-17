import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Input from '../../../components/common/Input';
import { applicationService, assessmentService, authService, getApiErrorMessage } from '../../../services';
import { useAuthContext } from '../../../context/useAuthContext';
import { normalizeUserRole } from '../../../utils';

const CandidateAssessmentsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { logout, isLoggedIn, userRole } = useAuthContext();
  const [viewer, setViewer] = useState(null);
  const [applications, setApplications] = useState([]);
  const [assessmentsById, setAssessmentsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [startingAssessmentId, setStartingAssessmentId] = useState(null);
  const [usedAttemptIds, setUsedAttemptIds] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const filterJobId = searchParams.get('jobId');
  const filterAssessmentId = searchParams.get('assessmentId');

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [viewerRes, applicationsRes] = await Promise.allSettled([
          authService.getCurrentUser(),
          applicationService.getMyApplications(),
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

        if (applicationsRes.status !== 'fulfilled') {
          throw applicationsRes.reason;
        }

        const items = applicationsRes.value.data?.data || [];
        const assigned = items.filter((item) => item.assessmentId);
        setApplications(assigned);

        const uniqueAssessmentIds = [...new Set(assigned.map((item) => item.assessmentId).filter(Boolean))];
        const detailResponses = await Promise.allSettled(
          uniqueAssessmentIds.map((id) => assessmentService.getAssessment(id))
        );

        if (ignore) return;

        const detailMap = {};
        detailResponses.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            detailMap[uniqueAssessmentIds[index]] = result.value.data;
          }
        });
        setAssessmentsById(detailMap);
      } catch (err) {
        console.error('Failed to load candidate assessments:', err);
        if (!ignore) {
          if (err.response?.status === 401 || err.response?.status === 403) {
            logout();
            navigate('/login', { replace: true });
            return;
          }
          setError(err.response?.data?.message || 'Unable to load your assessments.');
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

  const fullName = useMemo(() => {
    const parts = [viewer?.firstName || '', viewer?.lastName || ''].filter(Boolean);
    return parts.join(' ') || viewer?.email || 'Candidate User';
  }, [viewer]);

  const initials = useMemo(() => {
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'CU';
  }, [fullName]);

  const assessmentCards = useMemo(() => {
    return applications
      .filter((item) => !filterJobId || String(item.jobId) === String(filterJobId))
      .filter((item) => !filterAssessmentId || String(item.assessmentId) === String(filterAssessmentId))
      .filter((item) => {
        if (!search.trim()) return true;
        const query = search.trim().toLowerCase();
        return [item.jobTitle, item.assessmentTitle, item.status]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));
      })
      .map((item) => {
        const detail = assessmentsById[item.assessmentId] || null;
        return {
          ...item,
          detail,
          questionsCount: detail?.questionCount || detail?.questions?.length || 0,
          durationMinutes: detail?.durationMinutes || 0,
          totalMarks: detail?.totalMarks || 0,
          passingMarksPercentage: detail?.passingMarksPercentage || 'N/A',
          enableProctoring: Boolean(detail?.enableProctoring),
          enforceFullScreen: Boolean(detail?.enforceFullScreen),
          detectCopyPaste: Boolean(detail?.detectCopyPaste),
        };
      });
  }, [applications, assessmentsById, filterAssessmentId, filterJobId, search]);

  const stats = useMemo(() => {
    return assessmentCards.reduce(
      (acc, item) => {
        acc.total += 1;
        if ((item.status || '').toUpperCase() === 'ASSESSMENT') {
          acc.pending += 1;
        }
        if (item.assessmentScore != null) {
          acc.completed += 1;
        }
        if (item.enableProctoring) {
          acc.proctored += 1;
        }
        return acc;
      },
      { total: 0, pending: 0, completed: 0, proctored: 0 }
    );
  }, [assessmentCards]);

  const startAssessment = async (assessmentId) => {
    setStartingAssessmentId(assessmentId);
    try {
      const response = await assessmentService.startAssessment(assessmentId);
      navigate(`/test/${response.data.sessionToken}`);
    } catch (error) {
      console.error('Failed to start assessment:', error);
      const message = getApiErrorMessage(error, 'Unable to start this assessment.');
      if (message.toLowerCase().includes('already used')) {
        setUsedAttemptIds((ids) => [...new Set([...ids, assessmentId])]);
      }
      setError(message);
      setStartingAssessmentId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fb] px-6 py-10">
        <div className="mx-auto max-w-[1500px] text-sm text-slate-500">Loading assessments...</div>
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
              placeholder="Search assessments, roles..."
              className="rounded-2xl bg-slate-50"
            />
          </form>
          <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{fullName}</p>
              <p className="text-xs capitalize text-slate-500">candidate</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
              {initials}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-81px)] max-w-[1500px] grid-cols-1 xl:grid-cols-[255px_minmax(0,1fr)]">
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
            <SidebarLink label="Applications" path="/dashboard" />
            <SidebarLink label="Assessments" path="/candidate/assessments" active count={stats.pending} />
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
              <h1 className="text-5xl font-semibold tracking-tight text-slate-900">Assessments</h1>
              <p className="mt-3 text-xl text-slate-500">
                Coding, MCQ, and descriptive rounds assigned to your applications.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/jobs">
                <Button variant="outline" className="bg-white">Explore Jobs</Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
            <StatCard title="Assigned" value={stats.total} subtitle="Total assessment rounds linked to your applications" />
            <StatCard title="Pending" value={stats.pending} subtitle="Assessments ready to start or continue" />
            <StatCard title="Completed" value={stats.completed} subtitle="Rounds with scored results available" />
            <StatCard title="Proctored" value={stats.proctored} subtitle="Assessment rounds with monitoring enabled" />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              {assessmentCards.length === 0 ? (
                <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-slate-500 shadow-sm">
                  No assigned assessments found right now.
                </div>
              ) : (
                assessmentCards.map((assessment) => {
                  const attemptUsed = usedAttemptIds.includes(assessment.assessmentId) || assessment.assessmentScore != null;
                  return (
                  <div key={`${assessment.id}-${assessment.assessmentId}`} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge variant={assessment.enableProctoring ? 'primary' : 'default'}>
                            {assessment.enableProctoring ? 'Proctored' : 'Standard'}
                          </Badge>
                          <Badge>{formatLabel(assessment.status)}</Badge>
                          {assessment.detail?.status && <Badge variant="success">{formatLabel(assessment.detail.status)}</Badge>}
                        </div>
                        <h2 className="mt-4 text-3xl font-semibold text-slate-900">{assessment.assessmentTitle}</h2>
                        <p className="mt-2 text-base text-slate-500">{assessment.jobTitle}</p>
                        <p className="mt-4 text-sm leading-7 text-slate-500">
                          {assessment.detail?.description || assessment.coverLetter || 'This assessment has been assigned by the recruiter for your current application.'}
                        </p>
                      </div>
                      <div className="flex w-full gap-3 lg:w-auto lg:flex-col">
                        <Button
                          onClick={() => startAssessment(assessment.assessmentId)}
                          loading={startingAssessmentId === assessment.assessmentId}
                          disabled={attemptUsed || startingAssessmentId === assessment.assessmentId}
                          variant={attemptUsed ? 'secondary' : 'primary'}
                        >
                          {attemptUsed ? 'Attempt Used' : startingAssessmentId === assessment.assessmentId ? 'Opening...' : 'Start Assessment'}
                        </Button>
                        <Link to="/dashboard">
                          <Button variant="outline" className="w-full bg-white">Back to Dashboard</Button>
                        </Link>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
                      <MetricPill label="Duration" value={`${assessment.durationMinutes || 0} min`} />
                      <MetricPill label="Questions" value={assessment.questionsCount} />
                      <MetricPill label="Marks" value={assessment.totalMarks || 0} />
                      <MetricPill label="Passing" value={assessment.passingMarksPercentage} />
                      <MetricPill label="Score" value={assessment.assessmentScore != null ? `${Math.round(assessment.assessmentScore)}%` : 'Pending'} />
                    </div>
                  </div>
                  );
                })
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-blue-100 bg-blue-50 p-6 shadow-sm">
                <h3 className="text-3xl font-semibold text-slate-900">Round Rules</h3>
                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <RuleItem label="Full screen monitoring" enabled={assessmentCards.some((item) => item.enforceFullScreen)} />
                  <RuleItem label="Proctoring enabled" enabled={assessmentCards.some((item) => item.enableProctoring)} />
                  <RuleItem label="Copy / paste detection" enabled={assessmentCards.some((item) => item.detectCopyPaste)} />
                  <RuleItem label="Auto-save in editor" enabled />
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-3xl font-semibold text-slate-900">Tips Before You Start</h3>
                <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
                  <li>Use a stable internet connection and keep one tab open during the round.</li>
                  <li>For coding tests, sample test cases are available inside the editor workspace.</li>
                  <li>MCQ and descriptive answers are saved automatically as you progress.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

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

const StatCard = ({ title, value, subtitle }) => (
  <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
    <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">{title}</p>
    <p className="mt-3 text-5xl font-semibold text-slate-900">{value}</p>
    <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
  </div>
);

const MetricPill = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 px-4 py-4">
    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
    <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
  </div>
);

const RuleItem = ({ label, enabled }) => (
  <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
    <span>{label}</span>
    <Badge variant={enabled ? 'success' : 'default'}>{enabled ? 'On' : 'Off'}</Badge>
  </div>
);

const formatLabel = (value) => {
  if (!value) return '';
  return String(value).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

export default CandidateAssessmentsPage;
