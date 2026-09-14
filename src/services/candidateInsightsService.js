import apiClient from './apiClient';

export const candidateInsightsService = {
  getProfileAnalytics: () => apiClient.get('/candidate/profile/analytics'),
  getActivity: (params = {}) => apiClient.get('/candidate/activity', { params }),
};
