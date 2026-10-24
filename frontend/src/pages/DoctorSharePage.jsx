/**
 * DoctorSharePage.jsx — Clinical & Caregiver Connection Share Portal
 * ─────────────────────────────────────────────────────────────────────────────
 * Routes: /share, /doctor-share, /share-with-doctor
 *
 * Requirements Met:
 * • 6-digit code as six oversized segmented tiles with a subtle 3D press look.
 * • QR in a authentic `paper` card with a folded corner.
 * • Circular SVG expiry countdown that drains smoothly.
 * • Live 3-step status (Generated, Claimed, Approved) with check animations
 *   driven by real-time socket events and resilient query polling.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { io as socketIO } from 'socket.io-client';
import {
  QrCode,
  Copy,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Stethoscope,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Info,
  Users,
  Lock,
  ArrowRight,
  Shield,
  Sparkles,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

import Card from '../components/Card';
import BackButton from '../components/BackButton';
import { notify } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

// ─── API helpers ──────────────────────────────────────────────────────────────
async function generateCode() {
  const { data } = await axios.post('/connection/generate-code', { role: 'DOCTOR' });
  return data;
}
async function fetchPending() {
  const { data } = await axios.get('/connection/pending');
  return data;
}
async function approveConnection(id) {
  const { data } = await axios.post(`/connection/${id}/approve`);
  return data;
}
async function revokeConnection(id) {
  const { data } = await axios.post(`/connection/${id}/revoke`);
  return data;
}

// ─── Circular Expiry Countdown (Smooth SVG Progress Ring) ─────────────────────
function CircularExpiryRing({ expiresAt, totalDurationMinutes = 15 }) {
  const [timeLeftMs, setTimeLeftMs] = useState(() => {
    if (!expiresAt) return 15 * 60 * 1000;
    return Math.max(0, new Date(expiresAt).getTime() - Date.now());
  });

  const totalMs = totalDurationMinutes * 60 * 1000;

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now());
      setTimeLeftMs(diff);
      if (diff <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const progressFraction = Math.min(1, Math.max(0, timeLeftMs / totalMs));
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressFraction);

  const minutes = Math.floor(timeLeftMs / 60000);
  const seconds = Math.floor((timeLeftMs % 60000) / 1000);
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  const isExpiringSoon = minutes < 3;

  return (
    <div className="flex items-center gap-3 bg-[var(--canvas)] px-3.5 py-2 rounded-2xl border border-[var(--border)] shadow-xs">
      <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
        <svg className="w-10 h-10 -rotate-90 transform" viewBox="0 0 48 48">
          {/* Background Track */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth="3.5"
          />
          {/* Draining Progress Ring */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke={isExpiringSoon ? '#EF4444' : 'var(--brand-600)'}
            strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <Clock className={`w-4 h-4 absolute ${isExpiringSoon ? 'text-rose-500 animate-pulse' : 'text-[var(--brand-600)]'}`} />
      </div>

      <div className="font-mono text-left">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black text-[var(--ink)]">{timeFormatted}</span>
          <span className="text-[10px] font-bold text-[var(--ink-3)] uppercase">Remaining</span>
        </div>
        <p className="text-[10px] text-[var(--ink-3)] leading-none mt-0.5">
          15-min single-use PIN
        </p>
      </div>
    </div>
  );
}

// ─── 3-Step Connection Lifecycle Stepper ───
function ConnectionStatusStepper({ currentStep, doctorLabel }) {
  const steps = [
    { id: 1, label: 'Generated', desc: 'Secure PIN issued' },
    { id: 2, label: 'Claimed', desc: doctorLabel ? `Claimed by ${doctorLabel}` : 'Waiting for doctor' },
    { id: 3, label: 'Approved', desc: 'Read-only access granted' },
  ];

  return (
    <div className="p-4 rounded-3xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
      <div className="flex items-center justify-between text-xs font-mono font-bold text-[var(--ink-3)] uppercase tracking-wider px-1">
        <span>Connection Telemetry</span>
        <span className="text-[var(--doctor-600)] font-black">
          Step {currentStep} of 3
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {steps.map((step) => {
          const isDone = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div
              key={step.id}
              className={`p-3 rounded-2xl border transition-all text-center space-y-1 ${
                isDone
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
                  : isCurrent
                  ? 'bg-[var(--surface)] border-[var(--doctor-600)] ring-2 ring-[var(--doctor-600)]/20 shadow-xs'
                  : 'bg-[var(--canvas)] border-[var(--border)] opacity-60'
              }`}
            >
              <div className="flex items-center justify-center">
                {isDone ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </motion.div>
                ) : isCurrent ? (
                  <div className="w-6 h-6 rounded-full bg-[var(--doctor-600)] text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs animate-pulse">
                    {step.id}
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[var(--canvas-2)] text-[var(--ink-3)] font-mono font-bold text-xs flex items-center justify-center">
                    {step.id}
                  </div>
                )}
              </div>

              <p className="text-xs font-bold text-[var(--ink)] font-[var(--font-heading)] truncate">
                {step.label}
              </p>
              <p className="text-[10px] text-[var(--ink-3)] font-mono truncate leading-tight">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main DoctorSharePage Component ───────────────────────────────────────────
export default function DoctorSharePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const shouldReduceMotion = useReducedMotion();
  const { user, isGuest, requireAuth } = useAuth();

  const [codeData, setCodeData] = useState(
    isGuest
      ? {
          shareCode: '849210',
          expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
          qrCode:
            'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://polysafe.health/doctor?code=849210',
        }
      : null
  );

  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [approvedSuccess, setApprovedSuccess] = useState(false);
  const hasGeneratedRef = useRef(false);

  // ── 1. Code Generation ──
  const handleGenerate = useCallback(async () => {
    if (isGuest) {
      requireAuth('generate new clinical share codes');
      return;
    }
    setGenerating(true);
    setGenError('');
    setApprovedSuccess(false);
    try {
      const result = await generateCode();
      setCodeData(result);
      queryClient.invalidateQueries({ queryKey: ['pending-connections'] });
      notify.success('Security Code Ready', 'Share this 6-digit PIN or QR with your physician.');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to generate code.';
      setGenError(msg);
      notify.error('Generation Failed', msg);
    } finally {
      setGenerating(false);
    }
  }, [isGuest, requireAuth, queryClient]);

  // Auto-generate on mount if authenticated and no code exists
  useEffect(() => {
    if (!isGuest && !hasGeneratedRef.current) {
      hasGeneratedRef.current = true;
      handleGenerate();
    }
  }, [isGuest, handleGenerate]);

  // ── 2. Real-Time Socket Connection & Polling ──
  const { data: pendingData } = useQuery({
    queryKey: ['pending-connections'],
    queryFn: fetchPending,
    refetchInterval: codeData ? 2000 : false,
    enabled: !!codeData && !isGuest,
  });

  const pending = pendingData?.pending || [];

  useEffect(() => {
    if (!user || isGuest) return;
    const socketUrl = axios.defaults.baseURL
      ? axios.defaults.baseURL.replace(/\/api$/, '')
      : window.location.hostname === 'localhost'
      ? 'http://localhost:5000'
      : window.location.origin;

    const socket = socketIO(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      socket.emit('join-patient-room', {
        userId: user.userId || user.id,
        patientId: user.patientId || user.id,
      });
    });

    socket.on('connection_claimed', (payload) => {
      console.log('[DoctorShare] Doctor claimed code:', payload);
      queryClient.invalidateQueries({ queryKey: ['pending-connections'] });
      notify.info('Doctor Connected', `${payload?.doctorName || 'A physician'} claimed your access code.`);
    });

    socket.on('connection_approved', (payload) => {
      console.log('[DoctorShare] Connection approved:', payload);
      setApprovedSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['pending-connections'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, isGuest, queryClient]);

  // ── 3. Step Computation ──
  const activeClaim = pending[0] || null;
  const currentStep = approvedSuccess ? 3 : activeClaim ? 2 : 1;

  // ── 4. Approve / Revoke Mutations ──
  const approveMut = useMutation({
    mutationFn: (id) => approveConnection(id),
    onSuccess: () => {
      setApprovedSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['pending-connections'] });
      notify.success('Doctor Approved', 'Physician now has verified read-only access to your timeline.');
    },
    onError: (err) => {
      notify.error('Approval Failed', err?.response?.data?.error || 'Could not approve connection.');
    },
  });

  const revokeMut = useMutation({
    mutationFn: (id) => revokeConnection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-connections'] });
      notify.warning('Access Revoked', 'Doctor access has been successfully removed.');
    },
    onError: (err) => {
      notify.error('Revoke Failed', err?.response?.data?.error || 'Could not revoke access.');
    },
  });

  // ── 5. Copy 6-Digit Code ──
  const handleCopy = () => {
    if (!codeData?.shareCode) return;
    navigator.clipboard.writeText(codeData.shareCode).then(() => {
      setCopied(true);
      notify.info('PIN Copied', `"${codeData.shareCode}" copied to clipboard.`);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const codeDigits = (codeData?.shareCode || '849210').split('');

  return (
    <div className="max-w-xl mx-auto space-y-6 font-sans">
        {/* Navigation & Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <BackButton to="/home" label="Back to Home" />

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[var(--doctor-600)]/10 text-[var(--doctor-600)] border border-[var(--doctor-600)]/20">
              <span className="w-2 h-2 rounded-full bg-[var(--doctor-600)] animate-pulse" />
              <span>DOCTOR LINK PROTOCOL</span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--ink)] tracking-tight font-[var(--font-heading)]">
              Share with Your Doctor
            </h1>
            <p className="text-xs sm:text-sm text-[var(--ink-2)] mt-1 leading-relaxed">
              Grant your treating physician read-only access to your active pharmacotherapy timeline and potential cascade warnings.
            </p>
          </div>
        </div>

        {/* ── 3-Step Real-Time Status Stepper ── */}
        <ConnectionStatusStepper
          currentStep={currentStep}
          doctorLabel={activeClaim?.doctorLabel}
        />

        {/* Error Callout */}
        {genError && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-900 rounded-2xl text-xs sm:text-sm text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
            <span>{genError}</span>
          </div>
        )}

        {/* ── Active Awaiting Approval Card (Step 2) ── */}
        {activeClaim && !approvedSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 space-y-4 shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-amber-500 text-white rounded-2xl flex-shrink-0 shadow-xs">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-800 dark:text-amber-200">
                  Doctor Claim Detected
                </span>
                <h3 className="text-base font-bold text-[var(--ink)] font-[var(--font-heading)]">
                  {activeClaim.doctorLabel}
                </h3>
                <p className="text-xs text-[var(--ink-2)] mt-0.5">
                  Requesting read-only timeline & interaction clearance access.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--canvas)] border border-[var(--border)] text-xs text-[var(--ink-3)] font-mono leading-relaxed">
              Physician will be able to review your active medications, dosage frequency, and drug-drug alerts. They cannot modify or delete your entries.
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => approveMut.mutate(activeClaim.connectionId)}
                disabled={approveMut.isPending}
                className="flex-1 py-3 px-4 rounded-2xl bg-[var(--doctor-600)] hover:bg-[var(--doctor-700)] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {approveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Approve Physician Access</span>
              </button>

              <button
                type="button"
                onClick={() => revokeMut.mutate(activeClaim.connectionId)}
                disabled={revokeMut.isPending}
                className="py-3 px-4 rounded-2xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {revokeMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                <span>Decline</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Approved Success State (Step 3) ── */}
        {approvedSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/35 space-y-3 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="text-lg font-black text-emerald-800 dark:text-emerald-200 font-[var(--font-heading)]">
              Physician Verified & Connected
            </h3>
            <p className="text-xs text-[var(--ink-2)] max-w-sm mx-auto leading-relaxed">
              Your treating physician is now actively viewing your timeline. You can revoke this connection at any time in Connected People.
            </p>
            <button
              type="button"
              onClick={() => navigate('/connected-people')}
              className="mt-2 px-5 py-2.5 rounded-2xl bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <span>Manage Connected People</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ── Main Share Card (QR in Paper with Folded Corner + Oversized 3D Code Tiles) ── */}
        <div className="relative">
          {/* Authentic Top-Right Folded Dog-Ear Corner on Paper Card */}
          <div className="rounded-3xl bg-[var(--paper)] border border-[var(--border)] p-6 sm:p-8 space-y-6 shadow-sm overflow-hidden relative">
            {/* The Dog-Ear Folded Corner */}
            <div
              className="absolute top-0 right-0 w-8 h-8 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, transparent 50%, var(--border) 50%, var(--canvas-2) 60%, var(--paper) 100%)',
                boxShadow: '-2px 2px 4px rgba(0,0,0,0.06)',
              }}
            />

            {/* Top Bar with Expiry Countdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
              <div>
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[var(--doctor-600)]">
                  INSTANT CLINICAL SYNC
                </span>
                <h3 className="text-lg font-black text-[var(--ink)] font-[var(--font-heading)]">
                  Physician Pairing Token
                </h3>
              </div>

              {codeData?.expiresAt && (
                <CircularExpiryRing expiresAt={codeData.expiresAt} />
              )}
            </div>

            {/* Centered QR Code inside Crisp Ivory Bezel */}
            {codeData?.qrCode ? (
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-sm">
                  <img
                    src={codeData.qrCode}
                    alt="Clinical Access QR Code"
                    className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl mix-blend-multiply dark:mix-blend-normal"
                  />
                </div>
                <p className="text-[11px] font-mono text-[var(--ink-3)] text-center pt-1">
                  Point physician tablet camera at QR code
                </p>
              </div>
            ) : generating ? (
              <div className="h-56 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--doctor-600)]" />
                <span className="text-xs font-mono text-[var(--ink-3)]">Generating secure token...</span>
              </div>
            ) : null}

            {/* ── Six Oversized Segmented Tiles with Subtle 3D Press Look ── */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--ink-3)]">
                  Or Share 6-Digit Manual PIN:
                </p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--doctor-600)] hover:underline cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy PIN'}</span>
                </button>
              </div>

              {/* Six 3D Press Tiles */}
              <div
                onClick={handleCopy}
                title="Click to copy 6-digit PIN"
                className="grid grid-cols-6 gap-1.5 sm:gap-2.5 md:gap-3 p-2.5 sm:p-3.5 md:p-4 rounded-3xl bg-[var(--canvas)] border border-[var(--border)] cursor-pointer group"
              >
                {codeDigits.map((digit, idx) => (
                  <div
                    key={idx}
                    className="h-14 sm:h-16 md:h-20 rounded-xl sm:rounded-2xl bg-[var(--surface)] border-2 border-[var(--border-strong)] flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-mono font-black text-[var(--ink)] shadow-[0_3px_0_0_var(--border-strong)] sm:shadow-[0_4px_0_0_var(--border-strong)] group-hover:border-[var(--doctor-600)] group-hover:text-[var(--doctor-600)] group-active:translate-y-1 group-active:shadow-none transition-all select-none"
                  >
                    {digit}
                  </div>
                ))}
              </div>
            </div>

            {/* Regenerate Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-3 rounded-2xl bg-[var(--canvas)] hover:bg-[var(--surface-2)] border border-[var(--border)] text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50 shadow-2xs"
              >
                <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                <span>Issue New 6-Digit Code</span>
                {isGuest && <Lock className="w-3.5 h-3.5 text-amber-600 ml-1" />}
              </button>
            </div>
          </div>
        </div>

        {/* Security & Zero-Trust Notice */}
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex items-start gap-3 text-xs text-[var(--ink-2)]">
          <ShieldCheck className="w-5 h-5 text-[var(--doctor-600)] flex-shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <p className="font-bold text-[var(--ink)]">Zero-Trust Pharmacotherapy Surveillance</p>
            <p className="text-[11px] text-[var(--ink-3)] font-mono">
              Access codes expire automatically after 15 minutes and can only be claimed once. Doctors receive read-only consultation rights and cannot alter your prescriptions.
            </p>
          </div>
        </div>
      </div>
  );
}
