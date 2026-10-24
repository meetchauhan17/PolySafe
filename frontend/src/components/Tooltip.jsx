/**
 * src/components/Tooltip.jsx
 *
 * Unified Overlay — Tooltip & Popover
 * ─────────────────────────────────────────────────────────────────────────────
 * Tooltip:
 *   • Small paper card (var(--paper)), 120ms fade in/out
 *   • Directional arrow (top | bottom | left | right)
 *   • Keyboard accessible: shows on focus, hides on blur
 *   • Portalled to document.body to avoid overflow clipping
 *
 * Popover:
 *   • Richer content popover triggered by click
 *   • Same paper card, radius-lg, shadow-md
 *   • Closes on Escape or outside click
 *
 * Usage:
 *   <Tooltip content="Anticholinergic Burden Score">
 *     <button>ACB</button>
 *   </Tooltip>
 *
 *   <Popover content={<div>Rich content</div>}>
 *     <button>Details</button>
 *   </Popover>
 */

import React, { useState, useRef, useEffect, useCallback, cloneElement } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

// ── Positioning helper ────────────────────────────────────────────────────────
function getPosition(triggerEl, tooltipEl, placement = 'top') {
  if (!triggerEl || !tooltipEl) return { top: 0, left: 0 };
  const tr = triggerEl.getBoundingClientRect();
  const tp = tooltipEl.getBoundingClientRect();
  const gap = 8;

  let top = 0, left = 0;
  switch (placement) {
    case 'top':
      top  = tr.top - tp.height - gap + window.scrollY;
      left = tr.left + (tr.width - tp.width) / 2 + window.scrollX;
      break;
    case 'bottom':
      top  = tr.bottom + gap + window.scrollY;
      left = tr.left + (tr.width - tp.width) / 2 + window.scrollX;
      break;
    case 'left':
      top  = tr.top + (tr.height - tp.height) / 2 + window.scrollY;
      left = tr.left - tp.width - gap + window.scrollX;
      break;
    case 'right':
      top  = tr.top + (tr.height - tp.height) / 2 + window.scrollY;
      left = tr.right + gap + window.scrollX;
      break;
  }
  // Clamp to viewport edges
  left = Math.max(8, Math.min(left, window.innerWidth - tp.width - 8));
  return { top, left };
}

const ARROW_MAP = {
  top:    { bottom: '-5px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' },
  bottom: { top:    '-5px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' },
  left:   { top:    '50%',  right: '-5px', transform: 'translateY(-50%) rotate(45deg)' },
  right:  { top:    '50%',  left:  '-5px', transform: 'translateY(-50%) rotate(45deg)' },
};

// ─────────────────────────────────────────────────────────────────────────────
// TOOLTIP
// ─────────────────────────────────────────────────────────────────────────────
export function Tooltip({ children, content, placement = 'top', disabled = false }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tipRef     = useRef(null);

  const show = useCallback(() => { if (!disabled) setVisible(true); }, [disabled]);
  const hide = useCallback(() => setVisible(false), []);

  useEffect(() => {
    if (visible && triggerRef.current && tipRef.current) {
      setPos(getPosition(triggerRef.current, tipRef.current, placement));
    }
  }, [visible, placement]);

  if (!content) return children;

  const trigger = cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: (e) => { show(); children.props.onMouseEnter?.(e); },
    onMouseLeave: (e) => { hide(); children.props.onMouseLeave?.(e); },
    onFocus:      (e) => { show(); children.props.onFocus?.(e); },
    onBlur:       (e) => { hide(); children.props.onBlur?.(e); },
  });

  const arrow = ARROW_MAP[placement];

  return (
    <>
      {trigger}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {visible && (
            <motion.div
              ref={tipRef}
              role="tooltip"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 500, pointerEvents: 'none' }}
              className="max-w-[200px] px-2.5 py-1.5 rounded-lg bg-[var(--paper)] border border-[var(--border)] shadow-[0_4px_16px_rgba(22,33,44,0.16)] text-xs text-[var(--ink)] font-[var(--font-heading)] font-medium leading-snug"
            >
              {content}
              {/* Arrow */}
              <span
                style={{
                  position: 'absolute',
                  width: 10, height: 10,
                  background: 'var(--paper)',
                  border: '1px solid var(--border)',
                  borderRight: 'none',
                  borderBottom: 'none',
                  ...arrow,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// POPOVER
// ─────────────────────────────────────────────────────────────────────────────
export function Popover({ children, content, placement = 'bottom', disabled = false }) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const popRef     = useRef(null);

  const toggle = useCallback(() => { if (!disabled) setOpen((p) => !p); }, [disabled]);
  const close  = useCallback(() => setOpen(false), []);

  // Position on open
  useEffect(() => {
    if (open && triggerRef.current && popRef.current) {
      setPos(getPosition(triggerRef.current, popRef.current, placement));
    }
  }, [open, placement]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e) { if (e.key === 'Escape') close(); }
    function handleClick(e) {
      if (!triggerRef.current?.contains(e.target) && !popRef.current?.contains(e.target)) close();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, close]);

  const trigger = cloneElement(children, {
    ref: triggerRef,
    onClick: (e) => { toggle(); children.props.onClick?.(e); },
    'aria-expanded': open,
    'aria-haspopup': 'dialog',
  });

  return (
    <>
      {trigger}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={popRef}
              initial={{ opacity: 0, scale: 0.96, y: placement === 'top' ? 4 : -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
              style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 400 }}
              className="min-w-[200px] max-w-xs rounded-[var(--radius-lg)] bg-[var(--paper)] border border-[var(--border)] shadow-[0_8px_32px_rgba(22,33,44,0.16)] p-3 text-sm text-[var(--ink)]"
              role="dialog"
              aria-modal="false"
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

export default Tooltip;
