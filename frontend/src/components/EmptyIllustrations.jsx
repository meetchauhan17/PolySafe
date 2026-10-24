/**
 * frontend/src/components/EmptyIllustrations.jsx
 *
 * Cohesive Editorial Line-Art Empty State Illustrations
 * ─────────────────────────────────────────────────────────────────────────────
 * Style Rules:
 * • Editorial line art: 2px strokes in var(--ink, #0B1B2B)
 * • Flat fills in ivory / paper (var(--paper, #FFFFFF) / var(--surface, #FAF8F5))
 * • Exactly one blue accent: var(--brand-600, #0E7490)
 * • Exactly one coral accent: var(--accent-500, #FF5C35)
 * • Inline SVGs, strictly lightweight (< 3 KB each)
 *
 * Illustrations included:
 * 1. EmptyMedicinesIllustration    (No medicines added)
 * 2. EmptyFlagsIllustration        (No flags / All checks clear)
 * 3. EmptyConnectionsIllustration  (No doctor/caregiver connections)
 * 4. EmptySymptomsIllustration     (No symptoms logged)
 * 5. EmptyPatientsIllustration    (No patient selected in doctor view)
 * 6. EmptyDataIllustration        (No data / telemetry yet)
 * 7. EmptySearchIllustration      (Search returned 0 results)
 */

import React from 'react';
import { clsx } from 'clsx';

/* ── 1. No Medicines Added ───────────────────────────────────────────── */
export function EmptyMedicinesIllustration({ className = 'w-32 h-32 mx-auto' }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx('overflow-visible flex-shrink-0 select-none', className)}
      role="img"
      aria-label="No medications illustration"
    >
      {/* Background Soft Ambient Disc */}
      <circle cx="60" cy="60" r="48" fill="var(--surface-2, #F1F5F9)" opacity="0.6" />

      {/* Pill Bottle */}
      <g transform="translate(32, 28)">
        {/* Cap with ridges */}
        <rect x="14" y="0" width="28" height="8" rx="2" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />
        <line x1="21" y1="2" x2="21" y2="6" stroke="var(--ink, #0B1B2B)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="28" y1="2" x2="28" y2="6" stroke="var(--ink, #0B1B2B)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="35" y1="2" x2="35" y2="6" stroke="var(--ink, #0B1B2B)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Neck */}
        <rect x="18" y="8" width="20" height="4" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />

        {/* Bottle Body */}
        <rect x="8" y="12" width="40" height="52" rx="6" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />

        {/* Paper Prescription Label with Rx */}
        <rect x="12" y="20" width="32" height="34" rx="3" fill="var(--surface, #FAF8F5)" stroke="var(--border, #E2E8F0)" strokeWidth="1.2" />
        {/* Blue Rx Glyphs */}
        <path d="M18 28H23C25 28 26 29 26 31C26 33 25 34 23 34H18V28ZM18 34L26 42M23 37L28 33" stroke="var(--brand-600, #0E7490)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        {/* Prescription lines */}
        <line x1="18" y1="46" x2="38" y2="46" stroke="var(--ink-4, #94A3B8)" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Floating 45-degree Dual-Tone Capsule (Blue & Coral) */}
      <g transform="translate(82, 74) rotate(-35)">
        {/* Blue Half */}
        <path d="M -6 -12 C -6 -15.3 -3.3 -18 0 -18 C 3.3 -18 6 -15.3 6 -12 L 6 0 L -6 0 Z" fill="var(--brand-600, #0E7490)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" strokeLinejoin="round" />
        {/* Coral Half */}
        <path d="M -6 0 L 6 0 L 6 12 C 6 15.3 3.3 18 0 18 C -3.3 18 -6 15.3 -6 12 Z" fill="var(--accent-500, #FF5C35)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" strokeLinejoin="round" />
        {/* Dividing Seam */}
        <line x1="-6" y1="0" x2="6" y2="0" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />
      </g>

      {/* Floating Scored Round Tablet */}
      <circle cx="28" cy="84" r="8" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />
      <line x1="22" y1="84" x2="34" y2="84" stroke="var(--ink, #0B1B2B)" strokeWidth="1.5" strokeLinecap="round" />

      {/* Subtle Coral Plus Accent Spark */}
      <path d="M88 32V40M84 36H92" stroke="var(--accent-500, #FF5C35)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ── 2. No Flags / All Clear ─────────────────────────────────────────── */
export function EmptyFlagsIllustration({ className = 'w-32 h-32 mx-auto' }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx('overflow-visible flex-shrink-0 select-none', className)}
      role="img"
      aria-label="All clear no flags illustration"
    >
      <circle cx="60" cy="60" r="48" fill="var(--surface-2, #F1F5F9)" opacity="0.6" />

      {/* Shield Body in Editorial Ivory */}
      <path
        d="M 60 22 C 71 22, 80 24.5, 82 29 C 82 50, 74 62, 60 70 C 46 62, 38 50, 38 29 C 40 24.5, 49 22, 60 22 Z"
        fill="var(--paper, #FFFFFF)"
        stroke="var(--ink, #0B1B2B)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Large Bold Checkmark (Blue Accent) */}
      <path
        d="M 50 45 L 57 53 L 71 37"
        stroke="var(--brand-600, #0E7490)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Olive/Laurel Wreath Sprig */}
      <path d="M 28 66 C 26 50, 34 36, 42 30" stroke="var(--ink, #0B1B2B)" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M 92 66 C 94 50, 86 36, 78 30" stroke="var(--ink, #0B1B2B)" strokeWidth="1.75" strokeLinecap="round" />

      {/* Laurel Leaves */}
      <ellipse cx="30" cy="46" rx="4" ry="2.5" transform="rotate(-30 30 46)" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="1.5" />
      <ellipse cx="32" cy="58" rx="4" ry="2.5" transform="rotate(-15 32 58)" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="1.5" />
      <ellipse cx="90" cy="46" rx="4" ry="2.5" transform="rotate(30 90 46)" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="1.5" />
      <ellipse cx="88" cy="58" rx="4" ry="2.5" transform="rotate(15 88 58)" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="1.5" />

      {/* Delicate Coral Star Accent */}
      <path d="M 60 80 L 61.5 85 L 66 86.5 L 61.5 88 L 60 93 L 58.5 88 L 54 86.5 L 58.5 85 Z" fill="var(--accent-500, #FF5C35)" />
    </svg>
  );
}

/* ── 3. No Connections (Doctor / Caregiver) ─────────────────────────── */
export function EmptyConnectionsIllustration({ className = 'w-32 h-32 mx-auto' }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx('overflow-visible flex-shrink-0 select-none', className)}
      role="img"
      aria-label="No clinical connections illustration"
    >
      <circle cx="60" cy="60" r="48" fill="var(--surface-2, #F1F5F9)" opacity="0.6" />

      {/* Left Profile Node (Doctor/Caregiver with Blue Accent) */}
      <g transform="translate(24, 40)">
        <circle cx="16" cy="12" r="8" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />
        <path d="M 4 34 C 4 25, 9 22, 16 22 C 23 22, 28 25, 28 34" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="12" r="3" fill="var(--brand-600, #0E7490)" />
      </g>

      {/* Right Profile Node (Patient with Coral Accent) */}
      <g transform="translate(64, 40)">
        <circle cx="16" cy="12" r="8" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />
        <path d="M 4 34 C 4 25, 9 22, 16 22 C 23 22, 28 25, 28 34" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="12" r="3" fill="var(--accent-500, #FF5C35)" />
      </g>

      {/* Dotted Bridge Line Linking Them */}
      <path d="M 48 56 Q 60 48 72 56" stroke="var(--ink, #0B1B2B)" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" />

      {/* 6-Digit Keycode PIN Token in Center */}
      <g transform="translate(43, 76)">
        <rect x="0" y="0" width="34" height="18" rx="5" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />
        <circle cx="8" cy="9" r="2" fill="var(--brand-600, #0E7490)" />
        <circle cx="17" cy="9" r="2" fill="var(--ink, #0B1B2B)" />
        <circle cx="26" cy="9" r="2" fill="var(--accent-500, #FF5C35)" />
      </g>
    </svg>
  );
}

/* ── 4. No Symptoms Logged ───────────────────────────────────────────── */
export function EmptySymptomsIllustration({ className = 'w-32 h-32 mx-auto' }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx('overflow-visible flex-shrink-0 select-none', className)}
      role="img"
      aria-label="No symptoms logged illustration"
    >
      <circle cx="60" cy="60" r="48" fill="var(--surface-2, #F1F5F9)" opacity="0.6" />

      {/* Clinical Clipboard */}
      <g transform="translate(34, 22)">
        {/* Clip */}
        <rect x="18" y="0" width="16" height="8" rx="2" fill="var(--surface-2, #F1F5F9)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />
        <circle cx="26" cy="4" r="1.5" fill="var(--ink, #0B1B2B)" />

        {/* Board */}
        <rect x="4" y="6" width="44" height="66" rx="6" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />

        {/* Steady EKG Line (Blue Accent) */}
        <path
          d="M 10 38 H 18 L 22 30 L 26 44 L 30 36 L 33 38 H 42"
          stroke="var(--brand-600, #0E7490)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Checklist Rows with Empty Checkboxes */}
        <rect x="12" y="18" width="6" height="6" rx="1.5" stroke="var(--ink, #0B1B2B)" strokeWidth="1.5" fill="none" />
        <line x1="22" y1="21" x2="40" y2="21" stroke="var(--ink-4, #94A3B8)" strokeWidth="1.5" strokeLinecap="round" />

        <rect x="12" y="52" width="6" height="6" rx="1.5" stroke="var(--ink, #0B1B2B)" strokeWidth="1.5" fill="none" />
        <line x1="22" y1="55" x2="38" y2="55" stroke="var(--ink-4, #94A3B8)" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Gentle Floating Coral Heart Dot */}
      <g transform="translate(80, 72)">
        <path
          d="M 10 3 C 6 0, 0 3, 0 8 C 0 13, 10 19, 10 19 C 10 19, 20 13, 20 8 C 20 3, 14 0, 10 3 Z"
          fill="var(--accent-500, #FF5C35)"
          stroke="var(--ink, #0B1B2B)"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/* ── 5. No Patient Selected (Doctor Rail / Selection) ────────────────── */
export function EmptyPatientsIllustration({ className = 'w-32 h-32 mx-auto' }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx('overflow-visible flex-shrink-0 select-none', className)}
      role="img"
      aria-label="No patient selected illustration"
    >
      <circle cx="60" cy="60" r="48" fill="var(--surface-2, #F1F5F9)" opacity="0.6" />

      {/* Patient Identification Card */}
      <g transform="translate(28, 28)">
        <rect x="0" y="0" width="64" height="48" rx="6" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />
        {/* Lanyard Slot */}
        <rect x="24" y="-3" width="16" height="6" rx="2" fill="var(--surface-2, #F1F5F9)" stroke="var(--ink, #0B1B2B)" strokeWidth="1.5" />

        {/* Avatar Silhouette */}
        <circle cx="18" cy="18" r="6" fill="var(--brand-600, #0E7490)" />
        <path d="M 9 34 C 9 28, 13 26, 18 26 C 23 26, 27 28, 27 34" fill="var(--ink, #0B1B2B)" />

        {/* Card Field Lines */}
        <line x1="34" y1="16" x2="54" y2="16" stroke="var(--ink, #0B1B2B)" strokeWidth="2" strokeLinecap="round" />
        <line x1="34" y1="24" x2="48" y2="24" stroke="var(--ink-4, #94A3B8)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="34" y1="31" x2="52" y2="31" stroke="var(--ink-4, #94A3B8)" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Inspecting Stethoscope Loop (with Coral Chestpiece) */}
      <path d="M 28 84 C 28 100, 48 104, 60 104 C 72 104, 92 100, 92 84" stroke="var(--ink, #0B1B2B)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="92" cy="84" r="6" fill="var(--accent-500, #FF5C35)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />
    </svg>
  );
}

/* ── 6. No Data Yet (Telemetry / Analytics Baseline) ─────────────────── */
export function EmptyDataIllustration({ className = 'w-32 h-32 mx-auto' }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx('overflow-visible flex-shrink-0 select-none', className)}
      role="img"
      aria-label="No data yet illustration"
    >
      <circle cx="60" cy="60" r="48" fill="var(--surface-2, #F1F5F9)" opacity="0.6" />

      {/* Chart Plot Area */}
      <g transform="translate(26, 28)">
        {/* Coordinate Axes */}
        <line x1="10" y1="8" x2="10" y2="58" stroke="var(--ink, #0B1B2B)" strokeWidth="2" strokeLinecap="round" />
        <line x1="10" y1="58" x2="62" y2="58" stroke="var(--ink, #0B1B2B)" strokeWidth="2" strokeLinecap="round" />

        {/* Dotted Grid Guidelines */}
        <line x1="10" y1="24" x2="62" y2="24" stroke="var(--border, #E2E8F0)" strokeWidth="1.5" strokeDasharray="3 3" />
        <line x1="10" y1="41" x2="62" y2="41" stroke="var(--border, #E2E8F0)" strokeWidth="1.5" strokeDasharray="3 3" />

        {/* Baseline Ascending Trend (Blue Accent) */}
        <path
          d="M 12 52 Q 28 42, 40 30 T 58 18"
          stroke="var(--brand-600, #0E7490)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Initial Data Calibration Points */}
        <circle cx="12" cy="52" r="3.5" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />
        <circle cx="40" cy="30" r="3.5" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />
        <circle cx="58" cy="18" r="4" fill="var(--accent-500, #FF5C35)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />
      </g>

      {/* Calibration Dial */}
      <circle cx="86" cy="80" r="9" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />
      <line x1="86" y1="80" x2="90" y2="76" stroke="var(--ink, #0B1B2B)" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

/* ── 7. Search No Results ────────────────────────────────────────────── */
export function EmptySearchIllustration({ className = 'w-32 h-32 mx-auto' }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx('overflow-visible flex-shrink-0 select-none', className)}
      role="img"
      aria-label="Search no results illustration"
    >
      <circle cx="60" cy="60" r="48" fill="var(--surface-2, #F1F5F9)" opacity="0.6" />

      {/* Document / Formulary Page */}
      <g transform="translate(30, 24)">
        <rect x="0" y="0" width="46" height="60" rx="5" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="2" />
        {/* Placeholder Lines */}
        <line x1="10" y1="14" x2="36" y2="14" stroke="var(--border, #E2E8F0)" strokeWidth="2" strokeLinecap="round" />
        <line x1="10" y1="22" x2="30" y2="22" stroke="var(--border, #E2E8F0)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="10" y1="30" x2="34" y2="30" stroke="var(--border, #E2E8F0)" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Prominent Magnifying Glass over Document */}
      <g transform="translate(54, 46)">
        {/* Glass Outer Rim */}
        <circle cx="20" cy="20" r="16" fill="var(--paper, #FFFFFF)" stroke="var(--ink, #0B1B2B)" strokeWidth="2.5" />
        {/* Lens Reflection (Blue Accent Arc) */}
        <path d="M 10 14 C 14 9, 26 9, 30 14" stroke="var(--brand-600, #0E7490)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Question Mark Inside Lens (Coral Accent) */}
        <path
          d="M 17 16 C 17 13.5, 23 13.5, 23 16 C 23 18, 20 19, 20 21"
          stroke="var(--accent-500, #FF5C35)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="20" cy="25" r="1.25" fill="var(--accent-500, #FF5C35)" />
        {/* Handle */}
        <line x1="32" y1="32" x2="48" y2="48" stroke="var(--ink, #0B1B2B)" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* ── Backward Compatible Aliases & Clean Barrel ───────────────────────── */
export const EmptyTimelineIllustration = EmptyDataIllustration;
export const EmptyDoctorsIllustration = EmptyConnectionsIllustration;
export const EmptyCaregiversIllustration = EmptyConnectionsIllustration;
export const EmptyDoctorPatientIllustration = EmptyPatientsIllustration;
export const EmptyDoctorListIllustration = EmptyPatientsIllustration;
export const EmptyScheduleIllustration = EmptySymptomsIllustration;
export const EmptyTrendsIllustration = EmptyDataIllustration;

export default {
  EmptyMedicinesIllustration,
  EmptyFlagsIllustration,
  EmptyConnectionsIllustration,
  EmptySymptomsIllustration,
  EmptyPatientsIllustration,
  EmptyDataIllustration,
  EmptySearchIllustration,
};
