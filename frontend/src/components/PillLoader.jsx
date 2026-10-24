/**
 * frontend/src/components/PillLoader.jsx
 *
 * PolySafe Signature Pill Loader
 * ─────────────────────────────────────────────────────────────────────────────
 * Features:
 * • Editorial line art capsule with 2px stroke in var(--ink, #0B1B2B)
 * • Dynamic color split: Brand Blue (#0E7490) & Coral Accent (#FF5C35)
 * • Continuous smooth 360° rotation with subtle floating elevation
 * • Optional full-screen or inline layout with clinical Fraunces typography
 */

import React from 'react';
import { clsx } from 'clsx';

export default function PillLoader({
  size = 'md', // 'sm' | 'md' | 'lg' | 'fullscreen'
  label = 'Loading PolySafe...',
  sublabel = 'Synchronizing clinical pharmacology engines',
  className = '',
}) {
  const isFullscreen = size === 'fullscreen';

  const sizeDimensions = {
    sm: { width: 36, height: 18, text: 'text-xs', sub: 'text-[10px]' },
    md: { width: 56, height: 26, text: 'text-sm', sub: 'text-xs' },
    lg: { width: 76, height: 34, text: 'text-base', sub: 'text-xs' },
    fullscreen: { width: 64, height: 30, text: 'text-base', sub: 'text-xs' },
  };

  const dim = sizeDimensions[size] || sizeDimensions.md;

  const content = (
    <div
      className={clsx(
        'flex flex-col items-center justify-center gap-3 select-none font-sans',
        isFullscreen ? 'min-h-[60vh] p-8' : '',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {/* Animated Rotating Capsule */}
      <div className="relative flex items-center justify-center p-2">
        {/* Soft Ambient Radiance */}
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-30 animate-pulse pointer-events-none"
          style={{
            background: 'radial-gradient(circle, var(--brand-600, #0E7490) 0%, var(--accent-500, #FF5C35) 60%, transparent 80%)',
          }}
        />

        {/* The Rotating Pill SVG */}
        <div className="ps-pill-spin-container">
          <svg
            width={dim.width}
            height={dim.height}
            viewBox="0 0 64 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="overflow-visible"
          >
            {/* Left Half: Blue Accent */}
            <path
              d="M 15 2 C 7.82 2 2 7.82 2 15 C 2 22.18 7.82 28 15 28 L 32 28 L 32 2 Z"
              fill="var(--brand-600, #0E7490)"
              stroke="var(--ink, #0B1B2B)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Specular White Highlight on Blue Cap */}
            <path
              d="M 7 10 C 9 6 15 6 18 10"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeOpacity="0.85"
            />

            {/* Right Half: Coral Accent */}
            <path
              d="M 32 2 L 49 2 C 56.18 2 62 7.82 62 15 C 62 22.18 56.18 28 49 28 L 32 28 Z"
              fill="var(--accent-500, #FF5C35)"
              stroke="var(--ink, #0B1B2B)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Center Seam */}
            <line
              x1="32"
              y1="2"
              x2="32"
              y2="28"
              stroke="var(--ink, #0B1B2B)"
              strokeWidth="2.5"
            />
          </svg>
        </div>
      </div>

      {/* Label & Telemetry Sublabel */}
      {(label || sublabel) && (
        <div className="text-center space-y-1">
          {label && (
            <p
              className={clsx(
                'font-extrabold text-[var(--ink, #0B1B2B)] tracking-tight',
                dim.text
              )}
              style={{ fontFamily: 'var(--font-heading, "Fraunces", Georgia, serif)' }}
            >
              {label}
            </p>
          )}
          {sublabel && (
            <p className={clsx('font-mono text-[var(--ink-3, #64748B)]', dim.sub)}>
              {sublabel}
            </p>
          )}
        </div>
      )}

      {/* CSS Keyframe Animation */}
      <style>{`
        @keyframes psPillSpin {
          0% {
            transform: rotate(0deg) translateY(0px);
          }
          25% {
            transform: rotate(90deg) translateY(-4px);
          }
          50% {
            transform: rotate(180deg) translateY(0px);
          }
          75% {
            transform: rotate(270deg) translateY(4px);
          }
          100% {
            transform: rotate(360deg) translateY(0px);
          }
        }
        .ps-pill-spin-container {
          animation: psPillSpin 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          transform-origin: center center;
          display: inline-flex;
        }
        @media (prefers-reduced-motion: reduce) {
          .ps-pill-spin-container {
            animation: none;
          }
        }
      `}</style>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return content;
}
