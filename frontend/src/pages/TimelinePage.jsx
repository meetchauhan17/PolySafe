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
} from 'lucide-react';
import Card from '../components/Card';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { EmptyTimelineIllustration } from '../components/EmptyIllustrations';
import { TimelineSkeleton } from '../components/Skeletons';
import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';

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
      <div className="min-h-[88vh] bg-[#EDE8DC] pb-16">
        <TimelineSkeleton />
      </div>
    );
  }

  const medicines = isGuest ? DEMO_TIMELINE_MEDICINES : (data?.medicines ?? (token ? [] : DEMO_TIMELINE_MEDICINES));
  const flaggedCount = medicines.filter((m) => m.flagged).length;
  const herbalCount = medicines.filter((m) => m.type === 'HERBAL').length;

  return (
    <div className="min-h-[88vh] bg-[#EDE8DC] pb-16">
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
            <h1 className="text-2xl font-bold text-[#1C2B27]" style={{ fontFamily: "'Fraunces', serif" }}>
              Medication Timeline
            </h1>
            <p className="text-xs text-[#5C6B64]">
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
            {isGuest && <Lock className="w-3 h-3 text-[#EDE8DC] ml-0.5" />}
          </Link>
        </div>

        {/* ── Stats Summary Bar ──────────────────────────────────────────────── */}
        {!isLoading && !isError && medicines.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Tracked', value: medicines.length, color: '#2B6E5E' },
              { label: 'Risk Flags', value: flaggedCount, color: flaggedCount > 0 ? '#B23D25' : '#2B6E5E' },
              { label: 'Herbals & OTC', value: herbalCount, color: '#2B6E5E' },
            ].map((s) => (
              <Card key={s.label} className="p-3.5 text-center space-y-0.5">
                <p
                  className="text-2xl font-black"
                  style={{ color: s.color, fontFamily: "'Fraunces', serif" }}
                >
                  {s.value}
                </p>
                <p className="text-[11px] text-[#6B726C] font-semibold">{s.label}</p>
              </Card>
            ))}
          </div>
        )}

        {/* ── Legend ───────────────────────────────────────────────────────── */}
        {!isLoading && medicines.length > 0 && (
          <div className="flex items-center gap-6 px-1">
            <span className="flex items-center gap-2 text-xs text-[#6B726C] font-semibold">
              <span className="w-3.5 h-3.5 rounded-full bg-white border-[3px] border-[#2B6E5E]" />
              Safe / Normal Entry
            </span>
            <span className="flex items-center gap-2 text-xs text-[#6B726C] font-semibold">
              <span className="w-3.5 h-3.5 rounded-full bg-white border-[3px] border-[#B23D25]" />
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
              <h3 className="text-lg font-bold text-[#232724]" style={{ fontFamily: "'Fraunces', serif" }}>
                No medicines logged yet
              </h3>
              <p className="text-sm text-[#6B726C] mt-1 max-w-sm">
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
            {/* Continuous Vertical Line: 3px wide, animated draw-down */}
            <motion.div
              className="absolute left-[19px] top-4 bottom-6 w-[3px] z-0 rounded-full origin-top"
              style={{ backgroundColor: '#E0824B' }}
              initial={shouldReduceMotion ? { scaleY: 1 } : { scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: 'easeOut' }}
            />

            <div className="space-y-6">
              <AnimatePresence initial={false}>
                {medicines.map((med, index) => {
                  const isDiscontinued = !!med.discontinued || !!med.removedAt;
                  const isFlagged = !isDiscontinued && med.flagged && med.flags?.length > 0;

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
                      {/* Circular Dot Marker: white fill, colored border (teal #2B6E5E for normal, red #B23D25 for flagged, gray #9CA3AF for discontinued) */}
                      <div
                        className="w-[18px] h-[18px] rounded-full bg-white flex-shrink-0 mt-4 shadow-sm"
                        style={{
                          border: `3.5px solid ${isDiscontinued ? '#9CA3AF' : isFlagged ? '#B23D25' : '#2B6E5E'}`,
                        }}
                      />

                      {/* Content Card */}
                      <Card
                        variant={isDiscontinued ? 'default' : isFlagged ? 'danger' : 'default'}
                        className={`flex-1 space-y-2.5 transition-shadow hover:shadow-md ${
                          isDiscontinued ? 'bg-[#F9F7F2] opacity-85 border-[#D8D2C4]' : ''
                        }`}
                      >
                        {/* Source Label (uppercase, small, teal or muted) */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span
                            className={`text-[11px] font-extrabold uppercase tracking-wider ${
                              isDiscontinued ? 'text-[#6B726C]' : 'text-[#2B6E5E]'
                            }`}
                          >
                            {med.sourceLabel || 'Self-logged'}
                          </span>
                          
                          {/* Date Added */}
                          <div className="flex items-center gap-2">
                            {isDiscontinued && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#EFEBE0] text-[#6B726C] border border-[#E7E1D3]">
                                Discontinued {med.removedAt ? `on ${formatDate(med.removedAt)}` : ''}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-xs text-[#6B726C]">
                              <CalendarDays className="w-3.5 h-3.5 text-[#9CA3AF]" />
                              Started {formatDate(med.dateAdded)}
                            </span>
                          </div>
                        </div>

                        {/* Medicine Name (bold) */}
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <h3 className={`text-base sm:text-lg font-bold ${isDiscontinued ? 'text-[#4A4F4B] line-through decoration-[#9CA3AF]/60' : 'text-[#232724]'}`}>
                            {med.name}
                          </h3>
                          {med.dosage && (
                            <span className="text-xs text-[#6B726C] font-medium">
                              ({med.dosage})
                            </span>
                          )}
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#F5F0E8] border border-[#E7E1D3] text-[#6B726C]">
                            {med.type}
                          </span>
                        </div>

                        {/* Flagged Red Pill Notes */}
                        {isFlagged && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {med.flags.map((f) => (
                              <Link
                                key={f.flagId}
                                to={`/risk/${f.flagId}`}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[#FBE4DE] text-[#B23D25] border border-[#B23D25]/30 hover:bg-[#f7d4cb] transition-colors"
                              >
                                <AlertOctagon className="w-3.5 h-3.5 text-[#B23D25]" />
                                <span>Flagged with {f.counterpartName}</span>
                                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                              </Link>
                            ))}
                          </div>
                        )}

                        {/* Standardized code badge if present */}
                        {med.standardizedCode && (
                          <div className="pt-1 flex items-center gap-1.5 text-[11px] text-[#6B726C]">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#2B6E5E]" />
                            <span>RxNorm CUI: <span className="font-mono font-bold text-[#232724]">{med.standardizedCode}</span></span>
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
          <div className="flex items-start space-x-3 p-4 border-2 border-[#E7E1D3] bg-[#FDFBF7] rounded-2xl">
            <Info className="w-4 h-4 text-[#2B6E5E] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#6B726C] leading-relaxed">
              <strong>Prescription timeline protection:</strong> Prescribing cascades often develop silently over months as new drugs are introduced to treat side effects of previous drugs. This timeline tracks every addition in sequence to assist clinical de-prescribing reviews.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
