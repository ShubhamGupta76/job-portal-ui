import axios from 'axios';

/**
 * Axios instance with configuration
 * Handles API calls, authentication, and error formatting
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const clearStoredAuth = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
};

const isTokenExpired = (token) => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return true;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(window.atob(normalized));
    if (!decoded?.exp) return false;

    return decoded.exp * 1000 <= Date.now();
  } catch (error) {
    return true;
  }
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      if (isTokenExpired(token)) {
        clearStoredAuth();
        return config;
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      clearStoredAuth();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
