import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  IndianRupee,
  MapPin,
  Send,
  Sparkles,
  UserRound,
} from 'lucide-react';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Card from '../../../components/common/Card';
import { bookmarkService, jobService } from '../../../services';
import { useAuthContext } from '../../../context/useAuthContext';

const SECTION_LABELS = [
  'Job Description',
  'Responsibilities',
  'Requirements',
  'Preferred Qualifications',
  'Qualifications',
  'Benefits',
  'Education',
];

const JobDetailsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, userRole } = useAuthContext();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    const loadJob = async () => {
      try {
        setLoading(true);
        const jobResponse = await jobService.getJob(jobId);

        if (isLoggedIn && userRole === 'candidate') {
          try {
            const bookmarkStatusResponse = await bookmarkService.getBookmarkStatus(jobId);
            setIsBookmarked(Boolean(bookmarkStatusResponse.data?.data));
          } catch (err) {
            console.log('Bookmark status unavailable:', err.message);
          }
        }

        setJob(jobResponse.data?.data || null);
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError(err.response?.data?.message || 'Failed to load job details.');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) loadJob();
  }, [jobId, isLoggedIn, userRole]);

  const skills = useMemo(() => {
    return job?.skills
      ? job.skills.split(',').map((item) => item.trim()).filter(Boolean)
      : [];
  }, [job?.skills]);

  const descriptionSections = useMemo(() => {
    return splitDescriptionIntoSections(job?.description || '');
  }, [job?.description]);

  const salaryLabel = formatSalary(job?.minSalary, job?.maxSalary);
  const isCandidateView = userRole !== 'recruiter';

  const handleApply = async (event) => {
    event.preventDefault();
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (!resumeFile) {
      setError('Please attach your resume before submitting.');
      return;
    }

    setIsApplying(true);
    setError('');
    try {
      await jobService.applyJob({
        jobId: Number(jobId),
        resume: resumeFile,
        coverLetter: coverLetter.trim(),
        source: 'CAREER_SITE',
      });
      setShowApplicationForm(false);
      setResumeFile(null);
      setCoverLetter('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit your application.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleBookmark = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    try {
      const response = await bookmarkService.toggleBookmark(jobId);
      setIsBookmarked(Boolean(response.data?.data?.bookmarked));
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] py-12">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
          <div className="h-72 animate-pulse rounded-[30px] bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] py-12">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
          <Card className="p-6">
            <p className="text-sm text-red-600">{error}</p>
            <div className="mt-4">
              <Button onClick={() => navigate('/jobs')}>Back to Jobs</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#f8fbff_34%,#f7fafc_74%)] py-8 text-slate-900 sm:py-10">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
        >
          <ArrowLeft size={16} />
          Back to listings
        </button>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-[30px] border border-white bg-white shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white sm:p-8 lg:p-10">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold ring-1 ring-white/20">
                  {getInitials(job.companyName)}
                </div>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-blue-100">
                    <span>{job.companyName || 'Confidential company'}</span>
                    <span className="hidden h-1 w-1 rounded-full bg-blue-200 sm:inline-block" />
                    <span>{formatDate(job.createdAt)}</span>
                  </p>
                  <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
                    {job.title || 'Untitled role'}
                  </h1>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Pill icon={MapPin} label={job.location || 'Remote'} />
                    <Pill icon={BriefcaseBusiness} label={formatLabel(job.jobType) || 'Open role'} />
                    <Pill icon={Sparkles} label={formatLabel(job.experienceLevel) || 'All levels'} />
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <HeroMetric icon={IndianRupee} label="Compensation" value={salaryLabel} />
                <HeroMetric icon={Clock3} label="Type" value={formatLabel(job.jobType) || 'Open role'} />
                <HeroMetric icon={CalendarDays} label="Posted" value={formatDate(job.createdAt)} />
              </div>
            </div>

            <aside className="border-t border-slate-200 bg-slate-50 p-6 lg:border-l lg:border-t-0">
              {isCandidateView && (
                <div className="grid gap-3">
                  <Button
                    onClick={() => setShowApplicationForm(true)}
                    className="min-h-12 justify-center gap-2 rounded-2xl"
                  >
                    <Send size={17} />
                    {isLoggedIn ? 'Apply Now' : 'Sign In to Apply'}
                  </Button>
                  <Button
                    variant="outline"
                    className="min-h-12 justify-center gap-2 rounded-2xl border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    onClick={handleBookmark}
                  >
                    <Bookmark size={17} className={isBookmarked ? 'fill-blue-600 text-blue-600' : ''} />
                    {isBookmarked ? 'Saved' : 'Save Job'}
                  </Button>
                </div>
              )}

              <div className="mt-6 space-y-4 rounded-3xl bg-white p-5 shadow-sm">
                <DetailRow label="Recruiter" value={job.recruiterName || 'Recruiter team'} icon={UserRound} />
                <DetailRow label="Company" value={job.companyName || 'Confidential company'} icon={BriefcaseBusiness} />
                <DetailRow label="Location" value={job.location || 'Remote'} icon={MapPin} />
              </div>
            </aside>
          </div>
        </section>

        {showApplicationForm && isCandidateView && (
          <Card className="mt-6 overflow-hidden border-blue-100 p-0 shadow-[0_18px_50px_rgba(37,99,235,0.10)]">
            <div className="border-b border-slate-100 bg-blue-50/70 px-6 py-5">
              <h2 className="text-xl font-semibold text-slate-950">Submit Application</h2>
              <p className="mt-1 text-sm text-slate-600">Attach your resume and add a short note for the recruiter.</p>
            </div>
            <form onSubmit={handleApply} className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Resume</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                  className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Cover Letter</label>
                <textarea
                  value={coverLetter}
                  onChange={(event) => setCoverLetter(event.target.value)}
                  rows="5"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  placeholder="Share why this role is a good fit."
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" loading={isApplying}>Submit Application</Button>
                <Button variant="outline" onClick={() => setShowApplicationForm(false)} disabled={isApplying}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-6">
            <Card className="p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-950">About this role</h2>
                  <p className="text-sm text-slate-500">Full description from the recruiter.</p>
                </div>
              </div>

              {descriptionSections.length > 0 ? (
                <div className="space-y-6">
                  {descriptionSections.map((section) => (
                    <DescriptionSection key={section.title} section={section} />
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-7 text-slate-600">No description added yet.</p>
              )}
            </Card>

            <Card className="p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-semibold text-slate-950">Skills and requirements</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {skills.length > 0 ? skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700"
                  >
                    {skill}
                  </span>
                )) : <p className="text-sm text-slate-500">No specific skills listed.</p>}
              </div>
            </Card>
          </section>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <Card className="p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">Job snapshot</h2>
              <div className="mt-5 space-y-3">
                <SnapshotItem label="Compensation" value={salaryLabel} />
                <SnapshotItem label="Experience" value={formatLabel(job.experienceLevel) || 'Open'} />
                <SnapshotItem label="Work mode" value={formatLabel(job.jobType) || 'Open role'} />
                <SnapshotItem label="Published" value={formatDate(job.createdAt)} />
              </div>
            </Card>

            <div className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-600 to-cyan-500 p-6 text-white shadow-[0_18px_45px_rgba(37,99,235,0.22)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-50">Candidate tip</p>
              <h3 className="mt-3 text-2xl font-semibold">Tailor your resume before applying.</h3>
              <p className="mt-3 text-sm leading-6 text-blue-50">
                Highlight the skills listed here and include project examples that match the role expectations.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const Pill = ({ icon: Icon, label }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white">
    <Icon size={14} />
    {label}
  </span>
);

const HeroMetric = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-100">
      <Icon size={15} />
      {label}
    </div>
    <p className="mt-2 text-base font-semibold text-white">{value}</p>
  </div>
);

const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
      <Icon size={17} />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</p>
    </div>
  </div>
);

const DescriptionSection = ({ section }) => (
  <div>
    <h3 className="text-lg font-semibold text-slate-950">{section.title}</h3>
    <div className="mt-3 space-y-2">
      {section.items.map((item, index) => (
        <p key={`${section.title}-${index}`} className="text-sm leading-7 text-slate-600">
          {item}
        </p>
      ))}
    </div>
  </div>
);

const SnapshotItem = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-right text-sm font-semibold text-slate-950">{value}</span>
  </div>
);

const splitDescriptionIntoSections = (description) => {
  const cleaned = description.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];

  const escapedLabels = SECTION_LABELS.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const labelPattern = new RegExp(`\\b(${escapedLabels.join('|')})\\b`, 'gi');
  const matches = [...cleaned.matchAll(labelPattern)];

  if (matches.length === 0) {
    return [{ title: 'Overview', items: splitReadableSentences(cleaned) }];
  }

  const sections = [];
  const intro = cleaned.slice(0, matches[0].index).trim();
  if (intro) {
    sections.push({ title: 'Overview', items: splitReadableSentences(intro) });
  }

  matches.forEach((match, index) => {
    const title = formatLabel(match[1]);
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? cleaned.length;
    const content = cleaned.slice(start, end).replace(/^[:\s-]+/, '').trim();

    if (content) {
      sections.push({ title, items: splitReadableSentences(content) });
    }
  });

  return sections;
};

const splitReadableSentences = (content) => {
  const parts = content
    .split(/(?<=[.!?])\s+|(?:\s+-\s+)/)
    .map((item) => item.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts : [content];
};

const formatLabel = (value) => {
  if (!value) return '';
  return String(value)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatSalary = (minSalary, maxSalary) => {
  const min = Number(minSalary);
  const max = Number(maxSalary);
  const hasMin = Number.isFinite(min) && min > 0;
  const hasMax = Number.isFinite(max) && max > 0;

  if (hasMin && hasMax) {
    if (min === max) return `INR ${formatLpa(min)}`;
    return `INR ${formatLpa(min)} - ${formatLpa(max)}`;
  }
  if (hasMin) return `INR ${formatLpa(min)}+`;
  if (hasMax) return `Up to INR ${formatLpa(max)}`;
  return 'Not disclosed';
};

const formatLpa = (value) => {
  const lpa = value / 100000;
  const formatted = Number.isInteger(lpa) ? lpa.toString() : lpa.toFixed(1);
  return `${formatted} LPA`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Recently posted';
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getInitials = (value) => {
  return (value || 'Job Portal')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'JP';
};

export default JobDetailsPage;
