import { createContext, useState } from 'react';
import { normalizeUserRole } from '../utils';

/**
 * Auth Context for global authentication state
 */
const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const initialToken = localStorage.getItem('authToken');
  const initialRole = normalizeUserRole(localStorage.getItem('userRole'));
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(initialToken && initialRole));
  const [userRole, setUserRole] = useState(initialRole);
  const [loading] = useState(false);

  const login = (userData, token, role) => {
    const normalizedRole = normalizeUserRole(role);
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
