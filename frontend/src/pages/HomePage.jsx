import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  AlertTriangle,
  Pill,
  Clock,
  Plus,
  ArrowRight,
  Activity,
  ShieldCheck,
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
} from 'lucide-react';
import { patientApi } from '../api/auth';
import Card from '../components/Card';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { EmptyMedicinesIllustration } from '../components/EmptyIllustrations';
import { HomeSkeleton } from '../components/Skeletons';
import { useAuth } from '../context/AuthContext';

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
    { id: 'd1', name: 'Warfarin', type: 'PRESCRIPTION', dosage: '5mg', dateAdded: new Date().toISOString() },
    { id: 'd2', name: 'Aspirin', type: 'OTC', dosage: '81mg', dateAdded: new Date().toISOString() },
    { id: 'd3', name: 'Lisinopril', type: 'PRESCRIPTION', dosage: '10mg', dateAdded: new Date().toISOString() },
    { id: 'd4', name: 'Turmeric (Curcumin)', type: 'HERBAL', dosage: '500mg', dateAdded: new Date().toISOString() },
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
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { token, user, isGuest, openGuestLockModal } = useAuth();

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

  // Use real data when authenticated, demo data otherwise
  const isDemo = !token || user?.isGuest;
  const data = isDemo ? DEMO_DATA : (summary || DEMO_DATA);

  if (isLoading) {
    return <HomeSkeleton />;
  }

  if (isError && token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#FBF8F2] px-4">
        <div className="polysafe-card p-8 max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-[#232724]">Couldn't load your data</h2>
          <p className="text-sm text-[#6B726C]">
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
    <div className="bg-[#FBF8F2] min-h-[88vh] pb-28">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* ── Demo mode banner ─────────────────────────────────────────────── */}
        {isDemo && (
          <div className="flex items-start space-x-3 p-3.5 bg-[#2B6E5E]/8 border border-[#2B6E5E]/20 rounded-xl text-xs text-[#2B6E5E]">
            <FlaskConical className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Demo Mode</strong> — this is a sample data preview. <Link to="/login" className="underline font-bold">Sign in</Link> to see your real medication summary.
            </p>
          </div>
        )}

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#232724]">My Dashboard</h1>
            <p className="text-xs text-[#6B726C] mt-0.5">{todayLabel}</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading || !token}
            className="p-2.5 rounded-xl border-2 border-[#E7E1D3] bg-white text-[#6B726C] hover:text-[#2B6E5E] hover:border-[#2B6E5E] transition-colors disabled:opacity-40"
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
                STATUS CARD — SAFE or CAUTION
               ═══════════════════════════════════════════════════════════════ */}
            {status === 'SAFE' ? (
              <Card
                variant="safe"
                className="flex-row items-start space-x-4 bg-[#E4F2E9]/40"
              >
                <div className="flex-shrink-0 p-2.5 rounded-full bg-white/80 border border-[#2F8558]/20 shadow-sm">
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
                <div className="flex-shrink-0 p-2.5 rounded-full bg-white/80 border border-[#B5791A]/20 shadow-sm animate-breathe-caution">
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
                <span className="text-[11px] font-bold text-[#6B726C] bg-[#EFEBE0] px-2.5 py-1 rounded-lg">
                  {schedule.length} dose{schedule.length !== 1 ? 's' : ''}
                </span>
              }
              className="space-y-4"
            >
              <div className="space-y-2.5">
                <AnimatePresence initial={false}>
                  {schedule.map((item, i) => (
                    <motion.div
                      key={item.medicineId + i}
                      layout={!shouldReduceMotion}
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center space-x-3.5 p-3.5 rounded-xl bg-[#FDFBF7] border border-[#E7E1D3] hover:border-[#2B6E5E]/30 transition-colors"
                    >
                      {/* Time bubble */}
                      <div className="flex-shrink-0 w-16 text-center">
                        <span className="text-[11px] font-bold text-[#2B6E5E] bg-[#2B6E5E]/10 px-2 py-1 rounded-lg block leading-snug">
                          {item.time}
                        </span>
                      </div>

                      {/* Divider dot */}
                      <div className="w-1.5 h-1.5 rounded-full bg-[#E7E1D3] flex-shrink-0" />

                      {/* Medicine info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#232724] truncate">{item.name}</p>
                        <p className="text-[11px] text-[#6B726C]">{item.dosage}</p>
                      </div>

                      <MedicineTypeBadge type={item.type} />
                    </motion.div>
                  ))}
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
                <span className="text-[11px] font-bold text-[#6B726C] bg-[#EFEBE0] px-2.5 py-1 rounded-lg">
                  {medicines.length} total
                </span>
              }
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-2.5">
                <AnimatePresence initial={false}>
                  {medicines.map((med) => (
                    <motion.div
                      key={med.id}
                      layout={!shouldReduceMotion}
                      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="p-3.5 rounded-xl bg-[#FDFBF7] border border-[#E7E1D3] space-y-2 hover:border-[#2B6E5E]/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-sm font-bold text-[#232724] leading-tight flex-1 min-w-0 truncate">
                          {med.name}
                        </p>
                        <MedicineTypeBadge type={med.type} />
                      </div>
                      {med.dosage && (
                        <p className="text-[11px] text-[#6B726C]">{med.dosage}</p>
                      )}
                      <p className="text-[10px] text-[#6B726C]/60">
                        Added {new Date(med.dateAdded).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
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
                            <div className="bg-[#FDFBF7] rounded-xl p-3.5 border border-[#E7E1D3]">
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
      </div>
    </div>
  );
}
