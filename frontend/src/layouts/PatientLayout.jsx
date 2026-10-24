// src/layouts/PatientLayout.jsx
// Redesigned Patient Layout with SharedTopBar, Mobile Bottom Tab Bar, and Floating Speed-Dial
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSocketEvent } from '../context/SocketContext';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Clock,
  HeartPulse,
  FileBadge,
  UserCircle,
  Plus,
  Camera,
  Search,
  Pill,
  X,
  Users,
  TrendingUp,
} from 'lucide-react';
import { clsx } from 'clsx';
import { notify } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/useT';
import PageTransition from '../components/PageTransition';
import SharedTopBar from '../components/SharedTopBar';
import CommandPalette from '../components/CommandPalette';

// ─── 7 Navigation Items for Desktop & Mobile ────────────────────────────────
const NAV_DEFINITIONS = [
  {
    id: 'home', i18nKey: 'nav.home', defaultLabel: 'Home', shortLabel: 'Home', path: '/home', icon: Home,
    match: (p) => p === '/home' || p.startsWith('/risk')
  },
  {
    id: 'add-med', i18nKey: 'nav.add_med', defaultLabel: 'Add Med', shortLabel: 'Add Med', path: '/add-medicine', icon: Plus,
    match: (p) => p === '/add-medicine' || p === '/add'
  },
  {
    id: 'timeline', i18nKey: 'nav.timeline', defaultLabel: 'Timeline', shortLabel: 'Timeline', path: '/timeline', icon: Clock,
    match: (p) => p === '/timeline'
  },
  {
    id: 'symptoms', i18nKey: 'nav.symptoms', defaultLabel: 'Symptoms', shortLabel: 'Symptoms', path: '/log-symptom', icon: HeartPulse,
    match: (p) => p === '/log-symptom' || p === '/symptom-result'
  },
  {
    id: 'connected', i18nKey: 'nav.connected', defaultLabel: 'Connections', shortLabel: 'Connect', path: '/connected', icon: Users,
    match: (p) => p === '/connected' || p === '/connected-people'
  },
  {
    id: 'passport', i18nKey: 'nav.passport', defaultLabel: 'Passport', shortLabel: 'Passport', path: '/passport', icon: FileBadge,
    match: (p) => p === '/passport'
  },
  {
    id: 'profile', i18nKey: 'nav.profile', defaultLabel: 'Profile', shortLabel: 'Profile', path: '/profile', icon: UserCircle,
    match: (p) => p === '/profile'
  },
];

export default function PatientLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isGuest } = useAuth() || {};
  const { t } = useT();
  const queryClient = useQueryClient();

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // ── Global shortcut listener (⌘K / Ctrl+K) ──────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && speedDialOpen) {
        setSpeedDialOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [speedDialOpen]);

  const navItems = NAV_DEFINITIONS.map((def) => ({
    ...def,
    label: t(def.i18nKey, def.defaultLabel),
  }));

  // ─── Real-Time Socket.IO Synchronization (Shared Instance) ─────────────
  useSocketEvent('doctor-directive-received', (directive) => {
    setUnreadCount((c) => c + 1);
    notify.info(
      'Physician Directive Received',
      `${directive.doctorName || 'Your doctor'} sent an update: "${directive.text}"`
    );
    window.dispatchEvent(new CustomEvent('polysafe:doctor-event', { detail: directive }));
    queryClient.invalidateQueries({ queryKey: ['patient-directives'] });
    queryClient.invalidateQueries({ queryKey: ['patient-timeline'] });
    queryClient.invalidateQueries({ queryKey: ['patient-home'] });
    queryClient.invalidateQueries({ queryKey: ['home-summary'] });
  });

  useSocketEvent('doctor-directive-updated', () => {
    queryClient.invalidateQueries({ queryKey: ['patient-directives'] });
    queryClient.invalidateQueries({ queryKey: ['patient-timeline'] });
  });

  useSocketEvent('doctor-directives-cleared', () => {
    queryClient.invalidateQueries({ queryKey: ['patient-directives'] });
    queryClient.invalidateQueries({ queryKey: ['patient-timeline'] });
  });

  useSocketEvent('patient-regimen-updated', (data) => {
    setUnreadCount((c) => c + 1);
    notify.info(
      'Medication Regimen Updated',
      data.doctorLabel
        ? `${data.doctorLabel} modified your regimen: ${String(data.action || '').replace('DOCTOR_', '').toLowerCase()}.`
        : 'Your doctor modified your medication regimen.'
    );
    window.dispatchEvent(new CustomEvent('polysafe:doctor-event', { detail: data }));
    queryClient.invalidateQueries({ queryKey: ['patient-directives'] });
    queryClient.invalidateQueries({ queryKey: ['patient-timeline'] });
    queryClient.invalidateQueries({ queryKey: ['patient-home'] });
    queryClient.invalidateQueries({ queryKey: ['home-summary'] });
    queryClient.invalidateQueries({ queryKey: ['patient-medicines'] });
  });

  useSocketEvent('dose_logged', () => {
    queryClient.invalidateQueries({ queryKey: ['patient-doses'] });
    queryClient.invalidateQueries({ queryKey: ['patient-adherence'] });
    queryClient.invalidateQueries({ queryKey: ['home-summary'] });
  });

  useSocketEvent('caregiver_reminder', (payload) => {
    setUnreadCount((c) => c + 1);
    import('../utils/doseScheduler').then(({ sendDoseReminder }) => {
      sendDoseReminder({
        title: 'Caregiver Dose Reminder',
        body: payload.message || `${payload.caregiverName || 'Your caregiver'} sent a reminder to take your scheduled medications.`,
      });
    });
    queryClient.invalidateQueries({ queryKey: ['patient-doses'] });
  });

  // Speed-dial actions
  const speedDialActions = [
    {
      id: 'scan',
      label: 'Scan Prescription',
      icon: Camera,
      action: () => {
        setSpeedDialOpen(false);
        navigate('/add-medicine?tab=camera');
      },
    },
    {
      id: 'search',
      label: 'Search Medicine',
      icon: Search,
      action: () => {
        setSpeedDialOpen(false);
        navigate('/add-medicine?tab=search');
      },
    },
    {
      id: 'pill-id',
      label: 'Pill Imprint Identifier',
      icon: Pill,
      action: () => {
        setSpeedDialOpen(false);
        navigate('/add-medicine?tab=pill_id');
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] flex flex-col justify-between selection:bg-[var(--accent-100)] selection:text-[var(--ink)]">
      {/* ── Guest Mode Banner ── */}
      {isGuest && (
        <div
          role="region"
          aria-label="Demo mode warning"
          className="bg-[var(--caution-bg)] border-b border-[var(--caution-fg)]/30 px-4 py-2"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--caution-fg)] opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--caution-fg)]" />
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[var(--caution-fg)] truncate font-[var(--font-heading)]">
                {t('login.guest_preview_title', 'Sample Patient Sandbox — Data is stored locally for evaluation')}
              </span>
            </div>
            <Link
              to="/login"
              className="text-xs sm:text-sm font-bold text-[var(--caution-fg)] underline underline-offset-2 hover:no-underline whitespace-nowrap cursor-pointer"
            >
              Sign In to Save
            </Link>
          </div>
        </div>
      )}

      {/* ── Top Bar: 64px Glass over Ivory with Sliding Coral Underline ── */}
      <SharedTopBar
        role="PATIENT"
        navItems={navItems}
        onOpenSearch={() => setCommandPaletteOpen(true)}
        notificationCount={unreadCount}
      />

      {/* ── Main Page Content ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-12">
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>

      {/* ── Floating Coral "+ Add Medicine" Speed-Dial Action ── */}
      {!(location.pathname === '/add-medicine' || location.pathname === '/add') && (
        <div className="fixed bottom-20 md:bottom-8 right-5 sm:right-8 z-40 flex flex-col items-end">
          {/* Speed-dial Popover Items */}
          <AnimatePresence>
            {speedDialOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.18 }}
                className="mb-3 space-y-2.5 flex flex-col items-end"
              >
                {speedDialActions.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      transition={{ delay: index * 0.04, duration: 0.15 }}
                      className="flex items-center gap-2.5"
                    >
                      <span className="px-3 py-1.5 rounded-xl bg-[var(--surface)] text-[var(--ink)] text-xs font-bold shadow-md border border-[var(--border)] whitespace-nowrap">
                        {item.label}
                      </span>
                      <button
                        type="button"
                        onClick={item.action}
                        className="w-11 h-11 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--border)] shadow-md hover:shadow-lg flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)]"
                        aria-label={item.label}
                      >
                        <Icon className="w-5 h-5 text-[var(--brand-600)]" />
                      </button>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Master Coral Speed-Dial Button */}
          <button
            type="button"
            onClick={() => setSpeedDialOpen((prev) => !prev)}
            aria-expanded={speedDialOpen}
            aria-label={speedDialOpen ? 'Close add medicine options' : 'Add medicine speed dial'}
            className={clsx(
              'h-12 px-4 rounded-full bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-[var(--on-accent)] font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl flex items-center gap-2 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-500)] select-none',
              speedDialOpen && 'ring-4 ring-[var(--accent-500)]/30'
            )}
          >
            <motion.div
              animate={{ rotate: speedDialOpen ? 45 : 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 20 }}
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </motion.div>
            <span>{speedDialOpen ? 'Close' : 'Add Medicine'}</span>
          </button>
        </div>
      )}

      {/* ── Mobile Bottom Tab Bar (7 Items with Sliding Pill Highlight) ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface-glass)] backdrop-blur-md border-t border-[var(--border)] shadow-lg"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-7 h-16 max-w-lg mx-auto relative px-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.match
              ? item.match(location.pathname)
              : location.pathname === item.path;

            return (
              <Link
                key={item.id}
                to={item.path}
                className={clsx(
                  'relative flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)] rounded-xl min-w-0',
                  active ? 'text-[var(--brand-600)]' : 'text-[var(--ink-3)] hover:text-[var(--ink-2)]'
                )}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
              >
                {/* Sliding Pill Highlight for Active Mobile Tab */}
                {active && (
                  <motion.div
                    layoutId="mobile-pill-highlight"
                    className="absolute inset-0.5 bg-[var(--brand-50)] dark:bg-[var(--brand-900)]/40 rounded-xl -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <Icon className={clsx('w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0', active ? 'stroke-[2.5]' : 'stroke-[1.8]')} />
                <span className={clsx(
                  'text-[9px] sm:text-[10px] font-bold tracking-tight leading-tight truncate max-w-full text-center',
                  active ? 'font-extrabold text-[var(--brand-600)]' : 'text-[var(--ink-3)]'
                )}>
                  {item.shortLabel || item.label}
                </span>
              </Link>
            );
          })}
        </div>
        {/* Safe-area bottom padding for mobile devices */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>

      {/* ── Footer: Disclaimer in Small Serif Italic ── */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mb-20 md:mb-0 text-center border-t border-[var(--border)]/60">
        <p className="text-xs font-[var(--font-heading)] italic text-[var(--ink-3)] max-w-2xl mx-auto leading-relaxed">
          PolySafe is an intelligent polypharmacy risk detection platform and clinical decision-support tool. It does not replace professional medical judgment or physician diagnosis.
        </p>
      </footer>

      {/* ── Universal Command Palette (⌘K) ── */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
