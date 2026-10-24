import React from 'react';
import { motion } from 'framer-motion';
import {
  UtensilsCrossed,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Info,
  Wine,
  Coffee,
  Sun,
  Leaf,
  Milk,
  Apple,
} from 'lucide-react';
import { useT } from '../i18n/useT';

export default function FoodDrugSafetyPanel({
  conflicts = [],
}) {
  const { t } = useT();
  const getIcon = (iconName) => {
    switch ((iconName || '').toLowerCase()) {
      case 'citrus':
        return <Apple className="w-5 h-5 text-amber-600" />;
      case 'milk':
        return <Milk className="w-5 h-5 text-blue-600" />;
      case 'banana':
        return <Apple className="w-5 h-5 text-yellow-600" />;
      case 'leaf':
        return <Leaf className="w-5 h-5 text-emerald-600" />;
      case 'wine':
        return <Wine className="w-5 h-5 text-rose-600" />;
      case 'coffee':
        return <Coffee className="w-5 h-5 text-amber-800" />;
      case 'sun':
        return <Sun className="w-5 h-5 text-amber-500" />;
      default:
        return <UtensilsCrossed className="w-5 h-5 text-slate-600" />;
    }
  };

  if (!conflicts || conflicts.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-3 shadow-xs">
        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-extrabold text-[var(--ink)] font-[var(--font-heading)]">
            {t('food_panel.no_conflicts_title', 'No Active Food or Lifestyle Conflicts')}
          </h4>
          <p className="text-xs text-[var(--ink-3)] max-w-md mx-auto leading-relaxed">
            {t('food_panel.no_conflicts_sub', 'Your current active medication regimen has zero high-risk interactions with common foods, grapefruit juice, dairy, potassium, or alcohol.')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/25 dark:border-amber-800/50 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-extrabold text-sm text-amber-950 dark:text-amber-100">
            {t('food_panel.conflicts_banner_title', `${conflicts.length} Dietary & Lifestyle Precautions Identified`, { count: conflicts.length })}
          </p>
          <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
            {t('food_panel.conflicts_banner_sub', 'Certain everyday foods, juices, and drinks alter the way your liver enzymes and stomach absorb active medications. Review the safety advisories below.')}
          </p>
        </div>
      </div>

      {/* Grid of Conflict Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {conflicts.map((item, idx) => {
          const isMajor = (item.severity || '').toLowerCase() === 'major';

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-5 rounded-3xl border transition-all shadow-xs flex flex-col justify-between space-y-3 ${
                isMajor
                  ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/50 hover:border-rose-300 dark:hover:border-rose-700'
                  : 'bg-amber-50/40 dark:bg-amber-950/25 border-amber-200/70 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-700'
              }`}
            >
              <div className="space-y-2.5">
                {/* Header item + badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-white dark:bg-[var(--surface-2)] rounded-2xl border border-slate-200 dark:border-[var(--border)] shadow-2xs">
                      {getIcon(item.icon)}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-[var(--ink-3)] font-bold block">
                        {item.foodCategory || 'Dietary Precaution'}
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-[var(--ink)] leading-snug">
                        {item.foodItem}
                      </h4>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isMajor
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {item.severity}
                  </span>
                </div>

                {/* Clinical Title */}
                <p className="text-xs font-bold text-slate-900 dark:text-[var(--ink)]">
                  {item.clinicalTitle}
                </p>

                {/* Plain Advice */}
                <p className="text-xs text-slate-700 dark:text-[var(--ink-2)] leading-relaxed">
                  {item.plainAdvice}
                </p>
              </div>

              {/* Footer: Triggering medications & Action badge */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-[var(--border)] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-[11px] text-slate-600 dark:text-[var(--ink-3)] font-mono">
                  Triggered by: <strong className="text-slate-900 dark:text-[var(--ink)]">{item.triggeringMedicines?.join(', ')}</strong>
                </div>

                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl bg-white dark:bg-[var(--surface-2)] border border-slate-300 dark:border-[var(--border)] text-slate-800 dark:text-[var(--ink)] shadow-2xs">
                  {item.actionBadge}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
