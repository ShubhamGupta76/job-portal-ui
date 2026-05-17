import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const logoPalette = [
  { bg: 'bg-blue-50', text: 'text-blue-700' },
  { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  { bg: 'bg-amber-50', text: 'text-amber-700' },
  { bg: 'bg-violet-50', text: 'text-violet-700' },
];

const skillColors = ['bg-slate-50 text-slate-700', 'bg-blue-50 text-blue-700', 'bg-emerald-50 text-emerald-700'];

const formatLabel = (value) => {
  if (!value) return '';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const JobCard = ({ job }) => {
  const [isSaved, setIsSaved] = useState(false);
  const title = job?.title || 'Untitled role';
  const companyName = job?.companyName || 'Confidential company';
  const location = job?.location || 'Remote';

  const initials = useMemo(() => {
    return companyName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'JP';
  }, [companyName]);

  const palette = logoPalette[(job?.id || 0) % logoPalette.length];
  const skills = job?.skills
    ? job.skills.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 3)
    : [formatLabel(job?.jobType) || 'Open role', formatLabel(job?.experienceLevel) || location].filter(Boolean).slice(0, 3);

  const handleSaveToggle = () => {
    setIsSaved(!isSaved);
  };

  const formatSalary = (min, max) => {
    if (min && max) {
      return `$${Math.round(min / 1000)}k - $${Math.round(max / 1000)}k`;
    }
    if (min) {
      return `$${Math.round(min / 1000)}k+`;
    }
    if (max) {
      return `Up to $${Math.round(max / 1000)}k`;
    }
    return 'Not disclosed';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently posted';
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.max(1, Math.round((now - date) / (1000 * 60 * 60)));
    if (diffHours < 24) {
      return `${diffHours} hours ago`;
    }
    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,0.10)]">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 ${palette.bg} ${palette.text}`}>
          <span className="text-xl font-semibold">{initials}</span>
        </div>
        {job?.status && (
          <div className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-600">
            {formatLabel(job.status)}
          </div>
        )}
      </div>

      <div className="text-center">
        <h3 className="text-[2rem] font-semibold leading-tight text-slate-900">{title}</h3>
        <p className="mt-3 text-xl text-slate-500">{companyName}</p>
      </div>

      {skills.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {skills.map((skill, index) => (
            <span
              key={`${skill}-${index}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${skillColors[index % skillColors.length]}`}
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-3 text-sm text-slate-500">
        <div className="flex items-center justify-between gap-4">
          <span>{location}</span>
          <span>{formatDate(job.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>{formatSalary(job.minSalary, job.maxSalary)}</span>
          <span>{formatLabel(job.jobType) || 'Open role'}</span>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <button
          onClick={handleSaveToggle}
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
            isSaved
              ? 'border-blue-200 bg-blue-50 text-blue-700'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          {isSaved ? 'Saved' : 'Bookmark'}
        </button>
        <Link
          to={`/jobs/${job.id}`}
          className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] hover:bg-blue-700"
        >
          View Job
        </Link>
      </div>
    </div>
  );
};

export default JobCard;
