import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowLeft,
  Pill,
  Leaf,
  ShoppingBag,
  Stethoscope,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  CalendarDays,
  Plus,
  Info,
  AlertCircle,
  Loader2,
  ChevronRight,
  FlaskConical,
  Zap,
  Shield,
  Activity,
  Clock,
  Dumbbell,
  Utensils,
  ArrowLeftRight,
} from 'lucide-react';
import Card from '../components/Card';
import BackButton from '../components/BackButton';
import LedIndicator from '../components/LedIndicator';
import { DrugHarmBadge, KnownSideEffectsPanel } from '../components/DrugHarmLevel';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { EmptyTimelineIllustration } from '../components/EmptyIllustrations';
import { TimelineSkeleton } from '../components/Skeletons';
import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';
import { getMedicineIndication } from '../utils/indications';

// ─── Helper: Directive Style Helper ──────────────────────────────────────────
function getDirectiveStyle(category) {
  const cat = String(category || '').toUpperCase();
  if (cat.includes('LIFESTYLE') || cat.includes('WORKOUT') || cat.includes('EXERCISE')) {
    return {
      accentBorder: 'border-l-emerald-500',
      badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: <Dumbbell className="w-3.5 h-3.5" />,
      label: 'Lifestyle & Activity Order',
      dotBorder: '#10B981',
    };
  }
  if (cat.includes('DIET') || cat.includes('NUTRITION')) {
    return {
      accentBorder: 'border-l-teal-500',
      badgeBg: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20',
      iconBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
      icon: <Utensils className="w-3.5 h-3.5" />,
      label: 'Dietary Instruction',
      dotBorder: '#14B8A6',
    };
  }
  if (cat.includes('PRESCRIB') || cat.includes('START')) {
    return {
      accentBorder: 'border-l-cyan-500',
      badgeBg: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
      iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      icon: <Pill className="w-3.5 h-3.5" />,
      label: 'Prescription Order',
      dotBorder: '#06B6D4',
    };
  }
  if (cat.includes('DEPRESCRIB') || cat.includes('TAPER') || cat.includes('STOP')) {
    return {
      accentBorder: 'border-l-amber-500',
      badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      label: 'Deprescribing Order',
      dotBorder: '#F59E0B',
    };
  }
  if (cat.includes('SUBSTITUT')) {
    return {
      accentBorder: 'border-l-blue-500',
      badgeBg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      icon: <ArrowLeftRight className="w-3.5 h-3.5" />,
      label: 'Drug Substitution',
      dotBorder: '#3B82F6',
    };
  }
  return {
    accentBorder: 'border-l-indigo-500',
    badgeBg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
    iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    icon: <Stethoscope className="w-3.5 h-3.5" />,
    label: 'Clinical Directive',
    dotBorder: '#6366F1',
  };
}

// ─── Helper: Medicine Type Badge ──────────────────────────────────────────────
function MedicineTypeBadge({ type }) {
  const map = {
    PRESCRIPTION: { icon: <Stethoscope className="w-3 h-3" />, label: 'Rx', cls: 'bg-[var(--doctor-600)]/10 text-[var(--doctor-600)] border-[var(--doctor-600)]/25' },
    OTC: { icon: <ShoppingBag className="w-3 h-3" />, label: 'OTC', cls: 'bg-[var(--caregiver-600)]/10 text-[var(--caregiver-600)] border-[var(--caregiver-600)]/25' },
    HERBAL: { icon: <Leaf className="w-3 h-3" />, label: 'Herbal', cls: 'bg-[var(--brand-600)]/10 text-[var(--brand-600)] border-[var(--brand-600)]/25' },
  };
  const t = map[type] ?? map.PRESCRIPTION;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold shadow-xs ${t.cls}`}>
      {t.icon}
      <span>{t.label}</span>
    </span>
  );
}

// ─── Helper: Parse Rich Indian or Generic Dosage Strings ──────────────────────
function parseDosageDetails(dosageStr) {
  if (!dosageStr) return null;
  const str = String(dosageStr).trim();
  if (!str.includes('•') && !str.includes('Salts:')) {
    return { simple: str };
  }

  const parts = str.split('•').map(p => p.trim()).filter(p => p && p.toLowerCase() !== 'not specified');
  let strength = null;
  let form = null;
  let salts = null;
  let frequency = null;
  let manufacturer = null;

  for (const part of parts) {
    if (part.startsWith('Salts:')) {
      salts = part.replace(/^Salts:\s*/i, '').trim();
    } else if (part.startsWith('Mfr:')) {
      manufacturer = part.replace(/^Mfr:\s*/i, '').trim();
    } else if (/^(once|twice|three|four|every|at bedtime|daily|as needed|in morning|in evening|at night)/i.test(part)) {
      frequency = part;
    } else if (/^(tablet|capsule|syrup|injection|drops|gel|cream|inhaler|patch|solution|suspension|powder)/i.test(part)) {
      form = part;
    } else if (/\d+\s*(mg|mcg|g|ml|iu|%)/i.test(part) && !strength) {
      strength = part;
    } else if (!form && /tablet|capsule|syrup/i.test(part)) {
      form = part;
    }
  }

  return {
    simple: null,
    strength: strength || (parts.length > 0 && !salts ? parts[0] : null),
    form,
    salts,
    frequency,
    manufacturer,
    rawParts: parts,
  };
}

const DEMO_TIMELINE_MEDICINES = [
 {
 id: 'demo-med-1',
 name: 'Amitriptyline',
 type: 'PRESCRIPTION',
 dosage: '25mg at bedtime',
 dateAdded: new Date(Date.now() - 90 * 86400000).toISOString(),
 status: 'ACTIVE',
 prescribedBy: 'Dr. Priya Sharma, MD',
 flagged: true,
 flagSeverity: 'Major',
 flagMessage: 'Anticholinergic burden + QT prolongation risk when combined with Escitalopram',
 flagId: 'demo-flag-1',
 prescribingCascade: null,
 },
 {
 id: 'demo-med-2',
 name: 'Escitalopram',
 type: 'PRESCRIPTION',
 dosage: '10mg once daily',
 dateAdded: new Date(Date.now() - 60 * 86400000).toISOString(),
 status: 'ACTIVE',
 prescribedBy: 'Dr. Priya Sharma, MD',
 flagged: true,
 flagSeverity: 'Major',
 flagId: 'demo-flag-1',
 prescribingCascade: null,
 },
 {
 id: 'demo-med-3',
 name: 'Amlodipine',
 type: 'PRESCRIPTION',
 dosage: '5mg in morning',
 dateAdded: new Date(Date.now() - 45 * 86400000).toISOString(),
 status: 'ACTIVE',
 prescribedBy: 'Dr. Ramesh Patel, MD',
 flagged: false,
 prescribingCascade: null,
 },
 {
 id: 'demo-med-4',
 name: 'Furosemide',
 type: 'PRESCRIPTION',
 dosage: '20mg once daily',
 dateAdded: new Date(Date.now() - 20 * 86400000).toISOString(),
 status: 'ACTIVE',
 prescribedBy: 'Dr. Ramesh Patel, MD',
 flagged: false,
 prescribingCascade: {
 originalDrug: 'Amlodipine',
 symptom: 'Leg swelling (Peripheral Edema)',
 message: 'Prescribed to treat peripheral edema caused by Amlodipine calcium-channel blockade.',
 },
 },
 {
 id: 'demo-med-5',
 name: 'Ashwagandha Extract',
 type: 'HERBAL',
 dosage: '500mg daily',
 dateAdded: new Date(Date.now() - 10 * 86400000).toISOString(),
 status: 'ACTIVE',
 prescribedBy: null,
 flagged: true,
 flagSeverity: 'Moderate',
 flagMessage: 'Synergistic central nervous system sedation when taken with Amitriptyline',
 flagId: 'demo-flag-2',
 prescribingCascade: null,
 },
];

const DEMO_TIMELINE_DIRECTIVES = [
  {
    id: 'demo-dir-1',
    doctorName: 'Dr. Sarah Wilson',
    category: 'LIFESTYLE_ORDER',
    priority: 'HIGH',
    text: 'Maintain hydration and engage in 20 minutes of daily low-impact walking. Monitor morning blood pressure readings.',
    issuedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'demo-dir-2',
    doctorName: 'Dr. Sarah Wilson',
    category: 'DEPRESCRIBING_ADVICE',
    priority: 'HIGH',
    text: 'Taper Amitriptyline to 10mg before bedtime over the next 10 days to resolve daytime grogginess.',
    issuedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];


// ─── API ──────────────────────────────────────────────────────────────────────
async function fetchTimeline() {
 const { data } = await axios.get('/patient/timeline');
 return data;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
function formatDate(dateStr) {
 if (!dateStr) return '—';
 return new Date(dateStr).toLocaleDateString('en-IN', {
 day: 'numeric',
 month: 'short',
 year: 'numeric',
 });
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TimelinePage() {
 const navigate = useNavigate();
 const shouldReduceMotion = useReducedMotion();
 const { isGuest, token, openGuestLockModal } = useAuth();
 const [timelineFilter, setTimelineFilter] = useState('ALL');

 const { data, isLoading, isError } = useQuery({
 queryKey: ['patient-timeline'],
 queryFn: fetchTimeline,
 enabled: !!token && !isGuest,
 retry: 1,
 });

 if (isLoading) {
 return (
 <div className="min-h-[88vh] bg-[var(--canvas)] pb-16">
 <TimelineSkeleton />
 </div>
 );
 }
  const medicines = isGuest ? DEMO_TIMELINE_MEDICINES : (data?.medicines ?? (token ? [] : DEMO_TIMELINE_MEDICINES));
  const directives = isGuest ? DEMO_TIMELINE_DIRECTIVES : (data?.directives ?? []);
  const flaggedCount = medicines.filter((m) => m.flagged).length;
  const herbalCount = medicines.filter((m) => m.type === 'HERBAL').length;

  const allTimelineItems = [
    ...medicines.map((m) => ({
      itemType: 'MEDICINE',
      id: `med-${m.id}`,
      timestamp: m.dateAdded || new Date().toISOString(),
      data: m,
    })),
    ...directives.map((d) => ({
      itemType: 'DIRECTIVE',
      id: `dir-${d.id}`,
      timestamp: d.issuedAt || new Date().toISOString(),
      data: d,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const displayItems = allTimelineItems.filter((item) => {
    if (timelineFilter === 'MEDS') return item.itemType === 'MEDICINE';
    if (timelineFilter === 'DIRECTIVES') return item.itemType === 'DIRECTIVE';
    return true;
  });

  return (
    <div className="min-h-[88vh] pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Modern Hero Header ── */}
        <div className="ps-hero ps-fade-up">
          {/* Ambient orbs */}
          <div className="ps-orb ps-orb--primary" style={{ width: 200, height: 200, top: -70, right: -50, opacity: 0.15 }} />
          <div className="ps-orb ps-orb--secondary" style={{ width: 130, height: 130, bottom: -50, left: 50, opacity: 0.12 }} />

          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <BackButton to="/home" label="Back to Home" />

              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--brand-600)]/10 text-[var(--brand-600)] border border-[var(--brand-600)]/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand-600)] opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--brand-600)]" />
                  </span>
                  <span className="font-mono text-[11px]">Chronological Audit</span>
                </div>
                <Link
                  to="/add-medicine"
                  onClick={(e) => {
                    if (isGuest) {
                      e.preventDefault();
                      openGuestLockModal('add medications');
                    }
                  }}
                  className="ps-btn-shine ps-btn ps-btn-primary py-2 px-4 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Medicine</span>
                  {isGuest && <Lock className="w-3 h-3 text-white/70 ml-0.5" />}
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--ink)] tracking-tight font-[var(--font-heading)]">
                Medication{' '}
                <span className="ps-glow-text">Timeline</span>
              </h1>
              <p className="text-sm text-[var(--ink-2)] max-w-xl leading-relaxed">
                {isGuest ? 'Sample interactive prescription, OTC, and supplement sequence with cascade detection.' : 'Complete chronological prescription and supplement history with active interaction surveillance.'}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)]/80 border border-[var(--border)] text-xs font-medium text-[var(--ink-2)]">
                  <Shield className="w-3.5 h-3.5 text-[var(--brand-600)]" />
                  <span>Clinical Audit Trail</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)]/80 border border-[var(--border)] text-xs font-medium text-[var(--ink-2)]">
                  <Zap className="w-3.5 h-3.5 text-[var(--doctor-600)]" />
                  <span>Cascade Detection</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)]/80 border border-[var(--border)] text-xs font-medium text-[var(--ink-2)]">
                  <Activity className="w-3.5 h-3.5 text-[var(--caregiver-600)]" />
                  <span>Cross-Doctor Sync</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats Summary Bar ── */}
        {!isLoading && !isError && displayItems.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Medications', value: medicines.length, color: 'var(--brand-600)' },
              { label: 'Risk Flags', value: flaggedCount, color: flaggedCount > 0 ? 'var(--critical-fg)' : 'var(--safe-fg)' },
              { label: 'Herbals & OTC', value: herbalCount, color: 'var(--doctor-600)' },
              { label: 'Doctor Directives', value: directives.length, color: '#10B981' },
            ].map((s) => (
              <div key={s.label} className="ps-stat-card text-center space-y-0.5 p-3.5">
                <p className="text-2xl font-black" style={{ color: s.color }}>
                  {s.value}
                </p>
                <p className="text-[11px] text-[var(--ink-3)] font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Filter Tabs ── */}
        {!isLoading && !isError && displayItems.length > 0 && directives.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
            <button
              type="button"
              onClick={() => setTimelineFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                timelineFilter === 'ALL'
                  ? 'bg-[var(--brand-600)] text-white shadow-xs'
                  : 'bg-[var(--surface)] text-[var(--ink-2)] hover:bg-[var(--surface-2)] border border-[var(--border)]'
              }`}
            >
              All Activities ({allTimelineItems.length})
            </button>
            <button
              type="button"
              onClick={() => setTimelineFilter('MEDS')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                timelineFilter === 'MEDS'
                  ? 'bg-[var(--brand-600)] text-white shadow-xs'
                  : 'bg-[var(--surface)] text-[var(--ink-2)] hover:bg-[var(--surface-2)] border border-[var(--border)]'
              }`}
            >
              Medications ({medicines.length})
            </button>
            <button
              type="button"
              onClick={() => setTimelineFilter('DIRECTIVES')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                timelineFilter === 'DIRECTIVES'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[var(--surface)] text-[var(--ink-2)] hover:bg-[var(--surface-2)] border border-[var(--border)]'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor Directives ({directives.length})</span>
            </button>
          </div>
        )}

        {/* ── Legend ───────────────────────────────────────────────────────── */}
        {!isLoading && displayItems.length > 0 && (
          <div className="flex items-center flex-wrap gap-4 sm:gap-6 px-1">
            <span className="flex items-center gap-2 text-xs text-[var(--ink-3)] font-semibold">
              <span className="w-3.5 h-3.5 rounded-full bg-white border-[3px] border-[var(--brand-600)] shadow-xs" />
              Safe / Normal Entry
            </span>
            <span className="flex items-center gap-2 text-xs text-[var(--ink-3)] font-semibold">
              <span className="w-3.5 h-3.5 rounded-full bg-white border-[3px] border-[var(--critical-fg)] shadow-xs" />
              Interaction Flagged
            </span>
            {directives.length > 0 && (
              <span className="flex items-center gap-2 text-xs text-[var(--ink-3)] font-semibold">
                <span className="w-3.5 h-3.5 rounded-full bg-white border-[3px] border-emerald-500 shadow-xs" />
                Doctor Directive / Order
              </span>
            )}
          </div>
        )}

 {/* ── Error State ───────────────────────────────────────────────────── */}
 {isError && (
 <Card variant="danger" className="flex-row items-start space-x-3 bg-rose-50 text-rose-700">
 <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-bold text-rose-700">Could not load timeline</p>
 <p className="text-xs text-rose-600 mt-0.5">
 {error?.response?.data?.error || error?.message || 'Failed to fetch timeline records.'}
 </p>
 </div>
 </Card>
 )}

 {/* ── Empty State ───────────────────────────────────────────────────── */}
 {!isLoading && !isError && displayItems.length === 0 && (
 <Card className="p-10 flex flex-col items-center text-center space-y-4">
 <EmptyTimelineIllustration className="w-36 h-36 mx-auto mb-1" />
 <div>
 <h3 className="text-lg font-bold text-[var(--ink)]" >
 No medicines logged yet
 </h3>
 <p className="text-sm text-[var(--ink-3)] mt-1 max-w-sm">
 Add your prescriptions, over-the-counter medicines, and herbal supplements to start generating your safety timeline.
 </p>
 </div>
 <Link to="/add-medicine" className="ps-btn ps-btn-primary px-6 py-3 inline-flex items-center gap-2">
 <Plus className="w-4 h-4" />
 <span>Add Your First Medicine</span>
 </Link>
 </Card>
 )}

        {/* ── Timeline Display with Vertical Timeline Line ───────────────────── */}
        {!isLoading && !isError && displayItems.length > 0 && (
          <div className="relative pl-2 py-2">
            <motion.div
              className="absolute left-[19px] top-4 bottom-6 w-[3px] z-0 rounded-full origin-top"
              style={{ backgroundColor: 'var(--brand-600)' }}
              initial={shouldReduceMotion ? { scaleY: 1 } : { scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: 'easeOut' }}
            />

            <div className="space-y-6">
              <AnimatePresence initial={false}>
                {displayItems.map((item, index) => {
                  if (item.itemType === 'DIRECTIVE') {
                    const dir = item.data;
                    const style = getDirectiveStyle(dir.category);
                    const isHighPriority = dir.priority === 'HIGH' || dir.priority === 'URGENT';

                    return (
                      <motion.div
                        key={item.id}
                        layout={!shouldReduceMotion}
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
                        transition={{
                          duration: shouldReduceMotion ? 0 : 0.28,
                          delay: shouldReduceMotion ? 0 : index * 0.05,
                          ease: [0.25, 1, 0.5, 1],
                        }}
                        className="relative z-10 flex items-start gap-4"
                      >
                        <div
                          className="w-[18px] h-[18px] rounded-full bg-[var(--canvas)] flex-shrink-0 mt-4 shadow-sm"
                          style={{ border: `3px solid ${style.dotBorder}` }}
                        />

                        <Card
                          hideScrews={true}
                          className={`flex-1 space-y-3 transition-all bg-[var(--brand-surface)] border border-[var(--border)] border-l-4 ${style.accentBorder} hover:shadow-[var(--shadow-sm)]`}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-[var(--border)]">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${style.badgeBg}`}>
                                {style.icon}
                                <span>{style.label}</span>
                              </span>
                              {isHighPriority && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                                  High Priority
                                </span>
                              )}
                            </div>

                            <span className="inline-flex items-center gap-1 text-xs text-[var(--ink-3)] font-medium">
                              <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                              {formatDate(dir.issuedAt)}
                            </span>
                          </div>

                          <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3.5 text-sm text-[var(--ink)] font-medium leading-relaxed">
                            <span className="text-base text-[var(--doctor-600)] font-serif mr-1">“</span>
                            {dir.text}
                            <span className="text-base text-[var(--doctor-600)] font-serif ml-1">”</span>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 text-xs text-[var(--ink-3)]">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--ink)]">
                              <Stethoscope className="w-3.5 h-3.5 text-[var(--doctor-600)]" />
                              <span>{dir.doctorName || 'Attending Physician'}</span>
                            </span>
                            <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--ink-3)]">
                              Direct Care Directive
                            </span>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  }

                  const med = item.data;
                  const isDiscontinued = !!med.discontinued || !!med.removedAt;
                  const isFlagged = !isDiscontinued && med.flagged && med.flags?.length > 0;
                  const details = parseDosageDetails(med.dosage);

                  return (
                    <motion.div
                      key={item.id}
 layout={!shouldReduceMotion}
 initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
 animate={{ opacity: 1, y: 0 }}
 exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
 transition={{
 duration: shouldReduceMotion ? 0 : 0.28,
 delay: shouldReduceMotion ? 0 : index * 0.065,
 ease: [0.25, 1, 0.5, 1],
 }}
 className="relative z-10 flex items-start gap-4"
 >
 <div
 className="w-[18px] h-[18px] rounded-full bg-[var(--canvas)] flex-shrink-0 mt-4 shadow-sm"
 style={{
 border: `3px solid ${isDiscontinued ? 'var(--border)' : isFlagged ? 'var(--critical-fg)' : 'var(--brand-600)'}`,
 }}
 />

 <Card
 hideScrews={true}
 className={`flex-1 space-y-3 transition-all ${
 isDiscontinued
 ? '!bg-[var(--canvas)] opacity-75 !border-[var(--border)]'
 : isFlagged
 ? '!bg-[#fef2f2] !border-rose-400/50 shadow-[0_2px_14px_rgba(225,29,72,0.08)]'
 : 'bg-[var(--surface)] border-[var(--border)] hover:shadow-[var(--shadow-sm)]'
 }`}
 >
 <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-[var(--border)]">
 <span
 className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
 isDiscontinued
 ? 'bg-[var(--border)]/60 text-[var(--ink-3)] border border-[var(--border)]'
 : isFlagged
 ? 'bg-[var(--surface)] text-[var(--brand-600)] border border-rose-300/40 shadow-xs'
 : 'bg-[var(--brand-600)]/10 text-[var(--brand-600)] border border-[var(--brand-600)]/25 shadow-xs'
 }`}
 >
 <span className={`w-1.5 h-1.5 rounded-full ${isDiscontinued ? 'bg-[#9CA3AF]' : 'bg-[var(--brand-600)]'}`} />
 {med.sourceLabel || 'Self-logged'}
 </span>

 <div className="flex items-center gap-2">
 {isDiscontinued && (
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--canvas)] text-[var(--ink-3)] border border-[var(--border)] shadow-xs">
 Discontinued {med.removedAt ? `on ${formatDate(med.removedAt)}` : ''}
 </span>
 )}
 <span className="inline-flex items-center gap-1 text-xs text-[var(--ink-3)] font-medium">
 <CalendarDays className="w-3.5 h-3.5 text-[#9CA3AF]" />
 Started {formatDate(med.dateAdded)}
 </span>
 </div>
 </div>

 <div className="flex items-center justify-between gap-2 flex-wrap">
 <div className="flex items-center gap-2.5 flex-wrap">
 <h3 className={`text-base sm:text-lg font-bold font-[var(--font-heading)] ${isDiscontinued ? 'text-[#4A4F4B] line-through decoration-[#9CA3AF]/60' : 'text-[var(--ink)]'}`}>
 {med.name}
 </h3>
 <MedicineTypeBadge type={med.type} />
 {med.harmLevel && <DrugHarmBadge harmLevel={med.harmLevel} size="sm" />}
 </div>
 </div>

 {details && (
 <div className="space-y-1.5 text-xs">
 {details.salts && (
 <div className="flex items-center gap-1.5 text-xs text-[var(--ink-2)] font-medium">
 <FlaskConical className="w-3.5 h-3.5 text-[var(--brand-600)] flex-shrink-0" />
 <span>Salts: <strong className="text-[var(--ink)] font-semibold">{details.salts}</strong></span>
 </div>
 )}

									{/* Clinical Indication / Treats */}
									{(() => {
										const indication = getMedicineIndication(med);
										if (!indication) return null;
										return (
											<div className="flex items-center gap-1.5 text-xs text-[var(--ink-2)] bg-[var(--surface-2)]/60 px-2.5 py-1.5 rounded-xl border border-[var(--border)]">
												<Stethoscope className="w-3.5 h-3.5 text-[var(--brand-600)] flex-shrink-0" />
												<span><strong className="text-[var(--ink)]">Used For:</strong> {indication}</span>
											</div>
										);
									})()}

								{details.simple ? (
									<p className="text-xs text-[var(--ink-2)] font-medium">
										Dose: {details.simple.replace(/_/g, ' ')}
									</p>
								) : (
									<div className="flex items-center gap-1.5 flex-wrap text-[11px] text-[var(--ink-2)] font-medium">
										{details.strength && (
											<span className="px-2.5 py-0.5 rounded-lg border border-teal-500/20 bg-teal-500/10 text-teal-800 font-semibold shadow-2xs">
												{details.strength}
											</span>
										)}
										{details.form && (
											<span className="px-2.5 py-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink-2)] shadow-2xs">
												{details.form}
											</span>
										)}
										{details.frequency && (
											<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink-2)] shadow-2xs">
												<Clock className="w-3 h-3 text-[var(--brand-600)]" />
												{details.frequency.replace(/_/g, ' ')}
											</span>
										)}
										{details.manufacturer && (
											<span className="text-[10px] text-[var(--ink-3)]">
												Mfr: {details.manufacturer}
											</span>
										)}
									</div>
								)}
							</div>
						)}

                        {/* Flagged Red Interaction Capsule */}
                        {isFlagged && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {med.flags.map((f) => (
                              <Link
                                key={f.flagId}
                                to={`/risk/${f.flagId}`}
                                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface)] hover:bg-rose-50/50 border border-rose-400/60 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-sm)] transition-all cursor-pointer group active:scale-[0.99]"
                              >
                                <LedIndicator status="critical" size="sm" />
                                <span className="text-xs font-mono font-bold text-[var(--critical-fg)]">
                                  Flagged with {f.counterpartName}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-[var(--critical-fg)]/70 group-hover:text-[var(--critical-fg)] group-hover:translate-x-0.5 transition-all" />
                              </Link>
                            ))}
                          </div>
                        )}

                        {/* Standardized code badge if present */}
                        {med.standardizedCode && (
                          <div className="pt-0.5 flex items-center">
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-0.5 rounded-full border shadow-xs text-[var(--ink-3)] ${isFlagged ? 'bg-[var(--surface)] border-rose-200/60' : 'bg-[var(--canvas)] border-[var(--border)]'}`}>
                              <ShieldCheck className="w-3.5 h-3.5 text-[var(--brand-600)] flex-shrink-0" />
                              <span>RxNorm CUI:</span>
                              <span className="font-mono font-bold text-[var(--ink)] tracking-wide">{med.standardizedCode}</span>
                            </span>
                          </div>
                        )}

                        {/* Interactive Clinical Safety & Pharmacovigilance Panel */}
                        {!isDiscontinued && (
                          <div className="pt-1.5">
                            <KnownSideEffectsPanel
                              medicineId={med.id}
                              medicineName={med.name}
                            />
                          </div>
                        )}
                      </Card>
                    </motion.div>
 );
 })}
 </AnimatePresence>
 </div>
 </div>
 )}

 {/* ── Footer Information ────────────────────────────────────────────── */}
 {!isLoading && medicines.length > 0 && (
 <div className="flex items-start space-x-3 p-4 border-2 border-[var(--border)] bg-[var(--canvas)] rounded-2xl">
 <Info className="w-4 h-4 text-[var(--brand-600)] flex-shrink-0 mt-0.5" />
 <p className="text-xs text-[var(--ink-3)] leading-relaxed">
 <strong>Prescription timeline protection:</strong> Prescribing cascades often develop silently over months as new drugs are introduced to treat side effects of previous drugs. This timeline tracks every addition in sequence to assist clinical de-prescribing reviews.
 </p>
 </div>
 )}

 </div>
 </div>
 );
}
