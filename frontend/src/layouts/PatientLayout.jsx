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
  UserCircle,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../context/AuthContext';
import SignOutConfirmButton from '../components/SignOutConfirmButton';

/**
 * PatientLayout.jsx — Mobile-first shell for Patient users (Neumorphic Edition)
 *
 * Structure:
 * - Persistent Guest Banner (if browsing as Guest)
 * - Clean Top Bar: Logo + App name + Sign Out (molded clay styling)
 * - Main content container: Single column, warm clay background (#EDE8DC), padded for bottom bar
 * - Fixed Bottom Tab Bar: 5 primary thumb-accessible destinations with soft inset wells
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
    <div className="min-h-screen bg-[#EDE8DC] text-[#1C2B27] flex flex-col font-sans selection:bg-[#2B6E5E] selection:text-white">
      {/* ─── Persistent Guest Mode Notice Banner ─── */}
      {isGuest && (
        <aside
          aria-label="Guest Mode Status"
          className="bg-[#1C2B27] text-white px-4 py-2 text-xs border-b border-[#2B6E5E]/40 shadow-sm sticky top-0 z-50"
        >
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-block w-2 h-2 rounded-full bg-[#E5A93C] flex-shrink-0 animate-pulse" />
              <span className="text-[#EDE8DC] truncate">
                You're browsing as a <strong className="text-white">guest</strong> — sign in to save real data
              </span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="underline font-bold text-[#E5A93C] hover:text-white transition-colors text-xs whitespace-nowrap cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </aside>
      )}

      {/* ─── Top Bar: Minimalist Branding, Desktop Nav & Sign Out ─── */}
      <header
        className={`sticky ${isGuest ? 'top-[33px]' : 'top-0'} z-40 bg-[#EDE8DC]/90 backdrop-blur-md px-4 sm:px-6 py-3 shadow-[0_4px_14px_rgba(191,180,155,0.40)]`}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Link to="/home" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="p-2.5 bg-[#2B6E5E] text-white rounded-2xl shadow-[4px_4px_10px_rgba(191,180,155,0.55),-4px_-4px_10px_rgba(255,255,255,0.65)] group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span
                className="text-xl font-bold tracking-tight text-[#2B6E5E]"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                PolySafe
              </span>
              <span className="text-[10px] block text-[#5C6B64] font-semibold tracking-wide">
                {isGuest ? 'Demo Patient Portal' : 'Patient Safety Portal'}
              </span>
            </div>
          </Link>

          {/* ── Desktop Navigation Links ── */}
          <nav className="hidden md:flex items-center space-x-1.5" aria-label="Desktop Patient Navigation">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.match(location.pathname);
              return (
                <Link
                  key={tab.id}
                  to={tab.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#2B6E5E] text-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)]'
                      : 'text-[#5C6B64] hover:text-[#1C2B27] bg-[#EDE8DC] hover:shadow-[3px_3px_6px_rgba(191,180,155,0.4),-3px_-3px_6px_rgba(255,255,255,0.5)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/insights"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-2xl transition-all ${
                location.pathname === '/insights' || location.pathname === '/trends'
                  ? 'bg-[#2B6E5E] text-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)]'
                  : 'btn-secondary py-1.5 px-3 text-xs'
              }`}
              title="View Safety Insights & Trends"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#2B6E5E]" />
              <span className="hidden sm:inline">Insights</span>
            </Link>

            <Link
              to="/profile"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-2xl transition-all ${
                location.pathname === '/profile'
                  ? 'bg-[#2B6E5E] text-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)]'
                  : 'btn-secondary py-1.5 px-2.5 text-xs'
              }`}
              title="My Profile & Settings"
            >
              <UserCircle className="w-4 h-4 text-[#2B6E5E]" />
            </Link>

            <SignOutConfirmButton />
          </div>
        </div>
      </header>

      {/* ─── Page Content with PageTransition ─── */}
      <main className="flex-1 pb-32 md:pb-12">
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>

      {/* ─── Fixed Bottom Tab Bar (Mobile Only) ─── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#EDE8DC]/95 backdrop-blur-md py-2 px-3 shadow-[0_-6px_16px_rgba(191,180,155,0.45),0_6px_16px_rgba(255,255,255,0.65)]"
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
                    ? 'text-[#2B6E5E] font-bold bg-[#EDE8DC] shadow-[inset_3px_3px_6px_rgba(191,180,155,0.55),inset_-3px_-3px_6px_rgba(255,255,255,0.65)]'
                    : 'text-[#5C6B64] hover:text-[#1C2B27] hover:shadow-[4px_4px_8px_rgba(191,180,155,0.3),-4px_-4px_8px_rgba(255,255,255,0.4)]'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#2B6E5E]" />
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
