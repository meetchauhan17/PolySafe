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
    <div className="relative min-h-screen bg-[#dce4ee] text-slate-900 flex flex-col font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      {/* ── Background Precision Dot Matrix ── */}
      <div className="fixed inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none z-0" />

      {/* ── Atmospheric Ambient Lighting Orbs ── */}
      <div className="fixed -top-36 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-b from-blue-600/12 via-cyan-500/8 to-transparent rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed top-1/4 -left-48 w-[450px] h-[450px] bg-emerald-500/8 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-10 -right-48 w-[450px] h-[450px] bg-indigo-600/8 rounded-full blur-3xl pointer-events-none z-0" />

      {/* ─── Persistent Guest Mode Notice Banner ─── */}
      {isGuest && (
        <aside
          aria-label="Guest Mode Status"
          className="bg-slate-900 text-white px-4 py-2 text-xs border-b border-blue-500/40 shadow-sm sticky top-0 z-50 relative"
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 font-mono">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
              </span>
              <span className="truncate text-xs">
                GUEST PREVIEW MODE — Log in to persist clinical telemetry
              </span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="underline font-bold text-amber-300 hover:text-white transition-colors text-xs whitespace-nowrap cursor-pointer uppercase"
            >
              Sign In
            </button>
          </div>
        </aside>
      )}

      {/* ─── Top Bar: Modern Glassmorphic Header ─── */}
      <header
        className={`sticky ${isGuest ? 'top-[33px]' : 'top-0'} z-40 bg-slate-50/90 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <Link to="/home" className="flex items-center gap-3 group flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 font-display block leading-tight">
                Poly<span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Safe</span>
              </span>
              <span className="text-[10px] block text-slate-500 font-mono uppercase tracking-widest -mt-0.5 font-semibold">
                {isGuest ? 'Demo Workstation' : 'Patient Console'}
              </span>
            </div>
          </Link>

          {/* ── Desktop Navigation Links ── */}
          <nav className="hidden md:flex items-center space-x-1.5 flex-shrink-0" aria-label="Desktop Patient Navigation">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.match(location.pathname);
              return (
                <Link
                  key={tab.id}
                  to={tab.path}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-xs border border-slate-200/90'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Live Clinical Engine Indicator */}
            <div className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 text-[11px] font-semibold text-slate-700 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Clinical Engine v2.4</span>
            </div>

            <Link
              to="/insights"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase rounded-xl transition-all ${
                location.pathname === '/insights' || location.pathname === '/trends'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/90'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent'
              }`}
              title="Analytics"
            >
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Analytics</span>
            </Link>

            <Link
              to="/profile"
              className={`p-2 text-xs font-bold rounded-xl transition-all ${
                location.pathname === '/profile'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/90'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent'
              }`}
              title="Profile Settings"
            >
              <UserCircle className="w-4 h-4 text-blue-600" />
            </Link>

            <SignOutConfirmButton />
          </div>
        </div>
      </header>

      {/* ─── Page Content ─── */}
      <main className="relative z-10 flex-1 pb-32 md:pb-12 max-w-6xl mx-auto w-full px-4 sm:px-6 pt-6">
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>

      {/* ─── Fixed Bottom Tab Bar (Mobile Only) ─── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-50/95 backdrop-blur-md border-t border-slate-200/80 py-2 px-3 shadow-[0_-4px_16px_rgba(15,23,42,0.06)]"
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
                    ? 'text-blue-600 font-bold bg-white shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_6px_1px_rgba(37,99,235,0.4)]" />
                  )}
                </div>
                <span className="text-[10px] font-mono font-bold mt-1 tracking-tight leading-none uppercase whitespace-nowrap">
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
