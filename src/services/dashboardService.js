import apiClient from './apiClient';

export const dashboardService = {
  getCandidateDashboard: () => apiClient.get('/dashboard/candidate'),
  getRecruiterDashboard: () => apiClient.get('/dashboard/recruiter'),
  getPublicMetrics: () => apiClient.get('/dashboard/public'),
};
