import apiClient from './apiClient';

export const assessmentService = {
  getAssessmentsForJob: (jobId) => apiClient.get(`/assessments/job/${jobId}`),
  getMyAssessments: () => apiClient.get('/assessments/my'),
  getAssessment: (assessmentId) => apiClient.get(`/assessments/${assessmentId}`),
  updateAssessment: (assessmentId, data) => apiClient.put(`/assessments/${assessmentId}`, data),
  publishAssessment: (assessmentId) => apiClient.post(`/assessments/${assessmentId}/publish`),
  startAssessment: (assessmentId) =>
    apiClient.post('/test-sessions/start', null, {
      params: { assessmentId },
      headers: {
        'User-Agent': navigator.userAgent,
        'X-Forwarded-For': '0.0.0.0',
      },
    }),
  assignAssessment: (jobId, candidateId, assessmentId) =>
    apiClient.post('/assessments/assign', { jobId, candidateId, assessmentId }),
};
