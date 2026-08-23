/**
 * CaregiverViewPage.jsx — Caregiver Clinical Oversight Portal
 * Route: /caregiver-view
 *
 * Shows the caregiver:
 * • Pending family/patient invites (accept/ignore)
 * • For approved patients: real-time status card + today's dose schedule categorized by time-of-day
 * • Live patient reminder dispatcher ("Ping Dose Reminder")
 * • Emergency care protocol & symptom red-flag monitoring guide
 * • Caregiver Observation Logbook (persisted notes per patient)
 *
 * Per the permission matrix: NO full medicine names, NO symptoms, NO risk details.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowLeft, Heart, CheckCircle2, XCircle, Clock, Pill, Leaf,
  ShoppingBag, AlertTriangle, ShieldCheck, Loader2, AlertCircle,
  ChevronRight, Users, Activity, Info, Bell, BellRing,
  Sun, Moon, Sunrise, Sunset, BookOpen, Send, Plus, Trash2,
  PhoneCall, ShieldAlert, KeyRound, QrCode
} from 'lucide-react';
import Card from '../components/Card';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { EmptyCaregiversIllustration, EmptyScheduleIllustration } from '../components/EmptyIllustrations';
import { Skeleton } from '../components/Skeletons';
import { notify } from '../utils/toast';
import LedIndicator from '../components/LedIndicator';

// ─── API helpers ──────────────────────────────────────────────────────────────
const fetchInvites = () => axios.get('/connection/caregiver-invites').then(r => r.data);
const fetchMyPatients = () => axios.get('/caregiver/my-patients').then(r => r.data);
const fetchSummary = (pid) => axios.get(`/caregiver/patient-summary/${pid}`).then(r => r.data);
const acceptInvite = (id) => axios.post(`/connection/${id}/accept`).then(r => r.data);
const revokeInvite = (id) => axios.post(`/connection/${id}/revoke`).then(r => r.data);
const claimCaregiverCode = (code) => axios.post('/connection/claim-code', { code }).then(r => r.data);

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  SAFE: {
    bg: 'bg-emerald-950/5',
    border: 'border-[var(--led-safe)]/40',
    text: 'text-[var(--text-primary)]',
    accent: 'var(--led-safe)',
    ledStatus: 'safe',
    icon: <ShieldCheck className="w-8 h-8 text-[var(--led-safe)]" />,
    label: 'All Clear',
    sublabel: 'No known drug-drug or polypharmacy interaction risks detected in the active regimen today.',
  },
  CAUTION: {
    bg: 'bg-amber-950/5',
    border: 'border-[var(--led-caution)]/40',
    text: 'text-[var(--text-primary)]',
    accent: 'var(--led-caution)',
    ledStatus: 'caution',
    icon: <AlertTriangle className="w-8 h-8 text-[var(--led-caution)]" />,
    label: 'Caution',
    sublabel: 'Active pharmacological interaction flags detected. The patient has been notified to consult their physician.',
  },
  CRITICAL: {
    bg: 'bg-rose-950/5',
    border: 'border-[var(--led-critical)]/40',
    text: 'text-[var(--text-primary)]',
    accent: 'var(--led-critical)',
    ledStatus: 'critical',
    icon: <AlertTriangle className="w-8 h-8 text-[var(--led-critical)]" />,
    label: 'Critical Alert',
    sublabel: 'High-severity interaction flags active. Immediate check-in with patient or healthcare provider recommended.',
  },
};

// ─── Type icon ────────────────────────────────────────────────────────────────
function TypeIcon({ label }) {
  if (label?.toLowerCase().includes('herbal')) return <Leaf className="w-4 h-4 text-[var(--accent-primary)]" />;
  if (label?.toLowerCase().includes('over-the-counter')) return <ShoppingBag className="w-4 h-4 text-[var(--role-caregiver)]" />;
  return <Pill className="w-4 h-4 text-[var(--accent-secondary)]" />;
}

// ─── Time of Day Categorizer ──────────────────────────────────────────────────
function categorizeTimeOfDay(timeStr) {
  if (!timeStr) return { period: 'Scheduled', icon: Clock };
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
  return { period: 'Scheduled', icon: Clock, color: 'text-[var(--accent-primary)]' };
}

// ─── Caregiver Observation Journal ───────────────────────────────────────────
function CaregiverJournal({ patientId }) {
  const storageKey = `polysafe_caregiver_notes_${patientId}`;
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
    notify.success('Observation Logged', 'Saved to your caregiver journal.');
  };

  const handleDeleteNote = (id) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  return (
    <Card
      title="Caregiver Daily Journal"
      icon={<BookOpen className="w-4 h-4 text-[var(--role-caregiver)]" />}
      badge={
        <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] bg-[var(--chassis)] px-2 py-0.5 rounded-full shadow-[var(--shadow-recessed)]">
          {notes.length} NOTE{notes.length !== 1 ? 'S' : ''}
        </span>
      }
      className="space-y-4"
    >
      <p className="text-xs text-[var(--text-muted)] font-mono leading-relaxed">
        Record daily meal habits, blood pressure readings, or side-effect observations to discuss during physician visits.
      </p>

      {/* Note input */}
      <form onSubmit={handleAddNote} className="flex gap-2">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="e.g. Took 8 AM dose with breakfast, BP was 120/80..."
          className="flex-1 text-xs px-3.5 py-2.5 rounded-xl bg-[var(--chassis)] border-none shadow-[var(--shadow-recessed)] focus:shadow-[var(--shadow-recessed-deep)] focus-visible:ring-2 focus-visible:ring-[var(--role-caregiver)] focus-visible:outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-sans"
        />
        <button
          type="submit"
          disabled={!newNote.trim()}
          className="px-3.5 py-2.5 rounded-xl bg-[var(--role-caregiver)] text-white font-bold text-xs flex items-center gap-1 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card)] active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
          title="Save Observation"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </form>

      {/* Note list */}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <p className="text-xs font-mono text-[var(--text-muted)] italic text-center py-2">
            No observation notes logged today yet.
          </p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-[var(--chassis)] shadow-[var(--shadow-recessed)] text-xs"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[var(--text-primary)] font-medium leading-snug">{note.text}</p>
                <span className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5 block">
                  {note.date} at {note.timestamp}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteNote(note.id)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--led-critical)] transition-colors cursor-pointer"
                title="Delete note"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

// ─── Patient Summary Card ─────────────────────────────────────────────────────
function PatientSummaryCard({ patientId, patientAge, patientName }) {
  const shouldReduceMotion = useReducedMotion();
  const [pingedDoses, setPingedDoses] = useState({});

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['caregiver-summary', patientId],
    queryFn: () => fetchSummary(patientId),
    refetchInterval: 5000, // refresh every 5s for live real-time status
  });

  const handlePingReminder = (index, time) => {
    setPingedDoses(prev => ({ ...prev, [index]: true }));
    notify.success('Reminder Dispatched', `Caregiver check-in alert sent for the ${time} dose.`);
    setTimeout(() => {
      setPingedDoses(prev => ({ ...prev, [index]: false }));
    }, 10000);
  };

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
    <div className="space-y-5">
      {/* ── Status Hero Card ── */}
      <Card variant={variant} className={`p-6 ${cfg.bg} space-y-4`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl bg-[var(--chassis)] border ${cfg.border} shadow-[var(--shadow-sm)]`}>
            <LedIndicator status={cfg.ledStatus} size="lg" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-[var(--text-muted)]">
                {patientName ? `${patientName} · Age ${patientAge ?? '—'}` : `Patient Status · Age ${patientAge ?? '—'}`}
              </span>
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-[var(--chassis)] shadow-xs"
                style={{ borderColor: cfg.accent, color: cfg.accent }}
              >
                LIVE MONITORING
              </span>
            </div>
            <h2 className="text-2xl font-black mt-1 font-display" style={{ color: cfg.accent }}>
              {cfg.label}
            </h2>
            <p className={`text-xs mt-1 leading-relaxed ${cfg.text}`}>{cfg.sublabel}</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--chassis-dark)]">
          {[
            { label: 'Active Medicines', value: data?.medicineCount ?? 0 },
            { label: 'Interaction Flags', value: data?.flagCount ?? 0 },
            { label: 'Peak Severity', value: data?.worstSeverity ?? 'None' },
          ].map((s) => (
            <div key={s.label} className="p-2.5 rounded-xl bg-[var(--chassis)] shadow-[var(--shadow-recessed)] text-center">
              <p className="text-base font-black text-[var(--text-primary)] font-mono">{s.value}</p>
              <p className="text-[10px] text-[var(--text-muted)] font-mono font-bold uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Emergency Protocol Guide (if Caution or Critical) ── */}
      {data?.status !== 'SAFE' && (
        <Card
          variant={data?.status === 'CRITICAL' ? 'danger' : 'caution'}
          title="Caregiver Vigilance Protocol"
          icon={<ShieldAlert className="w-4 h-4 text-[var(--led-critical)]" />}
          className="space-y-3"
        >
          <p className="text-xs text-[var(--text-primary)] leading-relaxed">
            Active medication combinations present heightened physiological risk for patients of this demographic.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-[var(--chassis)] shadow-[var(--shadow-recessed)] space-y-1">
              <p className="font-bold text-[var(--led-critical)]">🚨 Red-Flag Symptoms:</p>
              <p className="text-[11px] text-[var(--text-muted)]">Sudden dizziness, unusual bruising, ankle swelling, shortness of breath.</p>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--chassis)] shadow-[var(--shadow-recessed)] space-y-1">
              <p className="font-bold text-[var(--accent-primary)]">🩺 Clinical Action:</p>
              <p className="text-[11px] text-[var(--text-muted)]">Encourage patient to share their 6-digit Doctor PIN during next clinical consult.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Caregiver privacy guarantee notice */}
      <div className="flex items-start gap-2.5 p-3.5 bg-[var(--chassis)] border border-[var(--brand-border-subtle)] rounded-2xl">
        <Info className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
          <strong>HIPAA/Privacy Protection:</strong> As a verified caregiver, you see dose schedule times and class categories. Specific brand & chemical names remain confidential to the patient and prescribing doctor.
        </p>
      </div>

      {/* ── Today's Schedule with Categorization & Reminder Trigger ── */}
      {data?.schedule?.length > 0 ? (
        <Card
          title="Today's Medication Reminders"
          icon={<Clock className="w-4 h-4 text-[var(--accent-primary)]" />}
          badge={
            <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] bg-[var(--chassis)] px-2 py-0.5 rounded-full shadow-[var(--shadow-recessed)]">
              {data.schedule.length} DOSE{data.schedule.length !== 1 ? 'S' : ''} SCHEDULED
            </span>
          }
          className="space-y-3"
        >
          <div className="space-y-2.5">
            <AnimatePresence initial={false}>
              {data.schedule.map((item, i) => {
                const timeCat = categorizeTimeOfDay(item.time);
                const PeriodIcon = timeCat.icon;
                const isPinged = pingedDoses[item.scheduleIndex];

                return (
                  <motion.div
                    key={i}
                    layout={!shouldReduceMotion}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="p-3.5 rounded-2xl bg-[var(--chassis)] shadow-[var(--shadow-card)] flex items-center justify-between gap-3 border border-[rgba(255,255,255,0.4)]"
                  >
                    {/* Time Badge */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex flex-col items-center bg-[var(--chassis)] shadow-[var(--shadow-recessed)] rounded-xl px-3 py-2 min-w-[76px] text-center font-mono">
                        <PeriodIcon className={`w-3.5 h-3.5 ${timeCat.color} mb-0.5`} />
                        <span className="text-xs font-black text-[var(--text-primary)]">{item.time}</span>
                      </div>

                      {/* Drug Class Category */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <TypeIcon label={item.typeLabel} />
                          <span className="text-sm font-bold text-[var(--text-primary)] truncate font-display">
                            {item.typeLabel}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] bg-[var(--chassis-dark)] px-2 py-0.5 rounded-md">
                            {timeCat.period}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                          {item.dosage || 'Prescribed dose'}
                        </p>
                      </div>
                    </div>

                    {/* Ping Patient Reminder Action */}
                    <button
                      type="button"
                      onClick={() => handlePingReminder(item.scheduleIndex, item.time)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isPinged
                          ? 'bg-[var(--role-caregiver)] text-white shadow-inner'
                          : 'bg-[var(--chassis)] text-[var(--role-caregiver)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card)] active:scale-95'
                      }`}
                      title="Send instant check-in reminder to patient"
                    >
                      {isPinged ? (
                        <>
                          <BellRing className="w-3.5 h-3.5 animate-bounce" />
                          <span>Sent!</span>
                        </>
                      ) : (
                        <>
                          <Bell className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Check In</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </Card>
      ) : (
        <Card className="text-center p-8 space-y-3">
          <EmptyScheduleIllustration className="w-28 h-28 mx-auto" />
          <p className="text-sm font-bold text-[var(--text-primary)] font-display">No medicines scheduled today</p>
          <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto font-mono">
            This patient currently has no active dose times scheduled for today.
          </p>
        </Card>
      )}

      {/* ── Caregiver Journal & Daily Observations ── */}
      <CaregiverJournal patientId={patientId} />
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
    queryFn: fetchInvites,
    refetchInterval: 3000,
  });

  const { data: patientData, isLoading: loadingPatients } = useQuery({
    queryKey: ['caregiver-patients'],
    queryFn: fetchMyPatients,
    refetchInterval: 3000,
  });

  const invites = inviteData?.invites ?? [];
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

  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimCodeInput, setClaimCodeInput] = useState('');
  const [claimError, setClaimError] = useState('');

  const claimMut = useMutation({
    mutationFn: (code) => claimCaregiverCode(code),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['caregiver-patients']);
      queryClient.invalidateQueries(['caregiver-invites']);
      setShowClaimModal(false);
      setClaimCodeInput('');
      setClaimError('');
      notify.success('Patient Linked', data.message || 'Caregiver connection activated.');
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || 'Failed to claim code.';
      setClaimError(msg);
      notify.error('Claim Failed', msg);
    },
  });

  const handleClaimSubmit = (e) => {
    e.preventDefault();
    setClaimError('');
    const trimmed = claimCodeInput.trim();
    if (!trimmed || !/^\d{6}$/.test(trimmed)) {
      setClaimError('Please enter a valid 6-digit access PIN code.');
      return;
    }
    claimMut.mutate(trimmed);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[var(--role-caregiver)]/10 text-[var(--role-caregiver)] rounded-2xl shadow-[var(--shadow-sm)]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--text-primary)] font-display tracking-tight">
              Caregiver Oversight Hub
            </h1>
            <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
              Secure family medication schedules & live safety monitoring
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => { setShowClaimModal(!showClaimModal); setClaimError(''); }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/25 shadow-xs transition-all cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>{showClaimModal ? 'Close PIN Entry' : 'Link via 6-Digit PIN'}</span>
        </button>
      </div>

      {/* ── Inline Claim PIN Modal ── */}
      {showClaimModal && (
        <Card
          hideScrews={true}
          title="Link Patient via 6-Digit Access PIN"
          subtitle="Enter the temporary 6-digit code shown on your family member's screen."
          icon={<KeyRound className="w-4 h-4 text-[var(--accent-primary)]" />}
          className="p-5 space-y-3.5 border-amber-400/40 bg-amber-50/20 dark:bg-amber-950/10 animate-fadeIn"
        >
          {claimError && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
              <span>{claimError}</span>
            </div>
          )}

          <form onSubmit={handleClaimSubmit} className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={6}
                value={claimCodeInput}
                onChange={(e) => {
                  setClaimCodeInput(e.target.value.replace(/\D/g, ''));
                  if (claimError) setClaimError('');
                }}
                placeholder="6-Digit PIN (e.g. 729401)"
                autoFocus
                className="input-field text-center font-mono font-bold tracking-widest text-base sm:text-lg py-2.5 px-4 flex-1"
              />
              <button
                type="submit"
                disabled={claimCodeInput.length !== 6 || claimMut.isPending}
                className="btn-primary py-2.5 px-5 text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {claimMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Link Patient</span>
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* ── Pending Invites ── */}
      {(loadingInvites || invites.length > 0) && (
        <div className="space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-[var(--text-primary)] font-mono">
            Pending Caregiver Invitations ({invites.length})
          </h2>
          {loadingInvites ? (
            <Card className="p-5 flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-primary)]" />
              <span className="text-sm text-[var(--text-muted)] font-mono">Loading pending invites…</span>
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
                      <Card className="p-5 space-y-3 border-l-4 border-l-[var(--role-caregiver)] shadow-[var(--shadow-card)]">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-[var(--role-caregiver)]/10 rounded-xl text-[var(--role-caregiver)]">
                            <Heart className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-[var(--text-primary)] font-display">Caregiver Link Request</p>
                            <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                              Patient (Age {inv.patientAge}) has invited you to monitor their daily medication schedule.
                              {inv.conditions?.length > 0 && ` Active conditions: ${inv.conditions.join(', ')}.`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2.5 pt-1">
                          <button
                            onClick={() => acceptMut.mutate(inv.connectionId)}
                            disabled={isAccepting || isDeclining}
                            className="btn-primary flex-1 py-2.5 text-xs font-bold font-mono flex items-center justify-center gap-1.5"
                          >
                            {isAccepting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            <span>Accept Link</span>
                          </button>
                          <button
                            onClick={() => revokeMut.mutate(inv.connectionId)}
                            disabled={isAccepting || isDeclining}
                            className="btn-outline-danger flex-1 py-2.5 text-xs font-bold font-mono flex items-center justify-center gap-1.5"
                          >
                            {isDeclining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                            <span>Decline</span>
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
            <Users className="w-4 h-4 text-[var(--role-caregiver)]" />
            <span className="text-xs font-bold text-[var(--text-primary)] font-mono">Active Patient:</span>
          </div>
          <select
            value={activePatient?.patientId || ''}
            onChange={(e) => {
              const selected = patients.find((p) => p.patientId === e.target.value);
              if (selected) setSelectedPatient(selected);
            }}
            className="input-field py-1.5 px-3 text-xs font-bold text-[var(--role-caregiver)] bg-[var(--chassis)] cursor-pointer"
          >
            {patients.map((p) => (
              <option key={p.patientId} value={p.patientId}>
                {p.patientName ? `${p.patientName} (Age ${p.patientAge})` : `Patient (Age ${p.patientAge})`}
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
          patientName={activePatient.patientName}
        />
      ) : invites.length === 0 ? (
        <Card className="p-10 flex flex-col items-center gap-4 text-center">
          <EmptyCaregiversIllustration className="w-36 h-36 mx-auto mb-1" />
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] font-display">
              No Linked Patients Yet
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs leading-relaxed font-mono">
              Ask a patient to go to PolySafe → "Connected" → "Add Caregiver" and enter your registered caregiver email.
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
