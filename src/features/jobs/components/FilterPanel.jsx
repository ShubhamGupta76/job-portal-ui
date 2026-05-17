import React, { useEffect, useMemo, useState } from 'react';
import { useJobContext } from '../../../context/useJobContext';

const formatLabel = (value) => {
  if (!value) return '';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const FilterPanel = () => {
  const { filters, updateFilters, clearFilters, filterOptions } = useJobContext();

  const jobTypes = useMemo(
    () => (filterOptions.jobTypes || []).map((value) => ({ value, label: formatLabel(value) })),
    [filterOptions.jobTypes]
  );

  const experienceLevels = useMemo(
    () => (filterOptions.experienceLevels || []).map((value) => ({ value, label: formatLabel(value) })),
    [filterOptions.experienceLevels]
  );

  const locationSuggestions = useMemo(
    () => (filterOptions.locations || []).filter(Boolean).slice(0, 6),
    [filterOptions.locations]
  );

  const minSalary = Math.max(0, Math.round((filterOptions.minSalary || 0) / 1000));
  const maxSalary = Math.max(minSalary || 100, Math.round((filterOptions.maxSalary || 0) / 1000) || 250);
  const [salarySlider, setSalarySlider] = useState(filters.salaryMin ? Math.round(Number(filters.salaryMin) / 1000) : minSalary || 0);

  useEffect(() => {
    if (!filters.salaryMin) {
      setSalarySlider(minSalary || 0);
    }
  }, [filters.salaryMin, minSalary]);

  const activeCount = useMemo(() => {
    return Object.values(filters).filter((value) => value && value !== 'latest').length;
  }, [filters]);

  const handleSelect = (field, value) => {
    updateFilters({ [field]: filters[field] === value ? '' : value });
  };

  const handleSalaryChange = (value) => {
    setSalarySlider(value);
    updateFilters({ salaryMin: value ? value * 1000 : '', salaryMax: '' });
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-6">
        <div className="flex items-center gap-3">
          <span className="text-xl text-slate-700">⌁</span>
          <h2 className="text-2xl font-semibold text-slate-900">Filters</h2>
          {activeCount > 0 && (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {activeCount}
            </span>
          )}
        </div>
        <button
          onClick={() => {
            clearFilters();
            setSalarySlider(minSalary || 0);
          }}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Clear All
        </button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6">
        {jobTypes.length > 0 && (
          <FilterGroup title="Job Type">
            {jobTypes.map((option) => (
              <CheckboxRow
                key={option.value}
                label={option.label}
                checked={filters.jobType === option.value}
                onChange={() => handleSelect('jobType', option.value)}
              />
            ))}
          </FilterGroup>
        )}

        {experienceLevels.length > 0 && (
          <FilterGroup title="Experience Level">
            {experienceLevels.map((option) => (
              <CheckboxRow
                key={option.value}
                label={option.label}
                checked={filters.experience === option.value}
                onChange={() => handleSelect('experience', option.value)}
              />
            ))}
          </FilterGroup>
        )}

        <FilterGroup title="Location">
          <input
            type="text"
            value={filters.location}
            onChange={(e) => updateFilters({ location: e.target.value })}
            placeholder="City, state, or remote"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          {locationSuggestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {locationSuggestions.map((location) => (
                <button
                  key={location}
                  type="button"
                  onClick={() => updateFilters({ location })}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600"
                >
                  {location}
                </button>
              ))}
            </div>
          )}
        </FilterGroup>

        {maxSalary > 0 && (
          <FilterGroup title="Salary Range">
            <input
              type="range"
              min={minSalary}
              max={maxSalary}
              value={salarySlider}
              onChange={(e) => handleSalaryChange(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>${minSalary}k</span>
              <span>${maxSalary}k+</span>
            </div>
          </FilterGroup>
        )}
      </div>
    </div>
  );
};

const FilterGroup = ({ title, children }) => {
  return (
    <div className="mb-9">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <span className="text-slate-500">⌄</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
};

const CheckboxRow = ({ label, checked, onChange }) => {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-lg text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-5 w-5 rounded border-slate-300 accent-blue-600"
      />
      <span>{label}</span>
    </label>
  );
};

export default FilterPanel;
