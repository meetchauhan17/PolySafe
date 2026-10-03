// src/layouts/CaregiverLayout.jsx — "Clinical Calm" caregiver shell
import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Heart, UserCircle, ShieldCheck, Eye } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import SignOutConfirmButton from '../components/SignOutConfirmButton';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';

export default function CaregiverLayout() {
  const location = useLocation();
  const { user } = useAuth() || {};

  const navItems = [
    {
      label: 'Care Hub',
      path: '/caregiver-view',
      icon: Heart,
      match: (p) => p === '/caregiver-view',
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
      {/* ── Privacy Notice Banner ── */}
      <div
        className="px-4 py-2 border-b text-sm font-medium text-center font-[var(--font-heading)]"
        style={{
          background: 'var(--caregiver-50)',
          borderColor: 'var(--caregiver-600)',
          color: 'var(--caregiver-600)',
        }}
      >
        <div className="flex items-center justify-center gap-2">
          <Eye className="w-3.5 h-3.5" aria-hidden />
          Caregiver view — dosage reminders only · Clinical history protected
        </div>
      </div>

      {/* ── Header ── */}
      <header className="sticky top-[40px] z-50 bg-[var(--surface)]/95 backdrop-blur-sm border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/caregiver-view" className="flex items-center gap-2.5 group flex-shrink-0">
            <div
              className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center group-hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--caregiver-600)' }}
            >
              <Heart className="w-4.5 h-4.5 text-white" aria-hidden />
            </div>
            <div>
              <span className="text-base font-extrabold text-[var(--ink)] font-[var(--font-heading)] tracking-tight">
                Poly<span style={{ color: 'var(--caregiver-600)' }}>Safe</span>
              </span>
              <span
                className="ml-2 text-[11px] font-semibold px-1.5 py-0.5 rounded-[var(--radius-sm)] border"
                style={{
                  color: 'var(--caregiver-600)',
                  background: 'var(--caregiver-50)',
                  borderColor: 'var(--caregiver-100)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                Caregiver
              </span>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1" aria-label="Caregiver navigation">
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
                  style={active ? { backgroundColor: 'var(--caregiver-600)' } : {}}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/profile"
              className="hidden sm:block text-sm font-semibold text-[var(--ink-2)] font-[var(--font-heading)] px-2 py-1 rounded-[var(--radius-sm)] hover:bg-[var(--surface-2)] transition-colors"
            >
              {user?.name || user?.email || 'Caregiver'}
            </Link>
            <SignOutConfirmButton />
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6">
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}
