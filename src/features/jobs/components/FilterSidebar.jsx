import React from 'react';
import Button from '../../../components/common/Button';

const experienceLabels = {
  ENTRY: 'Entry',
  MID: 'Mid',
  SENIOR: 'Senior',
  EXECUTIVE: 'Executive',
};

const jobTypeLabels = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
};

const FilterSidebar = ({ onFilterChange, filters, filterOptions }) => {
  const locations = filterOptions?.locations || [];
  const jobTypes = filterOptions?.jobTypes || [];
  const experienceLevels = filterOptions?.experienceLevels || [];
  const salaryRanges = ['0-10 LPA', '10-20 LPA', '20-40 LPA', '40+ LPA'];

  const updateFilter = (key, value) => {
    onFilterChange({
      ...filters,
      [key]: Array.isArray(filters[key])
        ? filters[key].includes(value)
          ? filters[key].filter((item) => item !== value)
          : [...filters[key], value]
        : value,
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">Filters</h2>

      <div className="mt-6 space-y-6">
        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-500">Location</h3>
          <div className="space-y-2">
            {locations.map((location) => (
              <label key={location} className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={filters.locations?.includes(location) || false}
                  onChange={() => updateFilter('locations', location)}
                  className="h-4 w-4 rounded accent-purple-600"
                />
                <span>{location}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-500">Job Type</h3>
          <div className="space-y-2">
            {jobTypes.map((type) => (
              <label key={type} className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={filters.jobTypes?.includes(type) || false}
                  onChange={() => updateFilter('jobTypes', type)}
                  className="h-4 w-4 rounded accent-purple-600"
                />
                <span>{jobTypeLabels[type] || type}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-500">Salary Range</h3>
          <div className="space-y-2">
            {salaryRanges.map((range) => (
              <label key={range} className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="radio"
                  name="salaryRange"
                  checked={filters.salaryRange === range}
                  onChange={() => updateFilter('salaryRange', range)}
                  className="h-4 w-4 accent-purple-600"
                />
                <span>{range}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-500">Experience</h3>
          <div className="space-y-2">
            {experienceLevels.map((level) => (
              <label key={level} className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={filters.experience?.includes(level) || false}
                  onChange={() => updateFilter('experience', level)}
                  className="h-4 w-4 rounded accent-purple-600"
                />
                <span>{experienceLabels[level] || level}</span>
              </label>
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => onFilterChange({
            locations: [],
            jobTypes: [],
            salaryRange: '',
            experience: [],
          })}
        >
          Clear Filters
        </Button>
      </div>
    </div>
  );
};

export default FilterSidebar;
