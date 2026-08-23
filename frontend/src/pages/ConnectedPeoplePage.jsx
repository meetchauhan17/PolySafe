/**
 * ConnectedPeoplePage.jsx — Patient side
 * Route: /connected-people
 *
 * Lists all Connections (doctors and caregivers) for this patient:
 * • Status badge (PENDING / APPROVED / REVOKED)
 * • Role label (Doctor / Caregiver)
 * • Revoke access button on each
 * • Add Caregiver form (by phone number)
 * • Link to Share with Doctor page (QR code flow)
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowLeft, Stethoscope, Heart, Trash2, Loader2, AlertCircle,
  CheckCircle2, Clock, XCircle, Plus, QrCode, Phone, Mail,
  ShieldCheck, Info, ChevronRight, Copy, Check, PenLine,
  KeyRound, RefreshCw, Lock
} from 'lucide-react';
import Card from '../components/Card';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { EmptyDoctorsIllustration, EmptyCaregiversIllustration } from '../components/EmptyIllustrations';
import { Skeleton } from '../components/Skeletons';
import { notify } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

const DEMO_CONNECTIONS = [
  {
    connectionId: 'demo-conn-1',
    role: 'DOCTOR',
    status: 'APPROVED',
    name: 'Dr. Priya Sharma, MD',
    label: 'Dr. Priya Sharma (Cardiologist)',
    registrationNumber: 'MCI-84920',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    connectionId: 'demo-conn-2',
    role: 'CAREGIVER',
    status: 'APPROVED',
    name: 'Rajesh Kumar (Son)',
    label: 'Rajesh Kumar (Primary Caregiver)',
    phone: '+91 98765 43210',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

// ─── LocalStorage helpers for custom nicknames / notes ───────────────────────
const getStoredLabels = () => {
  try {
    return JSON.parse(localStorage.getItem('polysafe_connection_labels') || '{}');
  } catch {
    return {};
  }
};

const saveStoredLabel = (id, label) => {
  try {
    const labels = getStoredLabels();
    if (label && label.trim()) {
      labels[id] = label.trim();
    } else {
      delete labels[id];
    }
    localStorage.setItem('polysafe_connection_labels', JSON.stringify(labels));
  } catch (e) {
    console.error(e);
  }
};

// ─── API helpers ──────────────────────────────────────────────────────────────
const fetchConnections = () =>
  axios.get('/connection/my-connections').then((r) => r.data);
const approveConnection = (id) =>
  axios.post(`/connection/${id}/approve`).then((r) => r.data);
const revokeConnection = (id) =>
  axios.post(`/connection/${id}/revoke`).then((r) => r.data);
const addCaregiver = (phone) =>
  axios.post('/connection/add-caregiver', { phone }).then((r) => r.data);

// ─── Status badge config ──────────────────────────────────────────────────────
const STATUS_CFG = {
  PENDING: {
    label: 'Awaiting Claim',
    cls: 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-500/30',
    icon: <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
  },
  CLAIMED: {
    label: 'Pending Your Approval',
    cls: 'bg-teal-500/15 text-teal-900 dark:text-teal-300 border-teal-500/40 animate-pulse',
    icon: <Stethoscope className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
  },
  APPROVED: {
    label: 'Active & Verified',
    cls: 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 border-emerald-500/30',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
  },
  REVOKED: {
    label: 'Access Revoked',
    cls: 'bg-rose-500/15 text-rose-900 dark:text-rose-300 border-rose-500/30',
    icon: <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
  },
};

// ─── Single connection row ────────────────────────────────────────────────────
function ConnectionRow({ conn, onRevoke, revoking, onApprove, approving, customLabels = {}, onUpdateLabel }) {
  const isDoctor = conn.role === 'DOCTOR';
  const isPending = conn.status === 'PENDING';
  const isClaimedPending = isPending && Boolean(conn.connectedUserId);
  const isRevoked = conn.status === 'REVOKED';
  const st = isClaimedPending ? STATUS_CFG.CLAIMED : (STATUS_CFG[conn.status] ?? STATUS_CFG.PENDING);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(customLabels[conn.connectionId] || conn.label || '');
  const [copied, setCopied] = useState(false);

  const rawTitle = customLabels[conn.connectionId] || conn.label || conn.name;
  const displayTitle = rawTitle && rawTitle !== 'Unclaimed invite'
    ? rawTitle
    : (isClaimedPending
        ? (conn.doctorLabel || 'Doctor Access Request')
        : isPending
        ? (isDoctor ? 'Doctor Access Code' : 'Caregiver Invite Code')
        : (isDoctor ? 'Dr. Connection' : 'Caregiver Connection'));
  const hasCustomLabel = Boolean(customLabels[conn.connectionId]);

  const handleSaveLabel = (e) => {
    e?.preventDefault();
    onUpdateLabel?.(conn.connectionId, editValue);
    setIsEditing(false);
    notify.success('Nickname Saved', 'Connection note updated.');
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    notify.success('Code Copied', `PIN ${code} copied to clipboard.`);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className={`rounded-3xl p-5 sm:p-6 space-y-4 transition-all duration-200 border ${
        isClaimedPending
          ? 'bg-teal-50/20 dark:bg-teal-950/15 border-teal-500/50 shadow-[0_6px_24px_rgba(13,148,136,0.12),-2px_-2px_12px_rgba(255,255,255,0.9)]'
          : isPending
          ? 'bg-[var(--chassis)] border-amber-400/50 shadow-[0_6px_24px_rgba(245,158,11,0.08),-2px_-2px_12px_rgba(255,255,255,0.9)]'
          : isRevoked
          ? 'bg-[var(--chassis)]/60 opacity-60 border-[var(--chassis-dark)]'
          : 'bg-[var(--chassis)] border-[rgba(255,255,255,0.7)] dark:border-white/10 shadow-[0_6px_24px_rgba(0,0,0,0.05),-2px_-2px_12px_rgba(255,255,255,0.9)] hover:shadow-[0_10px_32px_rgba(0,0,0,0.08)]'
      }`}
    >
      {/* ── Top Row: Avatar + Title/Note + Status Pill ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {/* Avatar Icon */}
          <div
            className={`p-3 rounded-2xl flex-shrink-0 border shadow-xs transition-transform ${
              isDoctor
                ? 'bg-[var(--accent-secondary)]/12 border-[var(--accent-secondary)]/30 text-[var(--accent-secondary)]'
                : 'bg-[var(--accent-primary)]/12 border-[var(--accent-primary)]/30 text-[var(--accent-primary)]'
            }`}
          >
            {isDoctor ? (
              <Stethoscope className="w-5 h-5" />
            ) : (
              <Heart className="w-5 h-5" />
            )}
          </div>

          {/* Details & Inline Edit */}
          <div className="flex-1 min-w-0 space-y-1">
            {isEditing ? (
              <form onSubmit={handleSaveLabel} className="flex items-center gap-2 py-0.5 max-w-md">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="e.g. Dr. Mehta (Cardiologist)"
                  autoFocus
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border-2 border-[var(--accent-primary)] bg-[var(--chassis)] text-[var(--text-primary)] focus:outline-none w-full shadow-inner"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-bold shadow-xs hover:bg-[#23584B] active:scale-95 transition-all cursor-pointer flex-shrink-0"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditValue(customLabels[conn.connectionId] || conn.label || '');
                    setIsEditing(false);
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer flex-shrink-0"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-[var(--text-primary)] font-display tracking-tight truncate">
                    {displayTitle}
                  </h3>
                  {hasCustomLabel && (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
                      Custom Note
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    title="Edit custom note or label"
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--accent-primary)] rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <PenLine className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subtitle & Date metadata */}
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-medium flex-wrap pt-0.5">
                  <span>
                    {isClaimedPending
                      ? 'Doctor has entered your PIN · Awaiting your 1-click authorization'
                      : isDoctor
                      ? 'Physician · Read-only access to medication timeline'
                      : 'Family / Caregiver · Status view only'}
                  </span>
                  {conn.createdAt && (
                    <>
                      <span className="opacity-40">•</span>
                      <span className="text-[11px] font-mono text-[#9CA3AF]">
                        {new Date(conn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full border flex-shrink-0 shadow-xs ${st.cls}`}>
          {st.icon}
          <span>{st.label}</span>
        </span>
      </div>

      {/* ── Case A: Doctor HAS CLAIMED this code → Instant Approve Banner ── */}
      {isClaimedPending ? (
        <div className="p-4 rounded-2xl bg-teal-500/10 dark:bg-teal-950/30 border border-teal-500/40 shadow-xs space-y-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500 text-white rounded-xl shadow-xs flex-shrink-0">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-[var(--text-primary)] font-display">
                {conn.doctorLabel || 'Physician'} is requesting clinical timeline access!
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                Click "Approve Doctor Access" below to grant secure, read-only medication review permissions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onApprove(conn.connectionId)}
              disabled={approving || revoking}
              className="btn-primary flex-1 py-2.5 text-xs font-bold font-mono flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              {approving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Approve Doctor Access</span>
            </button>
            <button
              type="button"
              onClick={() => onRevoke(conn.connectionId)}
              disabled={approving || revoking}
              className="btn-outline-danger py-2.5 px-4 text-xs font-bold font-mono flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Decline</span>
            </button>
          </div>
        </div>
      ) : isPending && conn.shareCode ? (
        /* ── Case B: Code is NOT yet claimed → Show 6-Digit PIN Capsule ── */
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-teal-500/10 border border-amber-400/40 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900 dark:text-amber-200">
              <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{isDoctor ? 'Doctor 6-Digit Access PIN' : 'Caregiver 6-Digit Access PIN'}</span>
            </div>

            {conn.expiresAt && (
              <span className="text-[11px] font-mono text-[var(--text-muted)] font-bold bg-white/70 dark:bg-black/40 px-2.5 py-0.5 rounded-full border border-black/5 dark:border-white/10">
                ⏳ Expires: {new Date(conn.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap pt-0.5">
            {/* 6 Monospace Tactile Digit Tiles */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {conn.shareCode.split('').map((digit, idx) => (
                <span
                  key={idx}
                  className="w-8 h-10 sm:w-10 sm:h-12 rounded-xl bg-[var(--chassis-panel)] border border-[rgba(255,255,255,0.8)] dark:border-white/15 shadow-sm flex items-center justify-center font-mono font-black text-base sm:text-xl text-[var(--accent-primary)] transition-transform hover:scale-105"
                >
                  {digit}
                </span>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyCode(conn.shareCode)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--accent-primary)] text-white hover:bg-[#23584B] shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy PIN'}</span>
              </button>

              <Link
                to="/share-with-doctor"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--chassis)] hover:bg-[var(--chassis-dark)] text-[var(--text-primary)] border border-[rgba(255,255,255,0.7)] dark:border-white/10 shadow-xs transition-all active:scale-95"
              >
                <QrCode className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Show QR</span>
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Footer Row: Security Metadata + Cancel / Revoke Action ── */}
      <div className="pt-2 border-t border-[rgba(255,255,255,0.4)] dark:border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)]">
          <Lock className="w-3 h-3 text-[var(--accent-primary)]" />
          <span>{isPending ? 'Single-use physician authorization' : 'HIPAA compliant read-only link'}</span>
        </div>

        <div>
          {!isRevoked ? (
            <button
              type="button"
              onClick={() => onRevoke(conn.connectionId)}
              disabled={revoking || approving}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[var(--led-critical)] bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {revoking ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>{isPending ? 'Cancel Invite' : 'Revoke Access'}</span>
            </button>
          ) : (
            <Link
              to="/share-with-doctor"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/25 shadow-xs transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-Invite Doctor</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Add Caregiver Panel ──────────────────────────────────────────────────────
const RELATION_OPTIONS = ['Spouse', 'Son / Daughter', 'Parent', 'Sibling', 'Nurse / Aide', 'Family Friend'];

function AddCaregiverPanel({ onSuccess }) {
  const { isGuest, requireAuth } = useAuth();
  const [inviteMethod, setInviteMethod] = useState('PHONE'); // 'PHONE' | 'EMAIL' | 'PIN'
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('Son / Daughter');
  const [error, setError] = useState('');
  const [invitedData, setInvitedData] = useState(null);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [generatedPinData, setGeneratedPinData] = useState(null);
  const [pinLoading, setPinLoading] = useState(false);

  // Invite by Phone or Email Mutation
  const mutation = useMutation({
    mutationFn: (payload) => axios.post('/connection/add-caregiver', payload).then((r) => r.data),
    onSuccess: (data) => {
      const customNick = [name.trim(), relation ? `(${relation})` : ''].filter(Boolean).join(' ');
      if (customNick && data?.connectionId) {
        saveStoredLabel(data.connectionId, customNick);
      }

      setInvitedData({
        phone: data.caregiverPhone,
        email: data.caregiverEmail,
        name: name.trim(),
        relation,
        inviteMessage: data.inviteMessage || `Hi, I've added you as my family caregiver on PolySafe. Log in at ${window.location.origin} to view my medication reminders & safety status.`,
      });

      notify.success('Caregiver Invited', `Invitation created for ${name.trim() || data.caregiverPhone || data.caregiverEmail}.`);
      setPhone('');
      setEmail('');
      setName('');
      onSuccess?.();
    },
    onError: (err) => {
      const e = err?.response?.data?.error || 'Failed to send invite.';
      setError(e);
      notify.error('Invite Failed', e);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isGuest) {
      requireAuth('invite family caregivers');
      return;
    }
    setError('');

    if (inviteMethod === 'PHONE') {
      const trimmedPhone = phone.trim();
      if (!trimmedPhone) {
        setError('Please enter a mobile phone number.');
        return;
      }
      mutation.mutate({
        phone: trimmedPhone,
        name: name.trim() || undefined,
        relation,
      });
    } else if (inviteMethod === 'EMAIL') {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        setError('Please enter an email address.');
        return;
      }
      mutation.mutate({
        email: trimmedEmail,
        name: name.trim() || undefined,
        relation,
      });
    }
  };

  // Generate 6-Digit Caregiver PIN / QR Code
  const handleGenerateCaregiverPin = async () => {
    if (isGuest) {
      requireAuth('generate caregiver access codes');
      return;
    }
    setError('');
    setPinLoading(true);
    try {
      const res = await axios.post('/connection/generate-code', { role: 'CAREGIVER' });
      setGeneratedPinData(res.data);
      if (name.trim() && res.data?.connectionId) {
        const customNick = [name.trim(), relation ? `(${relation})` : ''].filter(Boolean).join(' ');
        saveStoredLabel(res.data.connectionId, customNick);
      }
      notify.success('PIN Generated', `Caregiver 6-digit access PIN: ${res.data.shareCode}`);
      onSuccess?.();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to generate code.';
      setError(msg);
      notify.error('Generation Failed', msg);
    } finally {
      setPinLoading(false);
    }
  };

  const handleCopyMessage = (msg) => {
    navigator.clipboard.writeText(msg);
    setCopiedMsg(true);
    notify.success('Copied', 'Text copied to clipboard.');
    setTimeout(() => setCopiedMsg(false), 2500);
  };

  return (
    <Card
      hideScrews={true}
      title="Add Family Caregiver"
      subtitle="Choose how to connect: by mobile number, email, or an instant 6-digit PIN code."
      icon={<Heart className="w-4 h-4 text-[var(--accent-primary)]" />}
      className="space-y-4"
    >
      {/* Method Selection Tabs */}
      <div className="flex rounded-xl bg-[var(--chassis)] p-1 border border-[rgba(255,255,255,0.4)] dark:border-white/5 gap-1">
        <button
          type="button"
          onClick={() => { setInviteMethod('PHONE'); setError(''); }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            inviteMethod === 'PHONE'
              ? 'bg-[var(--accent-primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Mobile Number</span>
        </button>

        <button
          type="button"
          onClick={() => { setInviteMethod('EMAIL'); setError(''); }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            inviteMethod === 'EMAIL'
              ? 'bg-[var(--accent-primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email Address</span>
        </button>

        <button
          type="button"
          onClick={() => { setInviteMethod('PIN'); setError(''); }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            inviteMethod === 'PIN'
              ? 'bg-[var(--accent-primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Instant PIN / QR</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Case 1: Post-invite Card (WhatsApp / Copy) ─────────────────────── */}
      {invitedData ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/30 space-y-3.5 animate-fadeIn">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Invite Created for {invitedData.name ? `${invitedData.name} (${invitedData.relation})` : (invitedData.phone || invitedData.email)}</span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--chassis)] border border-[rgba(255,255,255,0.4)] dark:border-white/5 space-y-1.5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold">
              Ready-to-send Invite Message:
            </p>
            <p className="text-xs text-[var(--text-secondary)] font-mono leading-relaxed">
              "{invitedData.inviteMessage}"
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-1">
            {invitedData.phone && (
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(invitedData.inviteMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#25D366] text-white hover:bg-[#1EBE5D] shadow-xs active:scale-98 transition-all cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Share via WhatsApp</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => handleCopyMessage(invitedData.inviteMessage)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--chassis)] hover:bg-[var(--chassis-dark)] text-[var(--text-primary)] border border-[var(--chassis-dark)] shadow-xs active:scale-98 transition-all cursor-pointer"
            >
              {copiedMsg ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[var(--accent-primary)]" />}
              <span>{copiedMsg ? 'Message Copied' : 'Copy Message'}</span>
            </button>

            <button
              type="button"
              onClick={() => setInvitedData(null)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer ml-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Invite Another</span>
            </button>
          </div>
        </div>
      ) : inviteMethod === 'PIN' ? (
        /* ── Case 2: Instant 6-Digit PIN & QR Generation ────────────────────── */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Caregiver Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajesh (Son)"
                className="input-field w-full text-xs py-2.5 px-3.5 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Relationship
              </label>
              <select
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="input-field w-full text-xs py-2.5 px-3.5 rounded-xl"
              >
                {RELATION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {generatedPinData ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-400/40 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Caregiver Access PIN & QR (Valid 24 Hours)
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  Expires: {new Date(generatedPinData.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* QR Code and 6-Digit PIN Side-by-Side Layout */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-[var(--chassis)] p-4 rounded-xl border border-[rgba(255,255,255,0.4)] dark:border-white/5 shadow-xs">
                {/* QR Code Image */}
                {generatedPinData.qrCode && (
                  <div className="p-2 bg-white rounded-xl shadow-xs border border-teal-500/30 flex-shrink-0">
                    <img
                      src={generatedPinData.qrCode}
                      alt="Caregiver Quick Scan QR"
                      className="w-28 h-28 object-contain"
                    />
                  </div>
                )}

                {/* 6-Digit PIN Display & Copy */}
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold">
                    6-Digit Access PIN Code:
                  </p>
                  
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    {generatedPinData.shareCode.split('').map((digit, idx) => (
                      <span
                        key={idx}
                        className="w-8 h-10 sm:w-9 sm:h-11 rounded-xl bg-[var(--chassis-panel)] border border-[rgba(255,255,255,0.6)] dark:border-white/10 shadow-xs flex items-center justify-center font-mono font-extrabold text-base sm:text-lg text-[var(--accent-primary)]"
                      >
                        {digit}
                      </span>
                    ))}
                  </div>

                  <p className="text-[11px] text-[var(--text-muted)] pt-0.5">
                    Caregiver can scan the QR with their camera or type this PIN in their Caregiver Hub.
                  </p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyMessage(generatedPinData.shareCode)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--accent-primary)] text-white hover:bg-[#23584B] shadow-xs active:scale-98 transition-all cursor-pointer"
                >
                  {copiedMsg ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMsg ? 'PIN Copied' : 'Copy 6-Digit PIN'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGeneratedPinData(null)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer ml-auto"
                >
                  <span>Done</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGenerateCaregiverPin}
              disabled={pinLoading}
              className="btn-primary w-full py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98 transition-all"
            >
              {pinLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Caregiver PIN & QR…</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Generate Caregiver 6-Digit PIN Code</span>
                  {isGuest && <Lock className="w-3.5 h-3.5 text-white/70 ml-1" />}
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        /* ── Case 3: Mobile or Email Form ───────────────────────────────────── */
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Caregiver Name */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Caregiver Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="input-field w-full text-xs py-2.5 px-3.5 rounded-xl"
              />
            </div>

            {/* Mobile or Email */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                {inviteMethod === 'PHONE' ? 'Mobile Number' : 'Email Address'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                {inviteMethod === 'PHONE' ? (
                  <>
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="9876543210 or +91 98765 43210"
                      className={`input-field has-icon-left !pl-11 text-xs py-2.5 rounded-xl w-full ${error ? 'input-error' : ''}`}
                    />
                  </>
                ) : (
                  <>
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="caregiver@gmail.com"
                      className={`input-field has-icon-left !pl-11 text-xs py-2.5 rounded-xl w-full ${error ? 'input-error' : ''}`}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Relationship Selection Chips */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Relationship / Role
            </label>
            <div className="flex flex-wrap gap-1.5">
              {RELATION_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setRelation(opt)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    relation === opt
                      ? 'bg-[var(--accent-primary)] text-white shadow-xs scale-102 font-bold'
                      : 'bg-[var(--chassis)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[rgba(255,255,255,0.4)] dark:border-white/5'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={((inviteMethod === 'PHONE' ? !phone.trim() : !email.trim()) && !isGuest) || mutation.isPending}
            className="btn-primary w-full py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98 transition-all"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Caregiver Invite…</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Send Caregiver Invite</span>
                {isGuest && <Lock className="w-3.5 h-3.5 text-white/70 ml-1" />}
              </>
            )}
          </button>
        </form>
      )}

      {/* Privacy reassurance note */}
      <div className="p-3 rounded-xl bg-[var(--chassis)] border border-[rgba(255,255,255,0.4)] dark:border-white/5 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
          <strong>Privacy Safeguard:</strong> Caregivers only see adherence compliance status (Safe / Caution / Critical) and today's schedule reminder times. No sensitive symptoms or medical notes are exposed.
        </p>
      </div>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ConnectedPeoplePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const shouldReduceMotion = useReducedMotion();
  const { isGuest, token } = useAuth();

  const [customLabels, setCustomLabels] = useState(getStoredLabels);
  const [demoList, setDemoList] = useState(DEMO_CONNECTIONS);

  const handleUpdateLabel = (id, label) => {
    saveStoredLabel(id, label);
    setCustomLabels(getStoredLabels());
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['my-connections'],
    queryFn: fetchConnections,
    enabled: !!token && !isGuest,
    refetchInterval: 2500, // Real-time 2.5s polling for instant live updates
  });

  const connections = isGuest ? demoList : (data?.connections ?? (token ? [] : demoList));

  // Group by role
  const doctors = connections.filter((c) => c.role === 'DOCTOR');
  const caregivers = connections.filter((c) => c.role === 'CAREGIVER');
  const pendingCount = connections.filter((c) => c.status === 'PENDING').length;
  const approvedDoctors = doctors.filter((d) => d.status === 'APPROVED').length;

  const approveMut = useMutation({
    mutationFn: approveConnection,
    onSuccess: (res) => {
      queryClient.invalidateQueries(['my-connections']);
      notify.success('Doctor Approved', res?.message || 'Physician now has verified read-only access.');
    },
    onError: (err) => {
      notify.error('Approval Failed', err?.response?.data?.error || 'Failed to approve doctor access.');
    },
  });

  const handleApprove = (id) => {
    approveMut.mutate(id);
  };

  const revokeMut = useMutation({
    mutationFn: revokeConnection,
    onSuccess: (res) => {
      queryClient.invalidateQueries(['my-connections']);
      notify.warning('Access Removed', res?.message || 'Connection or pending invite cancelled.');
    },
    onError: (err) => {
      notify.error('Revoke Failed', err?.response?.data?.error || 'Failed to cancel connection.');
    },
  });

  const handleRevoke = (id) => {
    if (isGuest || (typeof id === 'string' && id.startsWith('demo-'))) {
      setDemoList((prev) => prev.filter((c) => c.connectionId !== id));
      notify.warning('Invite Cancelled', 'Connection or pending invite has been cancelled.');
      return;
    }

    // Direct invocation for authenticated user
    revokeMut.mutate(id);
  };

  return (
    <div className="min-h-[88vh] bg-[var(--chassis)] pb-16">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/home')}
            className="btn-secondary p-2.5 rounded-2xl cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] font-display">
              Connected People
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              Manage clinical physician access codes, family caregivers, and sharing permissions
            </p>
          </div>
        </div>

        {/* Quick Status Chips */}
        <div className="flex flex-wrap gap-2 pt-0.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)] border border-[var(--accent-secondary)]/25 shadow-xs">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>{approvedDoctors} Active Doctor{approvedDoctors !== 1 ? 's' : ''}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/25 shadow-xs">
            <Heart className="w-3.5 h-3.5" />
            <span>{caregivers.filter(c => c.status === 'APPROVED').length} Caregiver{caregivers.filter(c => c.status === 'APPROVED').length !== 1 ? 's' : ''}</span>
          </span>

          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{pendingCount} Pending Invite{pendingCount !== 1 ? 's' : ''}</span>
            </span>
          )}
        </div>

        {/* Privacy summary */}
        <Card
          title="Access Levels & Permissions"
          icon={<ShieldCheck className="w-4 h-4 text-[var(--accent-primary)]" />}
          className="space-y-2.5"
        >
          <div className="space-y-2 text-xs text-[var(--text-muted)]">
            <div className="flex items-start gap-2">
              <Stethoscope className="w-3.5 h-3.5 text-[var(--accent-secondary)] flex-shrink-0 mt-0.5" />
              <span><strong>Doctor:</strong> Full read-only — timeline, interaction flags, cumulative anticholinergic burden, and prescribing cascade correlation.</span>
            </div>
            <div className="flex items-start gap-2">
              <Heart className="w-3.5 h-3.5 text-[var(--accent-primary)] flex-shrink-0 mt-0.5" />
              <span><strong>Caregiver:</strong> Status overview (Safe / Caution / Critical) and today's schedule reminder times. No sensitive symptom logs.</span>
            </div>
          </div>
        </Card>

        {/* Loading / Error */}
        {isLoading && (
          <div className="space-y-4">
            <div className="skeleton-shimmer-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
            <div className="skeleton-shimmer-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          </div>
        )}
        {isError && (
          <Card variant="danger" className="p-4 flex items-start gap-3 bg-rose-50 border-rose-200">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-rose-700">Failed to load connections</p>
              <p className="text-xs text-rose-600 mt-0.5">{error?.response?.data?.error || error?.message}</p>
            </div>
          </Card>
        )}

        {/* ── Doctor connections ─────────────────────────────────────────────── */}
        {!isLoading && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-[var(--text-primary)]">
                  Doctors ({doctors.length})
                </h2>
                <Link
                  to="/share-with-doctor"
                  className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent-primary)] hover:underline"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Generate Code & QR</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {doctors.length === 0 ? (
                <Card className="p-8 text-center space-y-4">
                  <EmptyDoctorsIllustration className="w-28 h-28 mx-auto" />
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
                      No Doctors Connected
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs mx-auto">
                      Share a temporary 6-digit access code or QR code during your clinic consultation to grant read-only medication timeline access.
                    </p>
                  </div>
                  <Link
                    to="/share-with-doctor"
                    className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Generate Doctor Access Code</span>
                  </Link>
                </Card>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {doctors.map((conn) => (
                      <motion.div
                        key={conn.connectionId}
                        layout={!shouldReduceMotion}
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ConnectionRow
                          conn={conn}
                          onRevoke={handleRevoke}
                          revoking={revokeMut.isPending && revokeMut.variables === conn.connectionId}
                          onApprove={handleApprove}
                          approving={approveMut.isPending && approveMut.variables === conn.connectionId}
                          customLabels={customLabels}
                          onUpdateLabel={handleUpdateLabel}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* ── Caregiver connections ─────────────────────────────────────────── */}
            <div className="space-y-3">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-[var(--text-primary)]">
                Caregivers ({caregivers.length})
              </h2>

              {caregivers.length === 0 ? (
                <Card className="p-8 text-center space-y-4">
                  <EmptyCaregiversIllustration className="w-28 h-28 mx-auto" />
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
                      No Caregivers Connected
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs mx-auto">
                      Invite trusted family members or caregivers to view daily reminder times and overall safety status.
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {caregivers.map((conn) => (
                      <motion.div
                        key={conn.connectionId}
                        layout={!shouldReduceMotion}
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ConnectionRow
                          conn={conn}
                          onRevoke={handleRevoke}
                          revoking={revokeMut.isPending && revokeMut.variables === conn.connectionId}
                          onApprove={handleApprove}
                          approving={approveMut.isPending && approveMut.variables === conn.connectionId}
                          customLabels={customLabels}
                          onUpdateLabel={handleUpdateLabel}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Add caregiver panel */}
              <AddCaregiverPanel onSuccess={() => queryClient.invalidateQueries(['my-connections'])} />
            </div>
          </>
        )}

        {/* Footer note */}
        <div className="flex items-start gap-2.5 p-4 border-2 border-[var(--chassis-dark)] bg-[var(--chassis)] rounded-2xl">
          <Info className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            <strong>Instant Access Control:</strong> Revoking doctor or caregiver access takes effect immediately across all sessions. Unclaimed 6-digit PIN codes can be canceled or refreshed at any time.
          </p>
        </div>

      </div>
    </div>
  );
}
