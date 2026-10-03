import React from 'react';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * PolySafe Branded Toast Notifications.
 * Formatted with brand token styling:
 *   - Success: Safe Green (var(--safe-fg) / var(--canvas))
 *   - Error: Danger Red (var(--critical-fg) / var(--canvas))
 *   - Warning: Caution Amber (var(--caution-fg) / var(--canvas))
 *   - Info: Clinical Navy (var(--doctor-600) / #E6EFF5)
 */
export const notify = {
  success: (title, description, options = {}) => {
    const toastId = options.id || `toast-success-${title}-${description || ''}`;
    return toast.custom((t) => (
      <div className="w-full max-w-sm bg-[var(--canvas)] border-2 border-[var(--safe-fg)]/40 rounded-2xl p-4 shadow-[8px_8px_20px_rgba(0,0,0,0.18),-4px_-4px_12px_rgba(255,255,255,0.7)] flex items-start gap-3 relative text-left font-sans">
        <div className="p-2 bg-[var(--canvas)] text-[var(--safe-fg)] rounded-xl flex-shrink-0 mt-0.5">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="flex-1 pr-6 space-y-0.5">
          <h4 className="text-sm font-bold text-[var(--ink)]">{title}</h4>
          {description && (
            <p className="text-xs text-[var(--ink-3)] leading-relaxed">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(t)}
          className="absolute top-3 right-3 text-[#9CA3AF] hover:text-[var(--ink)] transition-colors p-1 rounded-lg hover:bg-[var(--canvas)] cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ), { id: toastId, duration: 4000, ...options });
  },

  error: (title, description, options = {}) => {
    const toastId = options.id || `toast-error-${title}-${description || ''}`;
    return toast.custom((t) => (
      <div className="w-full max-w-sm bg-[var(--canvas)] border-2 border-[var(--critical-fg)]/40 rounded-2xl p-4 shadow-[8px_8px_20px_rgba(0,0,0,0.18),-4px_-4px_12px_rgba(255,255,255,0.7)] flex items-start gap-3 relative text-left font-sans">
        <div className="p-2 bg-[var(--canvas)] text-[var(--critical-fg)] rounded-xl flex-shrink-0 mt-0.5">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="flex-1 pr-6 space-y-0.5">
          <h4 className="text-sm font-bold text-[var(--critical-fg)]">{title}</h4>
          {description && (
            <p className="text-xs text-[var(--ink-3)] leading-relaxed">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(t)}
          className="absolute top-3 right-3 text-[#9CA3AF] hover:text-[var(--ink)] transition-colors p-1 rounded-lg hover:bg-[var(--canvas)] cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ), { id: toastId, duration: 4500, ...options });
  },

  warning: (title, description, options = {}) => {
    const toastId = options.id || `toast-warning-${title}-${description || ''}`;
    return toast.custom((t) => (
      <div className="w-full max-w-sm bg-[var(--canvas)] border-2 border-[var(--caution-fg)]/40 rounded-2xl p-4 shadow-[8px_8px_20px_rgba(0,0,0,0.18),-4px_-4px_12px_rgba(255,255,255,0.7)] flex items-start gap-3 relative text-left font-sans">
        <div className="p-2 bg-[var(--canvas)] text-[var(--caution-fg)] rounded-xl flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 pr-6 space-y-0.5">
          <h4 className="text-sm font-bold text-[var(--ink)]">{title}</h4>
          {description && (
            <p className="text-xs text-[var(--ink-3)] leading-relaxed">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(t)}
          className="absolute top-3 right-3 text-[#9CA3AF] hover:text-[var(--ink)] transition-colors p-1 rounded-lg hover:bg-[var(--canvas)] cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ), { id: toastId, duration: 4000, ...options });
  },

  info: (title, description, options = {}) => {
    const toastId = options.id || `toast-info-${title}-${description || ''}`;
    return toast.custom((t) => (
      <div className="w-full max-w-sm bg-[var(--canvas)] border-2 border-[var(--doctor-600)]/40 rounded-2xl p-4 shadow-[8px_8px_20px_rgba(0,0,0,0.18),-4px_-4px_12px_rgba(255,255,255,0.7)] flex items-start gap-3 relative text-left font-sans">
        <div className="p-2 bg-[#E6EFF5] text-[var(--doctor-600)] rounded-xl flex-shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="flex-1 pr-6 space-y-0.5">
          <h4 className="text-sm font-bold text-[var(--doctor-600)]">{title}</h4>
          {description && (
            <p className="text-xs text-[var(--ink-3)] leading-relaxed">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(t)}
          className="absolute top-3 right-3 text-[#9CA3AF] hover:text-[var(--ink)] transition-colors p-1 rounded-lg hover:bg-[var(--canvas)] cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ), { id: toastId, duration: 4000, ...options });
  },
};

// Convenience direct export aliases
export const showSuccess = (title, description, options) => notify.success(title, description, options);
export const showError = (title, description, options) => notify.error(title, description, options);
export const showWarning = (title, description, options) => notify.warning(title, description, options);
export const showInfo = (title, description, options) => notify.info(title, description, options);

export default notify;
