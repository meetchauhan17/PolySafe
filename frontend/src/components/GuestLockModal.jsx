import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Lock, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PolySafeButton from './PolySafeButton';
import LedIndicator from './LedIndicator';

export default function GuestLockModal({ isOpen, onClose, featureName = 'this feature' }) {
  const navigate = useNavigate();
  const { logout } = useAuth() || {};
  const shouldReduceMotion = useReducedMotion();

  if (!isOpen) return null;

  const handleSignIn = () => {
    onClose?.();
    logout?.();
    navigate('/login', { replace: true });
  };

  return (
    <AnimatePresence>
      <div className="ps-modal-overlay">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#1a1f2e]/60"
        />

        {/* Modal Panel */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          className="relative z-10 w-full max-w-md bg-[var(--chassis)] rounded-[32px] p-6 sm:p-8 shadow-[var(--shadow-floating)] border border-[rgba(255,255,255,0.4)] text-left"
          role="dialog"
          aria-modal="true"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-full bg-[var(--chassis)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card)] active:shadow-[var(--shadow-pressed)] transition-all"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="p-3.5 bg-[var(--chassis)] text-[var(--accent-primary)] rounded-2xl shadow-[var(--shadow-sm)]">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <LedIndicator status="amber" size="sm" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Guest Mode Preview
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-[var(--text-primary)] font-display mt-0.5 drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">
                Authentication Required
              </h3>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3 text-sm text-[var(--text-muted)] leading-relaxed">
            <p>
              You are currently viewing PolySafe in <strong className="text-[var(--text-primary)]">Guest Mode</strong>.
            </p>
            <div className="p-3.5 rounded-xl bg-[var(--chassis)] shadow-[var(--shadow-recessed)] text-xs font-mono text-[var(--text-muted)]">
              To <strong className="text-[var(--accent-primary)]">{featureName}</strong>, persist custom medication regimens, track symptoms, and receive physician directives, please sign in.
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
            <PolySafeButton
              variant="primary"
              onClick={handleSignIn}
              className="flex-1"
              icon={ArrowRight}
            >
              Sign In Now
            </PolySafeButton>
            <PolySafeButton
              variant="secondary"
              onClick={onClose}
              className="sm:w-auto"
            >
              Keep Exploring
            </PolySafeButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
