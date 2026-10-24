/**
 * src/motion/index.js
 * PolySafe Motion & Animation Layer Entry Point
 */

// Presets & Constants
export * from './presets';

// Hooks & Reduced Motion Guard
export { useReducedMotion, sanitizeMotion, guard3D } from './useReducedMotion';

// Motion Components
export { default as PageTransition } from './PageTransition';
export { StaggerContainer, StaggerItem } from './Stagger';
export { CountUp } from './CountUp';
export { DrawLine, DrawDivider } from './DrawLine';
export { Reveal } from './Reveal';
export { Magnetic } from './Magnetic';
export { Pressable } from './Pressable';
export { HoverLift } from './HoverLift';
export { Shimmer, ShimmerText } from './Shimmer';
export { SharedActivePill, SharedDrawer } from './SharedLayout';
export { Spotlight } from './Spotlight';
