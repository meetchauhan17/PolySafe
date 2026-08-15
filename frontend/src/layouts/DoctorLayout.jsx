import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import {
  Stethoscope,
  Shield,
  LogOut,
  Building2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SignOutConfirmButton from '../components/SignOutConfirmButton';

/**
 * DoctorLayout.jsx — Desktop-oriented clinical shell for Physicians & Doctors
 *
 * Characteristics:
 * - Dedicated Clinical Top Bar: PolySafe branding, Physician identifier, Read-Only indicator, Sign Out
 * - Clean workstation workspace without patient navigation items (no bottom bar, no add-medicine tabs)
 * - Strict read-only enforcement: no modification actions exposed
 */
export default function DoctorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const doctorName = user?.doctor?.name || user?.name || (user?.email ? `Dr. ${user.email.split('@')[0]}` : 'Dr. Physician, MD');
  const regNumber  = user?.doctor?.registrationNumber || user?.registrationNumber;

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FBF8F2] text-[#232724] flex flex-col font-sans selection:bg-[#1B4B66] selection:text-white relative overflow-x-hidden">
      {/* ─── Layered Depth Background (Subtle Clinical Gradient Mesh) ─── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Top-right subtle clinical teal glow */}
        <div
          className="absolute -top-[15%] -right-[8%] w-[650px] h-[650px] rounded-full opacity-30 blur-[130px]"
          style={{
            background: 'radial-gradient(circle, rgba(43, 110, 94, 0.22) 0%, rgba(27, 75, 102, 0.08) 55%, transparent 75%)',
          }}
        />
        {/* Bottom-left warm parchment ambient warmth */}
        <div
          className="absolute -bottom-[15%] -left-[8%] w-[600px] h-[600px] rounded-full opacity-35 blur-[140px]"
          style={{
            background: 'radial-gradient(circle, rgba(224, 130, 75, 0.12) 0%, rgba(231, 225, 211, 0.3) 60%, transparent 80%)',
          }}
        />
        {/* Center subtle clinical light bridge */}
        <div
          className="absolute top-[35%] left-[25%] w-[500px] h-[350px] rounded-full opacity-15 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, rgba(43, 110, 94, 0.15) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* ─── Clinical Header ─── */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF]/90 backdrop-blur-md border-b-2 border-[#E7E1D3] px-6 py-3.5 shadow-sm relative">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Portal Branding */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#1B4B66] text-white rounded-xl shadow-sm">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xl font-bold tracking-tight text-[#1B4B66]"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  PolySafe
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#1B4B66]/10 text-[#1B4B66] border border-[#1B4B66]/20">
                  Doctor Portal
                </span>
              </div>
              <span className="text-[11px] text-[#6B726C] font-semibold">
                Clinical Pharmacovigilance & Deprescribing Decision Support
              </span>
            </div>
          </div>

          {/* Physician Info & Actions */}
          <div className="flex items-center gap-4">
            {/* Read-only assurance badge */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-[#E4F2E9] border border-[#2F8558]/30 rounded-full text-[11px] font-bold text-[#2B6E5E]">
              <Shield className="w-3.5 h-3.5" />
              <span>Consent-Based Read-Only Access</span>
            </div>

            {/* Doctor Profile Tag */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-[#232724]">{doctorName}</span>
              {regNumber && (
                <span className="text-[10px] text-[#6B726C] font-mono">Reg #{regNumber}</span>
              )}
            </div>

            {/* Sign Out */}
            <SignOutConfirmButton buttonText="Sign Out" />
          </div>
        </div>
      </header>

      {/* ─── Workstation Body with AnimatePresence & PageTransition ─── */}
      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>

      {/* ─── Professional Clinical Footer ─── */}
      <footer className="border-t-2 border-[#E7E1D3] bg-white/90 backdrop-blur-sm py-4 text-xs text-[#6B726C] relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#2B6E5E]" />
            <span>Encrypted HIPAA/GDPR Compliant Read-Only Consultation Session</span>
          </div>
          <span>DDInter & ACB Cumulative Burden Scoring Database</span>
        </div>
      </footer>
    </div>
  );
}
