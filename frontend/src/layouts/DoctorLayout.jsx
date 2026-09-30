import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Stethoscope,
  Shield,
  User,
  LayoutDashboard,
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../context/AuthContext';
import SignOutConfirmButton from '../components/SignOutConfirmButton';
import LedIndicator from '../components/LedIndicator';

export default function DoctorLayout() {
  const location = useLocation();
  const { user } = useAuth() || {};

  const doctorName = user?.doctor?.name || user?.name || (user?.email ? `Dr. ${user.email.split('@')[0]}` : 'Dr. Physician, MD');
  const regNumber  = user?.doctor?.registrationNumber || user?.registrationNumber;

  const isProfile = location.pathname === '/profile';
  const isDashboard = location.pathname === '/doctor-dashboard';

  return (
    <div className="relative min-h-screen bg-[var(--chassis)] text-[var(--text-primary)] flex flex-col font-sans selection:bg-violet-500 selection:text-white overflow-x-hidden">
      {/* ── Background Precision Dot Matrix ── */}
      <div className="fixed inset-0 bg-[radial-gradient(#c7d2fe_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none z-0" />

      {/* ── Atmospheric Ambient Lighting Orbs ── */}
      <div className="fixed -top-36 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-b from-teal-600/12 via-cyan-500/8 to-transparent rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed top-1/4 -left-48 w-[450px] h-[450px] bg-emerald-500/8 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-10 -right-48 w-[450px] h-[450px] bg-blue-600/8 rounded-full blur-3xl pointer-events-none z-0" />

      {/* ─── Clinical Header ─── */}
      <header className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Portal Branding */}
          <Link to="/doctor-dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 via-cyan-600 to-emerald-500 p-0.5 shadow-lg shadow-teal-500/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 font-display">
                  Poly<span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">Safe</span>
                </span>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 border border-teal-500/20 shadow-2xs">
                  Doctor Station
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 font-semibold hidden sm:inline">
                Clinical Pharmacovigilance & Deprescribing System
              </span>
            </div>
          </Link>

          {/* Navigation Items (Workstation + Physician Profile) */}
          <div className="flex items-center gap-1.5 p-1 bg-white/80 border border-slate-200 shadow-2xs rounded-2xl">
            <Link
              to="/doctor-dashboard"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isDashboard
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Workstation</span>
            </Link>

            <Link
              to="/profile"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isProfile
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </Link>
          </div>

          {/* Physician Info & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/80 border border-slate-200 rounded-full shadow-2xs text-[11px] font-mono font-bold text-slate-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>CONSENT AUDIT ACTIVE</span>
            </div>

            {/* Doctor Profile Tag (Clickable to Profile) */}
            <Link
              to="/profile"
              className="hidden sm:flex flex-col text-right font-mono p-1.5 rounded-xl hover:bg-white/60 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              title="View & Edit Physician Profile"
            >
              <span className="text-xs font-bold text-slate-900">{doctorName}</span>
              {regNumber && (
                <span className="text-[10px] text-slate-500 font-mono">MCI: {regNumber}</span>
              )}
            </Link>

            <SignOutConfirmButton buttonText="Sign Out" />
          </div>
        </div>
      </header>

      {/* ─── Clinical Body Workspace with PageTransition ─── */}
      <main className="relative z-10 flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}

