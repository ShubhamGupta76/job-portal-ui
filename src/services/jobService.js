import apiClient from './apiClient';

/**
 * Jobs API service
 */

export const jobService = {
  getJobs: (params = {}) =>
    apiClient.get('/jobs', { params }),

  getJob: (jobId) =>
    apiClient.get(`/jobs/${jobId}`),

  createJob: (jobData) =>
    apiClient.post('/jobs', jobData),

  updateJob: (jobId, jobData) =>
    apiClient.put(`/jobs/${jobId}`, jobData),

  deleteJob: (jobId) =>
    apiClient.delete(`/jobs/${jobId}`),

  getMyJobs: () =>
    apiClient.get('/jobs/my-jobs'),

  applyJob: (applicationData) => {
    const formData = new FormData();
    formData.append('jobId', applicationData.jobId);
    if (applicationData.coverLetter) {
      formData.append('coverLetter', applicationData.coverLetter);
    }
    if (applicationData.resume) {
      formData.append('resume', applicationData.resume);
    }
    return apiClient.post('/applications', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getApplications: (jobId, params = {}) =>
    apiClient.get(`/applications/job/${jobId}`, { params }),

  updateApplicationStatus: (applicationId, status) =>
    apiClient.put(`/applications/${applicationId}/status`, null, {
      params: { status }
    }),

  getMyApplications: () =>
    apiClient.get('/applications/my-applications'),

  getFilterOptions: () =>
    apiClient.get('/jobs/filters'),

  getSearchSuggestions: (keyword) =>
    apiClient.get('/jobs/suggestions', { params: { keyword } }),
};

