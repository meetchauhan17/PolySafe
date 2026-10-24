/**
 * src/three-d/TiltCard.jsx
 * CSS 3D Tilt Card with Parallax Depth Layers
 *
 * Requirements:
 * - Wraps any Card variant with transform-style: preserve-3d
 * - Inner layers sit at translateZ(20px / 40px) for physical parallax depth
 * - Built-in smooth spring pointer tracking and glare reflection
 * - Collapses flat under reduced-motion, touch, or when 3D is disabled.
 */

import React, { useRef } from 'react';
import Card from '../components/Card';
import { useTilt } from './useTilt';

/**
 * Parallax depth layer that sits at translateZ(depth px) in 3D space.
 */
export function TiltCardLayer({
  depth = 20, // 20px, 40px, or custom number
  children,
  className = '',
  as: Component = 'div',
  style,
  ...props
}) {
  return (
    <Component
      className={`transition-transform duration-100 ${className}`}
      style={{
        transform: `translateZ(${depth}px)`,
        transformStyle: 'preserve-3d',
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * 3D Tilt Card container
 */
export function TiltCard({
  children,
  className = '',
  max = 6,
  glare = true,
  glareOpacity = 0.1,
  scale = 1.02,
  variant = 'raised',
  size = 'md',
  ...props
}) {
  const cardRef = useRef(null);
  const { glareStyle, isActive } = useTilt(cardRef, { max, glare, scale });

  return (
    <div
      ref={cardRef}
      className={`relative preserve-3d will-change-transform ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <Card
        variant={variant}
        size={size}
        className="w-full h-full relative overflow-hidden preserve-3d"
        style={{ transformStyle: 'preserve-3d' }}
        {...props}
      >
        {children}

        {/* Glare overlay */}
        {glare && (
          <div
            className="absolute inset-0 pointer-events-none rounded-[inherit] transition-opacity duration-200 z-30"
            style={{
              ...glareStyle,
              mixBlendMode: 'overlay',
            }}
            aria-hidden="true"
          />
        )}
      </Card>
    </div>
  );
}

export default TiltCard;
