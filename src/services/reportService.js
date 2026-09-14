import apiClient from './apiClient';

export const reportService = {
  create: (payload) => apiClient.post('/reports', payload),
};
