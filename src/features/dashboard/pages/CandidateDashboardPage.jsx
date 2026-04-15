import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import { dashboardService, applicationService, bookmarkService, profileService } from '../../../services';

const CandidateDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('applications');
  const [dashboard, setDashboard] = useState(null);
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [dashboardRes, profileRes, applicationsRes, savedJobsRes] = await Promise.all([
          dashboardService.getCandidateDashboard(),
          profileService.getProfile(),
          applicationService.getMyApplications(),
          bookmarkService.getSavedJobs(),
        ]);

        setDashboard(dashboardRes.data?.data);
        setProfile(profileRes.data?.data);
        setApplications(applicationsRes.data?.data || []);
        setSavedJobs(savedJobsRes.data?.data || []);
      } catch (err) {
        console.error('Candidate dashboard load error:', err);
        setError(err.response?.data?.message || 'Failed to load your dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleRemoveSavedJob = async (jobId) => {
    try {
      await bookmarkService.toggleBookmark(jobId);
      setSavedJobs((current) => current.filter((job) => job.id !== jobId));
      setDashboard((current) => current ? { ...current, savedJobs: Math.max(0, current.savedJobs - 1) } : current);
    } catch (err) {
      console.error('Bookmark removal failed:', err);
    }
  };

  const getStatusVariant = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'SHORTLISTED':
        return 'success';
      case 'REJECTED':
        return 'danger';
      case 'HIRED':
        return 'primary';
      default:
        return 'warning';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Candidate Dashboard</h1>
            <p className="mt-2 text-gray-600">Track applications, saved roles, and your profile.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/jobs">
              <Button variant="outline">Browse Jobs</Button>
            </Link>
            <Link to="/profile">
              <Button>Update Profile</Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4">
          <Card className="p-6">
            <p className="text-sm text-gray-500">Applied jobs</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{dashboard?.appliedJobs ?? 0}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-500">Saved jobs</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{dashboard?.savedJobs ?? 0}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-500">Unread notifications</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{dashboard?.unreadNotifications ?? 0}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-gray-500">Resume status</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">{profile?.resumePath ? 'Uploaded' : 'Pending'}</p>
          </Card>
        </div>

        <div className="mb-6 flex flex-wrap gap-3 border-b border-gray-200">
          {[
            ['applications', 'Applications'],
            ['saved', 'Saved Jobs'],
            ['profile', 'Profile'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'applications' && (
          <Card className="p-6">
            <h2 className="mb-5 text-xl font-semibold text-gray-900">Recent applications</h2>
            {applications.length === 0 ? (
              <p className="text-sm text-gray-500">You have not applied to any jobs yet.</p>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <div key={application.id} className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{application.jobTitle}</p>
                        <p className="text-sm text-gray-500">Submitted {new Date(application.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={getStatusVariant(application.status)}>
                        {application.status}
                      </Badge>
                    </div>
                    {application.coverLetter && (
                      <p className="mt-3 text-sm text-gray-600">{application.coverLetter}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'saved' && (
          <Card className="p-6">
            <h2 className="mb-5 text-xl font-semibold text-gray-900">Saved jobs</h2>
            {savedJobs.length === 0 ? (
              <p className="text-sm text-gray-500">You do not have any saved jobs yet.</p>
            ) : (
              <div className="space-y-4">
                {savedJobs.map((job) => (
                  <div key={job.id} className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{job.title}</p>
                        <p className="text-sm text-gray-500">{job.companyName} • {job.location || 'Remote'}</p>
                        <p className="mt-2 text-sm text-gray-600">
                          {job.minSalary && job.maxSalary
                            ? `₹${job.minSalary.toLocaleString()} - ₹${job.maxSalary.toLocaleString()}`
                            : 'Compensation not disclosed'}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Link to={`/jobs/${job.id}`}>
                          <Button>View Job</Button>
                        </Link>
                        <Button variant="outline" onClick={() => handleRemoveSavedJob(job.id)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <Card className="p-6">
              <p className="text-sm text-gray-500">Name</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {[profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Complete your profile'}
              </p>
              <p className="mt-3 text-sm text-gray-600">{profile?.headline || 'Add a headline to improve recruiter visibility.'}</p>
              <div className="mt-6 space-y-3 text-sm text-gray-600">
                <p>{profile?.email}</p>
                <p>{profile?.phone || 'Phone not added'}</p>
                <p>{profile?.location || 'Location not added'}</p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Profile overview</h2>
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-gray-500">About</p>
                  <p className="mt-2 text-sm text-gray-700">{profile?.bio || 'Add your professional summary from the profile page.'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Roles</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(profile?.roles || []).map((role) => (
                      <Badge key={role} variant="default">{role}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link to="/profile">
                    <Button>Edit Profile</Button>
                  </Link>
                  <Link to="/notifications">
                    <Button variant="outline">View Notifications</Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateDashboardPage;
