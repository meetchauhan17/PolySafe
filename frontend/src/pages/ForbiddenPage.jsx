/**
 * frontend/src/pages/ForbiddenPage.jsx
 *
 * 403 System Page — Editorial Line Art Aesthetic
 */

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, ArrowLeft, ShieldAlert, KeyRound, UserCheck } from 'lucide-react';
import Button from '../components/Button';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--canvas)] flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none font-sans">
      <div className="max-w-md w-full bg-[var(--paper, #FFFFFF)] rounded-[32px] p-8 sm:p-10 border border-[var(--border)] shadow-xl relative overflow-hidden space-y-6">
        
        {/* Editorial Line-Art 403 Restricted Illustration */}
        <div className="w-36 h-36 mx-auto relative flex items-center justify-center">
          <svg viewBox="0 0 120 120" fill="none" className="w-full h-full select-none" role="img" aria-label="403 Access Forbidden Illustration">
            <circle cx="60" cy="60" r="48" fill="var(--surface-2, #F1F5F9)" opacity="0.6" />

            {/* Shield Frame */}
            <path
              d="M 60 20 C 72 20, 82 23, 84 28 C 84 52, 75 66, 60 74 C 45 66, 36 52, 36 28 C 38 23, 48 20, 60 20 Z"
              fill="var(--paper, #FFFFFF)"
              stroke="var(--ink, #0B1B2B)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Central Padlock (Coral Accent Body) */}
            <g transform="translate(48, 38)">
              {/* Shackle */}
              <path
                d="M 6 12 V 6 C 6 2.7 8.7 0 12 0 C 15.3 0 18 2.7 18 6 V 12"
                stroke="var(--ink, #0B1B2B)"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Lock Body */}
              <rect x="0" y="10" width="24" height="20" rx="4" fill="var(--accent-500, #FF5C35)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />
              {/* Keyhole */}
              <circle cx="12" cy="18" r="2.5" fill="var(--paper, #FFFFFF)" />
              <line x1="12" y1="20" x2="12" y2="25" stroke="var(--paper, #FFFFFF)" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Authorization Key (Blue Accent) */}
            <g transform="translate(68, 70) rotate(25)">
              <circle cx="6" cy="6" r="5" fill="var(--brand-600, #0E7490)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />
              <circle cx="6" cy="6" r="2" fill="var(--paper, #FFFFFF)" />
              <line x1="11" y1="6" x2="26" y2="6" stroke="var(--ink, #0B1B2B)" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="20" y1="6" x2="20" y2="10" stroke="var(--ink, #0B1B2B)" strokeWidth="2" strokeLinecap="round" />
              <line x1="25" y1="6" x2="25" y2="10" stroke="var(--ink, #0B1B2B)" strokeWidth="2" strokeLinecap="round" />
            </g>
          </svg>
        </div>

        {/* Status Eyebrow */}
        <div className="space-y-2">
          <span className="inline-block text-xs font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            Error 403 · Restricted Access
          </span>

          <h1
            className="text-3xl font-extrabold text-[var(--ink)] leading-tight tracking-tight"
            style={{ fontFamily: 'var(--font-heading, "Fraunces", Georgia, serif)' }}
          >
            Clinical Access Restricted
          </h1>

          <p className="text-xs sm:text-sm text-[var(--ink-2)] leading-relaxed max-w-sm mx-auto">
            You do not possess the required physician role or patient delegation permissions to inspect this clinical record.
          </p>
        </div>

        {/* Navigation CTAs */}
        <div className="space-y-3 pt-2">
          <Button
            variant="primary"
            onClick={() => navigate('/home')}
            className="w-full justify-center py-3 text-sm font-semibold rounded-2xl"
            icon={<Home className="w-4 h-4" />}
          >
            Return to Dashboard
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/login')}
            className="w-full justify-center py-3 text-sm font-semibold rounded-2xl"
            icon={<UserCheck className="w-4 h-4" />}
          >
            Switch User Account
          </Button>
        </div>

        {/* Quick Links Footer */}
        <div className="pt-4 border-t border-[var(--border)] flex items-center justify-center gap-5 text-xs text-[var(--ink-3)] font-mono">
          <Link to="/status" className="hover:text-[var(--brand-600)] transition-colors">
            System Status
          </Link>
          <span>•</span>
          <Link to="/privacy" className="hover:text-[var(--brand-600)] transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
