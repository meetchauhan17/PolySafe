import React, { useState, useEffect, useRef } from 'react';
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
 MessageSquare,
 ArrowLeftRight,
 ClipboardList,
 Megaphone,
 CalendarDays,
 CheckCircle,
 XCircle,
 Utensils,
 UtensilsCrossed,
 Coffee,
 Droplets,
 Moon,
 Sun,
 Wine,
 Dumbbell,
 TestTube2,
 PenLine,
 ChevronRight,
 Shield,
 Zap,
} from 'lucide-react';
import { patientApi } from '../api/auth';
import Card from '../components/Card';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { EmptyMedicinesIllustration } from '../components/EmptyIllustrations';
import { HomeSkeleton } from '../components/Skeletons';
import { useAuth } from '../context/AuthContext';
import { notify } from '../utils/toast';
import { DrugHarmBadge, DrugHarmPanel, PolypharmacyHarmDashboard } from '../components/DrugHarmLevel';
import LedIndicator from '../components/LedIndicator';

// ─── Severity colour map ─────────────────────────────────────────────────────
const SEVERITY_STYLES = {
  CONTRAINDICATED: {
    border: 'border-[var(--critical-fg)]/40',
    bg: 'bg-[var(--canvas)]',
    badge: 'bg-[var(--critical-fg)]/15 text-[var(--critical-fg)] border-[var(--critical-fg)]/30 font-bold font-mono',
    icon: <AlertTriangle className="w-4 h-4 text-[var(--critical-fg)] flex-shrink-0" />,
    dot: 'bg-[var(--critical-fg)]',
    ledStatus: 'critical',
    textColor: 'var(--critical-fg)',
  },
  MAJOR: {
    border: 'border-[var(--critical-fg)]/40',
    bg: 'bg-[var(--canvas)]',
    badge: 'bg-[var(--critical-fg)]/15 text-[var(--critical-fg)] border-[var(--critical-fg)]/30 font-bold font-mono',
    icon: <AlertTriangle className="w-4 h-4 text-[var(--critical-fg)] flex-shrink-0" />,
    dot: 'bg-[var(--critical-fg)]',
    ledStatus: 'critical',
    textColor: 'var(--critical-fg)',
  },
  MODERATE: {
    border: 'border-[var(--caution-fg)]/40',
    bg: 'bg-[var(--canvas)]',
    badge: 'bg-[var(--caution-fg)]/15 text-[var(--caution-fg)] border-[var(--caution-fg)]/30 font-bold font-mono',
    icon: <AlertCircle className="w-4 h-4 text-[var(--caution-fg)] flex-shrink-0" />,
    dot: 'bg-[var(--caution-fg)]',
    ledStatus: 'caution',
    textColor: 'var(--caution-fg)',
  },
  MINOR: {
    border: 'border-amber-500/30',
    bg: 'bg-[var(--canvas)]',
    badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold font-mono',
    icon: <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
    dot: 'bg-amber-400',
    ledStatus: 'caution',
    textColor: 'var(--caution-fg)',
  },
};

// ─── Medicine type icon/badge ─────────────────────────────────────────────
function MedicineTypeBadge({ type }) {
 const map = {
 PRESCRIPTION: { icon: <Stethoscope className="w-3 h-3" />, label: 'Rx', cls: 'bg-[var(--doctor-600)]/10 text-[var(--doctor-600)] border-[var(--doctor-600)]/20' },
 OTC: { icon: <ShoppingBag className="w-3 h-3" />, label: 'OTC', cls: 'bg-[var(--caregiver-600)]/10 text-[var(--caregiver-600)] border-[var(--caregiver-600)]/20' },
 HERBAL: { icon: <Leaf className="w-3 h-3" />, label: 'Herbal', cls: 'bg-[var(--brand-600)]/10 text-[var(--brand-600)] border-[var(--brand-600)]/20' },
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

// ─── Physician Directives Banner ────────────────────────────────────────────
function PhysicianDirectivesBanner({ patientId, token }) {
 const shouldReduceMotion = useReducedMotion();
 // Live events from Socket.IO (via window-level event bus)
 const [liveEvents, setLiveEvents] = useState([]);
 const [dismissed, setDismissed] = useState(new Set());

 // Fetch persisted directives from API
 const { data: directivesData } = useQuery({
 queryKey: ['patient-directives', patientId],
 queryFn: () => patientId ? axios.get(`/connection/doctor-patient/${patientId}/directives`).then(r => r.data) : null,
 enabled: !!patientId && !!token,
 refetchInterval: 30_000,
 staleTime: 15_000,
 });

 // Listen for Socket.IO-pushed doctor events on the window event bus
 useEffect(() => {
 const handler = (e) => {
 const evt = e.detail;
 if (!evt) return;
 setLiveEvents(prev => [{
 id: `live-${Date.now()}`,
 ...evt,
 issuedAt: new Date().toISOString(),
 isLive: true,
 }, ...prev].slice(0, 8));
 };
 window.addEventListener('polysafe:doctor-event', handler);
 return () => window.removeEventListener('polysafe:doctor-event', handler);
 }, []);

 const directives = directivesData?.directives || [];
 const allEvents = [...liveEvents, ...directives.map(d => ({ ...d, isLive: false }))];
 const visible = allEvents.filter(e => !dismissed.has(e.id));

 if (visible.length === 0) return null;

 const getEventStyle = (evt) => {
 const action = evt.action || evt.category || '';
 if (action.includes('PRESCRIBED') || action === 'REGIMEN_ADVICE') {
 return { bg: 'bg-[var(--canvas)]', border: 'border-[var(--brand-600)]/30', text: 'text-[var(--ink)]', icon: <Stethoscope className="w-4 h-4 text-[var(--brand-600)] flex-shrink-0" />, label: 'Physician Prescription' };
 }
 if (action.includes('DEPRESCRIBED') || action.includes('TAPER')) {
 return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: <ArrowLeftRight className="w-4 h-4 text-amber-600 flex-shrink-0" />, label: 'Deprescribing Order' };
 }
 if (action.includes('SUBSTITUTED')) {
 return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: <ArrowLeftRight className="w-4 h-4 text-blue-600 flex-shrink-0" />, label: 'Drug Substitution' };
 }
 return { bg: 'bg-[var(--canvas)]', border: 'border-[var(--border)]', text: 'text-[var(--ink)]', icon: <ClipboardList className="w-4 h-4 text-[var(--ink-3)] flex-shrink-0" />, label: 'Clinical Directive' };
 };

 const formatEvent = (evt) => {
 const action = evt.action || '';
 if (action === 'DOCTOR_PRESCRIBED') return `${evt.doctorLabel || 'Your doctor'} prescribed ${evt.medicine?.name || evt.prescribed || 'a new medication'}.`;
 if (action === 'DOCTOR_DEPRESCRIBED') return `${evt.doctorLabel || 'Your doctor'} discontinued ${evt.medicine?.name || evt.discontinued || 'a medication'}.`;
 if (action === 'DOCTOR_SUBSTITUTED') return `${evt.doctorLabel || 'Your doctor'} substituted ${evt.discontinued || '...'} to ${evt.prescribed || '...'}. ${evt.rationale ? `Reason: ${evt.rationale}` : ''}`;
 return evt.text || evt.note || 'New clinical update from your physician.';
 };

 return (
 <div className="space-y-2">
 <div className="flex items-center gap-2">
 <Megaphone className="w-3.5 h-3.5 text-[var(--brand-600)]" />
 <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--brand-600)]">Physician Directives & Updates</span>
 <span className="text-[10px] font-bold text-white bg-[var(--brand-600)] px-2 py-0.5 rounded-full">{visible.length}</span>
 </div>
 <AnimatePresence initial={false}>
 {visible.map((evt) => {
 const style = getEventStyle(evt);
 return (
 <motion.div
 key={evt.id}
 initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
 animate={{ opacity: 1, y: 0 }}
 exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
 transition={{ duration: 0.2, ease: 'easeOut' }}
 className={`relative flex items-start gap-3 p-3.5 rounded-2xl border ${style.bg} ${style.border} shadow-sm`}
 >
 {evt.isLive && (
 <span className="absolute top-2 right-9 text-[9px] font-extrabold bg-green-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">
 LIVE
 </span>
 )}
 <div className="mt-0.5">{style.icon}</div>
 <div className="flex-1 min-w-0">
 <p className={`text-[10px] font-extrabold uppercase tracking-wider mb-0.5 ${style.text}`}>{style.label}</p>
 <p className={`text-xs font-semibold leading-relaxed ${style.text}`}>{formatEvent(evt)}</p>
 {evt.rationale && evt.action !== 'DOCTOR_SUBSTITUTED' && (
 <p className="text-[11px] text-[var(--ink-3)] mt-0.5">{evt.rationale}</p>
 )}
 <p className="text-[10px] text-[#9CA3AF] mt-1">
 {evt.doctorName || evt.doctorLabel || 'Physician'} · {new Date(evt.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
 </p>
 </div>
 <button
 onClick={() => setDismissed(prev => new Set([...prev, evt.id]))}
 className="p-1 rounded-lg hover:bg-black/10 transition-colors flex-shrink-0 mt-0.5"
 aria-label="Dismiss"
 >
 <X className="w-3.5 h-3.5 text-[var(--ink-3)]" />
 </button>
 </motion.div>
 );
 })}
 </AnimatePresence>
 </div>
 );
}

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
    staleTime: 3000,
    refetchInterval: 4000, // Real-time 4s polling for live doctor prescriptions & safety updates
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
    <div className="min-h-[80vh] flex items-center justify-center bg-[var(--canvas)] px-4">
        <div className="bg-[var(--surface)] rounded-3xl p-8 max-w-md w-full text-center space-y-4 border border-[var(--border)] shadow-[var(--shadow-lg)]">
          <AlertCircle className="w-12 h-12 text-[var(--critical-fg)] mx-auto" />
          <h2 className="text-xl font-bold text-[var(--ink)] font-[var(--font-heading)]">Couldn't load your data</h2>
          <p className="text-sm text-[var(--ink-3)]">
            {error?.response?.data?.error || 'Something went wrong. Please try again.'}
          </p>
          <button onClick={() => refetch()} className="ps-btn ps-btn-primary px-6 py-2.5 text-sm mx-auto">
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

  const regimenRisk = data?.regimenRisk;
  const highestHarmLevel = regimenRisk?.level ?? (medicines.length > 0 ? Math.max(...medicines.map((m) => m.harmLevel || 1)) : 1);
  const highestRiskDrug = regimenRisk?.highestRiskDrug || (medicines.length > 0 ? medicines.reduce((prev, curr) => ((curr.harmLevel || 1) > (prev?.harmLevel || 1) ? curr : prev), medicines[0]) : null);
  const highestRiskDrugName = highestRiskDrug?.name || 'high-risk medication';

 const todayLabel = new Date().toLocaleDateString('en-IN', {
   weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
 });

 return (
    <div className="min-h-[88vh] pb-28 md:pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Demo mode banner ─────────────────────────────────────────────── */}
        {isDemo && (
          <div className="flex items-start space-x-3 p-3.5 bg-blue-500/10 border border-blue-500/25 rounded-2xl text-xs text-blue-800 shadow-2xs">
            <FlaskConical className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
            <p>
              <strong>Demo Mode</strong> — this is a sample data preview. <Link to="/login" className="underline font-bold text-blue-700">Sign in</Link> to see your real medication summary.
            </p>
          </div>
        )}

        {/* ── Page Header — Premium Hero ────────────────────────────────────── */}
        <div className="ps-hero ps-fade-up">
          {/* Floating ambient orbs */}
          <div className="ps-orb ps-orb--primary" style={{ width: 180, height: 180, top: -60, right: -40, opacity: 0.18 }} />
          <div className="ps-orb ps-orb--secondary" style={{ width: 120, height: 120, bottom: -40, left: 60, opacity: 0.14 }} />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-3">
              {/* Status eyebrow pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface)]/80 backdrop-blur-md border border-[var(--brand-600)]/20 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand-600)] opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--brand-600)]"></span>
                </span>
                <Zap className="w-3 h-3 text-[var(--brand-600)]" />
                <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--brand-600)] font-mono">
                  Continuous Clinical Safety
                </span>
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold font-[var(--font-heading)] tracking-tight text-[var(--ink)]">
                  My Safety{' '}
                  <span className="ps-glow-text">Dashboard</span>
                </h1>
                <p className="text-sm text-[var(--ink-3)] font-mono mt-1">{todayLabel}</p>
              </div>

              {/* Trust Metric Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-[var(--surface)]/90 px-3 py-1.5 rounded-full border border-[var(--border)] text-[11px] font-semibold text-[var(--ink-2)] shadow-sm">
                  <Shield className="w-3.5 h-3.5 text-[var(--brand-600)]" />
                  222K+ Interaction Rules
                </span>
                <span className="inline-flex items-center gap-1.5 bg-[var(--surface)]/90 px-3 py-1.5 rounded-full border border-[var(--border)] text-[11px] font-semibold text-[var(--ink-2)] shadow-sm">
                  <Activity className="w-3.5 h-3.5 text-[var(--safe-fg)]" />
                  Real-Time ACB Radar
                </span>
                <span className="inline-flex items-center gap-1.5 bg-[var(--surface)]/90 px-3 py-1.5 rounded-full border border-[var(--border)] text-[11px] font-semibold text-[var(--ink-2)] shadow-sm">
                  <Zap className="w-3.5 h-3.5 text-[var(--doctor-600)]" />
                  DDInter Verified
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0 self-start sm:self-center">
              <Link
                to="/add-medicine"
                className="ps-btn-shine ps-btn ps-btn-primary py-2.5 px-5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Medicine</span>
              </Link>
              <button
                onClick={() => refetch()}
                disabled={isLoading || !token}
                className="ps-btn ps-btn-secondary p-2.5 rounded-2xl disabled:opacity-40"
                title="Refresh Telemetry"
                aria-label="Refresh Dashboard Data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
 {/* ═══════════════════════════════════════════════════════════════════
 EMPTY STATE — no medicines yet
 ═══════════════════════════════════════════════════════════════════ */}
         {isEmpty ? (
          <Card className="p-10 flex flex-col items-center text-center space-y-5">
            <EmptyMedicinesIllustration className="w-36 h-36 mx-auto mb-1" />
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-[var(--ink)]">
                No medicines yet
              </h2>
              <p className="text-sm text-[var(--ink-3)] max-w-xs mx-auto leading-relaxed">
                Add your first medicine to get started — PolySafe will begin checking for dangerous
                interactions across all your prescriptions.
              </p>
            </div>
            <Link to="/add-medicine" className="ps-btn ps-btn-primary px-8 py-3.5 text-base">
              <Plus className="w-5 h-5" />
              <span>Add Your First Medicine</span>
            </Link>
          </Card>
        ) : (
          <>
            {/* ═══════════════════════════════════════════════════════════════
               PHYSICIAN DIRECTIVES BANNER (live doctor updates)
               ═══════════════════════════════════════════════════════════════ */}
            {!isDemo && data?.patientId && (
              <PhysicianDirectivesBanner patientId={data.patientId} token={token} />
            )}

            {/* ═══════════════════════════════════════════════════════════════
               POLYPHARMACY RISK OVERVIEW (Harm Level Dashboard)
               ═══════════════════════════════════════════════════════════════ */}
            <PolypharmacyHarmDashboard
              medicines={medicines}
              flags={flags}
              regimenRisk={data?.regimenRisk}
            />

            {/* ═══════════════════════════════════════════════════════════════
               STATUS CARD — CLINICAL HARMONY (Pairwise Interactions + Regimen Risk)
               ═══════════════════════════════════════════════════════════════ */}
            {(() => {
              const hasMajorFlags = flags.some((f) =>
                ['MAJOR', 'CONTRAINDICATED'].includes((f.severity || '').toUpperCase())
              );

              // Case 1: Major or Contraindicated Pairwise Interaction Flags Active
              if (flags.length > 0 && hasMajorFlags) {
                return (
                  <Card
                    variant="critical"
                    hideScrews={true}
                    className="!flex-row items-center gap-4 p-4 sm:p-5 shadow-xs"
                  >
                    <div className="p-2 rounded-xl bg-rose-500/10 shadow-xs border border-rose-500/20 flex-shrink-0">
                      <LedIndicator status="critical" size="md" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base sm:text-lg font-extrabold text-[var(--ink)] font-[var(--font-heading)]">
                          {flags.length} Severe Interaction Flag{flags.length !== 1 ? 's' : ''} Active
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-rose-600 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                          CRITICAL RISK
                        </span>
                      </div>
                      <p className="text-xs font-mono text-[var(--ink-3)] mt-0.5 leading-snug">
                        Major or contraindicated pharmacological interactions detected. Immediate physician review and clinical evaluation advised.
                      </p>
                    </div>
                  </Card>
                );
              }

              // Case 2: Moderate or Minor Pairwise Interaction Flags Active
              if (flags.length > 0) {
                return (
                  <Card
                    variant="caution"
                    hideScrews={true}
                    className="!flex-row items-center gap-4 p-4 sm:p-5 shadow-xs"
                  >
                    <div className="p-2 rounded-xl bg-amber-500/10 shadow-xs border border-amber-500/20 flex-shrink-0">
                      <LedIndicator status="caution" size="md" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base sm:text-lg font-extrabold text-[var(--ink)] font-[var(--font-heading)]">
                          {flags.length} Interaction Flag{flags.length !== 1 ? 's' : ''} Active
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-[var(--caution-fg)] text-white px-2.5 py-0.5 rounded-full shadow-xs">
                          CAUTION
                        </span>
                      </div>
                      <p className="text-xs font-mono text-[var(--ink-3)] mt-0.5 leading-snug">
                        Potential pharmacological interactions detected in active regimen. Review interaction telemetry below and consult your doctor.
                      </p>
                    </div>
                  </Card>
                );
              }

              // Case 3: Zero Interaction Flags, BUT Regimen contains an L5 Critical Risk Drug (e.g. TFCT-NIB 5 mg)
              if (highestHarmLevel === 5) {
                return (
                  <Card
                    variant="critical"
                    hideScrews={true}
                    className="!flex-row items-center gap-4 p-4 sm:p-5 shadow-xs"
                  >
                    <div className="p-2 rounded-xl bg-rose-500/10 shadow-xs border border-rose-500/20 flex-shrink-0">
                      <LedIndicator status="critical" size="md" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base sm:text-lg font-extrabold text-[var(--ink)] font-[var(--font-heading)]">
                          No Interaction Flags · High-Alert Medication Active
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-rose-600 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                          L5 CRITICAL MONITORING
                        </span>
                      </div>
                      <p className="text-xs font-mono text-[var(--ink-3)] mt-0.5 leading-snug">
                        No pairwise drug-drug interactions detected between active medicines. However, <strong className="text-rose-700 font-bold">{highestRiskDrugName}</strong> is an L5 Critical Risk agent (narrow therapeutic index) requiring specialized clinical monitoring.
                      </p>
                    </div>
                  </Card>
                );
              }

              // Case 4: Zero Interaction Flags, BUT Regimen contains an L4 High Risk Drug
              if (highestHarmLevel === 4) {
                return (
                  <Card
                    variant="caution"
                    hideScrews={true}
                    className="!flex-row items-center gap-4 p-4 sm:p-5 shadow-xs"
                  >
                    <div className="p-2 rounded-xl bg-amber-500/10 shadow-xs border border-amber-500/20 flex-shrink-0">
                      <LedIndicator status="caution" size="md" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base sm:text-lg font-extrabold text-[var(--ink)] font-[var(--font-heading)]">
                          No Interaction Flags · High-Alert Drug in Regimen
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-[var(--caution-fg)] text-white px-2.5 py-0.5 rounded-full shadow-xs">
                          L4 MONITORING
                        </span>
                      </div>
                      <p className="text-xs font-mono text-[var(--ink-3)] mt-0.5 leading-snug">
                        No pairwise drug-drug interactions detected between active medicines. However, <strong className="text-amber-700 font-bold">{highestRiskDrugName}</strong> is an L4 High Risk medication requiring standard clinical surveillance.
                      </p>
                    </div>
                  </Card>
                );
              }

              // Case 5: Zero Interaction Flags AND all active medicines are L1–L3 (Low/Mild/Moderate baseline toxicity)
              return (
                <Card
                  variant="safe"
                  hideScrews={true}
                  className="!flex-row items-center gap-4 p-4 sm:p-5 shadow-xs"
                >
                  <div className="p-2 rounded-xl bg-emerald-500/10 shadow-xs border border-emerald-500/20 flex-shrink-0">
                    <LedIndicator status="safe" size="md" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base sm:text-lg font-extrabold text-[var(--ink)] font-[var(--font-heading)]">
                        No Harmful Interactions Detected
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-[var(--safe-fg)] text-white px-2.5 py-0.5 rounded-full shadow-xs">
                        SAFE
                      </span>
                    </div>
                    <p className="text-xs font-mono text-[var(--ink-3)] mt-0.5 leading-snug">
                      All {medicines.length} active medicine{medicines.length !== 1 ? 's' : ''} in your regimen are verified safe against DDInter clinical benchmarks.
                    </p>
                  </div>
                </Card>
              );
            })()}

        {/* ═══════════════════════════════════════════════════════════════
           TODAY'S SCHEDULE
           ═══════════════════════════════════════════════════════════════ */}
        <Card
          title="Today's Schedule"
          icon={<Clock className="w-4 h-4 text-[var(--brand-600)]" />}
          badge={
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleToggleAllReminders}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center space-x-1.5 transition-all duration-180 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)] active:scale-95 active:opacity-80 ${
                  remindersEnabled
                    ? 'bg-[var(--brand-600)] text-white border-[var(--brand-600)]'
                    : 'bg-[var(--canvas)] text-[var(--brand-600)] border-[var(--border)] hover:bg-[var(--brand-600)] hover:text-white'
                }`}
              >
                {remindersEnabled ? (
                  <>
                    <BellRing className="w-3 h-3 text-white animate-pulse" />
                    <span>Reminding Active</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3 h-3 text-[var(--brand-600)]" />
                    <span>Remind Me</span>
                  </>
                )}
              </button>
              <span className="text-[11px] font-bold text-[var(--ink-2)] bg-[var(--surface-2)] border border-[var(--border)] px-2.5 py-1 rounded-lg">
                {schedule.length} dose{schedule.length !== 1 ? 's' : ''}
              </span>
            </div>
          }
          className="space-y-4"
        >
          <div className="space-y-3.5">
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
                    className="flex items-center space-x-3.5 p-3.5 rounded-2xl bg-[var(--canvas)] border border-[var(--border)] shadow-xs hover:border-[var(--border-strong)] hover:bg-[var(--surface)] hover:shadow-sm transition-all"
                  >
                    {/* Time bubble */}
                    <div className="flex-shrink-0 w-16 text-center">
                      <span className="text-[11px] font-bold text-[var(--brand-600)] bg-[var(--brand-600)]/10 border border-[var(--brand-600)]/20 px-2.5 py-1 rounded-xl block leading-snug font-mono shadow-xs">
                        {item.time}
                      </span>
                    </div>

                    {/* Divider dot */}
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--border)] flex-shrink-0" />

                    {/* Medicine info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--ink)] truncate">{item.name}</p>
                      <p className="text-xs text-[var(--ink-3)] font-mono mt-0.5 leading-relaxed">{item.dosage}</p>
                    </div>

                    <MedicineTypeBadge type={item.type} />

                    {/* Individual Dose Remind Me Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleDoseReminder(doseKey, item.name, item.time)}
                      title={isDoseReminded ? 'Reminder active - click to mute' : 'Click to set dose reminder'}
                      className={`p-2 rounded-xl text-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)] active:scale-95 active:opacity-80 border ${
                        isDoseReminded
                          ? 'bg-[var(--brand-600)] text-white shadow-sm border-transparent'
                          : 'bg-[var(--surface)] text-[var(--ink-3)] border-[var(--border)] shadow-xs hover:text-[var(--brand-600)] hover:bg-[var(--canvas)]'
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
          icon={<Pill className="w-4 h-4 text-[var(--brand-600)]" />}
          badge={
            <span className="text-[11px] font-bold text-[var(--ink-2)] bg-[var(--surface-2)] border border-[var(--border)] px-2.5 py-1 rounded-xl">
              {medicines.length} total
            </span>
          }
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence initial={false}>
              {medicines.map((med, idx) => (
                <motion.div
                  key={med.id}
                  layout={!shouldReduceMotion}
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.22, delay: idx * 0.04 }}
                  className="ps-med-card space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-1 flex-wrap">
                      <div className="flex-1 min-w-0 pr-1">
                        <p className="text-sm font-bold text-[var(--ink)] leading-tight truncate">
                          {med.name}
                        </p>
                        {med.generic && med.generic.toLowerCase() !== med.name.toLowerCase() && (
                          <p className="text-[11px] text-[var(--ink-3)] truncate">
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
                      <p className="text-xs text-[var(--ink-3)] font-mono mt-0.5">{med.dosage}</p>
                    )}

                    {/* Interactive Drug Harm & Side Effects Panel */}
                    <DrugHarmPanel medicine={med} flags={flags} className="mt-1" />

                    {med.safetyTip && (
                      <p className="text-xs text-[var(--ink-2)] bg-[var(--canvas)] p-2.5 rounded-xl border border-[var(--border)] leading-tight">
                        {med.safetyTip}
                      </p>
                    )}

                    <p className="text-[10px] text-[var(--ink-3)] font-mono">
                      Added {new Date(med.dateAdded).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>

                  {/* Edit & Discontinue Action Bar */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => {
                        if (isGuest) {
                          openGuestLockModal('edit medication dosage and type');
                          return;
                        }
                        setEditingMed(med);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-[var(--brand-600)] bg-[var(--brand-600)]/10 border border-[var(--brand-600)]/20 hover:bg-[var(--brand-600)]/20 rounded-xl transition-all cursor-pointer"
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
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-[var(--critical-fg)] bg-[var(--surface)] border border-[var(--border)] shadow-xs hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
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
 <h2 className="text-base font-bold text-[var(--ink)] flex items-center space-x-2">
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
											hideScrews={true}
											className="p-5 space-y-3.5 shadow-[var(--shadow-sm)]"
										>
											{/* Flag header */}
											<div className="flex items-start justify-between gap-3">
												<div className="flex items-start space-x-3">
													<div className="p-2 rounded-xl bg-[var(--canvas)] shadow-xs border border-[var(--border)] mt-0.5 flex-shrink-0">
														{styles.icon}
													</div>
													<div>
														<div className="flex items-center flex-wrap gap-1.5">
															<span className="text-sm font-extrabold text-[var(--ink)]">
																{flag.medicineA?.name || 'Medicine A'}
															</span>
															<span className="text-xs text-[var(--ink-3)] font-bold">+</span>
															<span className="text-sm font-extrabold text-[var(--ink)]">
																{flag.medicineB?.name || 'Medicine B'}
															</span>
														</div>
														<p className="text-[10px] font-mono text-[var(--ink-3)] mt-0.5">
															Flagged {new Date(flag.dateFlagged).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
														</p>
													</div>
												</div>
												<span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border flex-shrink-0 ${styles.badge}`}>
													{flag.severity}
												</span>
											</div>

											{/* Plain explanation */}
											<div className="bg-[var(--surface)] rounded-2xl p-3.5 border border-[var(--border)] shadow-xs">
												<p className="text-xs font-medium text-[var(--ink)] leading-relaxed">
													{flag.plainExplanation}
												</p>
											</div>

											{/* Action button matching the clinical pill capsule component */}
											<div className="pt-1">
												<Link
													to={`/risk/${flag.id}`}
													className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-full bg-[var(--surface)] hover:bg-[var(--canvas)] border border-[var(--border)] shadow-xs hover:shadow-sm transition-all cursor-pointer group active:scale-[0.99]"
												>
													<div className="flex items-center gap-2">
														<LedIndicator status={styles.ledStatus || 'critical'} size="sm" />
														<span className="text-xs font-mono font-bold" style={{ color: styles.textColor || 'var(--critical-fg)' }}>
															View Clinical Explanation
														</span>
													</div>
													<ChevronRight className="w-3.5 h-3.5 text-[var(--ink-3)] group-hover:text-[var(--ink)] group-hover:translate-x-0.5 transition-all" />
												</Link>
											</div>
										</Card>
 </motion.div>
 );
 })}
 </AnimatePresence>
 </div>
 </div>
 )}

 {/* Quick nav: log symptom + view timeline + insights + connected people + share with doctor */}
 <div className="space-y-2">
   <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--ink-3)] font-mono px-1">Quick Access</p>
   <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
     <Link
       to="/log-symptom"
       onClick={(e) => {
         if (isGuest) { e.preventDefault(); openGuestLockModal('log symptoms'); }
       }}
       className="ps-quick-card relative"
     >
       <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center flex-shrink-0">
         <Activity className="w-5 h-5 text-orange-600" />
       </div>
       <span className="text-xs font-bold text-[var(--ink)]">Log Symptom</span>
       {isGuest && <Lock className="w-3 h-3 text-[var(--caregiver-600)] absolute top-2 right-2" />}
     </Link>
     <Link to="/timeline" className="ps-quick-card">
       <div className="w-10 h-10 rounded-2xl bg-[var(--brand-600)]/10 flex items-center justify-center flex-shrink-0">
         <Clock className="w-5 h-5 text-[var(--brand-600)]" />
       </div>
       <span className="text-xs font-bold text-[var(--ink)]">Timeline</span>
     </Link>
     <Link to="/insights" className="ps-quick-card">
       <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center flex-shrink-0">
         <TrendingUp className="w-5 h-5 text-violet-600" />
       </div>
       <span className="text-xs font-bold text-[var(--ink)]">Insights</span>
     </Link>
     <Link to="/connected-people" className="ps-quick-card">
       <div className="w-10 h-10 rounded-2xl bg-[var(--caregiver-600)]/10 flex items-center justify-center flex-shrink-0">
         <Users className="w-5 h-5 text-[var(--caregiver-600)]" />
       </div>
       <span className="text-xs font-bold text-[var(--ink)]">Connected</span>
     </Link>
     <Link
       to="/share-with-doctor"
       onClick={(e) => {
         if (isGuest) { e.preventDefault(); openGuestLockModal('generate clinical share codes'); }
       }}
       className="ps-quick-card sm:col-span-2 relative flex-row sm:justify-start sm:gap-3"
     >
       <div className="w-10 h-10 rounded-2xl bg-[var(--doctor-600)]/10 flex items-center justify-center flex-shrink-0">
         <QrCode className="w-5 h-5 text-[var(--doctor-600)]" />
       </div>
       <div className="text-left">
         <span className="text-xs font-bold text-[var(--ink)] block">Doctor QR Share</span>
         <span className="text-[10px] text-[var(--ink-3)] font-mono">Generate clinical share code</span>
       </div>
       {isGuest && <Lock className="w-3 h-3 text-[var(--caregiver-600)] absolute top-2 right-2" />}
     </Link>
   </div>
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
 const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'schedule' | 'notes'
 const [dosage, setDosage] = useState('');
 const [type, setType] = useState('PRESCRIPTION');
 const [frequency, setFrequency] = useState('');
 const [foodInstruction, setFoodInstruction] = useState('after_food');
 const [prescribedBy, setPrescribedBy] = useState('');
 const [notes, setNotes] = useState('');
 const [reminderEnabled, setReminderEnabled] = useState(false);
 const [refillDate, setRefillDate] = useState('');

 const FOOD_OPTIONS = [
  { value: 'after_food',    label: 'After Food',    hint: 'Take 30 min after a meal',        icon: <Utensils className="w-4 h-4" /> },
  { value: 'before_food',   label: 'Before Food',   hint: 'Take 30 min before a meal',       icon: <Clock className="w-4 h-4" /> },
  { value: 'with_food',     label: 'With Food',     hint: 'Take during a meal',              icon: <Coffee className="w-4 h-4" /> },
  { value: 'empty_stomach', label: 'Empty Stomach', hint: 'At least 1 hr before eating',     icon: <Droplets className="w-4 h-4" /> },
 ];

 const FREQUENCY_OPTIONS = [
  'Once daily (OD)',
  'Twice daily (BD)',
  'Three times daily (TDS)',
  'Four times daily (QID)',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'At bedtime (HS)',
  'As needed (PRN)',
  'Weekly',
  'Every other day',
  'Monthly',
 ];

 const TABS = [
  { id: 'basic',    label: 'Basic Info',        icon: <Pill className="w-3.5 h-3.5" /> },
  { id: 'schedule', label: 'Schedule & Timing',  icon: <CalendarDays className="w-3.5 h-3.5" /> },
  { id: 'notes',    label: 'Clinical Notes',     icon: <PenLine className="w-3.5 h-3.5" /> },
 ];

 const QUICK_NOTES = [
  { text: 'Take with full glass of water', icon: <Droplets className="w-3 h-3" /> },
  { text: 'Best taken at bedtime',         icon: <Moon className="w-3 h-3" /> },
  { text: 'Morning dose',                  icon: <Sun className="w-3 h-3" /> },
  { text: 'Avoid alcohol',                 icon: <Wine className="w-3 h-3" /> },
  { text: 'Avoid grapefruit',              icon: <UtensilsCrossed className="w-3 h-3" /> },
  { text: 'Do not crush/chew',             icon: <Pill className="w-3 h-3" /> },
  { text: 'Take before exercise',          icon: <Dumbbell className="w-3 h-3" /> },
  { text: 'Monitor blood levels',          icon: <TestTube2 className="w-3 h-3" /> },
 ];

 // Sync state when med changes
 React.useEffect(() => {
 if (med) {
 setDosage(med.dosage || '');
 setType(med.type || 'PRESCRIPTION');
 setFrequency(med.frequency || '');
 setFoodInstruction(med.foodInstruction || 'after_food');
 setPrescribedBy(med.prescribedBy || '');
 setNotes(med.notes || '');
 setReminderEnabled(!!med.reminderEnabled);
 setRefillDate(med.refillDate ? new Date(med.refillDate).toISOString().split('T')[0] : '');
 setActiveTab('basic');
 }
 }, [med]);

 if (!isOpen || !med) return null;

 const handleSubmit = (e) => {
 e.preventDefault();
 onSave({
 id: med.id,
 name: med.name,
 dosage,
 type,
 frequency: frequency || null,
 foodInstruction: foodInstruction || null,
 prescribedBy: prescribedBy || null,
 notes: notes || null,
 reminderEnabled,
 refillDate: refillDate || null,
 });
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: 12 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 12 }}
 transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
 className="w-full max-w-lg bg-[var(--canvas)] rounded-[32px] shadow-[var(--shadow-lg)] border border-[var(--border)] overflow-hidden"
 >
 {/* Header */}
 <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--border)]">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-2xl bg-[var(--brand-600)]/10 border border-[var(--brand-600)]/20 flex items-center justify-center">
 <Pill className="w-4 h-4 text-[var(--brand-600)]" />
 </div>
 <div>
 <h2 className="text-base font-bold text-[var(--ink)]" >
 Edit Medication
 </h2>
 <p className="text-[10px] text-[var(--ink-3)] font-semibold">{med.name}</p>
 </div>
 </div>
 <button type="button" onClick={onClose} className="p-1.5 rounded-xl hover:bg-[var(--border)]/60 text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors">
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Tab navigation */}
 <div className="flex gap-1 px-5 pt-3 pb-0">
 {TABS.map(tab => (
 <button
 key={tab.id}
 type="button"
 onClick={() => setActiveTab(tab.id)}
 className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${ 
 activeTab === tab.id
 ? 'bg-[var(--canvas)] text-[var(--brand-600)] shadow-[var(--shadow-sm)]'
 : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
 }`}
 >
 {tab.icon}
 <span>{tab.label}</span>
 </button>
 ))}
 </div>

 <form onSubmit={handleSubmit}>
 <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">

 {/* ── TAB 1: Basic Info ── */}
 {activeTab === 'basic' && (
 <div className="space-y-4">
 {/* Drug Name (immutable) */}
 <div className="space-y-1">
 <label className="text-[10px] font-extrabold text-[var(--ink-3)] uppercase tracking-widest">Medicine Name</label>
 <div className="p-3.5 bg-[var(--canvas)] rounded-2xl shadow-[var(--shadow-sm)] text-sm font-bold text-[var(--ink)]">
 {med.name}
 </div>
 <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
 Drug name is locked to protect clinical history. To use a different drug, discontinue this and add the new one.
 </p>
 </div>

 {/* Medicine Type */}
 <div className="space-y-1.5">
 <label className="text-[10px] font-extrabold text-[var(--ink-3)] uppercase tracking-widest">Medicine Type</label>
 <div className="flex p-1 bg-[var(--canvas)] rounded-2xl shadow-[var(--shadow-sm)] gap-1">
 {[
 { value: 'PRESCRIPTION', label: 'Rx (Prescription)', icon: <Stethoscope className="w-3 h-3" /> },
 { value: 'OTC', label: 'OTC', icon: <ShoppingBag className="w-3 h-3" /> },
 { value: 'HERBAL', label: 'Herbal', icon: <Leaf className="w-3 h-3" /> },
 ].map((t) => (
 <button
 key={t.value}
 type="button"
 onClick={() => setType(t.value)}
 className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
 type === t.value
 ? 'bg-[var(--canvas)] text-[var(--brand-600)] shadow-[var(--shadow-sm)]'
 : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
 }`}
 >
 {t.icon}
 {t.label}
 </button>
 ))}
 </div>
 </div>

 {/* Dosage */}
 <div className="space-y-1.5">
 <label className="text-[10px] font-extrabold text-[var(--ink-3)] uppercase tracking-widest">Dosage Instructions</label>
 <input
 type="text"
 value={dosage}
 onChange={(e) => setDosage(e.target.value)}
 placeholder="e.g. 10mg, 500mg, 1 tablet"
 className="input-field text-sm"
 />
 </div>

 {/* Prescribed By */}
 <div className="space-y-1.5">
 <label className="text-[10px] font-extrabold text-[var(--ink-3)] uppercase tracking-widest">Prescribed By</label>
 <input
 type="text"
 value={prescribedBy}
 onChange={(e) => setPrescribedBy(e.target.value)}
 placeholder="e.g. Dr. Sharma, Self-prescribed, OTC purchase"
 className="input-field text-sm"
 />
 </div>
 </div>
 )}

 {/* ── TAB 2: Schedule & Timing ── */}
 {activeTab === 'schedule' && (
 <div className="space-y-4">
 {/* Frequency */}
 <div className="space-y-1.5">
 <label className="text-[10px] font-extrabold text-[var(--ink-3)] uppercase tracking-widest">Dosing Frequency</label>
 <select
 value={frequency}
 onChange={(e) => setFrequency(e.target.value)}
 className="input-field text-sm"
 >
 <option value="">Select frequency…</option>
 {FREQUENCY_OPTIONS.map(f => (
 <option key={f} value={f}>{f}</option>
 ))}
 </select>
 <input
 type="text"
 value={frequency && !FREQUENCY_OPTIONS.includes(frequency) ? frequency : ''}
 onChange={(e) => setFrequency(e.target.value)}
 placeholder="Or type a custom frequency…"
 className="input-field text-sm mt-1.5"
 />
 </div>

 {/* Food Instruction */}
 <div className="space-y-1.5">
 <label className="text-[10px] font-extrabold text-[var(--ink-3)] uppercase tracking-widest">Food Instruction</label>
 <div className="grid grid-cols-2 gap-2">
 {FOOD_OPTIONS.map(opt => (
 <button
 key={opt.value}
 type="button"
 onClick={() => setFoodInstruction(opt.value)}
 className={`p-3 rounded-2xl text-left text-xs transition-all cursor-pointer border ${ 
 foodInstruction === opt.value
 ? 'bg-[var(--brand-600)] text-white border-[var(--brand-600)] shadow-sm'
 : 'bg-[var(--canvas)] text-[var(--ink-3)] border-[var(--border)] shadow-[var(--shadow-sm)] hover:text-[var(--ink)]'
 }`}
 >
 <div className={`mb-1 ${foodInstruction === opt.value ? 'text-white' : 'text-[var(--brand-600)]'}`}>
 {opt.icon}
 </div>
 <p className="font-bold text-[11px]">{opt.label}</p>
 <p className={`text-[10px] mt-0.5 ${foodInstruction === opt.value ? 'text-white/80' : 'text-[#9CA3AF]'}`}>{opt.hint}</p>
 </button>
 ))}
 </div>
 </div>

 {/* Refill Date */}
 <div className="space-y-1.5">
 <label className="text-[10px] font-extrabold text-[var(--ink-3)] uppercase tracking-widest">
 Next Refill / Prescription Renewal Date
 </label>
 <div className="relative">
 <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-3)] pointer-events-none" />
 <input
 type="date"
 value={refillDate}
 onChange={(e) => setRefillDate(e.target.value)}
 className="input-field text-sm !pl-11 has-icon-left"
 min={new Date().toISOString().split('T')[0]}
 />
 </div>
 {refillDate && (
 <p className="text-[11px] text-[var(--brand-600)] font-semibold flex items-center gap-1.5">
 <CalendarDays className="w-3 h-3" />
 Refill due: {new Date(refillDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
 </p>
 )}
 </div>

 {/* Reminder Toggle */}
 <div className="flex items-center justify-between p-4 bg-[var(--canvas)] rounded-2xl shadow-[var(--shadow-sm)]">
 <div>
 <p className="text-xs font-extrabold text-[var(--ink)]">Daily Dose Reminders</p>
 <p className="text-[11px] text-[var(--ink-3)]">Receive push reminders for this medicine</p>
 </div>
 <button
 type="button"
 onClick={() => setReminderEnabled(prev => !prev)}
 className={`relative w-11 h-6 rounded-full transition-all cursor-pointer border flex items-center ${ 
 reminderEnabled
 ? 'bg-[var(--brand-600)] border-[var(--brand-600)] justify-end'
 : 'bg-[var(--border)] border-[var(--border)] justify-start'
 } px-0.5`}
 aria-label="Toggle reminder"
 >
 <motion.span
 layout
 className="w-5 h-5 rounded-full bg-[var(--canvas)] shadow-md border border-[var(--border)]"
 />
 </button>
 </div>
 </div>
 )}

 {/* ── TAB 3: Clinical Notes ── */}
 {activeTab === 'notes' && (
 <div className="space-y-4">
 {/* Personal Notes */}
 <div className="space-y-1.5">
 <label className="text-[10px] font-extrabold text-[var(--ink-3)] uppercase tracking-widest">Personal Notes & Reminders</label>
 <textarea
 rows={5}
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 placeholder="e.g. Take with warm water. Do not crush. INR check on March 15. Avoid grapefruit juice…"
 className="input-field text-sm resize-none leading-relaxed"
 />
 <p className="text-[11px] text-[var(--ink-3)]">{notes.length}/500 characters</p>
 </div>

 {/* Quick note chips */}
 <div className="space-y-2">
 <p className="text-[10px] font-extrabold text-[var(--ink-3)] uppercase tracking-widest">Quick Add Notes</p>
 <div className="flex flex-wrap gap-2">
 {QUICK_NOTES.map(({ text, icon }) => (
 <button
 key={text}
 type="button"
 onClick={() => setNotes(prev => prev ? `${prev}\n${text}` : text)}
 className="text-[11px] px-2.5 py-1.5 rounded-xl bg-[var(--canvas)] shadow-[var(--shadow-sm)] text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors cursor-pointer border border-[var(--border)] flex items-center gap-1.5"
 >
 <span className="text-[var(--brand-600)]">{icon}</span>
 {text}
 </button>
 ))}
 </div>
 </div>

 {/* Summary preview */}
 <div className="p-3.5 bg-[var(--canvas)] rounded-2xl shadow-[var(--shadow-sm)] space-y-1.5">
 <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--ink-3)]">Current Settings Summary</p>
 <div className="space-y-0.5 text-[11px] text-[var(--ink)]">
 <p><span className="text-[var(--ink-3)]">Type:</span> {type}</p>
 {dosage && <p><span className="text-[var(--ink-3)]">Dosage:</span> {dosage}</p>}
 {frequency && <p><span className="text-[var(--ink-3)]">Frequency:</span> {frequency}</p>}
 {foodInstruction && <p><span className="text-[var(--ink-3)]">With Food:</span> {FOOD_OPTIONS.find(f => f.value === foodInstruction)?.label}</p>}
 {prescribedBy && <p><span className="text-[var(--ink-3)]">Prescribed By:</span> {prescribedBy}</p>}
 {refillDate && <p><span className="text-[var(--ink-3)]">Refill Date:</span> {new Date(refillDate).toLocaleDateString('en-IN')}</p>}
 <p><span className="text-[var(--ink-3)]">Reminders:</span> {reminderEnabled ? <CheckCircle className="w-3.5 h-3.5 inline text-emerald-600 ml-1" /> : <XCircle className="w-3.5 h-3.5 inline text-rose-500 ml-1" />} {reminderEnabled ? 'Enabled' : 'Disabled'}</p>
 </div>
 </div>
 </div>
 )}
 </div>

 {/* Footer Actions */}
 <div className="px-6 pb-5 pt-3 flex gap-2.5 border-t border-[var(--border)]">
 {/* Tab nav arrows */}
 <button
 type="button"
 onClick={() => setActiveTab(t => t === 'schedule' ? 'basic' : t === 'notes' ? 'schedule' : 'basic')}
 className="ps-btn ps-btn-secondary py-2.5 px-4 text-xs"
 disabled={activeTab === 'basic'}
 >
 Back
 </button>

 {activeTab !== 'notes' ? (
 <button
 type="button"
 onClick={() => setActiveTab(t => t === 'basic' ? 'schedule' : 'notes')}
 className="ps-btn ps-btn-primary flex-1 py-2.5 text-sm"
 >
 Next
 </button>
 ) : (
 <>
 <button
 type="button"
 onClick={onClose}
 className="ps-btn ps-btn-secondary flex-1 py-2.5 text-sm"
 disabled={isPending}
 >
 Cancel
 </button>
 <button
 type="submit"
 className="ps-btn ps-btn-primary flex-1 py-2.5 text-sm"
 disabled={isPending}
 >
 {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
 </button>
 </>
 )}

 {/* Always show Save on any tab */}
 {activeTab !== 'notes' && (
 <button
 type="submit"
 className="ps-btn ps-btn-secondary py-2.5 px-4 text-xs"
 disabled={isPending}
 title="Save without continuing"
 >
 {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
 </button>
 )}
 </div>
 </form>
 </motion.div>
 </div>
 );
}

// ─── Sub-Component: Discontinue Medicine Modal ───────────────────────────────
function DiscontinueMedicineModal({ med, isOpen, onClose, onConfirm, isPending }) {
  if (!isOpen || !med) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="p-6 max-w-md w-full bg-[var(--canvas)] space-y-5 shadow-[var(--shadow-lg)] border border-[var(--border)] rounded-[28px] relative overflow-hidden"
      >
        {/* Top Danger Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500" />

        <div className="flex items-start gap-3.5 pt-1">
          <div className="p-3 bg-rose-50 border border-rose-200/80 text-rose-600 rounded-2xl flex-shrink-0 shadow-xs">
            <Trash2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-extrabold text-[var(--ink)] font-[var(--font-heading)] tracking-tight">
              Discontinue Medicine?
            </h2>
            <p className="text-xs text-[var(--ink-3)] mt-1 leading-relaxed">
              Are you sure you want to stop tracking <strong className="text-[var(--ink)]">{med.name}</strong>?
            </p>
          </div>
        </div>

        <div className="p-4 bg-[var(--canvas)] border border-[var(--border)] shadow-[var(--shadow-inner)] rounded-2xl text-xs text-[var(--ink-3)] space-y-2 font-mono">
          <div className="flex items-start gap-2">
            <span className="text-rose-500 font-bold">•</span>
            <p className="leading-relaxed">
              It will be removed from your <span className="font-bold text-[var(--ink)]">active schedule</span> and live interaction screening.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-500 font-bold">•</span>
            <p className="leading-relaxed">
              It will remain preserved in your <span className="font-bold text-[var(--ink)]">Medication Timeline</span> as discontinued for your doctors to review.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="ps-btn ps-btn-secondary flex-1 py-3 text-xs font-mono font-bold cursor-pointer"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(med.id)}
            className="ps-btn ps-btn-danger flex-1 py-3 text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Discontinuing…</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Discontinue</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
