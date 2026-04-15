import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import RecruiterLayout from '../components/RecruiterLayout';
import { companyService, jobService } from '../../../services';

const experienceOptions = [
  { value: 'ENTRY', label: 'Entry' },
  { value: 'MID', label: 'Mid' },
  { value: 'SENIOR', label: 'Senior' },
  { value: 'EXECUTIVE', label: 'Executive' },
];

const jobTypeOptions = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERNSHIP', label: 'Internship' },
];

const PostJobPage = () => {
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [companyForm, setCompanyForm] = useState({
    name: '',
    description: '',
    website: '',
    location: '',
    industry: '',
    size: '',
  });
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    location: '',
    jobType: 'FULL_TIME',
    experienceLevel: 'MID',
    minSalary: '',
    maxSalary: '',
    skills: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    const loadCompany = async () => {
      setCompanyLoading(true);
      try {
        const response = await companyService.getMyCompany();
        const companyData = response.data?.data;
        setCompany(companyData);
        if (companyData) {
          setCompanyForm({
            name: companyData.name || '',
            description: companyData.description || '',
            website: companyData.website || '',
            location: companyData.location || '',
            industry: companyData.industry || '',
            size: companyData.size || '',
          });
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          setGeneralError(err.response?.data?.message || 'Failed to load company profile.');
        }
      } finally {
        setCompanyLoading(false);
      }
    };

    loadCompany();
  }, []);

  const handleCompanyChange = (event) => {
    const { name, value } = event.target;
    setCompanyForm((current) => ({ ...current, [name]: value }));
  };

  const handleJobChange = (event) => {
    const { name, value } = event.target;
    setJobForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: '' }));
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!companyForm.name.trim()) nextErrors.companyName = 'Company name is required';
    if (!jobForm.title.trim()) nextErrors.title = 'Job title is required';
    if (!jobForm.description.trim()) nextErrors.description = 'Job description is required';
    if (!jobForm.location.trim()) nextErrors.location = 'Job location is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const ensureCompany = async () => {
    if (company?.id) {
      const response = await companyService.updateMyCompany(companyForm);
      return response.data?.data;
    }
    const response = await companyService.createCompany(companyForm);
    return response.data?.data;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setGeneralError('');

    try {
      const companyData = await ensureCompany();
      setCompany(companyData);

      const payload = {
        title: jobForm.title,
        description: jobForm.description,
        location: jobForm.location,
        jobType: jobForm.jobType,
        experienceLevel: jobForm.experienceLevel,
        minSalary: jobForm.minSalary ? Number(jobForm.minSalary) : null,
        maxSalary: jobForm.maxSalary ? Number(jobForm.maxSalary) : null,
        skills: jobForm.skills,
        companyId: companyData.id,
      };

      await jobService.createJob(payload);
      navigate('/recruiter/dashboard');
    } catch (err) {
      console.error('Job post failed:', err);
      setGeneralError(err.response?.data?.message || 'Failed to create the job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RecruiterLayout
      title="Create Job Posting"
      subtitle="Set up your company profile and publish a role from the same workflow."
    >
      {generalError && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-900">Company Profile</h2>
            <p className="mt-2 text-sm text-gray-500">
              {companyLoading ? 'Loading company profile...' : company ? 'Update your company profile before posting.' : 'Create your company profile to unlock job posting.'}
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="Company Name"
              name="name"
              value={companyForm.name}
              onChange={handleCompanyChange}
              error={errors.companyName}
              required
            />
            <Input label="Website" name="website" value={companyForm.website} onChange={handleCompanyChange} />
            <Input label="Location" name="location" value={companyForm.location} onChange={handleCompanyChange} />
            <Input label="Industry" name="industry" value={companyForm.industry} onChange={handleCompanyChange} />
            <Input label="Company Size" name="size" value={companyForm.size} onChange={handleCompanyChange} />
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Description</label>
              <textarea
                name="description"
                value={companyForm.description}
                onChange={handleCompanyChange}
                rows="6"
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-900">Job Details</h2>
            <p className="mt-2 text-sm text-gray-500">Publish a clear role with searchable fields for candidates.</p>
          </div>

          <div className="space-y-5">
            <Input label="Job Title" name="title" value={jobForm.title} onChange={handleJobChange} error={errors.title} required />

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Description</label>
              <textarea
                name="description"
                value={jobForm.description}
                onChange={handleJobChange}
                rows="7"
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Location" name="location" value={jobForm.location} onChange={handleJobChange} error={errors.location} required />
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Job Type</label>
                <select
                  name="jobType"
                  value={jobForm.jobType}
                  onChange={handleJobChange}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {jobTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input label="Minimum Salary" type="number" name="minSalary" value={jobForm.minSalary} onChange={handleJobChange} />
              <Input label="Maximum Salary" type="number" name="maxSalary" value={jobForm.maxSalary} onChange={handleJobChange} />
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Experience Level</label>
                <select
                  name="experienceLevel"
                  value={jobForm.experienceLevel}
                  onChange={handleJobChange}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {experienceOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Skills</label>
              <textarea
                name="skills"
                value={jobForm.skills}
                onChange={handleJobChange}
                rows="4"
                placeholder="React, Spring Boot, MySQL, Product Design"
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3 border-t border-gray-200 pt-6">
            <Button type="submit" loading={loading}>
              Publish job
            </Button>
            <Button variant="secondary" type="button" onClick={() => navigate('/recruiter/dashboard')}>
              Back to dashboard
            </Button>
          </div>
        </Card>
      </form>
    </RecruiterLayout>
  );
};

export default PostJobPage;
