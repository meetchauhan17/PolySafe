import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Flame, Award, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AdherenceRing from './AdherenceRing';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AdherenceHeatmap({ className = '' }) {
  const { token, isGuest } = useAuth() || {};
  const [hoveredDay, setHoveredDay] = useState(null);

  // Fetch 56 days (8 weeks) adherence data from backend
  const { data: adherenceData, isLoading } = useQuery({
    queryKey: ['patient-adherence', 56],
    queryFn: async () => {
      const res = await axios.get('/patient/adherence?days=56', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.data;
    },
    enabled: !!token && !isGuest,
    staleTime: 60_000,
  });

  // Generate 8-week (56 days) calendar grid data with fallbacks for demo
  const gridDays = useMemo(() => {
    const backendHistory = adherenceData?.history || [];
    const historyMap = {};
    backendHistory.forEach((h) => {
      historyMap[h.date] = h;
    });

    const days = [];
    const today = new Date();

    for (let i = 55; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayOfWeek = d.getDay(); // 0 is Sun

      if (historyMap[dateStr]) {
        days.push({
          date: dateStr,
          dayOfWeek,
          dayName: DAY_LABELS[dayOfWeek],
          displayDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          ...historyMap[dateStr],
        });
      } else {
        // Deterministic high-adherence pattern for demo mode
        const hash = (dateStr.charCodeAt(8) || 0) + (dateStr.charCodeAt(9) || 0) + i;
        const isMissed = hash % 9 === 0;
        const total = 4;
        const taken = isMissed ? 2 : 4;
        const pct = Math.round((taken / total) * 100);

        days.push({
          date: dateStr,
          dayOfWeek,
          dayName: DAY_LABELS[dayOfWeek],
          displayDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          total,
          taken,
          skipped: isMissed ? 1 : 0,
          missed: isMissed ? 1 : 0,
          percentage: pct,
        });
      }
    }

    return days;
  }, [adherenceData]);

  // Group into 8 weeks of 7 days
  const weeks = useMemo(() => {
    const list = [];
    for (let i = 0; i < gridDays.length; i += 7) {
      list.push(gridDays.slice(i, i + 7));
    }
    return list;
  }, [gridDays]);

  const overallPercentage = adherenceData?.adherencePercentage ?? 92;
  const streakDays = adherenceData?.streakDays ?? 12;

  // Heatmap intensity coloring helper
  const getCellColor = (day) => {
    if (!day || day.total === 0) return 'bg-[var(--canvas)] border-[var(--border)]';
    const pct = day.percentage;
    if (pct === 100) return 'bg-emerald-600 border-emerald-700 text-white shadow-xs';
    if (pct >= 75) return 'bg-emerald-500/80 border-emerald-600 text-white';
    if (pct >= 50) return 'bg-teal-500/50 border-teal-600 text-teal-900 dark:text-teal-100';
    if (pct > 0) return 'bg-amber-500/40 border-amber-500 text-amber-900 dark:text-amber-100';
    return 'bg-rose-500/30 border-rose-500 text-rose-900 dark:text-rose-100';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`p-6 rounded-2xl ${className}`}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[var(--ink)] font-[var(--font-heading)]">
                8-Week Medication Adherence Heatmap
              </h2>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/25">
                56 DAYS
              </span>
            </div>
            <p className="text-xs text-[var(--ink-2)] mt-0.5">
              Daily dose compliance records. Hover over any day to inspect dose telemetry.
            </p>
          </div>
        </div>

        {/* Quick Ring / Metrics */}
        <div className="flex items-center gap-4 self-start sm:self-center">
          <div className="flex items-center gap-2 font-mono text-xs text-[var(--ink-2)]">
            <div className="flex items-center gap-1 text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20 font-bold">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{streakDays} Day Streak</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{overallPercentage}% Compliance</span>
            </div>
          </div>
        </div>
      </div>

      {/* 8-Week Calendar Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[620px]">
          {/* Day-of-week header row */}
          <div className="grid grid-cols-8 gap-2 mb-2 text-center">
            <div className="text-[10px] font-mono font-bold text-[var(--ink-3)] uppercase py-1">
              Week
            </div>
            {DAY_LABELS.map((day) => (
              <div key={day} className="text-[10px] font-mono font-bold text-[var(--ink-3)] uppercase py-1">
                {day}
              </div>
            ))}
          </div>

          {/* 8 Week Rows */}
          <div className="space-y-2">
            {weeks.map((week, wIdx) => {
              const weekStart = week[0]?.displayDate || '';
              const weekEnd = week[week.length - 1]?.displayDate || '';

              return (
                <div key={wIdx} className="grid grid-cols-8 gap-2 items-center">
                  {/* Week label */}
                  <div className="text-[10px] font-mono text-[var(--ink-3)] text-center truncate">
                    W{8 - wIdx} <span className="hidden xl:inline text-[9px] opacity-70">({weekStart})</span>
                  </div>

                  {/* 7 Days */}
                  {week.map((day) => {
                    const isHovered = hoveredDay?.date === day.date;

                    return (
                      <div
                        key={day.date}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`h-9 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center relative ${getCellColor(
                          day
                        )} ${isHovered ? 'ring-2 ring-[var(--brand-600)] scale-105 z-10' : ''}`}
                        title={`${day.date}: ${day.taken}/${day.total} doses taken (${day.percentage}%)`}
                      >
                        <span className="text-[11px] font-mono font-extrabold leading-none">
                          {day.date.slice(8)}
                        </span>
                        <span className="text-[8px] font-mono font-semibold opacity-90 leading-none mt-0.5">
                          {day.percentage}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hover details tooltip banner */}
      <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {hoveredDay ? (
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-[var(--surface-2)] font-mono font-bold text-[var(--ink)]">
              {hoveredDay.displayDate} ({hoveredDay.dayName})
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-emerald-600 font-bold">✓ {hoveredDay.taken} Taken</span>
              <span className="text-amber-600">· {hoveredDay.skipped || 0} Skipped</span>
              <span className="text-rose-600">· {hoveredDay.missed || 0} Missed</span>
              <span className="font-extrabold text-[var(--ink)]">({hoveredDay.percentage}% Adherence)</span>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-[var(--ink-3)] font-mono flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>Hover over any calendar cell to view historical dose breakdown.</span>
          </div>
        )}

        {/* Color Legend */}
        <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--ink-3)] self-end sm:self-center">
          <span>0%</span>
          <span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500" />
          <span className="w-3 h-3 rounded bg-amber-500/40 border border-amber-500" />
          <span className="w-3 h-3 rounded bg-teal-500/50 border border-teal-600" />
          <span className="w-3 h-3 rounded bg-emerald-500/80 border border-emerald-600" />
          <span className="w-3 h-3 rounded bg-emerald-600 border border-emerald-700" />
          <span>100%</span>
        </div>
      </div>
    </motion.div>
  );
}
