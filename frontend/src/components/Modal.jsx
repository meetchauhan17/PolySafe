// src/components/Modal.jsx
// Centered modal (max-h 86vh) and right/bottom Drawer.
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

function FocusTrap({ children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Focus first focusable element
    const focusable = el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();
    // Trap
    function handleKeyDown(e) {
      if (e.key === 'Escape') { onClose?.(); return; }
      if (e.key !== 'Tab') return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }
    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  return <div ref={ref}>{children}</div>;
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  className,
}) {
  const shouldReduce = useReducedMotion();
  const sizeCls = { sm: 'max-w-sm', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl', full: 'max-w-full' };

  // Prevent body scroll
  useEffect(() => {
    if (open) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="ps-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduce ? 0 : 0.15 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <FocusTrap onClose={onClose}>
            <motion.div
              className={clsx('ps-modal w-full', sizeCls[size], className)}
              initial={shouldReduce ? false : { opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: shouldReduce ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {(title || onClose) && (
                <div className="flex items-start justify-between gap-4 p-6 pb-0">
                  <div>
                    {title && (
                      <h2 className="text-lg font-bold text-[var(--ink)] font-[var(--font-heading)]">
                        {title}
                      </h2>
                    )}
                    {subtitle && (
                      <p className="text-sm text-[var(--ink-3)] mt-0.5">{subtitle}</p>
                    )}
                  </div>
                  {onClose && (
                    <button
                      onClick={onClose}
                      aria-label="Close dialog"
                      className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ink-3)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] transition-colors flex-shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
              <div className="p-6">{children}</div>
            </motion.div>
          </FocusTrap>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  className,
}) {
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    if (open) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="ps-drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduce ? 0 : 0.15 }}
            onClick={onClose}
          />
          <FocusTrap onClose={onClose}>
            <motion.div
              className={clsx('ps-drawer', className)}
              initial={shouldReduce ? false : { x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: shouldReduce ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center justify-between gap-4 p-5 border-b border-[var(--border)] flex-shrink-0">
                <div>
                  {title && (
                    <h2 className="text-base font-bold text-[var(--ink)] font-[var(--font-heading)]">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="text-sm text-[var(--ink-3)] mt-0.5">{subtitle}</p>
                  )}
                </div>
                {onClose && (
                  <button
                    onClick={onClose}
                    aria-label="Close panel"
                    className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ink-3)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-5">{children}</div>
            </motion.div>
          </FocusTrap>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
