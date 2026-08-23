import React from 'react';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * PolySafe Branded Toast Notifications.
 * Formatted with brand token styling:
 *   - Success: Safe Green (var(--led-safe) / var(--chassis))
 *   - Error: Danger Red (var(--led-critical) / var(--chassis))
 *   - Warning: Caution Amber (var(--led-caution) / var(--chassis))
 *   - Info: Clinical Navy (var(--accent-secondary) / #E6EFF5)
 */
export const notify = {
  success: (title, description, options = {}) => {
    const toastId = options.id || `toast-success-${title}-${description || ''}`;
    return toast.custom((t) => (
      <div className="w-full max-w-sm bg-[var(--chassis)] border-2 border-[var(--led-safe)]/40 rounded-2xl p-4 shadow-[8px_8px_20px_rgba(0,0,0,0.18),-4px_-4px_12px_rgba(255,255,255,0.7)] flex items-start gap-3 relative text-left font-sans">
        <div className="p-2 bg-[var(--chassis)] text-[var(--led-safe)] rounded-xl flex-shrink-0 mt-0.5">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="flex-1 pr-6 space-y-0.5">
          <h4 className="text-sm font-bold text-[var(--text-primary)]">{title}</h4>
          {description && (
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(t)}
          className="absolute top-3 right-3 text-[#9CA3AF] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--chassis)] cursor-pointer"
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
      <div className="w-full max-w-sm bg-[var(--chassis)] border-2 border-[var(--led-critical)]/40 rounded-2xl p-4 shadow-[8px_8px_20px_rgba(0,0,0,0.18),-4px_-4px_12px_rgba(255,255,255,0.7)] flex items-start gap-3 relative text-left font-sans">
        <div className="p-2 bg-[var(--chassis)] text-[var(--led-critical)] rounded-xl flex-shrink-0 mt-0.5">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="flex-1 pr-6 space-y-0.5">
          <h4 className="text-sm font-bold text-[var(--led-critical)]">{title}</h4>
          {description && (
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(t)}
          className="absolute top-3 right-3 text-[#9CA3AF] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--chassis)] cursor-pointer"
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
      <div className="w-full max-w-sm bg-[var(--chassis)] border-2 border-[var(--led-caution)]/40 rounded-2xl p-4 shadow-[8px_8px_20px_rgba(0,0,0,0.18),-4px_-4px_12px_rgba(255,255,255,0.7)] flex items-start gap-3 relative text-left font-sans">
        <div className="p-2 bg-[var(--chassis)] text-[var(--led-caution)] rounded-xl flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 pr-6 space-y-0.5">
          <h4 className="text-sm font-bold text-[var(--text-primary)]">{title}</h4>
          {description && (
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(t)}
          className="absolute top-3 right-3 text-[#9CA3AF] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--chassis)] cursor-pointer"
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
      <div className="w-full max-w-sm bg-[var(--chassis)] border-2 border-[var(--accent-secondary)]/40 rounded-2xl p-4 shadow-[8px_8px_20px_rgba(0,0,0,0.18),-4px_-4px_12px_rgba(255,255,255,0.7)] flex items-start gap-3 relative text-left font-sans">
        <div className="p-2 bg-[#E6EFF5] text-[var(--accent-secondary)] rounded-xl flex-shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="flex-1 pr-6 space-y-0.5">
          <h4 className="text-sm font-bold text-[var(--accent-secondary)]">{title}</h4>
          {description && (
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(t)}
          className="absolute top-3 right-3 text-[#9CA3AF] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--chassis)] cursor-pointer"
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
