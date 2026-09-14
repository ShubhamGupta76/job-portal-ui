import apiClient from './apiClient';

/**
 * Authentication API service
 */

export const authService = {
  // Direct login: password-only, no OTP. OTP remains required for registration only.
  login: (email, password) =>
    apiClient.post('/auth/login-credentials', { email, password }),

  signup: (userData) =>
    apiClient.post('/auth/register', userData),

  verifyOtp: (email, otp) =>
    apiClient.post('/auth/verify-otp', { email, otp }),

  resendOtp: (email) =>
    apiClient.post('/auth/resend-otp', { email }),

  logout: () => {
    const refreshToken = localStorage.getItem('refreshToken');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('sessionId');
    if (!refreshToken) {
      return Promise.resolve();
    }
    return apiClient.post('/auth/logout', { refreshToken });
  },

  refreshToken: (refreshToken) =>
    apiClient.post('/auth/refresh', { refreshToken }),

  getCurrentUser: () =>
    apiClient.get('/auth/me'),

  getSessions: () => {
    const sessionId = localStorage.getItem('sessionId');
    return apiClient.get('/auth/sessions', { params: sessionId ? { currentSessionId: sessionId } : {} });
  },

  revokeSession: (sessionId) =>
    apiClient.delete(`/auth/sessions/${sessionId}`),

  revokeOtherSessions: () => {
    const currentSessionId = localStorage.getItem('sessionId');
    return apiClient.post('/auth/sessions/revoke-others', currentSessionId ? { currentSessionId } : {});
  },

  revokeAllSessions: () =>
    apiClient.post('/auth/sessions/revoke-all'),
};
