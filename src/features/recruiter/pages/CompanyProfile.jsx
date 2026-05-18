import React, { useEffect, useState } from 'react';
import { Building2, Globe2, MapPin, Save, Sparkles, UsersRound } from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import RecruiterLayout from '../components/RecruiterLayout';
import { recruiterService } from '../../../services';

const CompanyProfile = () => {
  const [company, setCompany] = useState({
    name: '',
    description: '',
    website: '',
    location: '',
    industry: '',
    size: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await recruiterService.getCompanyProfile();
        const profile = response.data?.data || {};
        setCompany({
          name: profile.name || '',
          description: profile.description || '',
          website: profile.website || '',
          location: profile.location || '',
          industry: profile.industry || '',
          size: profile.size || '',
        });
      } catch (err) {
        if (err.response?.status !== 404) {
          setError(err.response?.data?.message || 'Unable to load company profile.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCompany((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await recruiterService.updateCompanyProfile(company);
      setSuccess('Company profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save company profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <RecruiterLayout
        title="Company Profile"
        subtitle="Manage your company representation for candidates and job listings."
        navigationMode="top"
      >
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Loading company profile...</p>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout
      title="Company Profile"
      subtitle="Shape how candidates see your company across jobs, applications, and assessments."
      navigationMode="top"
      action={
        <Button type="submit" form="company-profile-form" loading={saving}>
          <Save size={16} />
          Save Profile
        </Button>
      }
    >
      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-3xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="overflow-hidden border-0 bg-white p-0 shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
          <div className="bg-[linear-gradient(135deg,#0f172a_0%,#0f766e_62%,#f97316_150%)] px-6 py-7 text-white sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-100">Employer brand</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">Company details</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/85">
                  Keep this profile accurate so candidates understand who they are applying to.
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/14 ring-1 ring-white/20">
                <Building2 size={26} aria-hidden="true" />
              </div>
            </div>
          </div>

          <form id="company-profile-form" className="grid gap-6 p-6 sm:p-8" onSubmit={handleSubmit}>
            <section className="grid gap-5 lg:grid-cols-2">
              <Input label="Company Name" name="name" value={company.name} onChange={handleChange} required />
              <Input label="Website" name="website" value={company.website} onChange={handleChange} placeholder="https://company.com" />
              <Input label="Location" name="location" value={company.location} onChange={handleChange} placeholder="Bengaluru, India" />
              <Input label="Industry" name="industry" value={company.industry} onChange={handleChange} placeholder="Technology, Staffing, SaaS..." />
              <Input label="Company Size" name="size" value={company.size} onChange={handleChange} placeholder="51-200 employees" />
            </section>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
              <textarea
                name="description"
                value={company.description}
                onChange={handleChange}
                rows="8"
                className="w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Describe your company culture, hiring focus, products, and what makes your workplace attractive to candidates."
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">Changes are shown to candidates on jobs and hiring workflows.</p>
              <Button type="submit" loading={saving}>
                <Save size={16} />
                Save Company Profile
              </Button>
            </div>
          </form>
        </Card>

        <aside className="space-y-6">
          <Card className="overflow-hidden border-0 bg-white p-0 shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
            <div className="bg-teal-50 px-6 py-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Live preview</p>
              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-teal-600 text-xl font-bold text-white shadow-[0_18px_36px_rgba(13,148,136,0.22)]">
                  {getInitials(company.name)}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-2xl font-semibold text-slate-950">{company.name || 'Company name'}</h3>
                  <p className="mt-1 text-sm text-slate-500">{company.industry || 'Industry not added'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <PreviewRow icon={MapPin} label="Location" value={company.location || 'Location not added'} />
              <PreviewRow icon={UsersRound} label="Company size" value={company.size || 'Team size not added'} />
              <PreviewRow icon={Globe2} label="Website" value={company.website || 'Website not added'} />
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">About</p>
                <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-600">
                  {company.description || 'Add a short company description so candidates can understand your culture and work.'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-0 bg-[linear-gradient(135deg,#fff7ed_0%,#ecfdf5_100%)] p-6 shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white">
                <Sparkles size={21} aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950">Profile quality</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Complete name, location, industry, size, website, and description to make job posts feel more trustworthy.
                </p>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </RecruiterLayout>
  );
};

const PreviewRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-4">
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
      {React.createElement(Icon, { size: 18, 'aria-hidden': 'true' })}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">{value}</p>
    </div>
  </div>
);

const getInitials = (value = '') => {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'CP';
};

export default CompanyProfile;
