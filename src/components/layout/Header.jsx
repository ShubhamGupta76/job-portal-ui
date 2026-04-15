import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Button from '../common/Button';

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
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 2xl:px-12">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">JP</span>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:inline">JobPortal</span>
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/jobs"
              className={`font-medium transition-colors ${isActive('/jobs') ? 'text-purple-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Browse Jobs
            </Link>
            
            {isLoggedIn && userRole === 'recruiter' && (
              <>
                <Link
                  to="/recruiter/dashboard"
                  className={`font-medium transition-colors ${isActive('/recruiter/dashboard') ? 'text-purple-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/recruiter/post-job"
                  className={`font-medium transition-colors ${isActive('/recruiter/post-job') ? 'text-purple-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Post Job
                </Link>
              </>
            )}

            {isLoggedIn && userRole === 'candidate' && (
              <Link
                to="/dashboard"
                className={`font-medium transition-colors ${isActive('/dashboard') ? 'text-purple-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Dashboard
              </Link>
            )}

            {isLoggedIn && (
              <>
                <Link
                  to="/notifications"
                  className={`font-medium transition-colors ${isActive('/notifications') ? 'text-purple-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Notifications
                </Link>
                <Link
                  to="/profile"
                  className={`font-medium transition-colors ${isActive('/profile') ? 'text-purple-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Profile
                </Link>
              </>
            )}
          </nav>

          {/* Auth Buttons */}
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

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? 'Close menu' : 'Menu'}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200 mt-4">
            <Link to="/jobs" className="block py-2 text-gray-600 hover:text-purple-600 font-medium">
              Browse Jobs
            </Link>
            {isLoggedIn && userRole === 'recruiter' && (
              <>
                <Link to="/recruiter/dashboard" className="block py-2 text-gray-600 hover:text-purple-600 font-medium">
                  Dashboard
                </Link>
                <Link to="/recruiter/post-job" className="block py-2 text-gray-600 hover:text-purple-600 font-medium">
                  Post Job
                </Link>
              </>
            )}
            {isLoggedIn && userRole === 'candidate' && (
              <Link to="/dashboard" className="block py-2 text-gray-600 hover:text-purple-600 font-medium">
                Dashboard
              </Link>
            )}
            {isLoggedIn && (
              <>
                <Link to="/notifications" className="block py-2 text-gray-600 hover:text-purple-600 font-medium">
                  Notifications
                </Link>
                <Link to="/profile" className="block py-2 text-gray-600 hover:text-purple-600 font-medium">
                  Profile
                </Link>
              </>
            )}
            {!isLoggedIn && (
              <div className="flex gap-2 mt-4">
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
