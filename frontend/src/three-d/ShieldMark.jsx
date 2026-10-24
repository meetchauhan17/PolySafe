/**
 * src/three-d/ShieldMark.jsx
 * Pure CSS/SVG 3D Clinical Shield Mark with Check
 *
 * Requirements:
 * - Pure CSS/SVG 3D shield with check mark
 * - Layered gradients and bevel reflections
 * - Slow float animation (6s), subtle rotateY sway
 * - Dynamic ground shadow that scales with height
 * - Disabled under prefers-reduced-motion or when 3D is turned off.
 */

import React from 'react';
import { clsx } from 'clsx';
import { useReducedMotion } from '../motion/useReducedMotion';

export function ShieldMark({
  size = 80,
  className = '',
  color = 'var(--brand-600)',
}) {
  const isReduced = useReducedMotion();

  const shadowWidth = size * 0.9;
  const shadowHeight = size * 0.18;

  return (
    <div
      className={clsx(
        'relative inline-flex flex-col items-center justify-center select-none',
        className
      )}
      style={{
        width: size + 20,
        height: size + 36,
        perspective: '800px',
      }}
      aria-hidden="true"
    >
      {/* 3D Floating Shield Container */}
      <div
        className={clsx(
          'relative z-10',
          !isReduced && 'shield-float-anim'
        )}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="overflow-visible"
          style={{
            transform: isReduced ? 'none' : 'rotateY(10deg) rotateX(6deg)',
            transformStyle: 'preserve-3d',
            filter: 'drop-shadow(0 12px 20px rgba(22, 33, 44, 0.18))',
          }}
        >
          <defs>
            {/* Left face gradient (highlighted) */}
            <linearGradient id="shieldLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#357FB5" />
              <stop offset="60%" stopColor="var(--brand-600)" />
              <stop offset="100%" stopColor="var(--brand-700)" />
            </linearGradient>

            {/* Right face gradient (shaded for 3D bevel depth) */}
            <linearGradient id="shieldRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--brand-600)" />
              <stop offset="60%" stopColor="var(--brand-700)" />
              <stop offset="100%" stopColor="#143956" />
            </linearGradient>

            {/* Specular edge sheen */}
            <linearGradient id="shieldRimGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.7)" />
              <stop offset="40%" stopColor="rgba(255, 255, 255, 0.1)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.3)" />
            </linearGradient>

            {/* Checkmark gradient */}
            <linearGradient id="checkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2DDD2" />
            </linearGradient>
          </defs>

          {/* Left Shield Half */}
          <path
            d="M 50 10 L 16 24 C 16 56 34 82 50 90 Z"
            fill="url(#shieldLeftGrad)"
            stroke="url(#shieldRimGrad)"
            strokeWidth="1.5"
          />

          {/* Right Shield Half */}
          <path
            d="M 50 10 L 84 24 C 84 56 66 82 50 90 Z"
            fill="url(#shieldRightGrad)"
            stroke="url(#shieldRimGrad)"
            strokeWidth="1.5"
          />

          {/* Center Spine Ridge Highlight */}
          <line
            x1="50"
            y1="10"
            x2="50"
            y2="90"
            stroke="rgba(255, 255, 255, 0.45)"
            strokeWidth="1.2"
          />

          {/* Floating Clinical Checkmark on Upper Z Plane */}
          <path
            d="M 33 50 L 44 61 L 67 38"
            fill="none"
            stroke="url(#checkGrad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
            }}
          />
        </svg>
      </div>

      {/* Dynamic Ground Shadow that scales with height */}
      <div
        className={clsx(
          'absolute bottom-1 rounded-full pointer-events-none',
          !isReduced && 'shield-shadow-anim'
        )}
        style={{
          width: shadowWidth,
          height: shadowHeight,
          background:
            'radial-gradient(ellipse at center, rgba(22, 33, 44, 0.22) 0%, rgba(22, 33, 44, 0.05) 55%, transparent 75%)',
          filter: 'blur(3px)',
        }}
      />
    </div>
  );
}

export default ShieldMark;
