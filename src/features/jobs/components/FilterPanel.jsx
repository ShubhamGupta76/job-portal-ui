import React, { useState, useEffect } from 'react';
import { useJobContext } from '../../../context/useJobContext';

const FilterPanel = () => {
  const { filters, updateFilters, clearFilters } = useJobContext();
  const [localSearch, setLocalSearch] = useState(filters.search);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        updateFilters({ search: localSearch });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, filters.search, updateFilters]);

  const handleInputChange = (field, value) => {
    updateFilters({ [field]: value });
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Filters</h2>

      <div className="mt-6 space-y-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Search (Job Title / Company)
          </label>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="e.g. Software Engineer"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            type="text"
            value={filters.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="e.g. New York, Remote"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Job Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Job Type
          </label>
          <select
            value={filters.jobType}
            onChange={(e) => handleInputChange('jobType', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="FULL_TIME">Full-time</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="PART_TIME">Part-time</option>
            <option value="CONTRACT">Contract</option>
          </select>
        </div>

        {/* Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Experience
          </label>
          <select
            value={filters.experience}
            onChange={(e) => handleInputChange('experience', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Levels</option>
            <option value="0-1">0-1 years</option>
            <option value="1-3">1-3 years</option>
            <option value="3+">3+ years</option>
          </select>
        </div>

        {/* Salary Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Salary Range (LPA)
          </label>
          <div className="mt-1 flex gap-2">
            <input
              type="number"
              value={filters.salaryMin}
              onChange={(e) => handleInputChange('salaryMin', e.target.value)}
              placeholder="Min"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="number"
              value={filters.salaryMax}
              onChange={(e) => handleInputChange('salaryMax', e.target.value)}
              placeholder="Max"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Clear Filters */}
        <button
          onClick={clearFilters}
          className="w-full rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;