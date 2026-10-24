// src/components/Navbar.jsx
import React from 'react';
import SharedTopBar from './SharedTopBar';
import { Pill, Clock, TrendingUp, Stethoscope, ShieldAlert, PlusCircle, Activity, UserCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user } = useAuth() || {};

  const getNavItems = () => {
    if (!user || user.isGuest) {
      return [
        { path: '/home', label: 'Home', icon: Pill },
        { path: '/add-medicine', label: 'Add Med', icon: PlusCircle },
        { path: '/timeline', label: 'Timeline', icon: Clock },
        { path: '/insights', label: 'Insights', icon: TrendingUp },
      ];
    }
    const role = (user.role || 'PATIENT').toUpperCase();
    if (role === 'DOCTOR') {
      return [
        { path: '/doctor-dashboard', label: 'Doctor Hub', icon: Stethoscope },
        { path: '/profile', label: 'Profile', icon: User },
      ];
    }
    if (role === 'CAREGIVER') {
      return [
        { path: '/caregiver-view', label: 'Caregiver Hub', icon: ShieldAlert },
        { path: '/profile', label: 'Profile', icon: User },
      ];
    }
    return [
      { path: '/home', label: 'Home', icon: Pill },
      { path: '/add-medicine', label: 'Add Med', icon: PlusCircle },
      { path: '/timeline', label: 'Timeline', icon: Clock },
      { path: '/insights', label: 'Insights', icon: TrendingUp },
      { path: '/log-symptom', label: 'Symptoms', icon: Activity },
      { path: '/connected', label: 'Connected', icon: UserCheck },
      { path: '/profile', label: 'Profile', icon: User },
    ];
  };

  return (
    <SharedTopBar
      role={user?.role || 'PATIENT'}
      navItems={getNavItems()}
      darkVariant={(user?.role || '').toUpperCase() === 'DOCTOR'}
    />
  );
}
