/**
 * InsightsPage.jsx — PolySafe Longitudinal Clinical Analytics
 *
 * Requirements:
 * - KPI StatTiles with CountUp
 * - Category Donut chart (using palette-mapped Recharts theme)
 * - Risk trend AreaChart
 * - ACB trajectory LineChart
 * - Adherence heatmap (8 weeks calendar grid)
 * - Top-pairs clinical table
 * - Tooltips as paper cards with hairline borders (PaperTooltip)
 * - "Export summary" button opening the print view
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Pill,
  Shield,
  Star,
  Activity,
  Info,
  Printer,
  ChevronRight,
  ArrowRight,
  Layers,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';
import PageTransition from '../components/PageTransition';
import { analyticsApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import {
  MOCK_REGIMEN_SCORE,
  MOCK_POLYPHARMACY_TREND,
  MOCK_DRUG_CLASSES,
  MOCK_ACB_TIMELINE,
  MOCK_TOP_INTERACTIONS,
} from '../data/mockAnalytics';
import AdherenceHeatmap from '../components/AdherenceHeatmap';
import StatTile from '../components/StatTile';
import { StatusPill, mapSeverityToPillStatus } from '../components/SafetyAlertsSection';
import {
  SERIES_COLORS,
  SERIES_HEX,
  CHART_AXIS_PROPS,
  CHART_GRID_PROPS,
  PaperTooltip,
  ColorBlindPatternDefs,
  RechartsGradientDefs,
} from '../charts/theme';

/* ── Category Donut Chart ────────────────────────────────────────────── */
function CategoryDonutChart({ data }) {
  const byType = data?.byType || [
    { label: 'PRESCRIPTION', value: 3 },
    { label: 'OTC', value: 1 },
    { label: 'HERBAL', value: 1 },
  ];

  const total = byType.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div
      className="p-5 sm:p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4"
      role="region"
      aria-label={`Medication category distribution donut chart: ${total} total agents across ${byType.length} categories`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill className="w-4 h-4 text-[var(--accent-500)]" />
          <h3 className="text-sm font-bold text-[var(--ink)] font-[var(--font-heading)]">
            Category Distribution
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--ink-2)] border border-[var(--border)]">
          {total} Total Agents
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="w-40 h-40 relative flex items-center justify-center flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart aria-label={`Donut chart showing ${total} medications distributed by category`}>
              <ColorBlindPatternDefs />
              <Pie
                data={byType}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={46}
                outerRadius={68}
                paddingAngle={4}
                stroke="var(--surface)"
                strokeWidth={2}
              >
                {byType.map((_, i) => (
                  <Cell key={i} fill={SERIES_HEX[i % SERIES_HEX.length]} />
                ))}
              </Pie>
              <Tooltip content={<PaperTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-black font-mono text-[var(--ink)] leading-none">
              {total}
            </span>
            <span className="text-[9px] font-bold text-[var(--ink-3)] uppercase tracking-wider mt-0.5">
              Medicines
            </span>
          </div>
        </div>

        {/* Pill Legends */}
        <div className="flex-1 w-full flex flex-col gap-2">
          {byType.map((d, i) => {
            const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
            const color = SERIES_COLORS[i % SERIES_COLORS.length];
            return (
              <div
                key={d.label}
                className="flex items-center justify-between px-3.5 py-2 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-xs shadow-2xs hover:bg-[var(--surface)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="font-semibold text-[var(--ink)]">{d.label}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-[var(--ink-3)]">{d.value}</span>
                  <span className="text-[10px] font-bold text-[var(--ink-2)] bg-[var(--canvas)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Polypharmacy Risk Trend AreaChart ───────────────────────────────── */
function RiskTrendAreaChart({ data }) {
  const trend = data?.trend || [];
  const sampled = trend.filter((_, i) => i % 3 === 0);
  const latestCount = trend.length ? trend[trend.length - 1].medicationCount : 5;

  return (
    <div
      className="p-5 sm:p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4"
      role="region"
      aria-label={`30-Day Medication Trajectory AreaChart: current ${latestCount} active medications tracked across rolling window`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[var(--accent-500)]" />
          <h3 className="text-sm font-bold text-[var(--ink)] font-[var(--font-heading)]">
            30-Day Medication Trajectory
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 font-bold">
          Rolling Window
        </span>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={sampled}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            aria-label={`Medication count trend line currently at ${latestCount} active medicines`}
          >
            <ColorBlindPatternDefs />
            <CartesianGrid {...CHART_GRID_PROPS} />
            <XAxis
              dataKey="date"
              {...CHART_AXIS_PROPS}
              tickFormatter={(v) => (typeof v === 'string' ? v.slice(5) : v)}
            />
            <YAxis {...CHART_AXIS_PROPS} domain={[0, 'auto']} allowDecimals={false} />
            <Tooltip content={<PaperTooltip unit=" active meds" />} />
            <Area
              type="monotone"
              dataKey="medicationCount"
              name="Active Medications"
              stroke="var(--brand-600)"
              strokeWidth={2.5}
              fill="url(#polySafeBrandGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-center text-[var(--ink-3)] font-mono">
        Stabilizing multi-drug volume reduces cumulative adverse drug events and anticholinergic risk.
      </p>
    </div>
  );
}

/* ── ACB Trajectory LineChart ────────────────────────────────────────── */
function AcbTrajectoryChart({ data }) {
  const timeline = data?.weeks || [];
  const latestAcb = timeline.length ? timeline[timeline.length - 1].acbScore : 1;

  return (
    <div
      className="p-5 sm:p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4"
      role="region"
      aria-label={`ACB Burden 8-Week Trajectory LineChart: current composite score ${latestAcb}, critical Beers threshold at 3.0`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[var(--caution-fg)]" />
          <h3 className="text-sm font-bold text-[var(--ink)] font-[var(--font-heading)]">
            ACB Burden — 8-Week Trajectory
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-bold">
          Beers Criteria 2024
        </span>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={timeline}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            aria-label={`8-week anticholinergic burden timeline ending at score ${latestAcb}`}
          >
            <ColorBlindPatternDefs />
            <CartesianGrid {...CHART_GRID_PROPS} />
            <XAxis dataKey="week" {...CHART_AXIS_PROPS} />
            <YAxis {...CHART_AXIS_PROPS} domain={[0, 4]} allowDecimals={false} />
            <Tooltip content={<PaperTooltip />} />
            <Line
              type="monotone"
              dataKey="acbScore"
              name="ACB Burden Score"
              stroke="var(--caution-fg)"
              strokeWidth={2.5}
              dot={{ fill: 'var(--caution-fg)', r: 3.5, strokeWidth: 1, stroke: '#FFFFFF' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs pt-1 border-t border-[var(--border)] text-[var(--ink-3)] font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-1 rounded bg-[var(--caution-fg)] inline-block" />
          <span>Anticholinergic Score</span>
        </div>
        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
          Critical Threshold: ≥ 3.0
        </span>
      </div>
    </div>
  );
}

/* ── Top-Pairs Clinical Table ────────────────────────────────────────── */
function TopPairsTable({ data }) {
  const flags = data?.flags || [];

  if (!flags.length) {
    return (
      <div className="p-6 rounded-3xl text-center bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-2">
        <Shield className="w-8 h-8 text-emerald-600 mx-auto" />
        <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-[var(--font-heading)]">
          All Interaction Checks Clear
        </h3>
        <p className="text-xs text-[var(--ink-3)]">
          No active contraindicated or high-severity pharmacological pairs detected across current medications.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <h3 className="text-sm font-bold text-[var(--ink)] font-[var(--font-heading)]">
            Active Drug-Drug Conflict Pairs ({data?.total || flags.length})
          </h3>
        </div>
        <Link
          to="/risk-analysis"
          className="text-xs font-bold text-[var(--accent-500)] hover:text-[var(--accent-600)] flex items-center gap-1 transition-colors"
        >
          <span>Open Full Risk Matrix</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[var(--surface-2)] border-b border-[var(--border)] text-[var(--ink-2)] font-mono uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4 font-bold">Interacting Pair</th>
              <th className="py-3 px-3 font-bold">Severity</th>
              <th className="py-3 px-4 font-bold">Mechanism & Risk</th>
              <th className="py-3 px-3 font-bold">Source Reference</th>
              <th className="py-3 px-3 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {flags.map((f, i) => {
              const drugA = f.drugA || f.drugAName || f.medicineA?.name || 'Drug A';
              const drugB = f.drugB || f.drugBName || f.medicineB?.name || 'Drug B';
              const sev = f.severity || 'Major';
              const pillStatus = mapSeverityToPillStatus(sev);
              const explanation = f.explanation || f.patientExplanation || f.clinicalExplanation || 'Interaction identified.';
              const source = f.source || 'DDInter 2024 / WHO Pharmacovigilance';

              return (
                <tr key={f.flagId || f.id || i} className="hover:bg-[var(--canvas)] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[var(--ink)] font-[var(--font-heading)] whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>{drugA}</span>
                      <span className="text-[var(--accent-500)]">→</span>
                      <span>{drugB}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <StatusPill status={pillStatus} label={sev} />
                  </td>
                  <td className="py-3.5 px-4 text-[var(--ink-2)] leading-relaxed max-w-md min-w-[220px]">
                    <p className="line-clamp-2">{explanation}</p>
                  </td>
                  <td className="py-3.5 px-3 text-[11px] font-mono text-[var(--ink-3)] whitespace-nowrap">
                    {source}
                  </td>
                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    <Link
                      to={`/risk-analysis`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--accent-500)] hover:underline"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */
export default function InsightsPage() {
  const { isGuest, token } = useAuth();
  const shouldFetch = !!token && !isGuest;

  const { data: scoreData, isLoading: l1 } = useQuery({
    queryKey: ['analytics-score'],
    queryFn: analyticsApi.getRegimenScore,
    enabled: shouldFetch,
    staleTime: 60_000,
    retry: 0,
  });

  const { data: trendData, isLoading: l2 } = useQuery({
    queryKey: ['analytics-trend'],
    queryFn: analyticsApi.getPolypharmacyTrend,
    enabled: shouldFetch,
    staleTime: 60_000,
    retry: 0,
  });

  const { data: classData, isLoading: l3 } = useQuery({
    queryKey: ['analytics-classes'],
    queryFn: analyticsApi.getDrugClasses,
    enabled: shouldFetch,
    staleTime: 60_000,
    retry: 0,
  });

  const { data: acbData, isLoading: l4 } = useQuery({
    queryKey: ['analytics-acb'],
    queryFn: analyticsApi.getAcbTimeline,
    enabled: shouldFetch,
    staleTime: 60_000,
    retry: 0,
  });

  const { data: interactData, isLoading: l5 } = useQuery({
    queryKey: ['analytics-interact'],
    queryFn: analyticsApi.getTopInteractions,
    enabled: shouldFetch,
    staleTime: 60_000,
    retry: 0,
  });

  const effectiveScore = scoreData || MOCK_REGIMEN_SCORE;
  const effectiveTrend = trendData || MOCK_POLYPHARMACY_TREND;
  const effectiveClasses = classData || MOCK_DRUG_CLASSES;
  const effectiveAcb = acbData || MOCK_ACB_TIMELINE;
  const effectiveInteract = interactData || MOCK_TOP_INTERACTIONS;

  const isLoading = shouldFetch && (l1 || l2 || l3 || l4 || l5);

  return (
    <PageTransition>
      {/* Print View Media Styles */}
      <style>{`
        @media print {
          nav, header, aside, .print\\:hidden { display: none !important; }
          body, main { background: #FFFFFF !important; color: #000000 !important; }
          .shadow-xs, .shadow-sm, .shadow-md, .shadow-lg { box-shadow: none !important; }
        }
      `}</style>

      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Top Bar: Navigation + Real-Time Badge + Export Summary Button ── */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 print:hidden">
            <BackButton to="/home" label="Back to Dashboard" />

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--surface-2)] text-[var(--brand-600)] border border-[var(--border)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand-600)] opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--brand-600)]" />
                </span>
                <span className="font-mono text-[11px]">Real-Time Pharmacovigilance</span>
              </div>

              {/* Export Summary Print Button */}
              <button
                type="button"
                onClick={() => window.print()}
                className="ps-btn ps-btn-secondary inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold shadow-2xs cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
                title="Open browser print dialog for summary"
              >
                <Printer className="w-3.5 h-3.5 text-[var(--accent-500)]" />
                <span>Export Summary</span>
              </button>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink)] font-[var(--font-heading)]">
              Safety Insights & Longitudinal Trends
            </h1>
            <p className="text-sm mt-1 text-[var(--ink-2)]">
              Longitudinal tracking across your complete medication regimen, cumulative sedation burden, and adverse interaction signals.
            </p>
          </div>
        </div>

        {/* ── KPI StatTiles with CountUp ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <StatTile
            label="Active Regimen"
            value={effectiveScore?.breakdown?.medicationCount?.value || 5}
            delta="+1"
            deltaType="neutral"
            deltaLabel="vs last mo"
            sparklineData={[3, 4, 4, 5, 5, 5]}
            hint="5 active agents"
            icon={<Pill className="w-4 h-4 text-[var(--brand-600)]" />}
          />
          <StatTile
            label="Regimen Health"
            value={effectiveScore?.score || 74}
            suffix="/100"
            delta="+6 pts"
            deltaType="positive"
            deltaLabel="Grade B"
            sparklineData={[62, 65, 68, 70, 74]}
            hint="Low Toxicity"
            icon={<Star className="w-4 h-4 text-[var(--accent-500)]" />}
          />
          <StatTile
            label="ACB Burden Score"
            value={effectiveScore?.breakdown?.acbBurden?.value || 4}
            delta="High"
            deltaType="negative"
            deltaLabel="Sedation Risk"
            sparklineData={[2, 2, 3, 3, 4, 4]}
            hint="Beers 2024"
            icon={<Brain className="w-4 h-4 text-[var(--caution-fg)]" />}
          />
          <StatTile
            label="8-Wk Adherence"
            value={92}
            suffix="%"
            delta="12d streak"
            deltaType="positive"
            deltaLabel="Compliant"
            sparklineData={[80, 85, 88, 90, 92]}
            hint="51/56 days taken"
            icon={<Activity className="w-4 h-4 text-emerald-600" />}
          />
        </div>

        {/* ── Charts: Category Donut & 30-Day Risk Trend ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CategoryDonutChart data={effectiveClasses} />
          <RiskTrendAreaChart data={effectiveTrend} />
        </div>

        {/* ── Charts: ACB Trajectory ── */}
        <AcbTrajectoryChart data={effectiveAcb} />

        {/* ── Adherence Heatmap (8 Weeks Calendar Grid) ── */}
        <AdherenceHeatmap />

        {/* ── Top-Pairs Clinical Table ── */}
        <TopPairsTable data={effectiveInteract} />

        {/* ── Clinical Guidance Footnote ── */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--canvas)] border border-[var(--border)] text-xs text-[var(--ink-3)]">
          <Info className="w-4 h-4 text-[var(--brand-600)] flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-[var(--ink)]">Clinical Pharmacovigilance Advisory:</strong> Analytics reflect combined prescription orders, OTC drugs, and self-reported herbal extracts. Patients with cumulative anticholinergic burden (ACB ≥ 3) should request a periodic de-prescribing evaluation to minimize fall and memory risks.
          </p>
        </div>

      </div>
    </PageTransition>
  );
}
