/**
 * CaregiverViewPage.jsx — Caregiver Clinical Oversight Portal
 * ─────────────────────────────────────────────────────────────────────────────
 * Route: /caregiver-view
 *
 * Requirements Met:
 * • Emerald role accent (--caregiver-* tokens, #046A38, calming reassuring palette).
 * • Giant status banner (Word + Icon + Color) with high-contrast status messaging.
 * • Today's dose cards in large type with an interactive tap-to-mark state (Taken / Pending).
 * • AdherenceRing with 7-day adherence percentage & streak days.
 * • Comprehensive Alert list (Missed doses, interaction vigilance, geriatric cautions).
 * • Patient switcher as interactive avatar chips with active emerald ring highlight.
 * • Calm layout with generous spacing, respectful of patient privacy (no full PHI/drug names).
 */

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Heart,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Pill,
  Leaf,
  ShoppingBag,
  Bell,
  BellRing,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  ShieldAlert,
  KeyRound,
  Eye,
  Info,
  Calendar,
  Sparkles,
  Check,
  User,
  Users,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  BookOpen,
  ArrowRight,
  Stethoscope,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

import Card from '../components/Card';
import AdherenceRing from '../components/AdherenceRing';
import EmergencyMedicalCardModal from '../components/EmergencyMedicalCardModal';
import { notify } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/useT';
import {
  DEMO_CAREGIVER_PATIENTS,
  DEMO_CAREGIVER_SUMMARY,
} from '../data/mockDoctorCaregiver';

// ─── Extended Offline Mock Patients for Caregiver Switcher ───────────────────
const EXTENDED_DEMO_CAREGIVER_PATIENTS = [
  {
    patientId: 'demo-pat-1',
    patientName: 'Ramesh Patel',
    relationship: 'Father',
    age: 68,
    status: 'CAUTION',
    todayDosesCount: 4,
    emergencyPin: '482-910',
    initials: 'RP',
  },
  {
    patientId: 'demo-pat-2',
    patientName: 'Sunita Sharma',
    relationship: 'Mother',
    age: 62,
    status: 'CRITICAL',
    todayDosesCount: 3,
    emergencyPin: '821-404',
    initials: 'SS',
  },
  {
    patientId: 'demo-pat-3',
    patientName: 'Vikram Malhotra',
    relationship: 'Uncle',
    age: 54,
    status: 'SAFE',
    todayDosesCount: 2,
    emergencyPin: '109-382',
    initials: 'VM',
  },
];

// ─── Status Configuration ─────────────────────────────────────────────────────
const STATUS_CFG = {
  SAFE: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-950/20',
    border: 'border-emerald-500/30 dark:border-emerald-500/40',
    cardBorder: 'border-emerald-500/30',
    text: 'text-emerald-900 dark:text-emerald-100',
    accent: '#046A38',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    Icon: ShieldCheck,
    word: 'ALL CLEAR',
    pill: 'REGIMEN STABLE',
    sublabel:
      'No adverse polypharmacy conflicts detected today. Patient adherence is on schedule and vital signs remain within safe parameters.',
  },
  CAUTION: {
    bg: 'bg-amber-500/10 dark:bg-amber-950/20',
    border: 'border-amber-500/30 dark:border-amber-500/40',
    cardBorder: 'border-amber-500/30',
    text: 'text-amber-950 dark:text-amber-100',
    accent: '#D97706',
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    Icon: AlertTriangle,
    word: 'CAUTION ADVISED',
    pill: 'ACTIVE CONFLICT DETECTED',
    sublabel:
      'Cross-prescribing interactions or OTC supplement synergies detected. Patient has been prompted to consult attending physician for dose adjustments.',
  },
  CRITICAL: {
    bg: 'bg-rose-500/10 dark:bg-rose-950/20',
    border: 'border-rose-500/40 dark:border-rose-500/50',
    cardBorder: 'border-rose-500/40',
    text: 'text-rose-950 dark:text-rose-100',
    accent: '#E11D48',
    iconColor: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    Icon: AlertOctagon,
    word: 'CRITICAL ALERT',
    pill: 'URGENT ATTENTION',
    sublabel:
      'High-severity synergistic toxicity risk identified (e.g., dual anticoagulant load or severe sedation burden). Immediate clinical review strongly advised.',
  },
};

// ─── Time of Day Categorizer ──────────────────────────────────────────────────
function categorizeTimeOfDay(timeStr) {
  if (!timeStr) return { period: 'Scheduled', icon: Clock, color: 'text-[var(--caregiver-600)]' };
  const lower = timeStr.toLowerCase();
  if (lower.includes('am') || lower.includes('morning')) {
    return { period: 'Morning Dose', icon: Sunrise, color: 'text-amber-500' };
  }
  if (lower.includes('pm')) {
    const hour = parseInt(timeStr, 10) || 12;
    if (hour >= 1 && hour < 5) return { period: 'Afternoon Dose', icon: Sun, color: 'text-amber-600' };
    if (hour >= 5 && hour < 9) return { period: 'Evening Dose', icon: Sunset, color: 'text-orange-500' };
    return { period: 'Bedtime Dose', icon: Moon, color: 'text-indigo-400' };
  }
  return { period: 'Scheduled', icon: Clock, color: 'text-[var(--caregiver-600)]' };
}

// ─── Type Icon Component ──────────────────────────────────────────────────────
function TypeIcon({ label }) {
  if (label?.toLowerCase().includes('herbal')) {
    return <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
  }
  if (label?.toLowerCase().includes('otc') || label?.toLowerCase().includes('over-the-counter')) {
    return <ShoppingBag className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
  }
  return <Pill className="w-4 h-4 text-[var(--caregiver-600)]" />;
}

// ─── Caregiver Journal Component ──────────────────────────────────────────────
function CaregiverJournal({ patientId, patientName }) {
  const { t } = useT();
  const storageKey = `polysafe_caregiver_notes_${patientId || 'default'}`;
  const [notes, setNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch {
      return [];
    }
  });
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(notes));
  }, [notes, storageKey]);

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const noteObj = {
      id: Date.now(),
      text: newNote.trim(),
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    };
    setNotes([noteObj, ...notes]);
    setNewNote('');
    notify.success('Observation Logged', `Saved note to ${patientName || 'patient'}'s caregiver journal.`);
  };

  const handleDeleteNote = (id) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  return (
    <Card
      title="Caregiver Daily Journal & Observations"
      subtitle={`Log meal habits, blood pressure readings, or side effects for ${patientName || 'your patient'}`}
      icon={<BookOpen className="w-5 h-5 text-[var(--caregiver-600)]" />}
      badge={
        <span className="text-xs font-mono font-bold text-[var(--caregiver-700)] bg-[var(--caregiver-50)] dark:bg-[var(--caregiver-900)]/40 px-2.5 py-1 rounded-full border border-[var(--caregiver-200)] dark:border-[var(--caregiver-800)]">
          {notes.length} NOTE{notes.length !== 1 ? 'S' : ''}
        </span>
      }
      className="p-6 space-y-4"
    >
      <form onSubmit={handleAddNote} className="flex gap-2.5">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="e.g. Took 8 AM dose after light breakfast. Mild dizziness reported around 10:30 AM..."
          className="flex-1 text-sm px-4 py-3 rounded-2xl bg-[var(--canvas)] border border-[var(--border)] focus:border-[var(--caregiver-600)] focus:outline-none text-[var(--ink)] placeholder:text-[var(--ink-3)] font-sans transition-colors"
        />
        <button
          type="submit"
          disabled={!newNote.trim()}
          className="px-5 py-3 rounded-2xl bg-[var(--caregiver-600)] hover:bg-[var(--caregiver-700)] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Save Note</span>
        </button>
      </form>

      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <p className="text-xs font-mono text-[var(--ink-3)] italic text-center py-4">
            No observations recorded yet today. Click above to log notes for physician visits.
          </p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-[var(--canvas)] border border-[var(--border)] text-xs transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[var(--ink)] font-medium leading-relaxed text-sm">{note.text}</p>
                <span className="text-[10px] font-mono font-bold text-[var(--ink-3)] mt-1 block">
                  {note.date} at {note.timestamp}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteNote(note.id)}
                className="p-1.5 rounded-lg text-[var(--ink-3)] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Delete note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

// ─── Main CaregiverViewPage ───────────────────────────────────────────────────
export default function CaregiverViewPage() {
  const { t } = useT();
  const shouldReduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const { user, isGuest } = useAuth() || {};

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('polysafe_token') : null;
  const shouldFetch = !isGuest && !!token;

  // ── 1. Fetch Invites & Patients ──
  const { data: inviteData, isLoading: loadingInvites } = useQuery({
    queryKey: ['caregiver-invites'],
    queryFn: () => axios.get('/connection/caregiver-invites').then((r) => r.data),
    enabled: shouldFetch,
    staleTime: 10000,
  });

  const { data: patientData, isLoading: loadingPatients } = useQuery({
    queryKey: ['caregiver-patients'],
    queryFn: () => axios.get('/caregiver/my-patients').then((r) => r.data),
    enabled: shouldFetch,
    staleTime: 10000,
  });

  const invites = inviteData?.invites || [];
  const rawPatients = patientData?.patients || [];
  const patients =
    rawPatients.length > 0
      ? rawPatients.map((p) => ({
          ...p,
          initials: (p.patientName || p.name || 'P')
            .split(' ')
            .map((w) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase(),
        }))
      : EXTENDED_DEMO_CAREGIVER_PATIENTS;

  // ── 2. Active Patient State ──
  const [selectedPatientId, setSelectedPatientId] = useState(
    patients[0]?.patientId || 'demo-pat-1'
  );

  const activePatient = useMemo(() => {
    return (
      patients.find((p) => p.patientId === selectedPatientId) ||
      patients[0] || {
        patientId: 'demo-pat-1',
        patientName: 'Ramesh Patel',
        relationship: 'Father',
        age: 68,
        status: 'CAUTION',
        initials: 'RP',
      }
    );
  }, [patients, selectedPatientId]);

  // ── 3. Fetch Active Patient Summary ──
  const isDemo = isGuest || !token || activePatient.patientId?.startsWith('demo-');
  const shouldFetchSummary = !isDemo && !!activePatient.patientId;

  const { data: serverSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['caregiver-summary', activePatient.patientId],
    queryFn: () =>
      axios.get(`/caregiver/patient-summary/${activePatient.patientId}`).then((r) => r.data),
    enabled: shouldFetchSummary,
    staleTime: 15000,
  });

  const summary = serverSummary || {
    ...DEMO_CAREGIVER_SUMMARY,
    patientName: activePatient.patientName,
    age: activePatient.age || 68,
    status: activePatient.status || 'CAUTION',
  };

  // ── 4. Interactive Tap-to-Mark State for Today's Doses ──
  const [dosesState, setDosesState] = useState({});
  const [pingedDoses, setPingedDoses] = useState({});
  const [showEmergencyCard, setShowEmergencyCard] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimPin, setClaimPin] = useState('');
  const [claimError, setClaimError] = useState('');

  // Lock body scroll and handle Escape key for Claim Modal
  useEffect(() => {
    if (!showClaimModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setShowClaimModal(false);
        setClaimError('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [showClaimModal]);

  // Synchronize doses state when patient changes
  useEffect(() => {
    const initial = {};
    (summary.schedule || []).forEach((item, idx) => {
      // Default first dose as taken for demo realism, rest pending
      initial[idx] = idx === 0 ? 'TAKEN' : 'PENDING';
    });
    setDosesState(initial);
  }, [summary.schedule, activePatient.patientId]);

  const toggleDoseState = (index, doseLabel) => {
    setDosesState((prev) => {
      const current = prev[index];
      const next = current === 'TAKEN' ? 'PENDING' : 'TAKEN';
      if (next === 'TAKEN') {
        notify.success('Dose Logged as Taken', `Marked ${doseLabel} as administered.`);
      } else {
        notify.info('Dose Status Reset', `Marked ${doseLabel} as pending.`);
      }
      return { ...prev, [index]: next };
    });
  };

  const handlePingReminder = async (indexOrSlot, time) => {
    const key = String(indexOrSlot);
    setPingedDoses((prev) => ({ ...prev, [key]: true }));

    try {
      if (token && !isDemo && activePatient.patientId) {
        await axios.post(
          `/caregiver/remind-patient/${activePatient.patientId}`,
          { message: `Caregiver check-in: Please take your scheduled ${time || ''} dose.` },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      notify.success(
        'Check-In Alert Dispatched',
        `A reminder was sent to ${activePatient.patientName} for their ${time || 'scheduled'} dose.`
      );
    } catch (err) {
      notify.error('Failed to send reminder', err?.response?.data?.error || err.message);
    }

    setTimeout(() => {
      setPingedDoses((prev) => ({ ...prev, [key]: false }));
    }, 6000);
  };

  // ── 5. Claim PIN Mutation ──
  const claimMut = useMutation({
    mutationFn: (code) => axios.post('/connection/claim-code', { code }).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['caregiver-patients'] });
      queryClient.invalidateQueries({ queryKey: ['caregiver-invites'] });
      setShowClaimModal(false);
      setClaimPin('');
      setClaimError('');
      notify.success('Patient Linked', data.message || 'Caregiver connection activated.');
    },
    onError: (err) => {
      setClaimError(err?.response?.data?.error || 'Invalid PIN code. Please confirm with patient.');
    },
  });

  const handleClaimSubmit = (e) => {
    e.preventDefault();
    const trimmed = claimPin.trim();
    if (!trimmed || trimmed.length !== 6) {
      setClaimError('Please enter a valid 6-digit access PIN.');
      return;
    }
    claimMut.mutate(trimmed);
  };

  const statusConfig = STATUS_CFG[summary.status] || STATUS_CFG.SAFE;
  const StatusIcon = statusConfig.Icon;

  // Doses count calculation
  const totalDoses = summary.schedule?.length || 0;
  const takenCount = Object.values(dosesState).filter((s) => s === 'TAKEN').length;
  const pendingCount = totalDoses - takenCount;

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans">
      {/* ── 1. Page Header (Emerald Role Accent & Link Action) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[var(--caregiver-50)] text-[var(--caregiver-700)] dark:bg-[var(--caregiver-900)]/40 dark:text-[var(--caregiver-300)] border border-[var(--caregiver-200)] dark:border-[var(--caregiver-800)] mb-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-[var(--caregiver-600)] animate-pulse" />
            <span>FAMILY OVERSIGHT PORTAL</span>
            <span>·</span>
            <span>EMERALD SHIELD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--ink)] tracking-tight font-[var(--font-heading)]">
            Caregiver Oversight
          </h1>
          <p className="text-xs sm:text-sm text-[var(--ink-2)] mt-1 font-sans">
            Calm real-time medication schedule tracking, adherence check-ins, and safety surveillance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowClaimModal(true)}
          className="self-start sm:self-center px-4 py-2.5 rounded-2xl bg-[var(--caregiver-600)] hover:bg-[var(--caregiver-700)] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
        >
          <KeyRound className="w-4 h-4" />
          <span>Link Patient via PIN</span>
        </button>
      </div>

      {/* ── 2. Patient Switcher: Interactive Avatar Chips ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--ink-3)] flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[var(--caregiver-600)]" />
            <span>Monitored Family Members ({patients.length})</span>
          </span>
          <span className="text-[11px] font-mono text-[var(--ink-3)]">
            Click avatar chip to switch focus
          </span>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {patients.map((p) => {
            const isSelected = p.patientId === activePatient.patientId;
            const patientStatus = (p.status || 'SAFE').toUpperCase();
            const statusDotColor =
              patientStatus === 'CRITICAL'
                ? 'bg-rose-500'
                : patientStatus === 'CAUTION'
                ? 'bg-amber-500'
                : 'bg-emerald-500';

            return (
              <button
                key={p.patientId}
                type="button"
                onClick={() => setSelectedPatientId(p.patientId)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all cursor-pointer text-left flex-shrink-0 ${
                  isSelected
                    ? 'bg-[var(--surface)] border-[var(--caregiver-600)] ring-2 ring-[var(--caregiver-600)]/40 shadow-sm'
                    : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--caregiver-300)] opacity-75 hover:opacity-100'
                }`}
              >
                {/* Avatar Initials Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm font-[var(--font-heading)] ${
                    isSelected
                      ? 'bg-[var(--caregiver-600)] text-white'
                      : 'bg-[var(--canvas-2)] text-[var(--ink-2)]'
                  }`}
                >
                  {p.initials || 'PT'}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-[var(--ink)] font-[var(--font-heading)]">
                      {p.patientName}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${statusDotColor}`} />
                  </div>
                  <span className="text-xs text-[var(--ink-3)] font-mono">
                    {p.relationship ? `${p.relationship} · ` : ''}Age {p.age || 65}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Giant Status Banner (Word + Icon + Color) ── */}
      <motion.div
        key={activePatient.patientId}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`p-6 sm:p-8 rounded-3xl border-2 ${statusConfig.bg} ${statusConfig.border} shadow-sm space-y-6`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-5">
            {/* Giant Icon */}
            <div
              className={`p-4 rounded-3xl ${statusConfig.iconBg} border border-current/20 flex-shrink-0 shadow-xs`}
            >
              <StatusIcon className="w-12 h-12" />
            </div>

            {/* Giant Word & High-Contrast Banner Text */}
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-[var(--ink-3)]">
                  {activePatient.patientName} · Age {activePatient.age || 68}
                </span>
                <span
                  className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border shadow-xs"
                  style={{
                    backgroundColor: 'var(--canvas)',
                    borderColor: statusConfig.accent,
                    color: statusConfig.accent,
                  }}
                >
                  {statusConfig.pill}
                </span>
              </div>

              <h2
                className="text-3xl sm:text-4xl font-black tracking-tight font-[var(--font-heading)]"
                style={{ color: statusConfig.accent }}
              >
                {statusConfig.word}
              </h2>

              <p className="text-xs sm:text-sm text-[var(--ink-2)] max-w-2xl leading-relaxed pt-1">
                {statusConfig.sublabel}
              </p>
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex sm:flex-col gap-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={() =>
                handlePingReminder(
                  'hero-general',
                  'today',
                  `Gentle check-in: Remember to take your scheduled medications for today.`
                )
              }
              disabled={pingedDoses['hero-general']}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl text-xs font-bold bg-[var(--caregiver-600)] hover:bg-[var(--caregiver-700)] text-white flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Bell className="w-4 h-4" />
              <span>{pingedDoses['hero-general'] ? 'Alert Sent!' : 'Send Check-In Ping'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowEmergencyCard(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 border border-rose-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Emergency SOS</span>
            </button>
          </div>
        </div>

        {/* Privacy Assurance Footnote */}
        <div className="flex items-center gap-2 pt-4 border-t border-[var(--border)]/60 text-xs text-[var(--ink-3)] font-mono">
          <Eye className="w-4 h-4 text-[var(--caregiver-600)]" />
          <span>Caregiver Privacy Shield Active: Schedule and compliance only · Longitudinal EHR history protected.</span>
        </div>
      </motion.div>

      {/* ── 4. Adherence Ring & Daily KPI Summary ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Adherence Ring Card */}
        <Card
          title="7-Day Adherence"
          subtitle="Overall compliance streak"
          icon={<Heart className="w-5 h-5 text-[var(--caregiver-600)]" />}
          className="p-6 flex flex-col items-center justify-center text-center space-y-3"
        >
          <AdherenceRing
            percentage={summary.adherencePercentage || 88}
            streakDays={summary.streakDays || 6}
            size={110}
            strokeWidth={9}
            label="Adherence"
            sublabel="7-Day Average"
          />
          <div className="text-center pt-2">
            <span className="text-xs font-mono font-bold text-[var(--caregiver-700)] dark:text-[var(--caregiver-300)] bg-[var(--caregiver-50)] dark:bg-[var(--caregiver-900)]/40 px-3 py-1 rounded-full border border-[var(--caregiver-200)] dark:border-[var(--caregiver-800)]">
              {summary.streakDays || 6} Day Streak Maintained
            </span>
          </div>
        </Card>

        {/* Today's Dose Stats */}
        <Card
          title="Today's Administration"
          subtitle="Real-time compliance checklist"
          icon={<Clock className="w-5 h-5 text-[var(--caregiver-600)]" />}
          className="p-6 md:col-span-2 space-y-4"
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-[var(--canvas)] border border-[var(--border)] text-center">
              <p className="text-2xl sm:text-3xl font-black text-[var(--ink)] font-mono">
                {totalDoses}
              </p>
              <p className="text-[11px] font-mono font-bold uppercase text-[var(--ink-3)] mt-1">
                Scheduled Doses
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-center">
              <p className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                {takenCount}
              </p>
              <p className="text-[11px] font-mono font-bold uppercase text-emerald-800 dark:text-emerald-200 mt-1">
                Administered
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-center">
              <p className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-300 font-mono">
                {pendingCount}
              </p>
              <p className="text-[11px] font-mono font-bold uppercase text-amber-800 dark:text-amber-200 mt-1">
                Remaining
              </p>
            </div>
          </div>

          <p className="text-xs text-[var(--ink-3)] font-mono leading-relaxed">
            Click on any dose below to mark it as administered or send an immediate reminder ping to the patient's phone.
          </p>
        </Card>
      </div>

      {/* ── 5. Today's Dose Cards (Large Type with Tap-to-Mark State) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--caregiver-600)]" />
            <h2 className="text-lg font-bold text-[var(--ink)] font-[var(--font-heading)]">
              Today's Scheduled Medication Doses
            </h2>
          </div>
          <span className="hidden sm:inline text-xs font-mono font-bold text-[var(--ink-3)]">
            Tap dose tile to toggle administered state
          </span>
        </div>

        <div className="space-y-3.5">
          {(summary.schedule || []).map((item, idx) => {
            const timeCat = categorizeTimeOfDay(item.time);
            const PeriodIcon = timeCat.icon;
            const isTaken = dosesState[idx] === 'TAKEN';
            const isPinged = pingedDoses[idx];

            return (
              <motion.div
                key={idx}
                layout={!shouldReduceMotion}
                className={`p-5 sm:p-6 rounded-3xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isTaken
                    ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--caregiver-400)] shadow-xs'
                }`}
              >
                {/* Left: Time Badge & Drug Category Details */}
                <div className="flex items-start sm:items-center gap-4">
                  {/* Large Time Badge */}
                  <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-[var(--canvas)] border border-[var(--border)] min-w-[90px] text-center font-mono flex-shrink-0 shadow-2xs">
                    <PeriodIcon className={`w-5 h-5 ${timeCat.color} mb-1`} />
                    <span className="text-base sm:text-xl font-black text-[var(--ink)]">
                      {item.time}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--ink-3)] uppercase mt-0.5">
                      {timeCat.period}
                    </span>
                  </div>

                  {/* Large Type Details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <TypeIcon label={item.type} />
                      <span className="text-lg sm:text-xl font-black text-[var(--ink)] font-[var(--font-heading)]">
                        {item.category || item.type || 'Prescription Dose'}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[var(--canvas-2)] text-[var(--ink-3)] border border-[var(--border)]">
                        {item.type || 'Prescription'}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[var(--ink-2)] font-mono leading-relaxed">
                      {item.instruction || 'Administer with water as indicated.'}
                    </p>
                  </div>
                </div>

                {/* Right: Tap-to-Mark Button & Ping Reminder */}
                <div className="flex items-center gap-2.5 self-end sm:self-center flex-shrink-0">
                  {/* Ping Reminder Action */}
                  <button
                    type="button"
                    onClick={() => handlePingReminder(idx, item.time)}
                    disabled={isPinged}
                    title="Send instant check-in notification to patient's device"
                    className={`p-3 rounded-2xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isPinged
                        ? 'bg-[var(--caregiver-600)] text-white border-[var(--caregiver-600)]'
                        : 'bg-[var(--canvas)] border-[var(--border)] text-[var(--ink-2)] hover:border-[var(--caregiver-600)] hover:text-[var(--caregiver-600)]'
                    }`}
                  >
                    <BellRing className={`w-4 h-4 ${isPinged ? 'animate-bounce' : ''}`} />
                    <span className="hidden sm:inline">{isPinged ? 'Sent!' : 'Remind'}</span>
                  </button>

                  {/* Tap-to-Mark State Button */}
                  <button
                    type="button"
                    onClick={() =>
                      toggleDoseState(idx, `${item.time} ${item.category || 'dose'}`)
                    }
                    className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 ${
                      isTaken
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-[var(--canvas)] hover:bg-[var(--caregiver-50)] text-[var(--ink)] border-2 border-[var(--border)] hover:border-[var(--caregiver-600)]'
                    }`}
                  >
                    {isTaken ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Taken</span>
                      </>
                    ) : (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-[var(--ink-3)]" />
                        <span>Mark Taken</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── 6. Alert List ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-[var(--caregiver-600)]" />
          <h2 className="text-lg font-bold text-[var(--ink)] font-[var(--font-heading)]">
            Clinical Safety & Vigilance Advisories
          </h2>
        </div>

        <div className="space-y-3">
          {/* Missed Dose Banner (if any) */}
          {summary.todayMissedCount > 0 && (
            <div className="p-5 rounded-3xl bg-rose-500/10 border-2 border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-rose-600 text-white flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-rose-800 dark:text-rose-200 uppercase tracking-wide">
                    Overdue Dose Alert ({summary.todayMissedCount} Scheduled Dose Overdue)
                  </h4>
                  <p className="text-xs text-[var(--ink-2)] mt-0.5 leading-relaxed font-sans">
                    A scheduled morning medication was not logged within the 60-minute window. Please check in with {activePatient.patientName}.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  handlePingReminder('missed-alert', 'overdue')
                }
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-center flex-shrink-0"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Check-In Now</span>
              </button>
            </div>
          )}

          {/* Anticholinergic & Fall Risk Caution */}
          <Card
            variant="caution"
            className="p-5 space-y-2 border-l-4 border-l-amber-500"
          >
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Geriatric Fall & Sedation Vigilance (Beers 2023)</span>
            </div>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Active regimens containing central-acting agents or nocturnal sedatives require adequate hydration and assistance during night-time ambulation.
            </p>
          </Card>

          {/* Botanical / Herb Spacing Advisory */}
          <Card className="p-5 space-y-2 border-l-4 border-l-emerald-600">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-bold text-sm">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <span>Supplement Spacing & Botanical Advisory</span>
            </div>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Herbal supplements (e.g. Curcumin or Ginkgo biloba) should be separated from prescription doses by at least 2 hours to avoid metabolic clearance competition.
            </p>
          </Card>
        </div>
      </div>

      {/* ── 7. Caregiver Journal ── */}
      <CaregiverJournal
        patientId={activePatient.patientId}
        patientName={activePatient.patientName}
      />

      {/* ── 8. Link Patient via PIN Modal ── */}
      {showClaimModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowClaimModal(false);
              setClaimError('');
            }
          }}
        >
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-4 z-[201] my-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[var(--caregiver-600)]" />
                <h3 className="text-base font-bold text-[var(--ink)] font-[var(--font-heading)]">
                  Link Patient via 6-Digit PIN
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowClaimModal(false);
                  setClaimError('');
                }}
                className="p-1 rounded-lg text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Enter the temporary 6-digit access code displayed on your family member's screen under "Share with Doctor / Caregiver".
            </p>

            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <input
                type="text"
                maxLength={6}
                value={claimPin}
                onChange={(e) => {
                  setClaimPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                  if (claimError) setClaimError('');
                }}
                placeholder="849210"
                className="w-full py-3.5 text-center font-mono text-2xl font-black tracking-widest bg-[var(--canvas)] border border-[var(--border)] rounded-2xl outline-none focus:border-[var(--caregiver-600)]"
                autoFocus
              />

              {claimError && (
                <p className="text-xs text-rose-600 font-bold text-center">{claimError}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="ps-btn ps-btn-secondary py-2 px-4 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={claimPin.length !== 6 || claimMut.isPending}
                  className="px-5 py-2 rounded-2xl bg-[var(--caregiver-600)] hover:bg-[var(--caregiver-700)] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm disabled:opacity-40 cursor-pointer"
                >
                  {claimMut.isPending ? 'Verifying...' : 'Link Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── 9. Emergency Medical Card Modal ── */}
      <EmergencyMedicalCardModal
        isOpen={showEmergencyCard}
        onClose={() => setShowEmergencyCard(false)}
        isDemo={true}
      />
    </div>
  );
}
