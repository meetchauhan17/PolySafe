import React from 'react';
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
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../context/AuthContext';
import SignOutConfirmButton from '../components/SignOutConfirmButton';
import LedIndicator from '../components/LedIndicator';

export default function PatientLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isGuest, logout } = useAuth() || {};

  const handleSignOut = () => {
    logout?.();
    navigate('/login', { replace: true });
  };

  const navTabs = [
    {
      id: 'home',
      label: 'Home',
      path: '/home',
      icon: Home,
      match: (p) => p === '/home' || p.startsWith('/risk'),
    },
    {
      id: 'add',
      label: 'Add Med',
      path: '/add-medicine',
      icon: PlusCircle,
      match: (p) => p === '/add-medicine',
    },
    {
      id: 'timeline',
      label: 'Timeline',
      path: '/timeline',
      icon: Clock,
      match: (p) => p === '/timeline',
    },
    {
      id: 'symptoms',
      label: 'Symptoms',
      path: '/log-symptom',
      icon: HeartPulse,
      match: (p) => p === '/log-symptom' || p === '/symptom-result',
    },
    {
      id: 'connected',
      label: 'Connected',
      path: '/connected',
      icon: Users,
      match: (p) => p === '/connected' || p === '/connected-people' || p === '/share',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--chassis)] text-[var(--text-primary)] flex flex-col font-sans selection:bg-[var(--accent-primary)] selection:text-white">
      {/* ─── Persistent Guest Mode Notice Banner ─── */}
      {isGuest && (
        <aside
          aria-label="Guest Mode Status"
          className="bg-[var(--text-primary)] text-white px-4 py-2 text-xs border-b border-[var(--accent-primary)]/40 shadow-sm sticky top-0 z-50"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 font-mono">
            <div className="flex items-center gap-2 min-w-0">
              <LedIndicator status="amber" size="sm" />
              <span className="truncate text-xs">
                GUEST PREVIEW MODE — Log in to persist clinical telemetry
              </span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="underline font-bold text-[var(--led-caution)] hover:text-white transition-colors text-xs whitespace-nowrap cursor-pointer uppercase"
            >
              Sign In
            </button>
          </div>
        </aside>
      )}

      {/* ─── Top Bar: Skeuomorphic Control Header ─── */}
      <header
        className={`sticky ${isGuest ? 'top-[33px]' : 'top-0'} z-40 bg-[var(--chassis)] px-4 sm:px-6 py-3 border-b border-[rgba(255,255,255,0.4)] shadow-[var(--shadow-card)]`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link to="/home" className="flex items-center gap-2.5 group flex-shrink-0">
            <div
              className="p-2.5 bg-[var(--chassis)] text-[var(--accent-primary)] rounded-2xl shadow-[var(--shadow-sm)] group-hover:scale-105 transition-transform"
              style={{ filter: 'drop-shadow(0 0 6px var(--accent-primary-glow))' }}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-[var(--text-primary)] font-display block leading-tight drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">
                PolySafe
              </span>
              <span className="text-[10px] block text-[var(--text-muted)] font-mono font-bold tracking-wider uppercase">
                {isGuest ? 'Demo Workstation' : 'Patient Console'}
              </span>
            </div>
          </Link>

          {/* ── Desktop Navigation Links ── */}
          <nav className="hidden md:flex items-center space-x-2" aria-label="Desktop Patient Navigation">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.match(location.pathname);
              return (
                <Link
                  key={tab.id}
                  to={tab.path}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-[var(--chassis)] text-[var(--accent-primary)] shadow-[var(--shadow-pressed)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--chassis)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card)] hover:-translate-y-0.5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <Link
              to="/insights"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase rounded-xl transition-all ${
                location.pathname === '/insights' || location.pathname === '/trends'
                  ? 'bg-[var(--chassis)] text-[var(--accent-primary)] shadow-[var(--shadow-pressed)]'
                  : 'bg-[var(--chassis)] text-[var(--text-muted)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card)] hover:-translate-y-0.5'
              }`}
              title="Analytics"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span className="hidden sm:inline">Analytics</span>
            </Link>

            <Link
              to="/profile"
              className={`p-2 text-xs font-bold rounded-xl transition-all ${
                location.pathname === '/profile'
                  ? 'bg-[var(--chassis)] text-[var(--accent-primary)] shadow-[var(--shadow-pressed)]'
                  : 'bg-[var(--chassis)] text-[var(--text-muted)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card)] hover:-translate-y-0.5'
              }`}
              title="Profile Settings"
            >
              <UserCircle className="w-4 h-4 text-[var(--accent-primary)]" />
            </Link>

            <SignOutConfirmButton />
          </div>
        </div>
      </header>

      {/* ─── Page Content ─── */}
      <main className="flex-1 pb-32 md:pb-12 max-w-6xl mx-auto w-full px-4 sm:px-6 pt-6">
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>

      {/* ─── Fixed Bottom Tab Bar (Mobile Only) ─── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--chassis)] border-t border-[rgba(255,255,255,0.4)] py-2 px-3 shadow-[var(--shadow-floating)]"
        aria-label="Mobile Patient Navigation"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1.5">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.match(location.pathname);

            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all relative ${
                  isActive
                    ? 'text-[var(--accent-primary)] font-bold bg-[var(--chassis)] shadow-[var(--shadow-pressed)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_6px_1px_var(--accent-primary-glow)]" />
                  )}
                </div>
                <span className="text-[10px] font-mono font-bold mt-1 tracking-tight leading-none uppercase">
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
