import React, { useEffect, useState } from 'react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { profileService } from '../../../services';

const ProfilePage = () => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    headline: '',
    bio: '',
    location: '',
    resume: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const response = await profileService.getProfile();
        const profile = response.data?.data;
        setForm((current) => ({
          ...current,
          firstName: profile?.firstName || '',
          lastName: profile?.lastName || '',
          phone: profile?.phone || '',
          headline: profile?.headline || '',
          bio: profile?.bio || '',
          location: profile?.location || '',
          resume: null,
        }));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setForm((current) => ({
      ...current,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await profileService.updateProfile(form);
      setMessage('Profile updated successfully.');
      setForm((current) => ({ ...current, resume: null }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="mx-auto max-w-[1000px] px-4 sm:px-6 lg:px-10">
          <p className="text-sm text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-[1000px] px-4 sm:px-6 lg:px-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="mt-2 text-gray-600">Keep your professional identity up to date for candidates and recruiters.</p>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {message && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="First Name" name="firstName" value={form.firstName} onChange={handleChange} />
              <Input label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} />
              <Input label="Location" name="location" value={form.location} onChange={handleChange} />
            </div>

            <Input label="Headline" name="headline" value={form.headline} onChange={handleChange} />

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Bio</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows="6"
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Resume</label>
              <input
                type="file"
                name="resume"
                onChange={handleChange}
                className="w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-4 text-sm text-gray-600"
              />
            </div>

            <div className="flex gap-3 border-t border-gray-200 pt-6">
              <Button type="submit" loading={saving}>Save Changes</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
