/**
 * frontend/src/components/SharedTopBar.jsx
 *
 * PolySafe Unified Top Bar:
 * - Glass over ivory (64px / h-16)
 * - Logo mark + wordmark in Fraunces
 * - Centered navigation with sliding coral underline indicator (Framer Motion layoutId)
 * - Right cluster:
 *   • Search chip with Cmd/Ctrl+K hint
 *   • Notification bell with live alert indicator
 *   • Text size stepper
 *   • Language switch (EN/HI/GU)
 *   • Theme toggle (sun/moon with rotating morph)
 *   • Role badge + avatar dropdown menu
 * - Optional darkVariant (darker ink-blue) & activePatient coral accent for Doctor mode
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  UserCircle,
  LogOut,
  ChevronDown,
  Menu,
  X,
  FileBadge,
  Sparkles,
  Stethoscope,
  HeartHandshake,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useDisplaySettings } from '../context/DisplaySettingsContext';
import { useT } from '../i18n/useT';
import LanguageSwitcher from './LanguageSwitcher';
import TextSizeControl from './TextSizeControl';
import RoleBadge from './RoleBadge';
import NotificationPopover from './NotificationPopover';
import Logo from './Logo';

export default function SharedTopBar({
  role = 'PATIENT',
  navItems = [],
  onOpenSearch,
  darkVariant = false,
  activePatient = null,
  notificationCount = 0,
  onOpenNotifications,
  mobileNavItems = null,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isGuest, logout } = useAuth() || {};
  const { theme, toggleTheme } = useDisplaySettings();
  const { t } = useT();

  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(notificationCount !== undefined && notificationCount > 0 ? notificationCount : 2);
  const avatarMenuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    if (notificationCount !== undefined) {
      setUnreadCount(notificationCount);
    }
  }, [notificationCount]);

  const isDark = theme === 'dark';

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target)) {
        setAvatarMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    setAvatarMenuOpen(false);
    logout?.();
    navigate('/login', { replace: true });
  };

  const effectiveRole = isGuest ? 'guest' : (role || 'patient').toLowerCase();

  return (
    <header
      className={clsx(
        'sticky top-0 z-50 h-16 w-full transition-colors duration-200',
        darkVariant
          ? 'bg-[var(--doctor-900)] text-[var(--paper)] border-b border-[var(--doctor-700)] shadow-md'
          : 'bg-[var(--surface-glass)] text-[var(--ink)] backdrop-blur-md border-b border-[var(--border)] shadow-xs'
      )}
    >
      <div className="max-w-7xl w-full mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* ── Left Column: Logo Mark + Wordmark (flex-1) ── */}
        <div className="flex items-center gap-3 flex-1 min-w-0 justify-start">
          <Logo
            to={role === 'DOCTOR' ? '/doctor-dashboard' : role === 'CAREGIVER' ? '/caregiver-view' : '/home'}
            size="md"
            variant={darkVariant ? 'white' : 'color'}
            showTagline={true}
            tagline="Clinical Safety AI"
          />

          {/* Active Patient Pill in Doctor Layout (Coral Accent) */}
          {darkVariant && activePatient && (
            <div className="hidden 2xl:flex items-center gap-2 pl-3 ml-2 border-l border-[var(--doctor-700)]">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-500)] animate-pulse" />
              <span className="text-xs font-mono font-semibold text-[var(--paper)] truncate max-w-[200px]">
                Active: <strong className="text-[var(--accent-500)]">{activePatient.name || 'Selected Patient'}</strong>
              </span>
            </div>
          )}
        </div>

        {/* ── Center Column: Dead-Center Nav (flex-shrink-0) ── */}
        <nav
          className="hidden md:flex items-center justify-center gap-0.5 lg:gap-1 xl:gap-1.5 flex-shrink-0 h-full"
          aria-label="Main Navigation"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.match
              ? item.match(location.pathname)
              : location.pathname === item.path;

            return (
              <Link
                key={item.id || item.path}
                to={item.path}
                className={clsx(
                  'relative h-16 flex items-center gap-1 xl:gap-1.5 px-2 xl:px-2.5 text-xs xl:text-[13px] font-bold tracking-tight transition-colors duration-150 select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-500)]',
                  darkVariant
                    ? isActive
                      ? 'text-white'
                      : 'text-[var(--doctor-200)] hover:text-white'
                    : isActive
                    ? 'text-[var(--ink)] font-extrabold'
                    : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0 opacity-80" aria-hidden="true" />}
                <span>{item.shortLabel || item.label}</span>

                {/* Sliding Coral Underline Indicator (Framer Motion layoutId) */}
                {isActive && (
                  <motion.div
                    layoutId="nav-coral-underline"
                    className="absolute bottom-0 inset-x-1 xl:inset-x-2 h-[3px] bg-[var(--accent-500)] rounded-t-full shadow-sm z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Right Column: Control Tools (flex-1) ── */}
        <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0 justify-end">
          
          {/* Search button — matching square icon button with Bell & Theme (hidden on mobile to preserve layout) */}
          <button
            type="button"
            onClick={onOpenSearch}
            className={clsx(
              'hidden sm:flex items-center justify-center h-9 w-9 rounded-xl border transition-all cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)] flex-shrink-0',
              darkVariant
                ? 'bg-[var(--doctor-800)] text-white border-[var(--doctor-600)] hover:bg-[var(--doctor-700)]'
                : 'bg-[var(--surface-2)] text-[var(--ink-2)] border-[var(--border)] hover:bg-[var(--surface)] hover:text-[var(--ink)]'
            )}
            title="Search clinical database (Cmd+K / Ctrl+K)"
            aria-label="Search clinical database (Cmd+K)"
          >
            <Search className="w-4 h-4 text-[var(--accent-500)]" aria-hidden="true" />
          </button>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                if (onOpenNotifications) {
                  onOpenNotifications();
                } else {
                  setNotificationsOpen((prev) => !prev);
                }
              }}
              className={clsx(
                'relative w-9 h-9 rounded-xl flex items-center justify-center border transition-colors cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)]',
                darkVariant
                  ? 'bg-[var(--doctor-800)] text-white border-[var(--doctor-600)] hover:bg-[var(--doctor-700)]'
                  : 'bg-[var(--surface-2)] text-[var(--ink-2)] border-[var(--border)] hover:bg-[var(--surface)] hover:text-[var(--ink)]'
              )}
              title="Notifications & Directives"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--accent-500)] text-white text-[10px] font-mono font-bold flex items-center justify-center ring-2 ring-[var(--surface)] shadow-xs animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Unified Notification Popover */}
            <NotificationPopover
              isOpen={notificationsOpen}
              onClose={() => setNotificationsOpen(false)}
              onUnreadChange={setUnreadCount}
            />
          </div>

          {/* Language Switcher (EN/HI/GU) */}
          <LanguageSwitcher compact={true} />

          {/* Theme Toggle (Sun/Moon Rotating Morph) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
            className={clsx(
              'w-9 h-9 rounded-xl flex items-center justify-center border transition-colors cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)]',
              darkVariant
                ? 'bg-[var(--doctor-800)] text-[var(--paper)] border-[var(--doctor-600)] hover:bg-[var(--doctor-700)]'
                : 'bg-[var(--surface-2)] text-[var(--ink-2)] border-[var(--border)] hover:bg-[var(--surface)] hover:text-[var(--ink)]'
            )}
          >
            <motion.div
              key={theme}
              initial={{ rotate: isDark ? -180 : 180, scale: 0.7, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 stroke-[2.2]" />
              ) : (
                <Moon className="w-4 h-4 text-[var(--brand-600)] stroke-[2.2]" />
              )}
            </motion.div>
          </button>

          {/* Avatar Menu with Dropdown */}
          <div className="relative" ref={avatarMenuRef}>
            <button
              type="button"
              onClick={() => setAvatarMenuOpen((prev) => !prev)}
              aria-expanded={avatarMenuOpen}
              className={clsx(
                'flex items-center gap-1.5 p-1 rounded-xl border transition-all cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)]',
                darkVariant
                  ? 'bg-[var(--doctor-800)] border-[var(--doctor-600)] text-[var(--paper)] hover:bg-[var(--doctor-700)]'
                  : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--ink)] hover:bg-[var(--surface)]'
              )}
              title="User menu"
              aria-label="User account and profile menu"
            >
              <div className={clsx(
                'w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs',
                darkVariant
                  ? 'bg-[var(--doctor-600)] text-white'
                  : 'bg-[var(--brand-600)] text-white'
              )}>
                {user?.name ? user.name[0].toUpperCase() : 'P'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--ink-3)] hidden sm:block" />
            </button>

            {/* Dropdown Card */}
            <AnimatePresence>
              {avatarMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-24px)] rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-lg)] p-2 space-y-1.5 z-50 text-left text-[var(--ink)]"
                >
                  {/* User details header */}
                  <div className="p-3 bg-[var(--canvas)] rounded-xl border border-[var(--border)]">
                    <p className="text-xs font-bold text-[var(--ink)] truncate font-[var(--font-heading)]">
                      {user?.name || (isGuest ? 'Sample Patient' : 'PolySafe User')}
                    </p>
                    <p className="text-[11px] text-[var(--ink-3)] truncate mt-0.5">
                      {user?.email || 'guest@polysafe.ai'}
                    </p>
                    <div className="pt-2">
                      <RoleBadge role={effectiveRole} size="sm" />
                    </div>
                  </div>

                  {/* Links */}
                  <div className="py-1 space-y-0.5">
                    <Link
                      to="/profile"
                      onClick={() => setAvatarMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
                    >
                      <User className="w-4 h-4 text-[var(--brand-600)]" />
                      <span>{t('nav.profile', 'Profile & Settings')}</span>
                    </Link>

                    {role === 'PATIENT' && (
                      <Link
                        to="/passport"
                        onClick={() => setAvatarMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
                      >
                        <FileBadge className="w-4 h-4 text-[var(--accent-600)]" />
                        <span>Medication Passport</span>
                      </Link>
                    )}

                    <Link
                      to="/styleguide"
                      onClick={() => setAvatarMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Design System</span>
                    </Link>
                  </div>

                  {/* Display & Accessibility Controls */}
                  <div className="py-2 px-3 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink-2)]">
                      <span>Text Size</span>
                      <TextSizeControl />
                    </div>
                  </div>

                  {/* Sign Out */}
                  <div className="pt-1 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{isGuest ? 'Exit Sample Sandbox' : 'Sign Out'}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile hamburger toggle (only when not in bottom-bar mode) */}
          {mobileNavItems && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-[var(--border)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

        </div>
      </div>

      {/* Mobile Drawer (if mobileNavItems provided) */}
      <AnimatePresence>
        {mobileMenuOpen && mobileNavItems && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-[var(--surface)] border-b border-[var(--border)] p-4 space-y-3"
          >
            <nav className="grid grid-cols-2 gap-2" onClick={() => setMobileMenuOpen(false)}>
              {mobileNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.id || item.path}
                    to={item.path}
                    className={clsx(
                      'flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-colors',
                      isActive
                        ? 'bg-[var(--brand-50)] text-[var(--brand-600)]'
                        : 'text-[var(--ink-2)] hover:bg-[var(--surface-2)]'
                    )}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
