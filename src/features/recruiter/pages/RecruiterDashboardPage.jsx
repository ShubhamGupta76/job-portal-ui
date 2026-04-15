import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import RecruiterLayout from '../components/RecruiterLayout';
import { dashboardService, recruiterService, applicationService } from '../../../services';

const RecruiterDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [dashboardRes, jobsRes, applicationsRes] = await Promise.all([
          dashboardService.getRecruiterDashboard(),
          recruiterService.getJobs(),
          applicationService.getRecruiterApplications(),
        ]);

        setDashboard(dashboardRes.data?.data);
        setJobs(jobsRes.data?.data || []);
        const applicationPayload = applicationsRes.data?.data;
        setApplications(Array.isArray(applicationPayload?.content) ? applicationPayload.content : []);

        try {
          const companyRes = await recruiterService.getCompanyProfile();
          setCompany(companyRes.data?.data || null);
        } catch (companyErr) {
          if (companyErr.response?.status !== 404) {
            throw companyErr;
          }
          setCompany(null);
        }
      } catch (err) {
        console.error('Recruiter dashboard load error:', err);
        setError(err.response?.data?.message || 'Failed to load recruiter dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleStatusChange = async (applicationId, status) => {
    try {
      await applicationService.updateStatus(applicationId, status);
      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId ? { ...application, status } : application
        )
      );
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <p className="text-sm text-gray-500">Loading recruiter workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <RecruiterLayout
      title="Recruiter Dashboard"
      subtitle="Manage company presence, jobs, applications and marketplace insights from one panel."
      action={
        <div className="flex flex-wrap gap-3">
          <Link to="/recruiter/post-job">
            <Button>Post Job</Button>
          </Link>
          <Link to="/profile">
            <Button variant="outline">Edit Profile</Button>
          </Link>
        </div>
      }
    >
      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-6">
          <p className="text-sm text-gray-500">Total jobs</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{dashboard?.totalJobs ?? 0}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500">Total applicants</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{dashboard?.totalApplicants ?? 0}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500">Shortlisted</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{dashboard?.shortlistedCount ?? 0}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500">Company profile</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">{company?.name || 'Not configured'}</p>
        </Card>
      </div>

      <div className="mb-6 flex flex-wrap gap-3 border-b border-gray-200">
        {[
          ['overview', 'Overview'],
          ['jobs', 'Jobs'],
          ['applications', 'Applicants'],
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

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900">Company</h2>
            {company ? (
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <p className="text-lg font-semibold text-gray-900">{company.name}</p>
                <p>{company.industry || 'Industry not added'}</p>
                <p>{company.location || 'Location not added'}</p>
                <p>{company.website || 'Website not added'}</p>
                <p>{company.description || 'Add a company description to improve trust with applicants.'}</p>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-gray-500">Set up your company profile before scaling your hiring operations.</p>
                <Link to="/recruiter/post-job">
                  <Button>Configure Company</Button>
                </Link>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Recent jobs</h2>
              <Link to="/recruiter/post-job">
                <Button variant="outline">New Job</Button>
              </Link>
            </div>
            {jobs.length === 0 ? (
              <p className="text-sm text-gray-500">No jobs posted yet.</p>
            ) : (
              <div className="space-y-4">
                {jobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{job.title}</p>
                        <p className="text-sm text-gray-500">{job.location || 'Remote'} • {job.companyName}</p>
                      </div>
                      <Link to={`/jobs/${job.id}`}>
                        <Button variant="outline">Open</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'jobs' && (
        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Job management</h2>
            <Link to="/recruiter/post-job">
              <Button>Post Job</Button>
            </Link>
          </div>
          {jobs.length === 0 ? (
            <p className="text-sm text-gray-500">No jobs available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="text-left text-sm text-gray-500">
                    <th className="pb-3 pr-4 font-medium">Title</th>
                    <th className="pb-3 pr-4 font-medium">Location</th>
                    <th className="pb-3 pr-4 font-medium">Type</th>
                    <th className="pb-3 pr-4 font-medium">Compensation</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td className="py-4 pr-4 text-sm text-gray-900">{job.title}</td>
                      <td className="py-4 pr-4 text-sm text-gray-600">{job.location || 'Remote'}</td>
                      <td className="py-4 pr-4 text-sm text-gray-600">{job.jobType}</td>
                      <td className="py-4 pr-4 text-sm text-gray-600">
                        {job.minSalary && job.maxSalary
                          ? `₹${job.minSalary.toLocaleString()} - ₹${job.maxSalary.toLocaleString()}`
                          : 'Not disclosed'}
                      </td>
                      <td className="py-4">
                        <Link to={`/jobs/${job.id}`}>
                          <Button variant="outline">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'applications' && (
        <Card className="p-6">
          <h2 className="mb-5 text-xl font-semibold text-gray-900">Applicants</h2>
          {applications.length === 0 ? (
            <p className="text-sm text-gray-500">No applicants have applied yet.</p>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <div key={application.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{application.userName}</p>
                      <p className="text-sm text-gray-500">{application.jobTitle}</p>
                      {application.coverLetter && (
                        <p className="mt-2 text-sm text-gray-600">{application.coverLetter}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="default">{application.status}</Badge>
                      <Button variant="outline" onClick={() => handleStatusChange(application.id, 'SHORTLISTED')}>
                        Shortlist
                      </Button>
                      <Button variant="outline" onClick={() => handleStatusChange(application.id, 'REJECTED')}>
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </RecruiterLayout>
  );
};

export default RecruiterDashboardPage;
