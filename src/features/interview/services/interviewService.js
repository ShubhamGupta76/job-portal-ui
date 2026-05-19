import apiClient from '../../../services/apiClient';

export const interviewService = {
  createSession: (payload) => apiClient.post('/interview-sessions', payload),
  getMySessions: () => apiClient.get('/interview-sessions'),
  getSession: (roomToken) => apiClient.get(`/interview-sessions/${roomToken}`),
  getSessionByInvite: (inviteToken) => apiClient.get(`/interview-sessions/invite/${inviteToken}`),
  joinSession: (roomToken, payload) => apiClient.post(`/interview-sessions/${roomToken}/join`, payload),
  startSession: (roomToken) => apiClient.post(`/interview-sessions/${roomToken}/start`),
  leaveSession: (roomToken) => apiClient.post(`/interview-sessions/${roomToken}/leave`),
  endSession: (roomToken) => apiClient.post(`/interview-sessions/${roomToken}/end`),
  sendMessage: (roomToken, payload) => apiClient.post(`/interview-sessions/${roomToken}/messages`, payload),
  updateParticipantState: (roomToken, payload) =>
    apiClient.patch(`/interview-sessions/${roomToken}/participant-state`, payload),
  updateRecording: (roomToken, payload) => apiClient.patch(`/interview-sessions/${roomToken}/recording`, payload),
  removeParticipant: (roomToken, userId) =>
    apiClient.delete(`/interview-sessions/${roomToken}/participants/${userId}`),
};

export default interviewService;
