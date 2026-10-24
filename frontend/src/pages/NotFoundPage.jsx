/**
 * frontend/src/pages/NotFoundPage.jsx
 *
 * 404 System Page — Editorial Line Art Aesthetic
 */

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, ArrowLeft, Activity, Search } from 'lucide-react';
import Button from '../components/Button';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--canvas)] flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none font-sans">
      <div className="max-w-md w-full bg-[var(--paper, #FFFFFF)] rounded-[32px] p-8 sm:p-10 border border-[var(--border)] shadow-xl relative overflow-hidden space-y-6">
        
        {/* Editorial Line-Art 404 Illustration */}
        <div className="w-36 h-36 mx-auto relative flex items-center justify-center">
          <svg viewBox="0 0 120 120" fill="none" className="w-full h-full select-none" role="img" aria-label="404 Page Not Found Illustration">
            {/* Ambient Disc */}
            <circle cx="60" cy="60" r="48" fill="var(--surface-2, #F1F5F9)" opacity="0.6" />

            {/* Misplaced Prescription Folder */}
            <g transform="translate(30, 24)">
              <rect x="0" y="0" width="48" height="62" rx="6" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />
              <line x1="10" y1="14" x2="38" y2="14" stroke="var(--border, #E2E8F0)" strokeWidth="2" strokeLinecap="round" />
              <line x1="10" y1="22" x2="30" y2="22" stroke="var(--border, #E2E8F0)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="10" y1="30" x2="34" y2="30" stroke="var(--border, #E2E8F0)" strokeWidth="1.5" strokeLinecap="round" />

              {/* Red Crossed Out Tag (Coral Accent) */}
              <circle cx="24" cy="46" r="8" fill="var(--accent-500, #FF5C35)" />
              <path d="M 20 42 L 28 50 M 28 42 L 20 50" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Inspecting Magnifying Glass (Blue Accent Lens) */}
            <g transform="translate(56, 44)">
              <circle cx="18" cy="18" r="14" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="2.5" />
              <path d="M 10 12 C 13 8, 22 8, 26 12" stroke="var(--brand-600, #0E7490)" strokeWidth="1.75" strokeLinecap="round" />
              <line x1="28" y1="28" x2="44" y2="44" stroke="var(--ink, #0B1B2B)" strokeWidth="3" strokeLinecap="round" />
            </g>
          </svg>
        </div>

        {/* Status Eyebrow */}
        <div className="space-y-2">
          <span className="inline-block text-xs font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-[var(--surface-2)] text-[var(--ink-2)] border border-[var(--border)]">
            Error 404 · Unmapped Route
          </span>

          <h1
            className="text-3xl font-extrabold text-[var(--ink)] leading-tight tracking-tight"
            style={{ fontFamily: 'var(--font-heading, "Fraunces", Georgia, serif)' }}
          >
            Page Not In Formulary
          </h1>

          <p className="text-xs sm:text-sm text-[var(--ink-2)] leading-relaxed max-w-sm mx-auto">
            The clinical route or medical record you requested could not be located or may have been relocated.
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
            onClick={() => navigate(-1)}
            className="w-full justify-center py-3 text-sm font-semibold rounded-2xl"
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Go Back to Previous Page
          </Button>
        </div>

        {/* Quick Links Footer */}
        <div className="pt-4 border-t border-[var(--border)] flex items-center justify-center gap-5 text-xs text-[var(--ink-3)] font-mono">
          <Link to="/status" className="hover:text-[var(--brand-600)] transition-colors flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" />
            <span>System Status</span>
          </Link>
          <span>•</span>
          <Link to="/privacy" className="hover:text-[var(--brand-600)] transition-colors">
            Privacy
          </Link>
          <span>•</span>
          <Link to="/terms" className="hover:text-[var(--brand-600)] transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </div>
  );
}
