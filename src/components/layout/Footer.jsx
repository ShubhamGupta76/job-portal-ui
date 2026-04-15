import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Footer Component
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-12 sm:px-6 lg:px-10 2xl:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">JP</span>
              </div>
              <span className="text-xl font-bold text-white">JobPortal</span>
            </div>
            <p className="text-sm text-gray-400">
              Find your dream job or hire the best talent on JobPortal.
            </p>
          </div>

          {/* For Candidates */}
          <div>
            <h3 className="text-white font-semibold mb-4">For Candidates</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/jobs" className="hover:text-purple-400 transition">Browse Jobs</Link></li>
              <li><a href="#" className="hover:text-purple-400 transition">Career Advice</a></li>
              <li><a href="#" className="hover:text-purple-400 transition">Company Reviews</a></li>
              <li><a href="#" className="hover:text-purple-400 transition">Blog</a></li>
            </ul>
          </div>

          {/* For Employers */}
          <div>
            <h3 className="text-white font-semibold mb-4">For Employers</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-purple-400 transition">Post a Job</a></li>
              <li><a href="#" className="hover:text-purple-400 transition">Pricing</a></li>
              <li><a href="#" className="hover:text-purple-400 transition">Our Services</a></li>
              <li><a href="#" className="hover:text-purple-400 transition">Recruiter Login</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-purple-400 transition">About Us</a></li>
              <li><a href="#" className="hover:text-purple-400 transition">Contact</a></li>
              <li><a href="#" className="hover:text-purple-400 transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-purple-400 transition">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              &copy; {currentYear} JobPortal. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <a href="#" className="text-sm text-gray-400 hover:text-white transition">Privacy</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition">Terms</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
