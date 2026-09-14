import apiClient from './apiClient';

export const savedSearchService = {
  getAll: () => apiClient.get('/saved-searches'),
  create: (payload) => apiClient.post('/saved-searches', payload),
  update: (id, payload) => apiClient.put(`/saved-searches/${id}`, payload),
  remove: (id) => apiClient.delete(`/saved-searches/${id}`),
  pause: (id) => apiClient.post(`/saved-searches/${id}/pause`),
  resume: (id) => apiClient.post(`/saved-searches/${id}/resume`),
};