import React from 'react';

/**
 * EmptyIllustrations.jsx
 *
 * Hand-crafted, cohesive line-art SVG illustrations for PolySafe empty states.
 * Brand palette: Deep Teal (#2B6E5E), Warm Terracotta (#E0824B), Warm Parchment/Sand (#EDE9DF, #F5EFE6), Charcoal (#232724).
 * Style: 1.75px-2px stroke, round caps/joins, subtle translucent fills, unified visual language.
 */

export function EmptyMedicinesIllustration({ className = 'w-36 h-36 mx-auto' }) {
 return (
 <svg
 viewBox="0 0 160 160"
 fill="none"
 xmlns="http://www.w3.org/2000/svg"
 className={className}
 aria-hidden="true"
 >
 {/* Soft Ambient Background Circle */}
 <circle cx="80" cy="80" r="64" fill="#E4F2E9" fillOpacity="0.5" />
 <circle cx="80" cy="80" r="54" stroke="#2B6E5E" strokeOpacity="0.15" strokeWidth="1.5" strokeDasharray="3 3" />

 {/* Pill Bottle */}
 <g transform="translate(42, 38)">
 {/* Bottle Cap */}
 <rect x="18" y="4" width="28" height="10" rx="3" fill="#EDE9DF" stroke="#2B6E5E" strokeWidth="2" strokeLinejoin="round" />
 <line x1="24" y1="4" x2="24" y2="14" stroke="#2B6E5E" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
 <line x1="32" y1="4" x2="32" y2="14" stroke="#2B6E5E" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
 <line x1="40" y1="4" x2="40" y2="14" stroke="#2B6E5E" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />

 {/* Bottle Neck */}
 <rect x="22" y="14" width="20" height="4" fill="#FFFFFF" stroke="#2B6E5E" strokeWidth="2" strokeLinejoin="round" />

 {/* Bottle Body */}
 <rect x="10" y="18" width="44" height="64" rx="8" fill="#FFFFFF" stroke="#2B6E5E" strokeWidth="2" strokeLinejoin="round" />
 {/* Bottle Label Area */}
 <rect x="14" y="28" width="36" height="38" rx="4" fill="#FBF8F2" stroke="#E7E1D3" strokeWidth="1.5" />
 {/* Rx Symbol */}
 <path d="M22 36H28C30.2 36 32 37.8 32 40C32 42.2 30.2 44 28 44H22V36ZM22 44L32 54M28 47L34 43" stroke="#2B6E5E" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
 {/* Dosage lines */}
 <line x1="22" y1="58" x2="42" y2="58" stroke="#6B726C" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
 </g>

 {/* Floating Capsule 1 (Left Tilt) */}
 <g transform="translate(94, 76) rotate(35)">
 <rect x="0" y="0" width="16" height="32" rx="8" fill="#FFFFFF" stroke="#E0824B" strokeWidth="2" strokeLinejoin="round" />
 <path d="M0 8C0 3.58 3.58 0 8 0C12.42 0 16 3.58 16 8V16H0V8Z" fill="#E0824B" fillOpacity="0.2" stroke="#E0824B" strokeWidth="2" strokeLinejoin="round" />
 <line x1="0" y1="16" x2="16" y2="16" stroke="#E0824B" strokeWidth="2" />
 </g>

 {/* Floating Capsule 2 (Bottom Round Tablet) */}
 <circle cx="36" cy="116" r="10" fill="#FFFFFF" stroke="#2B6E5E" strokeWidth="2" />
 <line x1="29" y1="116" x2="43" y2="116" stroke="#2B6E5E" strokeWidth="1.5" strokeLinecap="round" />

 {/* Delicate Herbal Leaf Branch */}
 <path d="M112 44C118 42 126 46 128 54C120 56 114 52 112 44Z" fill="#2B6E5E" fillOpacity="0.15" stroke="#2B6E5E" strokeWidth="1.75" strokeLinejoin="round" />
 <path d="M128 54C134 56 138 64 136 72C128 72 124 66 128 54Z" fill="#2B6E5E" fillOpacity="0.15" stroke="#2B6E5E" strokeWidth="1.75" strokeLinejoin="round" />
 <path d="M112 44C118 56 124 68 132 80" stroke="#2B6E5E" strokeWidth="1.75" strokeLinecap="round" />

 {/* Sparkles */}
 <path d="M34 46L36 40L38 46L44 48L38 50L36 56L34 50L28 48L34 46Z" fill="#E0824B" fillOpacity="0.4" />
 <path d="M128 104L129.5 99.5L134 98L129.5 96.5L128 92L126.5 96.5L122 98L126.5 99.5L128 104Z" fill="#2B6E5E" fillOpacity="0.4" />
 </svg>
 );
}

export function EmptyTimelineIllustration({ className = 'w-36 h-36 mx-auto' }) {
 return (
 <svg
 viewBox="0 0 160 160"
 fill="none"
 xmlns="http://www.w3.org/2000/svg"
 className={className}
 aria-hidden="true"
 >
 {/* Ambient background circle */}
 <circle cx="80" cy="80" r="64" fill="#FBEED9" fillOpacity="0.4" />

 {/* The Central Continuous Timeline Cord (#E0824B) */}
 <line x1="50" y1="20" x2="50" y2="140" stroke="#E0824B" strokeWidth="2.5" strokeDasharray="4 4" strokeLinecap="round" />

 {/* Node 1: Top Prescription Node */}
 <circle cx="50" cy="42" r="9" fill="#FFFFFF" stroke="#2B6E5E" strokeWidth="2.5" />
 <circle cx="50" cy="42" r="3.5" fill="#2B6E5E" />
 <g transform="translate(68, 28)">
 <rect x="0" y="0" width="62" height="28" rx="6" fill="#FFFFFF" stroke="#E7E1D3" strokeWidth="1.5" />
 <line x1="8" y1="10" x2="38" y2="10" stroke="#2B6E5E" strokeWidth="2" strokeLinecap="round" />
 <line x1="8" y1="18" x2="52" y2="18" stroke="#6B726C" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
 </g>

 {/* Node 2: Middle Flag / Warning Node */}
 <circle cx="50" cy="82" r="9" fill="#FFFFFF" stroke="#E0824B" strokeWidth="2.5" />
 <path d="M50 78V83M50 86V87" stroke="#E0824B" strokeWidth="2" strokeLinecap="round" />
 <g transform="translate(68, 68)">
 <rect x="0" y="0" width="56" height="28" rx="6" fill="#FFFFFF" stroke="#E0824B" strokeWidth="1.5" strokeOpacity="0.4" />
 <line x1="8" y1="10" x2="32" y2="10" stroke="#E0824B" strokeWidth="2" strokeLinecap="round" />
 <line x1="8" y1="18" x2="46" y2="18" stroke="#6B726C" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
 </g>

 {/* Node 3: Bottom Safe Node */}
 <circle cx="50" cy="122" r="9" fill="#FFFFFF" stroke="#2F8558" strokeWidth="2.5" />
 <path d="M47 122L49.5 124.5L53.5 119.5" stroke="#2F8558" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
 <g transform="translate(68, 108)">
 <rect x="0" y="0" width="58" height="28" rx="6" fill="#FFFFFF" stroke="#E7E1D3" strokeWidth="1.5" />
 <line x1="8" y1="10" x2="34" y2="10" stroke="#2B6E5E" strokeWidth="2" strokeLinecap="round" />
 <line x1="8" y1="18" x2="48" y2="18" stroke="#6B726C" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
 </g>

 {/* Clock Icon Accent */}
 <circle cx="26" cy="42" r="10" fill="#FFFFFF" stroke="#E0824B" strokeWidth="1.75" />
 <path d="M26 38V42L28.5 44.5" stroke="#E0824B" strokeWidth="1.5" strokeLinecap="round" />
 </svg>
 );
}

export function EmptyDoctorsIllustration({ className = 'w-36 h-36 mx-auto' }) {
 return (
 <svg
 viewBox="0 0 160 160"
 fill="none"
 xmlns="http://www.w3.org/2000/svg"
 className={className}
 aria-hidden="true"
 >
 {/* Background circle */}
 <circle cx="80" cy="80" r="64" fill="#E4F2E9" fillOpacity="0.5" />

 {/* Stethoscope Arch */}
 <path
 d="M52 44V70C52 85.464 64.536 98 80 98C95.464 98 108 85.464 108 70V44"
 stroke="#1B4B66"
 strokeWidth="2.5"
 strokeLinecap="round"
 />
 {/* Earpieces */}
 <circle cx="48" cy="42" r="4.5" fill="#1B4B66" />
 <circle cx="112" cy="42" r="4.5" fill="#1B4B66" />
 <path d="M48 42H56" stroke="#1B4B66" strokeWidth="2" strokeLinecap="round" />
 <path d="M104 42H112" stroke="#1B4B66" strokeWidth="2" strokeLinecap="round" />

 {/* Stem & Chestpiece */}
 <path d="M80 98V114" stroke="#1B4B66" strokeWidth="2.5" strokeLinecap="round" />
 <circle cx="80" cy="122" r="10" fill="#FFFFFF" stroke="#1B4B66" strokeWidth="2.5" />
 <circle cx="80" cy="122" r="4" fill="#2B6E5E" />

 {/* Medical Cross Shield inside */}
 <g transform="translate(62, 50)">
 <path
 d="M18 4L4 9V20C4 28 10 34 18 37C26 34 32 28 32 20V9L18 4Z"
 fill="#FFFFFF"
 stroke="#2B6E5E"
 strokeWidth="2"
 strokeLinejoin="round"
 />
 {/* Cross */}
 <path d="M18 13V27M11 20H25" stroke="#2B6E5E" strokeWidth="2" strokeLinecap="round" />
 </g>

 {/* QR Code link accent */}
 <g transform="translate(112, 102)">
 <rect x="0" y="0" width="22" height="22" rx="4" fill="#FFFFFF" stroke="#2B6E5E" strokeWidth="1.5" />
 <rect x="3" y="3" width="5" height="5" fill="#2B6E5E" />
 <rect x="14" y="3" width="5" height="5" fill="#2B6E5E" />
 <rect x="3" y="14" width="5" height="5" fill="#2B6E5E" />
 <rect x="14" y="14" width="4" height="4" fill="#E0824B" />
 </g>
 </svg>
 );
}

export function EmptyCaregiversIllustration({ className = 'w-36 h-36 mx-auto' }) {
 return (
 <svg
 viewBox="0 0 160 160"
 fill="none"
 xmlns="http://www.w3.org/2000/svg"
 className={className}
 aria-hidden="true"
 >
 {/* Ambient background */}
 <circle cx="80" cy="80" r="64" fill="#FBEED9" fillOpacity="0.45" />

 {/* Two caring hands cradling a heart */}
 {/* Left Hand */}
 <path
 d="M32 108C36 94 48 88 58 88C64 88 70 91 76 96L80 100L72 108C64 114 52 118 40 114L32 108Z"
 fill="#FFFFFF"
 stroke="#8A6D3B"
 strokeWidth="2"
 strokeLinejoin="round"
 />
 {/* Right Hand */}
 <path
 d="M128 108C124 94 112 88 102 88C96 88 90 91 84 96L80 100L88 108C96 114 108 118 120 114L128 108Z"
 fill="#FFFFFF"
 stroke="#8A6D3B"
 strokeWidth="2"
 strokeLinejoin="round"
 />

 {/* Floating Center Heart */}
 <path
 d="M80 44C73.373 34 58 36 54 48C50 60 64 72 80 84C96 72 110 60 106 48C102 36 86.627 34 80 44Z"
 fill="#FFFFFF"
 stroke="#2B6E5E"
 strokeWidth="2.5"
 strokeLinejoin="round"
 />
 {/* Heart Inner Shield Icon */}
 <path
 d="M80 54L72 58V65C72 70 75 74 80 76C85 74 88 70 88 65V58L80 54Z"
 fill="#E4F2E9"
 stroke="#2B6E5E"
 strokeWidth="1.5"
 strokeLinejoin="round"
 />

 {/* Protective Sparkles */}
 <path d="M42 46L44 40L46 46L52 48L46 50L44 56L42 50L36 48L42 46Z" fill="#E0824B" fillOpacity="0.45" />
 <path d="M116 42L117.5 37.5L122 36L117.5 34.5L116 30L114.5 34.5L110 36L114.5 37.5L116 42Z" fill="#8A6D3B" fillOpacity="0.45" />
 </svg>
 );
}

export function EmptyDoctorPatientIllustration({ className = 'w-36 h-36 mx-auto' }) {
 return (
 <svg
 viewBox="0 0 160 160"
 fill="none"
 xmlns="http://www.w3.org/2000/svg"
 className={className}
 aria-hidden="true"
 >
 {/* Ambient background */}
 <circle cx="80" cy="80" r="64" fill="#E4F2E9" fillOpacity="0.4" />

 {/* Clinical Clipboard */}
 <g transform="translate(42, 28)">
 {/* Clip top */}
 <rect x="26" y="0" width="24" height="10" rx="3" fill="#EDE9DF" stroke="#1B4B66" strokeWidth="2" strokeLinejoin="round" />
 <circle cx="38" cy="5" r="2" fill="#1B4B66" />

 {/* Board Body */}
 <rect x="4" y="6" width="68" height="96" rx="8" fill="#FFFFFF" stroke="#1B4B66" strokeWidth="2" strokeLinejoin="round" />

 {/* Medical Chart Lines */}
 <line x1="16" y1="24" x2="48" y2="24" stroke="#2B6E5E" strokeWidth="2.5" strokeLinecap="round" />
 <line x1="16" y1="34" x2="60" y2="34" stroke="#6B726C" strokeWidth="1.75" strokeLinecap="round" opacity="0.4" />
 <line x1="16" y1="42" x2="52" y2="42" stroke="#6B726C" strokeWidth="1.75" strokeLinecap="round" opacity="0.4" />

 {/* Heartbeat EKG Pulse Wave */}
 <path
 d="M16 60H26L30 52L36 68L42 56L46 62L50 60H60"
 stroke="#E0824B"
 strokeWidth="2"
 strokeLinecap="round"
 strokeLinejoin="round"
 />

 {/* Prescription safety check marks */}
 <line x1="16" y1="76" x2="38" y2="76" stroke="#6B726C" strokeWidth="1.75" strokeLinecap="round" opacity="0.4" />
 <line x1="16" y1="84" x2="48" y2="84" stroke="#6B726C" strokeWidth="1.75" strokeLinecap="round" opacity="0.4" />
 </g>

 {/* Looping Stethoscope in front */}
 <path
 d="M28 88C28 112 44 126 70 126C96 126 112 112 112 90"
 stroke="#2B6E5E"
 strokeWidth="2.5"
 strokeLinecap="round"
 />
 <circle cx="112" cy="88" r="8" fill="#FFFFFF" stroke="#2B6E5E" strokeWidth="2" />
 <circle cx="112" cy="88" r="3.5" fill="#2B6E5E" />
 </svg>
 );
}

export function EmptyDoctorListIllustration({ className = 'w-24 h-24 mx-auto' }) {
 return (
 <svg
 viewBox="0 0 120 120"
 fill="none"
 xmlns="http://www.w3.org/2000/svg"
 className={className}
 aria-hidden="true"
 >
 <circle cx="60" cy="60" r="48" fill="#FBF8F2" stroke="#E7E1D3" strokeWidth="1.5" strokeDasharray="3 3" />
 {/* Patient Avatar Silhouette with Shield */}
 <circle cx="60" cy="46" r="12" fill="#FFFFFF" stroke="#2B6E5E" strokeWidth="2" />
 <path
 d="M40 78C40 68 49 64 60 64C71 64 80 68 80 78"
 stroke="#2B6E5E"
 strokeWidth="2"
 strokeLinecap="round"
 />
 {/* Keycode Badge */}
 <g transform="translate(42, 82)">
 <rect x="0" y="0" width="36" height="16" rx="4" fill="#FFFFFF" stroke="#E0824B" strokeWidth="1.5" />
 <circle cx="9" cy="8" r="1.5" fill="#E0824B" />
 <circle cx="15" cy="8" r="1.5" fill="#E0824B" />
 <circle cx="21" cy="8" r="1.5" fill="#E0824B" />
 <circle cx="27" cy="8" r="1.5" fill="#E0824B" />
 </g>
 </svg>
 );
}

export function EmptyScheduleIllustration({ className = 'w-32 h-32 mx-auto' }) {
 return (
 <svg
 viewBox="0 0 140 140"
 fill="none"
 xmlns="http://www.w3.org/2000/svg"
 className={className}
 aria-hidden="true"
 >
 <circle cx="70" cy="70" r="54" fill="#FDFBF7" stroke="#E7E1D3" strokeWidth="1.5" />
 {/* Clock Face */}
 <circle cx="70" cy="66" r="32" fill="#FFFFFF" stroke="#2B6E5E" strokeWidth="2" />
 <path d="M70 46V66L82 74" stroke="#2B6E5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
 <circle cx="70" cy="66" r="3" fill="#2B6E5E" />

 {/* Sunrise Horizon Arc */}
 <path d="M40 106C52 98 88 98 100 106" stroke="#E0824B" strokeWidth="2" strokeLinecap="round" />
 <path d="M70 94V88M54 98L50 94M86 98L90 94" stroke="#E0824B" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
 </svg>
 );
}

export function EmptyTrendsIllustration({ className = 'w-36 h-36 mx-auto' }) {
 return (
 <svg
 viewBox="0 0 160 160"
 fill="none"
 xmlns="http://www.w3.org/2000/svg"
 className={className}
 aria-hidden="true"
 >
 {/* Ambient background circle */}
 <circle cx="80" cy="80" r="64" fill="#E4F2E9" fillOpacity="0.45" />

 {/* Graph Grid Frame */}
 <g transform="translate(30, 32)">
 {/* Y Axis & X Axis */}
 <line x1="16" y1="12" x2="16" y2="88" stroke="#2B6E5E" strokeWidth="2" strokeLinecap="round" />
 <line x1="16" y1="88" x2="94" y2="88" stroke="#2B6E5E" strokeWidth="2" strokeLinecap="round" />

 {/* Dotted Grid Guidelines */}
 <line x1="16" y1="36" x2="94" y2="36" stroke="#2B6E5E" strokeWidth="1.25" strokeDasharray="3 3" strokeOpacity="0.25" />
 <line x1="16" y1="62" x2="94" y2="62" stroke="#2B6E5E" strokeWidth="1.25" strokeDasharray="3 3" strokeOpacity="0.25" />

 {/* Trend Area Wave / Line */}
 <path
 d="M20 78 Q 38 64 54 48 T 88 34"
 fill="none"
 stroke="#E0824B"
 strokeWidth="2.5"
 strokeLinecap="round"
 />

 {/* Shaded Area Under Curve */}
 <path
 d="M20 78 Q 38 64 54 48 T 88 34 V 88 H 20 Z"
 fill="#E0824B"
 fillOpacity="0.1"
 />

 {/* Data Point Nodes */}
 <circle cx="20" cy="78" r="4.5" fill="#FFFFFF" stroke="#E0824B" strokeWidth="2" />
 <circle cx="54" cy="48" r="4.5" fill="#FFFFFF" stroke="#E0824B" strokeWidth="2" />
 <circle cx="88" cy="34" r="5" fill="#FFFFFF" stroke="#2B6E5E" strokeWidth="2.5" />
 <circle cx="88" cy="34" r="2" fill="#2B6E5E" />
 </g>

 {/* Magnifying Glass Lens */}
 <g transform="translate(94, 86)">
 <circle cx="16" cy="16" r="14" fill="#FFFFFF" stroke="#2B6E5E" strokeWidth="2" />
 <path d="M16 8V16L22 20" stroke="#2B6E5E" strokeWidth="1.5" strokeLinecap="round" />
 <line x1="26" y1="26" x2="38" y2="38" stroke="#2B6E5E" strokeWidth="2.5" strokeLinecap="round" />
 </g>

 {/* Sparkles */}
 <path d="M42 26L43.5 21.5L48 20L43.5 18.5L42 14L40.5 18.5L36 20L40.5 21.5L42 26Z" fill="#E0824B" fillOpacity="0.5" />
 </svg>
 );
}
