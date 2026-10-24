/**
 * src/three-d/DepthStack.jsx
 * Multi-Layer Parallax Shift Container for Hero Art
 *
 * Requirements:
 * - Parallax-shifts child layers by pointer or device tilt (max 12px)
 * - Different child layers have depth factors (e.g. 0.2, 0.5, 1.0)
 * - Auto-disabled under reduced motion, touch devices, or when 3D is turned off.
 */

import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { useReducedMotion } from '../motion/useReducedMotion';
import { checkSystem3DSupport } from './use3DEnabled';

const DepthContext = createContext({ x: 0, y: 0, isReduced: false });

/**
 * Child layer inside a DepthStack
 * @param {number} depth - Multiplication factor between 0.1 and 1.0 (default: 0.5)
 */
export function DepthLayer({
  depth = 0.5,
  children,
  className = '',
  style,
  as: Component = 'div',
  ...props
}) {
  const { x, y, isReduced } = useContext(DepthContext);

  const offsetX = isReduced ? 0 : (x * depth).toFixed(2);
  const offsetY = isReduced ? 0 : (y * depth).toFixed(2);

  return (
    <Component
      className={clsx('transition-transform duration-75 will-change-transform', className)}
      style={{
        transform: isReduced ? 'none' : `translate3d(${offsetX}px, ${offsetY}px, 0)`,
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * Parent container that tracks pointer coordinates and distributes offsets to DepthLayers
 */
export function DepthStack({
  maxOffset = 12, // max 12px per prompt
  children,
  className = '',
  style,
  ...props
}) {
  const isReduced = useReducedMotion();
  const containerRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  useEffect(() => {
    if (isReduced || !checkSystem3DSupport()) return;

    const el = containerRef.current;
    if (!el || typeof window === 'undefined') return;

    const isTouch =
      window.matchMedia?.('(pointer: coarse)').matches ||
      window.matchMedia?.('(hover: none)').matches;
    if (isTouch) return;

    function animate() {
      // Lerp smoothing
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.1;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.1;

      setOffset({
        x: currentRef.current.x,
        y: currentRef.current.y,
      });

      const dx = Math.abs(targetRef.current.x - currentRef.current.x);
      const dy = Math.abs(targetRef.current.y - currentRef.current.y);
      if (dx > 0.05 || dy > 0.05) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    const handleMouseMove = (e) => {
      if (document.documentElement.getAttribute('data-3d-enabled') === 'false') return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Normalize -1 to 1
      const normX = (x / rect.width) * 2 - 1;
      const normY = (y / rect.height) * 2 - 1;

      // Clamped to maxOffset
      targetRef.current.x = Math.max(-maxOffset, Math.min(maxOffset, normX * maxOffset));
      targetRef.current.y = Math.max(-maxOffset, Math.min(maxOffset, normY * maxOffset));

      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(animate);
    };

    const handleMouseLeave = () => {
      targetRef.current.x = 0;
      targetRef.current.y = 0;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(animate);
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [maxOffset, isReduced]);

  return (
    <DepthContext.Provider value={{ x: offset.x, y: offset.y, isReduced }}>
      <div
        ref={containerRef}
        className={clsx('relative overflow-hidden', className)}
        style={style}
        {...props}
      >
        {children}
      </div>
    </DepthContext.Provider>
  );
}

export default DepthStack;
