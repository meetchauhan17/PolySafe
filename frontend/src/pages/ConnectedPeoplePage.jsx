/**
 * ConnectedPeoplePage.jsx — Clinical & Family Access Management
 * ─────────────────────────────────────────────────────────────────────────────
 * Routes: /connected, /connected-people
 *
 * Requirements Met:
 * • Cards by role with RoleBadge (Doctor / Caregiver).
 * • Consent status displayed with StatusPill (Safe / Caution / Critical).
 * • Last-access time indicators on every connection card.
 * • Revoke with a right-side confirmation Drawer (explains severed permissions).
 * • Caregiver invite form with real-time inline validation (Phone / Email / Name).
 */

import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Users,
  Stethoscope,
  Heart,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  QrCode,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
  Phone,
  Mail,
  UserCheck,
  X,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Activity,
  Calendar,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

import Card from '../components/Card';
import BackButton from '../components/BackButton';
import RoleBadge from '../components/RoleBadge';
import StatusPill from '../components/StatusPill';
import { notify } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

// ─── Extended Offline Mock Connections ────────────────────────────────────────
const DEMO_CONNECTIONS = [
  {
    connectionId: 'demo-conn-1',
    role: 'DOCTOR',
    status: 'APPROVED',
    name: 'Dr. Sarah Wilson, MD',
    label: 'Dr. Sarah Wilson (Cardiology & Internal Medicine)',
    registrationNumber: 'MCI-84920',
    hospital: 'Apollo Multispeciality Hospitals',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    lastAccessAt: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
  },
  {
    connectionId: 'demo-conn-2',
    role: 'CAREGIVER',
    status: 'APPROVED',
    name: 'Rajesh Patel',
    label: 'Rajesh Patel (Son)',
    phone: '+91 98765 43210',
    relationship: 'Adult Child',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    lastAccessAt: new Date(Date.now() - 25 * 60000).toISOString(), // 25 mins ago
  },
  {
    connectionId: 'demo-conn-3',
    role: 'DOCTOR',
    status: 'PENDING',
    name: 'Dr. Priya Sharma, MD',
    label: 'Dr. Priya Sharma (Neurology Consult)',
    registrationNumber: 'MCI-91042',
    hospital: 'Fortis Memorial Research Institute',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    lastAccessAt: null,
  },
];

// ─── Formatting helpers ───────────────────────────────────────────────────────
function formatLastAccess(dateStr) {
  if (!dateStr) return 'No access recorded yet';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 5) return 'Active just now';
  if (diffMins < 60) return `Accessed ${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Accessed ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `Accessed ${diffDays}d ago`;
}

// ─── Right-Side Revoke Confirmation Drawer ─────────────────────────────────────
function RevokeConfirmDrawer({ isOpen, onClose, connection, onConfirm, isRevoking }) {
  if (!isOpen || !connection) return null;

  const isDoctor = (connection.role || '').toUpperCase() === 'DOCTOR';
  const title = connection.name || connection.label || (isDoctor ? 'Treating Physician' : 'Family Caregiver');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop — subtle blur keeps center context legible */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-screen max-w-md bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto"
        >
          {/* Header */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[var(--ink)] font-[var(--font-heading)]">
                    Revoke Access Authorization
                  </h3>
                  <span className="text-[10px] font-mono text-[var(--ink-3)] uppercase tracking-wider">
                    Zero-Trust Security Action
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--canvas-2)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Person Demographics Card */}
            <div className="p-4 rounded-3xl bg-[var(--canvas)] border border-[var(--border)] space-y-3">
              <div className="flex items-center justify-between">
                <RoleBadge role={connection.role} size="sm" />
                <StatusPill status="critical" label="Revocation Pending" size="sm" />
              </div>

              <div>
                <h4 className="text-base font-bold text-[var(--ink)] font-[var(--font-heading)]">
                  {title}
                </h4>
                <p className="text-xs text-[var(--ink-3)] font-mono mt-0.5">
                  {connection.hospital || connection.relationship || (isDoctor ? 'Hospital Physician' : 'Family Member')}
                </p>
              </div>

              <div className="text-[11px] font-mono text-[var(--ink-3)] pt-1 border-t border-[var(--border)]">
                Last activity: {formatLastAccess(connection.lastAccessAt)}
              </div>
            </div>

            {/* Summary of Severed Permissions */}
            <div className="space-y-2.5">
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--ink)]">
                Permissions that will be severed immediately:
              </p>

              <div className="space-y-2 text-xs text-[var(--ink-2)]">
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                  <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>Real-time access to your active medication list and timetable will be terminated immediately.</span>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                  <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>Polypharmacy interaction alerts and organ toxicity surveillance will no longer be visible to this user.</span>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                  <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>Any active 6-digit PIN or pairing QR code associated with this connection will be invalidated.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-[var(--border)] flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isRevoking}
              className="ps-btn ps-btn-secondary flex-1 py-3 text-xs font-bold"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => onConfirm(connection.connectionId)}
              disabled={isRevoking}
              className="flex-1 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isRevoking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>Confirm Revoke</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Caregiver Invite Form with Inline Validation ─────────────────────────────
function CaregiverInviteForm({ onSuccess }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [relation, setRelation] = useState('Adult Child');
  const [touched, setTouched] = useState({ name: false, contact: false });

  // Inline Validation Logic
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim());
  const isPhone = /^(\+91[\-\s]?)?[6-9]\d{9}$/.test(contact.trim().replace(/[\s\-]/g, ''));
  const isContactValid = isEmail || isPhone;
  const isNameValid = name.trim().length >= 2;
  const isFormValid = isNameValid && isContactValid;

  const mutation = useMutation({
    mutationFn: (payload) => axios.post('/connection/add-caregiver', payload).then((r) => r.data),
    onSuccess: (data) => {
      setName('');
      setContact('');
      setTouched({ name: false, contact: false });
      notify.success('Caregiver Invited', `Invitation sent to ${name} (${relation}).`);
      onSuccess?.();
    },
    onError: (err) => {
      notify.error('Invite Failed', err?.response?.data?.error || 'Failed to send caregiver invitation.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ name: true, contact: true });
    if (!isFormValid) return;

    mutation.mutate({
      name: name.trim(),
      phone: isPhone ? contact.trim() : null,
      email: isEmail ? contact.trim() : null,
      relationship: relation,
    });
  };

  return (
    <Card
      title="Add Family Caregiver or Proxy"
      subtitle="Invite a loved one to monitor your daily dose timetable and check-ins"
      icon={<Heart className="w-5 h-5 text-[var(--caregiver-600)]" />}
      className="p-6 space-y-4"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name Input with Inline Validation */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold font-mono text-[var(--ink)] uppercase tracking-wider text-[11px]">
                Caregiver Full Name
              </label>
              {touched.name && (
                <span className={`text-[10px] font-mono font-bold ${isNameValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isNameValid ? '✓ Valid Name' : 'Min 2 characters'}
                </span>
              )}
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setTouched((prev) => ({ ...prev, name: true }));
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
              placeholder="e.g. Rajesh Patel"
              className={`w-full px-4 py-3 rounded-2xl bg-[var(--canvas)] border text-xs text-[var(--ink)] placeholder:text-[var(--ink-3)] outline-none transition-colors ${
                touched.name && !isNameValid
                  ? 'border-rose-400 focus:border-rose-500'
                  : 'border-[var(--border)] focus:border-[var(--caregiver-600)]'
              }`}
            />
          </div>

          {/* Relationship Selector */}
          <div className="space-y-1.5">
            <label className="font-bold font-mono text-[var(--ink)] uppercase tracking-wider text-[11px]">
              Relationship
            </label>
            <select
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[var(--canvas)] border border-[var(--border)] focus:border-[var(--caregiver-600)] text-xs font-bold text-[var(--ink)] outline-none cursor-pointer"
            >
              <option value="Adult Child">Adult Child</option>
              <option value="Spouse">Spouse / Partner</option>
              <option value="Parent">Parent</option>
              <option value="Sibling">Sibling</option>
              <option value="Professional Aide">Professional Aide / Nurse</option>
              <option value="Other">Other Family Member</option>
            </select>
          </div>
        </div>

        {/* Contact Input (Phone or Email) with Real-Time Regex Validation */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-bold font-mono text-[var(--ink)] uppercase tracking-wider text-[11px]">
              Caregiver Phone Number or Email
            </label>
            {touched.contact && contact.trim().length > 0 && (
              <span className={`text-[10px] font-mono font-bold ${isContactValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isEmail ? '✓ Valid Email' : isPhone ? '✓ Valid Mobile Number' : 'Enter 10-digit mobile or valid email'}
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type="text"
              value={contact}
              onChange={(e) => {
                setContact(e.target.value);
                setTouched((prev) => ({ ...prev, contact: true }));
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, contact: true }))}
              placeholder="e.g. +91 98765 43210 or caregiver@example.com"
              className={`w-full px-4 py-3 rounded-2xl bg-[var(--canvas)] border text-xs text-[var(--ink)] placeholder:text-[var(--ink-3)] outline-none transition-colors pr-10 ${
                touched.contact && !isContactValid && contact.trim().length > 0
                  ? 'border-rose-400 focus:border-rose-500'
                  : 'border-[var(--border)] focus:border-[var(--caregiver-600)]'
              }`}
            />
            {touched.contact && isContactValid && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3.5 top-3.5" />
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <span className="text-[11px] text-[var(--ink-3)] font-mono">
            Caregiver will receive an invitation to access your timetable.
          </span>

          <button
            type="submit"
            disabled={!isFormValid || mutation.isPending}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-[var(--caregiver-600)] hover:bg-[var(--caregiver-700)] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-40"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Send Caregiver Invite</span>
          </button>
        </div>
      </form>
    </Card>
  );
}

// ─── Main ConnectedPeoplePage Component ───────────────────────────────────────
export default function ConnectedPeoplePage() {
  const queryClient = useQueryClient();
  const shouldReduceMotion = useReducedMotion();
  const { user, isGuest } = useAuth();

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('polysafe_token') : null;
  const shouldFetch = !isGuest && !!token;

  // ── 1. Fetch Connections ──
  const { data: serverData, isLoading } = useQuery({
    queryKey: ['my-connections'],
    queryFn: () => axios.get('/connection/my-connections').then((r) => r.data),
    enabled: shouldFetch,
    staleTime: 10000,
  });

  const rawConnections = serverData?.connections || [];
  const connections = rawConnections.length > 0 ? rawConnections : DEMO_CONNECTIONS;

  // Categorize connections by role
  const doctorConnections = useMemo(() => {
    return connections.filter((c) => (c.role || '').toUpperCase() === 'DOCTOR');
  }, [connections]);

  const caregiverConnections = useMemo(() => {
    return connections.filter((c) => (c.role || '').toUpperCase() === 'CAREGIVER');
  }, [connections]);

  // ── 2. Revoke Drawer State ──
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const revokeMut = useMutation({
    mutationFn: (id) => axios.post(`/connection/${id}/revoke`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-connections'] });
      setDrawerOpen(false);
      setRevokeTarget(null);
      notify.success('Access Revoked', 'Permissions have been permanently disconnected.');
    },
    onError: (err) => {
      notify.error('Revocation Failed', err?.response?.data?.error || 'Could not revoke access.');
    },
  });

  const handleOpenRevokeDrawer = (conn) => {
    setRevokeTarget(conn);
    setDrawerOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <BackButton to="/home" label="Back to Home" />
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--ink)] tracking-tight font-[var(--font-heading)] mt-3">
            Connected People & Permissions
          </h1>
          <p className="text-xs sm:text-sm text-[var(--ink-2)] mt-1 font-sans">
            Manage authorized physicians and family caregivers with real-time access to your regimen.
          </p>
        </div>

        <Link
          to="/doctor-share"
          className="self-start sm:self-center px-4 py-2.5 rounded-2xl bg-[var(--doctor-600)] hover:bg-[var(--doctor-700)] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
        >
          <QrCode className="w-4 h-4" />
          <span>Share with Doctor (PIN / QR)</span>
        </Link>
      </div>

      {/* ── Caregiver Invite Form with Inline Validation ── */}
      <CaregiverInviteForm
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['my-connections'] })}
      />

      {/* ── Section A: Healthcare Providers & Physicians ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-[var(--doctor-600)]" />
            <h2 className="text-lg font-bold text-[var(--ink)] font-[var(--font-heading)]">
              Authorized Healthcare Providers ({doctorConnections.length})
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-[var(--ink-3)]">
            Read-only clinical access
          </span>
        </div>

        {doctorConnections.length === 0 ? (
          <Card className="p-8 text-center space-y-2">
            <Stethoscope className="w-8 h-8 text-[var(--ink-3)] mx-auto opacity-50" />
            <p className="text-sm font-bold text-[var(--ink)]">No doctors linked yet</p>
            <p className="text-xs text-[var(--ink-3)] font-mono max-w-sm mx-auto">
              Share your 6-digit PIN or QR code with your treating physician to link their clinic workstation.
            </p>
          </Card>
        ) : (
          <div className="space-y-3.5">
            {doctorConnections.map((conn) => {
              const statusNormalized = (conn.status || 'PENDING').toLowerCase();
              const isApproved = statusNormalized === 'approved';

              return (
                <div
                  key={conn.connectionId}
                  className="p-5 sm:p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--doctor-300)] shadow-xs transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--doctor-50)] text-[var(--doctor-600)] flex items-center justify-center font-bold text-sm flex-shrink-0 border border-[var(--doctor-200)]">
                        <Stethoscope className="w-6 h-6" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-[var(--ink)] font-[var(--font-heading)]">
                            {conn.name || conn.label || 'Treating Physician'}
                          </h3>
                          <RoleBadge role="doctor" size="sm" />
                          <StatusPill
                            status={isApproved ? 'safe' : 'caution'}
                            label={isApproved ? 'Active & Verified' : 'Awaiting Claim'}
                            size="sm"
                          />
                        </div>

                        <p className="text-xs text-[var(--ink-2)] font-mono">
                          {conn.hospital || 'Hospital Network'} {conn.registrationNumber ? `· Reg: ${conn.registrationNumber}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {/* Last-access time */}
                      <div className="text-right">
                        <span className="text-[11px] font-mono text-[var(--ink-3)] block">
                          {formatLastAccess(conn.lastAccessAt)}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--ink-4)] block">
                          Connected {conn.createdAt ? new Date(conn.createdAt).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>

                      {/* Revoke Action opens Drawer */}
                      <button
                        type="button"
                        onClick={() => handleOpenRevokeDrawer(conn)}
                        className="p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 border border-rose-500/25 transition-colors cursor-pointer"
                        title="Revoke access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section B: Family Members & Caregivers ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[var(--caregiver-600)]" />
            <h2 className="text-lg font-bold text-[var(--ink)] font-[var(--font-heading)]">
              Family Members & Caregivers ({caregiverConnections.length})
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-[var(--ink-3)]">
            Schedule check-ins only
          </span>
        </div>

        {caregiverConnections.length === 0 ? (
          <Card className="p-8 text-center space-y-2">
            <Heart className="w-8 h-8 text-[var(--ink-3)] mx-auto opacity-50" />
            <p className="text-sm font-bold text-[var(--ink)]">No caregivers linked yet</p>
            <p className="text-xs text-[var(--ink-3)] font-mono max-w-sm mx-auto">
              Use the invite form above to add a family member who can assist with your daily medication schedule.
            </p>
          </Card>
        ) : (
          <div className="space-y-3.5">
            {caregiverConnections.map((conn) => {
              const statusNormalized = (conn.status || 'PENDING').toLowerCase();
              const isApproved = statusNormalized === 'approved';

              return (
                <div
                  key={conn.connectionId}
                  className="p-5 sm:p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--caregiver-300)] shadow-xs transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--caregiver-50)] text-[var(--caregiver-600)] flex items-center justify-center font-bold text-sm flex-shrink-0 border border-[var(--caregiver-200)]">
                        <Heart className="w-6 h-6" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-[var(--ink)] font-[var(--font-heading)]">
                            {conn.name || conn.label || 'Family Caregiver'}
                          </h3>
                          <RoleBadge role="caregiver" size="sm" />
                          <StatusPill
                            status={isApproved ? 'safe' : 'caution'}
                            label={isApproved ? 'Active & Verified' : 'Pending Invite'}
                            size="sm"
                          />
                        </div>

                        <p className="text-xs text-[var(--ink-2)] font-mono">
                          {conn.relationship || 'Primary Caregiver'} {conn.phone ? `· ${conn.phone}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {/* Last-access time */}
                      <div className="text-right">
                        <span className="text-[11px] font-mono text-[var(--ink-3)] block">
                          {formatLastAccess(conn.lastAccessAt)}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--ink-4)] block">
                          Connected {conn.createdAt ? new Date(conn.createdAt).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>

                      {/* Revoke Action opens Drawer */}
                      <button
                        type="button"
                        onClick={() => handleOpenRevokeDrawer(conn)}
                        className="p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 border border-rose-500/25 transition-colors cursor-pointer"
                        title="Revoke access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Slide-Over Revoke Confirmation Drawer ── */}
      <RevokeConfirmDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setRevokeTarget(null);
        }}
        connection={revokeTarget}
        onConfirm={(id) => revokeMut.mutate(id)}
        isRevoking={revokeMut.isPending}
      />
    </div>
  );
}
