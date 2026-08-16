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
 * DoctorLayout.jsx — Desktop-oriented clinical shell for Physicians & Doctors (Neumorphic Edition)
 *
 * Characteristics:
 * - Dedicated Clinical Top Bar: PolySafe branding, Physician identifier, Read-Only indicator, Sign Out
 * - Clean workstation workspace on warm clay (#EDE8DC) molded canvas
 * - Strict read-only enforcement: no modification actions exposed
 */
export default function DoctorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const doctorName = user?.doctor?.name || user?.name || (user?.email ? `Dr. ${user.email.split('@')[0]}` : 'Dr. Physician, MD');
  const regNumber  = user?.doctor?.registrationNumber || user?.registrationNumber;

  return (
    <div className="min-h-screen bg-[#EDE8DC] text-[#1C2B27] flex flex-col font-sans selection:bg-[#1B4B66] selection:text-white relative overflow-x-hidden">
      {/* ─── Clinical Header ─── */}
      <header className="sticky top-0 z-40 bg-[#EDE8DC]/90 backdrop-blur-md px-6 py-3.5 shadow-[0_4px_14px_rgba(191,180,155,0.40)] relative">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Portal Branding */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#1B4B66] text-white rounded-2xl shadow-[4px_4px_10px_rgba(191,180,155,0.55),-4px_-4px_10px_rgba(255,255,255,0.65)]">
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
              <span className="text-[11px] text-[#5C6B64] font-semibold">
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
              <span className="text-xs font-bold text-[#1C2B27]">{doctorName}</span>
              {regNumber && (
                <span className="text-[10px] font-mono text-[#5C6B64]">Reg: {regNumber}</span>
              )}
            </div>

            <SignOutConfirmButton />
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
