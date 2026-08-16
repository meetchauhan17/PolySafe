/**
 * DoctorDashboardPage.jsx — Doctor side
 * Route: /doctor-dashboard
 *
 * Step 1: Enter patient 6-digit code to claim the connection.
 * Step 2: Wait for patient approval (polls /connection/pending equivalent via /connection/mine).
 * Step 3: Once approved, show the patient's read-only Timeline + Risk Flags.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Stethoscope, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Clock,
  Pill, Leaf, ShoppingBag, AlertOctagon, CalendarDays, ChevronRight,
  Users, Shield, ShieldCheck, Info, TriangleAlert, Activity, Plus, Search,
} from 'lucide-react';
import Card from '../components/Card';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  EmptyDoctorPatientIllustration,
  EmptyDoctorListIllustration,
  EmptyMedicinesIllustration,
} from '../components/EmptyIllustrations';
import {
  DoctorPatientListSkeleton,
  DoctorPatientDetailSkeleton,
} from '../components/Skeletons';
import { notify } from '../utils/toast';

// ─── API helpers ──────────────────────────────────────────────────────────────
async function claimCode(code) {
  const { data } = await axios.post('/connection/claim-code', { code });
  return data;
}

async function fetchMyConnections() {
  const { data } = await axios.get('/connection/mine');
  return data;
}

async function fetchPatientTimeline(patientId) {
  const { data } = await axios.get(`/connection/doctor-patient/${patientId}/timeline`);
  return data;
}

// ─── Severity colours ─────────────────────────────────────────────────────────
const SEV_CFG = {
  Contraindicated: { badge: 'bg-red-100 text-red-800 border-red-200', dot: '#B23D25', variant: 'danger' },
  Major:           { badge: 'bg-rose-100 text-rose-800 border-rose-200', dot: '#B23D25', variant: 'danger' },
  Moderate:        { badge: 'bg-amber-100 text-amber-800 border-amber-200', dot: '#B5791A', variant: 'caution' },
  Minor:           { badge: 'bg-yellow-100 text-yellow-800 border-yellow-200', dot: '#A16207', variant: 'default' },
};

// ─── Prescribing Safety Check Panel ──────────────────────────────────────────
function PrescribingSafetyCheck({ patientId }) {
  const [drug, setDrug] = useState('');
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState('');

  const SEV_BADGE = {
    Major:           'bg-rose-100 text-rose-800 border-rose-200',
    Contraindicated: 'bg-red-100 text-red-800 border-red-200',
    Moderate:        'bg-amber-100 text-amber-800 border-amber-200',
    Minor:           'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    const trimmed = drug.trim();
    if (!trimmed) return;
    setChecking(true);
    setErr('');
    setResult(null);
    try {
      const { data } = await axios.post('/connection/doctor/prescribe-safety-check', {
        patientId,
        proposedMedicineName: trimmed,
      });
      setResult(data);
    } catch (error) {
      setErr(error?.response?.data?.error || 'Safety check failed. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-[#1B4B66]/10 rounded-xl flex-shrink-0">
          <Search className="w-4 h-4 text-[#1B4B66]" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#232724]">Prescribing Safety Check</p>
          <p className="text-[11px] text-[#6B726C]">Test a new drug against this patient's current medications</p>
        </div>
      </div>

      <form onSubmit={handleCheck} className="flex gap-2">
        <input
          type="text"
          value={drug}
          onChange={(e) => { setDrug(e.target.value); setErr(''); setResult(null); }}
          placeholder="e.g. Metformin, Atorvastatin…"
          className="input-field flex-1 text-sm py-2.5"
        />
        <button
          type="submit"
          disabled={!drug.trim() || checking}
          className="btn-primary px-4 py-2.5 text-sm flex items-center gap-1.5"
        >
          {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Check
        </button>
      </form>

      {err && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          {err}
        </div>
      )}

      {result && (
        <div className="space-y-2">
          {result.decision === 'SAFE' && (
            <div className="flex items-start gap-2.5 p-3.5 bg-[#E4F2E9] border border-[#2F8558]/30 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-[#2B6E5E] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#1A5C3A]">
                  {result.proposedDrug} — No interactions found
                </p>
                <p className="text-[11px] text-[#2B6E5E]/80 mt-0.5">{result.message}</p>
              </div>
            </div>
          )}
          {result.flags && result.flags.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#B23D25]">
                {result.flags.length} Interaction{result.flags.length !== 1 ? 's' : ''} Found for {result.proposedDrug}
              </p>
              {result.flags.map((ix, i) => (
                <div key={i} className="p-3 bg-[#FBE4DE]/60 border border-[#B23D25]/30 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#232724]">{result.proposedDrug} ↔ {ix.interactingDrug}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEV_BADGE[ix.severity] || SEV_BADGE.Minor}`}>
                      {ix.severity}
                    </span>
                  </div>
                  {ix.note && <p className="text-[11px] text-[#6B726C] leading-relaxed">{ix.note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}


function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Claim Code Panel ─────────────────────────────────────────────────────────
function ClaimPanel({ onSuccess }) {
  const [code, setCode]     = useState('');
  const [error, setError]   = useState('');

  const mutation = useMutation({
    mutationFn: claimCode,
    onSuccess: (data) => {
      notify.success('Access Request Sent', 'Waiting for patient to approve in their PolySafe app.');
      onSuccess(data);
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || 'Failed to claim code.';
      setError(msg);
      notify.error('Access Request Failed', msg);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const trimmed = code.replace(/\s/g, '');
    if (!/^\d{6}$/.test(trimmed)) {
      setError('Please enter a valid 6-digit code.');
      return;
    }
    mutation.mutate(trimmed);
  };

  return (
    <Card className="max-w-md mx-auto space-y-6">
      {/* Icon header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full bg-[#E4F2E9] border-2 border-[#2B6E5E]/30 flex items-center justify-center">
          <Stethoscope className="w-8 h-8 text-[#2B6E5E]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#232724]" style={{ fontFamily: "'Fraunces', serif" }}>
            Enter Patient Code
          </h2>
          <p className="text-xs text-[#6B726C] mt-1">
            Ask your patient to open PolySafe → "Share with Doctor" and give you their 6-digit code.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Code input */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-xs font-extrabold uppercase tracking-widest text-[#6B726C]">
            Patient 6-digit Code
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
              if (error) setError('');
            }}
            placeholder="000000"
            className={`input-field text-center text-3xl font-black tracking-[0.5em] py-5 ${error ? 'input-error' : ''}`}
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={code.length < 6 || mutation.isPending}
          className="btn-primary w-full py-4 text-base"
        >
          {mutation.isPending ? (
            <><Loader2 className="w-5 h-5 animate-spin" /><span>Connecting…</span></>
          ) : (
            <><Stethoscope className="w-5 h-5" /><span>Connect to Patient</span></>
          )}
        </button>
      </form>

      {/* Info */}
      <div className="flex items-start gap-2 p-3.5 bg-[#F5F0E8] border border-[#E7E1D3] rounded-xl">
        <Info className="w-4 h-4 text-[#6B726C] flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#6B726C] leading-relaxed">
          Once you enter the code, the patient will receive an approval request. You will gain read-only access to their medication timeline after they approve.
        </p>
      </div>
    </Card>
  );
}

// ─── Patient Timeline (read-only) ─────────────────────────────────────────────
function PatientView({ patientId }) {
  const shouldReduceMotion = useReducedMotion();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['doctor-patient-timeline', patientId],
    queryFn:  () => fetchPatientTimeline(patientId),
    retry: 1,
  });

  if (isLoading) {
    return <DoctorPatientDetailSkeleton />;
  }

  if (isError) {
    return (
      <Card variant="danger" className="h-full flex items-center gap-3 text-sm text-rose-700">
        <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
        <span>{error?.response?.data?.error || 'Failed to load patient data.'}</span>
      </Card>
    );
  }

  const medicines = data?.medicines ?? [];
  const flags     = data?.flags     ?? [];
  const patient   = data?.patient   ?? {};

  return (
    <div className="space-y-6">
      {/* Patient profile strip */}
      <Card className="p-4 flex flex-row items-center gap-4">
        <div className="p-3 rounded-xl bg-[#1B4B66]/10 border border-[#1B4B66]/20 flex-shrink-0">
          <Users className="w-6 h-6 text-[#1B4B66]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#232724]">Anonymous Patient Record</p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {patient.age    && <span className="text-xs text-[#6B726C]">Age: <strong>{patient.age}</strong></span>}
            {patient.conditions?.length > 0 && (
              <span className="text-xs text-[#6B726C]">Conditions: <strong>{patient.conditions.join(', ')}</strong></span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#2B6E5E] bg-[#E4F2E9] border border-[#2F8558]/30 px-2.5 py-1 rounded-full flex-shrink-0">
          <Shield className="w-3 h-3" />
          READ-ONLY
        </div>
      </Card>

      {/* Prescribing Safety Check */}
      <PrescribingSafetyCheck patientId={patientId} />

      {/* Active Risk Flags */}
      {flags.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#232724]">
            Active Risk Flags ({flags.length})
          </h3>
          {flags.map((f) => {
            const cfg = SEV_CFG[f.severity] ?? SEV_CFG.Moderate;
            return (
              <Card
                key={f.id}
                variant={cfg.variant}
                className="space-y-2"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
                    <AlertOctagon className="w-3.5 h-3.5" />
                    {f.severity}
                  </span>
                  <span className="text-xs text-[#9CA3AF]">{fmt(f.dateFlagged)}</span>
                </div>
                <p className="text-sm font-bold text-[#232724]">
                  {f.medicineA?.name} ↔ {f.medicineB?.name}
                </p>
                {f.clinicalExplanation && (
                  <p className="text-xs text-[#6B726C] leading-relaxed">{f.clinicalExplanation}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Medication Timeline */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#232724]">
          Medication Timeline ({medicines.length})
        </h3>

        {medicines.length === 0 ? (
          <Card className="p-8 text-center space-y-3">
            <EmptyMedicinesIllustration className="w-28 h-28 mx-auto" />
            <p className="text-sm font-bold text-[#232724]">No medicines on record</p>
            <p className="text-xs text-[#6B726C] max-w-xs mx-auto">
              This patient has not logged any prescription, OTC, or herbal medicines yet.
            </p>
          </Card>
        ) : (
          <div className="relative pl-2 py-2">
            {/* Vertical line with animated draw-down */}
            <motion.div
              className="absolute left-[19px] top-4 bottom-6 w-[3px] z-0 rounded-full origin-top"
              style={{ backgroundColor: '#E0824B' }}
              initial={shouldReduceMotion ? { scaleY: 1 } : { scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: 'easeOut' }}
            />
            <div className="space-y-5">
              {medicines.map((med, index) => {
                const typeIcon = med.type === 'HERBAL'
                  ? <Leaf className="w-3.5 h-3.5 text-[#2B6E5E]" />
                  : med.type === 'OTC'
                  ? <ShoppingBag className="w-3.5 h-3.5 text-[#8A6D3B]" />
                  : <Pill className="w-3.5 h-3.5 text-[#1B4B66]" />;

                return (
                  <motion.div
                    key={med.id}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.25,
                      delay: shouldReduceMotion ? 0 : index * 0.05,
                      ease: [0.25, 1, 0.5, 1],
                    }}
                    className="relative z-10 flex items-start gap-4"
                  >
                    {/* Dot */}
                    <div
                      className="w-10 h-10 rounded-full bg-white border-[3px] flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{
                        borderColor: med.flagged ? '#B23D25' : '#2B6E5E',
                      }}
                    >
                      {typeIcon}
                    </div>

                    {/* Entry card */}
                    <Card
                      variant={med.flagged ? 'danger' : 'default'}
                      className="flex-1"
                    >
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex-1 min-w-0">
                          {/* Source label */}
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#2B6E5E]">
                            {med.addedByLabel || 'Self-logged'} · {med.type}
                          </p>
                          {/* Medicine name + dose */}
                          <p className="text-base font-bold text-[#232724] mt-0.5">
                            {med.name}
                            {med.dosage && (
                              <span className="text-sm font-normal text-[#6B726C] ml-2">({med.dosage})</span>
                            )}
                          </p>
                        </div>
                        <span className="text-xs text-[#9CA3AF] font-semibold">{fmt(med.dateAdded)}</span>
                      </div>

                      {/* Flag note */}
                      {med.flagged && med.flags?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {med.flags.map((flag) => (
                            <span
                              key={flag.id}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full mr-2"
                            >
                              <AlertOctagon className="w-3 h-3 text-rose-500" />
                              Flagged with {flag.partnerName} ({flag.severity})
                            </span>
                          ))}
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Lightweight 3D Tilt Card for Patient List ──────────────────────────────
function PatientTiltCard({ children, isSelected, onClick }) {
  const shouldReduceMotion = useReducedMotion();
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, z: 0 });

  const handleMouseMove = (e) => {
    if (shouldReduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Max 4.5 degree subtle rotation
    const rotateX = ((y - centerY) / centerY) * -4.5;
    const rotateY = ((x - centerX) / centerX) * 4.5;

    setTilt({ rotateX, rotateY, z: 6 });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, z: 0 });
  };

  return (
    <div
      style={{ perspective: 800 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="cursor-pointer"
    >
      <div
        style={{
          transform: shouldReduceMotion
            ? undefined
            : `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateZ(${tilt.z}px)`,
          transformStyle: 'preserve-3d',
          transition: 'transform 160ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <Card
          className={`p-4 transition-all duration-200 ${
            isSelected
              ? 'bg-[#EDE8DC] shadow-[inset_4px_4px_8px_rgba(191,180,155,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.7)] ring-2 ring-[#2B6E5E]'
              : 'hover:shadow-[12px_12px_20px_rgba(191,180,155,0.65),-12px_-12px_20px_rgba(255,255,255,0.75)]'
          }`}
        >
          {children}
        </Card>
      </div>
    </div>
  );
}

// ─── Doctor Connections Sidebar / List ────────────────────────────────────────
function ConnectionsList({ onSelect, selectedId }) {
  const shouldReduceMotion = useReducedMotion();
  const { data, isLoading } = useQuery({
    queryKey: ['doctor-connections'],
    queryFn:  fetchMyConnections,
    refetchInterval: 15000,
  });
  const connections = data?.connections ?? [];

  if (isLoading) {
    return <DoctorPatientListSkeleton />;
  }

  if (connections.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-[#5C6B64] bg-[#EDE8DC] shadow-[inset_3px_3px_6px_rgba(191,180,155,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.6)] rounded-[32px] space-y-2">
        <EmptyDoctorListIllustration className="w-20 h-20 mx-auto" />
        <div>
          <p className="font-bold text-[#1C2B27]">No approved patients yet</p>
          <p className="mt-1 leading-relaxed text-[11px]">
            Click "+ Enter Code" above to link a patient via their 6-digit access code.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <AnimatePresence initial={false}>
        {connections.map((c) => {
          const isSelected = selectedId === c.connectionId;
          return (
            <motion.div
              key={c.connectionId}
              layout={!shouldReduceMotion}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <PatientTiltCard
                isSelected={isSelected}
                onClick={() => onSelect(c.patientId, c.connectionId)}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-2xl transition-colors ${isSelected ? 'bg-[#2B6E5E] text-white shadow-sm' : 'icon-well w-8 h-8'}`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#1C2B27] truncate">Anonymous Patient</p>
                    <p className="text-[10px] text-[#5C6B64]">
                      Age {c.patientAge || '—'} · {c.recentMeds?.length ?? 0} active meds
                    </p>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-[#2B6E5E] translate-x-0.5' : 'text-[#9CA3AF]'}`} />
                </div>
              </PatientTiltCard>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function DoctorDashboardPage() {
  const queryClient = useQueryClient();
  const shouldReduceMotion = useReducedMotion();

  const [step, setStep]       = useState('list');  // 'list' | 'claim' | 'claimed' | 'viewing'
  const [selectedPatient, setSelectedPatient] = useState(null);  // { patientId, connectionId }

  const handleClaimSuccess = () => {
    setStep('claimed');
    queryClient.invalidateQueries(['doctor-connections']);
  };

  const handleSelectPatient = (patientId, connectionId) => {
    setSelectedPatient({ patientId, connectionId });
    setStep('viewing');
  };

  return (
    <div className="py-6 px-4 md:px-6 max-w-7xl mx-auto space-y-6">
      {/* ── Step: Claim Code Modal/Panel ── */}
      {step === 'claim' && (
        <div className="max-w-xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#232724]" style={{ fontFamily: "'Fraunces', serif" }}>
              Link Patient Record
            </h2>
            <button
              onClick={() => setStep('list')}
              className="btn-secondary py-1.5 px-3 text-xs"
            >
              Cancel
            </button>
          </div>
          <ClaimPanel onSuccess={handleClaimSuccess} />
        </div>
      )}

      {/* ── Step: Code claimed, waiting for patient approval ── */}
      {step === 'claimed' && (
        <Card className="max-w-md mx-auto text-center space-y-5 p-8">
          <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-[#E0824B]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#232724]" style={{ fontFamily: "'Fraunces', serif" }}>
              Waiting for Patient Approval
            </h2>
            <p className="text-sm text-[#6B726C] mt-2 leading-relaxed">
              Your connection request has been sent. The patient will receive an approval prompt in their PolySafe app. Once approved, they will appear in your patient list.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-[#2B6E5E]"
                style={{ animation: `pulse-dot 1.4s ease-in-out ${i * 0.16}s infinite` }}
              />
            ))}
          </div>
          <button
            onClick={() => { setStep('list'); queryClient.invalidateQueries(['doctor-connections']); }}
            className="btn-primary w-full py-3"
          >
            <Users className="w-4 h-4" />
            <span>Check My Patients</span>
          </button>
        </Card>
      )}

      {/* ── Step: Patient list + viewer (Side-by-Side Unified Grid Layout) ── */}
      {(step === 'list' || step === 'viewing') && (
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
          {/* Sidebar: Approved Patients Card (Sticky on desktop) */}
          <div className="lg:sticky lg:top-[88px] space-y-4">
            <Card
              title="My Patients"
              subtitle="Consent-based clinical records"
              icon={<Users className="w-4 h-4 text-[#2B6E5E]" />}
              className="p-5"
            >
              <div className="space-y-4">
                {/* Pinned "+ Enter Code" Button */}
                <button
                  onClick={() => setStep('claim')}
                  className="btn-primary w-full py-2.5 text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Enter Patient Code</span>
                </button>

                <div className="border-t border-[#E7E1D3] pt-3">
                  <div className="max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                    <ConnectionsList
                      onSelect={handleSelectPatient}
                      selectedId={selectedPatient?.connectionId}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Main: Animated Patient Details or Clean Empty State */}
          <div className="min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              {step === 'viewing' && selectedPatient ? (
                <motion.div
                  key={selectedPatient.patientId}
                  initial={shouldReduceMotion ? false : { opacity: 0, x: 14, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, x: -14, filter: 'blur(2px)' }}
                  transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
                >
                  <PatientView patientId={selectedPatient.patientId} />
                </motion.div>
              ) : (
                <motion.div
                  key="no-patient-selected"
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="flex flex-col items-center justify-center p-12 text-center py-16 bg-white/80 backdrop-blur-sm space-y-4">
                    <EmptyDoctorPatientIllustration className="w-36 h-36 mx-auto mb-1" />
                    <div>
                      <h3
                        className="text-xl font-bold text-[#232724]"
                        style={{ fontFamily: "'Fraunces', serif" }}
                      >
                        Select a Patient Record
                      </h3>
                      <p className="text-sm text-[#6B726C] mt-1.5 max-w-sm mx-auto leading-relaxed">
                        Choose an approved patient from the left panel to review their complete medication timeline, active pharmacology risk flags, and cross-prescribing cascade insights.
                      </p>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
