import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Card from '../../../components/common/Card';
import { bookmarkService, jobService } from '../../../services';
import { useAuthContext } from '../../../context/useAuthContext';

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
        const jobPromise = jobService.getJob(jobId);
        const jobResponse = await jobPromise;

        let bookmarkStatusResponse = { status: 'rejected' };
        if (isLoggedIn && userRole === 'candidate') {
          try {
            bookmarkStatusResponse = await bookmarkService.getBookmarkStatus(jobId);
          } catch (err) {
            console.log('Bookmark status unavailable:', err.message);
          }
        }

        setJob(jobResponse.data?.data || null);

        if (bookmarkStatusResponse.status === 'fulfilled') {
          setIsBookmarked(Boolean(bookmarkStatusResponse.data?.data));
        }
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError(err.response?.data?.message || 'Failed to load job details.');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) loadJob();
  }, [jobId]);

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
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10">
          <p className="text-sm text-gray-500">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10">
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

  const skills = job?.skills ? job.skills.split(',').map((item) => item.trim()) : [];

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-sm font-medium text-purple-600"
        >
          Back to listings
        </button>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm text-gray-500">{job.companyName}</p>
              <h1 className="mt-2 text-4xl font-bold text-gray-900">{job.title}</h1>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="primary">{job.location || 'Remote'}</Badge>
                <Badge variant="secondary">{job.jobType}</Badge>
                <Badge variant="success">{job.experienceLevel}</Badge>
              </div>
              <p className="mt-6 text-sm leading-7 text-gray-600">{job.description}</p>
            </div>
            {(userRole !== 'recruiter') && (
              <div className="flex flex-col gap-3 lg:min-w-52">
                <Button onClick={() => setShowApplicationForm(true)}>
                  {isLoggedIn ? 'Apply Now' : 'Sign In to Apply'}
                </Button>
                <Button variant="outline" onClick={handleBookmark}>
                  {isBookmarked ? 'Saved' : 'Save Job'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {showApplicationForm && userRole !== 'recruiter' && (
          <Card className="mb-6 p-6">
            <h2 className="text-xl font-semibold text-gray-900">Submit Application</h2>
            <form onSubmit={handleApply} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Resume</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                  className="w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-4 text-sm text-gray-600"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Cover Letter</label>
                <textarea
                  value={coverLetter}
                  onChange={(event) => setCoverLetter(event.target.value)}
                  rows="5"
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" loading={isApplying}>Submit</Button>
                <Button variant="outline" onClick={() => setShowApplicationForm(false)} disabled={isApplying}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900">Requirements</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {skills.length > 0 ? skills.map((skill) => (
                <Badge key={skill} variant="default">{skill}</Badge>
              )) : <p className="text-sm text-gray-500">No specific skills listed.</p>}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900">Details</h2>
            <div className="mt-5 space-y-4 text-sm text-gray-600">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Compensation</p>
                <p className="mt-1 text-base font-medium text-gray-900">
                  {job.minSalary && job.maxSalary
                    ? `₹${job.minSalary.toLocaleString()} - ₹${job.maxSalary.toLocaleString()}`
                    : 'Not disclosed'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Published</p>
                <p className="mt-1 text-base font-medium text-gray-900">
                  {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Recruiter</p>
                <p className="mt-1 text-base font-medium text-gray-900">{job.recruiterName}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsPage;
