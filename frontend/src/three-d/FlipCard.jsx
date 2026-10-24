/**
 * src/three-d/FlipCard.jsx
 * Accessible CSS 3D Flip Card
 *
 * Requirements:
 * - 3D flip (rotateY 180deg, 600ms ease-emph, backface hidden)
 * - Keyboard operable (Enter/Space)
 * - aria-pressed and accessible labelling
 * - Shows a small "Flip" affordance pill
 * - Collapses to 100ms instant switch under reduced-motion or when 3D is disabled.
 */

import React, { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { useReducedMotion } from '../motion/useReducedMotion';

export function FlipCard({
  front,
  back,
  isFlipped: controlledFlipped,
  onFlip,
  className = '',
  flipAffordanceLabel = 'Flip Card',
  showAffordance = true,
  ariaLabel = 'Two-sided clinical card',
}) {
  const isReduced = useReducedMotion();
  const [internalFlipped, setInternalFlipped] = useState(false);

  const isControlled = controlledFlipped !== undefined;
  const flipped = isControlled ? controlledFlipped : internalFlipped;

  const handleToggle = (e) => {
    // Avoid double trigger if clicking button inside
    if (e.target.closest('button[data-no-flip="true"]') || e.target.closest('a')) {
      return;
    }
    const next = !flipped;
    if (!isControlled) {
      setInternalFlipped(next);
    }
    onFlip?.(next);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle(e);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={`${ariaLabel}. Currently showing ${flipped ? 'back' : 'front'}. Press Enter or Space to flip.`}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={`group relative outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)] focus-visible:ring-offset-2 rounded-[var(--radius-xl)] select-none cursor-pointer ${className}`}
      style={{
        perspective: '1200px',
      }}
    >
      {/* 3D Inner Container */}
      <div
        className={`relative w-full h-full transition-transform duration-600 preserve-3d will-change-transform ${
          isReduced ? '' : 'transform-style-preserve-3d'
        }`}
        style={{
          transformStyle: isReduced ? 'flat' : 'preserve-3d',
          transform: isReduced
            ? undefined
            : flipped
            ? 'rotateY(180deg)'
            : 'rotateY(0deg)',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Front Face */}
        <div
          className={`w-full h-full relative ${
            isReduced && flipped ? 'hidden' : 'block'
          }`}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: isReduced ? undefined : 'rotateY(0deg)',
          }}
        >
          {front}

          {/* Front Flip Affordance Pill */}
          {showAffordance && (
            <div className="absolute bottom-3.5 right-3.5 z-20 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--surface-2)]/90 backdrop-blur-xs text-[var(--ink-2)] border border-[var(--border)] shadow-xs group-hover:bg-[var(--brand-50)] group-hover:text-[var(--brand-700)] transition-colors">
                <RotateCw className="w-3 h-3 text-[var(--brand-600)] group-hover:rotate-180 transition-transform duration-500" />
                <span>{flipAffordanceLabel}</span>
              </span>
            </div>
          )}
        </div>

        {/* Back Face */}
        <div
          className={`w-full h-full ${
            isReduced
              ? flipped
                ? 'block'
                : 'hidden'
              : 'absolute inset-0'
          }`}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: isReduced ? undefined : 'rotateY(180deg)',
          }}
        >
          {back}

          {/* Back Flip Affordance Pill */}
          {showAffordance && (
            <div className="absolute bottom-3.5 right-3.5 z-20 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--surface-2)]/90 backdrop-blur-xs text-[var(--ink-2)] border border-[var(--border)] shadow-xs group-hover:bg-[var(--brand-50)] group-hover:text-[var(--brand-700)] transition-colors">
                <RotateCw className="w-3 h-3 text-[var(--brand-600)] group-hover:rotate-180 transition-transform duration-500" />
                <span>Back to Front</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FlipCard;
