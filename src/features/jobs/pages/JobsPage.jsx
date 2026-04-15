import React, { useState, useEffect, useContext } from 'react';
import { JobContext } from '../../../context/JobContext';
import { useAuthContext } from '../../../context/useAuthContext';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import JobCard from '../components/JobCard';
import FilterSidebar from '../components/FilterSidebar';

const salaryRanges = {
  '0-10 LPA': { min: 0, max: 10 },
  '10-20 LPA': { min: 10, max: 20 },
  '20-40 LPA': { min: 20, max: 40 },
  '40+ LPA': { min: 40, max: 100 },
};

const JobsPage = () => {
  const jobContext = useContext(JobContext);
  const { isLoggedIn } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    locations: [],
    jobTypes: [],
    salaryRange: '',
    experience: [],
  });
  const [filterOptions, setFilterOptions] = useState({
    locations: [],
    jobTypes: [],
    experienceLevels: [],
    minSalary: null,
    maxSalary: null,
  });

  // Client-side filtering using jobContext.jobs
  useEffect(() => {
    if (!jobContext.jobs.length) return;
    
    let result = jobContext.jobs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (job) =>
          job.title?.toLowerCase().includes(query) ||
          job.companyName?.toLowerCase().includes(query) ||
          job.skills?.toLowerCase().includes(query)
      );
    }

    if (filters.locations.length > 0) {
      result = result.filter((job) =>
        filters.locations.some((loc) => job.location?.toLowerCase().includes(loc.toLowerCase()))
      );
    }

    if (filters.jobTypes.length > 0) {
      result = result.filter((job) =>
        filters.jobTypes.some((type) => job.jobType === type)
      );
    }

    if (filters.experience.length > 0) {
      result = result.filter((job) => filters.experience.includes(job.experienceLevel));
    }

    if (filters.salaryRange) {
      const range = salaryRanges[filters.salaryRange];
      if (range) {
        result = result.filter(
          (job) =>
            (job.minSalary === null && job.maxSalary === null) ||
            ((job.maxSalary ?? 0) / 100000 >= range.min &&
              (job.minSalary ?? 0) / 100000 <= range.max)
        );
      }
    }
  }, [searchQuery, filters, jobContext.jobs]);

  // Remove duplicate filtering - JobList handles it
  const filteredJobs = jobContext.jobs;

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-700 py-12 text-white md:py-16">
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 2xl:px-12">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Find Your Dream Job</h1>
          <p className="mb-8 max-w-2xl text-base text-purple-100 md:text-lg">
            Search from live opportunities, refine with dynamic filters, and move faster.
          </p>

          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              type="text"
              placeholder="Search jobs, companies, skills..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="flex-1 bg-white text-gray-900 placeholder-gray-500"
            />
            <Button size="md" className="w-full bg-white text-purple-600 hover:bg-purple-50 md:w-auto md:min-w-36">
              Search
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12 2xl:px-12">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
          <div className="xl:sticky xl:top-24">
            <FilterSidebar filters={filters} filterOptions={filterOptions} onFilterChange={setFilters} />
          </div>

          <div className="min-w-0">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-gray-600">
                Found <span className="font-bold text-gray-900">{jobContext.jobs.length}</span> jobs
              </p>
            </div>

            {jobContext.loading ? (
              <div className="py-12 text-center">
                <p className="mt-2 text-gray-600">Loading jobs...</p>
              </div>
            ) : jobContext.error ? (
              <div className="rounded-lg border border-red-200 bg-white py-12 text-center">
                <p className="mb-4 text-red-600" dangerouslySetInnerHTML={{__html: jobContext.error}}></p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            ) : jobContext.jobs.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
                <p className="mb-4 text-gray-600">No jobs available. Please check back later.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {jobContext.jobs.slice(0, 8).map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )} 
          </div>
        </div>
      </section>
    </div>
  );
};

export default JobsPage;
