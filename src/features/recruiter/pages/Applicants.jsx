import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarClock, Copy, SquareMenu, Video } from 'lucide-react';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Input from '../../../components/common/Input';
import NotificationIcon from '../../../components/common/NotificationIcon';
import { useAuthContext } from '../../../context/useAuthContext';
import { applicationService, assessmentService, authService, interviewService, recruiterService } from '../../../services';

const statusTabs = [
  { key: 'ALL', label: 'All Applicants' },
  { key: 'APPLIED', label: 'New' },
  { key: 'SHORTLISTED', label: 'Screening' },
  { key: 'ASSESSMENT', label: 'Assessment' },
  { key: 'INTERVIEW', label: 'Interview' },
  { key: 'HIRED', label: 'Hired' },
];

const statusActions = ['SHORTLISTED', 'ASSESSMENT', 'INTERVIEW', 'HIRED', 'REJECTED'];

const Applicants = () => {
  const navigate = useNavigate();
  const { logout, isLoggedIn, userRole } = useAuthContext();
  const [viewer, setViewer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [applications, setApplications] = useState([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [error, setError] = useState('');
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewSchedule, setInterviewSchedule] = useState(() => getDefaultInterviewSchedule());
  const [interviewCreating, setInterviewCreating] = useState(false);
  const [createdInterview, setCreatedInterview] = useState(null);

  useEffect(() => {
    let ignore = false;

    const loadInitialData = async () => {
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

        const [jobsRes, assessmentsRes] = await Promise.all([
          recruiterService.getJobs(),
          assessmentService.getMyAssessments(),
        ]);
        if (ignore) return;

        const jobList = jobsRes.data?.data || [];
        setJobs(jobList);
        setSelectedJobId((current) => current || jobList[0]?.id || null);
        const assessmentList = Array.isArray(assessmentsRes.data)
          ? assessmentsRes.data
          : assessmentsRes.data?.data || [];
        setAssessments(assessmentList);
      } catch (err) {
        console.error('Applicants page load error:', err);
        if (ignore) return;

        if (err.response?.status === 401 || err.response?.status === 403) {
          logout();
          navigate('/login', { replace: true });
          return;
        }

        setError(err.response?.data?.message || 'Unable to load recruiter applicant data.');
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      ignore = true;
    };
  }, [logout, navigate, userRole]);

  useEffect(() => {
    if (!selectedJobId) {
      setApplications([]);
      setSelectedApplicationId(null);
      return;
    }

    let ignore = false;

    const loadApplications = async () => {
      setLoading(true);
      setError('');

      try {
        const applicationsRes = await applicationService.getApplicationsByJob(selectedJobId);

        if (ignore) return;

        const applicationList = applicationsRes.data?.data || [];
        setApplications(applicationList);
        setSelectedApplicationId((current) => current || applicationList[0]?.id || null);
      } catch (err) {
        console.error('Applicants fetch error:', err);
        if (!ignore) {
          setError(err.response?.data?.message || 'Unable to load applicants.');
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
  }, [selectedJobId]);

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus = statusFilter === 'ALL' || application.status === statusFilter;
      const matchesSearch = !query || [
        application.userName,
        application.userEmail,
        application.userHeadline,
        application.userLocation,
        application.jobTitle,
        application.coverLetter,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [applications, search, statusFilter]);

  useEffect(() => {
    if (!filteredApplications.some((application) => application.id === selectedApplicationId)) {
      setSelectedApplicationId(filteredApplications[0]?.id || null);
    }
  }, [filteredApplications, selectedApplicationId]);

  const selectedApplication = useMemo(
    () => filteredApplications.find((application) => application.id === selectedApplicationId)
      || applications.find((application) => application.id === selectedApplicationId)
      || null,
    [applications, filteredApplications, selectedApplicationId]
  );

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) || null,
    [jobs, selectedJobId]
  );

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

  const statusCounts = useMemo(() => {
    return applications.reduce((counts, application) => {
      counts[application.status] = (counts[application.status] || 0) + 1;
      return counts;
    }, {});
  }, [applications]);

  const assignableAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      const status = String(assessment.status || '').toUpperCase();
      return status === 'PUBLISHED' || status === 'LIVE';
    });
  }, [assessments]);

  useEffect(() => {
    if (selectedApplication?.assessmentId) {
      setSelectedAssessmentId(String(selectedApplication.assessmentId));
      return;
    }

    setSelectedAssessmentId((current) => {
      if (current && assignableAssessments.some((assessment) => String(assessment.id) === String(current))) {
        return current;
      }
      return assignableAssessments[0]?.id ? String(assignableAssessments[0].id) : '';
    });
  }, [assignableAssessments, selectedApplication]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleStatusChange = async (nextStatus) => {
    if (!selectedApplication || !selectedJobId) return;
    if (nextStatus === 'INTERVIEW') {
      setCreatedInterview(null);
      setInterviewSchedule(getDefaultInterviewSchedule());
      setInterviewModalOpen(true);
      return;
    }
    if (selectedApplication.status === nextStatus) return;

    setUpdatingStatus(true);
    setError('');

    try {
      let response;

      if (nextStatus === 'ASSESSMENT') {
        const assessmentId = selectedAssessmentId
          ? Number(selectedAssessmentId)
          : assignableAssessments[0]?.id;
        if (!assessmentId) {
          throw new Error('Create and publish an assessment before assigning a candidate.');
        }
        response = await applicationService.assignAssessment(
          selectedJobId,
          selectedApplication.userId,
          assessmentId
        );
      } else {
        response = await applicationService.updateStatus(selectedApplication.id, nextStatus);
      }

      const updatedApplication = response.data?.data;

      setApplications((current) =>
        current.map((item) => (item.id === updatedApplication.id ? { ...item, ...updatedApplication } : item))
      );
    } catch (err) {
      console.error('Unable to update application status:', err);
      setError(err.response?.data?.message || err.message || 'Unable to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const scheduleInterview = async (event) => {
    event.preventDefault();
    if (!selectedApplication || !selectedJobId) return;

    setInterviewCreating(true);
    setError('');

    try {
      const title = interviewSchedule.title.trim()
        || `${selectedApplication.jobTitle || selectedJob?.title || 'Job'} Interview`;
      const response = await interviewService.createSession({
        jobId: Number(selectedJobId),
        candidateId: Number(selectedApplication.userId),
        title,
        scheduledStartAt: interviewSchedule.scheduledStartAt,
        durationMinutes: Number(interviewSchedule.durationMinutes || 60),
        roundType: interviewSchedule.roundType,
        candidateCanJoinOnce: true,
        recordingEnabled: interviewSchedule.recordingEnabled,
        identityVerificationRequired: true,
      });

      const session = response.data;
      setCreatedInterview(session);

      const statusResponse = await applicationService.updateStatus(selectedApplication.id, 'INTERVIEW');
      const updatedApplication = statusResponse.data?.data;
      setApplications((current) =>
        current.map((item) => (item.id === updatedApplication.id ? { ...item, ...updatedApplication } : item))
      );
    } catch (err) {
      console.error('Unable to schedule interview:', err);
      setError(err.response?.data?.message || err.message || 'Unable to schedule interview.');
    } finally {
      setInterviewCreating(false);
    }
  };

  const startInterview = async () => {
    if (!createdInterview?.roomToken) return;
    try {
      await interviewService.startSession(createdInterview.roomToken);
      navigate(`/interview/room/${createdInterview.roomToken}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to start interview.');
    }
  };

  const copyInvite = async () => {
    if (!createdInterview?.inviteUrl) return;
    await navigator.clipboard.writeText(`${window.location.origin}${createdInterview.inviteUrl}`);
  };

  const openResume = async (download = false) => {
    if (!selectedApplication) return;

    try {
      setResumeLoading(true);
      const response = await applicationService.getResume(selectedApplication.userId, download);
      const fileUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));

      if (download) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = `${selectedApplication.userName || 'resume'}.pdf`;
        link.click();
      } else {
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
      }

      setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
    } catch (err) {
      console.error('Unable to open resume:', err);
      setError('Unable to access resume.');
    } finally {
      setResumeLoading(false);
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="min-h-screen bg-[#f7f8fb] px-6 py-10">
        <div className="mx-auto max-w-[1500px] text-sm text-slate-500">Loading applicants...</div>
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
            <SidebarLink label="Applicants" path="/recruiter/applicants" active />
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

          <div className="mb-8">
            <h1 className="text-5xl font-semibold tracking-tight text-slate-900">Applicants</h1>
            <p className="mt-3 text-xl text-slate-500">
              Review and manage candidates across your active job postings.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
            <div className="space-y-6">
              <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <Input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by name, email, or skill..."
                        className="rounded-2xl"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {statusTabs.map((tab) => {
                        const count = tab.key === 'ALL'
                          ? applications.length
                          : (statusCounts[tab.key] || 0);
                        const active = statusFilter === tab.key;
                        return (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setStatusFilter(tab.key)}
                            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                              active ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {tab.label}
                            <span className={`ml-2 ${active ? 'text-blue-100' : 'text-slate-400'}`}>{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-900">Recent Applications</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {selectedJob ? `${selectedJob.title}` : 'No active job selected'}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-slate-500">{filteredApplications.length} Total</p>
                  </div>

                  {!selectedJobId ? (
                    <p className="text-sm text-slate-500">Post a job first to start receiving applications.</p>
                  ) : loading ? (
                    <div className="grid gap-5 md:grid-cols-2">
                      {Array.from({ length: 4 }, (_, index) => (
                        <div key={index} className="h-56 animate-pulse rounded-[24px] bg-slate-100" />
                      ))}
                    </div>
                  ) : filteredApplications.length === 0 ? (
                    <p className="text-sm text-slate-500">No applicants found. Update filters or select a different job.</p>
                  ) : (
                    <div className="grid gap-5 md:grid-cols-2">
                      {filteredApplications.map((application) => (
                        <button
                          key={application.id}
                          type="button"
                          onClick={() => setSelectedApplicationId(application.id)}
                          className={`rounded-[24px] border p-5 text-left shadow-sm transition ${
                            selectedApplicationId === application.id
                              ? 'border-blue-200 bg-blue-50/60'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                                {getInitials(application.userName)}
                              </div>
                              <div>
                                <p className="text-2xl font-medium text-slate-900">{application.userName}</p>
                                <p className="mt-1 text-sm text-slate-500">{application.userHeadline || application.jobTitle}</p>
                              </div>
                            </div>
                            {application.assessmentScore != null && (
                              <div className="text-right">
                                <p className="text-xl font-semibold text-blue-600">{Math.round(application.assessmentScore)}%</p>
                                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Score</p>
                              </div>
                            )}
                          </div>

                          <div className="mt-5 flex flex-wrap gap-2">
                            {extractTags(application).map((tag) => (
                              <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                {tag}
                              </span>
                            ))}
                          </div>

                          <div className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-500">
                            <div className="flex items-center justify-between gap-4">
                              <span>{formatRelative(application.createdAt)}</span>
                              <span>{application.userLocation || 'Location not added'}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-5">
                  <h2 className="text-2xl font-semibold text-slate-900">Hiring Pipeline Overview</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className="border-b border-slate-200 text-sm text-slate-500">
                      <tr>
                        <th className="px-6 py-4 font-medium">Candidate</th>
                        <th className="px-4 py-4 font-medium">Role Applied For</th>
                        <th className="px-4 py-4 font-medium">Stage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplications.map((application) => (
                        <tr key={application.id} className="border-b border-slate-100">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                                {getInitials(application.userName)}
                              </div>
                              <div>
                                <p className="text-base font-medium text-slate-900">{application.userName}</p>
                                <p className="text-sm text-slate-500">{application.userEmail || 'No email available'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-5 text-base text-slate-700">{application.jobTitle}</td>
                          <td className="px-4 py-5">
                            <StatusBadge status={application.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                {selectedApplication ? (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-700">
                          {getInitials(selectedApplication.userName)}
                        </div>
                        <div>
                          <p className="text-3xl font-semibold text-slate-900">{selectedApplication.userName}</p>
                          <p className="mt-1 text-sm text-slate-500">{selectedApplication.userHeadline || selectedApplication.jobTitle}</p>
                        </div>
                      </div>
                      <StatusBadge status={selectedApplication.status} />
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <DetailField label="Email" value={selectedApplication.userEmail || 'Not available'} />
                      <DetailField label="Phone" value={selectedApplication.userPhone || 'Not available'} />
                    </div>

                    <div className="mt-6 rounded-[24px] border border-slate-200 p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Assessment Results</p>
                        <Badge variant={selectedApplication.assessmentPassed ? 'success' : 'default'}>
                          {selectedApplication.assessmentScore != null ? `${Math.round(selectedApplication.assessmentScore)}% Overall` : 'No result yet'}
                        </Badge>
                      </div>

                      {selectedApplication.assessmentScore != null ? (
                        <div className="space-y-4">
                          <ProgressRow
                            label="Overall Score"
                            value={Math.round(selectedApplication.assessmentScore)}
                          />
                          <ProgressRow
                            label="Question Accuracy"
                            value={selectedApplication.totalQuestions
                              ? Math.round(((selectedApplication.correctAnswers || 0) / selectedApplication.totalQuestions) * 100)
                              : 0}
                          />
                          <div className="text-sm text-slate-500">
                            {selectedApplication.correctAnswers || 0} / {selectedApplication.totalQuestions || 0} questions correct
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No completed assessment result is available for this candidate yet.</p>
                      )}
                    </div>

                    <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Resume</p>
                      <p className="mt-3 text-sm text-slate-500">
                        {selectedApplication.resumePath ? 'Resume is available for review.' : 'No resume uploaded with this application.'}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button
                          variant="outline"
                          className="bg-white"
                          onClick={() => openResume(false)}
                          loading={resumeLoading}
                          disabled={!selectedApplication.resumePath}
                        >
                          Open Resume
                        </Button>
                        <Button
                          variant="outline"
                          className="bg-white"
                          onClick={() => openResume(true)}
                          loading={resumeLoading}
                          disabled={!selectedApplication.resumePath}
                        >
                          Download PDF
                        </Button>
                      </div>
                    </div>

                    <div className="mt-6 rounded-[24px] border border-slate-200 p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Candidate Notes</p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                        {selectedApplication.assessmentAnalysis || selectedApplication.coverLetter || 'No notes or cover letter available.'}
                      </p>
                    </div>

                    <div className="mt-6 rounded-[24px] border border-slate-200 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Assessment Template</p>
                          <p className="mt-2 text-sm text-slate-500">Reuse any published assessment across multiple job openings.</p>
                        </div>
                        <Link to="/recruiter/assessments" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                          Manage
                        </Link>
                      </div>
                      <select
                        value={selectedAssessmentId}
                        onChange={(event) => setSelectedAssessmentId(event.target.value)}
                        className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                        disabled={assignableAssessments.length === 0}
                      >
                        {assignableAssessments.length === 0 ? (
                          <option value="">No published assessments available</option>
                        ) : (
                          assignableAssessments.map((assessment) => (
                            <option key={assessment.id} value={assessment.id}>
                              {assessment.title}{assessment.jobTitle ? ` - ${assessment.jobTitle}` : ''}
                            </option>
                          ))
                        )}
                      </select>
                      {assignableAssessments.length === 0 && (
                        <Link to="/recruiter/assessments/create" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700">
                          Create assessment
                        </Link>
                      )}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      {statusActions.map((status) => (
                        <Button
                          key={status}
                          variant={selectedApplication.status === status ? 'primary' : 'outline'}
                          className={selectedApplication.status === status ? '' : 'bg-white'}
                          onClick={() => handleStatusChange(status)}
                          disabled={
                            updatingStatus ||
                            (status === 'ASSESSMENT' && !selectedAssessmentId)
                          }
                        >
                          {formatStatusLabel(status)}
                        </Button>
                      ))}
                    </div>
                    {selectedApplication.status === 'INTERVIEW' && (
                      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
                        <p className="text-sm font-semibold text-blue-900">Interview stage is active</p>
                        <p className="mt-1 text-sm text-blue-700">
                          Use the Interview button to schedule a room. After scheduling, click Start Interview to alert the candidate and enter the live room.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Select an applicant to inspect details.</p>
                )}
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-semibold text-slate-700">Active job</label>
                  <select
                    value={selectedJobId || ''}
                    onChange={(event) => setSelectedJobId(Number(event.target.value))}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  >
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      {interviewModalOpen && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="border-b border-slate-200 bg-slate-950 px-6 py-5 text-white">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Schedule Interview</p>
                  <h2 className="mt-2 text-2xl font-semibold">{selectedApplication.userName}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setInterviewModalOpen(false)}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
                >
                  Close
                </button>
              </div>
            </div>

            {!createdInterview ? (
              <form onSubmit={scheduleInterview} className="space-y-4 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Interview title</span>
                    <input
                      value={interviewSchedule.title}
                      onChange={(event) => setInterviewSchedule((current) => ({ ...current, title: event.target.value }))}
                      placeholder={`${selectedApplication.jobTitle || selectedJob?.title || 'Job'} Interview`}
                      className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-400"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Schedule date and time</span>
                    <input
                      type="datetime-local"
                      required
                      value={interviewSchedule.scheduledStartAt}
                      onChange={(event) => setInterviewSchedule((current) => ({ ...current, scheduledStartAt: event.target.value }))}
                      className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-400"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Duration</span>
                    <select
                      value={interviewSchedule.durationMinutes}
                      onChange={(event) => setInterviewSchedule((current) => ({ ...current, durationMinutes: event.target.value }))}
                      className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-400"
                    >
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                      <option value="90">90 minutes</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Round</span>
                    <select
                      value={interviewSchedule.roundType}
                      onChange={(event) => setInterviewSchedule((current) => ({ ...current, roundType: event.target.value }))}
                      className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-400"
                    >
                      <option value="TECHNICAL">Technical</option>
                      <option value="CODING">Coding</option>
                      <option value="HR">HR</option>
                      <option value="SYSTEM_DESIGN">System Design</option>
                      <option value="FINAL">Final</option>
                    </select>
                  </label>
                  <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                    <span className="text-sm font-semibold text-slate-700">Recording support</span>
                    <input
                      type="checkbox"
                      checked={interviewSchedule.recordingEnabled}
                      onChange={(event) => setInterviewSchedule((current) => ({ ...current, recordingEnabled: event.target.checked }))}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </label>
                </div>

                <div className="rounded-2xl bg-blue-50 px-4 py-4 text-sm text-blue-800">
                  Candidate will receive an interview scheduled notification now. When you click Start Interview, the candidate gets an interview-started alert and can join.
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" className="bg-white" onClick={() => setInterviewModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={interviewCreating}>
                    <CalendarClock size={16} />
                    Schedule Interview
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-5 p-6">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                  <p className="font-semibold text-emerald-900">Interview scheduled successfully</p>
                  <p className="mt-1 text-sm text-emerald-700">
                    {new Date(createdInterview.scheduledStartAt).toLocaleString()} • {createdInterview.durationMinutes} minutes
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button onClick={startInterview}>
                    <Video size={16} />
                    Start Interview
                  </Button>
                  <Button variant="outline" className="bg-white" onClick={copyInvite}>
                    <Copy size={16} />
                    Copy Student Invite
                  </Button>
                </div>
                <Link to="/interviews" className="inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700">
                  Open all interview sessions
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
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

const DetailField = ({ label, value }) => {
  return (
    <div className="rounded-[20px] border border-slate-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-base font-medium text-slate-900">{value}</p>
    </div>
  );
};

const ProgressRow = ({ label, value }) => {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100">
        <div className="h-2.5 rounded-full bg-blue-600" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
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
  if (normalized === 'SHORTLISTED') variant = 'default';
  if (normalized === 'APPLIED') variant = 'default';
  return <Badge variant={variant}>{formatStatusLabel(status)}</Badge>;
};

const formatStatusLabel = (value) => {
  if (!value) return '';
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const getInitials = (value = '') => {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AP';
};

const formatRelative = (dateString) => {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
};

const extractTags = (application) => {
  const tags = [];
  if (application.userHeadline) {
    application.userHeadline
      .split(/[|,/]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 3)
      .forEach((item) => tags.push(item));
  }

  if (tags.length === 0 && application.jobTitle) {
    tags.push(application.jobTitle);
  }

  return tags.slice(0, 4);
};

const getDefaultInterviewSchedule = () => {
  const date = new Date(Date.now() + 30 * 60 * 1000);
  date.setSeconds(0, 0);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return {
    title: '',
    scheduledStartAt: new Date(date.getTime() - offsetMs).toISOString().slice(0, 16),
    durationMinutes: 60,
    roundType: 'TECHNICAL',
    recordingEnabled: false,
  };
};

export default Applicants;
