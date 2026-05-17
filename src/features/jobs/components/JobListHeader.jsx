import React, { useEffect, useMemo, useState } from 'react';
import { useJobContext } from '../../../context/useJobContext';

const experienceLabelMap = {
  '0-1': 'Entry Level',
  '1-3': 'Mid Level',
  '3+': 'Senior Level',
};

const jobTypeLabelMap = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
};

const JobListHeader = () => {
  const { totalJobs, filters, updateFilters, clearFilters } = useJobContext();
  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        updateFilters({ search: searchInput });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search, updateFilters]);

  const activeFilters = useMemo(() => {
    const chips = [];
    if (filters.jobType) chips.push({ key: 'jobType', label: jobTypeLabelMap[filters.jobType] || filters.jobType });
    if (filters.experience) chips.push({ key: 'experience', label: experienceLabelMap[filters.experience] || filters.experience });
    if (filters.location) chips.push({ key: 'location', label: filters.location });
    if (filters.search) chips.push({ key: 'search', label: filters.search });
    return chips;
  }, [filters]);

  const removeChip = (key) => {
    updateFilters({ [key]: '' });
  };

  return (
    <div className="mb-8">
      <div className="mb-6 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight text-slate-900">Discover Opportunities</h1>
          <p className="mt-3 text-xl text-slate-500">
            Explore {totalJobs} relevant {totalJobs === 1 ? 'position' : 'positions'} matched to your profile.
          </p>
        </div>
        <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 lg:flex">
          <button className="rounded-xl bg-blue-600 px-4 py-3 text-white">▦</button>
          <button className="rounded-xl px-4 py-3 text-slate-500">☰</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_190px_135px]">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by job title, company, or keywords..."
            className="w-full border-0 bg-transparent text-lg text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <select
            value={filters.sort}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            className="w-full border-0 bg-transparent text-lg text-slate-700 outline-none"
          >
            <option value="relevance">Top Relevance</option>
            <option value="latest">Latest</option>
            <option value="salary">Salary</option>
          </select>
        </div>

        <button className="rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] hover:bg-blue-700">
          Search
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="text-base text-slate-500">Active filters:</span>
        {activeFilters.length === 0 ? (
          <span className="text-base text-slate-400">None</span>
        ) : (
          activeFilters.map((chip) => (
            <button
              key={chip.key}
              onClick={() => removeChip(chip.key)}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
            >
              {chip.label} ×
            </button>
          ))
        )}
        {activeFilters.length > 0 && (
          <button onClick={clearFilters} className="text-base text-slate-500 hover:text-slate-700">
            Clear all
          </button>
        )}
      </div>
    </div>
  );
};

export default JobListHeader;
