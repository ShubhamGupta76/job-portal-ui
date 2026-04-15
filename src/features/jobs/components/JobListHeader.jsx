import React from 'react';
import { useJobContext } from '../../../context/useJobContext';

const JobListHeader = () => {
  const { totalJobs, filters, updateFilters } = useJobContext();

  const handleSortChange = (sort) => {
    updateFilters({ sort });
  };

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Job Listings</h1>
        <p className="text-gray-600">
          {totalJobs} {totalJobs === 1 ? 'job' : 'jobs'} found
        </p>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Sort by:</label>
        <select
          value={filters.sort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="latest">Latest</option>
          <option value="salary">Salary</option>
          <option value="relevance">Relevance</option>
        </select>
      </div>
    </div>
  );
};

export default JobListHeader;