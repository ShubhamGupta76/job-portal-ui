import apiClient from './apiClient';

export const companyTeamService = {
  getTeam: (companyId) => apiClient.get(`/companies/${companyId}/team`),
  invite: (companyId, payload) => apiClient.post(`/companies/${companyId}/team/invitations`, payload),
  cancelInvitation: (companyId, invitationId) =>
    apiClient.delete(`/companies/${companyId}/team/invitations/${invitationId}`),
  removeMember: (companyId, userId) => apiClient.delete(`/companies/${companyId}/team/${userId}`),
  changeRole: (companyId, userId, role) =>
    apiClient.patch(`/companies/${companyId}/team/${userId}/role`, { role }),
  acceptInvitation: (token) => apiClient.post(`/team/invitations/${token}/accept`),
};
