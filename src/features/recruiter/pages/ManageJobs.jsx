import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import JobTable from '../components/JobTable';
import RecruiterLayout from '../components/RecruiterLayout';
import { recruiterService, jobService } from '../../../services';

const ManageJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    location: '',
    jobType: '',
    experienceLevel: '',
    minSalary: '',
    maxSalary: '',
    skills: '',
    description: '',
  });

  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await recruiterService.getJobs();
        setJobs(response.data?.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load jobs.');
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs.filter((job) =>
      job.title.toLowerCase().includes(query) ||
      job.location?.toLowerCase().includes(query) ||
      job.jobType?.toLowerCase().includes(query)
    );
  }, [jobs, search]);

  const handleEdit = (job) => {
    setSelectedJob(job);
    setForm({
      title: job.title || '',
      description: job.description || '',
      location: job.location || '',
      jobType: job.jobType || '',
      experienceLevel: job.experienceLevel || '',
      minSalary: job.minSalary || '',
      maxSalary: job.maxSalary || '',
      skills: job.skills || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!selectedJob) return;
    setLoading(true);
    setError('');

    try {
      const payload = {
        title: form.title,
        description: form.description,
        location: form.location,
        jobType: form.jobType,
        experienceLevel: form.experienceLevel,
        minSalary: form.minSalary ? Number(form.minSalary) : null,
        maxSalary: form.maxSalary ? Number(form.maxSalary) : null,
        skills: form.skills,
      };
      const response = await jobService.updateJob(selectedJob.id, payload);
      setJobs((current) => current.map((job) => (job.id === selectedJob.id ? response.data?.data : job)));
      setSelectedJob(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RecruiterLayout
      title="Manage Jobs"
      subtitle="Edit, remove, or review job postings in your talent pipeline."
      action={<Button onClick={() => navigate('/recruiter/post-job')}>Post New Job</Button>}
    >
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Job postings</h2>
            <p className="mt-2 text-sm text-gray-500">Search, update, and organize all job listings you posted.</p>
          </div>
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs"
            className="max-w-sm"
          />
        </div>
      </Card>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <JobTable jobs={filteredJobs} onEdit={handleEdit} onDelete={handleDelete} />

      {selectedJob && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-900">Update Job: {selectedJob.title}</h3>
          <form onSubmit={handleUpdate} className="mt-6 grid gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Input name="title" label="Title" value={form.title} onChange={handleFormChange} required />
              <Input name="location" label="Location" value={form.location} onChange={handleFormChange} required />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input name="jobType" label="Job Type" value={form.jobType} onChange={handleFormChange} />
              <Input name="experienceLevel" label="Experience Level" value={form.experienceLevel} onChange={handleFormChange} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input name="minSalary" label="Min Salary" type="number" value={form.minSalary} onChange={handleFormChange} />
              <Input name="maxSalary" label="Max Salary" type="number" value={form.maxSalary} onChange={handleFormChange} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Skills</label>
              <textarea
                name="skills"
                value={form.skills}
                onChange={handleFormChange}
                rows="3"
                className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleFormChange}
                rows="5"
                className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" type="button" onClick={() => setSelectedJob(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Save changes
              </Button>
            </div>
          </form>
        </Card>
      )}
    </RecruiterLayout>
  );
};

export default ManageJobs;
