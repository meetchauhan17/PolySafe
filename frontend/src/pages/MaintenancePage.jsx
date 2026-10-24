/**
 * frontend/src/pages/MaintenancePage.jsx
 *
 * Maintenance System Page — Editorial Line Art Aesthetic
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { RefreshCw, Wrench, Shield, Activity, PhoneCall } from 'lucide-react';
import Button from '../components/Button';
import axios from 'axios';
import { notify } from '../utils/toast';

export default function MaintenancePage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const resp = await axios.get('/health', { timeout: 4000 });
      if (resp.data?.status === 'ok') {
        notify.success('Maintenance Complete', 'Clinical decision engines are live.');
        navigate('/home', { replace: true });
        return;
      }
    } catch (_err) {
      notify.info('Calibration Ongoing', 'Pharmacological database synchronization in progress.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--canvas)] flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none font-sans">
      <div className="max-w-md w-full bg-[var(--paper, #FFFFFF)] rounded-[32px] p-8 sm:p-10 border border-[var(--border)] shadow-xl relative overflow-hidden space-y-6">
        
        {/* Editorial Line-Art Maintenance Illustration */}
        <div className="w-36 h-36 mx-auto relative flex items-center justify-center">
          <svg viewBox="0 0 120 120" fill="none" className="w-full h-full select-none" role="img" aria-label="System Maintenance Illustration">
            <circle cx="60" cy="60" r="48" fill="var(--surface-2, #F1F5F9)" opacity="0.6" />

            {/* Gear in Editorial Line Art */}
            <g transform="translate(60, 56)">
              <circle cx="0" cy="0" r="26" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" strokeDasharray="6 3" />
              <circle cx="0" cy="0" r="14" fill="var(--surface-2, #F1F5F9)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />
              <circle cx="0" cy="0" r="6" fill="var(--brand-600, #0E7490)" />
            </g>

            {/* Clinical Shield with Calibrating Wrench */}
            <g transform="translate(30, 24)">
              <path
                d="M 16 4 C 23 4, 30 6, 32 10 C 32 24, 26 34, 16 38 C 6 34, 0 24, 0 10 C 2 6, 9 4, 16 4 Z"
                fill="var(--paper, #FFFFFF)"
                stroke="var(--ink, #0B1B2B)"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Coral Accent Wrench Cross */}
              <path d="M 10 16 L 22 26 M 22 16 L 10 26" stroke="var(--accent-500, #FF5C35)" strokeWidth="2.5" strokeLinecap="round" />
            </g>

            {/* Caliper Spark */}
            <path d="M 86 34 L 88 30 L 90 34 L 94 36 L 90 38 L 88 42 L 86 38 L 82 36 Z" fill="var(--brand-600, #0E7490)" />
          </svg>
        </div>

        {/* Status Eyebrow */}
        <div className="space-y-2">
          <span className="inline-block text-xs font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-[var(--brand-50)] text-[var(--brand-600)] border border-[var(--brand-200)]">
            Maintenance · Scheduled Upgrade
          </span>

          <h1
            className="text-3xl font-extrabold text-[var(--ink)] leading-tight tracking-tight"
            style={{ fontFamily: 'var(--font-heading, "Fraunces", Georgia, serif)' }}
          >
            System Calibration
          </h1>

          <p className="text-xs sm:text-sm text-[var(--ink-2)] leading-relaxed max-w-sm mx-auto">
            We are updating the WHO Essential Medicines database and Beers 2024 clinical rule matrices. Services will resume shortly.
          </p>
        </div>

        {/* Navigation CTAs */}
        <div className="space-y-3 pt-2">
          <Button
            variant="primary"
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full justify-center py-3 text-sm font-semibold rounded-2xl"
            icon={<RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />}
          >
            {checking ? 'Checking Status...' : 'Check System Readiness'}
          </Button>

          <a
            href="tel:108"
            className="inline-flex items-center justify-center gap-2 w-full py-3 text-xs font-bold font-mono rounded-2xl bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-500/20 transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Emergency Medical Assistance (108)</span>
          </a>
        </div>

        {/* Status Footer */}
        <div className="pt-4 border-t border-[var(--border)] text-xs text-[var(--ink-3)] font-mono">
          <span>Expected Completion: &lt; 15 minutes</span>
        </div>
      </div>
    </div>
  );
}
