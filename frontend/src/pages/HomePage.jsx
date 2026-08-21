import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  CheckCircle2,
  AlertTriangle,
  Pill,
  Clock,
  Plus,
  ArrowRight,
  Activity,
  Loader2,
  AlertCircle,
  RefreshCw,
  Stethoscope,
  Leaf,
  ShoppingBag,
  FlaskConical,
  Users,
  QrCode,
  TrendingUp,
  Lock,
  Bell,
  BellRing,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { patientApi } from '../api/auth';
import Card from '../components/Card';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { EmptyMedicinesIllustration } from '../components/EmptyIllustrations';
import { HomeSkeleton } from '../components/Skeletons';
import { useAuth } from '../context/AuthContext';
import { notify } from '../utils/toast';
import { DrugHarmBadge, DrugHarmPanel, PolypharmacyHarmDashboard } from '../components/DrugHarmLevel';

// ─── Severity colour map ─────────────────────────────────────────────────────
const SEVERITY_STYLES = {
  CONTRAINDICATED: {
    border: 'border-red-400',
    bg: 'bg-red-50',
    badge: 'bg-red-100 text-red-800 border-red-200',
    icon: <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />,
    dot: 'bg-red-500',
  },
  MAJOR: {
    border: 'border-orange-400',
    bg: 'bg-orange-50',
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />,
    dot: 'bg-orange-500',
  },
  MODERATE: {
    border: 'border-amber-400',
    bg: 'bg-amber-50',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
    dot: 'bg-amber-400',
  },
  MINOR: {
    border: 'border-yellow-300',
    bg: 'bg-yellow-50',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />,
    dot: 'bg-yellow-400',
  },
};

// ─── Medicine type icon/badge ─────────────────────────────────────────────
function MedicineTypeBadge({ type }) {
  const map = {
    PRESCRIPTION: { icon: <Stethoscope className="w-3 h-3" />, label: 'Rx', cls: 'bg-[#1B4B66]/10 text-[#1B4B66] border-[#1B4B66]/20' },
    OTC:          { icon: <ShoppingBag className="w-3 h-3" />, label: 'OTC', cls: 'bg-[#8A6D3B]/10 text-[#8A6D3B] border-[#8A6D3B]/20' },
    HERBAL:       { icon: <Leaf className="w-3 h-3" />, label: 'Herbal', cls: 'bg-[#2B6E5E]/10 text-[#2B6E5E] border-[#2B6E5E]/20' },
  };
  const t = map[type] ?? map.PRESCRIPTION;
  return (
    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${t.cls}`}>
      {t.icon}
      <span>{t.label}</span>
    </span>
  );
}

// ─── Demo/mock data shown when not logged in (no token) ─────────────────────
const DEMO_DATA = {
  status: 'CAUTION',
  medicines: [
    { id: 'd1', name: 'Warfarin', type: 'PRESCRIPTION', dosage: '5mg', category: 'Anticoagulant (Blood Thinner)', dateAdded: new Date().toISOString() },
    { id: 'd2', name: 'Aspirin', type: 'OTC', dosage: '81mg', category: 'Antiplatelet / NSAID', dateAdded: new Date().toISOString() },
    { id: 'd3', name: 'Lisinopril', type: 'PRESCRIPTION', dosage: '10mg', category: 'ACE Inhibitor (Antihypertensive)', dateAdded: new Date().toISOString() },
    { id: 'd4', name: 'Turmeric (Curcumin)', type: 'HERBAL', dosage: '500mg', category: 'Herbal Supplement', dateAdded: new Date().toISOString() },
  ],
  schedule: [
    { medicineId: 'd1', name: 'Warfarin', dosage: '5mg', type: 'PRESCRIPTION', time: '08:00 AM' },
    { medicineId: 'd2', name: 'Aspirin', dosage: '81mg', type: 'OTC', time: '12:00 PM' },
    { medicineId: 'd3', name: 'Lisinopril', dosage: '10mg', type: 'PRESCRIPTION', time: '06:00 PM' },
    { medicineId: 'd4', name: 'Turmeric (Curcumin)', dosage: '500mg', type: 'HERBAL', time: '09:00 PM' },
  ],
  flags: [
    {
      id: 'f1',
      severity: 'MAJOR',
      medicineA: { id: 'd1', name: 'Warfarin', type: 'PRESCRIPTION' },
      medicineB: { id: 'd4', name: 'Turmeric (Curcumin)', type: 'HERBAL' },
      plainExplanation: 'Turmeric may enhance Warfarin\'s blood-thinning effect, significantly increasing bleeding risk.',
      clinicalExplanation: 'Curcumin inhibits platelet aggregation and CYP2C9-mediated warfarin metabolism, elevating INR.',
      dateFlagged: new Date().toISOString(),
    },
    {
      id: 'f2',
      severity: 'MODERATE',
      medicineA: { id: 'd1', name: 'Warfarin', type: 'PRESCRIPTION' },
      medicineB: { id: 'd2', name: 'Aspirin', type: 'OTC' },
      plainExplanation: 'Taking Aspirin with Warfarin increases gastrointestinal bleeding risk.',
      clinicalExplanation: 'Combined anticoagulant + antiplatelet therapy raises haemorrhagic risk; monitor INR closely.',
      dateFlagged: new Date().toISOString(),
    },
  ],
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function HomePage() {
  const queryClient = useQueryClient();
  const shouldReduceMotion = useReducedMotion();
  const { token, user, isGuest, openGuestLockModal } = useAuth();

  // State for Edit / Discontinue modals
  const [editingMed, setEditingMed] = useState(null);
  const [discontinuingMed, setDiscontinuingMed] = useState(null);
  const [remindersEnabled, setRemindersEnabled] = useState(() => {
    try { return localStorage.getItem('polysafe_reminders') === 'true'; } catch { return false; }
  });

  const handleToggleAllReminders = () => {
    if (isGuest) {
      openGuestLockModal('medication reminders');
      return;
    }
    setRemindersEnabled((prev) => {
      const next = !prev;
      try { localStorage.setItem('polysafe_reminders', String(next)); } catch {}
      if (next) {
        notify.success('Reminders Activated', 'Daily dose notifications are now active.');
      } else {
        notify.info('Reminders Paused', 'Medication reminders have been paused.');
      }
      return next;
    });
  };
  const [remindedDoses, setRemindedDoses] = useState({});

  const handleToggleDoseReminder = (doseKey, medicineName, time) => {
    if (isGuest) {
      openGuestLockModal('set individual dose reminders');
      return;
    }
    setRemindedDoses((prev) => {
      const next = { ...prev, [doseKey]: !prev[doseKey] };
      if (next[doseKey]) {
        notify.success('Dose Reminder Set', `You'll be reminded to take ${medicineName} at ${time}.`);
      } else {
        notify.info('Reminder Cleared', `Reminder for ${medicineName} at ${time} removed.`);
      }
      return next;
    });
  };

  const {
    data: summary,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['home-summary', token],
    queryFn: () => patientApi.getHomeSummary(token),
    enabled: !!token && !user?.isGuest,
    staleTime: 30_000,
  });

  // ─── Mutations for Edit & Discontinue ──────────────────────────────────────
  const editMutation = useMutation({
    mutationFn: ({ id, dosage, type }) =>
      axios.put(`/medicine/${id}`, { dosage, type }),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['home-summary'] });
      queryClient.invalidateQueries({ queryKey: ['patient-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['patient-insights'] });
      setEditingMed(null);
      notify.success('Medicine Updated', `Updated settings for "${vars.name || 'medicine'}".`);
    },
    onError: (err) => {
      notify.error('Update Failed', err?.response?.data?.error || 'Could not update medicine.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`/medicine/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-summary'] });
      queryClient.invalidateQueries({ queryKey: ['patient-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['patient-insights'] });
      setDiscontinuingMed(null);
      notify.success('Medicine Discontinued', 'Marked as discontinued and preserved on your timeline.');
    },
    onError: (err) => {
      notify.error('Discontinue Failed', err?.response?.data?.error || 'Could not discontinue medicine.');
    },
  });

  // Use real data when authenticated, demo data otherwise
  const isDemo = !token || user?.isGuest;
  const data = isDemo ? DEMO_DATA : (summary || DEMO_DATA);

  if (isLoading) {
    return <HomeSkeleton />;
  }

  if (isError && token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[var(--brand-clay)] px-4">
        <div className="polysafe-card p-8 max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-[#1C2B27]">Couldn't load your data</h2>
          <p className="text-sm text-[#5C6B64]">
            {error?.response?.data?.error || 'Something went wrong. Please try again.'}
          </p>
          <button onClick={() => refetch()} className="btn-primary px-6 py-2.5 text-sm mx-auto">
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const medicines = data?.medicines ?? [];
  const schedule = data?.schedule ?? [];
  const flags = data?.flags ?? [];
  const status = data?.status ?? 'SAFE';
  const isEmpty = medicines.length === 0;

  const todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="bg-[var(--brand-clay)] min-h-[88vh] pb-28 md:pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Demo mode banner ─────────────────────────────────────────────── */}
        {isDemo && (
          <div className="flex items-start space-x-3 p-3.5 bg-[#2B6E5E]/10 border border-[#2B6E5E]/20 rounded-2xl text-xs text-[#2B6E5E] shadow-sm">
            <FlaskConical className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Demo Mode</strong> — this is a sample data preview. <Link to="/login" className="underline font-bold">Sign in</Link> to see your real medication summary.
            </p>
          </div>
        )}

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1C2B27]">My Dashboard</h1>
            <p className="text-xs text-[#5C6B64] mt-0.5">{todayLabel}</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading || !token}
            className="btn-secondary p-2.5 rounded-2xl disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            EMPTY STATE — no medicines yet
           ═══════════════════════════════════════════════════════════════════ */}
        {isEmpty ? (
          <Card className="p-10 flex flex-col items-center text-center space-y-5">
            <EmptyMedicinesIllustration className="w-36 h-36 mx-auto mb-1" />
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-[#232724]" style={{ fontFamily: "'Fraunces', serif" }}>
                No medicines yet
              </h2>
              <p className="text-sm text-[#6B726C] max-w-xs mx-auto leading-relaxed">
                Add your first medicine to get started — PolySafe will begin checking for dangerous
                interactions across all your prescriptions.
              </p>
            </div>
            <Link to="/add-medicine" className="btn-primary px-8 py-3.5 text-base">
              <Plus className="w-5 h-5" />
              <span>Add Your First Medicine</span>
            </Link>
          </Card>
        ) : (
          <>
            {/* ═══════════════════════════════════════════════════════════════
                POLYPHARMACY RISK OVERVIEW (Harm Level Dashboard)
               ═══════════════════════════════════════════════════════════════ */}
            <PolypharmacyHarmDashboard
              medicines={medicines}
              flags={flags}
              regimenRisk={data?.regimenRisk}
            />

            {/* ═══════════════════════════════════════════════════════════════
                STATUS CARD — SAFE or CAUTION
               ═══════════════════════════════════════════════════════════════ */}
            {status === 'SAFE' ? (
              <Card
                variant="safe"
                className="flex-row items-start space-x-4 bg-[#E4F2E9]/40"
              >
                <div className="flex-shrink-0 p-2.5 rounded-full bg-[#CCE9D6] border border-[#2F8558]/30 shadow-inner">
                  <CheckCircle2 className="w-7 h-7 text-[#2F8558]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-[#1A5C3A]" style={{ fontFamily: "'Fraunces', serif" }}>
                      No Interactions Detected
                    </span>
                    <span className="text-[10px] font-bold bg-[#2F8558] text-white px-2.5 py-0.5 rounded-full">
                      SAFE
                    </span>
                  </div>
                  <p className="text-sm text-[#2A6945] mt-0.5 leading-snug">
                    All {medicines.length} medicine{medicines.length !== 1 ? 's' : ''} in your list have been checked — no harmful interactions found.
                  </p>
                  <p className="text-[11px] text-[#2A6945]/70 mt-1.5">
                    Always inform your doctor when starting a new medication or supplement.
                  </p>
                </div>
              </Card>
            ) : (
              <Card
                variant="caution"
                className="flex-row items-start space-x-4 bg-[#FBEED9]/40"
              >
                <div className="flex-shrink-0 p-2.5 rounded-full bg-[#F5E2C4] border border-[#B5791A]/30 shadow-inner animate-breathe-caution">
                  <AlertTriangle className="w-7 h-7 text-[#B5791A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    <span className="text-lg font-bold text-[#7A4A0A]" style={{ fontFamily: "'Fraunces', serif" }}>
                      {flags.length} Interaction{flags.length !== 1 ? 's' : ''} Flagged
                    </span>
                    <span className="text-[10px] font-bold bg-[#B5791A] text-white px-2.5 py-0.5 rounded-full">
                      CAUTION
                    </span>
                  </div>
                  <p className="text-sm text-[#8A5210] mt-0.5 leading-snug">
                    Potential drug interactions detected in your medication list. Review the flags below and consult your doctor.
                  </p>
                </div>
              </Card>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                TODAY'S SCHEDULE
               ═══════════════════════════════════════════════════════════════ */}
            <Card
              title="Today's Schedule"
              icon={<Clock className="w-4 h-4 text-[#2B6E5E]" />}
              badge={
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleToggleAllReminders}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center space-x-1.5 transition-all duration-180 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6E5E] active:scale-95 active:opacity-80 ${
                      remindersEnabled
                        ? 'bg-[#2B6E5E] text-white border-[#2B6E5E]'
                        : 'bg-[#E4F2E9] text-[#2B6E5E] border-[#2B6E5E]/20 hover:bg-[#2B6E5E] hover:text-white'
                    }`}
                  >
                    {remindersEnabled ? (
                      <>
                        <BellRing className="w-3 h-3 text-white animate-pulse" />
                        <span>Reminding Active</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-3 h-3 text-[#2B6E5E]" />
                        <span>Remind Me</span>
                      </>
                    )}
                  </button>
                  <span className="text-[11px] font-bold text-[#6B726C] bg-[#EFEBE0] px-2.5 py-1 rounded-lg">
                    {schedule.length} dose{schedule.length !== 1 ? 's' : ''}
                  </span>
                </div>
              }
              className="space-y-4"
            >
              <div className="space-y-2.5">
                <AnimatePresence initial={false}>
                  {schedule.map((item, i) => {
                    const doseKey = `${item.medicineId}-${item.time}-${i}`;
                    const isDoseReminded = remindersEnabled || remindedDoses[doseKey];

                    return (
                      <motion.div
                        key={item.medicineId + i}
                        layout={!shouldReduceMotion}
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center space-x-3.5 p-3.5 rounded-2xl bg-[var(--brand-clay)] shadow-[4px_4px_8px_rgba(191,180,155,0.45),-4px_-4px_8px_rgba(255,255,255,0.60)] transition-all"
                      >
                        {/* Time bubble */}
                        <div className="flex-shrink-0 w-16 text-center">
                          <span className="text-[11px] font-bold text-[#2B6E5E] bg-[var(--brand-clay)] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.6)] px-2 py-1 rounded-xl block leading-snug font-mono">
                            {item.time}
                          </span>
                        </div>

                        {/* Divider dot */}
                        <div className="w-1.5 h-1.5 rounded-full bg-[#BFB49B] flex-shrink-0" />

                        {/* Medicine info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#1C2B27] truncate">{item.name}</p>
                          <p className="text-[11px] text-[#5C6B64] font-mono">{item.dosage}</p>
                        </div>

                        <MedicineTypeBadge type={item.type} />

                        {/* Individual Dose Remind Me Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleDoseReminder(doseKey, item.name, item.time)}
                          title={isDoseReminded ? 'Reminder active - click to mute' : 'Click to set dose reminder'}
                          className={`p-2 rounded-xl text-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6E5E] active:scale-95 active:opacity-80 ${
                            isDoseReminded
                              ? 'bg-[#2B6E5E] text-white shadow-sm'
                              : 'bg-[var(--brand-clay)] text-[#5C6B64] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] hover:text-[#2B6E5E]'
                          }`}
                        >
                          {isDoseReminded ? (
                            <BellRing className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <Bell className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </Card>

            {/* ═══════════════════════════════════════════════════════════════
                ACTIVE MEDICINES LIST
               ═══════════════════════════════════════════════════════════════ */}
            <Card
              title="Active Medicines"
              icon={<Pill className="w-4 h-4 text-[#2B6E5E]" />}
              badge={
                <span className="text-[11px] font-bold text-[#5C6B64] bg-[var(--brand-clay)] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.45),inset_-2px_-2px_4px_rgba(255,255,255,0.6)] px-2.5 py-1 rounded-xl">
                  {medicines.length} total
                </span>
              }
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence initial={false}>
                  {medicines.map((med) => (
                    <motion.div
                      key={med.id}
                      layout={!shouldReduceMotion}
                      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 rounded-2xl bg-[var(--brand-clay)] shadow-[4px_4px_8px_rgba(191,180,155,0.45),-4px_-4px_8px_rgba(255,255,255,0.60)] space-y-2.5 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-1 flex-wrap">
                          <div className="flex-1 min-w-0 pr-1">
                            <p className="text-sm font-bold text-[#1C2B27] leading-tight truncate">
                              {med.name}
                            </p>
                            {med.generic && med.generic.toLowerCase() !== med.name.toLowerCase() && (
                              <p className="text-[10px] text-[#5C6B64] truncate">
                                {med.generic}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <DrugHarmBadge category={med.category} name={med.name} flags={flags} />
                            <MedicineTypeBadge type={med.type} />
                          </div>
                        </div>

                        {med.dosage && (
                          <p className="text-[11px] text-[#5C6B64] font-mono">{med.dosage}</p>
                        )}

                        {/* Interactive Drug Harm & Side Effects Panel */}
                        <DrugHarmPanel medicine={med} flags={flags} className="mt-1" />

                        {med.safetyTip && (
                          <p className="text-[10px] text-[#5C6B64] bg-[var(--brand-sub-surface)] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] p-2.5 rounded-xl border border-[rgba(191,180,155,0.3)] leading-tight">
                            💡 {med.safetyTip}
                          </p>
                        )}

                        <p className="text-[10px] text-[#5C6B64]/70">
                          Added {new Date(med.dateAdded).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>

                      {/* Edit & Discontinue Action Bar */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(191,180,155,0.35)]">
                        <button
                          type="button"
                          onClick={() => {
                            if (isGuest) {
                              openGuestLockModal('edit medication dosage and type');
                              return;
                            }
                            setEditingMed(med);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-[#2B6E5E] bg-[#EDE8DC] shadow-[2px_2px_5px_rgba(191,180,155,0.5),-2px_-2px_5px_rgba(255,255,255,0.6)] hover:shadow-[3px_3px_7px_rgba(191,180,155,0.6),-3px_-3px_7px_rgba(255,255,255,0.7)] active:shadow-[inset_2px_2px_4px_rgba(191,180,155,0.5)] rounded-xl transition-all cursor-pointer"
                          title="Edit dosage or type"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (isGuest) {
                              openGuestLockModal('discontinue medication');
                              return;
                            }
                            setDiscontinuingMed(med);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-[#B23D25] bg-[#EDE8DC] shadow-[2px_2px_5px_rgba(191,180,155,0.5),-2px_-2px_5px_rgba(255,255,255,0.6)] hover:bg-rose-50 hover:shadow-[3px_3px_7px_rgba(191,180,155,0.6),-3px_-3px_7px_rgba(255,255,255,0.7)] active:shadow-[inset_2px_2px_4px_rgba(191,180,155,0.5)] rounded-xl transition-all cursor-pointer"
                          title="Discontinue medicine"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Discontinue</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </Card>

            {/* ═══════════════════════════════════════════════════════════════
                RECENT FLAGS — only shown when flags exist
               ═══════════════════════════════════════════════════════════════ */}
            {flags.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-base font-bold text-[#232724] flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-orange-500" />
                  <span>Recent Interaction Flags</span>
                  <span className="ml-1 text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full">
                    {flags.length}
                  </span>
                </h2>

                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {flags.map((flag) => {
                      const sevKey = flag.severity?.toUpperCase() ?? 'MODERATE';
                      const styles = SEVERITY_STYLES[sevKey] ?? SEVERITY_STYLES.MODERATE;
                      const variant = sevKey === 'CONTRAINDICATED' || sevKey === 'MAJOR'
                        ? 'danger'
                        : sevKey === 'MODERATE'
                        ? 'caution'
                        : 'default';

                      return (
                        <motion.div
                          key={flag.id}
                          layout={!shouldReduceMotion}
                          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card
                            variant={variant}
                            className="space-y-3"
                          >
                            {/* Flag header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center space-x-2">
                                {styles.icon}
                                <div>
                                    <div className="flex items-center flex-wrap gap-1.5">
                                      <span className="text-sm font-bold text-[#232724]">
                                        {flag.medicineA?.name || 'Medicine A'}
                                      </span>
                                      <span className="text-xs text-[#6B726C] font-medium">+</span>
                                      <span className="text-sm font-bold text-[#232724]">
                                        {flag.medicineB?.name || 'Medicine B'}
                                      </span>
                                    </div>
                                  <p className="text-[11px] text-[#6B726C] mt-0.5">
                                    Flagged {new Date(flag.dateFlagged).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border flex-shrink-0 ${styles.badge}`}>
                                {flag.severity}
                              </span>
                            </div>

                            {/* Plain explanation */}
                            <div className="bg-[var(--brand-paper)] rounded-xl p-3.5 border border-[var(--brand-border-subtle)]">
                              <p className="text-xs font-semibold text-[#232724] leading-relaxed">
                                {flag.plainExplanation}
                              </p>
                            </div>

                            {/* Action link */}
                            <Link
                              to={`/risk/${flag.id}`}
                              className="inline-flex items-center space-x-1 text-xs font-bold text-[#2B6E5E] hover:underline"
                            >
                              <span>View full clinical explanation</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Quick nav: log symptom + view timeline + insights + connected people + share with doctor */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <Link
                to="/log-symptom"
                onClick={(e) => {
                  if (isGuest) {
                    e.preventDefault();
                    openGuestLockModal('log symptoms');
                  }
                }}
                className="btn-secondary py-3 text-xs sm:text-sm justify-center relative"
              >
                <Activity className="w-4 h-4 text-orange-500" />
                <span>Log Symptom</span>
                {isGuest && <Lock className="w-3 h-3 text-[#8A6D3B] ml-1" />}
              </Link>
              <Link
                to="/timeline"
                className="btn-secondary py-3 text-xs sm:text-sm justify-center"
              >
                <Clock className="w-4 h-4 text-[#2B6E5E]" />
                <span>Timeline</span>
              </Link>
              <Link
                to="/insights"
                className="btn-secondary py-3 text-xs sm:text-sm justify-center bg-[#E4F2E9]/30 border-[#2B6E5E]/30 text-[#2B6E5E]"
              >
                <TrendingUp className="w-4 h-4 text-[#2B6E5E]" />
                <span>Insights</span>
              </Link>
              <Link
                to="/connected-people"
                className="btn-secondary py-3 text-xs sm:text-sm justify-center"
              >
                <Users className="w-4 h-4 text-[#8A6D3B]" />
                <span>Connected</span>
              </Link>
              <Link
                to="/share-with-doctor"
                onClick={(e) => {
                  if (isGuest) {
                    e.preventDefault();
                    openGuestLockModal('generate clinical share codes');
                  }
                }}
                className="btn-secondary py-3 text-xs sm:text-sm justify-center sm:col-span-2 relative"
              >
                <QrCode className="w-4 h-4 text-[#1B4B66]" />
                <span>Doctor QR Share</span>
                {isGuest && <Lock className="w-3 h-3 text-[#8A6D3B] ml-1" />}
              </Link>
            </div>
          </>
        )}

        {/* ─── Edit Medicine Modal ─── */}
        <EditMedicineModal
          med={editingMed}
          isOpen={!!editingMed}
          onClose={() => setEditingMed(null)}
          onSave={(vars) => editMutation.mutate(vars)}
          isPending={editMutation.isPending}
        />

        {/* ─── Discontinue Medicine Modal ─── */}
        <DiscontinueMedicineModal
          med={discontinuingMed}
          isOpen={!!discontinuingMed}
          onClose={() => setDiscontinuingMed(null)}
          onConfirm={(id) => deleteMutation.mutate(id)}
          isPending={deleteMutation.isPending}
        />
      </div>
    </div>
  );
}

// ─── Sub-Component: Edit Medicine Modal ──────────────────────────────────────
function EditMedicineModal({ med, isOpen, onClose, onSave, isPending }) {
  const [dosage, setDosage] = useState('');
  const [type, setType] = useState('PRESCRIPTION');

  // Sync state when editingMed changes
  React.useEffect(() => {
    if (med) {
      setDosage(med.dosage || '');
      setType(med.type || 'PRESCRIPTION');
    }
  }, [med]);

  if (!isOpen || !med) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ id: med.id, name: med.name, dosage, type });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="polysafe-card p-6 max-w-md w-full bg-[#EDE8DC] space-y-4 shadow-[12px_12px_24px_rgba(191,180,155,0.7),-12px_-12px_24px_rgba(255,255,255,0.8)] border-transparent rounded-[32px]">
        <div className="flex items-center justify-between border-b border-[rgba(191,180,155,0.35)] pb-3">
          <div className="flex items-center gap-2">
            <div className="icon-well w-9 h-9">
              <Pill className="w-4 h-4 text-[#2B6E5E]" />
            </div>
            <h2 className="text-lg font-bold text-[#1C2B27]" style={{ fontFamily: "'Fraunces', serif" }}>
              Edit Medication
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-[#5C6B64] hover:text-[#1C2B27] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drug Name (Fixed) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#5C6B64] uppercase tracking-wider">Medicine Name</label>
            <div className="p-3.5 bg-[#EDE8DC] rounded-2xl shadow-[inset_3px_3px_6px_rgba(191,180,155,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.6)] text-sm font-bold text-[#1C2B27]">
              {med.name}
            </div>
            <p className="text-[11px] text-[#5C6B64]">
              Drug name cannot be changed directly to protect clinical history. To replace with a different drug, discontinue this one and add the new medicine.
            </p>
          </div>

          {/* Type Segmented Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#5C6B64] uppercase tracking-wider">Medicine Type</label>
            <div className="flex p-1 bg-[#EDE8DC] rounded-2xl shadow-[inset_3px_3px_6px_rgba(191,180,155,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.6)] gap-1">
              {[
                { value: 'PRESCRIPTION', label: 'Rx (Prescription)' },
                { value: 'OTC', label: 'OTC' },
                { value: 'HERBAL', label: 'Herbal' },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    type === t.value
                      ? 'bg-[#EDE8DC] text-[#2B6E5E] shadow-[3px_3px_6px_rgba(191,180,155,0.55),-3px_-3px_6px_rgba(255,255,255,0.65)]'
                      : 'text-[#5C6B64] hover:text-[#1C2B27]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dosage Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#5C6B64] uppercase tracking-wider">Dosage Instructions</label>
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g. 10mg once daily, 500mg at bedtime"
              className="input-field text-sm font-mono"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 py-2.5 text-sm"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 py-2.5 text-sm"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Sub-Component: Discontinue Medicine Modal ───────────────────────────────
function DiscontinueMedicineModal({ med, isOpen, onClose, onConfirm, isPending }) {
  if (!isOpen || !med) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="polysafe-card p-6 max-w-md w-full bg-[#EDE8DC] space-y-4 shadow-[12px_12px_24px_rgba(191,180,155,0.7),-12px_-12px_24px_rgba(255,255,255,0.8)] border-transparent rounded-[32px]">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-[#FBE4DE] text-[#B23D25] border border-[#B23D25]/30 rounded-2xl flex-shrink-0 shadow-sm">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1C2B27]" style={{ fontFamily: "'Fraunces', serif" }}>
              Discontinue Medicine?
            </h2>
            <p className="text-xs text-[#5C6B64] mt-1 leading-relaxed">
              Are you sure you want to stop tracking <strong>{med.name}</strong>?
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-[#EDE8DC] shadow-[inset_3px_3px_6px_rgba(191,180,155,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.6)] rounded-2xl text-xs text-[#5C6B64] space-y-1">
          <p>• It will be removed from your active schedule and current interaction alerts.</p>
          <p>• It will be preserved on your <strong>Medication Timeline</strong> as discontinued for your doctors to review.</p>
        </div>

        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1 py-2.5 text-sm"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(med.id)}
            className="btn-danger flex-1 py-2.5 text-sm"
            disabled={isPending}
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Discontinue'}
          </button>
        </div>
      </div>
    </div>
  );
}
