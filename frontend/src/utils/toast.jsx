/**
 * frontend/src/utils/toast.jsx
 *
 * Unified Overlay — Branded Toast Notifications
 * ─────────────────────────────────────────────────────────────────────────────
 * • Ivory cards: bg-[var(--paper)] surface, rounded-2xl, elevation shadow
 * • Colored left bar (4px) + semantic icon:
 *     - safe:     var(--safe-fg) / CheckCircle2
 *     - caution:  var(--caution-fg) / AlertTriangle
 *     - critical: var(--critical-fg) / AlertOctagon
 *     - info:     var(--brand-600) / Info
 * • Auto-dismiss with a thin progress line draining smoothly across duration
 * • aria-live="polite" (aria-live="assertive" + role="alert" for critical)
 * • Dismissable via X icon with clear accessible focus ring
 */

import React from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';

const TOAST_CONFIG = {
  safe: {
    barColor: 'border-l-[var(--safe-fg)]',
    progressBar: 'bg-[var(--safe-fg)]',
    badgeBg: 'bg-emerald-500/12 text-[var(--safe-fg)]',
    titleColor: 'text-[var(--ink)]',
    Icon: CheckCircle2,
    role: 'status',
    ariaLive: 'polite',
    defaultDuration: 4000,
  },
  caution: {
    barColor: 'border-l-[var(--caution-fg)]',
    progressBar: 'bg-[var(--caution-fg)]',
    badgeBg: 'bg-amber-500/12 text-[var(--caution-fg)]',
    titleColor: 'text-[var(--ink)]',
    Icon: AlertTriangle,
    role: 'status',
    ariaLive: 'polite',
    defaultDuration: 4500,
  },
  critical: {
    barColor: 'border-l-[var(--critical-fg)]',
    progressBar: 'bg-[var(--critical-fg)]',
    badgeBg: 'bg-rose-500/12 text-[var(--critical-fg)]',
    titleColor: 'text-[var(--critical-fg)]',
    Icon: AlertOctagon,
    role: 'alert',
    ariaLive: 'assertive',
    defaultDuration: 5500,
  },
  info: {
    barColor: 'border-l-[var(--brand-600)]',
    progressBar: 'bg-[var(--brand-600)]',
    badgeBg: 'bg-cyan-500/12 text-[var(--brand-600)]',
    titleColor: 'text-[var(--brand-600)]',
    Icon: Info,
    role: 'status',
    ariaLive: 'polite',
    defaultDuration: 4000,
  },
};

function ToastCard({ id, type = 'info', title, description, duration }) {
  const cfg = TOAST_CONFIG[type] || TOAST_CONFIG.info;
  const Icon = cfg.Icon;

  return (
    <div
      role={cfg.role}
      aria-live={cfg.ariaLive}
      className={`relative w-full max-w-sm overflow-hidden rounded-[var(--radius-2xl)] bg-[var(--paper)] border border-[var(--border)] border-l-4 ${cfg.barColor} p-4 shadow-[0_14px_36px_rgba(22,33,44,0.16),0_2px_8px_rgba(22,33,44,0.08)] flex items-start gap-3 text-left font-sans transition-all`}
    >
      {/* Semantic Icon Badge */}
      <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${cfg.badgeBg}`}>
        <Icon className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
      </div>

      {/* Message Content */}
      <div className="flex-1 pr-6 space-y-0.5 min-w-0">
        <h4 className={`text-sm font-bold leading-snug truncate ${cfg.titleColor}`}>
          {title}
        </h4>
        {description && (
          <p className="text-xs text-[var(--ink-2)] leading-relaxed break-words">
            {description}
          </p>
        )}
      </div>

      {/* Close Button */}
      <button
        type="button"
        onClick={() => toast.dismiss(id)}
        className="absolute top-3 right-3 text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors p-1 rounded-lg hover:bg-[var(--canvas)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)]"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Thin Progress Line (Drains smoothly over duration) */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--ink)]/5 overflow-hidden">
        <motion.div
          className={`h-full ${cfg.progressBar}`}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      </div>
    </div>
  );
}

function showToast(type, title, description, options = {}) {
  const cfg = TOAST_CONFIG[type] || TOAST_CONFIG.info;
  const duration = options.duration || cfg.defaultDuration;
  const toastId = options.id || `toast-${type}-${title}-${Math.random().toString(36).substring(2, 7)}`;

  return toast.custom(
    (t) => (
      <ToastCard
        id={t}
        type={type}
        title={title}
        description={description}
        duration={duration}
      />
    ),
    { id: toastId, duration, ...options }
  );
}

export const notify = {
  safe: (title, description, options) => showToast('safe', title, description, options),
  success: (title, description, options) => showToast('safe', title, description, options),

  caution: (title, description, options) => showToast('caution', title, description, options),
  warning: (title, description, options) => showToast('caution', title, description, options),

  critical: (title, description, options) => showToast('critical', title, description, options),
  error: (title, description, options) => showToast('critical', title, description, options),

  info: (title, description, options) => showToast('info', title, description, options),

  dismiss: (id) => toast.dismiss(id),
};

// Direct export aliases for existing imports
export const showSuccess = notify.success;
export const showError = notify.error;
export const showWarning = notify.warning;
export const showInfo = notify.info;
export const showCritical = notify.critical;
export const showCaution = notify.caution;
export const showSafe = notify.safe;

export default notify;
