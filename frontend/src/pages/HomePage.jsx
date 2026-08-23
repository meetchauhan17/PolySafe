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
    border: 'border-[var(--led-critical)]/40',
    bg: 'bg-[var(--chassis)]',
    badge: 'bg-[var(--led-critical)]/15 text-[var(--led-critical)] border-[var(--led-critical)]/30 font-bold font-mono',
    icon: <AlertTriangle className="w-4 h-4 text-[var(--led-critical)] flex-shrink-0" />,
    dot: 'bg-[var(--led-critical)]',
    ledStatus: 'critical',
    textColor: 'var(--led-critical)',
  },
  MAJOR: {
    border: 'border-[var(--led-critical)]/40',
    bg: 'bg-[var(--chassis)]',
    badge: 'bg-[var(--led-critical)]/15 text-[var(--led-critical)] border-[var(--led-critical)]/30 font-bold font-mono',
    icon: <AlertTriangle className="w-4 h-4 text-[var(--led-critical)] flex-shrink-0" />,
    dot: 'bg-[var(--led-critical)]',
    ledStatus: 'critical',
    textColor: 'var(--led-critical)',
  },
  MODERATE: {
    border: 'border-[var(--led-caution)]/40',
    bg: 'bg-[var(--chassis)]',
    badge: 'bg-[var(--led-caution)]/15 text-[var(--led-caution)] border-[var(--led-caution)]/30 font-bold font-mono',
    icon: <AlertCircle className="w-4 h-4 text-[var(--led-caution)] flex-shrink-0" />,
    dot: 'bg-[var(--led-caution)]',
    ledStatus: 'caution',
    textColor: 'var(--led-caution)',
  },
  MINOR: {
    border: 'border-amber-500/30',
    bg: 'bg-[var(--chassis)]',
    badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold font-mono',
    icon: <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
    dot: 'bg-amber-400',
    ledStatus: 'caution',
    textColor: 'var(--led-caution)',
  },
};

// ─── Medicine type icon/badge ─────────────────────────────────────────────
function MedicineTypeBadge({ type }) {
 const map = {
 PRESCRIPTION: { icon: <Stethoscope className="w-3 h-3" />, label: 'Rx', cls: 'bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)] border-[var(--accent-secondary)]/20' },
 OTC: { icon: <ShoppingBag className="w-3 h-3" />, label: 'OTC', cls: 'bg-[var(--role-caregiver)]/10 text-[var(--role-caregiver)] border-[var(--role-caregiver)]/20' },
 HERBAL: { icon: <Leaf className="w-3 h-3" />, label: 'Herbal', cls: 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20' },
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
 return { bg: 'bg-[var(--chassis)]', border: 'border-[var(--accent-primary)]/30', text: 'text-[var(--text-primary)]', icon: <Stethoscope className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0" />, label: 'Physician Prescription' };
 }
 if (action.includes('DEPRESCRIBED') || action.includes('TAPER')) {
 return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: <ArrowLeftRight className="w-4 h-4 text-amber-600 flex-shrink-0" />, label: 'Deprescribing Order' };
 }
 if (action.includes('SUBSTITUTED')) {
 return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: <ArrowLeftRight className="w-4 h-4 text-blue-600 flex-shrink-0" />, label: 'Drug Substitution' };
 }
 return { bg: 'bg-[var(--chassis)]', border: 'border-[var(--chassis-dark)]', text: 'text-[var(--text-primary)]', icon: <ClipboardList className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />, label: 'Clinical Directive' };
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
 <Megaphone className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
 <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--accent-primary)]">Physician Directives & Updates</span>
 <span className="text-[10px] font-bold text-white bg-[var(--accent-primary)] px-2 py-0.5 rounded-full">{visible.length}</span>
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
 <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{evt.rationale}</p>
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
 <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
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
 <div className="min-h-[80vh] flex items-center justify-center bg-[var(--chassis)] px-4">
 <div className="polysafe-card p-8 max-w-md w-full text-center space-y-4">
 <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
 <h2 className="text-xl font-bold text-[var(--text-primary)]">Couldn't load your data</h2>
 <p className="text-sm text-[var(--text-muted)]">
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
 <div className="bg-[var(--chassis)] min-h-[88vh] pb-28 md:pb-12">
 <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

 {/* ── Demo mode banner ─────────────────────────────────────────────── */}
 {isDemo && (
 <div className="flex items-start space-x-3 p-3.5 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-2xl text-xs text-[var(--accent-primary)] shadow-sm">
 <FlaskConical className="w-4 h-4 flex-shrink-0 mt-0.5" />
 <p>
 <strong>Demo Mode</strong> — this is a sample data preview. <Link to="/login" className="underline font-bold">Sign in</Link> to see your real medication summary.
 </p>
 </div>
 )}

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] font-display tracking-tight">My Safety Dashboard</h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">{todayLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/add-medicine"
              className="btn-primary py-2 px-3 sm:px-4 text-xs flex items-center gap-1.5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card)]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Medicine</span>
            </Link>
            <button
              onClick={() => refetch()}
              disabled={isLoading || !token}
              className="btn-secondary p-2.5 rounded-2xl disabled:opacity-40"
              title="Refresh Telemetry"
              aria-label="Refresh Dashboard Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
 {/* ═══════════════════════════════════════════════════════════════════
 EMPTY STATE — no medicines yet
 ═══════════════════════════════════════════════════════════════════ */}
         {isEmpty ? (
          <Card className="p-10 flex flex-col items-center text-center space-y-5">
            <EmptyMedicinesIllustration className="w-36 h-36 mx-auto mb-1" />
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                No medicines yet
              </h2>
              <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
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
           STATUS CARD — SAFE or CAUTION
           ═══════════════════════════════════════════════════════════════ */}
        {status === 'SAFE' ? (
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
                <span className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] font-display">
                  No Harmful Interactions Detected
                </span>
                <span className="text-[10px] font-mono font-bold bg-[var(--led-safe)] text-white px-2.5 py-0.5 rounded-full shadow-xs">
                  SAFE
                </span>
              </div>
              <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5 leading-snug">
                All {medicines.length} active medicine{medicines.length !== 1 ? 's' : ''} in your regimen are verified safe against DDInter clinical benchmarks.
              </p>
            </div>
          </Card>
        ) : (
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
                <span className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] font-display">
                  {flags.length} Interaction Flag{flags.length !== 1 ? 's' : ''} Active
                </span>
                <span className="text-[10px] font-mono font-bold bg-[var(--led-caution)] text-white px-2.5 py-0.5 rounded-full shadow-xs">
                  CAUTION
                </span>
              </div>
              <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5 leading-snug">
                Potential pharmacological interactions detected in active regimen. Review interaction telemetry below and consult your doctor.
              </p>
            </div>
          </Card>
        )}

        {/* ═══════════════════════════════════════════════════════════════
           TODAY'S SCHEDULE
           ═══════════════════════════════════════════════════════════════ */}
        <Card
          title="Today's Schedule"
          icon={<Clock className="w-4 h-4 text-[var(--accent-primary)]" />}
          badge={
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleToggleAllReminders}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center space-x-1.5 transition-all duration-180 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--chassis)] active:scale-95 active:opacity-80 ${
                  remindersEnabled
                    ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                    : 'bg-[var(--chassis)] text-[var(--accent-primary)] border-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)] hover:text-white'
                }`}
              >
                {remindersEnabled ? (
                  <>
                    <BellRing className="w-3 h-3 text-white animate-pulse" />
                    <span>Reminding Active</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3 h-3 text-[var(--accent-primary)]" />
                    <span>Remind Me</span>
                  </>
                )}
              </button>
              <span className="text-[11px] font-bold text-[var(--text-muted)] bg-[var(--chassis-dark)] px-2.5 py-1 rounded-lg">
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
                    className="flex items-center space-x-3.5 p-3.5 rounded-2xl bg-[var(--chassis)] shadow-[var(--shadow-sm)] border border-[rgba(255,255,255,0.4)] transition-all"
                  >
                    {/* Time bubble */}
                    <div className="flex-shrink-0 w-16 text-center">
                      <span className="text-[11px] font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 px-2 py-1 rounded-xl block leading-snug font-mono shadow-xs">
                        {item.time}
                      </span>
                    </div>

                    {/* Divider dot */}
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--chassis-dark)] flex-shrink-0" />

                    {/* Medicine info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--text-primary)] truncate">{item.name}</p>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono">{item.dosage}</p>
                    </div>

                    <MedicineTypeBadge type={item.type} />

                    {/* Individual Dose Remind Me Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleDoseReminder(doseKey, item.name, item.time)}
                      title={isDoseReminded ? 'Reminder active - click to mute' : 'Click to set dose reminder'}
                      className={`p-2 rounded-xl text-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--chassis)] active:scale-95 active:opacity-80 border border-[rgba(255,255,255,0.3)] ${
                        isDoseReminded
                          ? 'bg-[var(--accent-primary)] text-white shadow-sm border-transparent'
                          : 'bg-[var(--chassis)] text-[var(--text-muted)] shadow-[var(--shadow-sm)] hover:text-[var(--accent-primary)]'
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
          icon={<Pill className="w-4 h-4 text-[var(--accent-primary)]" />}
          badge={
            <span className="text-[11px] font-bold text-[var(--text-muted)] bg-[var(--chassis)] shadow-[var(--shadow-sm)] border border-[rgba(255,255,255,0.3)] px-2.5 py-1 rounded-xl">
              {medicines.length} total
            </span>
          }
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence initial={false}>
              {medicines.map((med) => (
                <motion.div
                  key={med.id}
                  layout={!shouldReduceMotion}
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 sm:p-5 rounded-2xl bg-[var(--chassis)] shadow-[var(--shadow-sm)] border border-[rgba(255,255,255,0.4)] space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-1 flex-wrap">
                      <div className="flex-1 min-w-0 pr-1">
                        <p className="text-sm font-bold text-[var(--text-primary)] leading-tight truncate">
                          {med.name}
                        </p>
                        {med.generic && med.generic.toLowerCase() !== med.name.toLowerCase() && (
                          <p className="text-[10px] text-[var(--text-muted)] truncate">
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
                      <p className="text-[11px] text-[var(--text-muted)] font-mono">{med.dosage}</p>
                    )}

                    {/* Interactive Drug Harm & Side Effects Panel */}
                    <DrugHarmPanel medicine={med} flags={flags} className="mt-1" />

                    {med.safetyTip && (
                      <p className="text-[10px] text-[var(--text-muted)] bg-[var(--brand-sub-surface)] shadow-[var(--shadow-sm)] p-2.5 rounded-xl border border-[var(--chassis-dark)] leading-tight">
                        {med.safetyTip}
                      </p>
                    )}

                    <p className="text-[10px] text-[var(--text-muted)]/70">
                      Added {new Date(med.dateAdded).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>

                  {/* Edit & Discontinue Action Bar */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--chassis-dark)]">
                    <button
                      type="button"
                      onClick={() => {
                        if (isGuest) {
                          openGuestLockModal('edit medication dosage and type');
                          return;
                        }
                        setEditingMed(med);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-[var(--accent-primary)] bg-[var(--chassis)] border border-[rgba(255,255,255,0.3)] shadow-[var(--shadow-sm)] hover:bg-[var(--accent-primary)]/10 rounded-xl transition-all cursor-pointer"
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
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-[var(--led-critical)] bg-[var(--chassis)] border border-[rgba(255,255,255,0.3)] shadow-[var(--shadow-sm)] hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
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
 <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center space-x-2">
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
													<div className="p-2 rounded-xl bg-white/80 dark:bg-black/20 shadow-xs border border-black/5 mt-0.5 flex-shrink-0">
														{styles.icon}
													</div>
													<div>
														<div className="flex items-center flex-wrap gap-1.5">
															<span className="text-sm font-extrabold text-[var(--text-primary)]">
																{flag.medicineA?.name || 'Medicine A'}
															</span>
															<span className="text-xs text-[var(--text-muted)] font-bold">+</span>
															<span className="text-sm font-extrabold text-[var(--text-primary)]">
																{flag.medicineB?.name || 'Medicine B'}
															</span>
														</div>
														<p className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
															Flagged {new Date(flag.dateFlagged).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
														</p>
													</div>
												</div>
												<span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border flex-shrink-0 ${styles.badge}`}>
													{flag.severity}
												</span>
											</div>

											{/* Plain explanation */}
											<div className="bg-white/70 dark:bg-black/20 backdrop-blur-xs rounded-2xl p-3.5 border border-black/5 dark:border-white/10 shadow-xs">
												<p className="text-xs font-medium text-[var(--text-primary)] leading-relaxed">
													{flag.plainExplanation}
												</p>
											</div>

											{/* Action button matching the clinical pill capsule component */}
											<div className="pt-1">
												<Link
													to={`/risk/${flag.id}`}
													className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-full bg-[var(--chassis)] hover:bg-[var(--chassis-dark)] dark:bg-black/30 dark:hover:bg-black/50 border border-[rgba(255,255,255,0.6)] dark:border-white/10 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card)] transition-all cursor-pointer group active:scale-[0.99]"
												>
													<div className="flex items-center gap-2">
														<LedIndicator status={styles.ledStatus || 'critical'} size="sm" />
														<span className="text-xs font-mono font-bold" style={{ color: styles.textColor || 'var(--led-critical)' }}>
															View Clinical Explanation
														</span>
													</div>
													<ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] group-hover:translate-x-0.5 transition-all" />
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
 {isGuest && <Lock className="w-3 h-3 text-[var(--role-caregiver)] ml-1" />}
 </Link>
 <Link
 to="/timeline"
 className="btn-secondary py-3 text-xs sm:text-sm justify-center"
 >
 <Clock className="w-4 h-4 text-[var(--accent-primary)]" />
 <span>Timeline</span>
 </Link>
 <Link
 to="/insights"
 className="btn-secondary py-3 text-xs sm:text-sm justify-center bg-[var(--chassis)]/30 border-[var(--accent-primary)]/30 text-[var(--accent-primary)]"
 >
 <TrendingUp className="w-4 h-4 text-[var(--accent-primary)]" />
 <span>Insights</span>
 </Link>
 <Link
 to="/connected-people"
 className="btn-secondary py-3 text-xs sm:text-sm justify-center"
 >
 <Users className="w-4 h-4 text-[var(--role-caregiver)]" />
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
 <QrCode className="w-4 h-4 text-[var(--accent-secondary)]" />
 <span>Doctor QR Share</span>
 {isGuest && <Lock className="w-3 h-3 text-[var(--role-caregiver)] ml-1" />}
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
 className="w-full max-w-lg bg-[var(--chassis)] rounded-[32px] shadow-[var(--shadow-floating)] border border-white/50 overflow-hidden"
 >
 {/* Header */}
 <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--chassis-dark)]">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-2xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center">
 <Pill className="w-4 h-4 text-[var(--accent-primary)]" />
 </div>
 <div>
 <h2 className="text-base font-bold text-[var(--text-primary)]" >
 Edit Medication
 </h2>
 <p className="text-[10px] text-[var(--text-muted)] font-semibold">{med.name}</p>
 </div>
 </div>
 <button type="button" onClick={onClose} className="p-1.5 rounded-xl hover:bg-[var(--chassis-dark)]/60 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
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
 ? 'bg-[var(--chassis)] text-[var(--accent-primary)] shadow-[var(--shadow-card)]'
 : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
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
 <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">Medicine Name</label>
 <div className="p-3.5 bg-[var(--chassis)] rounded-2xl shadow-[var(--shadow-card)] text-sm font-bold text-[var(--text-primary)]">
 {med.name}
 </div>
 <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
 Drug name is locked to protect clinical history. To use a different drug, discontinue this and add the new one.
 </p>
 </div>

 {/* Medicine Type */}
 <div className="space-y-1.5">
 <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">Medicine Type</label>
 <div className="flex p-1 bg-[var(--chassis)] rounded-2xl shadow-[var(--shadow-card)] gap-1">
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
 ? 'bg-[var(--chassis)] text-[var(--accent-primary)] shadow-[var(--shadow-card)]'
 : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
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
 <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">Dosage Instructions</label>
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
 <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">Prescribed By</label>
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
 <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">Dosing Frequency</label>
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
 <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">Food Instruction</label>
 <div className="grid grid-cols-2 gap-2">
 {FOOD_OPTIONS.map(opt => (
 <button
 key={opt.value}
 type="button"
 onClick={() => setFoodInstruction(opt.value)}
 className={`p-3 rounded-2xl text-left text-xs transition-all cursor-pointer border ${ 
 foodInstruction === opt.value
 ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-sm'
 : 'bg-[var(--chassis)] text-[var(--text-muted)] border-[var(--chassis-dark)] shadow-[var(--shadow-card)] hover:text-[var(--text-primary)]'
 }`}
 >
 <div className={`mb-1 ${foodInstruction === opt.value ? 'text-white' : 'text-[var(--accent-primary)]'}`}>
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
 <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">
 Next Refill / Prescription Renewal Date
 </label>
 <div className="relative">
 <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
 <input
 type="date"
 value={refillDate}
 onChange={(e) => setRefillDate(e.target.value)}
 className="input-field text-sm !pl-11 has-icon-left"
 min={new Date().toISOString().split('T')[0]}
 />
 </div>
 {refillDate && (
 <p className="text-[11px] text-[var(--accent-primary)] font-semibold flex items-center gap-1.5">
 <CalendarDays className="w-3 h-3" />
 Refill due: {new Date(refillDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
 </p>
 )}
 </div>

 {/* Reminder Toggle */}
 <div className="flex items-center justify-between p-4 bg-[var(--chassis)] rounded-2xl shadow-[var(--shadow-card)]">
 <div>
 <p className="text-xs font-extrabold text-[var(--text-primary)]">Daily Dose Reminders</p>
 <p className="text-[11px] text-[var(--text-muted)]">Receive push reminders for this medicine</p>
 </div>
 <button
 type="button"
 onClick={() => setReminderEnabled(prev => !prev)}
 className={`relative w-11 h-6 rounded-full transition-all cursor-pointer border flex items-center ${ 
 reminderEnabled
 ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] justify-end'
 : 'bg-[var(--chassis-dark)] border-[var(--chassis-dark)] justify-start'
 } px-0.5`}
 aria-label="Toggle reminder"
 >
 <motion.span
 layout
 className="w-5 h-5 rounded-full bg-[var(--chassis)] shadow-md border border-white/60"
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
 <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">Personal Notes & Reminders</label>
 <textarea
 rows={5}
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 placeholder="e.g. Take with warm water. Do not crush. INR check on March 15. Avoid grapefruit juice…"
 className="input-field text-sm resize-none leading-relaxed"
 />
 <p className="text-[11px] text-[var(--text-muted)]">{notes.length}/500 characters</p>
 </div>

 {/* Quick note chips */}
 <div className="space-y-2">
 <p className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">Quick Add Notes</p>
 <div className="flex flex-wrap gap-2">
 {QUICK_NOTES.map(({ text, icon }) => (
 <button
 key={text}
 type="button"
 onClick={() => setNotes(prev => prev ? `${prev}\n${text}` : text)}
 className="text-[11px] px-2.5 py-1.5 rounded-xl bg-[var(--chassis)] shadow-[var(--shadow-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer border border-[var(--chassis-dark)] flex items-center gap-1.5"
 >
 <span className="text-[var(--accent-primary)]">{icon}</span>
 {text}
 </button>
 ))}
 </div>
 </div>

 {/* Summary preview */}
 <div className="p-3.5 bg-[var(--chassis)] rounded-2xl shadow-[var(--shadow-card)] space-y-1.5">
 <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">Current Settings Summary</p>
 <div className="space-y-0.5 text-[11px] text-[var(--text-primary)]">
 <p><span className="text-[var(--text-muted)]">Type:</span> {type}</p>
 {dosage && <p><span className="text-[var(--text-muted)]">Dosage:</span> {dosage}</p>}
 {frequency && <p><span className="text-[var(--text-muted)]">Frequency:</span> {frequency}</p>}
 {foodInstruction && <p><span className="text-[var(--text-muted)]">With Food:</span> {FOOD_OPTIONS.find(f => f.value === foodInstruction)?.label}</p>}
 {prescribedBy && <p><span className="text-[var(--text-muted)]">Prescribed By:</span> {prescribedBy}</p>}
 {refillDate && <p><span className="text-[var(--text-muted)]">Refill Date:</span> {new Date(refillDate).toLocaleDateString('en-IN')}</p>}
 <p><span className="text-[var(--text-muted)]">Reminders:</span> {reminderEnabled ? <CheckCircle className="w-3.5 h-3.5 inline text-emerald-600 ml-1" /> : <XCircle className="w-3.5 h-3.5 inline text-rose-500 ml-1" />} {reminderEnabled ? 'Enabled' : 'Disabled'}</p>
 </div>
 </div>
 </div>
 )}
 </div>

 {/* Footer Actions */}
 <div className="px-6 pb-5 pt-3 flex gap-2.5 border-t border-[var(--chassis-dark)]">
 {/* Tab nav arrows */}
 <button
 type="button"
 onClick={() => setActiveTab(t => t === 'schedule' ? 'basic' : t === 'notes' ? 'schedule' : 'basic')}
 className="btn-secondary py-2.5 px-4 text-xs"
 disabled={activeTab === 'basic'}
 >
 Back
 </button>

 {activeTab !== 'notes' ? (
 <button
 type="button"
 onClick={() => setActiveTab(t => t === 'basic' ? 'schedule' : 'notes')}
 className="btn-primary flex-1 py-2.5 text-sm"
 >
 Next
 </button>
 ) : (
 <>
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
 </>
 )}

 {/* Always show Save on any tab */}
 {activeTab !== 'notes' && (
 <button
 type="submit"
 className="btn-secondary py-2.5 px-4 text-xs"
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
        className="p-6 max-w-md w-full bg-[var(--chassis)] space-y-5 shadow-[var(--shadow-floating)] border border-white/60 rounded-[28px] relative overflow-hidden"
      >
        {/* Top Danger Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500" />

        <div className="flex items-start gap-3.5 pt-1">
          <div className="p-3 bg-rose-50 border border-rose-200/80 text-rose-600 rounded-2xl flex-shrink-0 shadow-xs">
            <Trash2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-extrabold text-[var(--text-primary)] font-display tracking-tight">
              Discontinue Medicine?
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
              Are you sure you want to stop tracking <strong className="text-[var(--text-primary)]">{med.name}</strong>?
            </p>
          </div>
        </div>

        <div className="p-4 bg-[var(--chassis)] border border-[var(--chassis-dark)] shadow-[var(--shadow-recessed)] rounded-2xl text-xs text-[var(--text-muted)] space-y-2 font-mono">
          <div className="flex items-start gap-2">
            <span className="text-rose-500 font-bold">•</span>
            <p className="leading-relaxed">
              It will be removed from your <span className="font-bold text-[var(--text-primary)]">active schedule</span> and live interaction screening.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-500 font-bold">•</span>
            <p className="leading-relaxed">
              It will remain preserved in your <span className="font-bold text-[var(--text-primary)]">Medication Timeline</span> as discontinued for your doctors to review.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1 py-3 text-xs font-mono font-bold cursor-pointer"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(med.id)}
            className="btn-danger flex-1 py-3 text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
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
