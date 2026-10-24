/**
 * frontend/src/components/OnboardingIllustrations.jsx
 *
 * Cohesive Editorial Line-Art Illustrations for Onboarding & Tour
 * ─────────────────────────────────────────────────────────────────────────────
 * Style Rules:
 * • Editorial line art: 2px strokes in var(--ink, #0B1B2B)
 * • Flat fills in ivory / paper (var(--paper, #FFFFFF) / var(--surface, #FAF8F5))
 * • Exactly one blue accent: var(--brand-600, #0E7490)
 * • Exactly one coral accent: var(--accent-500, #FF5C35)
 * • Inline SVGs under 3 KB each
 */

import React from 'react';
import { clsx } from 'clsx';

/**
 * Step 1: Age & Beers Criteria Calibration
 */
export function OnboardingAgeIllustration({ className = 'w-36 h-36 mx-auto' }) {
  return (
    <svg
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx('overflow-visible flex-shrink-0 select-none', className)}
      role="img"
      aria-label="Age calibration illustration"
    >
      <circle cx="70" cy="70" r="56" fill="var(--surface-2, #F1F5F9)" opacity="0.6" />

      {/* Calendar / Clinical Timeline Sheet */}
      <g transform="translate(36, 28)">
        <rect x="0" y="0" width="68" height="76" rx="8" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="2.5" />
        
        {/* Top Binder Bar */}
        <rect x="0" y="0" width="68" height="18" rx="8" fill="var(--brand-600, #0E7490)" stroke="var(--ink, #0B1B2B)" strokeWidth="2.5" />
        <circle cx="16" cy="9" r="2.5" fill="var(--paper, #FFFFFF)" />
        <circle cx="34" cy="9" r="2.5" fill="var(--paper, #FFFFFF)" />
        <circle cx="52" cy="9" r="2.5" fill="var(--paper, #FFFFFF)" />

        {/* Big Age Number in Center ("65+") */}
        <text
          x="34"
          y="48"
          textAnchor="middle"
          fill="var(--ink, #0B1B2B)"
          fontSize="24"
          fontWeight="900"
          fontFamily="var(--font-heading, 'Fraunces', serif)"
        >
          65<tspan fontSize="18" fill="var(--accent-500, #FF5C35)">+</tspan>
        </text>

        {/* Geriatric Calibration Subtext */}
        <line x1="16" y1="58" x2="52" y2="58" stroke="var(--ink-4, #94A3B8)" strokeWidth="2" strokeLinecap="round" />
        <line x1="22" y1="64" x2="46" y2="64" stroke="var(--ink-4, #94A3B8)" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Calibration Dial Indicator (Coral Accent) */}
      <g transform="translate(86, 80)">
        <circle cx="16" cy="16" r="14" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />
        <circle cx="16" cy="16" r="3" fill="var(--accent-500, #FF5C35)" />
        <line x1="16" y1="16" x2="23" y2="10" stroke="var(--accent-500, #FF5C35)" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/**
 * Step 2: Chronic Conditions & Medical Formulary
 */
export function OnboardingConditionsIllustration({ className = 'w-36 h-36 mx-auto' }) {
  return (
    <svg
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx('overflow-visible flex-shrink-0 select-none', className)}
      role="img"
      aria-label="Chronic conditions profiling illustration"
    >
      <circle cx="70" cy="70" r="56" fill="var(--surface-2, #F1F5F9)" opacity="0.6" />

      {/* Main Clinical Clipboard */}
      <g transform="translate(36, 24)">
        {/* Top Clip */}
        <rect x="22" y="0" width="24" height="10" rx="3" fill="var(--surface-2, #F1F5F9)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />
        <circle cx="34" cy="5" r="2" fill="var(--ink, #0B1B2B)" />

        {/* Board */}
        <rect x="6" y="8" width="56" height="82" rx="8" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="2.5" />

        {/* Checklist Rows with Active Checks */}
        <circle cx="18" cy="28" r="4.5" fill="var(--brand-600, #0E7490)" />
        <line x1="28" y1="28" x2="52" y2="28" stroke="var(--ink, #0B1B2B)" strokeWidth="2" strokeLinecap="round" />

        {/* Pulse / Cardio Wave Row */}
        <circle cx="18" cy="46" r="4.5" fill="var(--accent-500, #FF5C35)" />
        <path d="M 28 46 H 34 L 37 40 L 41 52 L 45 46 H 52" stroke="var(--accent-500, #FF5C35)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />

        {/* Kidney / Renal Row */}
        <circle cx="18" cy="64" r="4.5" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="1.75" />
        <line x1="28" y1="64" x2="48" y2="64" stroke="var(--ink-4, #94A3B8)" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Delicate Herbal Botanical Accent */}
      <g transform="translate(86, 76)">
        <path d="M 10 24 C 14 16, 24 10, 32 8" stroke="var(--ink, #0B1B2B)" strokeWidth="1.75" strokeLinecap="round" />
        <path d="M 18 18 C 22 14, 28 14, 28 20 C 22 22, 18 20, 18 18 Z" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

/**
 * Step 3: Safety Review & Interaction Sentinel
 */
export function OnboardingReviewIllustration({ className = 'w-36 h-36 mx-auto' }) {
  return (
    <svg
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx('overflow-visible flex-shrink-0 select-none', className)}
      role="img"
      aria-label="Clinical safety review illustration"
    >
      <circle cx="70" cy="70" r="56" fill="var(--surface-2, #F1F5F9)" opacity="0.6" />

      {/* Clinical Shield Frame */}
      <path
        d="M 70 20 C 84 20, 96 23, 98 29 C 98 56, 86 74, 70 84 C 54 74, 42 56, 42 29 C 44 23, 56 20, 70 20 Z"
        fill="var(--paper, #FFFFFF)"
        stroke="var(--ink, #0B1B2B)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Inner Rotated 45° Capsule Pill (Blue & Coral) */}
      <g transform="translate(70, 48) rotate(-45)">
        <path d="M -8 -16 C -8 -20.4 -4.4 -24 0 -24 C 4.4 -24 8 -20.4 8 -16 L 8 0 L -8 0 Z" fill="var(--brand-600, #0E7490)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" strokeLinejoin="round" />
        <path d="M -8 0 L 8 0 L 8 16 C 8 20.4 4.4 24 0 24 C -4.4 24 -8 20.4 -8 16 Z" fill="var(--accent-500, #FF5C35)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" strokeLinejoin="round" />
        <line x1="-8" y1="0" x2="8" y2="0" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />
      </g>

      {/* Safety Sentinel Checkmark Emblem */}
      <g transform="translate(86, 76)">
        <circle cx="14" cy="14" r="14" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />
        <path d="M 8 14 L 12 18 L 20 10" stroke="var(--safe-fg, #16A34A)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/**
 * Product Tour Illustration: Continuous Surveillance
 */
export function TourSurveillanceIllustration({ className = 'w-36 h-36 mx-auto' }) {
  return (
    <svg
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx('overflow-visible flex-shrink-0 select-none', className)}
      role="img"
      aria-label="Continuous surveillance tour illustration"
    >
      <circle cx="70" cy="70" r="56" fill="var(--surface-2, #F1F5F9)" opacity="0.6" />

      {/* Orbit Track */}
      <ellipse cx="70" cy="70" rx="46" ry="24" stroke="var(--border, #E2E8F0)" strokeWidth="2" strokeDasharray="4 4" transform="rotate(-15 70 70)" />

      {/* Center Sentinel Shield */}
      <path
        d="M 70 36 C 80 36, 88 38, 90 43 C 90 62, 82 72, 70 78 C 58 72, 50 62, 50 43 C 52 38, 60 36, 70 36 Z"
        fill="var(--paper, #FFFFFF)"
        stroke="var(--ink, #0B1B2B)"
        strokeWidth="2.5"
      />
      <circle cx="70" cy="56" r="6" fill="var(--brand-600, #0E7490)" />

      {/* Orbiting Satellite 1: Pill (Coral) */}
      <circle cx="34" cy="62" r="7" fill="var(--accent-500, #FF5C35)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />
      <line x1="30" y1="62" x2="38" y2="62" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />

      {/* Orbiting Satellite 2: Doctor Stethoscope Disc (Blue) */}
      <circle cx="106" cy="78" r="7" fill="var(--paper, #FFFFFF)" stroke="var(--brand-600, #0E7490)" strokeWidth="2" />
      <circle cx="106" cy="78" r="3" fill="var(--brand-600, #0E7490)" />
    </svg>
  );
}

export default {
  OnboardingAgeIllustration,
  OnboardingConditionsIllustration,
  OnboardingReviewIllustration,
  TourSurveillanceIllustration,
};
