import React, { useEffect, useState } from 'react';
import { BellRing, Edit3, Pause, Play, Plus, Search, Trash2 } from 'lucide-react';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { savedSearchService } from '../../../services';

const emptyForm = {
  name: '', keyword: '', location: '', skills: '', experienceLevel: '',
  jobType: '', workplaceType: '', minSalary: '', maxSalary: '', frequency: 'IMMEDIATE', enabled: true,
};

const SavedSearchesPage = () => {
  const [searches, setSearches] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadSearches = async () => {
    setLoading(true);
    try {
      const response = await savedSearchService.getAll();
      setSearches(response.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load saved searches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSearches(); }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    const payload = {
      ...form,
      minSalary: form.minSalary === '' ? null : Number(form.minSalary),
      maxSalary: form.maxSalary === '' ? null : Number(form.maxSalary),
    };
    try {
      if (editingId) await savedSearchService.update(editingId, payload);
      else await savedSearchService.create(payload);
      setForm(emptyForm);
      setEditingId(null);
      setMessage(editingId ? 'Saved search updated.' : 'Saved search created.');
      await loadSearches();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save this search.');
    } finally {
      setSaving(false);
    }
  };

  const editSearch = (search) => {
    setEditingId(search.id);
    setForm({ ...emptyForm, ...search, minSalary: search.minSalary ?? '', maxSalary: search.maxSalary ?? '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSearch = async (search) => {
    try {
      const response = search.enabled
        ? await savedSearchService.pause(search.id)
        : await savedSearchService.resume(search.id);
      setSearches((current) => current.map((item) => item.id === search.id ? response.data?.data : item));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update this search.');
    }
  };

  const deleteSearch = async (id) => {
    try {
      await savedSearchService.remove(id);
      setSearches((current) => current.filter((search) => search.id !== id));
      setMessage('Saved search deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete this search.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] py-8 text-slate-950">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Candidate workspace</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Job alerts</h1>
            <p className="mt-2 text-slate-500">Save a search and receive an in-app notification when a new job matches it.</p>
          </div>
          <Button variant="outline" onClick={() => { setEditingId(null); setForm(emptyForm); }}>
            <Plus size={16} /> New alert
          </Button>
        </div>

        {(error || message) && (
          <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {error || message}
          </div>
        )}

        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Search size={20} /></div>
            <div><h2 className="text-2xl font-semibold">{editingId ? 'Edit saved search' : 'Create a saved search'}</h2><p className="text-sm text-slate-500">Use as many filters as you need.</p></div>
          </div>
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
            <Input label="Alert name" name="name" value={form.name} onChange={handleChange} placeholder="Remote Java Developer" required />
            <Input label="Keyword" name="keyword" value={form.keyword} onChange={handleChange} placeholder="Java developer" />
            <Input label="Location" name="location" value={form.location} onChange={handleChange} placeholder="Bengaluru or Remote" />
            <Input label="Skills" name="skills" value={form.skills} onChange={handleChange} placeholder="Java, Spring Boot" />
            <SelectField label="Experience" name="experienceLevel" value={form.experienceLevel} onChange={handleChange} options={['', 'ENTRY', 'MID', 'SENIOR', 'EXECUTIVE']} />
            <SelectField label="Job type" name="jobType" value={form.jobType} onChange={handleChange} options={['', 'FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']} />
            <SelectField label="Work mode" name="workplaceType" value={form.workplaceType} onChange={handleChange} options={['', 'REMOTE', 'HYBRID', 'ON_SITE']} />
            <SelectField label="Frequency" name="frequency" value={form.frequency} onChange={handleChange} options={['IMMEDIATE', 'DAILY', 'WEEKLY']} />
            <Input label="Minimum salary" type="number" name="minSalary" value={form.minSalary} onChange={handleChange} placeholder="50000" />
            <Input label="Maximum salary" type="number" name="maxSalary" value={form.maxSalary} onChange={handleChange} placeholder="120000" />
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <Button type="submit" loading={saving}><BellRing size={16} /> {editingId ? 'Save changes' : 'Create alert'}</Button>
              {editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</Button>}
            </div>
          </form>
        </section>

        <section className="mt-6 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          <h2 className="text-2xl font-semibold">Your saved searches</h2>
          {loading ? <p className="mt-6 text-sm text-slate-500">Loading saved searches...</p> : searches.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">No saved searches yet.</div>
          ) : (
            <div className="mt-5 space-y-4">
              {searches.map((search) => (
                <article key={search.id} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold">{search.name}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${search.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{search.enabled ? 'Active' : 'Paused'}</span></div><p className="mt-2 text-sm text-slate-500">{describeSearch(search)}</p><p className="mt-2 text-xs text-slate-400">Frequency: {search.frequency}</p></div>
                    <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => editSearch(search)}><Edit3 size={14} /> Edit</Button><Button size="sm" variant="outline" onClick={() => toggleSearch(search)}>{search.enabled ? <Pause size={14} /> : <Play size={14} />}{search.enabled ? 'Pause' : 'Resume'}</Button><Button size="sm" variant="outline" onClick={() => deleteSearch(search.id)}><Trash2 size={14} /> Delete</Button></div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const SelectField = ({ label, name, value, onChange, options }) => <label className="block text-sm font-semibold text-slate-700">{label}<select name={name} value={value || ''} onChange={onChange} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">{options.map((option) => <option key={option} value={option}>{option ? option.replace(/_/g, ' ') : 'Any'}</option>)}</select></label>;

const describeSearch = (search) => [search.keyword, search.location, search.skills, search.experienceLevel, search.jobType, search.workplaceType].filter(Boolean).map((value) => String(value).replace(/_/g, ' ')).join(' • ') || 'All new active jobs';

export default SavedSearchesPage;