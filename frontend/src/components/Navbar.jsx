import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  ShieldCheck, 
  Pill, 
  PlusCircle, 
  ShieldAlert, 
  Activity, 
  Clock, 
  Stethoscope, 
  UserCheck, 
  LogIn,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  AlertTriangle,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LedIndicator from './LedIndicator';

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth() || {};
  const shouldReduceMotion = useReducedMotion();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'light');

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('polysafe-theme', nextTheme);
  };

  const getNavItems = () => {
    if (!user || user.isGuest) {
      return [
        { path: '/home', label: 'Home', icon: Pill },
        { path: '/add-medicine', label: 'Add Med', icon: PlusCircle },
        { path: '/timeline', label: 'Timeline', icon: Clock },
        { path: '/doctor-dashboard', label: 'Doctor', icon: Stethoscope },
        { path: '/caregiver-view', label: 'Caregiver', icon: ShieldAlert },
      ];
    }
    const role = (user.role || 'PATIENT').toUpperCase();
    if (role === 'DOCTOR') {
      return [
        { path: '/doctor-dashboard', label: 'Doctor Hub', icon: Stethoscope },
        { path: '/profile', label: 'Profile', icon: User },
      ];
    }
    if (role === 'CAREGIVER') {
      return [
        { path: '/caregiver-view', label: 'Caregiver Hub', icon: ShieldAlert },
        { path: '/profile', label: 'Profile', icon: User },
      ];
    }
    return [
      { path: '/home', label: 'Home', icon: Pill },
      { path: '/add-medicine', label: 'Add Med', icon: PlusCircle },
      { path: '/timeline', label: 'Timeline', icon: Clock },
      { path: '/log-symptom', label: 'Symptoms', icon: Activity },
      { path: '/connected', label: 'Connected', icon: UserCheck },
      { path: '/profile', label: 'Profile', icon: User },
    ];
  };

  const navItems = getNavItems();

  // Helper for user initials
  const getInitials = (name) => {
    if (!name) return 'PS';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="ps-navbar sticky top-0 z-50 bg-[var(--chassis)] border-b border-[rgba(255,255,255,0.4)] shadow-[var(--shadow-card)] h-16 flex items-center px-4 md:px-8">
      <div className="w-full max-w-[1152px] mx-auto flex items-center justify-between">
        {/* Left: Brand logo & wordmark */}
        <Link to="/home" className="flex items-center gap-2.5 group">
          <div
            className="p-2 rounded-xl bg-[var(--chassis)] text-[var(--accent-primary)] shadow-[var(--shadow-sm)] transition-transform group-hover:scale-105"
            style={{
              filter: 'drop-shadow(0 0 6px var(--accent-primary-glow))',
            }}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight text-[var(--text-primary)] font-display block leading-none drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">
              PolySafe
            </span>
            <span className="text-[10px] block text-[var(--text-muted)] font-mono font-bold tracking-wider uppercase mt-0.5">
              Control Panel
            </span>
          </div>
        </Link>

        {/* Center: Desktop Navigation links */}
        <div className="hidden lg:flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isDoctor = item.path === '/doctor-dashboard';
            const isCaregiver = item.path === '/caregiver-view';
            const activeColor = isDoctor
              ? 'text-[var(--role-doctor)]'
              : isCaregiver
              ? 'text-[var(--role-caregiver)]'
              : 'text-[var(--accent-primary)]';
            const isActive =
              location.pathname === item.path ||
              (item.path === '/connected' && location.pathname === '/connected-people') ||
              (item.path === '/insights' && location.pathname === '/trends');

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? `bg-[var(--chassis)] ${activeColor} shadow-[var(--shadow-pressed)]`
                    : 'bg-[var(--chassis)] text-[var(--text-muted)] shadow-[var(--shadow-sm)] hover:text-[var(--text-primary)] hover:shadow-[var(--shadow-card)] hover:-translate-y-0.5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {isActive && (
                  <span
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--led-online)] shadow-[0_0_8px_2px_var(--led-online-glow)] animate-[led-pulse_2s_ease-in-out_infinite]"
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right: Status LED + User Profile + Actions */}
        <div className="flex items-center gap-3">
          {/* System Online LED Indicator */}
          <div className="hidden sm:flex items-center bg-[var(--chassis)] px-2.5 py-1 rounded-full shadow-[var(--shadow-recessed)]">
            <LedIndicator status="online" label="Online" size="sm" />
          </div>

          {/* Theme Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-[var(--chassis)] text-[var(--text-primary)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card)] active:shadow-[var(--shadow-pressed)] transition-all cursor-pointer flex items-center justify-center"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 animate-fadeIn" />
            ) : (
              <Moon className="w-4 h-4 text-[var(--accent-secondary)] animate-fadeIn" />
            )}
          </button>

          {user && !user.isGuest ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className={`w-8 h-8 rounded-full ${
                  user.role === 'DOCTOR'
                    ? 'bg-[var(--role-doctor)]'
                    : user.role === 'CAREGIVER'
                    ? 'bg-[var(--role-caregiver)]'
                    : 'bg-[var(--role-patient)]'
                } text-white font-mono text-xs font-bold flex items-center justify-center shadow-[var(--shadow-sm)] hover:scale-105 transition-transform`}
                title={`${user.name || user.email} (${user.role || 'PATIENT'})`}
              >
                {getInitials(user.name || user.email)}
              </Link>
              {user.role === 'DOCTOR' && (
                <span className="hidden sm:inline-block text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-md bg-[var(--role-doctor)] text-white shadow-xs">
                  MD
                </span>
              )}
              <button
                onClick={() => setShowSignOutModal(true)}
                className="ps-btn ps-btn--ghost ps-btn--sm text-[var(--led-critical)]"
                title="Sign Out"
                aria-label="Sign Out of PolySafe"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Exit</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="ps-btn ps-btn--primary ps-btn--sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-[var(--chassis)] text-[var(--text-primary)] shadow-[var(--shadow-sm)] active:shadow-[var(--shadow-pressed)]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 right-0 bg-[var(--chassis)] border-b border-[rgba(255,255,255,0.4)] shadow-[var(--shadow-floating)] p-4 flex flex-col gap-2 z-50">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path === '/connected' && location.pathname === '/connected-people');

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-[var(--chassis)] text-[var(--accent-primary)] shadow-[var(--shadow-pressed)] border-l-4 border-[var(--accent-primary)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--chassis-dark)] shadow-[var(--shadow-sm)]'
                }`}
              >
                <Icon className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-[var(--chassis-dark)] flex items-center justify-between px-2">
            <LedIndicator status="online" label="Hardware Active" size="sm" />
            <Link
              to="/onboarding"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-mono text-[var(--accent-primary)] underline"
            >
              Reset Baseline
            </Link>
          </div>
        </div>
      )}

      {/* ── Sign Out Confirmation Modal ── */}
      <AnimatePresence>
        {showSignOutModal && (
          <div className="ps-modal-overlay">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSignOutModal(false)}
              className="fixed inset-0 bg-[#1a1f2e]/60"
            />
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="relative z-10 w-full max-w-sm bg-[var(--chassis)] rounded-[28px] p-6 shadow-[var(--shadow-floating)] border border-[rgba(255,255,255,0.4)] text-left space-y-4"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[var(--led-critical)]/10 text-[var(--led-critical)] rounded-2xl shadow-[var(--shadow-sm)]">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--text-primary)] font-display">
                    Sign out of PolySafe?
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] font-mono">
                    Are you sure you want to end your active session?
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--chassis-dark)]">
                <button
                  type="button"
                  onClick={() => setShowSignOutModal(false)}
                  className="ps-btn ps-btn--secondary ps-btn--sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSignOutModal(false);
                    logout();
                  }}
                  className="ps-btn ps-btn--critical ps-btn--sm"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
}
