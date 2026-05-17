import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Button from '../common/Button';
import NotificationIcon from '../common/NotificationIcon';

/**
 * Header/Navigation Component
 */
const Header = ({ isLoggedIn = false, userRole = 'candidate' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-slate-950/88 shadow-[0_10px_35px_rgba(15,23,42,0.16)] backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 2xl:px-12">
        <div className="flex h-18 items-center justify-between gap-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 shadow-[0_14px_34px_rgba(14,165,233,0.35)]">
              <span className="text-base font-bold text-white">JP</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-lg font-semibold text-white">JobPortal</p>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Hiring Workspace</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-2 md:flex">
            <Link
              to="/jobs"
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${isActive('/jobs') ? 'bg-white text-slate-950' : 'text-slate-300 hover:text-white'}`}
            >
              Browse Jobs
            </Link>
            
            {isLoggedIn && userRole === 'recruiter' && (
              <>
                <Link
                  to="/recruiter/dashboard"
                  className={`rounded-full px-4 py-2 text-sm font-medium ${isActive('/recruiter/dashboard') ? 'bg-white text-slate-950' : 'text-slate-300 hover:text-white'}`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/recruiter/post-job"
                  className={`rounded-full px-4 py-2 text-sm font-medium ${isActive('/recruiter/post-job') ? 'bg-white text-slate-950' : 'text-slate-300 hover:text-white'}`}
                >
                  Post Job
                </Link>
              </>
            )}

            {isLoggedIn && userRole === 'candidate' && (
              <Link
                to="/dashboard"
                className={`rounded-full px-4 py-2 text-sm font-medium ${isActive('/dashboard') ? 'bg-white text-slate-950' : 'text-slate-300 hover:text-white'}`}
              >
                Dashboard
              </Link>
            )}

            {isLoggedIn && (
              <>
                <NotificationIcon
                  dark
                  className={isActive('/notifications') ? 'bg-white text-slate-950 hover:bg-white hover:text-slate-950' : ''}
                />
                <Link
                  to="/profile"
                  className={`rounded-full px-4 py-2 text-sm font-medium ${isActive('/profile') ? 'bg-white text-slate-950' : 'text-slate-300 hover:text-white'}`}
                >
                  Profile
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {!isLoggedIn ? (
              <>
                <Link to="/login" className="hidden sm:inline-block">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/signup" className="hidden sm:inline-block">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                Logout
              </Button>
            )}

            <button
              className="rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm font-semibold text-white hover:bg-white/14 md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? 'Close menu' : 'Menu'}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="mt-1 rounded-[24px] border border-white/10 bg-white/6 p-4 md:hidden">
            <Link to="/jobs" className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white">
              Browse Jobs
            </Link>
            {isLoggedIn && userRole === 'recruiter' && (
              <>
                <Link to="/recruiter/dashboard" className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white">
                  Dashboard
                </Link>
                <Link to="/recruiter/post-job" className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white">
                  Post Job
                </Link>
              </>
            )}
            {isLoggedIn && userRole === 'candidate' && (
              <Link to="/dashboard" className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white">
                Dashboard
              </Link>
            )}
            {isLoggedIn && (
              <>
                <div className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white">
                  <span>Notifications</span>
                  <NotificationIcon dark className="h-9 w-9" />
                </div>
                <Link to="/profile" className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white">
                  Profile
                </Link>
              </>
            )}
            {!isLoggedIn && (
              <div className="mt-4 flex gap-2">
                <Link to="/login" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">Login</Button>
                </Link>
                <Link to="/signup" className="flex-1">
                  <Button size="sm" className="w-full">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
