/**
 * src/three-d/useTilt.js
 * Pointer-Driven CSS 3D Tilt Hook
 *
 * Requirements:
 * - useTilt(ref, { max: 6, glare: true, scale: 1.02 })
 * - Pointer-driven rotateX / rotateY with perspective 1000px
 * - Smoothed with a spring interpolation
 * - Glare overlay that follows the pointer
 * - Auto-disabled on touch devices and when reduced motion is set or 3D is disabled.
 */

import { useEffect, useRef, useState } from 'react';
import { checkSystem3DSupport } from './use3DEnabled';

export function useTilt(ref, options = {}) {
  const {
    max = 6, // max tilt rotation (deg)
    glare = true,
    scale = 1.02,
    perspective = 1000,
    speed = 0.12, // spring lerp factor
  } = options;

  const [glareStyle, setGlareStyle] = useState({ opacity: 0 });
  const [isActive, setIsActive] = useState(false);

  const targetRef = useRef({ x: 0, y: 0, scale: 1, glareX: 50, glareY: 50 });
  const currentRef = useRef({ x: 0, y: 0, scale: 1, glareX: 50, glareY: 50 });
  const rafRef = useRef(null);
  const isHoveredRef = useRef(false);

  useEffect(() => {
    const el = ref?.current;
    if (!el || typeof window === 'undefined') return;

    // Check system capabilities & touch
    const isTouch =
      window.matchMedia?.('(pointer: coarse)').matches ||
      window.matchMedia?.('(hover: none)').matches ||
      'ontouchstart' in window;
    const is3DSupported = checkSystem3DSupport();

    if (isTouch || !is3DSupported) {
      el.style.transform = '';
      el.style.perspective = '';
      return;
    }

    el.style.perspective = `${perspective}px`;
    el.style.transformStyle = 'preserve-3d';

    function animate() {
      // Smooth spring lerp
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * speed;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * speed;
      currentRef.current.scale += (targetRef.current.scale - currentRef.current.scale) * speed;
      currentRef.current.glareX += (targetRef.current.glareX - currentRef.current.glareX) * speed;
      currentRef.current.glareY += (targetRef.current.glareY - currentRef.current.glareY) * speed;

      const rotX = currentRef.current.y.toFixed(2);
      const rotY = currentRef.current.x.toFixed(2);
      const s = currentRef.current.scale.toFixed(3);

      el.style.transform = `perspective(${perspective}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(${s}, ${s}, ${s})`;

      if (glare && isHoveredRef.current) {
        setGlareStyle({
          opacity: 1,
          background: `radial-gradient(circle 350px at ${currentRef.current.glareX.toFixed(
            1
          )}% ${currentRef.current.glareY.toFixed(
            1
          )}%, rgba(255, 255, 255, 0.22) 0%, transparent 80%)`,
        });
      }

      // Continue animating until settled
      const dx = Math.abs(targetRef.current.x - currentRef.current.x);
      const dy = Math.abs(targetRef.current.y - currentRef.current.y);
      const ds = Math.abs(targetRef.current.scale - currentRef.current.scale);

      if (dx > 0.02 || dy > 0.02 || ds > 0.001 || isHoveredRef.current) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        if (!isHoveredRef.current) {
          el.style.transform = '';
          setGlareStyle({ opacity: 0 });
          setIsActive(false);
        }
      }
    }

    const handleMouseMove = (e) => {
      // Re-verify 3D allowed
      if (document.documentElement.getAttribute('data-3d-enabled') === 'false') return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Normalize -1 to 1
      const normX = (x / rect.width) * 2 - 1;
      const normY = (y / rect.height) * 2 - 1;

      targetRef.current.x = normX * max;
      targetRef.current.y = -normY * max; // tilt opposite for natural depth
      targetRef.current.scale = scale;
      targetRef.current.glareX = (x / rect.width) * 100;
      targetRef.current.glareY = (y / rect.height) * 100;

      if (!isHoveredRef.current) {
        isHoveredRef.current = true;
        setIsActive(true);
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    const handleMouseEnter = () => {
      if (document.documentElement.getAttribute('data-3d-enabled') === 'false') return;
      isHoveredRef.current = true;
      setIsActive(true);
      targetRef.current.scale = scale;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(animate);
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      targetRef.current.x = 0;
      targetRef.current.y = 0;
      targetRef.current.scale = 1;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(animate);
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      el.style.transform = '';
      el.style.perspective = '';
    };
  }, [ref, max, glare, scale, perspective, speed]);

  return { glareStyle, isActive };
}

export default useTilt;
