import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Home,
  PlusCircle,
  Clock,
  HeartPulse,
  Users,
  LogOut,
  Sparkles,
  TrendingUp,
  Lock,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../context/AuthContext';

/**
 * PatientLayout.jsx — Mobile-first shell for Patient users
 *
 * Structure:
 * - Persistent Guest Banner (if browsing as Guest)
 * - Clean Top Bar: Logo + App name + Sign Out
 * - Main content container: Single column, warm paper background (#FBF8F2), padded for bottom bar
 * - Fixed Bottom Tab Bar: 5 primary thumb-accessible destinations (Home, Add, Timeline, Symptoms, Connected)
 */
export default function PatientLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isGuest, logout, openGuestLockModal } = useAuth();

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navTabs = [
    {
      id: 'home',
      label: 'Home',
      path: '/home',
      icon: Home,
      match: (p) => p === '/home' || p.startsWith('/risk'),
      isWrite: false,
    },
    {
      id: 'add',
      label: 'Add',
      path: '/add-medicine',
      icon: PlusCircle,
      match: (p) => p === '/add-medicine',
      isWrite: true,
      featureName: 'add medications',
    },
    {
      id: 'timeline',
      label: 'Timeline',
      path: '/timeline',
      icon: Clock,
      match: (p) => p === '/timeline',
      isWrite: false,
    },
    {
      id: 'symptoms',
      label: 'Symptoms',
      path: '/log-symptom',
      icon: HeartPulse,
      match: (p) => p === '/log-symptom' || p === '/symptom-result',
      isWrite: true,
      featureName: 'log symptoms',
    },
    {
      id: 'connected',
      label: 'Connected',
      path: '/connected-people',
      icon: Users,
      match: (p) => p === '/connected-people' || p === '/share-with-doctor',
      isWrite: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBF8F2] text-[#232724] flex flex-col font-sans selection:bg-[#2B6E5E] selection:text-white">
      {/* ─── Persistent Guest Mode Notice Banner ─── */}
      {isGuest && (
        <aside
          aria-label="Guest Mode Status"
          className="bg-[#1C2B27] text-white px-4 py-2 text-xs border-b border-[#2B6E5E]/40 shadow-sm sticky top-0 z-50"
        >
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-block w-2 h-2 rounded-full bg-[#E5A93C] flex-shrink-0 animate-pulse" />
              <span className="text-[#E7E1D3] truncate">
                You're browsing as a <strong className="text-white">guest</strong> — sign in to save real data
              </span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="underline font-bold text-[#E5A93C] hover:text-white transition-colors text-xs whitespace-nowrap"
            >
              Sign In
            </button>
          </div>
        </aside>
      )}

      {/* ─── Top Bar: Minimalist Branding & Sign Out ─── */}
      <header className={`sticky ${isGuest ? 'top-[33px]' : 'top-0'} z-40 bg-[#FBF8F2]/90 backdrop-blur-md border-b-2 border-[#E7E1D3] px-4 py-3`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2.5 group">
            <div className="p-2 bg-[#2B6E5E] text-white rounded-xl shadow-sm group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span
                className="text-xl font-bold tracking-tight text-[#2B6E5E]"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                PolySafe
              </span>
              <span className="text-[10px] block text-[#6B726C] font-semibold tracking-wide">
                {isGuest ? 'Demo Patient Portal' : 'Patient Safety Portal'}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/insights"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                location.pathname === '/insights' || location.pathname === '/trends'
                  ? 'bg-[#2B6E5E] text-white border-[#2B6E5E] shadow-sm'
                  : 'bg-white text-[#2B6E5E] border-[#E7E1D3] hover:border-[#2B6E5E] hover:bg-[#E4F2E9]/40'
              }`}
              title="View Safety Insights & Trends"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Insights</span>
            </Link>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#6B726C] hover:text-[#B23D25] hover:bg-[#FBE4DE]/50 rounded-xl border border-[#E7E1D3] transition-colors"
              title={isGuest ? 'Exit Guest Mode' : 'Sign Out of PolySafe'}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isGuest ? 'Exit Demo' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Page Content with AnimatePresence & PageTransition ─── */}
      <main className="flex-1 pb-24">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>

      {/* ─── Fixed Bottom Tab Bar ─── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t-2 border-[#E7E1D3] py-1.5 px-2 shadow-[0_-4px_20px_rgba(28,43,39,0.08)]"
        aria-label="Patient Navigation"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.match(location.pathname);
            const isLockedForGuest = isGuest && tab.isWrite;

            const handleTabClick = (e) => {
              if (isLockedForGuest) {
                e.preventDefault();
                openGuestLockModal(tab.featureName || 'access this feature');
              }
            };

            return (
              <Link
                key={tab.id}
                to={tab.path}
                onClick={handleTabClick}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
                  isActive
                    ? 'text-[#2B6E5E] font-bold bg-[#E4F2E9]'
                    : 'text-[#6B726C] hover:text-[#232724] hover:bg-[#F5F0E8]'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#2B6E5E]" />
                  )}
                  {isLockedForGuest && (
                    <span className="absolute -top-1 -right-1.5 bg-[#8A6D3B] text-white p-0.5 rounded-full ring-1 ring-white shadow-xs">
                      <Lock className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight leading-none flex items-center gap-0.5">
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
