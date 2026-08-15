/**
 * ConnectedPeoplePage.jsx — Patient side
 * Route: /connected-people
 *
 * Lists all Connections (doctors and caregivers) for this patient:
 *   • Status badge (PENDING / APPROVED / REVOKED)
 *   • Role label (Doctor / Caregiver)
 *   • Revoke access button on each
 *   • Add Caregiver form (by phone number)
 *   • Link to Share with Doctor page (QR code flow)
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowLeft, Stethoscope, Heart, Trash2, Loader2, AlertCircle,
  CheckCircle2, Clock, XCircle, Plus, QrCode, Phone,
  ShieldCheck, Info, ChevronRight, Users,
} from 'lucide-react';
import Card from '../components/Card';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { EmptyDoctorsIllustration, EmptyCaregiversIllustration } from '../components/EmptyIllustrations';
import { Skeleton } from '../components/Skeletons';
import { notify } from '../utils/toast';

function getToken() { return localStorage.getItem('polysafe_token'); }
const headers = () => ({ Authorization: `Bearer ${getToken()}` });

// ─── API helpers ──────────────────────────────────────────────────────────────
const fetchConnections = () =>
  axios.get('/connection/my-connections', { headers: headers() }).then((r) => r.data);
const revokeConnection = (id) =>
  axios.post(`/connection/${id}/revoke`, {}, { headers: headers() }).then((r) => r.data);
const addCaregiver = (phone) =>
  axios.post('/connection/add-caregiver', { phone }, { headers: headers() }).then((r) => r.data);

// ─── Status badge config ──────────────────────────────────────────────────────
const STATUS_CFG = {
  PENDING:  { label: 'Pending',  cls: 'bg-amber-100  text-amber-800  border-amber-200',  icon: <Clock       className="w-3 h-3" /> },
  APPROVED: { label: 'Approved', cls: 'bg-green-100  text-green-800  border-green-200',  icon: <CheckCircle2 className="w-3 h-3" /> },
  REVOKED:  { label: 'Revoked',  cls: 'bg-[#F5F0E8] text-[#6B726C] border-[#E7E1D3]', icon: <XCircle      className="w-3 h-3" /> },
};

// ─── Single connection row ────────────────────────────────────────────────────
function ConnectionRow({ conn, onRevoke, revoking }) {
  const isDoctor    = conn.role === 'DOCTOR';
  const st          = STATUS_CFG[conn.status] ?? STATUS_CFG.PENDING;

  return (
    <Card className={`p-4 space-y-2.5 ${conn.status === 'REVOKED' ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Role icon */}
        <div className={`p-2.5 rounded-xl flex-shrink-0 ${isDoctor ? 'bg-[#1B4B66]/10' : 'bg-[#E4F2E9]'}`}>
          {isDoctor
            ? <Stethoscope className="w-5 h-5 text-[#1B4B66]" />
            : <Heart className="w-5 h-5 text-[#2B6E5E]" />}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#232724] truncate">{conn.label}</p>
          <p className="text-[11px] text-[#6B726C]">
            {isDoctor ? 'Physician · Read-only access' : 'Family / Caregiver · Status view only'}
          </p>
          <p className="text-[10px] text-[#9CA3AF] mt-0.5">
            Added {new Date(conn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        {/* Status badge */}
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${st.cls}`}>
          {st.icon}
          {st.label}
        </span>
      </div>

      {/* Revoke button — only for non-revoked connections */}
      {conn.status !== 'REVOKED' && (
        <button
          onClick={() => onRevoke(conn.connectionId)}
          disabled={revoking}
          className="btn-outline-danger w-full py-2.5 text-xs mt-2"
        >
          {revoking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          Revoke Access
        </button>
      )}
    </Card>
  );
}

// ─── Add Caregiver Panel ──────────────────────────────────────────────────────
function AddCaregiverPanel({ onSuccess }) {
  const [phone, setPhone]   = useState('');
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  const mutation = useMutation({
    mutationFn: addCaregiver,
    onSuccess: (data) => {
      setSuccess(data.message || 'Invite sent!');
      notify.success('Caregiver Invited', `Invitation sent to ${phone.trim()}.`);
      setPhone('');
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
    setError('');
    setSuccess('');
    const trimmed = phone.trim();
    if (!trimmed) { setError('Please enter a phone number.'); return; }
    mutation.mutate(trimmed);
  };

  return (
    <Card
      title="Add a Caregiver"
      subtitle="Enter their phone number — they'll receive an invite when they log in."
      icon={<Heart className="w-4 h-4 text-[#2B6E5E]" />}
      className="space-y-4"
    >
      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
          <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B726C]" />
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (error) setError('');
            }}
            placeholder="+919876543210"
            className={`input-field pl-10 ${error ? 'input-error' : ''}`}
          />
        </div>
        <button
          type="submit"
          disabled={!phone.trim() || mutation.isPending}
          className="btn-primary w-full py-3"
        >
          {mutation.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
            : <><Plus className="w-4 h-4" /> Send Caregiver Invite</>}
        </button>
      </form>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ConnectedPeoplePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const shouldReduceMotion = useReducedMotion();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['my-connections'],
    queryFn:  fetchConnections,
  });

  const connections = data?.connections ?? [];

  // Group by role
  const doctors    = connections.filter((c) => c.role === 'DOCTOR');
  const caregivers = connections.filter((c) => c.role === 'CAREGIVER');

  const revokeMut = useMutation({
    mutationFn: revokeConnection,
    onSuccess: () => {
      queryClient.invalidateQueries(['my-connections']);
      notify.warning('Access Revoked', 'The connection has been removed.');
    },
    onError: (err) => {
      notify.error('Revoke Failed', err?.response?.data?.error || 'Failed to revoke connection.');
    },
  });

  const handleRevoke = (id) => {
    if (window.confirm('Revoke access for this connection? They will no longer be able to view your records.')) {
      revokeMut.mutate(id);
    }
  };

  return (
    <div className="min-h-[88vh] bg-[#FBF8F2] pb-16">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/home')}
            className="p-2.5 rounded-xl border-2 border-[#E7E1D3] bg-white text-[#6B726C] hover:text-[#2B6E5E] hover:border-[#2B6E5E] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-180 ease-out cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#232724]" style={{ fontFamily: "'Fraunces', serif" }}>
              Connected People
            </h1>
            <p className="text-xs text-[#6B726C]">Manage who can see your medication records</p>
          </div>
        </div>

        {/* Privacy summary */}
        <Card
          title="Access Levels"
          icon={<ShieldCheck className="w-4 h-4 text-[#2B6E5E]" />}
          className="space-y-2.5"
        >
          <div className="space-y-2 text-xs text-[#6B726C]">
            <div className="flex items-start gap-2">
              <Stethoscope className="w-3.5 h-3.5 text-[#1B4B66] flex-shrink-0 mt-0.5" />
              <span><strong>Doctor:</strong> Full read-only — timeline, interaction flags, clinical explanations. No editing.</span>
            </div>
            <div className="flex items-start gap-2">
              <Heart className="w-3.5 h-3.5 text-[#2B6E5E] flex-shrink-0 mt-0.5" />
              <span><strong>Caregiver:</strong> Status only (Safe/Caution/Critical) and today's reminder times. No medicine names, no symptom logs.</span>
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
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#232724]">
                  Doctors ({doctors.length})
                </h2>
                <Link
                  to="/share-with-doctor"
                  className="flex items-center gap-1.5 text-xs font-bold text-[#2B6E5E] hover:underline"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Share QR Code
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {doctors.length === 0 ? (
                <Card className="p-8 text-center space-y-4">
                  <EmptyDoctorsIllustration className="w-28 h-28 mx-auto" />
                  <div>
                    <h3 className="text-base font-bold text-[#232724]" style={{ fontFamily: "'Fraunces', serif" }}>
                      No Doctors Connected
                    </h3>
                    <p className="text-xs text-[#6B726C] mt-1 max-w-xs mx-auto">
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
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* ── Caregiver connections ─────────────────────────────────────────── */}
            <div className="space-y-3">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#232724]">
                Caregivers ({caregivers.length})
              </h2>

              {caregivers.length === 0 ? (
                <Card className="p-8 text-center space-y-4">
                  <EmptyCaregiversIllustration className="w-28 h-28 mx-auto" />
                  <div>
                    <h3 className="text-base font-bold text-[#232724]" style={{ fontFamily: "'Fraunces', serif" }}>
                      No Caregivers Connected
                    </h3>
                    <p className="text-xs text-[#6B726C] mt-1 max-w-xs mx-auto">
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
        <div className="flex items-start gap-2.5 p-4 border-2 border-[#E7E1D3] bg-[#FDFBF7] rounded-2xl">
          <Info className="w-4 h-4 text-[#6B726C] flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#6B726C] leading-relaxed">
            Revoking access takes effect immediately. Revoked connections cannot view any new or existing data. The connection is archived, not deleted.
          </p>
        </div>

      </div>
    </div>
  );
}
