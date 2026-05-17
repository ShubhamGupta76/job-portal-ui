import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const recruiterMenuItems = [
  { label: 'Dashboard', path: '/recruiter/dashboard' },
  { label: 'Post Job', path: '/recruiter/post-job' },
  { label: 'Manage Jobs', path: '/recruiter/manage-jobs' },
  { label: 'Applicants', path: '/recruiter/applicants' },
  { label: 'Assessments', path: '/recruiter/assessments' },
  { label: 'Company Profile', path: '/recruiter/company-profile' },
  { label: 'Analytics', path: '/recruiter/analytics' },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="rounded-[32px] bg-slate-950 p-6 text-white shadow-[0_28px_70px_rgba(15,23,42,0.20)]">
      <h2 className="text-lg font-semibold text-white">Recruiter Workspace</h2>
      <p className="mt-2 text-sm text-slate-300">Access hiring tools, job status, and applicant workflows.</p>
      <div className="mt-6 space-y-2">
        {recruiterMenuItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                active ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-white/8 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
