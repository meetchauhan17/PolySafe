import React from 'react';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * PolySafe Branded Toast Notifications.
 * Formatted with brand token styling:
 *   - Success: Safe Green (#2F8558 / #E4F2E9)
 *   - Error: Danger Red (#B23D25 / #FBE4DE)
 *   - Warning: Caution Amber (#B5791A / #FBEED9)
 *   - Info: Clinical Navy (#1B4B66 / #E6EFF5)
 */
export const notify = {
  success: (title, description) => {
    return toast.custom((t) => (
      <div className="w-full max-w-sm bg-[var(--brand-clay)] border-2 border-[#2F8558]/40 rounded-2xl p-4 shadow-[8px_8px_20px_rgba(0,0,0,0.18),-4px_-4px_12px_rgba(255,255,255,0.7)] flex items-start gap-3 relative text-left font-sans">
        <div className="p-2 bg-[#E4F2E9] text-[#2F8558] rounded-xl flex-shrink-0 mt-0.5">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="flex-1 pr-6 space-y-0.5">
          <h4 className="text-sm font-bold text-[#232724]">{title}</h4>
          {description && (
            <p className="text-xs text-[#6B726C] leading-relaxed">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(t)}
          className="absolute top-3 right-3 text-[#9CA3AF] hover:text-[#232724] transition-colors p-1 rounded-lg hover:bg-[var(--brand-paper)]"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ), { duration: 4000 });
  },

  error: (title, description) => {
    return toast.custom((t) => (
      <div className="w-full max-w-sm bg-[var(--brand-clay)] border-2 border-[#B23D25]/40 rounded-2xl p-4 shadow-[8px_8px_20px_rgba(0,0,0,0.18),-4px_-4px_12px_rgba(255,255,255,0.7)] flex items-start gap-3 relative text-left font-sans">
        <div className="p-2 bg-[#FBE4DE] text-[#B23D25] rounded-xl flex-shrink-0 mt-0.5">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="flex-1 pr-6 space-y-0.5">
          <h4 className="text-sm font-bold text-[#B23D25]">{title}</h4>
          {description && (
            <p className="text-xs text-[#6B726C] leading-relaxed">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(t)}
          className="absolute top-3 right-3 text-[#9CA3AF] hover:text-[#232724] transition-colors p-1 rounded-lg hover:bg-[var(--brand-paper)]"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ), { duration: 4500 });
  },

  warning: (title, description) => {
    return toast.custom((t) => (
      <div className="w-full max-w-sm bg-[var(--brand-clay)] border-2 border-[#B5791A]/40 rounded-2xl p-4 shadow-[8px_8px_20px_rgba(0,0,0,0.18),-4px_-4px_12px_rgba(255,255,255,0.7)] flex items-start gap-3 relative text-left font-sans">
        <div className="p-2 bg-[#FBEED9] text-[#B5791A] rounded-xl flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 pr-6 space-y-0.5">
          <h4 className="text-sm font-bold text-[#7A4A0A]">{title}</h4>
          {description && (
            <p className="text-xs text-[#6B726C] leading-relaxed">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(t)}
          className="absolute top-3 right-3 text-[#9CA3AF] hover:text-[#232724] transition-colors p-1 rounded-lg hover:bg-[var(--brand-paper)]"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ), { duration: 4000 });
  },

  info: (title, description) => {
    return toast.custom((t) => (
      <div className="w-full max-w-sm bg-[var(--brand-clay)] border-2 border-[#1B4B66]/40 rounded-2xl p-4 shadow-[8px_8px_20px_rgba(0,0,0,0.18),-4px_-4px_12px_rgba(255,255,255,0.7)] flex items-start gap-3 relative text-left font-sans">
        <div className="p-2 bg-[#E6EFF5] text-[#1B4B66] rounded-xl flex-shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="flex-1 pr-6 space-y-0.5">
          <h4 className="text-sm font-bold text-[#1B4B66]">{title}</h4>
          {description && (
            <p className="text-xs text-[#6B726C] leading-relaxed">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(t)}
          className="absolute top-3 right-3 text-[#9CA3AF] hover:text-[#232724] transition-colors p-1 rounded-lg hover:bg-[var(--brand-paper)]"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ), { duration: 4000 });
  },
};

// Named helper exports per Prompt 3 spec: showSuccess(msg), showError(msg), showInfo(msg)
export const showSuccess = (title, description) => notify.success(title, description);
export const showError   = (title, description) => notify.error(title, description);
export const showInfo    = (title, description) => notify.info(title, description);
export const showWarning = (title, description) => notify.warning(title, description);

export default notify;
