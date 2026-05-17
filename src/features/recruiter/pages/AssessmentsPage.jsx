import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SquareMenu } from 'lucide-react';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Input from '../../../components/common/Input';
import NotificationIcon from '../../../components/common/NotificationIcon';
import { useAuthContext } from '../../../context/useAuthContext';
import { assessmentService, authService } from '../../../services';

const AssessmentsPage = () => {
  const navigate = useNavigate();
  const { logout, isLoggedIn, userRole } = useAuthContext();
  const [viewer, setViewer] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

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

        const response = await assessmentService.getMyAssessments();
        if (ignore) return;

        setAssessments(Array.isArray(response.data) ? response.data : response.data?.data || []);
      } catch (err) {
        console.error('Assessments load error:', err);
        if (ignore) return;

        if (err.response?.status === 401 || err.response?.status === 403) {
          logout();
          navigate('/login', { replace: true });
          return;
        }

        setError(err.response?.data?.message || 'Failed to load assessments.');
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

  const filteredAssessments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return assessments;

    return assessments.filter((assessment) =>
      [assessment.title, assessment.description, assessment.jobTitle, assessment.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [assessments, search]);

  const stats = useMemo(() => {
    return filteredAssessments.reduce(
      (acc, assessment) => {
        acc.total += 1;
        if ((assessment.status || '').toUpperCase() === 'PUBLISHED') acc.published += 1;
        if ((assessment.status || '').toUpperCase() === 'DRAFT') acc.draft += 1;
        if ((assessment.status || '').toUpperCase() === 'CLOSED') acc.closed += 1;
        acc.questions += Number(assessment.questionCount || 0);
        return acc;
      },
      { total: 0, published: 0, draft: 0, closed: 0, questions: 0 }
    );
  }, [filteredAssessments]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const refreshAssessments = async () => {
    const response = await assessmentService.getMyAssessments();
    setAssessments(Array.isArray(response.data) ? response.data : response.data?.data || []);
  };

  const handlePublish = async (assessmentId) => {
    try {
      setActionLoadingId(assessmentId);
      await assessmentService.publishAssessment(assessmentId);
      await refreshAssessments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish assessment.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleClose = async (assessmentId) => {
    try {
      setActionLoadingId(assessmentId);
      await assessmentService.closeAssessment(assessmentId);
      await refreshAssessments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close assessment.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (assessmentId) => {
    if (!window.confirm('Delete this assessment permanently? Assigned candidates will no longer see this test.')) return;

    try {
      setActionLoadingId(assessmentId);
      await assessmentService.deleteAssessment(assessmentId);
      await refreshAssessments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete assessment.');
    } finally {
      setActionLoadingId(null);
    }
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
          <div className="w-full max-w-md">
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assessments..."
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
            <SidebarLink label="Analytics" path="/recruiter/analytics" />
            <SidebarLink label="Assessments" path="/recruiter/assessments" active />
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
              <h1 className="text-5xl font-semibold tracking-tight text-slate-900">Assessments</h1>
              <p className="mt-3 text-xl text-slate-500">
                Manage coding tests and assessments for your job openings.
              </p>
            </div>
            <Link to="/recruiter/assessments/create">
              <Button>New Assessment</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
            <StatCard title="Total assessments" value={stats.total} subtitle="Across your recruiter workspace" />
            <StatCard title="Published" value={stats.published} subtitle="Ready for candidate assignments" />
            <StatCard title="Drafts" value={stats.draft} subtitle="Still being prepared" />
            <StatCard title="Questions" value={stats.questions} subtitle="Total configured question count" />
          </div>

          <div className="mt-8 rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Assessment Library</h2>
                <p className="mt-1 text-sm text-slate-500">Search, publish, close, or edit your active test catalog.</p>
              </div>
              <div className="w-full max-w-md">
                <Input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by title, job, or status..."
                  className="rounded-2xl"
                />
              </div>
            </div>

            {filteredAssessments.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  AS
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-900">No assessments</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Create your first coding assessment or MCQ test to start evaluating candidates.
                </p>
                <Link to="/recruiter/assessments/create" className="mt-6 inline-block">
                  <Button>Create Assessment</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="border-b border-slate-200 text-sm text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Assessment</th>
                      <th className="px-4 py-4 font-medium">Linked Job</th>
                      <th className="px-4 py-4 font-medium">Questions</th>
                      <th className="px-4 py-4 font-medium">Duration</th>
                      <th className="px-4 py-4 font-medium">Status</th>
                      <th className="px-4 py-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssessments.map((assessment) => {
                      const status = (assessment.status || 'DRAFT').toUpperCase();
                      const isDraft = status === 'DRAFT';
                      const isPublished = status === 'PUBLISHED';
                      const isClosed = status === 'CLOSED';

                      return (
                        <tr key={assessment.id} className="border-b border-slate-100 align-top">
                          <td className="px-6 py-5">
                            <p className="text-xl font-medium text-slate-900">{assessment.title}</p>
                            <p className="mt-2 max-w-xl text-sm text-slate-500">
                              {assessment.description || 'No description added yet.'}
                            </p>
                            <p className="mt-3 text-xs uppercase tracking-[0.14em] text-slate-400">
                              Passing threshold {assessment.passingMarksPercentage}
                            </p>
                          </td>
                          <td className="px-4 py-5 text-base text-slate-700">
                            {assessment.jobTitle || 'Not linked'}
                          </td>
                          <td className="px-4 py-5 text-base text-slate-700">
                            {assessment.questionCount || 0}
                          </td>
                          <td className="px-4 py-5 text-base text-slate-700">
                            {assessment.durationMinutes} min
                          </td>
                          <td className="px-4 py-5">
                            <StatusBadge status={status} />
                          </td>
                          <td className="px-4 py-5">
                            <div className="flex flex-wrap gap-2">
                              <Link to={`/recruiter/assessments/${assessment.id}/leaderboard`}>
                                <Button variant="outline" size="sm" className="bg-white">Leaderboard</Button>
                              </Link>
                              <Link to={`/recruiter/assessments/${assessment.id}/edit`}>
                                <Button variant="outline" size="sm" className="bg-white">Edit</Button>
                              </Link>
                              {isDraft && (
                                <>
                                  <Button size="sm" onClick={() => handlePublish(assessment.id)} loading={actionLoadingId === assessment.id}>
                                    Publish
                                  </Button>
                                </>
                              )}
                              {isPublished && (
                                <Button variant="outline" size="sm" className="bg-white" onClick={() => handleClose(assessment.id)} loading={actionLoadingId === assessment.id}>
                                  Close
                                </Button>
                              )}
                              {isClosed && (
                                <span className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-500">
                                  Closed
                                </span>
                              )}
                              <Button variant="danger" size="sm" onClick={() => handleDelete(assessment.id)} loading={actionLoadingId === assessment.id}>
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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

const StatCard = ({ title, value, subtitle }) => {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 text-5xl font-semibold text-slate-900">{value}</p>
      <p className="mt-3 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  let variant = 'default';
  if (status === 'PUBLISHED' || status === 'LIVE') variant = 'success';
  if (status === 'CLOSED') variant = 'danger';
  return <Badge variant={variant}>{formatLabel(status)}</Badge>;
};

const formatLabel = (value) => {
  if (!value) return '';
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

export default AssessmentsPage;
