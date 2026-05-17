import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Input from '../../../components/common/Input';
import RecruiterLayout from '../components/RecruiterLayout';
import { companyService, jobService } from '../../../services';

const steps = [
  { key: 'basic', label: 'Basic Info', icon: 'i' },
  { key: 'details', label: 'Role Details', icon: 'd' },
  { key: 'screening', label: 'Screening', icon: 'o' },
  { key: 'economics', label: 'Economics', icon: '$' },
];

const workplaceOptions = [
  { value: 'ON_SITE', label: 'On-site', description: 'In-office full time' },
  { value: 'REMOTE', label: 'Remote', description: 'Work from anywhere' },
  { value: 'HYBRID', label: 'Hybrid', description: 'Office and remote mix' },
];

const jobTypeOptions = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERNSHIP', label: 'Internship' },
];

const experienceOptions = [
  { value: 'ENTRY', label: 'Entry Level' },
  { value: 'MID', label: 'Mid Level' },
  { value: 'SENIOR', label: 'Senior Level' },
  { value: 'EXECUTIVE', label: 'Executive' },
];

const initialCompanyForm = {
  name: '',
  description: '',
  website: '',
  location: '',
  industry: '',
  size: '',
};

const initialJobForm = {
  title: '',
  department: '',
  workplaceType: 'HYBRID',
  description: '',
  location: '',
  jobType: 'FULL_TIME',
  experienceLevel: 'MID',
  minSalary: '',
  maxSalary: '',
  skills: '',
};

const PostJobPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editingJob = location.state?.job || null;
  const isEditing = Boolean(editingJob?.id);

  const [activeStep, setActiveStep] = useState(0);
  const [company, setCompany] = useState(null);
  const [companyForm, setCompanyForm] = useState(initialCompanyForm);
  const [jobForm, setJobForm] = useState(initialJobForm);
  const [loading, setLoading] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [generalError, setGeneralError] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingJob) {
      setJobForm({
        title: editingJob.title || '',
        department: editingJob.department || '',
        workplaceType: editingJob.workplaceType || 'HYBRID',
        description: editingJob.description || '',
        location: editingJob.location || '',
        jobType: editingJob.jobType || 'FULL_TIME',
        experienceLevel: editingJob.experienceLevel || 'MID',
        minSalary: editingJob.minSalary ?? '',
        maxSalary: editingJob.maxSalary ?? '',
        skills: editingJob.skills || '',
      });
    }
  }, [editingJob]);

  useEffect(() => {
    const loadCompany = async () => {
      setCompanyLoading(true);
      setGeneralError('');
      try {
        const response = await companyService.getMyCompany();
        const companyData = response.data?.data;
        setCompany(companyData || null);
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

  const previewSkills = useMemo(
    () =>
      jobForm.skills
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 3),
    [jobForm.skills]
  );

  const salaryLabel = useMemo(() => {
    if (jobForm.minSalary && jobForm.maxSalary) {
      return `${formatCompactMoney(jobForm.minSalary)} - ${formatCompactMoney(jobForm.maxSalary)}`;
    }
    if (jobForm.minSalary) {
      return `${formatCompactMoney(jobForm.minSalary)}+`;
    }
    return 'Add salary range';
  }, [jobForm.minSalary, jobForm.maxSalary]);

  const handleCompanyChange = (event) => {
    const { name, value } = event.target;
    setCompanyForm((current) => ({ ...current, [name]: value }));
    if (errors[`company.${name}`]) {
      setErrors((current) => ({ ...current, [`company.${name}`]: '' }));
    }
  };

  const handleJobChange = (event) => {
    const { name, value } = event.target;
    setJobForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: '' }));
    }
  };

  const validateStep = (stepIndex) => {
    const nextErrors = {};

    if (stepIndex === 0) {
      if (!jobForm.title.trim()) nextErrors.title = 'Job title is required.';
      if (!jobForm.department.trim()) nextErrors.department = 'Department is required.';
      if (!jobForm.location.trim()) nextErrors.location = 'Location is required.';
    }

    if (stepIndex === 1) {
      if (!jobForm.description.trim()) nextErrors.description = 'Role description is required.';
      if (!jobForm.jobType) nextErrors.jobType = 'Employment type is required.';
      if (!jobForm.experienceLevel) nextErrors.experienceLevel = 'Experience level is required.';
    }

    if (stepIndex === 2) {
      if (!jobForm.skills.trim()) nextErrors.skills = 'Add at least one skill.';
    }

    if (stepIndex === 3) {
      if (!companyForm.name.trim()) nextErrors['company.name'] = 'Company name is required.';
      if (!companyForm.industry.trim()) nextErrors['company.industry'] = 'Industry is required.';
    }

    setErrors((current) => ({ ...current, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(activeStep)) return;
    setActiveStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((current) => Math.max(current - 1, 0));
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
    if (!validateStep(0) || !validateStep(1) || !validateStep(2) || !validateStep(3)) {
      setActiveStep(findFirstInvalidStep(jobForm, companyForm));
      return;
    }

    setLoading(true);
    setGeneralError('');

    try {
      const companyData = await ensureCompany();
      setCompany(companyData);

      const payload = {
        title: jobForm.title,
        department: jobForm.department,
        workplaceType: jobForm.workplaceType,
        description: jobForm.description,
        location: jobForm.location,
        jobType: jobForm.jobType,
        experienceLevel: jobForm.experienceLevel,
        minSalary: jobForm.minSalary ? Number(jobForm.minSalary) : null,
        maxSalary: jobForm.maxSalary ? Number(jobForm.maxSalary) : null,
        skills: jobForm.skills,
        companyId: companyData.id,
      };

      if (isEditing) {
        await jobService.updateJob(editingJob.id, payload);
      } else {
        await jobService.createJob(payload);
      }

      navigate('/recruiter/manage-jobs');
    } catch (err) {
      console.error('Job submit failed:', err);
      setGeneralError(err.response?.data?.message || 'Failed to save the job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RecruiterLayout
      title={isEditing ? 'Update Job Posting' : 'Create New Job Posting'}
      subtitle="Define the role, shape candidate expectations, and publish a stronger listing."
      navigationMode="top"
    >
      {generalError && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {generalError}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-4xl font-semibold tracking-[-0.03em] text-slate-950">
                  {isEditing ? 'Refine This Role' : 'Create New Job Posting'}
                </h2>
                <p className="mt-3 text-base text-slate-500">
                  Move through the posting steps and watch the candidate-facing preview update as you go.
                </p>
              </div>

              <div className="rounded-full bg-rose-50 px-4 py-2 text-sm font-medium text-rose-500">
                {companyLoading ? 'Loading company profile...' : company?.id ? 'Company synced' : 'Company profile needed'}
              </div>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-4">
              {steps.map((step, index) => {
                const isActive = index === activeStep;
                const isComplete = index < activeStep;

                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => setActiveStep(index)}
                    className="text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-bold transition ${
                          isActive
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : isComplete
                              ? 'border-blue-200 bg-blue-50 text-blue-600'
                              : 'border-slate-200 bg-white text-slate-400'
                        }`}
                      >
                        {step.icon}
                      </div>
                      <div className="h-px flex-1 bg-slate-200 last:hidden" />
                    </div>
                    <div className={`mt-3 text-xs font-semibold uppercase tracking-[0.24em] ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                      {step.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  {steps[activeStep].icon}
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-slate-950">{steps[activeStep].label}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {stepDescriptions[steps[activeStep].key]}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-8 py-7">
              {activeStep === 0 && (
                <div className="space-y-6">
                  <div className="grid gap-5 md:grid-cols-2">
                    <Input
                      label="Job Title"
                      name="title"
                      value={jobForm.title}
                      onChange={handleJobChange}
                      error={errors.title}
                      placeholder="Lead Visual Designer"
                    />
                    <Input
                      label="Department"
                      name="department"
                      value={jobForm.department}
                      onChange={handleJobChange}
                      error={errors.department}
                      placeholder="Marketing & Brand"
                    />
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-semibold text-slate-700">Workplace Type</p>
                    <div className="grid gap-4 md:grid-cols-3">
                      {workplaceOptions.map((option) => {
                        const isSelected = jobForm.workplaceType === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setJobForm((current) => ({ ...current, workplaceType: option.value }))}
                            className={`rounded-[24px] border p-5 text-left transition ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50 shadow-[0_12px_28px_rgba(37,99,235,0.12)]'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {option.value === 'ON_SITE' ? 'B' : option.value === 'REMOTE' ? 'G' : 'S'}
                            </div>
                            <h4 className="mt-4 text-lg font-semibold text-slate-950">{option.label}</h4>
                            <p className="mt-2 text-sm text-slate-500">{option.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Input
                    label="Location (City, Country)"
                    name="location"
                    value={jobForm.location}
                    onChange={handleJobChange}
                    error={errors.location}
                    placeholder="London, UK"
                  />
                </div>
              )}

              {activeStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Role Description</label>
                    <textarea
                      name="description"
                      value={jobForm.description}
                      onChange={handleJobChange}
                      rows="9"
                      className="w-full rounded-[24px] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500"
                      placeholder="Describe the role, outcomes, team context, and what success looks like."
                    />
                    {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <FieldSelect
                      label="Employment Type"
                      name="jobType"
                      value={jobForm.jobType}
                      onChange={handleJobChange}
                      error={errors.jobType}
                      options={jobTypeOptions}
                    />
                    <FieldSelect
                      label="Experience Level"
                      name="experienceLevel"
                      value={jobForm.experienceLevel}
                      onChange={handleJobChange}
                      error={errors.experienceLevel}
                      options={experienceOptions}
                    />
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Skills and Keywords</label>
                    <textarea
                      name="skills"
                      value={jobForm.skills}
                      onChange={handleJobChange}
                      rows="5"
                      className="w-full rounded-[24px] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500"
                      placeholder="Figma, Brand Systems, Motion Design, Art Direction"
                    />
                    {errors.skills && <p className="mt-1 text-sm text-red-500">{errors.skills}</p>}
                  </div>

                  <div className="rounded-[24px] border border-blue-100 bg-blue-50 p-5">
                    <h4 className="text-lg font-semibold text-slate-950">Screening Notes</h4>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      Skills entered here are reused across recruiter filters, candidate search, assessment matching, and analytics.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {previewSkills.length > 0 ? (
                        previewSkills.map((skill) => <Badge key={skill}>{skill}</Badge>)
                      ) : (
                        <span className="text-sm text-slate-400">Add skills to improve search relevance.</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="space-y-6">
                  <div className="grid gap-5 md:grid-cols-2">
                    <Input
                      label="Minimum Salary"
                      type="number"
                      name="minSalary"
                      value={jobForm.minSalary}
                      onChange={handleJobChange}
                      placeholder="95000"
                    />
                    <Input
                      label="Maximum Salary"
                      type="number"
                      name="maxSalary"
                      value={jobForm.maxSalary}
                      onChange={handleJobChange}
                      placeholder="140000"
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Input
                      label="Company Name"
                      name="name"
                      value={companyForm.name}
                      onChange={handleCompanyChange}
                      error={errors['company.name']}
                      placeholder="TalentHub"
                    />
                    <Input
                      label="Industry"
                      name="industry"
                      value={companyForm.industry}
                      onChange={handleCompanyChange}
                      error={errors['company.industry']}
                      placeholder="Design & Marketing"
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Input label="Website" name="website" value={companyForm.website} onChange={handleCompanyChange} placeholder="https://company.com" />
                    <Input label="Company Size" name="size" value={companyForm.size} onChange={handleCompanyChange} placeholder="51-200" />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Input label="Company Location" name="location" value={companyForm.location} onChange={handleCompanyChange} placeholder="London, UK" />
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Company Description</label>
                      <textarea
                        name="description"
                        value={companyForm.description}
                        onChange={handleCompanyChange}
                        rows="5"
                        className="w-full rounded-[24px] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500"
                        placeholder="Introduce your brand, team, and why candidates should care."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-8 py-6">
              <Button type="button" variant="outline" className="bg-white" onClick={activeStep === 0 ? () => navigate('/recruiter/dashboard') : handleBack}>
                {activeStep === 0 ? 'Back' : 'Back'}
              </Button>

              <div className="flex flex-wrap gap-3">
                {activeStep < steps.length - 1 ? (
                  <Button type="button" onClick={handleNext}>
                    Continue to {steps[activeStep + 1].label}
                  </Button>
                ) : (
                  <Button type="submit" loading={loading}>
                    {isEditing ? 'Save Job Posting' : 'Publish Job'}
                  </Button>
                )}
              </div>
            </div>
          </section>
        </form>

        <aside className="space-y-6">
          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-500">Candidate View</h3>
              <span className="h-3 w-3 rounded-full bg-rose-300" />
            </div>

            <div className="mt-5 overflow-hidden rounded-[28px] border border-slate-200 shadow-[0_18px_44px_rgba(15,23,42,0.08)]">
              <div className="bg-blue-600 px-5 py-3 text-xs font-bold uppercase tracking-[0.22em] text-white">
                Live Preview
              </div>

              <div className="bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-500">
                    B
                  </div>
                  <Badge variant="success">New</Badge>
                </div>

                <h4 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
                  {jobForm.title || 'Your job title'}
                </h4>
                <p className="mt-3 text-sm text-slate-500">
                  {[companyForm.industry || jobForm.department || 'Creative Team', jobForm.location || 'Location pending', workplaceLabel(jobForm.workplaceType)].filter(Boolean).join(' • ')}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {jobForm.workplaceType && <Badge>{workplaceLabel(jobForm.workplaceType)}</Badge>}
                  {jobForm.jobType && <Badge>{formatLabel(jobForm.jobType)}</Badge>}
                  {jobForm.experienceLevel && <Badge>{formatLabel(jobForm.experienceLevel)}</Badge>}
                </div>

                <div className="mt-6 border-t border-dashed border-slate-200 pt-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Budget Range</span>
                    <span className="font-semibold text-slate-900">{salaryLabel}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Applications</span>
                    <span className="font-medium text-emerald-500">Be the first to apply</span>
                  </div>
                </div>

                <button type="button" className="mt-6 w-full rounded-2xl bg-blue-100 px-4 py-3 text-sm font-semibold text-blue-700">
                  View Full Details
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-dashed border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-2xl font-semibold text-slate-950">Tips for Quality Posts</h3>
            <ul className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-blue-500" />Clear role titles improve discovery and candidate trust.</li>
              <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-blue-500" />Adding a salary range helps conversion and filtering.</li>
              <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-blue-500" />Relevant skills make assessments, search, and analytics more accurate.</li>
            </ul>
          </section>
        </aside>
      </div>
    </RecruiterLayout>
  );
};

const FieldSelect = ({ label, name, value, onChange, options, error }) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

const stepDescriptions = {
  basic: 'Set the role identity, department, workplace mode, and location.',
  details: 'Write a candidate-facing role summary and define employment expectations.',
  screening: 'Capture the skill signals that power search, recommendations, and assessments.',
  economics: 'Finalize compensation and sync the company brand shown to candidates.',
};

const workplaceLabel = (value) => {
  switch (value) {
    case 'ON_SITE':
      return 'On-site';
    case 'REMOTE':
      return 'Remote';
    case 'HYBRID':
      return 'Hybrid';
    default:
      return '';
  }
};

const formatLabel = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());

const formatCompactMoney = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 'Add salary';
  if (numeric >= 1000) {
    return `$${Math.round(numeric / 1000)}k`;
  }
  return `$${numeric}`;
};

const findFirstInvalidStep = (jobForm, companyForm) => {
  if (!jobForm.title.trim() || !jobForm.department.trim() || !jobForm.location.trim()) return 0;
  if (!jobForm.description.trim() || !jobForm.jobType || !jobForm.experienceLevel) return 1;
  if (!jobForm.skills.trim()) return 2;
  if (!companyForm.name.trim() || !companyForm.industry.trim()) return 3;
  return 0;
};

export default PostJobPage;
