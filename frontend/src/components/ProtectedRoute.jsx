import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HomeSkeleton } from './Skeletons';

/**
 * ProtectedRoute.jsx
 *
 * Ensures the user is authenticated and possesses the required role to access the route.
 * Reads solely from centralized useAuth() context.
 *
 * @param {Array<string>} [allowedRoles] - ['PATIENT', 'DOCTOR', 'CAREGIVER']
 */
export default function ProtectedRoute({ allowedRoles }) {
 const location = useLocation();
 const { user, isLoading } = useAuth();

 if (isLoading) {
 return (
 <div className="min-h-[85vh] bg-[var(--brand-paper)] flex items-center justify-center">
 <HomeSkeleton />
 </div>
 );
 }

 // Not authenticated attempting protected route
 if (!user) {
 return <Navigate to="/login" state={{ from: location }} replace />;
 }

 // Guest users are allowed to explore patient routes in demo/preview mode
 if (user.isGuest) {
 if (allowedRoles && allowedRoles.includes('PATIENT')) {
 return <Outlet />;
 }
 return <Navigate to="/login" replace />;
 }

 const userRole = (user.role || 'PATIENT').toUpperCase();

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
