import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { decodeJwtPayload } from '../lib/jwt';

/**
 * ProtectedRoute.jsx
 *
 * Ensures the user is authenticated and possesses the required role to access the route.
 * Redirects to /login if unauthenticated, or to the user's role-appropriate home if unauthorized.
 *
 * @param {Array<string>} [allowedRoles] - ['PATIENT', 'DOCTOR', 'CAREGIVER']
 */
export default function ProtectedRoute({ allowedRoles }) {
  const location = useLocation();
  const token = localStorage.getItem('polysafe_token');
  const storedRole = localStorage.getItem('polysafe_role');

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verify decoded payload role or fallback to stored role
  const payload = decodeJwtPayload(token);
  const userRole = (payload?.role || storedRole || 'PATIENT').toUpperCase();

  // If role-restricted and current user role is not permitted
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    if (userRole === 'DOCTOR') {
      return <Navigate to="/doctor-dashboard" replace />;
    }
    if (userRole === 'CAREGIVER') {
      return <Navigate to="/caregiver-view" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
