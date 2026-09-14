import React, { useEffect, useRef, useState } from 'react';
import {
  BadgeCheck, Download, Eye, FileText, Pencil, RefreshCw, Star, Trash2, UploadCloud,
} from 'lucide-react';
import Button from '../../../components/common/Button';
import { resumeLibraryService } from '../../../services';

const MAX_RESUMES = 10;

const formatSize = (bytes) => {
  if (!bytes) return '';
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const CandidateResumesPage = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const uploadInputRef = useRef(null);
  const replaceInputRef = useRef(null);
  const replaceTargetId = useRef(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await resumeLibraryService.list();
      setResumes(response.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load your resumes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await resumeLibraryService.upload(file, file.name.replace(/\.[^/.]+$/, ''));
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to upload this resume.');
    } finally {
      setUploading(false);
    }
  };

  const handleReplace = async (event) => {
    const file = event.target.files?.[0];
    const targetId = replaceTargetId.current;
    event.target.value = '';
    if (!file || !targetId) return;
    setBusyId(targetId);
    setError('');
    try {
      await resumeLibraryService.replace(targetId, file);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to replace this resume.');
    } finally {
      setBusyId(null);
    }
  };

  const startReplace = (id) => {
    replaceTargetId.current = id;
    replaceInputRef.current?.click();
  };

  const handleSetPrimary = async (id) => {
    setBusyId(id);
    setError('');
    try {
      await resumeLibraryService.setPrimary(id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to set this resume as primary.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id, label) => {
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    setBusyId(id);
    setError('');
    try {
      await resumeLibraryService.remove(id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete this resume.');
    } finally {
      setBusyId(null);
    }
  };

  const startRename = (resume) => {
    setRenamingId(resume.id);
    setRenameValue(resume.label);
  };

  const submitRename = async (id) => {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    setBusyId(id);
    try {
      await resumeLibraryService.rename(id, renameValue.trim());
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to rename this resume.');
    } finally {
      setBusyId(null);
      setRenamingId(null);
    }
  };

  const openResume = async (id, download) => {
    try {
      const response = await resumeLibraryService.download(id, download);
      const url = URL.createObjectURL(response.data);
      if (download) {
        const link = document.createElement('a');
        link.href = url;
        link.download = 'resume';
        link.click();
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError('Unable to open this resume.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] py-8 text-slate-950">
      <div className="mx-auto max-w-[900px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="text-3xl font-semibold">Resume library</h1>
              <p className="mt-1 text-sm text-slate-500">Keep multiple tailored resumes and pick one when you apply.</p>
            </div>
          </div>
          <div>
            <input ref={uploadInputRef} type="file" className="hidden" onChange={handleUpload} accept=".pdf,.doc,.docx,.txt,.rtf" />
            <Button onClick={() => uploadInputRef.current?.click()} loading={uploading} disabled={resumes.length >= MAX_RESUMES}>
              <UploadCloud size={16} /> Upload resume
            </Button>
          </div>
        </div>
        <input ref={replaceInputRef} type="file" className="hidden" onChange={handleReplace} accept=".pdf,.doc,.docx,.txt,.rtf" />

        {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {resumes.length >= MAX_RESUMES && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You've reached the maximum of {MAX_RESUMES} resumes. Delete one to add another.
          </div>
        )}

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : resumes.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="mx-auto text-slate-300" size={32} />
              <p className="mt-4 font-semibold text-slate-700">No resumes yet</p>
              <p className="mt-1 text-sm text-slate-500">Upload a resume to apply to jobs faster and keep versions organized.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {resumes.map((resume) => (
                <li key={resume.id} className={`rounded-2xl border p-4 ${resume.primary ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {renamingId === resume.id ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(event) => setRenameValue(event.target.value)}
                          onBlur={() => submitRename(resume.id)}
                          onKeyDown={(event) => { if (event.key === 'Enter') submitRename(resume.id); if (event.key === 'Escape') setRenamingId(null); }}
                          className="w-full rounded-lg border border-blue-300 px-2 py-1 text-base font-semibold outline-none"
                        />
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-base font-semibold text-slate-900">{resume.label}</p>
                          {resume.primary && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                              <BadgeCheck size={12} /> Primary
                            </span>
                          )}
                        </div>
                      )}
                      <p className="mt-1 truncate text-sm text-slate-500">
                        {resume.filename} {resume.fileSize ? `- ${formatSize(resume.fileSize)}` : ''}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Uploaded {resume.uploadedAt ? new Date(resume.uploadedAt).toLocaleDateString() : 'recently'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <IconAction label="Preview" icon={Eye} onClick={() => openResume(resume.id, false)} />
                      <IconAction label="Download" icon={Download} onClick={() => openResume(resume.id, true)} />
                      <IconAction label="Rename" icon={Pencil} onClick={() => startRename(resume)} />
                      <IconAction label="Replace file" icon={RefreshCw} onClick={() => startReplace(resume.id)} busy={busyId === resume.id} />
                      {!resume.primary && (
                        <IconAction label="Set as primary" icon={Star} onClick={() => handleSetPrimary(resume.id)} busy={busyId === resume.id} />
                      )}
                      <IconAction label="Delete" icon={Trash2} tone="danger" onClick={() => handleDelete(resume.id, resume.label)} busy={busyId === resume.id} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

const IconAction = ({ label, icon: Icon, onClick, busy, tone = 'default' }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={busy}
    aria-label={label}
    title={label}
    className={`flex h-9 w-9 items-center justify-center rounded-xl border transition disabled:opacity-50 ${
      tone === 'danger'
        ? 'border-red-200 text-red-500 hover:bg-red-50'
        : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800'
    }`}
  >
    {React.createElement(Icon, { size: 15 })}
  </button>
);

export default CandidateResumesPage;
