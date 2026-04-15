import React, { useEffect, useMemo, useState } from 'react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import ApplicantCard from '../components/ApplicantCard';
import RecruiterLayout from '../components/RecruiterLayout';
import { recruiterService, applicationService } from '../../../services';

const statusOptions = ['ALL', 'APPLIED', 'SHORTLISTED', 'REJECTED', 'HIRED'];

const Applicants = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadJobs = async () => {
      setError('');
      try {
        const response = await recruiterService.getJobs();
        const jobList = response.data?.data || [];
        setJobs(jobList);
        setSelectedJobId((current) => current || jobList[0]?.id);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load jobs.');
      }
    };

    loadJobs();
  }, []);

  useEffect(() => {
    if (!selectedJobId) return;

    const loadApplications = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await applicationService.getApplicationsByJob(selectedJobId);
        setApplications(response.data?.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load applicants.');
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, [selectedJobId]);

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();
    return applications.filter((application) => {
      const matchesSearch =
        application.userName?.toLowerCase().includes(query) ||
        application.jobTitle?.toLowerCase().includes(query) ||
        application.coverLetter?.toLowerCase().includes(query);

      const matchesStatus = statusFilter === 'ALL' || application.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const handleStatusChange = async (applicationId, status) => {
    if (status === 'ALL') return;
    try {
      await applicationService.updateStatus(applicationId, status);
      setApplications((current) =>
        current.map((item) => (item.id === applicationId ? { ...item, status } : item))
      );
    } catch (err) {
      console.error('Unable to update status:', err);
    }
  };

  return (
    <RecruiterLayout
      title="Applicant Management"
      subtitle="Review candidates, filter by status, and move talent through your hiring funnel."
    >
      <Card className="p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Review applicants</h2>
            <p className="mt-2 text-sm text-gray-500">Select a job to inspect applications for that opening.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={selectedJobId || ''}
              onChange={(e) => setSelectedJobId(Number(e.target.value))}
              className="rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Candidates</h3>
            <p className="mt-1 text-sm text-gray-500">Search applicants by name, cover letter, or job title.</p>
          </div>
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates"
            className="max-w-sm"
          />
        </div>
      </Card>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-28 rounded-3xl bg-white p-6 shadow-sm animate-pulse" />
          ))}
        </div>
      ) : filteredApplications.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-gray-500">No applicants found. Update filters or select a different job.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <ApplicantCard
              key={application.id}
              application={application}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </RecruiterLayout>
  );
};

export default Applicants;
