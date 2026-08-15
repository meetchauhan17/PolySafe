import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  TrendingUp,
  ArrowLeft,
  Activity,
  AlertTriangle,
  Pill,
  ShieldCheck,
  CalendarDays,
  Info,
  ChevronRight,
  Loader2,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import Card from '../components/Card';
import { motion, useReducedMotion } from 'framer-motion';
import { EmptyTrendsIllustration } from '../components/EmptyIllustrations';
import { InsightsSkeleton } from '../components/Skeletons';
import { useAuth } from '../context/AuthContext';

async function fetchInsights() {
  const { data } = await axios.get('/patient/insights');
  return data;
}

// ─── Custom Card Tooltip for Charts ───────────────────────────────────────────
function CustomChartTooltip({ active, payload, label, mode = 'flags' }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  if (mode === 'burden') {
    const score = data.cumulativeScore;
    const isCritical = score >= 3;
    const isModerate = score >= 1 && score < 3;

    return (
      <div className="bg-white border-2 border-[#E7E1D3] rounded-xl p-3.5 shadow-lg max-w-xs space-y-1.5 font-sans">
        <div className="flex items-center justify-between gap-2 border-b border-[#E7E1D3] pb-1.5">
          <span className="text-xs font-bold text-[#232724]">{data.label}</span>
          <span
            className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: isCritical ? '#FBE4DE' : isModerate ? '#FBEED9' : '#E4F2E9',
              color: isCritical ? '#B23D25' : isModerate ? '#B5791A' : '#2B6E5E',
            }}
          >
            {data.level}
          </span>
        </div>
        <p className="text-xs text-[#232724]">
          Added: <strong className="text-[#1B4B66]">{data.medicine}</strong> ({data.type})
        </p>
        <div className="flex items-center justify-between text-xs pt-0.5">
          <span className="text-[#6B726C]">Cumulative ACB Score:</span>
          <strong className="text-base text-[#232724] font-black">{data.cumulativeScore}</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-[#E7E1D3] rounded-xl p-3.5 shadow-lg max-w-xs space-y-2 font-sans">
      <p className="text-xs font-bold text-[#232724] border-b border-[#E7E1D3] pb-1">
        {label || data.period}
      </p>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[#6B726C]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2B6E5E]" />
            Total Interaction Flags:
          </span>
          <strong className="text-[#232724] font-bold">{data.totalFlags}</strong>
        </div>
        {data.critical > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B23D25]" />
              Major / High Risk:
            </span>
            <strong className="text-[#B23D25] font-bold">{data.critical}</strong>
          </div>
        )}
        {data.moderate > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B5791A]" />
              Moderate Risk:
            </span>
            <strong className="text-[#B5791A] font-bold">{data.moderate}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Demo fallback data for rich preview when no history exists yet ───────────
const SAMPLE_FLAG_DATA = [
  { period: 'Sep 2025', totalFlags: 0, critical: 0, moderate: 0 },
  { period: 'Oct 2025', totalFlags: 1, critical: 0, moderate: 1 },
  { period: 'Nov 2025', totalFlags: 1, critical: 0, moderate: 1 },
  { period: 'Dec 2025', totalFlags: 2, critical: 1, moderate: 1 },
  { period: 'Jan 2026', totalFlags: 3, critical: 1, moderate: 2 },
  { period: 'Feb 2026', totalFlags: 2, critical: 1, moderate: 1 },
];

const SAMPLE_BURDEN_DATA = [
  { step: 1, label: 'Sep 2025', medicine: 'Lisinopril', type: 'Rx', addedScore: 0, cumulativeScore: 0, level: 'Normal' },
  { step: 2, label: 'Oct 2025', medicine: 'Warfarin', type: 'Rx', addedScore: 1, cumulativeScore: 1, level: 'Moderate' },
  { step: 3, label: 'Nov 2025', medicine: 'Aspirin', type: 'OTC', addedScore: 1, cumulativeScore: 2, level: 'Moderate' },
  { step: 4, label: 'Dec 2025', medicine: 'Diphenhydramine', type: 'OTC', addedScore: 2, cumulativeScore: 4, level: 'Critical' },
  { step: 5, label: 'Jan 2026', medicine: 'Turmeric (Curcumin)', type: 'Herbal', addedScore: 0, cumulativeScore: 4, level: 'Critical' },
];

export default function InsightsPage() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { isGuest, token } = useAuth();
  const [chartMode, setChartMode] = useState('area'); // 'area' | 'bar'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['patient-insights'],
    queryFn: fetchInsights,
    enabled: !!token && !isGuest,
  });

  if (isLoading) {
    return (
      <div className="min-h-[88vh] bg-[#FBF8F2] pb-16">
        <InsightsSkeleton />
      </div>
    );
  }

  const rawFlagHistory = data?.flagHistory ?? [];
  const rawBurdenHistory = data?.burdenHistory ?? [];
  const summary = data?.summary ?? {};

  // If the patient has real data use it, otherwise show sample/empty state
  const hasFlagData = rawFlagHistory.length >= 2;
  const hasBurdenData = rawBurdenHistory.length >= 2;

  const flagChartData = hasFlagData ? rawFlagHistory : SAMPLE_FLAG_DATA;
  const burdenChartData = hasBurdenData ? rawBurdenHistory : SAMPLE_BURDEN_DATA;

  const currentScore = summary.currentBurdenScore ?? (hasBurdenData ? rawBurdenHistory[rawBurdenHistory.length - 1]?.cumulativeScore : 2);
  const currentLevel = summary.currentBurdenLevel ?? (currentScore >= 3 ? 'Critical' : currentScore >= 1 ? 'Moderate' : 'Normal');

  return (
    <div className="min-h-[88vh] bg-[#FBF8F2] pb-16">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* ─── Header ─── */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/home')}
            className="p-2.5 rounded-xl border-2 border-[#E7E1D3] bg-white text-[#6B726C] hover:text-[#2B6E5E] hover:border-[#2B6E5E] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#232724]" style={{ fontFamily: "'Fraunces', serif" }}>
                Safety Insights & Trends
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#2B6E5E]/10 text-[#2B6E5E] border border-[#2B6E5E]/20">
                Analytics
              </span>
            </div>
            <p className="text-xs text-[#6B726C]">
              Longitudinal tracking of drug interactions, burden trajectory, and prescribing cascades
            </p>
          </div>
        </div>

        {/* ─── Metric Summary Cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-[#6B726C]">
              <span className="text-xs font-bold uppercase tracking-wider">Active Regimen</span>
              <Pill className="w-4 h-4 text-[#2B6E5E]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#232724]" style={{ fontFamily: "'Fraunces', serif" }}>
                {summary.totalMedicines ?? (hasBurdenData ? rawBurdenHistory.length : 4)}
              </span>
              <span className="text-xs text-[#6B726C]">medicines</span>
            </div>
          </Card>

          <Card className="p-4 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-[#6B726C]">
              <span className="text-xs font-bold uppercase tracking-wider">ACB Burden Load</span>
              <Activity className="w-4 h-4 text-[#B5791A]" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-[#232724]" style={{ fontFamily: "'Fraunces', serif" }}>
                  {currentScore}
                </span>
                <span className="text-xs text-[#6B726C]">/ 6+</span>
              </div>
              <span
                className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: currentLevel === 'Critical' ? '#FBE4DE' : currentLevel === 'Moderate' ? '#FBEED9' : '#E4F2E9',
                  color: currentLevel === 'Critical' ? '#B23D25' : currentLevel === 'Moderate' ? '#B5791A' : '#2B6E5E',
                }}
              >
                {currentLevel}
              </span>
            </div>
          </Card>

          <Card className="p-4 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-[#6B726C]">
              <span className="text-xs font-bold uppercase tracking-wider">Flagged Pairs</span>
              <AlertTriangle className="w-4 h-4 text-[#B23D25]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#B23D25]" style={{ fontFamily: "'Fraunces', serif" }}>
                {summary.totalFlags ?? (hasFlagData ? rawFlagHistory.reduce((acc, f) => acc + f.totalFlags, 0) : 2)}
              </span>
              <span className="text-xs text-[#6B726C]">interactions</span>
            </div>
          </Card>
        </div>

        {/* ─── Chart 1: Interaction Flags Over Time ─── */}
        <Card
          title="Interaction Risk History"
          subtitle="Frequency of detected pharmacological flags over time"
          icon={<TrendingUp className="w-4 h-4 text-[#2B6E5E]" />}
          className="space-y-4"
        >
          {/* Chart Controls */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-b border-[#E7E1D3] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6B726C] font-semibold">View as:</span>
              <div className="segmented-toggle-container">
                <button
                  type="button"
                  onClick={() => setChartMode('area')}
                  className={`segmented-toggle-btn py-1 px-3 text-xs ${chartMode === 'area' ? 'active' : ''}`}
                >
                  Area Trend
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('bar')}
                  className={`segmented-toggle-btn py-1 px-3 text-xs ${chartMode === 'bar' ? 'active' : ''}`}
                >
                  Monthly Bars
                </button>
              </div>
            </div>

            {!hasFlagData && (
              <span className="text-[10px] font-bold text-[#2B6E5E] bg-[#E4F2E9] border border-[#2F8558]/30 px-2 py-0.5 rounded-full">
                Sample Preview Mode
              </span>
            )}
          </div>

          {/* Recharts Area / Bar Component */}
          <div className="w-full h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'area' ? (
                <AreaChart data={flagChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tealFlagGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2B6E5E" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#2B6E5E" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE9DF" vertical={false} />
                  <XAxis
                    dataKey="period"
                    tick={{ fill: '#6B726C', fontSize: 11, fontWeight: 600 }}
                    stroke="#E7E1D3"
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#6B726C', fontSize: 11, fontWeight: 600 }}
                    stroke="#E7E1D3"
                    tickLine={false}
                  />
                  <Tooltip content={<CustomChartTooltip mode="flags" />} />
                  <Area
                    type="monotone"
                    dataKey="totalFlags"
                    stroke="#2B6E5E"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#tealFlagGradient)"
                    isAnimationActive={!shouldReduceMotion}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              ) : (
                <BarChart data={flagChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE9DF" vertical={false} />
                  <XAxis
                    dataKey="period"
                    tick={{ fill: '#6B726C', fontSize: 11, fontWeight: 600 }}
                    stroke="#E7E1D3"
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#6B726C', fontSize: 11, fontWeight: 600 }}
                    stroke="#E7E1D3"
                    tickLine={false}
                  />
                  <Tooltip content={<CustomChartTooltip mode="flags" />} />
                  <Bar
                    dataKey="totalFlags"
                    fill="#2B6E5E"
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={!shouldReduceMotion}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-[#6B726C] text-center">
            Tracking chronological additions helps distinguish long-standing regimens from newly introduced drug-drug conflicts.
          </p>
        </Card>

        {/* ─── Chart 2: Cumulative Anticholinergic / Sedative Burden Trajectory ─── */}
        <Card
          title="Cumulative Burden Trajectory"
          subtitle="Anticholinergic Cognitive Burden (ACB) progression across prescription additions"
          icon={<Activity className="w-4 h-4 text-[#E0824B]" />}
          className="space-y-4"
        >
          {burdenChartData.length < 2 ? (
            <div className="p-8 text-center space-y-4">
              <EmptyTrendsIllustration className="w-36 h-36 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-[#232724]" style={{ fontFamily: "'Fraunces', serif" }}>
                  Not enough history yet
                </h3>
                <p className="text-xs text-[#6B726C] mt-1 max-w-sm mx-auto leading-relaxed">
                  As you log multiple prescriptions, OTC medicines, and herbal supplements over time, this graph will illustrate your cumulative sedation and cognitive burden curve.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="w-full h-64 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={burdenChartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDE9DF" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#6B726C', fontSize: 11, fontWeight: 600 }}
                      stroke="#E7E1D3"
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 6]}
                      allowDecimals={false}
                      tick={{ fill: '#6B726C', fontSize: 11, fontWeight: 600 }}
                      stroke="#E7E1D3"
                      tickLine={false}
                    />
                    <Tooltip content={<CustomChartTooltip mode="burden" />} />
                    {/* Critical threshold line at score 3 */}
                    <ReferenceLine
                      y={3}
                      stroke="#B23D25"
                      strokeDasharray="4 4"
                      label={{
                        value: 'Critical (3+)',
                        fill: '#B23D25',
                        fontSize: 10,
                        fontWeight: 700,
                        position: 'insideTopRight',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulativeScore"
                      stroke="#E0824B"
                      strokeWidth={3}
                      dot={{ fill: '#FFFFFF', stroke: '#E0824B', strokeWidth: 2.5, r: 5 }}
                      activeDot={{ fill: '#2B6E5E', stroke: '#FFFFFF', strokeWidth: 2, r: 7 }}
                      isAnimationActive={!shouldReduceMotion}
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Threshold legend */}
              <div className="flex items-center justify-center gap-4 text-xs font-semibold text-[#6B726C] pt-2 border-t border-[#E7E1D3]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2F8558]" />
                  0: Normal
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B5791A]" />
                  1–2: Moderate
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B23D25]" />
                  3+: Critical Load
                </span>
              </div>
            </>
          )}
        </Card>

        {/* ─── Clinical Pharmacovigilance Guidance ─── */}
        <div className="flex items-start space-x-3 p-4 border-2 border-[#E7E1D3] bg-[#FDFBF7] rounded-2xl">
          <Info className="w-4 h-4 text-[#2B6E5E] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#6B726C] leading-relaxed">
            <strong>Clinical Pharmacovigilance Note:</strong> Cumulative anticholinergic burden is strongly associated with fall risk, daytime somnolence, and reversible cognitive decline in older adults. Share these trend charts during doctor consultations to support proactive deprescribing reviews.
          </p>
        </div>
      </div>
    </div>
  );
}
