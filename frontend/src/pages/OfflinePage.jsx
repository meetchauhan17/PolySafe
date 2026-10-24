/**
 * frontend/src/pages/OfflinePage.jsx
 *
 * Offline System Page — Editorial Line Art Aesthetic
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, RefreshCw, Database, Home, CheckCircle2 } from 'lucide-react';
import Button from '../components/Button';
import axios from 'axios';
import { notify } from '../utils/toast';

export default function OfflinePage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const handleTestConnection = async () => {
    setChecking(true);
    try {
      const resp = await axios.get('/health', { timeout: 4000 });
      if (resp.data?.status === 'ok') {
        notify.success('Connection Restored', 'Back online with real-time clinical engines.');
        navigate('/home', { replace: true });
        return;
      }
    } catch (_err) {
      notify.info('Still Offline', 'Using local cache and offline safety checks.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--canvas)] flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none font-sans">
      <div className="max-w-md w-full bg-[var(--paper, #FFFFFF)] rounded-[32px] p-8 sm:p-10 border border-[var(--border)] shadow-xl relative overflow-hidden space-y-6">
        
        {/* Editorial Line-Art Offline Illustration */}
        <div className="w-36 h-36 mx-auto relative flex items-center justify-center">
          <svg viewBox="0 0 120 120" fill="none" className="w-full h-full select-none" role="img" aria-label="Offline Mode Illustration">
            <circle cx="60" cy="60" r="48" fill="var(--surface-2, #F1F5F9)" opacity="0.6" />

            {/* Medical Telemetry Monitor Frame */}
            <g transform="translate(28, 26)">
              <rect x="0" y="0" width="64" height="46" rx="6" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />
              {/* Screen Area */}
              <rect x="4" y="4" width="56" height="38" rx="3" fill="var(--surface, #FAF8F5)" stroke="var(--border, #E2E8F0)" strokeWidth="1" />
              {/* Flatline with small blip (Blue Accent) */}
              <path d="M 8 23 H 24 L 28 17 L 32 29 L 36 23 H 52" stroke="var(--brand-600, #0E7490)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            {/* Unplugged Power Cord (Coral Plug Accent) */}
            <g transform="translate(40, 78)">
              {/* Cable curve */}
              <path d="M -10 12 C 0 18, 12 18, 18 8" stroke="var(--ink, #0B1B2B)" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Plug head */}
              <rect x="18" y="2" width="12" height="12" rx="2" fill="var(--accent-500, #FF5C35)" stroke="var(--ink, #0B1B2B)" strokeWidth="1.75" />
              {/* Prongs */}
              <line x1="30" y1="5" x2="36" y2="5" stroke="var(--ink, #0B1B2B)" strokeWidth="2" strokeLinecap="round" />
              <line x1="30" y1="11" x2="36" y2="11" stroke="var(--ink, #0B1B2B)" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Offline Database Badge */}
            <g transform="translate(74, 68)">
              <rect x="0" y="0" width="22" height="22" rx="5" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="1.75" />
              <path d="M 4 8 C 4 6.5, 7.5 5, 11 5 C 14.5 5, 18 6.5, 18 8 C 18 9.5, 14.5 11, 11 11 C 7.5 11, 4 9.5, 4 8 Z" fill="var(--brand-600, #0E7490)" />
              <path d="M 4 12 C 4 13.5, 7.5 15, 11 15 C 14.5 15, 18 13.5, 18 12" stroke="var(--ink, #0B1B2B)" strokeWidth="1.5" />
              <path d="M 4 16 C 4 17.5, 7.5 19, 11 19 C 14.5 19, 18 17.5, 18 16" stroke="var(--ink, #0B1B2B)" strokeWidth="1.5" />
            </g>
          </svg>
        </div>

        {/* Status Eyebrow */}
        <div className="space-y-2">
          <span className="inline-block text-xs font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            Network Disconnected · Local Cache Active
          </span>

          <h1
            className="text-3xl font-extrabold text-[var(--ink)] leading-tight tracking-tight"
            style={{ fontFamily: 'var(--font-heading, "Fraunces", Georgia, serif)' }}
          >
            Offline Mode Active
          </h1>

          <p className="text-xs sm:text-sm text-[var(--ink-2)] leading-relaxed max-w-sm mx-auto">
            You are currently working offline. Your medication list, safety alerts, and emergency medical ID remain fully accessible from encrypted local cache.
          </p>
        </div>

        {/* Navigation CTAs */}
        <div className="space-y-3 pt-2">
          <Button
            variant="primary"
            onClick={handleTestConnection}
            disabled={checking}
            className="w-full justify-center py-3 text-sm font-semibold rounded-2xl"
            icon={<RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />}
          >
            {checking ? 'Checking Reconnection...' : 'Retry Connection'}
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/home')}
            className="w-full justify-center py-3 text-sm font-semibold rounded-2xl"
            icon={<Home className="w-4 h-4" />}
          >
            View Cached Dashboard
          </Button>
        </div>

        {/* Offline Security Note */}
        <div className="pt-3 border-t border-[var(--border)] text-[11px] font-mono text-[var(--ink-3)] flex items-center justify-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-[var(--brand-600)]" />
          <span>Local IndexedDB & ServiceWorker operational</span>
        </div>
      </div>
    </div>
  );
}
