import React from 'react';
import Button from '../../../components/common/Button';

const JobTable = ({ jobs, onEdit, onDelete }) => {
  if (!jobs.length) {
    return <p className="text-sm text-gray-500">No jobs found for this recruiter.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="px-4 py-4 font-medium">Title</th>
            <th className="px-4 py-4 font-medium">Location</th>
            <th className="px-4 py-4 font-medium">Type</th>
            <th className="px-4 py-4 font-medium">Applicants</th>
            <th className="px-4 py-4 font-medium">Salary</th>
            <th className="px-4 py-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {jobs.map((job) => (
            <tr key={job.id}>
              <td className="px-4 py-4 text-gray-900">{job.title}</td>
              <td className="px-4 py-4 text-gray-600">{job.location || 'Remote'}</td>
              <td className="px-4 py-4 text-gray-600">{job.jobType || 'N/A'}</td>
              <td className="px-4 py-4 text-gray-600">{job.applicationCount ?? '-'}</td>
              <td className="px-4 py-4 text-gray-600">
                {job.minSalary && job.maxSalary
                  ? `₹${job.minSalary.toLocaleString()} - ₹${job.maxSalary.toLocaleString()}`
                  : 'Not disclosed'}
              </td>
              <td className="px-4 py-4 space-x-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(job)}>
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => onDelete(job.id)}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default JobTable;
