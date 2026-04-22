import apiClient from './apiClient';

export const applicationService = {
  getMyApplications: () => apiClient.get('/applications/my-applications'),
  getRecruiterApplications: (params = {}) => apiClient.get('/applications/recruiter', { params }),
  getApplicationsByJob: (jobId) => apiClient.get(`/applications/job/${jobId}`),
  updateStatus: (applicationId, status) =>
    apiClient.put(`/applications/${applicationId}/status`, { status }),
  assignAssessment: (jobId, candidateId, assessmentId) =>
    apiClient.post('/assessments/assign', { jobId, candidateId, assessmentId }),
  getResume: (userId, download = false) =>
    apiClient.get(`/files/resume/${userId}`, {
      params: { download },
      responseType: 'blob',
    }),
};
