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

/**
 * CaregiverLayout.jsx — Simple, focused shell for Family Members & Caregivers
 *
 * Characteristics:
 * - Clean, distraction-free layout (single centered column, no sidebars, no multi-tab navigation)
 * - Minimal Top Bar: PolySafe branding, Caregiver Companion tag, Sign Out
 * - Focused purely on checking loved ones' medication status and reminder times
 */
export default function CaregiverLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FBF8F2] text-[#232724] flex flex-col font-sans selection:bg-[#8A6D3B] selection:text-white">
      {/* ─── Top Bar: Logo + Caregiver Badge + Sign Out ─── */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-b-2 border-[#E7E1D3] px-4 py-3 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link to="/caregiver-view" className="flex items-center gap-2.5 group">
            <div className="p-2 bg-[#8A6D3B] text-white rounded-xl shadow-sm group-hover:scale-105 transition-transform">
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
              <span className="text-[10px] block text-[#6B726C] font-semibold">
                Family & Caregiver Companion
              </span>
            </div>
          </Link>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#6B726C] hover:text-[#B23D25] hover:bg-[#FBE4DE]/50 rounded-xl border border-[#E7E1D3] transition-colors"
            title="Sign Out of Caregiver Portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* ─── Single Centered Column Body with AnimatePresence & PageTransition ─── */}
      <main className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>

      {/* ─── Caregiver Disclaimer Footer ─── */}
      <footer className="border-t-2 border-[#E7E1D3] bg-white py-4 text-center text-xs text-[#6B726C]">
        <div className="max-w-xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1">
          <span className="font-semibold text-[#8A6D3B]">Caregiver Privacy Protection Active</span>
          <span>Dosage reminders only · Clinical history protected</span>
        </div>
      </footer>
    </div>
  );
}
