import React, { useEffect, useState } from 'react';
import Card from '../../../components/common/Card';
import RecruiterLayout from '../components/RecruiterLayout';
import { dashboardService } from '../../../services';

const Analytics = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await dashboardService.getRecruiterDashboard();
        setDashboard(response.data?.data || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load analytics.');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const statusCounts = dashboard?.recentApplicants?.reduce((acc, application) => {
    const status = application.status || 'UNKNOWN';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {}) || {};

  if (loading) {
    return (
      <RecruiterLayout
        title="Analytics"
        subtitle="Review performance, candidate flow, and job trends across your postings."
      >
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Loading analytics...</p>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout
      title="Analytics"
      subtitle="Review performance, candidate flow, and job trends across your postings."
    >
      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-6">
          <p className="text-sm text-gray-500">Total jobs published</p>
          <p className="mt-3 text-3xl font-semibold text-gray-900">{dashboard?.totalJobs ?? 0}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500">Total applicants</p>
          <p className="mt-3 text-3xl font-semibold text-gray-900">{dashboard?.totalApplicants ?? 0}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500">Shortlisted candidates</p>
          <p className="mt-3 text-3xl font-semibold text-gray-900">{dashboard?.shortlistedCount ?? 0}</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900">Job performance</h2>
          <p className="mt-2 text-sm text-gray-500">Recent jobs and application momentum at a glance.</p>
          <div className="mt-6 space-y-4">
            {dashboard?.recentJobs?.length ? (
              dashboard.recentJobs.map((job) => (
                <div key={job.id} className="rounded-3xl border border-gray-200 p-4">
                  <p className="text-base font-semibold text-gray-900">{job.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{job.location || 'Remote'}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No recent jobs available yet.</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900">Applicant trends</h2>
          <p className="mt-2 text-sm text-gray-500">Current status distribution within recent applicants.</p>
          <div className="mt-6 space-y-3">
            {Object.entries(statusCounts).length ? (
              Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="rounded-3xl bg-gray-50 p-4">
                  <div className="flex items-center justify-between text-sm text-gray-700">
                    <span>{status}</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No application data available yet.</p>
            )}
          </div>
        </Card>
      </div>
    </RecruiterLayout>
  );
};

export default Analytics;
