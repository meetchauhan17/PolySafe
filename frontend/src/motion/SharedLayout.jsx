/**
 * src/motion/SharedLayout.jsx
 * Shared-Layout Transition Helpers for Tabs, Drawers, and Floating Indicators
 *
 * Requirements:
 * - Shared layout transitions between active tabs, pill indicators, and drawer panels.
 * - Uses snappy spring preset (stiffness: 420, damping: 32).
 * - Under prefers-reduced-motion: skips spring layout animation and cuts directly.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';
import { SPRINGS } from './presets';

/**
 * Animated active indicator pill that moves smoothly across tab headers or list items.
 */
export function SharedActivePill({
  layoutId = 'activeTabIndicator',
  className = 'absolute inset-0 bg-[var(--surface)] rounded-[var(--radius-sm)] shadow-[var(--shadow-xs)] border border-[var(--border)]',
  style,
}) {
  const isReduced = useReducedMotion();

  if (isReduced) {
    return <div className={className} style={style} aria-hidden="true" />;
  }

  return (
    <motion.div
      layoutId={layoutId}
      transition={SPRINGS.snappy}
      className={className}
      style={style}
      aria-hidden="true"
    />
  );
}

/**
 * Animated sliding drawer shell with shared backdrop and spring panel.
 */
export function SharedDrawer({
  isOpen,
  onClose,
  title,
  children,
  side = 'right',
  className = '',
}) {
  const isReduced = useReducedMotion();

  const isBottom = side === 'bottom';
  const isRight = side === 'right';

  const slideVariants = {
    closed: isReduced
      ? { opacity: 0 }
      : isBottom
      ? { y: '100%', opacity: 0.9 }
      : { x: isRight ? '100%' : '-100%', opacity: 0.8 },
    open: isReduced
      ? { opacity: 1, transition: { duration: 0.1 } }
      : isBottom
      ? { y: 0, opacity: 1, transition: SPRINGS.snappy }
      : { x: 0, opacity: 1, transition: SPRINGS.snappy },
    exit: isReduced
      ? { opacity: 0, transition: { duration: 0.1 } }
      : isBottom
      ? {
          y: '100%',
          opacity: 0,
          transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
        }
      : {
          x: isRight ? '100%' : '-100%',
          opacity: 0,
          transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
        },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isReduced ? 0.1 : 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-xs"
          />

          {/* Drawer Panel */}
          <motion.div
            variants={slideVariants}
            initial="closed"
            animate="open"
            exit="exit"
            className={
              isBottom
                ? `absolute bottom-0 left-0 right-0 max-h-[85vh] w-full max-w-2xl mx-auto bg-[var(--surface)] border-t border-[var(--border)] rounded-t-3xl shadow-[var(--shadow-xl)] flex flex-col ${className}`
                : `absolute top-0 bottom-0 ${
                    isRight ? 'right-0' : 'left-0'
                  } w-full max-w-md bg-[var(--surface)] border-[var(--border)] shadow-[var(--shadow-xl)] flex flex-col ${
                    isRight ? 'border-l' : 'border-r'
                  } ${className}`
            }
          >
            {isBottom && (
              <div className="pt-3 pb-1 flex justify-center" aria-hidden="true">
                <span className="w-12 h-1.5 rounded-full bg-[var(--border)]" />
              </div>
            )}
            {title && (
              <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <h3 className="text-base font-bold font-[var(--font-heading)] text-[var(--ink)]">
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                  aria-label="Close drawer"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default SharedActivePill;
