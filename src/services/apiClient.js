import axios from 'axios';

/**
 * Axios instance with configuration
 * Handles API calls, authentication, and error formatting
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// A separate, interceptor-free client for the refresh call itself, so a failed refresh can never
// recursively trigger another refresh attempt.
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const clearStoredAuth = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('sessionId');
};

const isTokenExpired = (token) => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return true;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(window.atob(normalized));
    if (!decoded?.exp) return false;

    return decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

const redirectToLogin = () => {
  clearStoredAuth();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

// Deduplicates concurrent refresh attempts: if several requests 401 at once, only one network
// call to /auth/refresh is made and every pending request waits on it.
let refreshPromise = null;

const refreshAccessToken = () => {
  if (!refreshPromise) {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) {
      return Promise.reject(new Error('No refresh token available'));
    }

    refreshPromise = refreshClient
      .post('/auth/refresh', { refreshToken: storedRefreshToken })
      .then((response) => {
        const data = response.data?.data || {};
        if (!data.token) {
          throw new Error('Refresh response did not include a token');
        }
        localStorage.setItem('authToken', data.token);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        if (data.sessionId != null) {
          localStorage.setItem('sessionId', String(data.sessionId));
        }
        return data.token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
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

// Response interceptor: on a 401 from an access token that has actually expired/been rejected,
// try exactly one silent refresh-and-retry before giving up. Never retry more than once per
// request, and never attempt this for the refresh call itself.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (response?.status === 401 && config && !config._retry && !config.url?.includes('/auth/refresh')) {
      config._retry = true;
      try {
        const newToken = await refreshAccessToken();
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(config);
      } catch {
        redirectToLogin();
        return Promise.reject(error);
      }
    }

    if (response?.status === 401 || response?.status === 403) {
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

export default apiClient;
