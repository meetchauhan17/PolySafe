// src/components/GuestLockModal.jsx — Unified Overlay: Guest Lock
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, X, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function ShieldIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 mx-auto" aria-hidden="true">
      <circle cx="60" cy="60" r="52" fill="var(--accent-100)" opacity="0.7" />
      <path d="M60 18 L88 30 L88 58 C88 78 74 90 60 98 C46 90 32 78 32 58 L32 30 Z" fill="var(--brand-50)" stroke="var(--brand-300)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M60 26 L82 36 L82 58 C82 74 70 84 60 90 C50 84 38 74 38 58 L38 36 Z" fill="var(--brand-100)" />
      <rect x="47" y="55" width="26" height="20" rx="4" fill="var(--brand-600)" />
      <path d="M52 55 L52 48 C52 44 68 44 68 48 L68 55" stroke="var(--brand-600)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <circle cx="60" cy="64" r="3" fill="white" opacity="0.9" />
      <rect x="58.5" y="64" width="3" height="5" rx="1" fill="white" opacity="0.9" />
      <circle cx="90" cy="28" r="3" fill="var(--accent-500)" opacity="0.8" />
      <circle cx="30" cy="80" r="2" fill="var(--accent-400)" opacity="0.6" />
    </svg>
  );
}

export default function GuestLockModal({ isOpen, onClose, featureName = 'this feature', onLogout }) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const previousFocus = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement;
      setTimeout(() => { dialogRef.current?.querySelector('button')?.focus(); }, 50);
    } else {
      previousFocus.current?.focus?.();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); onClose?.(); return; }
      if (e.key !== 'Tab') return;
      const el = dialogRef.current;
      if (!el) return;
      const items = Array.from(el.querySelectorAll('button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])'));
      if (!items.length) return;
      const first = items[0]; const last = items[items.length - 1];
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleSignIn = () => { onClose?.(); onLogout?.(); navigate('/login', { replace: true }); };
  const spring = { type: 'spring', stiffness: 380, damping: 30, mass: 0.9 };
  const features = [
    'Persistent medication & interaction history',
    'Real-time physician directives',
    'Symptom tracking & safety timeline',
  ];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[200]"
            style={{ background: 'rgba(22,33,44,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.18 }}
            onClick={onClose} aria-hidden="true"
          />
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              ref={dialogRef}
              className="relative w-full max-w-sm pointer-events-auto rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[var(--paper)] shadow-[0_24px_64px_rgba(22,33,44,0.22)] overflow-hidden"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
              transition={reduce ? { duration: 0.12 } : spring}
              role="dialog" aria-modal="true" aria-label="Authentication required"
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-[var(--accent-400)] via-[var(--accent-500)] to-[var(--accent-600)]" />
              <button type="button" onClick={onClose} aria-label="Close"
                className="absolute top-4 right-4 p-1.5 rounded-[var(--radius-sm)] text-[var(--ink-3)] hover:bg-[var(--canvas)] hover:text-[var(--ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)]">
                <X className="w-4 h-4" />
              </button>
              <div className="p-6 pt-5">
                <div className="mb-5"><ShieldIllustration /></div>
                <h3 className="text-xl font-bold text-[var(--ink)] font-[var(--font-heading)] mb-1.5 text-center">
                  Sign in to continue
                </h3>
                <p className="text-sm text-[var(--ink-3)] leading-relaxed mb-5 text-center">
                  You&apos;re in Guest Mode. To <strong className="text-[var(--ink-2)] font-semibold">{featureName}</strong>, persist
                  your medication regimen and receive physician updates, please sign in.
                </p>
                <div className="bg-[var(--canvas)] rounded-[var(--radius-lg)] p-3.5 mb-5 border border-[var(--border)] space-y-2">
                  {features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[var(--brand-600)] flex-shrink-0" aria-hidden />
                      <span className="text-xs text-[var(--ink-2)] font-[var(--font-heading)] font-semibold">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2.5">
                  <button type="button" onClick={handleSignIn}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[var(--radius-full)] bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-[var(--on-accent)] font-bold text-sm font-[var(--font-heading)] transition-all shadow-sm hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-500)]">
                    <Sparkles className="w-4 h-4" aria-hidden />
                    Sign In &mdash; it&apos;s free
                    <ArrowRight className="w-4 h-4" aria-hidden />
                  </button>
                  <button type="button" onClick={onClose}
                    className="w-full px-4 py-2.5 rounded-[var(--radius-full)] border border-[var(--border)] bg-transparent text-[var(--ink-2)] font-semibold text-sm hover:bg-[var(--canvas)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)]">
                    Keep exploring as guest
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
