// src/layouts/CaregiverLayout.jsx
// Redesigned Caregiver Layout with Single Centered Column, Larger Typography, Emerald Role Accent, and SharedTopBar
import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Heart,
  UserCircle,
  Eye,
  ShieldCheck,
  Activity,
  Clock,
  Sparkles,
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import SharedTopBar from '../components/SharedTopBar';
import CommandPalette from '../components/CommandPalette';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/useT';

export default function CaregiverLayout() {
  const location = useLocation();
  const { user } = useAuth() || {};
  const { t } = useT();

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const navItems = [
    {
      id: 'care-hub',
      label: t('nav.caregiver_hub', 'Care Hub'),
      path: '/caregiver-view',
      icon: Heart,
      match: (p) => p === '/caregiver-view',
    },
    {
      id: 'profile',
      label: t('nav.profile', 'Profile'),
      path: '/profile',
      icon: UserCircle,
      match: (p) => p === '/profile',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] flex flex-col justify-between selection:bg-[var(--caregiver-100)] selection:text-[var(--ink)]">
      {/* ── Privacy & Family Proxy Notice Banner ── */}
      <div
        role="region"
        aria-label="Caregiver privacy protection banner"
        className="px-4 py-2 border-b text-xs sm:text-sm font-semibold text-center font-[var(--font-heading)] flex items-center justify-center gap-2 bg-[var(--caregiver-50)] text-[var(--caregiver-700)] dark:bg-[var(--caregiver-900)]/40 dark:text-[var(--caregiver-200)] border-[var(--caregiver-200)] dark:border-[var(--caregiver-800)]"
      >
        <Eye className="w-4 h-4 text-[var(--caregiver-600)] flex-shrink-0" aria-hidden="true" />
        <span>
          {t('caregiver.privacy_banner', 'Family & Caregiver Proxy Mode — Medication schedules and adherence check-ins only. Longitudinal EHR notes protected.')}
        </span>
      </div>

      {/* ── Shared Top Bar: 64px Glass over Ivory with Sliding Coral Underline ── */}
      <SharedTopBar
        role="CAREGIVER"
        navItems={navItems}
        mobileNavItems={navItems}
        onOpenSearch={() => setCommandPaletteOpen(true)}
      />

      {/* ── Single Centered Column with Larger Relaxed Typography ── */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <PageTransition key={location.pathname}>
          <div className="text-base sm:text-lg leading-relaxed">
            <Outlet />
          </div>
        </PageTransition>
      </main>

      {/* ── Footer Disclaimer in Small Serif Italic ── */}
      <footer className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 text-center border-t border-[var(--border)]/60">
        <p className="text-xs font-[var(--font-heading)] italic text-[var(--ink-3)] max-w-xl mx-auto leading-relaxed">
          PolySafe Caregiver Proxy is designed to support loved ones with medication schedule adherence and safety pings. Always verify medication changes directly with the prescribing physician.
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
