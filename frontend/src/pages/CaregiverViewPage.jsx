/**
 * CaregiverViewPage.jsx — Caregiver side
 * Route: /caregiver-view
 *
 * Shows the caregiver:
 *   • Pending invites (accept/ignore)
 *   • For approved patients: status card + today's medicine reminders only
 *
 * Per the permission matrix: NO full medicine names, NO symptoms, NO risk details.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowLeft, Heart, CheckCircle2, XCircle, Clock, Pill, Leaf,
  ShoppingBag, AlertTriangle, ShieldCheck, Loader2, AlertCircle,
  ChevronRight, Users, Activity, Info,
} from 'lucide-react';
import Card from '../components/Card';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { EmptyCaregiversIllustration, EmptyScheduleIllustration } from '../components/EmptyIllustrations';
import { Skeleton } from '../components/Skeletons';
import { notify } from '../utils/toast';

// ─── API helpers ──────────────────────────────────────────────────────────────
const fetchInvites      = () => axios.get('/connection/caregiver-invites').then(r => r.data);
const fetchMyPatients   = () => axios.get('/caregiver/my-patients').then(r => r.data);
const fetchSummary      = (pid) => axios.get(`/caregiver/patient-summary/${pid}`).then(r => r.data);
const acceptInvite      = (id) => axios.post(`/connection/${id}/accept`).then(r => r.data);
const revokeInvite      = (id) => axios.post(`/connection/${id}/revoke`).then(r => r.data);

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  SAFE: {
    bg:     'bg-[#E4F2E9]',
    border: 'border-[#2F8558]/30',
    text:   'text-[#1A5C3A]',
    accent: '#2B6E5E',
    icon:   <ShieldCheck className="w-8 h-8 text-[#2B6E5E]" />,
    label:  'All Clear',
    sublabel: 'No known interaction risks detected today.',
  },
  CAUTION: {
    bg:     'bg-[#FBEED9]',
    border: 'border-[#B5791A]/40',
    text:   'text-[#7A4A0A]',
    accent: '#E0824B',
    icon:   <AlertTriangle className="w-8 h-8 text-[#B5791A]" />,
    label:  'Caution',
    sublabel: 'Some interaction flags are active. No action needed from you — the patient is aware.',
  },
  CRITICAL: {
    bg:     'bg-[#FBE4DE]',
    border: 'border-[#B23D25]/40',
    text:   'text-[#7A1A0A]',
    accent: '#B23D25',
    icon:   <AlertTriangle className="w-8 h-8 text-[#B23D25]" />,
    label:  'Critical',
    sublabel: 'High-severity interaction flags are active. Consider checking in with the patient or their doctor.',
  },
};

// ─── Type icon ────────────────────────────────────────────────────────────────
function TypeIcon({ label }) {
  if (label?.toLowerCase().includes('herbal'))           return <Leaf className="w-4 h-4 text-[#2B6E5E]" />;
  if (label?.toLowerCase().includes('over-the-counter')) return <ShoppingBag className="w-4 h-4 text-[#8A6D3B]" />;
  return <Pill className="w-4 h-4 text-[#1B4B66]" />;
}

// ─── Patient Summary Card ─────────────────────────────────────────────────────
function PatientSummaryCard({ patientId, patientAge }) {
  const shouldReduceMotion = useReducedMotion();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['caregiver-summary', patientId],
    queryFn:  () => fetchSummary(patientId),
    refetchInterval: 30000, // refresh every 30s for live status
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton-shimmer-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="skeleton-shimmer-card p-6 space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card variant="danger" className="p-5 flex items-start gap-3 bg-rose-50 border-rose-200">
        <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-rose-700">Could not load status</p>
          <p className="text-xs text-rose-600 mt-0.5">{error?.response?.data?.error || error?.message}</p>
        </div>
      </Card>
    );
  }

  const cfg = STATUS_CFG[data?.status] ?? STATUS_CFG.SAFE;
  const variant = data?.status === 'CRITICAL' ? 'danger' : data?.status === 'CAUTION' ? 'caution' : 'safe';

  return (
    <div className="space-y-4">
      {/* Status hero card */}
      <Card variant={variant} className={`p-6 ${cfg.bg} space-y-4`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl bg-white/60 border ${cfg.border}`}>
            {cfg.icon}
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#6B726C]">
              Patient Status · Age {patientAge ?? '—'}
            </p>
            <h2 className="text-2xl font-black mt-1" style={{ color: cfg.accent, fontFamily: "'Fraunces', serif" }}>
              {cfg.label}
            </h2>
            <p className={`text-xs mt-1 leading-relaxed ${cfg.text}`}>{cfg.sublabel}</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-black/5">
          {[
            { label: 'Medicines', value: data?.medicineCount ?? 0 },
            { label: 'Active Flags', value: data?.flagCount ?? 0 },
            { label: 'Severity', value: data?.worstSeverity ?? 'None' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-base font-black text-[#232724]">{s.value}</p>
              <p className="text-[10px] text-[#6B726C] font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Caregiver permission notice */}
      <div className="flex items-start gap-2.5 p-3.5 bg-[#F5F0E8] border border-[#E7E1D3] rounded-2xl">
        <Info className="w-4 h-4 text-[#6B726C] flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#6B726C] leading-relaxed">
          As a caregiver, you see the patient's overall safety status and today's reminders.
          <strong> Medicine names are not shown</strong> to protect medical privacy — only dosage times and types.
        </p>
      </div>

      {/* Today's schedule */}
      {data?.schedule?.length > 0 ? (
        <Card
          title="Today's Reminders"
          icon={<Clock className="w-4 h-4 text-[#2B6E5E]" />}
          className="space-y-3"
        >
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {data.schedule.map((item, i) => (
                <motion.div
                  key={i}
                  layout={!shouldReduceMotion}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="p-3.5 rounded-xl border border-[#E7E1D3] bg-[#FDFBF7] flex items-center gap-3"
                >
                  {/* Time */}
                  <div className="flex flex-col items-center bg-[#F5F0E8] rounded-xl px-3 py-2 min-w-[70px] text-center">
                    <Clock className="w-3.5 h-3.5 text-[#E0824B] mb-0.5" />
                    <span className="text-[11px] font-black text-[#232724]">{item.time}</span>
                  </div>
                  {/* Type label — NO medicine name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <TypeIcon label={item.typeLabel} />
                      <span className="text-sm font-bold text-[#232724] truncate">{item.typeLabel}</span>
                    </div>
                    <span className="text-xs text-[#6B726C]">{item.dosage}</span>
                  </div>
                  {/* Index */}
                  <span className="text-[10px] font-bold text-[#6B726C] bg-[#F5F0E8] rounded-full px-2 py-0.5">
                    #{item.scheduleIndex}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>
      ) : (
        <Card className="text-center p-8 space-y-3">
          <EmptyScheduleIllustration className="w-28 h-28 mx-auto" />
          <p className="text-sm font-bold text-[#232724]">No medicines scheduled today</p>
          <p className="text-xs text-[#6B726C] max-w-xs mx-auto">
            This patient currently has no active dose times scheduled for today.
          </p>
        </Card>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CaregiverViewPage() {
  const queryClient = useQueryClient();
  const shouldReduceMotion = useReducedMotion();
  const [selectedPatient, setSelectedPatient] = useState(null);

  const { data: inviteData, isLoading: loadingInvites } = useQuery({
    queryKey: ['caregiver-invites'],
    queryFn:  fetchInvites,
  });

  const { data: patientData, isLoading: loadingPatients } = useQuery({
    queryKey: ['caregiver-patients'],
    queryFn:  fetchMyPatients,
  });

  const invites  = inviteData?.invites  ?? [];
  const patients = patientData?.patients ?? [];

  const acceptMut = useMutation({
    mutationFn: (id) => acceptInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['caregiver-invites']);
      queryClient.invalidateQueries(['caregiver-patients']);
      notify.success('Invite Accepted', 'You can now monitor this patient\'s daily dose schedule.');
    },
    onError: (err) => {
      notify.error('Accept Failed', err?.response?.data?.error || 'Failed to accept invitation.');
    },
  });
  const revokeMut = useMutation({
    mutationFn: (id) => revokeInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['caregiver-invites']);
      notify.info('Invite Declined', 'Caregiver invitation has been declined.');
    },
    onError: (err) => {
      notify.error('Action Failed', err?.response?.data?.error || 'Failed to decline invitation.');
    },
  });

  // Auto-select first patient
  const activePatient = selectedPatient ?? patients[0] ?? null;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* ── Pending Invites ────────────────────────────────────────────────── */}
      {(loadingInvites || invites.length > 0) && (
        <div className="space-y-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#232724]">
            Pending Invites ({invites.length})
          </h2>
          {loadingInvites ? (
            <Card className="p-5 flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-[#2B6E5E]" />
              <span className="text-sm text-[#6B726C]">Loading invites…</span>
            </Card>
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {invites.map((inv) => {
                  const isAccepting = acceptMut.isPending && acceptMut.variables === inv.connectionId;
                  const isDeclining = revokeMut.isPending && revokeMut.variables === inv.connectionId;
                  return (
                    <motion.div
                      key={inv.connectionId}
                      layout={!shouldReduceMotion}
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="p-4 space-y-3 border-l-[4px] border-l-[#E0824B]">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-[#E4F2E9] rounded-xl">
                            <Heart className="w-5 h-5 text-[#2B6E5E]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-[#232724]">Caregiver Invite</p>
                            <p className="text-[11px] text-[#6B726C]">
                              Patient (Age {inv.patientAge}) has invited you as a caregiver.
                              {inv.conditions?.length > 0 && ` Conditions: ${inv.conditions.join(', ')}.`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => acceptMut.mutate(inv.connectionId)}
                            disabled={isAccepting || isDeclining}
                            className="btn-primary flex-1 py-2.5 text-sm"
                          >
                            {isAccepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Accept
                          </button>
                          <button
                            onClick={() => revokeMut.mutate(inv.connectionId)}
                            disabled={isAccepting || isDeclining}
                            className="btn-outline-danger flex-1 py-2.5 text-sm"
                          >
                            {isDeclining ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            Decline
                          </button>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* ── Switch Patient Dropdown / Selector (if multiple linked patients) ── */}
      {patients.length > 1 && (
        <Card className="p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#8A6D3B]" />
            <span className="text-xs font-bold text-[#232724]">Active Patient:</span>
          </div>
          <select
            value={activePatient?.patientId || ''}
            onChange={(e) => {
              const selected = patients.find((p) => p.patientId === e.target.value);
              if (selected) setSelectedPatient(selected);
            }}
            className="input-field py-1.5 px-3 text-xs font-bold text-[#2B6E5E] bg-[#FDFBF7] cursor-pointer"
          >
            {patients.map((p) => (
              <option key={p.patientId} value={p.patientId}>
                Patient (Age {p.patientAge})
              </option>
            ))}
          </select>
        </Card>
      )}

      {/* ── Patient summary ── */}
      {loadingPatients ? (
        <div className="space-y-4">
          <div className="skeleton-shimmer-card p-8 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            </div>
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>
      ) : activePatient ? (
        <PatientSummaryCard
          patientId={activePatient.patientId}
          patientAge={activePatient.patientAge}
        />
      ) : invites.length === 0 ? (
        <Card className="p-10 flex flex-col items-center gap-4 text-center">
          <EmptyCaregiversIllustration className="w-36 h-36 mx-auto mb-1" />
          <div>
            <h3 className="text-lg font-bold text-[#232724]" style={{ fontFamily: "'Fraunces', serif" }}>
              No Linked Patients Yet
            </h3>
            <p className="text-sm text-[#6B726C] mt-1 max-w-xs leading-relaxed">
              Ask a patient to go to PolySafe → "Connected" → "Add Caregiver" and enter your registered mobile number.
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
