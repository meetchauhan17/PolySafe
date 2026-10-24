/**
 * frontend/src/components/ServerWakeSplash.jsx
 *
 * PolySafe Cloud Cold-Start Wake Splash
 * ─────────────────────────────────────────────────────────────────────────────
 * Features:
 * • Editorial line-art illustration with a gentle pill-rolling animation
 * • 2px strokes in var(--ink), flat ivory card, blue & coral capsule accents
 * • Smooth CSS rotation & translation physics for the rolling capsule
 * • Progress indicator checking /health with stage-ready guest demo bypass
 */

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Sparkles, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function ServerWakeSplash() {
  const { isGuest, enterGuestMode } = useAuth() || {};
  const [isWaking, setIsWaking] = useState(false);
  const [isAwake, setIsAwake] = useState(false);
  const timerRef = useRef(null);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;

    // Start 4-second cold-start threshold timer
    timerRef.current = setTimeout(() => {
      if (activeRef.current && !isAwake && !isGuest) {
        setIsWaking(true);
      }
    }, 4000);

    // Initial ping
    let backoffMs = 2500;
    const pingServer = async () => {
      try {
        const resp = await axios.get('/health', {
          timeout: 6000,
          _silent: true,
        });

        if (resp.data?.status === 'ok') {
          if (activeRef.current) {
            setIsAwake(true);
            if (timerRef.current) clearTimeout(timerRef.current);
            if (isWaking) {
              setTimeout(() => {
                if (activeRef.current) setIsWaking(false);
              }, 700);
            }
          }
          return;
        }
      } catch (_err) {
        if (activeRef.current && !isAwake) {
          backoffMs = Math.min(backoffMs * 1.5, 12000);
          setTimeout(pingServer, backoffMs);
        }
      }
    };

    pingServer();

    return () => {
      activeRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAwake, isGuest]);

  const handleSwitchToGuest = () => {
    enterGuestMode?.();
    setIsWaking(false);
    window.location.href = '/home';
  };

  return (
    <AnimatePresence>
      {isWaking && !isGuest && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-[var(--ink)]/60 backdrop-blur-md flex items-center justify-center p-4 select-none font-sans"
        >
          <motion.div
            initial={{ scale: 0.95, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 12 }}
            className="bg-[var(--surface, #FAF8F5)] border border-[var(--border, #E2E8F0)] max-w-md w-full p-6 sm:p-8 rounded-[32px] shadow-2xl text-center space-y-6 relative overflow-hidden"
            style={{
              boxShadow: '0 20px 48px rgba(11,27,43,0.18), 0 4px 12px rgba(11,27,43,0.08)',
            }}
          >
            {/* ── Gentle Pill-Rolling Animation ── */}
            <div className="w-full h-24 relative flex items-center justify-center overflow-hidden">
              {/* Rolling Track / Horizon Line */}
              <div className="absolute bottom-5 inset-x-8 h-[2px] bg-[var(--border, #E2E8F0)] rounded-full" />

              {/* Rolling Pill Assembly */}
              <div className="relative w-48 h-16 flex items-center justify-center">
                <div className="pill-roll-track w-full h-full relative">
                  {/* The Rolling Dual-Tone Capsule */}
                  <div className="pill-roll-capsule absolute bottom-4">
                    <svg width="44" height="24" viewBox="0 0 44 24" fill="none">
                      {/* Left Half: Blue Accent */}
                      <path
                        d="M 12 2 C 6.477 2 2 6.477 2 12 C 2 17.523 6.477 22 12 22 L 22 22 L 22 2 Z"
                        fill="var(--brand-600, #0E7490)"
                        stroke="var(--ink, #0B1B2B)"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      {/* Specular Gleam */}
                      <path
                        d="M 6 8 C 8 5 13 5 15 8"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeOpacity={0.8}
                      />
                      {/* Right Half: Coral Accent */}
                      <path
                        d="M 22 2 L 32 2 C 37.523 2 42 6.477 42 12 C 42 17.523 37.523 22 32 22 L 22 22 Z"
                        fill="var(--accent-500, #FF5C35)"
                        stroke="var(--ink, #0B1B2B)"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      {/* Center Seam */}
                      <line
                        x1="22"
                        y1="2"
                        x2="22"
                        y2="22"
                        stroke="var(--ink, #0B1B2B)"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>

                  {/* Soft Track Drop Shadow that follows capsule */}
                  <div className="pill-roll-shadow absolute bottom-2 w-8 h-1.5 bg-[var(--ink)]/15 rounded-full blur-[1px]" />
                </div>
              </div>

              <style>{`
                @keyframes pillRollX {
                  0%, 100% {
                    transform: translateX(0px);
                  }
                  50% {
                    transform: translateX(110px);
                  }
                }
                @keyframes pillRotate {
                  0% {
                    transform: rotate(0deg);
                  }
                  50% {
                    transform: rotate(360deg);
                  }
                  100% {
                    transform: rotate(0deg);
                  }
                }
                @keyframes shadowFollow {
                  0%, 100% {
                    transform: translateX(6px) scaleX(1);
                  }
                  50% {
                    transform: translateX(116px) scaleX(1.1);
                  }
                }
                .pill-roll-capsule {
                  animation: pillRollX 3.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite,
                             pillRotate 3.2s linear infinite;
                  transform-origin: 22px 12px;
                }
                .pill-roll-shadow {
                  animation: shadowFollow 3.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
                }
              `}</style>
            </div>

            {/* Content Header */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-[var(--surface-2)] text-[var(--brand-600)] border border-[var(--border)]">
                {isAwake ? 'Connected' : 'Waking Cloud Instance'}
              </span>
              <h3 className="text-2xl font-extrabold text-[var(--ink)] font-[var(--font-heading)]">
                {isAwake ? 'Server Online' : 'Waking the server, about 20 seconds'}
              </h3>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed max-w-sm mx-auto">
                {isAwake
                  ? 'All pharmacological services and database engines are responsive.'
                  : 'Free-tier cloud servers sleep during inactivity. PolySafe is spinning up the clinical API engine.'}
              </p>
            </div>

            {/* Progress Bar & Telemetry Status */}
            {!isAwake && (
              <div className="space-y-2">
                <div className="w-full bg-[var(--surface-2)] h-2 rounded-full overflow-hidden border border-[var(--border)]">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      background: 'linear-gradient(90deg, var(--brand-600, #0E7490) 0%, var(--accent-500, #FF5C35) 100%)',
                      animation: 'wakeProgress 18s ease-out forwards',
                    }}
                  />
                </div>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--ink-3)] font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--brand-600)]" />
                  <span>Checking /health status ping…</span>
                </div>
                <style>{`
                  @keyframes wakeProgress {
                    0% { width: 5%; }
                    30% { width: 45%; }
                    70% { width: 75%; }
                    100% { width: 92%; }
                  }
                `}</style>
              </div>
            )}

            {/* Guest Demo Bypass */}
            <div className="pt-3 border-t border-[var(--border)]">
              <p className="text-[11px] text-[var(--ink-3)] mb-3">
                Need to present immediately on stage?
              </p>
              <button
                type="button"
                onClick={handleSwitchToGuest}
                className="ps-btn ps-btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md rounded-2xl"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>Switch to Instant Guest Demo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
