// src/components/GuestLockModal.jsx — Clinical Calm redesign
import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Lock, ArrowRight, X, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GuestLockModal({ isOpen, onClose, featureName = 'this feature' }) {
  const navigate = useNavigate();
  const { logout } = useAuth() || {};
  const shouldReduceMotion = useReducedMotion();

  const handleSignIn = () => {
    onClose?.();
    logout?.();
    navigate('/login', { replace: true });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-[var(--ink)]/40 backdrop-blur-sm z-[200]"
          />
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-sm bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-[var(--shadow-lg)] p-6"
              role="dialog"
              aria-modal="true"
              aria-label="Authentication required"
            >
              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-4 p-1.5 rounded-[var(--radius-sm)] text-[var(--ink-3)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon */}
              <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--brand-50)] border border-[var(--brand-100)] flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-[var(--brand-600)]" aria-hidden />
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-[var(--ink)] font-[var(--font-heading)] mb-1">
                Sign in to continue
              </h3>
              <p className="text-sm text-[var(--ink-3)] leading-relaxed mb-4">
                You're in Guest Mode. To{' '}
                <strong className="text-[var(--ink-2)] font-semibold">{featureName}</strong>, persist your
                medication regimen and receive physician updates, please sign in.
              </p>

              {/* Features preview */}
              <div className="bg-[var(--surface-2)] rounded-[var(--radius-md)] p-3.5 mb-5 space-y-2">
                {[
                  'Persistent medication & interaction history',
                  'Real-time physician directives',
                  'Symptom tracking & safety timeline',
                ].map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[var(--brand-600)] mt-0.5 flex-shrink-0" aria-hidden />
                    <span className="text-xs text-[var(--ink-2)] font-[var(--font-heading)] font-medium">{f}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="ps-btn ps-btn-primary w-full"
                >
                  Sign In
                  <ArrowRight className="w-4 h-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="ps-btn ps-btn-ghost w-full"
                >
                  Keep exploring as guest
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
