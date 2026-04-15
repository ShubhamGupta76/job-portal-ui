import React, { useState } from 'react';
import Button from '../../../components/common/Button';

const statusOptions = ['APPLIED', 'SHORTLISTED', 'REJECTED', 'HIRED'];

const ApplicantCard = ({ application, onStatusChange }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-lg font-semibold text-gray-900">{application.userName}</p>
          <p className="text-sm text-gray-600">Applied for: {application.jobTitle}</p>
          <p className="text-sm text-gray-600">Status: {application.status}</p>
          <p className="text-sm text-gray-500">Applied on {new Date(application.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {statusOptions.map((status) => (
            <Button
              key={status}
              variant={application.status === status ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onStatusChange(application.id, status)}
            >
              {status}
            </Button>
          ))}
          <Button variant="secondary" size="sm" onClick={() => setExpanded((prev) => !prev)}>
            {expanded ? 'Hide details' : 'View details'}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
          <p className="mb-3 font-semibold text-gray-900">Candidate summary</p>
          <p>{application.coverLetter || 'No cover letter provided.'}</p>
          <p className="mt-3 text-sm text-gray-500">Resume path: {application.resumePath || 'Not available'}</p>
        </div>
      )}
    </div>
  );
};

export default ApplicantCard;
