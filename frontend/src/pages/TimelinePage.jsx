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
} from 'lucide-react';
import Card from '../components/Card';
import LedIndicator from '../components/LedIndicator';
import { DrugHarmBadge } from '../components/DrugHarmLevel';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { EmptyTimelineIllustration } from '../components/EmptyIllustrations';
import { TimelineSkeleton } from '../components/Skeletons';
import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';

// ─── Helper: Medicine Type Badge ──────────────────────────────────────────────
function MedicineTypeBadge({ type }) {
  const map = {
    PRESCRIPTION: { icon: <Stethoscope className="w-3 h-3" />, label: 'Rx', cls: 'bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)] border-[var(--accent-secondary)]/25' },
    OTC: { icon: <ShoppingBag className="w-3 h-3" />, label: 'OTC', cls: 'bg-[var(--role-caregiver)]/10 text-[var(--role-caregiver)] border-[var(--role-caregiver)]/25' },
    HERBAL: { icon: <Leaf className="w-3 h-3" />, label: 'Herbal', cls: 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/25' },
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

 const { data, isLoading, isError } = useQuery({
 queryKey: ['patient-timeline'],
 queryFn: fetchTimeline,
 enabled: !!token && !isGuest,
 retry: 1,
 });

 if (isLoading) {
 return (
 <div className="min-h-[88vh] bg-[var(--chassis)] pb-16">
 <TimelineSkeleton />
 </div>
 );
 }

 const medicines = isGuest ? DEMO_TIMELINE_MEDICINES : (data?.medicines ?? (token ? [] : DEMO_TIMELINE_MEDICINES));
 const flaggedCount = medicines.filter((m) => m.flagged).length;
 const herbalCount = medicines.filter((m) => m.type === 'HERBAL').length;

 return (
 <div className="min-h-[88vh] bg-[var(--chassis)] pb-16">
 <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

 {/* ── Header ───────────────────────────────────────────────────────── */}
 <div className="flex items-center space-x-3">
 <button
 onClick={() => navigate('/home')}
 className="btn-secondary p-2.5 rounded-2xl"
 >
 <ArrowLeft className="w-4 h-4" />
 </button>
 <div className="flex-1">
 <h1 className="text-2xl font-bold text-[var(--text-primary)]" >
 Medication Timeline
 </h1>
 <p className="text-xs text-[var(--text-muted)]">
 {isGuest ? 'Sample interactive prescription and cascade timeline' : 'Complete chronological prescription and supplement history'}
 </p>
 </div>
 <Link
 to="/add-medicine"
 onClick={(e) => {
 if (isGuest) {
 e.preventDefault();
 openGuestLockModal('add medications');
 }
 }}
 className="btn-primary flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 relative"
 >
 <Plus className="w-4 h-4" />
 <span>Add Medicine</span>
 {isGuest && <Lock className="w-3 h-3 text-[var(--chassis)] ml-0.5" />}
 </Link>
 </div>

 {/* ── Stats Summary Bar ──────────────────────────────────────────────── */}
 {!isLoading && !isError && medicines.length > 0 && (
 <div className="grid grid-cols-3 gap-3">
 {[
 { label: 'Total Tracked', value: medicines.length, color: 'var(--accent-primary)' },
 { label: 'Risk Flags', value: flaggedCount, color: flaggedCount > 0 ? 'var(--led-critical)' : 'var(--accent-primary)' },
 { label: 'Herbals & OTC', value: herbalCount, color: 'var(--accent-primary)' },
 ].map((s) => (
 <Card key={s.label} className="p-3.5 text-center space-y-0.5">
 <p
 className="text-2xl font-black"
 style={{ color: s.color }}
 >
 {s.value}
 </p>
 <p className="text-[11px] text-[var(--text-muted)] font-semibold">{s.label}</p>
 </Card>
 ))}
 </div>
 )}

 {/* ── Legend ───────────────────────────────────────────────────────── */}
 {!isLoading && medicines.length > 0 && (
 <div className="flex items-center gap-6 px-1">
 <span className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-semibold">
 <span className="w-3.5 h-3.5 rounded-full bg-[var(--chassis)] border-[3px] border-[var(--accent-primary)]" />
 Safe / Normal Entry
 </span>
 <span className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-semibold">
 <span className="w-3.5 h-3.5 rounded-full bg-[var(--chassis)] border-[3px] border-[var(--led-critical)]" />
 Interaction Flagged
 </span>
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
 {!isLoading && !isError && medicines.length === 0 && (
 <Card className="p-10 flex flex-col items-center text-center space-y-4">
 <EmptyTimelineIllustration className="w-36 h-36 mx-auto mb-1" />
 <div>
 <h3 className="text-lg font-bold text-[var(--text-primary)]" >
 No medicines logged yet
 </h3>
 <p className="text-sm text-[var(--text-muted)] mt-1 max-w-sm">
 Add your prescriptions, over-the-counter medicines, and herbal supplements to start generating your safety timeline.
 </p>
 </div>
 <Link to="/add-medicine" className="btn-primary px-6 py-3 inline-flex items-center gap-2">
 <Plus className="w-4 h-4" />
 <span>Add Your First Medicine</span>
 </Link>
 </Card>
 )}

 {/* ── Timeline Display with Vertical #E0824B Line ───────────────────── */}
 {!isLoading && !isError && medicines.length > 0 && (
 <div className="relative pl-2 py-2">
 <motion.div
 className="absolute left-[19px] top-4 bottom-6 w-[3px] z-0 rounded-full origin-top"
 style={{ backgroundColor: 'var(--accent-primary)' }}
 initial={shouldReduceMotion ? { scaleY: 1 } : { scaleY: 0 }}
 animate={{ scaleY: 1 }}
 transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: 'easeOut' }}
 />

 <div className="space-y-6">
 <AnimatePresence initial={false}>
 {medicines.map((med, index) => {
 const isDiscontinued = !!med.discontinued || !!med.removedAt;
 const isFlagged = !isDiscontinued && med.flagged && med.flags?.length > 0;
 const details = parseDosageDetails(med.dosage);

 return (
 <motion.div
 key={med.id}
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
 className="w-[18px] h-[18px] rounded-full bg-[var(--chassis)] flex-shrink-0 mt-4 shadow-sm"
 style={{
 border: `3px solid ${isDiscontinued ? 'var(--chassis-dark)' : isFlagged ? 'var(--led-critical)' : 'var(--accent-primary)'}`,
 }}
 />

 <Card
 hideScrews={true}
 className={`flex-1 space-y-3 transition-all ${
 isDiscontinued
 ? '!bg-[#f8f6f0] dark:!bg-white/[0.03] opacity-75 !border-[var(--chassis-dark)]'
 : isFlagged
 ? '!bg-[#fef2f2] dark:!bg-rose-950/20 !border-rose-400/50 dark:!border-rose-500/40 shadow-[0_2px_14px_rgba(225,29,72,0.08)]'
 : 'bg-[var(--chassis)] border-[rgba(255,255,255,0.4)] hover:shadow-[var(--shadow-card)]'
 }`}
 >
 <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-[rgba(255,255,255,0.25)] dark:border-white/5">
 <span
 className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
 isDiscontinued
 ? 'bg-[var(--chassis-dark)]/60 text-[var(--text-muted)] border border-[var(--chassis-dark)]'
 : isFlagged
 ? 'bg-white/80 dark:bg-black/30 text-[var(--accent-primary)] border border-rose-300/40 shadow-xs'
 : 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/25 shadow-xs'
 }`}
 >
 <span className={`w-1.5 h-1.5 rounded-full ${isDiscontinued ? 'bg-[#9CA3AF]' : 'bg-[var(--accent-primary)]'}`} />
 {med.sourceLabel || 'Self-logged'}
 </span>

 <div className="flex items-center gap-2">
 {isDiscontinued && (
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--chassis)] text-[var(--text-muted)] border border-[var(--chassis-dark)] shadow-xs">
 Discontinued {med.removedAt ? `on ${formatDate(med.removedAt)}` : ''}
 </span>
 )}
 <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] font-medium">
 <CalendarDays className="w-3.5 h-3.5 text-[#9CA3AF]" />
 Started {formatDate(med.dateAdded)}
 </span>
 </div>
 </div>

 <div className="flex items-center justify-between gap-2 flex-wrap">
 <div className="flex items-center gap-2.5 flex-wrap">
 <h3 className={`text-base sm:text-lg font-bold font-display ${isDiscontinued ? 'text-[#4A4F4B] line-through decoration-[#9CA3AF]/60' : 'text-[var(--text-primary)]'}`}>
 {med.name}
 </h3>
 <MedicineTypeBadge type={med.type} />
 {med.harmLevel && <DrugHarmBadge harmLevel={med.harmLevel} size="sm" />}
 </div>
 </div>

 {details && (
 <div className="space-y-1.5 text-xs">
 {details.salts && (
 <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-medium">
 <FlaskConical className="w-3.5 h-3.5 text-[var(--accent-primary)] flex-shrink-0" />
 <span>Salts: <strong className="text-[var(--text-primary)] font-semibold">{details.salts}</strong></span>
 </div>
 )}

 {details.simple ? (
 <p className="text-xs text-[var(--text-muted)] font-mono font-medium">
 Dose: {details.simple}
 </p>
 ) : (
 <div className="flex items-center gap-2 flex-wrap text-[11px] text-[var(--text-muted)] font-mono">
 {details.strength && (
 <span className={`px-2 py-0.5 rounded-md border shadow-xs ${isFlagged ? 'bg-white/90 dark:bg-black/40 border-rose-200/60' : 'bg-[var(--chassis)] border-[rgba(255,255,255,0.4)]'}`}>
 {details.strength}
 </span>
 )}
 {details.form && (
 <span className={`px-2 py-0.5 rounded-md border shadow-xs ${isFlagged ? 'bg-white/90 dark:bg-black/40 border-rose-200/60' : 'bg-[var(--chassis)] border-[rgba(255,255,255,0.4)]'}`}>
 {details.form}
 </span>
 )}
 {details.frequency && (
 <span className={`px-2 py-0.5 rounded-md border shadow-xs ${isFlagged ? 'bg-white/90 dark:bg-black/40 border-rose-200/60' : 'bg-[var(--chassis)] border-[rgba(255,255,255,0.4)]'}`}>
 {details.frequency}
 </span>
 )}
 {details.manufacturer && (
 <span className="text-[10px] text-[var(--text-muted)] opacity-80">
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
                                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-black/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-400/60 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card)] transition-all cursor-pointer group active:scale-[0.99]"
                              >
                                <LedIndicator status="critical" size="sm" />
                                <span className="text-xs font-mono font-bold text-[var(--led-critical)]">
                                  Flagged with {f.counterpartName}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-[var(--led-critical)]/70 group-hover:text-[var(--led-critical)] group-hover:translate-x-0.5 transition-all" />
                              </Link>
                            ))}
                          </div>
                        )}

                        {/* Standardized code badge if present */}
                        {med.standardizedCode && (
                          <div className="pt-0.5 flex items-center">
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-0.5 rounded-full border shadow-xs text-[var(--text-muted)] ${isFlagged ? 'bg-white/80 dark:bg-black/30 border-rose-200/60' : 'bg-[var(--chassis)] border-[rgba(255,255,255,0.4)]'}`}>
                              <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-primary)] flex-shrink-0" />
                              <span>RxNorm CUI:</span>
                              <span className="font-mono font-bold text-[var(--text-primary)] tracking-wide">{med.standardizedCode}</span>
                            </span>
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
 <div className="flex items-start space-x-3 p-4 border-2 border-[var(--chassis-dark)] bg-[var(--chassis)] rounded-2xl">
 <Info className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0 mt-0.5" />
 <p className="text-xs text-[var(--text-muted)] leading-relaxed">
 <strong>Prescription timeline protection:</strong> Prescribing cascades often develop silently over months as new drugs are introduced to treat side effects of previous drugs. This timeline tracks every addition in sequence to assist clinical de-prescribing reviews.
 </p>
 </div>
 )}

 </div>
 </div>
 );
}
