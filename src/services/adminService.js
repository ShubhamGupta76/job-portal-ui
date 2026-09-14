import apiClient from './apiClient';

export const adminService = {
  getActions: () => apiClient.get('/audit/actions'),
  getEntityTypes: () => apiClient.get('/audit/entity-types'),
  getAuditLogsByAction: (action, page = 0, size = 12) =>
    apiClient.get(`/audit/action/${encodeURIComponent(action)}`, {
      params: { page, size },
    }),
  getOverdueInterviews: () => apiClient.get('/interviews/overdue'),
  getFileStats: () => apiClient.get('/files/stats'),
  getUserStats: () => apiClient.get('/admin/users/stats'),
  getUsers: (role = 'RECRUITER') => apiClient.get('/admin/users', { params: { role } }),
  blockUser: (userId) => apiClient.patch(`/admin/users/${userId}/block`),
  unblockUser: (userId) => apiClient.patch(`/admin/users/${userId}/unblock`),
  deleteUser: (userId) => apiClient.delete(`/admin/users/${userId}`),
  getVerificationQueue: (status = 'ALL', page = 0, size = 20) =>
    apiClient.get('/admin/company-verifications', { params: { status, page, size } }),
  getVerificationDetail: (id) => apiClient.get(`/admin/company-verifications/${id}`),
  approveVerification: (id, note) => apiClient.post(`/admin/company-verifications/${id}/approve`, { note }),
  rejectVerification: (id, note) => apiClient.post(`/admin/company-verifications/${id}/reject`, { note }),
  requestVerificationInfo: (id, note) => apiClient.post(`/admin/company-verifications/${id}/request-info`, { note }),
};
