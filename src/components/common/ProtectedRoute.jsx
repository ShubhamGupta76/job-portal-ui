import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../context/useAuthContext';

const ProtectedRoute = ({ role, children }) => {
  const { isLoggedIn, userRole } = useAuthContext();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (role && userRole !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
