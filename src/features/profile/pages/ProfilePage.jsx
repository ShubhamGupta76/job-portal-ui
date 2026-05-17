import React, { useEffect, useMemo, useState } from 'react';
import { FileText, MapPin, Phone, Save, Sparkles, Upload, UserRound } from 'lucide-react';
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

  const completion = useMemo(() => {
    const fields = [form.firstName, form.lastName, form.phone, form.headline, form.bio, form.location];
    return Math.round((fields.filter((value) => String(value || '').trim()).length / fields.length) * 100);
  }, [form]);

  const fullName = useMemo(() => {
    const name = `${form.firstName} ${form.lastName}`.trim();
    return name || 'Student Profile';
  }, [form.firstName, form.lastName]);

  const initials = useMemo(() => {
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'SP';
  }, [fullName]);

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
      <div className="min-h-screen bg-[#f6f8fc] px-6 py-10">
        <div className="mx-auto max-w-[1180px] text-sm text-slate-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] py-8 text-slate-950">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="bg-white px-6 py-8 md:px-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-blue-600 text-2xl font-semibold text-white shadow-[0_18px_34px_rgba(37,99,235,0.24)]">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Candidate identity</p>
                  <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">{fullName}</h1>
                  <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
                    Keep your profile readable, complete, and recruiter-ready.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-[#edf4ff] p-6 md:p-8 lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-600">Profile completion</p>
                  <p className="mt-2 text-5xl font-semibold text-slate-950">{completion}%</p>
                </div>
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full"
                  style={{ background: `conic-gradient(#2563eb ${completion}%, #dbeafe 0)` }}
                >
                  <div className="h-14 w-14 rounded-full bg-white" />
                </div>
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-600">
                Add headline, bio, location, and resume details to improve application quality.
              </p>
            </div>
          </div>
        </section>

        {error && <Alert tone="red" text={error} />}
        {message && <Alert tone="green" text={message} />}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
          <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-7 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <UserRound size={21} />
              </span>
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">Personal details</h2>
                <p className="mt-1 text-sm text-slate-500">This information appears on applications and recruiter views.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="First name">
                <Input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First name" />
              </Field>
              <Field label="Last name">
                <Input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last name" />
              </Field>
              <Field label="Phone">
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <Input className="pl-11" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone number" />
                </div>
              </Field>
              <Field label="Location">
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <Input className="pl-11" name="location" value={form.location} onChange={handleChange} placeholder="City, country" />
                </div>
              </Field>
              <div className="md:col-span-2">
                <Field label="Headline">
                  <Input name="headline" value={form.headline} onChange={handleChange} placeholder="Software Engineer | React | Spring Boot" />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Bio">
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    rows="7"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    placeholder="Write a short summary about your skills, projects, and career goals."
                  />
                </Field>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Sparkles size={21} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Profile tips</h2>
                  <p className="text-sm text-slate-500">Improve visibility</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <Tip done={Boolean(form.headline)} label="Add a clear professional headline" />
                <Tip done={Boolean(form.bio)} label="Write a concise bio" />
                <Tip done={Boolean(form.location)} label="Add your location" />
                <Tip done={Boolean(form.phone)} label="Keep contact info updated" />
              </div>
            </section>

            <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <FileText size={21} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Resume</h2>
                  <p className="text-sm text-slate-500">PDF preferred</p>
                </div>
              </div>

              <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center transition hover:border-blue-300 hover:bg-blue-50">
                <Upload size={24} className="text-blue-600" />
                <span className="mt-3 text-sm font-semibold text-slate-800">
                  {form.resume ? form.resume.name : 'Upload resume'}
                </span>
                <span className="mt-1 text-xs text-slate-500">Choose an updated file</span>
                <input type="file" name="resume" onChange={handleChange} className="hidden" />
              </label>
            </section>

            <Button type="submit" loading={saving} className="w-full">
              <Save size={16} />
              Save Changes
            </Button>
          </aside>
        </form>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
    {children}
  </label>
);

const Alert = ({ tone, text }) => {
  const classes = tone === 'green'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-red-200 bg-red-50 text-red-700';
  return <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${classes}`}>{text}</div>;
};

const Tip = ({ done, label }) => (
  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
    <span className="text-sm text-slate-700">{label}</span>
    <span className={`h-2.5 w-2.5 rounded-full ${done ? 'bg-emerald-500' : 'bg-slate-300'}`} />
  </div>
);

export default ProfilePage;
