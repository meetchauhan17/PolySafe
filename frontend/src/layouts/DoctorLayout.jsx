// src/layouts/DoctorLayout.jsx — "Clinical Calm" doctor workspace shell
import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Stethoscope,
  LayoutDashboard,
  UserCircle,
  ShieldCheck,
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../context/AuthContext';
import SignOutConfirmButton from '../components/SignOutConfirmButton';
import { clsx } from 'clsx';

export default function DoctorLayout() {
  const location = useLocation();
  const { user } = useAuth() || {};

  const doctorName = user?.doctor?.name || user?.name
    || (user?.email ? `Dr. ${user.email.split('@')[0]}` : 'Dr. Physician');
  const regNumber = user?.doctor?.registrationNumber || user?.registrationNumber;

  const navItems = [
    {
      label: 'Workstation',
      path: '/doctor-dashboard',
      icon: LayoutDashboard,
      match: (p) => p === '/doctor-dashboard',
    },
    {
      label: 'Profile',
      path: '/profile',
      icon: UserCircle,
      match: (p) => p === '/profile',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] flex flex-col">
      {/* ── Doctor Workspace Header ── */}
      <header className="sticky top-0 z-50 bg-[var(--surface)]/95 backdrop-blur-sm border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/doctor-dashboard" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-8 h-8 bg-[var(--doctor-600)] rounded-[var(--radius-sm)] flex items-center justify-center group-hover:opacity-90 transition-opacity">
              <Stethoscope className="w-4.5 h-4.5 text-white" aria-hidden />
            </div>
            <div>
              <span className="text-base font-extrabold text-[var(--ink)] font-[var(--font-heading)] tracking-tight">
                Poly<span style={{ color: 'var(--doctor-600)' }}>Safe</span>
              </span>
              <span
                className="ml-2 text-[11px] font-semibold px-1.5 py-0.5 rounded-[var(--radius-sm)] border"
                style={{
                  color: 'var(--doctor-600)',
                  background: 'var(--doctor-50)',
                  borderColor: 'var(--doctor-100)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                Doctor
              </span>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1" aria-label="Doctor navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.match(location.pathname);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    'flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-sm)] text-sm font-semibold',
                    'font-[var(--font-heading)] transition-all duration-150',
                    active
                      ? 'text-white'
                      : 'text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] border border-transparent'
                  )}
                  style={active ? {
                    backgroundColor: 'var(--doctor-600)',
                    border: 'none',
                  } : {}}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: physician info + consent indicator + sign out */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Consent audit chip */}
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold font-[var(--font-heading)]"
              style={{
                color: 'var(--safe-fg)',
                background: 'var(--safe-bg)',
                borderColor: 'var(--safe-fg)',
              }}
            >
              <ShieldCheck className="w-3 h-3" aria-hidden />
              Consent Audit Active
            </div>

            {/* Physician name pill */}
            <Link
              to="/profile"
              className="hidden sm:flex flex-col text-right px-2 py-1 rounded-[var(--radius-sm)] hover:bg-[var(--surface-2)] transition-colors"
              title="View physician profile"
            >
              <span className="text-sm font-semibold text-[var(--ink)] font-[var(--font-heading)] leading-none">
                {doctorName}
              </span>
              {regNumber && (
                <span className="text-[11px] text-[var(--ink-3)] mt-0.5 font-[var(--font-mono)]">
                  MCI: {regNumber}
                </span>
              )}
            </Link>

            <SignOutConfirmButton />
          </div>
        </div>
      </header>

      {/* ── Workspace content ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}
