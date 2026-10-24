import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  SunMedium,
  Sunset,
  Moon,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Flame,
  Award,
  Utensils,
  AlertCircle,
  RotateCcw,
  Check,
  X,
  BellRing,
  Activity,
  HeartHandshake,
} from 'lucide-react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from '../context/SocketContext';
import { notify } from '../utils/toast';
import { useT } from '../i18n/useT';
import { useAuth } from '../context/AuthContext';
import AudioListenButton from './AudioListenButton';
import AdherenceRing from './AdherenceRing';
import NotificationOptInBanner from './NotificationOptInBanner';
import { sendDoseReminder } from '../utils/doseScheduler';

export default function DailyRegimenTimetable({
  timetableData,
  onDoseLogged,
}) {
  const { t, lang } = useT();
  const { token, user, isGuest } = useAuth() || {};
  const queryClient = useQueryClient();
  const [activeSlotFilter, setActiveSlotFilter] = useState('ALL');

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // ─── 1. Query: Daily Doses from Backend ──────────────────────────────────────
  const {
    data: backendDosesData,
    refetch: refetchDoses,
    isLoading: isDosesLoading,
  } = useQuery({
    queryKey: ['patient-doses', todayStr],
    queryFn: async () => {
      const res = await axios.get(`/patient/doses?date=${todayStr}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.data;
    },
    enabled: !!token && !isGuest,
    refetchInterval: 15000, // Sync every 15s to catch server-job overdue marks
  });

  // ─── 2. Query: 7-Day Adherence & Streak ─────────────────────────────────────
  const {
    data: adherenceData,
    refetch: refetchAdherence,
  } = useQuery({
    queryKey: ['patient-adherence', 7],
    queryFn: async () => {
      const res = await axios.get('/patient/adherence?days=7', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.data;
    },
    enabled: !!token && !isGuest,
    refetchInterval: 30000,
  });

  // ─── 3. Local / Optimistic Doses State ──────────────────────────────────────
  const [localDoses, setLocalDoses] = useState({});

  // Sync backend doses data into local map
  useEffect(() => {
    if (backendDosesData?.doses) {
      const map = {};
      backendDosesData.doses.forEach((d) => {
        const key = `${d.medicineId}-${d.slotKey || 'morning'}`;
        map[key] = {
          status: d.status,
          takenAt: d.takenAt,
          id: d.id,
        };
      });
      setLocalDoses(map);
    }
  }, [backendDosesData]);

  // Fallback / guest demo timetable
  const timetable = useMemo(() => {
    if (timetableData) return timetableData;
    return {
      morning: [
        { medicineId: 'm1', name: 'Pantoprazole 40mg', dosage: '40mg', purpose: 'Acid Reflux / GERD', foodInstruction: 'Empty stomach (30m before breakfast)', time: '08:00 AM', slot: 'Morning', harmLevel: 2 },
        { medicineId: 'm2', name: 'Telmisartan 40mg', dosage: '40mg', purpose: 'Blood Pressure Control', foodInstruction: 'With breakfast', time: '08:30 AM', slot: 'Morning', harmLevel: 3 },
      ],
      afternoon: [
        { medicineId: 'm3', name: 'Metformin 500mg', dosage: '500mg', purpose: 'Blood Sugar Control', foodInstruction: 'With lunch', time: '01:00 PM', slot: 'Afternoon', harmLevel: 3 },
      ],
      evening: [
        { medicineId: 'm4', name: 'Metformin 500mg', dosage: '500mg', purpose: 'Blood Sugar Control', foodInstruction: 'With dinner', time: '07:30 PM', slot: 'Evening', harmLevel: 3 },
      ],
      bedtime: [
        { medicineId: 'm5', name: 'Atorvastatin 10mg', dosage: '10mg', purpose: 'Cholesterol & Heart Health', foodInstruction: 'Bedtime with water', time: '10:00 PM', slot: 'Bedtime', harmLevel: 3 },
      ],
    };
  }, [timetableData]);

  // Flatten all doses
  const allDoses = useMemo(() => [
    ...(timetable.morning || []).map((d) => ({ ...d, slotKey: 'morning', slotLabel: 'Morning', slotTime: '08:00 AM' })),
    ...(timetable.afternoon || []).map((d) => ({ ...d, slotKey: 'afternoon', slotLabel: 'Afternoon', slotTime: '01:00 PM' })),
    ...(timetable.evening || []).map((d) => ({ ...d, slotKey: 'evening', slotLabel: 'Evening', slotTime: '07:30 PM' })),
    ...(timetable.bedtime || []).map((d) => ({ ...d, slotKey: 'bedtime', slotLabel: 'Bedtime', slotTime: '10:00 PM' })),
  ], [timetable]);

  // Compute resolved status for a dose
  const getDoseState = useCallback((medId, slotKey) => {
    const key = `${medId}-${slotKey}`;
    return localDoses[key] || { status: 'SCHEDULED', takenAt: null };
  }, [localDoses]);

  // Adherence metrics
  const totalCount = allDoses.length;
  const takenCount = allDoses.filter((d) => getDoseState(d.medicineId, d.slotKey).status === 'TAKEN').length;
  const skippedCount = allDoses.filter((d) => getDoseState(d.medicineId, d.slotKey).status === 'SKIPPED').length;
  const missedCount = allDoses.filter((d) => getDoseState(d.medicineId, d.slotKey).status === 'MISSED').length;

  // 7-day adherence percentage from backend or local fallback
  const sevenDayAdherence = adherenceData?.adherencePercentage ?? (totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100);
  const streakDays = adherenceData?.streakDays ?? (takenCount > 0 ? 1 : 0);

  // ─── 4. Optimistic Dose Mutation ──────────────────────────────────────────
  const doseMutation = useMutation({
    mutationFn: async ({ medicineId, slotKey, status, scheduledFor }) => {
      if (isGuest || !token) {
        return { simulated: true };
      }
      const res = await axios.post(
        '/patient/dose',
        {
          medicineId,
          scheduledFor: scheduledFor || new Date().toISOString(),
          status,
          takenAt: status === 'TAKEN' ? new Date().toISOString() : null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-doses'] });
      queryClient.invalidateQueries({ queryKey: ['patient-adherence'] });
      queryClient.invalidateQueries({ queryKey: ['home-summary'] });
    },
    onError: (err, variables, context) => {
      // Rollback on failure
      if (context?.previousDoses) {
        setLocalDoses(context.previousDoses);
      }
      notify.error('Update Failed', err?.response?.data?.error || 'Could not log dose on server.');
    },
  });

  const handleSetDoseStatus = (dose, nextStatus) => {
    const key = `${dose.medicineId}-${dose.slotKey}`;
    const previous = { ...localDoses };

    // Optimistic UI update
    setLocalDoses((prev) => ({
      ...prev,
      [key]: {
        status: nextStatus,
        takenAt: nextStatus === 'TAKEN' ? new Date().toISOString() : null,
      },
    }));

    if (nextStatus === 'TAKEN') {
      notify.success('Dose Taken', `Marked ${dose.name} as taken! Keep up the great streak.`);
    } else if (nextStatus === 'SKIPPED') {
      notify.info('Dose Skipped', `Marked ${dose.name} as skipped.`);
    } else {
      notify.info('Status Reset', `Reset ${dose.name} to scheduled.`);
    }

    if (onDoseLogged) {
      onDoseLogged(dose.medicineId, dose.slotKey, nextStatus);
    }

    // Dispatch to server
    const hour = dose.slotKey === 'morning' ? 8 : dose.slotKey === 'afternoon' ? 12 : dose.slotKey === 'evening' ? 18 : 21;
    const schedDate = new Date();
    schedDate.setHours(hour, 0, 0, 0);

    doseMutation.mutate(
      {
        medicineId: dose.medicineId,
        slotKey: dose.slotKey,
        status: nextStatus,
        scheduledFor: schedDate.toISOString(),
      },
      {
        context: { previousDoses: previous },
      }
    );
  };

  // ─── 5. Real-Time Socket.IO Synchronization (Shared Instance) ─────────────
  useSocketEvent('dose_logged', (payload) => {
    console.log('[DailyRegimenTimetable] Live dose_logged event received:', payload);
    queryClient.invalidateQueries({ queryKey: ['patient-doses'] });
    queryClient.invalidateQueries({ queryKey: ['patient-adherence'] });
    queryClient.invalidateQueries({ queryKey: ['home-summary'] });
  });

  useSocketEvent('caregiver_reminder', (payload) => {
    console.log('[DailyRegimenTimetable] Live caregiver_reminder event received:', payload);
    sendDoseReminder({
      title: 'Caregiver Dose Reminder',
      body: payload.message || `${payload.caregiverName || 'Your caregiver'} sent a reminder to take your scheduled medications.`,
    });
  });

  // ─── 6. Scheduled Browser Notification Checks ────────────────────────────
  useEffect(() => {
    // Check every 60 seconds if any dose is scheduled for right now
    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();

      // Check morning (8am), afternoon (12pm), evening (6pm), bedtime (9pm)
      const slotsToCheck = [
        { slotKey: 'morning', hour: 8, minute: 0 },
        { slotKey: 'afternoon', hour: 12, minute: 0 },
        { slotKey: 'evening', hour: 18, minute: 0 },
        { slotKey: 'bedtime', hour: 21, minute: 0 },
      ];

      slotsToCheck.forEach((s) => {
        if (currentHours === s.hour && currentMinutes === s.minute) {
          const dueDoses = timetable[s.slotKey] || [];
          dueDoses.forEach((d) => {
            const state = getDoseState(d.medicineId, s.slotKey);
            if (state.status === 'SCHEDULED') {
              sendDoseReminder({
                doseName: d.name,
                doseTime: d.time,
                foodInstruction: d.foodInstruction,
              });
            }
          });
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [timetable, getDoseState]);

  const slotConfigs = [
    { key: 'morning', label: t('timetable.morning_slot', 'Morning Slot'), sub: t('timetable.morning_sub', 'Breakfast & Early Day'), time: '08:00 AM – 10:00 AM', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { key: 'afternoon', label: t('timetable.afternoon_slot', 'Midday Slot'), sub: t('timetable.afternoon_sub', 'Lunch & Daytime'), time: '12:00 PM – 02:00 PM', icon: SunMedium, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { key: 'evening', label: t('timetable.evening_slot', 'Evening Slot'), sub: t('timetable.evening_sub', 'Dinner & Sunset'), time: '06:00 PM – 08:00 PM', icon: Sunset, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { key: 'bedtime', label: t('timetable.night_slot', 'Night Slot'), sub: t('timetable.night_sub', 'Bedtime & Night Rest'), time: '09:00 PM – 11:00 PM', icon: Moon, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Notification Opt-In Banner ── */}
      <NotificationOptInBanner />

      {/* ── Adherence Hero Card with 7-Day Ring ── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <AdherenceRing
              percentage={sevenDayAdherence}
              streakDays={streakDays}
              size={110}
              label={t('timetable.seven_day_adherence', '7-Day Adherence')}
              sublabel={t('timetable.seven_day_sub', 'Rolling 7-day adherence score')}
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  {t('timetable.live_telemetry', 'Live Dose Telemetry')}
                </span>
                {missedCount > 0 && (
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {t('timetable.overdue_missed', `${missedCount} Overdue Missed`, { count: missedCount })}
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-black text-[var(--ink)] font-[var(--font-heading)]">
                {t('timetable.today_taken_summary', `Today: ${takenCount} of ${totalCount} Doses Taken`, { taken: takenCount, total: totalCount })}
              </h3>
              <p className="text-xs text-[var(--ink-2)] max-w-md">
                {t('timetable.adherence_instruction', 'Mark your medications as Taken or Skipped in real-time. Caregivers with approved access receive live adherence visibility.')}
              </p>
            </div>
          </div>

          {/* Quick telemetry metrics */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 border-t md:border-t-0 md:border-l border-[var(--border)] pt-4 md:pt-0 md:pl-6">
            <div className="text-center p-2.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
              <span className="text-xs font-mono font-bold text-emerald-700 block">{t('timetable.taken', 'Taken')}</span>
              <span className="text-xl font-extrabold text-emerald-600 font-[var(--font-heading)]">{takenCount}</span>
            </div>
            <div className="text-center p-2.5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <span className="text-xs font-mono font-bold text-amber-700 block">{t('timetable.skipped', 'Skipped')}</span>
              <span className="text-xl font-extrabold text-amber-600 font-[var(--font-heading)]">{skippedCount}</span>
            </div>
            <div className="text-center p-2.5 rounded-2xl bg-rose-500/5 border border-rose-500/20">
              <span className="text-xs font-mono font-bold text-rose-700 block">{t('timetable.missed', 'Missed')}</span>
              <span className="text-xl font-extrabold text-rose-600 font-[var(--font-heading)]">{missedCount}</span>
            </div>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="space-y-1.5 mt-5 pt-4 border-t border-[var(--border)]">
          <div className="w-full h-2.5 bg-[var(--canvas)] rounded-full overflow-hidden border border-[var(--border)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${totalCount > 0 ? (takenCount / totalCount) * 100 : 0}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm"
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-[var(--ink-3)]">
            <span>{t('timetable.morning_start', 'Morning (Start)')}</span>
            <span className="font-bold text-[var(--ink)]">
              {t('timetable.doses_logged', `${totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0}% of Today's Doses Logged`, { pct: totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0 })}
            </span>
            <span>{t('timetable.bedtime_target', 'Bedtime (100% Target)')}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSlotFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            activeSlotFilter === 'ALL'
              ? 'bg-[var(--brand-600)] text-white shadow-xs'
              : 'bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--border)] hover:bg-[var(--canvas)]'
          }`}
        >
          {t('timetable.all_slots', `All Slots (${totalCount})`, { count: totalCount })}
        </button>
        {slotConfigs.map((slot) => {
          const count = (timetable[slot.key] || []).length;
          return (
            <button
              key={slot.key}
              onClick={() => setActiveSlotFilter(slot.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSlotFilter === slot.key
                  ? 'bg-[var(--brand-600)] text-white shadow-xs'
                  : 'bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--border)] hover:bg-[var(--canvas)]'
              }`}
            >
              {slot.label} ({count})
            </button>
          );
        })}
      </div>

      {/* 4 Timetable Time Slots */}
      <div className="space-y-5">
        {slotConfigs
          .filter((slot) => activeSlotFilter === 'ALL' || activeSlotFilter === slot.key)
          .map((slot) => {
            const doses = timetable[slot.key] || [];
            const Icon = slot.icon;

            return (
              <div
                key={slot.key}
                className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4"
              >
                {/* Slot Header */}
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl ${slot.bg} ${slot.border} border ${slot.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-extrabold text-[var(--ink)] font-[var(--font-heading)]">
                          {slot.label}
                        </h4>
                        <span className="text-[11px] font-mono text-[var(--ink-3)]">
                          ({slot.time})
                        </span>
                      </div>
                      <p className="text-xs text-[var(--ink-3)]">{slot.sub}</p>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-[var(--surface-2)] text-[var(--ink-2)] border border-[var(--border)]">
                    {doses.length} {doses.length === 1 ? t('timetable.medication_single', 'Medication') : t('timetable.medications_plural', 'Medications')}
                  </span>
                </div>

                {/* Doses in this slot */}
                {doses.length === 0 ? (
                  <p className="text-xs text-[var(--ink-3)] font-mono py-2 text-center">
                    {t('timetable.no_meds_in_slot', 'No medications scheduled for this time slot.')}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {doses.map((dose, idx) => {
                      const doseState = getDoseState(dose.medicineId, slot.key);
                      const isTaken = doseState.status === 'TAKEN';
                      const isSkipped = doseState.status === 'SKIPPED';
                      const isMissed = doseState.status === 'MISSED';

                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between gap-3 ${
                            isTaken
                              ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30 text-[var(--ink)]'
                              : isSkipped
                              ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/25 opacity-80 text-[var(--ink-2)]'
                              : isMissed
                              ? 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/30 text-[var(--ink)]'
                              : 'bg-[var(--canvas)] border-[var(--border)] hover:border-[var(--border-strong)] shadow-xs'
                          }`}
                        >
                          {/* Dose Info Header */}
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                <span
                                  className={`text-sm font-extrabold truncate ${
                                    isTaken ? 'line-through text-slate-500 dark:text-slate-400' : 'text-[var(--ink)]'
                                  }`}
                                >
                                  {dose.name}
                                </span>
                                {dose.harmLevel >= 4 && (
                                  <span className="text-[9px] font-mono font-bold bg-rose-600 text-white px-1.5 py-0.2 rounded">
                                    L{dose.harmLevel}
                                  </span>
                                )}
                              </div>

                              {/* Status Badge */}
                              {isTaken && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                                  <Check className="w-3 h-3" />
                                  {t('timetable.taken_status', 'TAKEN')}
                                </span>
                              )}
                              {isSkipped && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                                  <X className="w-3 h-3" />
                                  {t('timetable.skipped_status', 'SKIPPED')}
                                </span>
                              )}
                              {isMissed && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-300 dark:border-rose-800">
                                  <AlertCircle className="w-3 h-3" />
                                  {t('timetable.overdue_status', 'MISSED')}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-[var(--ink-2)] font-mono">
                              Dose: <strong className="text-[var(--ink)]">{dose.dosage || 'Standard'}</strong> · {dose.purpose || 'Prescribed'}
                            </p>

                            {dose.foodInstruction && (
                              <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                                <Utensils className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                <span>{dose.foodInstruction}</span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons: Taken / Skip with Optimistic Updates */}
                          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] gap-2">
                            <AudioListenButton
                              text={`${dose.name}. ${dose.dosage ? `Dose: ${dose.dosage}.` : ''} ${dose.foodInstruction || ''}`}
                              lang={lang}
                            />

                            <div className="flex items-center gap-2">
                              {/* Skip Button */}
                              <button
                                type="button"
                                onClick={() => handleSetDoseStatus(dose, isSkipped ? 'SCHEDULED' : 'SKIPPED')}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                  isSkipped
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-[var(--surface-2)] text-[var(--ink-2)] hover:bg-amber-500/10 hover:text-amber-700 border border-[var(--border)]'
                                }`}
                                title={isSkipped ? 'Undo Skip' : 'Mark as Skipped'}
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>{isSkipped ? t('timetable.skipped_status', 'Skipped') : t('timetable.skip', 'Skip')}</span>
                              </button>

                              {/* Taken Button */}
                              <button
                                type="button"
                                onClick={() => handleSetDoseStatus(dose, isTaken ? 'SCHEDULED' : 'TAKEN')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                                  isTaken
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 ring-2 ring-emerald-500/30'
                                    : 'bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white'
                                }`}
                                title={isTaken ? 'Dose Taken (Click to unmark)' : 'Mark as Taken'}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{isTaken ? `${t('timetable.taken_status', 'Taken')} ✓` : t('timetable.mark_taken', 'Taken')}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
