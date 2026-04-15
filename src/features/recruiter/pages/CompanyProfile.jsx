import React, { useEffect, useState } from 'react';
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
      subtitle="Manage your company representation for candidates and job listings."
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

      <Card className="p-6">
        <form className="grid gap-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Company Name" name="name" value={company.name} onChange={handleChange} required />
            <Input label="Website" name="website" value={company.website} onChange={handleChange} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Location" name="location" value={company.location} onChange={handleChange} />
            <Input label="Industry" name="industry" value={company.industry} onChange={handleChange} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Company Size" name="size" value={company.size} onChange={handleChange} />
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Description</label>
              <textarea
                name="description"
                value={company.description}
                onChange={handleChange}
                rows="6"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={saving}>
              Save Company Profile
            </Button>
          </div>
        </form>
      </Card>
    </RecruiterLayout>
  );
};

export default CompanyProfile;
