import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const menuItems = [
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
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Recruiter Workspace</h2>
      <p className="mt-2 text-sm text-gray-500">Access hiring tools, job status, and applicant workflows.</p>
      <div className="mt-6 space-y-2">
        {menuItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                active ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-100'
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
