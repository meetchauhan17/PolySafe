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
    <div className="min-h-screen bg-[var(--chassis)] text-[var(--text-primary)] flex flex-col font-sans selection:bg-[var(--role-caregiver)] selection:text-white">
      {/* ─── Top Bar ─── */}
      <header className="sticky top-0 z-40 bg-[var(--chassis)] border-b border-[rgba(255,255,255,0.4)] px-4 sm:px-6 py-3 shadow-[var(--shadow-card)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <Link to="/caregiver-view" className="flex items-center gap-2.5 group">
            <div
              className="p-2.5 bg-[var(--chassis)] text-[var(--role-caregiver)] rounded-2xl shadow-[var(--shadow-sm)] group-hover:scale-105 transition-transform"
            >
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xl font-extrabold tracking-tight text-[var(--text-primary)] font-display drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]"
                >
                  PolySafe
                </span>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-[var(--chassis)] text-[var(--role-caregiver)] shadow-[var(--shadow-recessed)]">
                  Caregiver
                </span>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] font-bold uppercase tracking-wider hidden sm:inline">
                Family & Care Companion
              </span>
            </div>
          </Link>

          {/* Navigation Items (Hub + Profile) */}
          <div className="flex items-center gap-2">
            <Link
              to="/caregiver-view"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                isDashboard
                  ? 'bg-[var(--role-caregiver)] text-white shadow-xs'
                  : 'bg-[var(--chassis)] text-[var(--text-muted)] hover:text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Caregiver Hub</span>
            </Link>

            <Link
              to="/profile"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                isProfile
                  ? 'bg-[var(--role-caregiver)] text-white shadow-xs'
                  : 'bg-[var(--chassis)] text-[var(--text-muted)] hover:text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              className="hidden sm:inline-block text-xs font-mono font-bold text-[var(--text-primary)] px-2 py-1 rounded-lg hover:bg-[var(--chassis-dark)] transition-colors"
              title="View Caregiver Profile"
            >
              {user?.name || user?.email || 'Caregiver'}
            </Link>
            <SignOutConfirmButton buttonText="Sign Out" />
          </div>
        </div>
      </header>

      {/* ─── Content ─── */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>

      {/* ─── Footer ─── */}
      <footer className="bg-[var(--chassis)] border-t border-[rgba(255,255,255,0.4)] py-4 text-center text-xs font-mono text-[var(--text-muted)] shadow-[var(--shadow-card)]">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1">
          <span className="font-bold text-[var(--role-caregiver)]">CAREGIVER PRIVACY FILTER ACTIVE</span>
          <span>Dosage reminders only · Clinical history protected</span>
        </div>
      </footer>
    </div>
  );
}
