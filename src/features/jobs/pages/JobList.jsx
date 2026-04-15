import React from 'react';
import { JobProvider } from '../../../context/JobContext';
import { useJobContext } from '../../../context/useJobContext';
import { useAuthContext } from '../../../context/useAuthContext';
import FilterPanel from '../components/FilterPanel';
import JobListHeader from '../components/JobListHeader';
import JobCard from '../components/JobCard';
import Pagination from '../components/Pagination';
import Button from '../../../components/common/Button';
import { Link } from 'react-router-dom';

const JobList = () => {
  const { isLoggedIn } = useAuthContext();

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 p-4 shadow-lg">
            <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m6 20v-2a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m6-18l.236.3A7.167 7.167 0 0112 8.36a7.166 7.166 0 00-3.764-.56A7.167 7.167 0 006.764 8.36L6 9M16 6l-.236.3A7.167 7.167 0 0112 8.36a7.166 7.166 0 00-3.764-.56A7.167 7.167 0 006.764 8.36L6 9" />
            </svg>
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Welcome to Job Portal
          </h1>
          <p className="mt-4 max-w-xl mx-auto text-lg text-gray-600">
            Sign in to browse thousands of verified jobs from top companies. 
            Create your profile and get matched with opportunities that fit your skills.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/login">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg hover:shadow-xl">
                Sign in to browse jobs
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="lg" variant="outline" className="border-gray-300 hover:bg-gray-50">
                Create free account
              </Button>
            </Link>
          </div>
          <p className="mt-8 text-sm text-gray-500">
            Already have jobs in your area?{' '}
            <Link to="/jobs" className="font-medium text-purple-600 hover:text-purple-500">
              Continue as guest (limited)
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <JobProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Left Sidebar - Filters */}
            <div className="lg:w-80 lg:flex-shrink-0">
              <div className="sticky top-8">
                <FilterPanel />
              </div>
            </div>

            {/* Right Side - Job Listings */}
            <div className="flex-1">
              <JobListHeader />
              <JobListings />
              <Pagination />
            </div>
          </div>
        </div>
      </div>
    </JobProvider>
  );
};

const JobListings = () => {
  const { jobs, loading, error } = useJobContext();

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                <div className="h-6 w-48 bg-gray-200 rounded"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
              <div className="h-8 w-20 bg-gray-200 rounded"></div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-lg bg-white p-12 text-center shadow-sm">
        <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
        <p className="mt-2 text-gray-600">Try adjusting your filters or search terms.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
};

export default JobList;