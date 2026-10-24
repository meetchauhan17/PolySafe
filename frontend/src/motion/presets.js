/**
 * src/motion/presets.js
 * PolySafe Motion Presets & Easing Curves
 *
 * All motion constants, easing curves, spring configs, and variant definitions
 * adhere strictly to the "Ivory Editorial" design language and accessibility rules.
 */

// ── Easing Curves ─────────────────────────────────────────────────────────────
// 260ms ease-emph curve (smooth deceleration with lively entry)
export const EASE_EMPH = [0.16, 1, 0.3, 1];
export const EASE_OUT = [0.215, 0.61, 0.355, 1];
export const EASE_IN = [0.4, 0, 1, 1];

// ── Spring Presets ────────────────────────────────────────────────────────────
export const SPRINGS = {
  // Soft: gentle, clinical calm for cards, panels, and large dialogs
  soft: {
    type: 'spring',
    stiffness: 220,
    damping: 28,
    mass: 1,
  },
  // Snappy: tactile, crisp for tabs, switches, toggles, badges, and pills
  snappy: {
    type: 'spring',
    stiffness: 420,
    damping: 32,
    mass: 0.8,
  },
  // Magnetic return: fast and bounce-free for button hover release
  magnetic: {
    type: 'spring',
    stiffness: 350,
    damping: 24,
    mass: 0.5,
  },
};

// ── Page Transition Variants ──────────────────────────────────────────────────
// Requirement: fade + 10px rise + slight blur-in, 260ms ease-emph
// Reduced motion guard: 100ms pure opacity fade, no movement or blur
export const pageTransitionVariants = {
  initial: (reduced) =>
    reduced
      ? { opacity: 0 }
      : {
          opacity: 0,
          y: 10,
          filter: 'blur(4px)',
        },
  animate: (reduced) =>
    reduced
      ? {
          opacity: 1,
          transition: { duration: 0.1, ease: 'easeOut' },
        }
      : {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          transition: {
            duration: 0.26,
            ease: EASE_EMPH,
          },
        },
  exit: (reduced) =>
    reduced
      ? {
          opacity: 0,
          transition: { duration: 0.1, ease: 'easeIn' },
        }
      : {
          opacity: 0,
          y: -6,
          filter: 'blur(2px)',
          transition: {
            duration: 0.18,
            ease: [0.4, 0, 1, 1],
          },
        },
};

// ── Stagger Presets (60ms delay between children) ─────────────────────────────
export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  show: (reduced) => ({
    opacity: 1,
    transition: {
      staggerChildren: reduced ? 0 : 0.06,
      delayChildren: reduced ? 0 : 0.04,
    },
  }),
};

export const staggerItemVariants = {
  hidden: (reduced) =>
    reduced
      ? { opacity: 0 }
      : { opacity: 0, y: 8 },
  show: (reduced) =>
    reduced
      ? {
          opacity: 1,
          transition: { duration: 0.1 },
        }
      : {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.24,
            ease: EASE_EMPH,
          },
        },
};

// ── Scroll Reveal Preset (once) ───────────────────────────────────────────────
export const revealVariants = {
  hidden: (reduced) =>
    reduced
      ? { opacity: 0 }
      : { opacity: 0, y: 12 },
  visible: (reduced) =>
    reduced
      ? {
          opacity: 1,
          transition: { duration: 0.1 },
        }
      : {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.35,
            ease: EASE_EMPH,
          },
        },
};
