import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const JobCard = ({ job }) => {
  const [isSaved, setIsSaved] = useState(false); // In real app, this would come from API

  const handleSaveToggle = () => {
    setIsSaved(!isSaved);
    // In real app, call API to save/unsave
  };

  const formatSalary = (min, max) => {
    if (min && max) {
      return `Rs. ${min.toLocaleString()} - Rs. ${max.toLocaleString()}`;
    } else if (min) {
      return `Rs. ${min.toLocaleString()}+`;
    } else if (max) {
      return `Up to Rs. ${max.toLocaleString()}`;
    }
    return 'Salary not disclosed';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently posted';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="mb-2">
            <p className="text-sm text-gray-600">{job.companyName}</p>
            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
          </div>

          <div className="mb-3 flex flex-wrap gap-4 text-sm text-gray-600">
            <span>{job.location || 'Remote'}</span>
            <span>{job.jobType || 'Full-time'}</span>
            <span>{formatSalary(job.minSalary, job.maxSalary)}</span>
          </div>

          <p className="text-sm text-gray-500">Posted {formatDate(job.createdAt)}</p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <Link
            to={`/jobs/${job.id}`}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Apply
          </Link>
          <button
            onClick={handleSaveToggle}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none"
          >
            {isSaved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
