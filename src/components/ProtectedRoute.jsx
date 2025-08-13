import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/api';

const ProtectedRoute = () => {
  const isAuthenticated = authService.isAuthenticated();
  
  // If not authenticated, redirect to the auth page
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;