import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SquareMenu } from 'lucide-react';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Input from '../../../components/common/Input';
import NotificationIcon from '../../../components/common/NotificationIcon';
import { useAuthContext } from '../../../context/useAuthContext';
import { authService, jobService } from '../../../services';

const PAGE_SIZE = 6;

const ManageJobs = () => {
  const navigate = useNavigate();
  const { logout, isLoggedIn, userRole } = useAuthContext();
  const [jobs, setJobs] = useState([]);
  const [viewer, setViewer] = useState(null);
  const [selectedJobIds, setSelectedJobIds] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState(false);
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

        const jobsRes = await jobService.getMyJobs();
        if (ignore) return;

        setJobs(jobsRes.data?.data || []);
      } catch (err) {
        console.error('Manage jobs load error:', err);
        if (ignore) return;

        if (err.response?.status === 401 || err.response?.status === 403) {
          logout();
          navigate('/login', { replace: true });
          return;
        }

        setError(err.response?.data?.message || 'Unable to load recruiter jobs.');
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

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return jobs;

    return jobs.filter((job) => {
      const jobId = `JOB-${String(job.id).padStart(3, '0')}`.toLowerCase();
      return [job.title, job.location, job.companyName, job.jobType, jobId]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [jobs, search]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedJobs = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredJobs.slice(start, start + PAGE_SIZE);
  }, [filteredJobs, safeCurrentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    setSelectedJobIds((current) => current.filter((jobId) => jobs.some((job) => job.id === jobId)));
  }, [jobs]);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleArchiveOld = async () => {
    setArchiving(true);
    setError('');

    try {
      await jobService.archiveOldJobs(90);
      const jobsRes = await jobService.getMyJobs();
      setJobs(jobsRes.data?.data || []);
      setSelectedJobIds([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to archive old jobs.');
    } finally {
      setArchiving(false);
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Delete this job posting?')) return;

    try {
      await jobService.deleteJob(jobId);
      setJobs((current) => current.filter((job) => job.id !== jobId));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete job.');
    }
  };

  const toggleSelectAllVisible = (checked) => {
    if (checked) {
      setSelectedJobIds((current) => Array.from(new Set([...current, ...paginatedJobs.map((job) => job.id)])));
      return;
    }

    setSelectedJobIds((current) => current.filter((jobId) => !paginatedJobs.some((job) => job.id === jobId)));
  };

  const toggleSelectedJob = (jobId, checked) => {
    if (checked) {
      setSelectedJobIds((current) => Array.from(new Set([...current, jobId])));
      return;
    }

    setSelectedJobIds((current) => current.filter((id) => id !== jobId));
  };

  const allVisibleSelected = paginatedJobs.length > 0 && paginatedJobs.every((job) => selectedJobIds.includes(job.id));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fb] px-6 py-10">
        <div className="mx-auto max-w-[1500px] text-sm text-slate-500">Loading recruiter jobs...</div>
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
            <SidebarLink label="Manage Jobs" path="/recruiter/manage-jobs" active />
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
              <h1 className="text-5xl font-semibold tracking-tight text-slate-900">Manage Jobs</h1>
              <p className="mt-3 text-xl text-slate-500">
                Overview of all job postings and their current performance.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="bg-white" onClick={handleArchiveOld} loading={archiving}>
                Archive Old
              </Button>
              <Link to="/recruiter/post-job">
                <Button>Post New Job</Button>
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex w-full max-w-xl items-center gap-3">
                <div className="flex-1">
                  <Input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by job title or ID..."
                    className="rounded-2xl"
                  />
                </div>
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-slate-500"
                  aria-label="Filters"
                >
                  F
                </button>
              </div>
              <div className="text-sm text-slate-500">
                {selectedJobIds.length ? `${selectedJobIds.length} selected` : `${filteredJobs.length} jobs`}
              </div>
            </div>

            {paginatedJobs.length === 0 ? (
              <div className="px-6 py-12 text-sm text-slate-500">No jobs found for this recruiter.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className="border-b border-slate-200 text-sm text-slate-500">
                      <tr>
                        <th className="w-14 px-6 py-4">
                          <input
                            type="checkbox"
                            checked={allVisibleSelected}
                            onChange={(event) => toggleSelectAllVisible(event.target.checked)}
                            className="h-5 w-5 rounded border-slate-300"
                          />
                        </th>
                        <th className="px-4 py-4 font-medium">Job Title</th>
                        <th className="px-4 py-4 font-medium">Status</th>
                        <th className="px-4 py-4 font-medium">Applicants</th>
                        <th className="px-4 py-4 font-medium">Date Posted</th>
                        <th className="px-4 py-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedJobs.map((job) => (
                        <tr key={job.id} className="border-b border-slate-100 align-top">
                          <td className="px-6 py-5">
                            <input
                              type="checkbox"
                              checked={selectedJobIds.includes(job.id)}
                              onChange={(event) => toggleSelectedJob(job.id, event.target.checked)}
                              className="h-5 w-5 rounded border-slate-300"
                            />
                          </td>
                          <td className="px-4 py-5">
                            <p className="text-xl font-medium text-slate-900">{job.title}</p>
                            <p className="mt-2 text-sm text-slate-500">
                              {buildJobMeta(job)}
                            </p>
                          </td>
                          <td className="px-4 py-5">
                            <StatusBadge status={job.status} />
                          </td>
                          <td className="px-4 py-5">
                            <Link
                              to="/recruiter/applicants"
                              className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600"
                            >
                              <span>{job.applicationCount ?? 0}</span>
                              <span className="text-slate-500">Applicants</span>
                            </Link>
                          </td>
                          <td className="px-4 py-5 text-base text-slate-600">
                            {formatDate(job.createdAt)}
                          </td>
                          <td className="px-4 py-5">
                            <div className="flex flex-wrap gap-2">
                              <Link to={`/recruiter/jobs/${job.id}`}>
                                <Button variant="outline" size="sm" className="bg-white">View</Button>
                              </Link>
                              <Button variant="outline" size="sm" className="bg-white" onClick={() => navigate('/recruiter/post-job', { state: { job } })}>
                                Edit
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => handleDelete(job.id)}>
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Showing {filteredJobs.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1}-
                    {Math.min(safeCurrentPage * PAGE_SIZE, filteredJobs.length)} of {filteredJobs.length} jobs
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={safeCurrentPage === 1}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ‹
                    </button>
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-medium ${
                          pageNumber === safeCurrentPage
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ›
                    </button>
                  </div>
                </div>
              </>
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

const StatusBadge = ({ status }) => {
  const normalized = (status || '').toUpperCase();
  let variant = 'default';
  if (normalized === 'ACTIVE') variant = 'success';
  if (normalized === 'CLOSED') variant = 'danger';
  if (normalized === 'ON_HOLD') variant = 'warning';
  if (normalized === 'DRAFT') variant = 'default';
  return <Badge variant={variant}>{formatLabel(status || 'Active')}</Badge>;
};

const buildJobMeta = (job) => {
  const jobId = `JOB-${String(job.id).padStart(3, '0')}`;
  return [jobId, formatLabel(job.jobType), job.location].filter(Boolean).join('  ·  ');
};

const formatLabel = (value) => {
  if (!value) return '';
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default ManageJobs;
