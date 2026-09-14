import apiClient from './apiClient';

export const dashboardService = {
  getCandidateDashboard: () => apiClient.get('/dashboard/candidate'),
  getRecruiterDashboard: () => apiClient.get('/dashboard/recruiter'),
  getRecruiterAnalytics: (days) => apiClient.get('/dashboard/recruiter/analytics', { params: days ? { days } : {} }),
  getPublicMetrics: () => apiClient.get('/dashboard/public'),
};
