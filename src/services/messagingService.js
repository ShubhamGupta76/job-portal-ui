import apiClient from './apiClient';

export const messagingService = {
  getConversations: () => apiClient.get('/conversations'),
  createConversation: (applicationId) => apiClient.post('/conversations', { applicationId }),
  getMessages: (conversationId) => apiClient.get(`/conversations/${conversationId}/messages`),
  sendMessage: (conversationId, payload) => apiClient.post(`/conversations/${conversationId}/messages`, payload),
  markRead: (conversationId) => apiClient.patch(`/conversations/${conversationId}/read`),
};