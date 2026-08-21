/**
 * DoctorSharePage.jsx — Patient side
 * Route: /share-with-doctor
 *
 * Shows the patient a generated 6-digit invite code + QR image.
 * Polls every 5s for pending connections (doctor has claimed the code).
 * When a claim is detected, shows an "Approve / Deny" prompt.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowLeft, QrCode, Copy, RefreshCw, Clock, CheckCircle2, XCircle,
  Stethoscope, ShieldCheck, AlertCircle, Loader2, Info, Users, Lock,
} from 'lucide-react';
import Card from '../components/Card';
import { Skeleton } from '../components/Skeletons';
import { notify } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

// ─── API helpers ──────────────────────────────────────────────────────────────
async function generateCode() {
  const { data } = await axios.post('/connection/generate-code');
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

// ─── Expiry countdown ─────────────────────────────────────────────────────────
function ExpiryCountdown({ expiresAt }) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const update = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) { setLabel('Expired'); return; }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setLabel(`Expires in ${m}m ${s < 10 ? '0' : ''}${s}s`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  return (
    <span className="flex items-center gap-1.5 text-xs text-[#6B726C]">
      <Clock className="w-3.5 h-3.5 text-[#E0824B]" />
      {label}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DoctorSharePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isGuest, requireAuth } = useAuth();
  const [codeData, setCodeData] = useState(
    isGuest
      ? { shareCode: '849210', expiresAt: new Date(Date.now() + 15 * 60000).toISOString() }
      : null
  );
  const [copied, setCopied]     = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState('');

  // ── Generate code ──────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (isGuest) {
      requireAuth('generate new clinical share codes');
      return;
    }
    setGenerating(true);
    setGenError('');
    try {
      const result = await generateCode();
      setCodeData(result);
      queryClient.invalidateQueries(['pending-connections']);
      notify.success('Security Code Ready', 'Share this 6-digit PIN or QR code with your doctor.');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to generate code.';
      setGenError(msg);
      notify.error('Generation Failed', msg);
    } finally {
      setGenerating(false);
    }
  }, [isGuest, requireAuth, queryClient]);

  // Auto-generate on mount if not guest
  useEffect(() => {
    if (!isGuest) {
      handleGenerate();
    }
  }, [isGuest, handleGenerate]);

  // ── Copy to clipboard ──────────────────────────────────────────────────────
  const handleCopy = () => {
    if (!codeData?.shareCode) return;
    navigator.clipboard.writeText(codeData.shareCode).then(() => {
      setCopied(true);
      notify.info('Code Copied', `"${codeData.shareCode}" copied to clipboard.`);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // ── Poll for pending connections every 5s once code exists ──────────────────
  const { data: pendingData } = useQuery({
    queryKey:  ['pending-connections'],
    queryFn:   fetchPending,
    refetchInterval: codeData ? 5000 : false,
    enabled:   !!codeData,
  });
  const pending = pendingData?.pending ?? [];

  // ── Approve / Revoke mutations ─────────────────────────────────────────────
  const approveMut = useMutation({
    mutationFn: (id) => approveConnection(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-connections']);
      notify.success('Doctor Approved', 'Physician now has verified read-only access to your timeline.');
    },
    onError: (err) => {
      notify.error('Approval Failed', err?.response?.data?.error || 'Could not approve connection.');
    },
  });
  const revokeMut = useMutation({
    mutationFn: (id) => revokeConnection(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-connections']);
      notify.warning('Access Revoked', 'Doctor access has been successfully removed.');
    },
    onError: (err) => {
      notify.error('Revoke Failed', err?.response?.data?.error || 'Could not revoke access.');
    },
  });

  return (
    <div className="min-h-[88vh] bg-[#EDE8DC] pb-16">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/home')}
            className="btn-secondary p-2.5 rounded-2xl"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#1C2B27]" style={{ fontFamily: "'Fraunces', serif" }}>
              Share with Your Doctor
            </h1>
            <p className="text-xs text-[#5C6B64]">Give your doctor read-only access to your medications and risk flags</p>
          </div>
        </div>

        {/* Explainer notice */}
        <div className="flex items-start gap-3 p-4 bg-[#E4F2E9] border border-[#2F8558]/30 rounded-2xl">
          <ShieldCheck className="w-5 h-5 text-[#2B6E5E] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-[#1A5C3A]">Consent-based, read-only access</p>
            <p className="text-xs text-[#2A6945] mt-0.5 leading-relaxed">
              Your doctor can view your timeline and risk analysis. They cannot add or delete medicines. You can revoke access at any time.
            </p>
          </div>
        </div>

        {/* Error */}
        {genError && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl text-sm text-rose-700">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
            {genError}
          </div>
        )}

        {/* Code + QR card */}
        {generating ? (
          <div className="skeleton-shimmer-card p-8 flex flex-col items-center gap-4 text-center">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="w-52 h-52 rounded-2xl" />
            <Skeleton className="h-12 w-48 rounded-xl" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : codeData ? (
          <Card
            title="Your Invite Code"
            subtitle="Share this QR code or 6-digit PIN with your physician"
            icon={<QrCode className="w-4 h-4 text-[#2B6E5E]" />}
            badge={<ExpiryCountdown expiresAt={codeData.expiresAt} />}
            className="space-y-5"
          >
            {/* QR Code */}
            {codeData.qrCode && (
              <div className="flex justify-center">
                <div className="p-3 bg-[#E6E0D3] shadow-[inset_3px_3px_6px_rgba(191,180,155,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.6)] rounded-2xl border border-[rgba(191,180,155,0.4)]">
                  <img
                    src={codeData.qrCode}
                    alt="QR code for doctor"
                    className="w-52 h-52 rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* 6-digit code */}
            <div className="space-y-2">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#6B726C] text-center">
                Or share this code manually
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center justify-center gap-2 bg-[#E6E0D3] shadow-[inset_3px_3px_6px_rgba(191,180,155,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.6)] rounded-2xl py-4 border border-[rgba(191,180,155,0.3)]">
                  {codeData.shareCode.split('').map((digit, i) => (
                    <span
                      key={i}
                      className="w-10 h-12 flex items-center justify-center text-2xl font-black text-[#1C2B27] bg-[#EDE8DC] rounded-xl shadow-[2px_2px_4px_rgba(191,180,155,0.5),-2px_-2px_4px_rgba(255,255,255,0.6)] border border-[rgba(191,180,155,0.3)]"
                    >
                      {digit}
                    </span>
                  ))}
                </div>
                <button
                  onClick={handleCopy}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-180 ease-out cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5 text-sm font-bold ${
                    copied
                      ? 'border-[#2B6E5E] bg-[#E4F2E9] text-[#2B6E5E]'
                      : 'border-[rgba(191,180,155,0.5)] bg-[#EDE8DC] shadow-[2px_2px_4px_rgba(191,180,155,0.4),-2px_-2px_4px_rgba(255,255,255,0.6)] text-[#5C6B64] hover:text-[#2B6E5E]'
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  <span className="text-[10px]">{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Regenerate */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-secondary w-full py-3 text-sm relative"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Generate New Code</span>
              {isGuest && <Lock className="w-3.5 h-3.5 text-[#8A6D3B] ml-1" />}
            </button>
          </Card>
        ) : null}

        {/* Pending doctor requests */}
        {pending.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-[#232724]" style={{ fontFamily: "'Fraunces', serif" }}>
              Awaiting Your Approval
            </h2>
            {pending.map((p) => {
              const isApproving = approveMut.isPending && approveMut.variables === p.connectionId;
              const isRevoking  = revokeMut.isPending  && revokeMut.variables  === p.connectionId;

              return (
                <Card
                  key={p.connectionId}
                  variant="caution"
                  className="space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#1B4B66]/10 rounded-xl border border-[#1B4B66]/20">
                      <Stethoscope className="w-5 h-5 text-[#1B4B66]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#232724]">{p.doctorLabel}</p>
                      <p className="text-[11px] text-[#6B726C]">Wants to view your medication records</p>
                    </div>
                  </div>

                  <p className="text-xs text-[#6B726C] leading-relaxed">
                    This will give them <strong>read-only</strong> access to your timeline and interaction flags. You can revoke this at any time.
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => approveMut.mutate(p.connectionId)}
                      disabled={isApproving || isRevoking}
                      className="btn-primary flex-1 py-3 text-sm"
                    >
                      {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Approve
                    </button>
                    <button
                      onClick={() => revokeMut.mutate(p.connectionId)}
                      disabled={isApproving || isRevoking}
                      className="btn-outline-danger flex-1 py-3 text-sm"
                    >
                      {isRevoking ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Deny
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Waiting state when code issued but no claims yet */}
        {codeData && pending.length === 0 && !generating && (
          <Card className="p-5 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#E4F2E9] rounded-xl">
                <Users className="w-4 h-4 text-[#2B6E5E]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#232724]">Waiting for your doctor</p>
                <p className="text-xs text-[#6B726C]">
                  Share the code or QR above. This page auto-updates when they connect.
                </p>
              </div>
            </div>
            {/* Pulsing waiting indicator */}
            <div className="flex items-center gap-2 pt-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#2B6E5E]"
                  style={{ animation: `pulse-dot 1.4s ease-in-out ${i * 0.16}s infinite` }}
                />
              ))}
              <span className="text-xs text-[#6B726C]">Listening for new connection…</span>
            </div>
          </Card>
        )}

        {/* Privacy note */}
        <div className="flex items-start gap-2.5 p-4 border-2 border-[#E7E1D3] rounded-2xl bg-[#FDFBF7]">
          <Info className="w-4 h-4 text-[#6B726C] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#6B726C] leading-relaxed">
            Codes expire after 24 hours. Each code can only be claimed once. Your doctor will see your medication list, interaction flags, and cumulative burden score — but not any personal details beyond your age and conditions.
          </p>
        </div>

      </div>
    </div>
  );
}
