import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * GuestLockModal.jsx
 * Displayed whenever a Guest user attempts a write or authenticated action
 * (e.g. Add Medicine, Log Symptom, Generate Doctor Code, Add Caregiver).
 */
export default function GuestLockModal({ isOpen, onClose, featureName = 'this feature' }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  if (!isOpen) return null;

  const handleSignIn = () => {
    onClose?.();
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#1C2B27]/60 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-[#E7E1D3] text-left"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guest-lock-title"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[#6B726C] hover:text-[#232724] rounded-full hover:bg-[#F5F0E8] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon Header */}
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-3.5 bg-[#8A6D3B]/10 text-[#8A6D3B] rounded-2xl ring-1 ring-[#8A6D3B]/30 shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A6D3B] bg-[#FBEED9] px-2.5 py-0.5 rounded-full">
                Guest Mode Preview
              </span>
              <h3
                id="guest-lock-title"
                className="text-xl font-bold text-[#232724] mt-0.5"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Sign In to Unlock
              </h3>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3 text-sm text-[#4A5568] leading-relaxed">
            <p>
              You're currently exploring PolySafe in <strong className="text-[#232724]">Guest Demo Mode</strong>.
            </p>
            <p className="bg-[#FBF8F2] p-3.5 rounded-2xl border border-[#E7E1D3] text-xs text-[#6B726C]">
              To <strong className="text-[#2B6E5E]">{featureName}</strong>, save real prescriptions, log symptoms, generate physician share codes, and get personalized interaction warnings, please sign in or create an account.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={handleSignIn}
              className="flex-1 polysafe-btn-primary flex items-center justify-center space-x-2 py-3 px-5 text-sm font-bold shadow-md shadow-[#2B6E5E]/20"
            >
              <span>Sign In / Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="sm:w-auto polysafe-btn-secondary py-3 px-4 text-xs font-bold text-[#6B726C] hover:text-[#232724]"
            >
              Keep Exploring
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
