import apiClient from './apiClient';

export const recommendationService = {
  getRecommendations: (params = {}) => apiClient.get('/candidate/recommendations', { params }),
  dismiss: (jobId) => apiClient.post(`/candidate/recommendations/${jobId}/dismiss`),
  undoDismiss: (jobId) => apiClient.delete(`/candidate/recommendations/${jobId}/dismiss`),
};
