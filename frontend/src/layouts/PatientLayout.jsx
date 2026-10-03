// src/layouts/PatientLayout.jsx
// "Clinical Calm" shell — clean top nav + mobile tab bar
import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Home,
  PlusCircle,
  Clock,
  HeartPulse,
  Users,
  TrendingUp,
  UserCircle,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../context/AuthContext';
import SignOutConfirmButton from '../components/SignOutConfirmButton';
import { clsx } from 'clsx';

const navItems = [
  { id: 'home',     label: 'Home',      path: '/home',        icon: Home,
    match: (p) => p === '/home' || p.startsWith('/risk') },
  { id: 'add',      label: 'Add Med',   path: '/add-medicine', icon: PlusCircle,
    match: (p) => p === '/add-medicine' },
  { id: 'timeline', label: 'Timeline',  path: '/timeline',     icon: Clock,
    match: (p) => p === '/timeline' },
  { id: 'symptoms', label: 'Symptoms',  path: '/log-symptom',  icon: HeartPulse,
    match: (p) => p === '/log-symptom' || p === '/symptom-result' },
  { id: 'connected',label: 'Connected', path: '/connected',    icon: Users,
    match: (p) => p === '/connected' || p === '/connected-people' || p === '/share' },
];

function NavLink({ item, location }) {
  const Icon = item.icon;
  const active = item.match(location.pathname);
  return (
    <Link
      to={item.path}
      className={clsx(
        'flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius-sm)] text-sm font-semibold',
        'font-[var(--font-heading)] transition-all duration-150 whitespace-nowrap',
        active
          ? 'bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-100)]'
          : 'text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] border border-transparent'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-4 h-4 flex-shrink-0" aria-hidden />
      {item.label}
    </Link>
  );
}

export default function PatientLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isGuest, logout } = useAuth() || {};
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    logout?.();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] flex flex-col">
      {/* ── Guest Banner ── */}
      {isGuest && (
        <div
          role="banner"
          className="bg-[var(--caution-bg)] border-b border-[var(--caution-fg)]/30 px-4 py-2.5"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--caution-fg)] opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--caution-fg)]" />
              </span>
              <span className="text-sm font-medium text-[var(--caution-fg)] truncate font-[var(--font-heading)]">
                Guest preview — data is not saved
              </span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm font-semibold text-[var(--caution-fg)] underline underline-offset-2 hover:no-underline whitespace-nowrap"
            >
              Sign in
            </button>
          </div>
        </div>
      )}

      {/* ── Top Nav Bar ── */}
      <header className="sticky top-0 z-50 bg-[var(--surface)]/95 backdrop-blur-sm border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Brand mark */}
          <Link to="/home" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-8 h-8 bg-[var(--brand-600)] rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--brand-700)] transition-colors">
              <ShieldCheck className="w-4.5 h-4.5 text-white" aria-hidden />
            </div>
            <span className="text-base font-extrabold text-[var(--ink)] font-[var(--font-heading)] tracking-tight">
              Poly<span className="text-[var(--brand-600)]">Safe</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center" aria-label="Patient navigation">
            {navItems.map((item) => (
              <NavLink key={item.id} item={item} location={location} />
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Analytics — desktop only */}
            <Link
              to="/insights"
              className={clsx(
                'hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-sm)] text-sm font-semibold',
                'font-[var(--font-heading)] transition-all duration-150',
                location.pathname === '/insights' || location.pathname === '/trends'
                  ? 'bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-100)]'
                  : 'text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] border border-transparent'
              )}
            >
              <TrendingUp className="w-4 h-4" aria-hidden />
              Analytics
            </Link>

            {/* Profile */}
            <Link
              to="/profile"
              className={clsx(
                'flex items-center justify-center w-9 h-9 rounded-[var(--radius-sm)] transition-colors',
                location.pathname === '/profile'
                  ? 'bg-[var(--brand-50)] text-[var(--brand-700)]'
                  : 'text-[var(--ink-3)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]'
              )}
              aria-label="Profile"
            >
              <UserCircle className="w-5 h-5" aria-hidden />
            </Link>

            {/* Sign out — desktop */}
            <SignOutConfirmButton />

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-[var(--radius-sm)] text-[var(--ink-3)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] transition-colors"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer (drop-down) */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden overflow-hidden border-t border-[var(--border)] bg-[var(--surface)]"
            >
              <nav
                className="p-3 grid grid-cols-2 gap-1.5"
                aria-label="Mobile patient navigation"
                onClick={() => setMobileMenuOpen(false)}
              >
                {[...navItems, {
                  id: 'analytics', label: 'Analytics', path: '/insights',
                  icon: TrendingUp, match: (p) => p === '/insights' || p === '/trends',
                }].map((item) => {
                  const Icon = item.icon;
                  const active = item.match(location.pathname);
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      className={clsx(
                        'flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-semibold',
                        'font-[var(--font-heading)] transition-colors',
                        active
                          ? 'bg-[var(--brand-50)] text-[var(--brand-700)]'
                          : 'text-[var(--ink-2)] hover:bg-[var(--surface-2)]'
                      )}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {item.label}
                      {active && <ChevronRight className="w-3 h-3 ml-auto" />}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Page Content ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 pb-24 md:pb-8">
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface)]/95 backdrop-blur-sm border-t border-[var(--border)]"
        aria-label="Mobile tab bar"
      >
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.match(location.pathname);
            return (
              <Link
                key={item.id}
                to={item.path}
                className={clsx(
                  'flex flex-col items-center justify-center gap-0.5 py-2 px-1 transition-colors',
                  active
                    ? 'text-[var(--brand-600)]'
                    : 'text-[var(--ink-3)] hover:text-[var(--ink-2)]'
                )}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                <div className="relative">
                  <Icon className={clsx('w-5 h-5', active && 'stroke-[2.5]')} aria-hidden />
                  {active && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[var(--brand-600)]"
                      aria-hidden
                    />
                  )}
                </div>
                <span className={clsx(
                  'text-[10px] font-semibold font-[var(--font-heading)] tracking-tight leading-none',
                  active ? 'text-[var(--brand-600)]' : ''
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        {/* Safe area padding for notched phones */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
