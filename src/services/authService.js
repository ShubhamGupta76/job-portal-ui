import apiClient from './apiClient';

/**
 * Authentication API service
 */

export const authService = {
  sendOtpForLogin: (email, password) =>
    apiClient.post('/auth/login-credentials', { email, password }),

  signup: (userData) =>
    apiClient.post('/auth/register', userData),

  verifyOtp: (email, otp) =>
    apiClient.post('/auth/verify-otp', { email, otp }),

  resendOtp: (email) =>
    apiClient.post('/auth/resend-otp', { email }),

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
  },

  getCurrentUser: () =>
    apiClient.get('/auth/me'),
};
