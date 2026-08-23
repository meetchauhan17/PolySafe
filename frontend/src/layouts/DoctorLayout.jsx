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
    <div className="min-h-screen bg-[var(--chassis)] text-[var(--text-primary)] flex flex-col font-sans selection:bg-[var(--accent-secondary)] selection:text-white relative overflow-x-hidden">
      {/* ─── Clinical Header ─── */}
      <header className="sticky top-0 z-40 bg-[var(--chassis)] border-b border-[rgba(255,255,255,0.4)] px-4 sm:px-6 py-3.5 shadow-[var(--shadow-card)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Portal Branding */}
          <Link to="/doctor-dashboard" className="flex items-center gap-3 group">
            <div
              className="p-2.5 bg-[var(--chassis)] text-[var(--accent-secondary)] rounded-2xl shadow-[var(--shadow-sm)] group-hover:scale-105 transition-transform"
              style={{ filter: 'drop-shadow(0 0 6px var(--accent-secondary-glow))' }}
            >
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xl font-extrabold tracking-tight text-[var(--text-primary)] font-display drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]"
                >
                  PolySafe
                </span>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-[var(--chassis)] text-[var(--accent-secondary)] shadow-[var(--shadow-recessed)]">
                  Doctor Station
                </span>
              </div>
              <span className="text-[11px] font-mono text-[var(--text-muted)] font-semibold hidden sm:inline">
                Clinical Pharmacovigilance & Deprescribing System
              </span>
            </div>
          </Link>

          {/* Navigation Items (Workstation + Physician Profile) */}
          <div className="flex items-center gap-1.5 p-1 bg-[var(--chassis)] border border-[rgba(255,255,255,0.4)] shadow-[var(--shadow-recessed)] rounded-2xl">
            <Link
              to="/doctor-dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isDashboard
                  ? 'bg-gradient-to-r from-[#0d9488] to-[#0f766e] text-white font-bold shadow-sm border border-white/20'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--chassis-dark)]/30'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Workstation</span>
            </Link>

            <Link
              to="/profile"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isProfile
                  ? 'bg-gradient-to-r from-[#0d9488] to-[#0f766e] text-white font-bold shadow-sm border border-white/20'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--chassis-dark)]/30'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </Link>
          </div>

          {/* Physician Info & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[var(--chassis)] rounded-full shadow-[var(--shadow-recessed)] text-[11px] font-mono font-bold text-[var(--text-muted)]">
              <LedIndicator status="online" size="sm" />
              <span>CONSENT AUDIT ACTIVE</span>
            </div>

            {/* Doctor Profile Tag (Clickable to Profile) */}
            <Link
              to="/profile"
              className="hidden sm:flex flex-col text-right font-mono p-1.5 rounded-xl hover:bg-[var(--chassis-dark)] transition-colors cursor-pointer"
              title="View & Edit Physician Profile"
            >
              <span className="text-xs font-bold text-[var(--text-primary)]">{doctorName}</span>
              {regNumber && (
                <span className="text-[10px] text-[var(--text-muted)]">MCI: {regNumber}</span>
              )}
            </Link>

            <SignOutConfirmButton buttonText="Sign Out" />
          </div>
        </div>
      </header>

      {/* ─── Clinical Body Workspace with PageTransition ─── */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}
