import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Heart, User, ShieldCheck } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import SignOutConfirmButton from '../components/SignOutConfirmButton';
import { useAuth } from '../context/AuthContext';

export default function CaregiverLayout() {
  const location = useLocation();
  const { user } = useAuth() || {};

  const isProfile = location.pathname === '/profile';
  const isDashboard = location.pathname === '/caregiver-view';

  return (
    <div className="relative min-h-screen bg-[var(--chassis)] text-[var(--text-primary)] flex flex-col font-sans selection:bg-teal-500 selection:text-white overflow-x-hidden">
      {/* ── Background Precision Dot Matrix ── */}
      <div className="fixed inset-0 bg-[radial-gradient(#c7d2fe_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none z-0" />

      {/* ── Atmospheric Ambient Lighting Orbs ── */}
      <div className="fixed -top-36 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-b from-emerald-600/12 via-teal-500/8 to-transparent rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed top-1/4 -left-48 w-[450px] h-[450px] bg-teal-500/8 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-10 -right-48 w-[450px] h-[450px] bg-blue-600/8 rounded-full blur-3xl pointer-events-none z-0" />

      {/* ─── Top Bar ─── */}
      <header className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <Link to="/caregiver-view" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 font-display">
                  Poly<span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Safe</span>
                </span>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 shadow-2xs">
                  Family Proxy
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 font-semibold uppercase tracking-wider hidden sm:inline">
                Family & Care Companion
              </span>
            </div>
          </Link>

          {/* Navigation Items (Hub + Profile) */}
          <div className="flex items-center gap-1.5 p-1 bg-white/80 border border-slate-200 shadow-2xs rounded-2xl">
            <Link
              to="/caregiver-view"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isDashboard
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Caregiver Hub</span>
            </Link>

            <Link
              to="/profile"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isProfile
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              className="hidden sm:inline-block text-xs font-mono font-bold text-slate-800 px-3 py-1.5 rounded-xl hover:bg-white/60 border border-transparent hover:border-slate-200 transition-colors"
              title="View Caregiver Profile"
            >
              {user?.name || user?.email || 'Caregiver'}
            </Link>
            <SignOutConfirmButton buttonText="Sign Out" />
          </div>
        </div>
      </header>

      {/* ─── Content ─── */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 bg-slate-50/90 border-t border-slate-200 py-4 text-center text-xs font-mono text-slate-500 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1">
          <span className="font-bold text-emerald-700">CAREGIVER PRIVACY FILTER ACTIVE</span>
          <span>Dosage reminders only · Clinical history protected</span>
        </div>
      </footer>
    </div>
  );
}

