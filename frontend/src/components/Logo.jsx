/**
 * frontend/src/components/Logo.jsx
 *
 * PolySafe Master Brand Mark & Wordmark — Minimal Modern Architecture (2026)
 * ─────────────────────────────────────────────────────────────────────────────
 * Designed according to modern tech & healthcare design principles:
 * • No cartoon strokes or fussy nested outlines.
 * • Pure solid vector planes, clean negative-space keylines, and subtle lighting.
 * • Scales flawlessly from a 16px favicon to giant high-res displays.
 *
 * Available Minimal Concepts:
 * 1. "cross" (Default): The Synergy Cross — Two intersecting pharmaceutical capsules
 *    (Vertical Brand Sapphire + Horizontal Warm Coral) forming an iconic Swiss medical cross (+).
 * 2. "shield": The Monolith Crest — Solid aerodynamic clinical shield with a two-tone
 *    bi-chamber capsule and medical cross carved in negative space.
 * 3. "capsule": The Minimalist Bi-Chamber — Pure 45° floating capsule with zero container,
 *    featuring cyan and coral color blocks with a clinical cross.
 */

import React, { useId } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

/**
 * Concept 1: The Synergy Cross (Interlocking Duo-Pill Medical Cross)
 * The purest geometric metaphor for Polypharmacy + Safety.
 * Two pills (Poly) crossing to form a medical cross (Safe).
 */
function SynergyCrossMark({ size, isWhite, isMono, strokeColor, uid }) {
  const brandStart = isWhite ? '#38BDF8' : isMono ? strokeColor : '#0284C7';
  const brandEnd = isWhite ? '#0284C7' : isMono ? strokeColor : '#0369A1';
  const coralStart = isWhite ? '#FFA08A' : isMono ? strokeColor : '#FF5C35';
  const coralEnd = isWhite ? '#FF5C35' : isMono ? strokeColor : '#E04823';
  const gapColor = isWhite ? '#0B1B2B' : 'var(--paper, #FFFFFF)';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="overflow-visible select-none"
    >
      <defs>
        <linearGradient id={`sc-brand-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={brandStart} />
          <stop offset="100%" stopColor={brandEnd} />
        </linearGradient>

        <linearGradient id={`sc-coral-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={coralStart} />
          <stop offset="100%" stopColor={coralEnd} />
        </linearGradient>

        {/* Minimal soft ambient elevation */}
        <filter id={`sc-shadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="3" floodColor={isWhite ? 'rgba(0,0,0,0.5)' : 'rgba(14, 116, 144, 0.22)'} />
        </filter>
      </defs>

      <g filter={`url(#sc-shadow-${uid})`}>
        {/* Vertical Capsule (Brand Sapphire: Formulation & Precision) */}
        <rect
          x="23"
          y="8"
          width="18"
          height="48"
          rx="9"
          fill={`url(#sc-brand-${uid})`}
        />

        {/* Horizontal Capsule Negative-Space Mask / Gap */}
        {!isMono && (
          <rect
            x="5.5"
            y="20.5"
            width="53"
            height="23"
            rx="11.5"
            fill="none"
            stroke={gapColor}
            strokeWidth="3.5"
          />
        )}

        {/* Horizontal Capsule (Warm Coral: Interaction Sentinel) */}
        <rect
          x="8"
          y="23"
          width="48"
          height="18"
          rx="9"
          fill={isMono ? (isWhite ? '#FFFFFF' : '#64748B') : `url(#sc-coral-${uid})`}
        />

        {/* Clinical Intersection Heart Dot (Luminous Core Beacon) */}
        {!isMono && (
          <circle
            cx="32"
            cy="32"
            r="3.5"
            fill="#FFFFFF"
            opacity={0.95}
          />
        )}
      </g>
    </svg>
  );
}

/**
 * Concept 2: The Monolith Crest (Modern Aerodynamic Shield with Negative-Space Cross)
 * Solid architectural form with authoritative healthcare presence.
 */
function MonolithShieldMark({ size, isWhite, isMono, strokeColor, uid }) {
  const brandStart = isWhite ? '#0284C7' : isMono ? strokeColor : '#0E7490';
  const brandEnd = isWhite ? '#0369A1' : isMono ? strokeColor : '#075985';
  const coralStart = isWhite ? '#FFA08A' : isMono ? '#94A3B8' : '#FF5C35';
  const coralEnd = isWhite ? '#FF5C35' : isMono ? '#64748B' : '#E04823';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="overflow-visible select-none"
    >
      <defs>
        <linearGradient id={`ms-brand-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={brandStart} />
          <stop offset="100%" stopColor={brandEnd} />
        </linearGradient>

        <linearGradient id={`ms-coral-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={coralStart} />
          <stop offset="100%" stopColor={coralEnd} />
        </linearGradient>

        <filter id={`ms-shadow-${uid}`} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="3.5" floodColor={isWhite ? 'rgba(0,0,0,0.45)' : 'rgba(14, 116, 144, 0.25)'} />
        </filter>
      </defs>

      <g filter={`url(#ms-shadow-${uid})`}>
        {/* Solid Aerodynamic Shield (Left Chamber - Sapphire) */}
        <path
          d="M 31 6 C 20 6, 10 9, 9.5 16 C 9.5 39, 19.5 52, 31 58.5 Z"
          fill={`url(#ms-brand-${uid})`}
        />

        {/* Solid Aerodynamic Shield (Right Chamber - Warm Coral) */}
        <path
          d="M 33 6 C 44 6, 54 9, 54.5 16 C 54.5 39, 44.5 52, 33 58.5 Z"
          fill={`url(#ms-coral-${uid})`}
        />

        {/* Center Negative-Space Medical Cross */}
        <g fill="#FFFFFF">
          <rect x="29" y="21" width="6" height="20" rx="3" />
          <rect x="22" y="28" width="20" height="6" rx="3" />
        </g>

        {/* Dynamic Top Surveillance Dot */}
        <circle cx="32" cy="13" r="2.2" fill="#FFFFFF" opacity={0.9} />
      </g>
    </svg>
  );
}

/**
 * Concept 3: The Minimalist Bi-Chamber Capsule (Pure 45° Floating Pill)
 * Crisp, borderless, frameless pharmaceutical capsule.
 */
function MinimalCapsuleMark({ size, isWhite, isMono, strokeColor, uid }) {
  const brandStart = isWhite ? '#38BDF8' : isMono ? strokeColor : '#0284C7';
  const brandEnd = isWhite ? '#0284C7' : isMono ? strokeColor : '#0369A1';
  const coralStart = isWhite ? '#FFA08A' : isMono ? '#94A3B8' : '#FF5C35';
  const coralEnd = isWhite ? '#FF5C35' : isMono ? '#64748B' : '#E04823';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="overflow-visible select-none"
    >
      <defs>
        <linearGradient id={`mc-brand-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={brandStart} />
          <stop offset="100%" stopColor={brandEnd} />
        </linearGradient>

        <linearGradient id={`mc-coral-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={coralStart} />
          <stop offset="100%" stopColor={coralEnd} />
        </linearGradient>

        <filter id={`mc-shadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor={isWhite ? 'rgba(0,0,0,0.5)' : 'rgba(14, 116, 144, 0.25)'} />
        </filter>
      </defs>

      <g transform="translate(32, 32) rotate(-45)" filter={`url(#mc-shadow-${uid})`}>
        {/* Top Chamber (Sapphire / Formulations) */}
        <path
          d="M -11 -2.5 L -11 -13 C -11 -19.07 -6.07 -24 0 -24 C 6.07 -24 11 -19.07 11 -13 L 11 -2.5 Z"
          fill={`url(#mc-brand-${uid})`}
        />

        {/* Medical Cross inside Top Chamber */}
        <g stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round">
          <line x1="0" y1="-17" x2="0" y2="-9" />
          <line x1="-4" y1="-13" x2="4" y2="-13" />
        </g>

        {/* Bottom Chamber (Warm Coral / Active Interaction Surveillance) */}
        <path
          d="M -11 2.5 L 11 2.5 L 11 13 C 11 19.07 6.07 24 0 24 C -6.07 24 -11 19.07 -11 13 Z"
          fill={isMono ? (isWhite ? '#FFFFFF' : '#64748B') : `url(#mc-coral-${uid})`}
        />

        {/* Precision Surveillance Core Dot */}
        <circle cx="0" cy="13" r="3" fill="#FFFFFF" opacity={0.95} />
      </g>
    </svg>
  );
}

/**
 * Isolated SVG Brand Mark
 * Switches cleanly between the modern concepts while defaulting to the iconic Synergy Cross.
 */
export function LogoMark({
  size = 36,
  concept = 'cross', // 'cross' (default minimal) | 'shield' | 'capsule'
  variant = 'color', // 'color' | 'monochrome' | 'mono' | 'white' | 'dark'
  className = '',
  role = 'img',
  'aria-label': ariaLabel = 'PolySafe Clinical Safety Logo',
}) {
  const isMono = variant === 'monochrome' || variant === 'mono';
  const isWhite = variant === 'white' || variant === 'dark';
  const strokeColor = isWhite ? '#FFFFFF' : '#16212C';
  const uid = useId().replace(/:/g, '');

  let MarkComponent = SynergyCrossMark;
  if (concept === 'shield') MarkComponent = MonolithShieldMark;
  if (concept === 'capsule') MarkComponent = MinimalCapsuleMark;

  return (
    <div className={clsx('inline-flex items-center justify-center flex-shrink-0 transition-transform duration-200', className)}>
      <MarkComponent
        size={size}
        isWhite={isWhite}
        isMono={isMono}
        strokeColor={strokeColor}
        uid={uid}
      />
    </div>
  );
}

/**
 * Master PolySafe Logo with Minimal Modern Wordmark & Optional Tagline
 */
export default function Logo({
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl' | number
  concept = 'cross', // 'cross' | 'shield' | 'capsule'
  variant = 'color', // 'color' | 'monochrome' | 'mono' | 'white' | 'dark'
  font = 'sans', // 'sans' (modern minimal default) | 'serif'
  showWordmark = true,
  showTagline = false,
  tagline = 'Clinical Safety AI',
  to,
  className = '',
  onClick,
}) {
  const sizeMap = {
    sm: { markSize: 26, text: 'text-base sm:text-lg', sub: 'text-[8.5px]' },
    md: { markSize: 34, text: 'text-xl sm:text-2xl', sub: 'text-[9.5px]' },
    lg: { markSize: 42, text: 'text-2xl sm:text-3xl', sub: 'text-[10px]' },
    xl: { markSize: 52, text: 'text-3xl sm:text-4xl', sub: 'text-[11px]' },
  };

  const config = typeof size === 'number'
    ? { markSize: size, text: size > 40 ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl', sub: 'text-[9px]' }
    : sizeMap[size] || sizeMap.md;

  const isWhite = variant === 'white' || variant === 'dark';
  const isMono = variant === 'monochrome' || variant === 'mono';

  const fontStyle = font === 'serif'
    ? { fontFamily: 'var(--font-heading, "Fraunces", Georgia, serif)', letterSpacing: '-0.03em' }
    : { fontFamily: 'var(--font-sans, "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)', letterSpacing: '-0.035em' };

  const content = (
    <div
      className={clsx(
        'group inline-flex items-center gap-2.5 sm:gap-3 transition-transform select-none',
        to && 'hover:opacity-95 cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <LogoMark
        size={config.markSize}
        concept={concept}
        variant={variant}
        className="transition-transform duration-200 group-hover:scale-105"
      />

      {showWordmark && (
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-baseline">
            <span
              className={clsx(
                'font-extrabold tracking-tight',
                config.text,
                isWhite ? 'text-white' : 'text-[var(--ink)]'
              )}
              style={fontStyle}
            >
              Poly
            </span>
            <span
              className={clsx(
                'font-extrabold tracking-tight',
                config.text,
                isWhite
                  ? 'text-[#FFA08A]'
                  : isMono
                  ? 'text-[var(--ink)] font-black'
                  : 'text-[var(--brand-600)]'
              )}
              style={fontStyle}
            >
              Safe
            </span>
            {/* Signature Minimal Modern Coral Pulse Accent Dot */}
            {!isMono && (
              <span
                className={clsx(
                  'inline-block w-1.5 h-1.5 rounded-full ml-0.5 mb-1.5 transition-transform duration-300 group-hover:scale-125',
                  isWhite ? 'bg-[#FFA08A]' : 'bg-[var(--accent-500)] shadow-xs'
                )}
                aria-hidden="true"
              />
            )}
          </div>

          {showTagline && (
            <div className="hidden xl:flex items-center gap-1.5 mt-1">
              <span
                className={clsx(
                  'w-1.5 h-1.5 rounded-full animate-pulse',
                  isWhite ? 'bg-emerald-400' : 'bg-emerald-500'
                )}
                aria-hidden="true"
              />
              <span
                className={clsx(
                  'font-mono font-semibold tracking-[0.14em] uppercase',
                  config.sub,
                  isWhite ? 'text-white/80' : 'text-[var(--ink-3)]'
                )}
              >
                {tagline}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)] focus-visible:ring-offset-2 rounded-xl transition-all"
        aria-label="PolySafe Home"
      >
        {content}
      </Link>
    );
  }

  return content;
}
