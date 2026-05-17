import { createContext, useState } from 'react';
import { normalizeUserRole } from '../utils';

/**
 * Auth Context for global authentication state
 */
const AuthContext = createContext({});

const getRoleFromToken = (token) => {
  if (!token) return null;

  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(window.atob(normalizedPayload));
    return normalizeUserRole(decoded?.role);
  } catch (error) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const initialToken = localStorage.getItem('authToken');
  const initialRole = getRoleFromToken(initialToken) || normalizeUserRole(localStorage.getItem('userRole'));
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(initialToken && initialRole));
  const [userRole, setUserRole] = useState(initialRole);
  const [loading] = useState(false);

  const login = (userData, token, role) => {
    const normalizedRole = getRoleFromToken(token) || normalizeUserRole(role);
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', normalizedRole);
    setUser(userData);
    setIsLoggedIn(true);
    setUserRole(normalizedRole);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    setUser(null);
    setIsLoggedIn(false);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        userRole,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
