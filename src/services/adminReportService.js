import apiClient from './apiClient';

export const adminReportService = {
  list: (status = 'ALL', targetType = 'ALL', page = 0, size = 20) =>
    apiClient.get('/admin/reports', { params: { status, targetType, page, size } }),
  get: (id) => apiClient.get(`/admin/reports/${id}`),
  markUnderReview: (id) => apiClient.post(`/admin/reports/${id}/review`),
  resolve: (id, note, suspendTarget = false) =>
    apiClient.post(`/admin/reports/${id}/resolve`, { note, suspendTarget }),
  reject: (id, note) => apiClient.post(`/admin/reports/${id}/reject`, { note }),
};
