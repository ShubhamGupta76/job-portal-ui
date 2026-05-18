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
};
