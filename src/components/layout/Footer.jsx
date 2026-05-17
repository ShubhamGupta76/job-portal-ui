import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Footer Component
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-slate-200/80 bg-white/70 backdrop-blur">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-12 sm:px-6 lg:px-10 2xl:px-12">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500">
                <span className="text-white font-bold">JP</span>
              </div>
              <span className="text-xl font-bold text-slate-950">JobPortal</span>
            </div>
            <p className="text-sm text-slate-500">
              A connected hiring workspace for candidates, recruiters, and assessment-driven recruiting.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-slate-950">For Candidates</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/jobs" className="text-slate-500 hover:text-blue-700">Browse Jobs</Link></li>
              <li><Link to="/dashboard" className="text-slate-500 hover:text-blue-700">Dashboard</Link></li>
              <li><Link to="/candidate/assessments" className="text-slate-500 hover:text-blue-700">Assessments</Link></li>
              <li><Link to="/profile" className="text-slate-500 hover:text-blue-700">Profile</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-slate-950">For Recruiters</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/recruiter/post-job" className="text-slate-500 hover:text-blue-700">Post a Job</Link></li>
              <li><Link to="/recruiter/manage-jobs" className="text-slate-500 hover:text-blue-700">Manage Jobs</Link></li>
              <li><Link to="/recruiter/applicants" className="text-slate-500 hover:text-blue-700">Applicants</Link></li>
              <li><Link to="/recruiter/analytics" className="text-slate-500 hover:text-blue-700">Analytics</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-slate-950">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="text-slate-500 hover:text-blue-700">Login</Link></li>
              <li><Link to="/signup" className="text-slate-500 hover:text-blue-700">Create Account</Link></li>
              <li><Link to="/notifications" className="text-slate-500 hover:text-blue-700">Notifications</Link></li>
              <li><Link to="/" className="text-slate-500 hover:text-blue-700">Home</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-slate-500">
              &copy; {currentYear} JobPortal. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link to="/" className="text-sm text-slate-500 hover:text-blue-700">Privacy</Link>
              <Link to="/" className="text-sm text-slate-500 hover:text-blue-700">Terms</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
