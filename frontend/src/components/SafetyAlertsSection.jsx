import React, { useState } from 'react';
import {
  Layers,
  Boxes,
  ShieldAlert,
  HeartPulse,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Pill,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { StatusPill } from './LedIndicator';
import { useT } from '../i18n/useT';
import { getLocalizedAlert } from '../utils/localizedAlerts';
import AudioListenButton from './AudioListenButton';

export { StatusPill };

export const ALERT_TYPE_META = {
  DUPLICATE_INGREDIENT: {
    label: 'Duplicate Ingredient',
    fullTitle: 'Duplicate Active Ingredients',
    icon: Layers,
    badgeBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25',
    description: 'Multiple medicines containing the exact same active salt or chemical entity.',
  },
  DUPLICATE_CLASS: {
    label: 'Duplicate Class',
    fullTitle: 'Therapeutic Class Duplication',
    icon: Boxes,
    badgeBg: 'bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/25',
    description: 'Concurrent prescriptions within the same therapeutic drug class.',
  },
  ALLERGY: {
    label: 'Allergy / Cross-Reactivity',
    fullTitle: 'Drug Allergy & Cross-Reactivity Risk',
    icon: ShieldAlert,
    badgeBg: 'bg-rose-600/15 text-rose-800 dark:text-rose-300 border-rose-600/30',
    description: 'Match with your documented drug allergies or cross-reactive chemical groups.',
  },
  DISEASE_DRUG: {
    label: 'Disease-Drug Caution',
    fullTitle: 'Disease-Drug Cautions (Beers / STOPP)',
    icon: HeartPulse,
    badgeBg: 'bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-500/25',
    description: 'Evidence-based cautions for older adults with existing medical conditions.',
  },
  FOOD_SPACING: {
    label: 'Food & Spacing Advice',
    fullTitle: 'Food Conflicts & Dose Timing Separation',
    icon: Clock,
    badgeBg: 'bg-teal-500/10 text-teal-800 dark:text-teal-300 border-teal-500/25',
    description: 'Dietary contraindications and required minimum intervals between doses.',
  },
};

export function mapSeverityToPillStatus(sev) {
  const s = String(sev || '').toUpperCase();
  if (s === 'CRITICAL') return 'critical';
  if (s === 'MAJOR') return 'critical';
  if (s === 'MODERATE') return 'caution';
  if (s === 'MINOR') return 'caution';
  return 'safe';
}

export default function SafetyAlertsSection({
  alerts = [],
  title,
  subtitle,
  compact = false,
  initialCategory = 'ALL',
}) {
  const { t, lang } = useT();
  const displayTitle = title || t('safety_alerts.title', 'Medication Safety Alerts');
  const displaySubtitle = subtitle !== undefined ? subtitle : t('safety_alerts.subtitle', '5-dimension clinical checks: duplicates, class overlap, allergies, conditions, and spacing.');

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [expandedMap, setExpandedMap] = useState({});

  const toggleExpand = (id) => {
    setExpandedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = [
    { id: 'ALL', label: t('safety_alerts.filter_all', 'All Alerts ({count})').replace('({count})', '').trim(), count: alerts.length },
    {
      id: 'DUPLICATE_INGREDIENT',
      label: t('safety_alerts.types.DUPLICATE_INGREDIENT', 'Duplicate Ingredient'),
      count: alerts.filter((a) => a.type === 'DUPLICATE_INGREDIENT').length,
    },
    {
      id: 'DUPLICATE_CLASS',
      label: t('safety_alerts.types.DUPLICATE_CLASS', 'Duplicate Class'),
      count: alerts.filter((a) => a.type === 'DUPLICATE_CLASS').length,
    },
    {
      id: 'ALLERGY',
      label: t('safety_alerts.types.ALLERGY', 'Allergy Matches'),
      count: alerts.filter((a) => a.type === 'ALLERGY').length,
    },
    {
      id: 'DISEASE_DRUG',
      label: t('safety_alerts.types.DISEASE_DRUG', 'Disease-Drug'),
      count: alerts.filter((a) => a.type === 'DISEASE_DRUG').length,
    },
    {
      id: 'FOOD_SPACING',
      label: t('safety_alerts.types.FOOD_SPACING', 'Food & Spacing'),
      count: alerts.filter((a) => a.type === 'FOOD_SPACING').length,
    },
  ];

  const filteredAlerts =
    selectedCategory === 'ALL'
      ? alerts
      : alerts.filter((a) => a.type === selectedCategory);

  // Group by type for clear reading
  const grouped = filteredAlerts.reduce((acc, alert) => {
    const t = alert.type || 'OTHER';
    if (!acc[t]) acc[t] = [];
    acc[t].push(alert);
    return acc;
  }, {});

  if (!alerts || alerts.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto text-emerald-600">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-extrabold text-[var(--ink)] font-[var(--font-heading)]">
          {t('safety_alerts.all_clear_title', 'All 5 Safety Checks Clear')}
        </h4>
        <p className="text-xs text-[var(--ink-2)] max-w-md mx-auto leading-relaxed">
          {t('safety_alerts.all_clear_sub', 'No duplicate ingredients, duplicate therapeutic classes, allergy risks, disease contraindications, or dose spacing conflicts detected.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header if not in compact mode */}
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[var(--brand-600)]/15 text-[var(--brand-600)]">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <h3 className="text-base sm:text-lg font-bold text-[var(--ink)] font-[var(--font-heading)]">
                {displayTitle}
              </h3>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 dark:border-rose-900/40">
                {alerts.length} Alert{alerts.length !== 1 ? 's' : ''}
              </span>
            </div>
            {displaySubtitle && (
              <p className="text-xs text-[var(--ink-3)] mt-1">
                {displaySubtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-[var(--brand-600)] text-white border-[var(--brand-600)] shadow-xs'
                  : 'bg-[var(--canvas)] text-[var(--ink-2)] border-[var(--border)] hover:bg-[var(--surface-2)]'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected
                    ? 'bg-white/25 text-white'
                    : 'bg-[var(--border)] text-[var(--ink-3)]'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Alerts Grouped by Category */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([typeKey, alertGroup]) => {
          const meta = ALERT_TYPE_META[typeKey] || {
            label: typeKey,
            fullTitle: typeKey,
            icon: AlertTriangle,
            badgeBg: 'bg-gray-100 text-gray-800 border-gray-200',
            description: '',
          };
          const IconComp = meta.icon;

          return (
            <div key={typeKey} className="space-y-2.5">
              {/* Type Category Header */}
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <span className={`p-1 rounded-lg border text-xs ${meta.badgeBg}`}>
                    <IconComp className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-extrabold text-[var(--ink)] uppercase tracking-wider">
                    {meta.fullTitle}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[var(--ink-3)]">
                  {alertGroup.length} issue{alertGroup.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Cards in this category */}
              <div className="space-y-2.5">
                {alertGroup.map((alert) => {
                  const isExpanded = !!expandedMap[alert.id];
                  const localized = getLocalizedAlert(alert, lang);
                  const alertText = localized.plainText;
                  const severityLabel = localized.severityLabel;
                  const pillStatus = mapSeverityToPillStatus(alert.severity);

                  return (
                    <div
                      key={alert.id}
                      className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs hover:border-[var(--border-strong)] transition-all space-y-3"
                    >
                      {/* Top Bar: Severity Pill + Medicines */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusPill
                            status={pillStatus}
                            label={severityLabel || alert.severity || 'CAUTION'}
                            size="sm"
                          />

                          {/* Medicines involved pills */}
                          {alert.medicines && alert.medicines.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {alert.medicines.map((m, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-[var(--canvas)] border border-[var(--border)] text-[var(--ink)] shadow-2xs"
                                >
                                  <Pill className="w-3 h-3 text-[var(--brand-600)]" />
                                  <span>{typeof m === 'string' ? m : (m?.name || m?.label || 'Medicine')}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Clinical Evidence Source Tag */}
                        {alert.source && (
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[var(--canvas)] border border-[var(--border)] text-[var(--ink-3)]">
                            Source: {alert.source}
                          </span>
                        )}
                      </div>

                      {/* Plain Language Explanation (Patient-friendly) + Audio Listen Button */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-sm font-semibold text-[var(--ink)] leading-relaxed flex-1">
                          {alertText}
                        </div>
                        <AudioListenButton text={alertText} lang={lang} />
                      </div>

                      {/* Rationale callout if provided */}
                      {alert.rationale && (
                        <div className="p-2.5 rounded-xl bg-[var(--canvas)] border border-[var(--border)] text-xs text-[var(--ink-2)] flex items-start gap-2 leading-relaxed">
                          <Info className="w-3.5 h-3.5 text-[var(--brand-600)] flex-shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-[var(--ink)]">Rationale: </strong>
                            <span>{alert.rationale}</span>
                          </div>
                        </div>
                      )}

                      {/* Toggleable Clinical Pharmacological Detail */}
                      {alert.clinicalText && (
                        <div className="pt-1 border-t border-[var(--border)]/60">
                          <button
                            type="button"
                            onClick={() => toggleExpand(alert.id)}
                            className="text-xs font-bold text-[var(--doctor-600)] hover:underline flex items-center gap-1 cursor-pointer py-1"
                          >
                            <span>{isExpanded ? 'Hide Clinical Telemetry' : 'View Clinical / Prescriber Notes'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 p-3 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono leading-relaxed space-y-1 shadow-inner">
                              <div className="flex items-center gap-1.5 text-teal-400 font-bold text-[11px] mb-1">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Pharmacological Mechanism & Guidelines</span>
                              </div>
                              <p className="text-slate-300">{alert.clinicalText}</p>
                              {alert.source && (
                                <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                                  Benchmark: {alert.source} (Needs clinical review)
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
