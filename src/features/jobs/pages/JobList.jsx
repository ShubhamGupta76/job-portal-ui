import React from 'react';
import { JobProvider } from '../../../context/JobContext';
import { useJobContext } from '../../../context/useJobContext';
import FilterPanel from '../components/FilterPanel';
import JobListHeader from '../components/JobListHeader';
import JobCard from '../components/JobCard';
import Pagination from '../components/Pagination';

const JobList = () => {
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
  const jobItems = Array.isArray(jobs) ? jobs : [];
  console.log('RENDER JOBS:', jobs);
  console.log('jobs length:', jobItems.length);
  console.log('first job:', jobItems[0]);

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

  if (!(jobItems && jobItems.length > 0)) {
    return (
      <div className="rounded-lg bg-white p-12 text-center shadow-sm">
        <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
        <p className="mt-2 text-gray-600">Try adjusting your filters or search terms.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobItems.map((job) => (
        <div key={job.id}>
          <JobCard job={job} />
        </div>
      ))}
    </div>
  );
};

export default JobList;
