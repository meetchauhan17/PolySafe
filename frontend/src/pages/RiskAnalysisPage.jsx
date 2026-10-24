import React, { useState, useEffect } from 'react';
import AlternativeSuggestionsModal from '../components/AlternativeSuggestionsModal';
import FoodDrugSafetyPanel from '../components/FoodDrugSafetyPanel';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowLeft,
  ArrowRight,
  AlertOctagon,
  Stethoscope,
  User,
  Activity,
  Pill,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Loader2,
  AlertCircle,
  Info,
  ShieldAlert,
  Zap,
  Shield,
  Lightbulb,
  Check,
  Copy,
  HelpCircle,
  UtensilsCrossed,
  Sparkles,
  Share2,
  Grid3X3,
  List,
  CheckCircle2,
  MessageSquare,
  Leaf,
  Layers,
  Boxes,
  HeartPulse,
} from 'lucide-react';
import Card from '../components/Card';
import BackButton from '../components/BackButton';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { RiskAnalysisSkeleton } from '../components/Skeletons';
import { useAuth } from '../context/AuthContext';
import { DrugHarmBadge, DrugHarmPanel } from '../components/DrugHarmLevel';
import SafetyAlertsSection, { StatusPill, mapSeverityToPillStatus } from '../components/SafetyAlertsSection';
import { useT } from '../i18n/useT';
import AudioListenButton from '../components/AudioListenButton';
import { Drawer } from '../components/Modal';
import RiskRing from '../components/RiskRing';
import { ACBMeter } from '../components/Meter';
import PullQuote from '../components/PullQuote';
import ClinicalScoreExplainerModal from '../components/ClinicalScoreExplainerModal';
import {
  computeUnifiedScores,
  DEMO_CLINICAL_MEDICINES,
  DEMO_CLINICAL_FLAGS,
  DEMO_CLINICAL_REGIMEN_RISK,
  DEMO_CLINICAL_ACB_SCORE,
} from '../data/mockClinicalData';

const InteractionWeb = React.lazy(() => import('../components/InteractionWeb'));
const InteractionMatrix = React.lazy(() => import('../components/InteractionMatrix'));

function formatDate(isoString) {
  if (!isoString) return 'Recent Analysis';
  try {
    return new Date(isoString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Recent Analysis';
  }
}

const DEMO_FLAG_DETAILS = {
  'f1': {
    flag: {
      id: 'f1',
      severity: 'Major',
      plainExplanation: 'Turmeric may enhance Warfarin\'s blood-thinning effect, significantly increasing bleeding risk.',
      clinicalExplanation: 'Curcumin inhibits platelet aggregation and CYP2C9-mediated warfarin metabolism, elevating INR and bleeding propensity.',
      actionPlan: 'Avoid high-dose turmeric/curcumin supplements while on Warfarin unless explicitly monitored and calibrated by your anticoagulation clinic.',
      source: 'DDInter 2024 · OFFSIDES v2.1 · Botanical-Drug Interaction Monograph',
      doctorQuestions: [
        'How often should we check my INR while adjusting supplements or diet?',
        'Are there specific signs of minor bleeding (e.g. gum bleeding, bruising) I should report immediately?',
        'Can dietary turmeric in food be safely consumed in moderate culinary amounts?',
      ],
      medicineA: {
        id: 'd1',
        name: 'Warfarin',
        type: 'PRESCRIPTION',
        dosage: '5mg daily',
        category: 'Anticoagulant (Blood Thinner)',
        dateAdded: new Date().toISOString(),
      },
      medicineB: {
        id: 'd4',
        name: 'Turmeric (Curcumin)',
        type: 'HERBAL',
        dosage: '500mg daily',
        category: 'Herbal Supplement',
        dateAdded: new Date().toISOString(),
      },
    },
    cumulativeBurden: {
      totalScore: 3,
      level: 'Moderate',
      description: 'Elevated bleeding risk due to botanical-pharmacological metabolic interaction.',
    },
    acbScores: [
      { medicineId: 'd1', name: 'Warfarin', score: 2 },
      { medicineId: 'd4', name: 'Turmeric (Curcumin)', score: 1 },
    ],
  },
  'f2': {
    flag: {
      id: 'f2',
      severity: 'Moderate',
      plainExplanation: 'Taking Aspirin with Warfarin increases gastrointestinal bleeding risk.',
      clinicalExplanation: 'Combined anticoagulant (Warfarin) and antiplatelet (Aspirin) therapy produces additive antihemostatic effects, raising the risk of major upper GI haemorrhage.',
      actionPlan: 'Verify dual antithrombotic indication with your cardiologist or primary care physician. Consider gastroprotective co-prescription (PPI) if combination is clinically mandated.',
      source: 'DDInter 2024 · CHEST Antithrombotic Guidelines · Lexicomp',
      doctorQuestions: [
        'Is the combination of low-dose Aspirin and Warfarin strictly indicated for my cardiovascular condition?',
        'Should I take a stomach-protecting medication (like a PPI) to reduce bleeding risk?',
      ],
      medicineA: {
        id: 'd1',
        name: 'Warfarin',
        type: 'PRESCRIPTION',
        dosage: '5mg daily',
        category: 'Anticoagulant (Blood Thinner)',
        dateAdded: new Date().toISOString(),
      },
      medicineB: {
        id: 'd2',
        name: 'Aspirin',
        type: 'OTC',
        dosage: '81mg daily',
        category: 'Antiplatelet / NSAID',
        dateAdded: new Date().toISOString(),
      },
    },
    cumulativeBurden: {
      totalScore: 4,
      level: 'Critical',
      description: 'Severe dual antiplatelet/anticoagulant hemostatic load.',
    },
    acbScores: [
      { medicineId: 'd1', name: 'Warfarin', score: 2 },
      { medicineId: 'd2', name: 'Aspirin', score: 2 },
    ],
  },
  'demo-flag-1': {
    flag: {
      id: 'demo-flag-1',
      severity: 'Major',
      plainExplanation: 'Taking Amitriptyline with Escitalopram significantly increases your risk of irregular heart rhythms (QT prolongation) and extreme drowsiness or confusion.',
      clinicalExplanation: 'Pharmacodynamic synergism: concurrent use of tricyclic antidepressant (Amitriptyline) and selective serotonin reuptake inhibitor (Escitalopram) prolongs the QTc interval and elevates serotonin syndrome and anticholinergic burden risks.',
      actionPlan: 'Contact your prescribing physician to review concurrent antidepressant therapy and consider alternative non-anticholinergic options or baseline ECG monitoring.',
      source: 'DDInter 2024 · AGS Beers Criteria 2023 · CredibleMeds QT',
      doctorQuestions: [
        'Could we replace Amitriptyline with a lower-anticholinergic alternative for sleep/pain?',
        'Should we perform a baseline ECG to verify QT interval safety?',
        'What early symptoms of serotonin or anticholinergic excess should my caregiver monitor?',
      ],
      medicineA: {
        id: 'demo-med-1',
        name: 'Amitriptyline',
        type: 'PRESCRIPTION',
        dosage: '25mg at bedtime',
        prescribedBy: 'Dr. Priya Sharma, MD',
        dateAdded: new Date(Date.now() - 90 * 86400000).toISOString(),
      },
      medicineB: {
        id: 'demo-med-2',
        name: 'Escitalopram',
        type: 'PRESCRIPTION',
        dosage: '10mg once daily',
        prescribedBy: 'Dr. Priya Sharma, MD',
        dateAdded: new Date(Date.now() - 60 * 86400000).toISOString(),
      },
    },
    cumulativeBurden: {
      totalScore: 4,
      level: 'Critical',
      description: 'Severe cumulative anticholinergic burden from multiple active agents.',
    },
    acbScores: [
      { medicineId: 'demo-med-1', name: 'Amitriptyline', score: 3 },
      { medicineId: 'demo-med-2', name: 'Escitalopram', score: 0 },
      { medicineId: 'demo-med-3', name: 'Amlodipine', score: 0 },
      { medicineId: 'demo-med-5', name: 'Ashwagandha Extract', score: 1 },
    ],
  },
  'demo-flag-2': {
    flag: {
      id: 'demo-flag-2',
      severity: 'Moderate',
      plainExplanation: 'Combining Ashwagandha herbal supplement with prescription Amitriptyline causes additive central nervous system sedation, dizziness, and fall risk.',
      clinicalExplanation: 'GABA-mimetic and sedative herbal synergy with tricyclic antidepressant potentiates psychomotor impairment and orthostatic hypotension.',
      actionPlan: 'Discuss all herbal supplements with your physician or pharmacist before combining with central nervous system active medications.',
      source: 'Natural Medicines Comprehensive Database · Beers 2023 Criteria',
      doctorQuestions: [
        'Is it safe to continue Ashwagandha alongside my current prescriptions?',
        'Does this combination increase my nighttime fall risk?',
      ],
      medicineA: {
        id: 'demo-med-1',
        name: 'Amitriptyline',
        type: 'PRESCRIPTION',
        dosage: '25mg at bedtime',
      },
      medicineB: {
        id: 'demo-med-5',
        name: 'Ashwagandha Extract',
        type: 'HERBAL',
        dosage: '500mg daily',
      },
    },
    cumulativeBurden: {
      totalScore: 4,
      level: 'Critical',
      description: 'Severe cumulative sedation and anticholinergic load.',
    },
    acbScores: [
      { medicineId: 'demo-med-1', name: 'Amitriptyline', score: 3 },
      { medicineId: 'demo-med-5', name: 'Ashwagandha Extract', score: 1 },
    ],
  },
};

const DEMO_TRANSLATIONS = {
  hi: {
    f1: 'हल्दी (कर्क्यूमिन) वारफारिन के रक्त पतला करने के प्रभाव को बढ़ा सकती है, जिससे रक्तस्राव का गंभीर खतरा बढ़ जाता है।',
    f2: 'वारफारिन के साथ एस्पिरिन लेने से पेट और आंतों में रक्तस्राव का खतरा बढ़ जाता है।',
    'demo-flag-1': 'अमिट्रिप्टिलाइन को एस्सिटालोप्राम के साथ लेने से अनियमित दिल की धड़कन और अत्यधिक उनींदापन का खतरा काफी बढ़ जाता है।',
    'demo-flag-2': 'अश्वगंधा को अमिट्रिप्टिलाइन के साथ मिलाने से अत्यधिक नींद आना, चक्कर आना और गिरने का खतरा बढ़ जाता है।',
  },
  gu: {
    f1: 'હળદર (કર્ક્યુમિન) વોરફેરિનની લોહી પાતળું કરવાની અસર વધારે છે, જેનાથી રક્તસ્રાવનું જોખમ ઘણું વધી જાય છે.',
    f2: 'વોરફેરિન સાથે એસ્પિરિન લેવાથી પેટમાં રક્તસ્રાવનું જોખમ વધે છે.',
    'demo-flag-1': 'એમિટ્રિપ્ટીલાઇન અને એસ્સિટલોપ્રામ સાથે લેવાથી અનિયમિત ધબકારા અને અતિશય ચક્કર આવવાનું જોખમ વધે છે.',
    'demo-flag-2': 'અશ્વગંધા અને એમિટ્રિપ્ટીલાઇન સાથે લેવાથી ખૂબ ઊંઘ અને ચક્કર આવવાનું જોખમ વધી જાય છે.',
  },
};

const ALL_DEMO_MEDICINES = [
  { id: 'd1', name: 'Warfarin', type: 'PRESCRIPTION', dosage: '5mg once daily', category: 'Anticoagulant (Blood Thinner)', harmLevel: 5 },
  { id: 'd2', name: 'Aspirin', type: 'OTC', dosage: '81mg daily', category: 'Antiplatelet / NSAID', harmLevel: 4 },
  { id: 'd3', name: 'Lisinopril', type: 'PRESCRIPTION', dosage: '10mg daily', category: 'ACE Inhibitor', harmLevel: 3 },
  { id: 'd4', name: 'Turmeric (Curcumin)', type: 'HERBAL', dosage: '500mg daily', category: 'Herbal Supplement', harmLevel: 2 },
  { id: 'd5', name: 'Amitriptyline', type: 'PRESCRIPTION', dosage: '25mg at bedtime', category: 'Tricyclic Antidepressant', harmLevel: 4 },
  { id: 'd6', name: 'Escitalopram', type: 'PRESCRIPTION', dosage: '10mg once daily', category: 'SSRI Antidepressant', harmLevel: 3 },
  { id: 'd7', name: 'Ashwagandha Extract', type: 'HERBAL', dosage: '500mg daily', category: 'Herbal Supplement', harmLevel: 2 },
];

const ALL_DEMO_FLAGS = [
  {
    id: 'f1',
    severity: 'Major',
    medicineA: { id: 'd1', name: 'Warfarin', type: 'PRESCRIPTION' },
    medicineB: { id: 'd4', name: 'Turmeric (Curcumin)', type: 'HERBAL' },
    plainExplanation: "Turmeric may enhance Warfarin's blood-thinning effect, significantly increasing bleeding risk.",
    clinicalExplanation: 'Curcumin inhibits platelet aggregation and CYP2C9-mediated warfarin metabolism, elevating INR and bleeding propensity.',
    actionPlan: 'Avoid high-dose turmeric/curcumin supplements while on Warfarin unless explicitly monitored and calibrated by your anticoagulation clinic.',
    source: 'DDInter 2024 · OFFSIDES v2.1 · Botanical Monograph',
    doctorQuestions: [
      'How often should we check my INR while adjusting supplements or diet?',
      'Are there specific signs of minor bleeding (e.g. gum bleeding, bruising) I should report immediately?',
      'Can dietary turmeric in food be safely consumed in moderate culinary amounts?',
    ],
  },
  {
    id: 'f2',
    severity: 'Moderate',
    medicineA: { id: 'd1', name: 'Warfarin', type: 'PRESCRIPTION' },
    medicineB: { id: 'd2', name: 'Aspirin', type: 'OTC' },
    plainExplanation: 'Taking Aspirin with Warfarin increases gastrointestinal bleeding risk.',
    clinicalExplanation: 'Combined anticoagulant (Warfarin) and antiplatelet (Aspirin) therapy produces additive antihemostatic effects, raising the risk of major upper GI haemorrhage.',
    actionPlan: 'Verify dual antithrombotic indication with your cardiologist or primary care physician. Consider gastroprotective co-prescription (PPI) if combination is clinically mandated.',
    source: 'DDInter 2024 · CHEST Antithrombotic Guidelines',
    doctorQuestions: [
      'Is the combination of low-dose Aspirin and Warfarin strictly indicated for my cardiovascular condition?',
      'Should I take a stomach-protecting medication (like a PPI) to reduce bleeding risk?',
    ],
  },
  {
    id: 'demo-flag-1',
    severity: 'Major',
    medicineA: { id: 'd5', name: 'Amitriptyline', type: 'PRESCRIPTION' },
    medicineB: { id: 'd6', name: 'Escitalopram', type: 'PRESCRIPTION' },
    plainExplanation: 'Taking Amitriptyline with Escitalopram significantly increases your risk of irregular heart rhythms (QT prolongation) and extreme drowsiness or confusion.',
    clinicalExplanation: 'Pharmacodynamic synergism: concurrent use of tricyclic antidepressant (Amitriptyline) and selective serotonin reuptake inhibitor (Escitalopram) prolongs the QTc interval and elevates serotonin syndrome and anticholinergic burden risks.',
    actionPlan: 'Contact your prescribing physician to review concurrent antidepressant therapy and consider alternative non-anticholinergic options or baseline ECG monitoring.',
    source: 'DDInter 2024 · AGS Beers Criteria 2023 · CredibleMeds QT',
    doctorQuestions: [
      'Could we replace Amitriptyline with a lower-anticholinergic alternative for sleep/pain?',
      'Should we perform a baseline ECG to verify QT interval safety?',
    ],
  },
  {
    id: 'demo-flag-2',
    severity: 'Moderate',
    medicineA: { id: 'd5', name: 'Amitriptyline', type: 'PRESCRIPTION' },
    medicineB: { id: 'd7', name: 'Ashwagandha Extract', type: 'HERBAL' },
    plainExplanation: 'Combining Ashwagandha herbal supplement with prescription Amitriptyline causes additive central nervous system sedation, dizziness, and fall risk.',
    clinicalExplanation: 'GABA-mimetic and sedative herbal synergy with tricyclic antidepressant potentiates psychomotor impairment and orthostatic hypotension.',
    actionPlan: 'Discuss all herbal supplements with your physician or pharmacist before combining with central nervous system active medications.',
    source: 'Natural Medicines Database · Beers Criteria 2023',
    doctorQuestions: [
      'Is it safe to continue Ashwagandha alongside my current prescriptions?',
      'Does this combination increase my nighttime fall risk?',
    ],
  },
];

async function fetchFlagDetail(flagId, lang) {
  const url = `/interaction-flag/${flagId}${lang ? `?lang=${encodeURIComponent(lang)}` : ''}`;
  const { data } = await axios.get(url);
  return data;
}

const SEVERITY_CONFIG = {
  Contraindicated: {
    barColor: 'var(--critical-fg)',
    pillBg: 'var(--critical-fg)',
    pillText: '#fff',
    icon: <AlertOctagon className="w-4 h-4" />,
    label: 'CONTRAINDICATED',
  },
  Major: {
    barColor: 'var(--critical-fg)',
    pillBg: 'var(--critical-fg)',
    pillText: '#fff',
    icon: <AlertOctagon className="w-4 h-4" />,
    label: 'MAJOR',
  },
  Moderate: {
    barColor: 'var(--caution-fg)',
    pillBg: 'var(--caution-fg)',
    pillText: '#fff',
    icon: <AlertTriangle className="w-4 h-4" />,
    label: 'MODERATE',
  },
  Minor: {
    barColor: '#A16207',
    pillBg: '#A16207',
    pillText: '#fff',
    icon: <Info className="w-4 h-4" />,
    label: 'MINOR',
  },
  Unknown: {
    barColor: '#9CA3AF',
    pillBg: '#6B7280',
    pillText: '#fff',
    icon: <Info className="w-4 h-4" />,
    label: 'UNKNOWN',
  },
};

const BURDEN_LEVEL = {
  Normal: { color: 'var(--safe-fg)', bg: 'var(--surface-2)', border: 'var(--safe-fg)', text: 'Low burden — No significant cognitive load detected.' },
  Moderate: { color: 'var(--caution-fg)', bg: 'var(--surface-2)', border: 'var(--caution-fg)', text: 'Moderate burden — Monitor for sedation, dizziness, or dry mouth.' },
  Critical: { color: 'var(--critical-fg)', bg: 'var(--surface-2)', border: 'var(--critical-fg)', text: 'High anticholinergic load — Elevates risk of delirium, confusion, and falls.' },
};

function burdenBarPct(score) {
  return Math.min(100, Math.round((score / 6) * 100));
}

// ─── List Flag Card as a Status Card ──────────────────────────────────────────
function FlagStatusCard({ flag, onOpenDrawer }) {
  const [activeTab, setActiveTab] = useState('you'); // 'you' | 'doctor'
  const { lang, t } = useT();

  const sevCfg = SEVERITY_CONFIG[flag.severity] || SEVERITY_CONFIG.Unknown;
  const statusType = mapSeverityToPillStatus(flag.severity);
  const sourceLine = flag.source || 'DDInter 2024 · OFFSIDES v2.1 · AGS Beers 2023 Criteria';

  return (
    <div className="relative overflow-hidden transition-all duration-200 hover:shadow-md border border-[var(--border)] rounded-2xl bg-[var(--surface)]">
      {/* Severity accent bar */}
      <div
        className="absolute top-0 left-0 bottom-0 w-1.5"
        style={{ backgroundColor: sevCfg.barColor || 'var(--critical-fg)' }}
        aria-hidden="true"
      />

      <div className="pl-5 pr-5 py-5 space-y-4">
        {/* Header: Drug pair with arrow glyph + Severity pill */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-base sm:text-lg text-[var(--ink)] font-[var(--font-heading)]">
              {flag.medicineA?.name}
            </span>
            <span
              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--surface-2)] text-[var(--accent-500)] text-xs font-bold"
              aria-label="interacts with"
            >
              →
            </span>
            <span className="font-bold text-base sm:text-lg text-[var(--ink)] font-[var(--font-heading)]">
              {flag.medicineB?.name}
            </span>
            {flag.medicineB?.type === 'HERBAL' && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-bold">
                <Leaf className="w-2.5 h-2.5" />
                <span>Herbal</span>
              </span>
            )}
          </div>

          <StatusPill status={statusType} label={`${flag.severity} Risk`} />
        </div>

        {/* Two-column "For you / For the doctor" toggle with crossfade */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 p-1 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('you')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'you'
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-2xs'
                  : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>For you</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('doctor')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'doctor'
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-2xs'
                  : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>For the doctor</span>
            </button>
          </div>

          {/* Crossfading explanation container */}
          <div className="min-h-[58px] relative overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'you' ? (
                <motion.div
                  key="you"
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.18 }}
                  className="p-3.5 rounded-xl bg-[var(--canvas)] border border-[var(--border)] text-xs sm:text-sm text-[var(--ink-2)] leading-relaxed flex items-start justify-between gap-3"
                >
                  <p className="flex-1">{flag.plainExplanation || 'Interaction identified between these medicines.'}</p>
                  <AudioListenButton text={flag.plainExplanation || ''} lang={lang} />
                </motion.div>
              ) : (
                <motion.div
                  key="doctor"
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.18 }}
                  className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--ink)] font-mono leading-relaxed"
                >
                  <p>{flag.clinicalExplanation || 'Clinical pharmacological mechanism unavailable.'}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Source line + Drawer trigger */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border)] text-[11px]">
          <span className="font-mono text-[10px] text-[var(--ink-3)] flex items-center gap-1">
            <span className="opacity-60">Source:</span> {sourceLine}
          </span>

          <button
            type="button"
            onClick={() => onOpenDrawer?.(flag)}
            className="text-xs font-bold text-[var(--accent-500)] hover:text-[var(--accent-600)] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View clinical action plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RiskAnalysisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { isGuest, token } = useAuth();
  const { t, lang } = useT();

  const isRealFlagId = Boolean(id && id !== 'undefined' && !id.startsWith('demo-'));
  const isDemoFlag = isGuest || !isRealFlagId;
  const demoFallback = (id && DEMO_FLAG_DETAILS[id]) || DEMO_FLAG_DETAILS['demo-flag-1'];

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['flag-detail', id, lang],
    queryFn: () => fetchFlagDetail(id, lang),
    enabled: Boolean(token && isRealFlagId),
    retry: false,
    staleTime: 60_000,
  });

  const activeData = data || demoFallback || (id && DEMO_FLAG_DETAILS[id]) || DEMO_FLAG_DETAILS['f1'];
  const rawFlag = activeData?.flag;

  const isTranslated = activeData?.isTranslated || (lang !== 'en' && !!DEMO_TRANSLATIONS[lang]?.[rawFlag?.id]);
  const localizedPlain = DEMO_TRANSLATIONS[lang]?.[rawFlag?.id] || rawFlag?.plainExplanation;

  const flag = rawFlag
    ? {
        ...rawFlag,
        plainExplanation: localizedPlain || rawFlag.plainExplanation,
        isTranslated,
      }
    : null;

  const cumulativeBurden = activeData?.cumulativeBurden;
  const acbScores = activeData?.acbScores ?? [];

  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showScoreExplainer, setShowScoreExplainer] = useState(false);
  const [scoreExplainerInitialTab, setScoreExplainerInitialTab] = useState('harm');

  useEffect(() => {
    const handler = (e) => {
      const tab = e.detail?.tab || 'harm';
      setScoreExplainerInitialTab(tab);
      setShowScoreExplainer(true);
    };
    window.addEventListener('polysafe:open-score-explainer', handler);
    return () => window.removeEventListener('polysafe:open-score-explainer', handler);
  }, []);
  const [copiedQuestionIdx, setCopiedQuestionIdx] = useState(null);
  const [viewMode, setViewMode] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 640 ? 'LIST' : 'WEB'));
  const [drawerFlag, setDrawerFlag] = useState(null);

  const { data: homeSummary } = useQuery({
    queryKey: ['home-summary', token],
    queryFn: () => patientApi.getHomeSummary(token),
    enabled: !!token && !isGuest,
    retry: false,
    staleTime: 5000,
  });

  const allMedicines = (homeSummary?.medicines && homeSummary.medicines.length > 0)
    ? homeSummary.medicines
    : DEMO_CLINICAL_MEDICINES;

  const allFlags = (homeSummary?.flags && homeSummary.flags.length > 0)
    ? homeSummary.flags
    : DEMO_CLINICAL_FLAGS;

  const { data: safetyAlertsData } = useQuery({
    queryKey: ['patient-safety-alerts'],
    queryFn: async () => {
      const res = await axios.get('/patient/safety-alerts');
      return res.data;
    },
    enabled: !!token && !isGuest,
    retry: false,
    staleTime: 60_000,
  });

  const safetyAlerts = safetyAlertsData?.alerts || safetyAlertsData?.safetyAlerts || [
    {
      id: 'demo-alert-duplicate-class',
      type: 'DUPLICATE_CLASS',
      severity: 'MAJOR',
      medicines: ['Aspirin', 'Ibuprofen'],
      clinicalText: 'Concurrent prescription of multiple Non-Steroidal Anti-Inflammatory Drugs (NSAIDs) provides negligible additional therapeutic benefit while exponentially increasing ulceration, gastrointestinal hemorrhage, and nephrotoxicity rates.',
      plainText: 'Duplicate NSAID class: Combining two medicines from the same NSAID class (Aspirin and Ibuprofen) does not double pain relief, but significantly elevates stomach ulcer and kidney injury risks.',
      rationale: 'Avoid dual NSAID prescriptions. Deprescribe one agent or substitute with paracetamol for breakthrough pain.',
      source: 'ATC Classification / WHO Collaborating Centre',
    },
    {
      id: 'demo-alert-disease-drug',
      type: 'DISEASE_DRUG',
      severity: 'MAJOR',
      medicines: ['Aspirin'],
      clinicalText: 'Aspirin NSAID therapy in documented Hypertension: Regular NSAIDs inhibit renal vasodilatory prostaglandin synthesis, promoting fluid retention and antagonizing ACE inhibitor antihypertensive efficacy.',
      plainText: 'Aspirin caution with Hypertension: Regular NSAID intake can cause fluid retention and counteract blood pressure medications like Lisinopril. Monitor your daily blood pressure readings closely.',
      rationale: 'AGS Beers Criteria 2023 / STOPP v3: Use lowest effective dose with regular blood pressure surveillance.',
      source: 'AGS Beers Criteria 2023',
    },
    {
      id: 'demo-alert-food-spacing',
      type: 'FOOD_SPACING',
      severity: 'MODERATE',
      medicines: ['Warfarin'],
      clinicalText: 'Vitamin K dietary consistency requirement with Warfarin oral anticoagulation: Sudden dietary surges in dark leafy greens counteract hepatic vitamin K antagonism, precipitating thrombotic risk.',
      plainText: 'Keep leafy green vegetables (spinach, kale, broccoli) steady in your diet each week. Large swings in Vitamin K can counteract Warfarin and alter your blood clotting time.',
      rationale: 'Warfarin Anticoagulation Guidelines: Maintain consistent weekly dietary Vitamin K intake.',
      source: 'FDA / CHEST Guidelines',
    },
    {
      id: 'demo-alert-spacing-levo',
      type: 'FOOD_SPACING',
      severity: 'MODERATE',
      medicines: ['Levothyroxine', 'Calcium'],
      clinicalText: 'Cation chelation of levothyroxine by calcium carbonate or iron salts reduces thyroxine bioavailability by up to 40%. Mandatory 4-hour temporal separation.',
      plainText: 'Take Levothyroxine at least 4 hours apart from calcium or iron supplements to prevent absorption blockage.',
      rationale: 'Dose spacing requirement: Chelation prevents GI absorption.',
      source: 'Endocrine Society / Lexicomp',
    },
  ];

  const handleCopyQuestion = (text, idx) => {
    try {
      navigator.clipboard?.writeText(text);
      setCopiedQuestionIdx(idx);
      setTimeout(() => setCopiedQuestionIdx(null), 2500);
    } catch (e) {
      console.warn('Copy to clipboard failed', e);
    }
  };

  if (isLoading && !activeData) {
    return (
      <div className="min-h-[88vh] bg-[var(--canvas)] pb-16">
        <RiskAnalysisSkeleton />
      </div>
    );
  }

  // Unified score calculation matching HomePage exactly
  const unifiedScores = computeUnifiedScores({
    regimenRisk: homeSummary?.regimenRisk || (isGuest ? DEMO_CLINICAL_REGIMEN_RISK : null),
    medicines: allMedicines,
    flags: allFlags,
    status: homeSummary?.status || (isGuest ? 'CRITICAL' : 'SAFE'),
    acbScore: homeSummary?.acbScore ?? (isGuest ? DEMO_CLINICAL_ACB_SCORE : null),
  });

  const overallRiskScore = unifiedScores.score;
  const highestFlagSeverity = unifiedScores.label;
  const burdenScore = unifiedScores.acbScore;
  const burdenLevelName = burdenScore >= 3 ? 'Critical' : burdenScore >= 1 ? 'Moderate' : 'Normal';
  const burdenCfg = BURDEN_LEVEL[burdenLevelName] ?? BURDEN_LEVEL.Normal;
  const burdenPct = burdenBarPct(burdenScore);

  // Summary PullQuote text
  const summaryQuote = flag?.plainExplanation
    ? flag.plainExplanation.split('(This is an informational')[0].trim()
    : 'Multiple concurrent interactions detected across your active regimen; review recommendations with your doctor before adjusting doses.';

  return (
    <div className={`mx-auto space-y-6 transition-all ${viewMode === 'WEB' || viewMode === 'MATRIX' ? 'max-w-5xl' : 'max-w-4xl'}`}>

        {/* ── Top Bar / Breadcrumb ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BackButton to="/home" label={t('common.back', 'Back to Dashboard')} />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-600">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Polypharmacy Telemetry</span>
            <span className="opacity-40">·</span>
            <span className="font-mono text-[11px]">{formatDate(flag?.dateFlagged)}</span>
          </div>
        </div>

        {/* ── Title & Description ── */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink)]">
            Polypharmacy Risk &amp; Interaction Analysis
          </h1>
          <p className="text-sm text-[var(--ink-2)]">
            Comprehensive drug-drug telemetry, anticholinergic cognitive burden, and clinical rationale.
          </p>
        </div>

        {/* ── Header: RiskRing + ACB meter + summary PullQuote ── */}
        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* RiskRing */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-3 text-center border-b md:border-b-0 md:border-r border-[var(--border)]">
              <RiskRing score={overallRiskScore} size={132} label={`${highestFlagSeverity} Risk`} />
              <button
                type="button"
                onClick={() => {
                  setScoreExplainerInitialTab('harm');
                  setShowScoreExplainer(true);
                }}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-[var(--brand-600)] bg-[var(--brand-600)]/10 hover:bg-[var(--brand-600)]/20 border border-[var(--brand-600)]/20 transition-all cursor-pointer shadow-2xs"
                title="Click to view full clinical rationale and doctor talking points"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Why is score {typeof overallRiskScore === 'number' ? overallRiskScore.toFixed(1) : overallRiskScore}?</span>
              </button>
              <p className="text-[11px] font-mono text-[var(--ink-3)] mt-1.5">
                {allFlags.length} active flag{allFlags.length !== 1 ? 's' : ''} in regimen
              </p>
            </div>

            {/* ACB Meter */}
            <div className="md:col-span-8">
              <ACBMeter
                value={burdenScore}
                label="Cumulative Anticholinergic Surveillance"
                sublabel={cumulativeBurden?.description || burdenCfg.text}
                action={
                  <button
                    type="button"
                    onClick={() => {
                      setScoreExplainerInitialTab('acb');
                      setShowScoreExplainer(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20"
                    title="Click to see what this score means for memory and fall risk"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Why is ACB score {burdenScore}?</span>
                  </button>
                }
              />
            </div>
          </div>

          {/* Summary PullQuote */}
          <PullQuote
            quote={summaryQuote}
            attribution="PolySafe Clinical Cross-Reference Engine"
            source="Beers 2023 · DDInter 2024 · WHO ATC"
            className="my-1"
          />

          {/* Quick Alternative CTA */}
          <div className="flex items-center justify-between gap-3 pt-1 flex-wrap border-t border-[var(--border)]">
            <div className="flex items-center gap-2 text-xs text-[var(--ink-3)]">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-500)]" />
              <span>Evidence-based guidance mapped to AGS Beers Criteria</span>
            </div>

            <button
              type="button"
              onClick={() => setShowAlternatives(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--accent-500)] text-white hover:bg-[var(--accent-600)] shadow-xs transition-all cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Explore Safer Alternatives (Beers 2023)</span>
            </button>
          </div>
        </div>

        {/* ── View Toggle: List / Matrix / Web ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--ink)] font-[var(--font-heading)] uppercase tracking-wider">
              Interaction View
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--ink-2)] border border-[var(--border)]">
              {viewMode === 'LIST' ? 'Status Cards' : viewMode === 'MATRIX' ? 'Heatmap Grid' : 'Chord Web'}
            </span>
          </div>

          <div className="inline-flex items-center gap-1 p-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'LIST'
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-2xs'
                  : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('MATRIX')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'MATRIX'
                  ? 'bg-[var(--surface)] text-[var(--ink)] shadow-2xs'
                  : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Matrix</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('WEB')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'WEB'
                  ? 'bg-[var(--accent-500)] text-white shadow-2xs'
                  : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Interaction Web</span>
            </button>
          </div>
        </div>

        {/* ── Active View Mode Content ── */}
        {viewMode === 'WEB' ? (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[var(--ink)] font-[var(--font-heading)]">
                  Cross-Specialty Interaction Web
                </h3>
                <span className="text-[10px] font-mono text-[var(--ink-3)]">
                  ({allMedicines.length} medicines · {allFlags.length} active interactions)
                </span>
              </div>
              <span className="text-[11px] font-mono text-[var(--ink-3)] hidden sm:inline">
                Click any node or edge to open clinical drawer
              </span>
            </div>

            <React.Suspense
              fallback={
                <div className="p-12 text-center text-xs text-[var(--ink-3)] font-mono animate-pulse">
                  Loading Interactive Visualizer…
                </div>
              }
            >
              <InteractionWeb
                medicines={allMedicines}
                flags={allFlags}
                onSelectFlag={(f) => setDrawerFlag(f)}
                onDegradeToList={() => setViewMode('LIST')}
              />
            </React.Suspense>
          </div>
        ) : viewMode === 'MATRIX' ? (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[var(--ink)] font-[var(--font-heading)]">
                  Regimen Cross-Interaction Matrix
                </h3>
                <span className="text-[10px] font-mono text-[var(--ink-3)]">
                  ({allMedicines.length} active agents)
                </span>
              </div>
              <span className="text-[11px] font-mono text-[var(--ink-3)]">
                Keyboard accessible · Focus cells to inspect tooltips
              </span>
            </div>

            <React.Suspense
              fallback={
                <div className="p-12 text-center text-xs text-[var(--ink-3)] font-mono animate-pulse">
                  Loading Cross-Table Matrix…
                </div>
              }
            >
              <InteractionMatrix
                medicines={allMedicines}
                flags={allFlags}
                onSelectFlag={(f) => setDrawerFlag(f)}
              />
            </React.Suspense>
          </div>
        ) : (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[var(--ink)] font-[var(--font-heading)]">
                  Active Drug Interaction Flags
                </h3>
                <span className="text-[10px] font-mono text-[var(--ink-3)]">
                  ({allFlags.length} detected)
                </span>
              </div>
              <span className="text-[11px] font-mono text-[var(--ink-3)]">
                Toggle "For you / For the doctor" on each card
              </span>
            </div>

            {/* List: Flag cards as status cards */}
            <div className="space-y-3.5">
              {allFlags.map((f) => (
                <FlagStatusCard
                  key={f.id}
                  flag={f}
                  onOpenDrawer={(flagToOpen) => setDrawerFlag(flagToOpen)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Safety Alerts Section (Grouped by Type with Typed Icons) ── */}
        <div className="pt-2">
          <SafetyAlertsSection
            alerts={safetyAlerts}
            title="Safety Alerts (Grouped by Category)"
            subtitle="5-dimension clinical checks: duplicate active salts, class overlap, allergy cross-reactivity, Beers/STOPP disease cautions, and food/spacing."
          />
        </div>

        {/* ── Regimen Action Guidance ── */}
        {flag?.actionPlan && (
          <Card
            title={t('risk_analysis.action_plan_title', 'Immediate Regimen Guidance')}
            subtitle="Recommended clinical steps to mitigate multi-drug risk safely"
            icon={<ShieldAlert className="w-4 h-4 text-amber-600" />}
            className="space-y-2 border-l-4 border-amber-500 bg-amber-500/5"
          >
            <p className="text-sm text-[var(--ink)] leading-relaxed font-medium">
              {flag.actionPlan}
            </p>
          </Card>
        )}

        {/* ── Questions to Ask Your Doctor ── */}
        {flag?.doctorQuestions && flag.doctorQuestions.length > 0 && (
          <Card
            title={t('risk_analysis.questions_title', 'Questions to Ask Your Doctor')}
            subtitle="Take these questions to your next appointment or message your care team"
            icon={<HelpCircle className="w-4 h-4 text-teal-600" />}
            className="space-y-3"
          >
            <div className="space-y-2.5">
              {flag.doctorQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-[var(--canvas)] border border-[var(--border)] hover:border-teal-500/30 transition-all shadow-2xs"
                >
                  <div className="flex items-start gap-2.5 flex-1">
                    <span className="w-5 h-5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-400 font-mono text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm font-medium text-[var(--ink)] leading-snug">
                      {q}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyQuestion(q, idx)}
                    className="p-1.5 rounded-xl text-[var(--ink-3)] hover:text-teal-700 hover:bg-teal-500/10 transition-colors flex-shrink-0 cursor-pointer"
                    title="Copy to clipboard"
                  >
                    {copiedQuestionIdx === idx ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── Flag Detail Drawer (Opens on Web, Matrix, or List Click) ── */}
        <Drawer
          open={!!drawerFlag}
          onClose={() => setDrawerFlag(null)}
          title={drawerFlag ? `${drawerFlag.medicineA?.name} + ${drawerFlag.medicineB?.name}` : 'Interaction Details'}
          subtitle={drawerFlag ? `${drawerFlag.severity || 'Clinical'} Risk Interaction Flag` : ''}
        >
          {drawerFlag && (
            <div className="space-y-5">
              {/* Severity & Harm Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full uppercase font-mono shadow-2xs text-white"
                  style={{
                    backgroundColor:
                      SEVERITY_CONFIG[drawerFlag.severity]?.pillBg || 'var(--critical-fg)',
                  }}
                >
                  {drawerFlag.severity} Risk
                </span>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-[var(--ink-2)] border border-[var(--border)]">
                  {drawerFlag.medicineA?.type || 'Rx'} + {drawerFlag.medicineB?.type || 'Herbal'}
                </span>
                {drawerFlag.source && (
                  <span className="text-[11px] font-mono text-[var(--ink-3)] ml-auto">
                    {drawerFlag.source}
                  </span>
                )}
              </div>

              {/* Plain Language Advice */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-200 font-[var(--font-heading)]">
                  Patient Summary
                </h4>
                <p className="text-sm text-[var(--ink-2)] leading-relaxed font-sans">
                  {drawerFlag.plainExplanation}
                </p>
              </div>

              {/* Medicines Involved */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] font-[var(--font-heading)]">
                  Medicines Involved
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-[var(--canvas)] border border-[var(--border)]">
                    <span className="text-xs font-bold text-[var(--ink)] block truncate">
                      {drawerFlag.medicineA?.name}
                    </span>
                    <span className="text-[11px] text-[var(--ink-3)] font-mono">
                      {drawerFlag.medicineA?.dosage || 'Active Regimen'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--canvas)] border border-[var(--border)]">
                    <span className="text-xs font-bold text-[var(--ink)] block truncate">
                      {drawerFlag.medicineB?.name}
                    </span>
                    <span className="text-[11px] text-[var(--ink-3)] font-mono">
                      {drawerFlag.medicineB?.dosage || 'Active Regimen'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Clinical Explanation */}
              {drawerFlag.clinicalExplanation && (
                <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] font-[var(--font-heading)] flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    <span>Clinical Pharmacological Mechanism</span>
                  </h4>
                  <p className="text-xs text-[var(--ink-2)] leading-relaxed font-sans">
                    {drawerFlag.clinicalExplanation}
                  </p>
                </div>
              )}

              {/* Action Plan */}
              {drawerFlag.actionPlan && (
                <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 font-[var(--font-heading)] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Clinical Action Guidance</span>
                  </h4>
                  <p className="text-xs text-[var(--ink-2)] leading-relaxed font-sans">
                    {drawerFlag.actionPlan}
                  </p>
                </div>
              )}

              {/* Doctor Discussion Questions */}
              {drawerFlag.doctorQuestions?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] font-[var(--font-heading)] flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[var(--brand-600)]" />
                    <span>Questions for Your Doctor</span>
                  </h4>
                  <div className="space-y-2">
                    {drawerFlag.doctorQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[var(--canvas)] border border-[var(--border)] flex items-start justify-between gap-3 text-xs"
                      >
                        <span className="text-[var(--ink-2)] leading-relaxed">{q}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyQuestion(q, idx)}
                          className="p-1 rounded-md text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] cursor-pointer"
                          title="Copy question"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Drawer>

        {/* ── Alternative Suggestions Modal ── */}
        <AlternativeSuggestionsModal
          isOpen={showAlternatives}
          onClose={() => setShowAlternatives(false)}
          suggestions={activeData?.alternativeSuggestions || []}
        />

        {/* ── Clinical Score Explainer Modal ── */}
        <ClinicalScoreExplainerModal
          isOpen={showScoreExplainer}
          onClose={() => setShowScoreExplainer(false)}
          initialTab={scoreExplainerInitialTab}
          regimenRisk={homeSummary?.regimenRisk || {
            level: unifiedScores.level,
            score: unifiedScores.score,
            averageRisk: unifiedScores.averageRisk,
            highestRiskDrug: unifiedScores.highestRiskDrug,
          }}
          acbScore={burdenScore}
          medicines={allMedicines}
          flags={allFlags}
        />

        {/* ── Footer CTAs ── */}
        <div className="flex flex-col gap-2.5 pt-2">
          <BackButton to="/home" label="Back to Dashboard" className="w-full py-3.5 justify-center text-sm" />
          <Link to="/add-medicine" className="ps-btn ps-btn-secondary py-3 flex items-center justify-center gap-2 text-sm">
            <Pill className="w-4 h-4" />
            <span>Manage My Medicines</span>
          </Link>
        </div>

      </div>
  );
}
