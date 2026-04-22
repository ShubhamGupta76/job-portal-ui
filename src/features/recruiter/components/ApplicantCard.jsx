import React, { useState } from 'react';
import Button from '../../../components/common/Button';
import { applicationService } from '../../../services';

const pipelineStatuses = ['APPLIED', 'SHORTLISTED', 'ASSESSMENT', 'INTERVIEW', 'HIRED'];

const ApplicantCard = ({ application, onStatusChange, hasAssessment }) => {
  const [expanded, setExpanded] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);

  const openResume = async (download = false) => {
    try {
      setResumeLoading(true);
      const response = await applicationService.getResume(application.userId, download);
      const fileUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));

      if (download) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = `${application.userName || 'resume'}.pdf`;
        link.click();
      } else {
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
      }

      setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
    } catch (error) {
      console.error('Unable to open resume:', error);
    } finally {
      setResumeLoading(false);
    }
  };

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
          {pipelineStatuses.map((status) => (
            <Button
              key={status}
              variant={application.status === status ? 'primary' : 'outline'}
              size="sm"
              disabled={status === 'ASSESSMENT' && !hasAssessment}
              onClick={() => onStatusChange(application.id, status)}
            >
              {status}
            </Button>
          ))}
          <Button
            variant="danger"
            size="sm"
            onClick={() => onStatusChange(application.id, 'REJECTED')}
          >
            REJECTED
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setExpanded((prev) => !prev)}>
            {expanded ? 'Hide details' : 'View details'}
          </Button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500">
        {pipelineStatuses.map((status, index) => (
          <React.Fragment key={status}>
            <span className={`rounded-full px-3 py-1 ${application.status === status ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
              {status}
            </span>
            {index < pipelineStatuses.length - 1 && <span>→</span>}
          </React.Fragment>
        ))}
      </div>

      {expanded && (
        <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
          <p className="mb-3 font-semibold text-gray-900">Candidate summary</p>
          <p>{application.coverLetter || 'No cover letter provided.'}</p>
          <p className="mt-3 text-sm text-gray-500">Assigned assessment: {application.assessmentTitle || 'Not assigned yet'}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" loading={resumeLoading} onClick={() => openResume(false)}>
              View Resume
            </Button>
            <Button size="sm" variant="outline" loading={resumeLoading} onClick={() => openResume(true)}>
              Download Resume
            </Button>
            {application.assessmentId && (
              <a
                href={`/recruiter/assessments/${application.assessmentId}/leaderboard`}
                className="inline-flex items-center justify-center rounded-lg border-2 border-purple-600 px-3 py-1.5 text-sm font-semibold text-purple-600 hover:bg-purple-50"
              >
                View Result
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantCard;
