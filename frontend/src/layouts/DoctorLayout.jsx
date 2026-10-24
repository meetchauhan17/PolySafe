// src/layouts/DoctorLayout.jsx
// Professional Doctor Layout in Dark Ink-Blue Theme with Coral Active Patient Accent
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Stethoscope, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SharedTopBar from '../components/SharedTopBar';
import CommandPalette from '../components/CommandPalette';

export default function DoctorLayout() {
  const location = useLocation();
  const { user } = useAuth() || {};
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [activePatientHeader, setActivePatientHeader] = useState(null);

  // Listen for active patient changes from DoctorDashboardPage
  useEffect(() => {
    const handlePatientFocus = (e) => {
      if (e.detail) {
        setActivePatientHeader(e.detail);
      }
    };
    window.addEventListener('polysafe:doctor-patient-focused', handlePatientFocus);
    return () => window.removeEventListener('polysafe:doctor-patient-focused', handlePatientFocus);
  }, []);

  const navItems = [
    {
      id: 'workstation',
      label: 'Workstation',
      path: '/doctor-dashboard',
      icon: Stethoscope,
      match: (p) => p.startsWith('/doctor'),
    },
    {
      id: 'profile',
      label: 'Physician Profile',
      path: '/profile',
      icon: User,
      match: (p) => p === '/profile',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] flex flex-col justify-between selection:bg-[var(--accent-100)] selection:text-[var(--ink)]">
      {/* ── Darker Ink-Blue Top Bar with Coral Active Patient Accent ── */}
      <SharedTopBar
        role="DOCTOR"
        navItems={navItems}
        mobileNavItems={navItems}
        darkVariant={true}
        activePatient={activePatientHeader ? { name: activePatientHeader.name } : null}
        onOpenSearch={() => setCommandPaletteOpen(true)}
      />

      {/* ── Clinical Workspace Container ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Outlet />
      </div>

      {/* ── Universal Command Palette (⌘K) ── */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
