// src/components/Modal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Unified Overlay System — Modal + Drawer
//
// Modal: centered dialog, max-height 86vh, internal scroll, spring entrance.
// Drawer: right-side panel on desktop, bottom-sheet with drag handle on mobile.
//
// Shared behaviour:
//   • Backdrop: rgba(22,33,44, 0.55) + 8px blur
//   • Surface:  var(--paper) — warm ivory "raised" card
//   • Radius:   var(--radius-2xl)
//   • Entrance: spring scale .96→1 + 8px y-rise (Modal); x/y slide (Drawer)
//   • Focus trap (Tab/Shift-Tab) + focus-restore on close
//   • Escape key closes
//   • Body scroll locked while open
//   • Portalled to document.body
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), details > summary';

// ── FocusTrap: cycles focus within the overlay, restores on unmount ──────────
function FocusTrap({ children, onClose }) {
  const ref = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    previousFocus.current = document.activeElement;
    const el = ref.current;
    if (!el) return;

    const getFocusable = () => Array.from(el.querySelectorAll(FOCUSABLE));
    const items = getFocusable();
    if (items.length) items[0].focus();

    function handleKeyDown(e) {
      if (e.key === 'Escape') { e.preventDefault(); onClose?.(); return; }
      if (e.key !== 'Tab') return;
      const list = getFocusable();
      if (!list.length) { e.preventDefault(); return; }
      const first = list[0];
      const last  = list[list.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    el.addEventListener('keydown', handleKeyDown);
    return () => {
      el.removeEventListener('keydown', handleKeyDown);
      previousFocus.current?.focus?.();
    };
  }, [onClose]);

  return <div ref={ref} style={{ display: 'contents' }}>{children}</div>;
}

// ── Scroll lock ───────────────────────────────────────────────────────────────
function useScrollLock(open) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL — centered dialog
// ─────────────────────────────────────────────────────────────────────────────
export function Modal({
  open,
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  className,
  hideCloseButton = false,
  noPadding = false,
}) {
  const isModalOpen = open ?? isOpen ?? false;
  const reduce = useReducedMotion();
  useScrollLock(isModalOpen);

  const sizeMap = {
    sm:   'max-w-sm',
    md:   'max-w-2xl',
    lg:   'max-w-4xl',
    xl:   'max-w-6xl',
    full: 'max-w-[calc(100vw-2rem)]',
  };

  const spring = { type: 'spring', stiffness: 380, damping: 30, mass: 0.9 };

  return createPortal(
    <AnimatePresence>
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[200]"
            style={{
              background: 'rgba(22,33,44,0.55)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.18 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Centering wrapper */}
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <FocusTrap onClose={onClose}>
              <motion.div
                className={clsx(
                  'relative w-full pointer-events-auto',
                  'rounded-[var(--radius-2xl)] border border-[var(--border)]',
                  'bg-[var(--paper)]',
                  'shadow-[0_24px_64px_rgba(22,33,44,0.22),0_4px_12px_rgba(22,33,44,0.10)]',
                  'flex flex-col max-h-[86vh]',
                  sizeMap[size],
                  className,
                )}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
                transition={reduce ? { duration: 0.12 } : spring}
                role="dialog"
                aria-modal="true"
                aria-label={title}
              >
                {/* Header */}
                {(title || (!hideCloseButton && onClose)) && (
                  <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-0 flex-shrink-0">
                    <div className="min-w-0">
                      {title && (
                        <h2 className="text-lg font-bold text-[var(--ink)] font-[var(--font-heading)] leading-snug">
                          {title}
                        </h2>
                      )}
                      {subtitle && (
                        <p className="text-sm text-[var(--ink-3)] mt-0.5 leading-relaxed">{subtitle}</p>
                      )}
                    </div>
                    {!hideCloseButton && onClose && (
                      <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="flex-shrink-0 p-1.5 rounded-[var(--radius-sm)] text-[var(--ink-3)] hover:bg-[var(--canvas)] hover:text-[var(--ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)]"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Scrollable body */}
                <div className={clsx('flex-1 overflow-y-auto', noPadding ? '' : 'p-6')}>
                  {children}
                </div>
              </motion.div>
            </FocusTrap>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DRAWER — right panel on desktop, bottom sheet on mobile
// ─────────────────────────────────────────────────────────────────────────────
export function Drawer({
  open,
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  className,
  width = 440,
}) {
  const isDrawerOpen = open ?? isOpen ?? false;
  const reduce = useReducedMotion();
  useScrollLock(isDrawerOpen);

  const spring = { type: 'spring', stiffness: 340, damping: 32, mass: 0.95 };

  return createPortal(
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[200]"
            style={{
              background: 'rgba(22,33,44,0.55)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.18 }}
            onClick={onClose}
            aria-hidden="true"
          />

          <FocusTrap onClose={onClose}>
            {/* Desktop: right panel / Mobile: bottom sheet */}
            <motion.div
              className={clsx(
                'fixed z-[201] flex flex-col',
                // Desktop styles
                'top-0 right-0 h-[100dvh]',
                'bg-[var(--paper)] border-l border-[var(--border)]',
                'shadow-[-8px_0_48px_rgba(22,33,44,0.18)]',
                // Mobile overrides (bottom sheet)
                'max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:right-0',
                'max-sm:h-[90dvh] max-sm:w-full!',
                'max-sm:border-l-0 max-sm:border-t max-sm:border-[var(--border)]',
                'max-sm:rounded-t-[var(--radius-2xl)]',
                'max-sm:shadow-[0_-8px_48px_rgba(22,33,44,0.18)]',
                className,
              )}
              style={{ width: `min(${width}px, 100vw)` }}
              initial={reduce ? { opacity: 0 } : { x: '100%' }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: '100%' }}
              transition={reduce ? { duration: 0 } : spring}
              role="dialog"
              aria-modal="true"
              aria-label={title}
            >
              {/* Mobile drag handle */}
              <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
                <div
                  className="w-10 h-1 rounded-full bg-[var(--border-strong)]"
                  aria-hidden="true"
                />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
                <div className="min-w-0">
                  {title && (
                    <h2 className="text-base font-bold text-[var(--ink)] font-[var(--font-heading)] leading-snug">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="text-sm text-[var(--ink-3)] mt-0.5">{subtitle}</p>
                  )}
                </div>
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close panel"
                    className="flex-shrink-0 p-1.5 rounded-[var(--radius-sm)] text-[var(--ink-3)] hover:bg-[var(--canvas)] hover:text-[var(--ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-5">{children}</div>
            </motion.div>
          </FocusTrap>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default Modal;
