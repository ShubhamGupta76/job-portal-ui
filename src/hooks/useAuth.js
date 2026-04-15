import { useState, useCallback } from 'react';
import { authService } from '../services';
import { normalizeUserRole } from '../utils';

/**
 * Custom hook for authentication
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authService.login(email, password);
      const authData = data.data;
      const normalizedRole = normalizeUserRole(authData.role);
      const userData = {
        id: authData.id,
        email: authData.email,
        firstName: authData.firstName,
        lastName: authData.lastName,
        role: normalizedRole,
      };

      localStorage.setItem('authToken', authData.token);
      localStorage.setItem('userRole', normalizedRole);
      setUser(userData);
      return userData;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authService.signup(userData);
      const authData = data.data;
      const normalizedRole = normalizeUserRole(authData.role);
      const createdUser = {
        id: authData.id,
        email: authData.email,
        firstName: authData.firstName,
        lastName: authData.lastName,
        role: normalizedRole,
      };

      localStorage.setItem('authToken', authData.token);
      localStorage.setItem('userRole', normalizedRole);
      setUser(createdUser);
      return createdUser;
    } catch (err) {
      const message = err.response?.data?.message || 'Signup failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  return { user, loading, error, login, signup, logout };
};
