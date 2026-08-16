import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  Heart,
  ShieldCheck,
  LogOut,
  UserCheck,
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../context/AuthContext';
import SignOutConfirmButton from '../components/SignOutConfirmButton';

/**
 * CaregiverLayout.jsx — Simple, focused shell for Family Members & Caregivers (Neumorphic Edition)
 *
 * Characteristics:
 * - Clean, distraction-free layout on warm clay (#EDE8DC) canvas
 * - Minimal Top Bar: PolySafe branding, Caregiver Companion tag, Sign Out
 * - Focused purely on checking loved ones' medication status and reminder times
 */
export default function CaregiverLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#EDE8DC] text-[#1C2B27] flex flex-col font-sans selection:bg-[#8A6D3B] selection:text-white">
      {/* ─── Top Bar: Logo + Caregiver Badge + Sign Out ─── */}
      <header className="sticky top-0 z-40 bg-[#EDE8DC]/95 backdrop-blur-md px-4 py-3 shadow-[0_4px_14px_rgba(191,180,155,0.40)]">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link to="/caregiver-view" className="flex items-center gap-2.5 group">
            <div className="p-2.5 bg-[#8A6D3B] text-white rounded-2xl shadow-[4px_4px_10px_rgba(191,180,155,0.55),-4px_-4px_10px_rgba(255,255,255,0.65)] group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xl font-bold tracking-tight text-[#8A6D3B]"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  PolySafe
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8A6D3B]/10 text-[#8A6D3B] border border-[#8A6D3B]/20">
                  Caregiver
                </span>
              </div>
              <span className="text-[10px] block text-[#5C6B64] font-semibold">
                Family & Caregiver Companion
              </span>
            </div>
          </Link>

          <SignOutConfirmButton buttonText="Sign Out" />
        </div>
      </header>

      {/* ─── Single Centered Column Body with PageTransition ─── */}
      <main className="flex-1">
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>

      {/* ─── Caregiver Disclaimer Footer ─── */}
      <footer className="bg-[#EDE8DC] py-4 text-center text-xs text-[#5C6B64] shadow-[0_-4px_14px_rgba(191,180,155,0.30)]">
        <div className="max-w-xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1">
          <span className="font-semibold text-[#8A6D3B]">Caregiver Privacy Protection Active</span>
          <span>Dosage reminders only · Clinical history protected</span>
        </div>
      </footer>
    </div>
  );
}
