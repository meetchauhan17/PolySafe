/**
 * src/three-d/FloatingCapsule.jsx
 * Pure CSS/SVG 3D Two-Tone Pill Capsule
 *
 * Requirements:
 * - Two-tone pill capsule in blue (var(--brand-600)) and coral (var(--accent-500))
 * - Pure CSS/SVG layered cylindrical gradients and glossy specular reflections
 * - Slow float animation (6s), subtle rotateY sway
 * - Dynamic ground shadow that scales inversely with height
 * - Disabled under prefers-reduced-motion or when 3D is turned off.
 */

import React from 'react';
import { clsx } from 'clsx';
import { useReducedMotion } from '../motion/useReducedMotion';

export function FloatingCapsule({
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  interactive = true,
}) {
  const isReduced = useReducedMotion();

  const sizeConfigs = {
    sm: { width: 100, height: 40, capsuleW: 90, capsuleH: 36, shadowW: 75, shadowH: 12 },
    md: { width: 150, height: 64, capsuleW: 136, capsuleH: 52, shadowW: 110, shadowH: 16 },
    lg: { width: 210, height: 88, capsuleW: 190, capsuleH: 72, shadowW: 150, shadowH: 22 },
  };

  const cfg = sizeConfigs[size] || sizeConfigs.md;

  return (
    <div
      className={clsx(
        'relative inline-flex flex-col items-center justify-center select-none',
        className
      )}
      style={{
        width: cfg.width,
        height: cfg.height + 40,
        perspective: '800px',
      }}
      aria-hidden="true"
    >
      {/* 3D Floating Body */}
      <div
        className={clsx(
          'relative z-10',
          !isReduced && 'capsule-float-anim'
        )}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Two-Tone Pill Container */}
        <div
          className="relative flex items-center overflow-hidden rounded-full shadow-lg border border-[rgba(255,255,255,0.35)]"
          style={{
            width: cfg.capsuleW,
            height: cfg.capsuleH,
            transform: isReduced ? 'rotate(-12deg)' : 'rotate(-12deg) rotateY(15deg)',
            transformStyle: 'preserve-3d',
            boxShadow:
              '0 14px 28px rgba(22, 33, 44, 0.16), 0 4px 10px rgba(22, 33, 44, 0.08), inset 0 2px 4px rgba(255,255,255,0.6)',
          }}
        >
          {/* Left Half: Blue (Brand-600) */}
          <div
            className="w-1/2 h-full relative"
            style={{
              background:
                'linear-gradient(180deg, #3B7FB5 0%, var(--brand-600) 45%, var(--brand-700) 85%, #123755 100%)',
            }}
          >
            {/* Top cylindrical gloss reflection */}
            <div
              className="absolute top-1.5 left-3 right-1 h-[28%] rounded-full opacity-60 pointer-events-none"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)',
              }}
            />
          </div>

          {/* Center Seam Ring */}
          <div
            className="w-[3px] h-full z-10 flex-shrink-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(22,33,44,0.35) 50%, rgba(255,255,255,0.4) 100%)',
            }}
          />

          {/* Right Half: Coral (Accent-500) */}
          <div
            className="w-1/2 h-full relative"
            style={{
              background:
                'linear-gradient(180deg, #F8A580 0%, var(--accent-500) 45%, var(--accent-600) 85%, #B34F22 100%)',
            }}
          >
            {/* Top cylindrical gloss reflection */}
            <div
              className="absolute top-1.5 left-1 right-3 h-[28%] rounded-full opacity-55 pointer-events-none"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)',
              }}
            />
          </div>

          {/* Continuous bottom 3D shadow trough */}
          <div
            className="absolute bottom-0 inset-x-0 h-[22%] opacity-35 pointer-events-none"
            style={{
              background:
                'linear-gradient(0deg, rgba(0,0,0,0.45) 0%, transparent 100%)',
            }}
          />
        </div>
      </div>

      {/* Dynamic Ground Shadow that scales with height */}
      <div
        className={clsx(
          'absolute bottom-2 rounded-full pointer-events-none',
          !isReduced && 'capsule-shadow-anim'
        )}
        style={{
          width: cfg.shadowW,
          height: cfg.shadowH,
          background:
            'radial-gradient(ellipse at center, rgba(22, 33, 44, 0.22) 0%, rgba(22, 33, 44, 0.05) 50%, transparent 75%)',
          filter: 'blur(3px)',
        }}
      />
    </div>
  );
}

export default FloatingCapsule;
