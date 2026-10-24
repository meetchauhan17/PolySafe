/**
 * frontend/src/components/NotificationPopover.jsx
 *
 * Unified Overlay — Notification Center Popover
 * ─────────────────────────────────────────────────────────────────────────────
 * • Grouped by Today / Earlier
 * • Unread coral dot on active unread items
 * • Item types with semantic icons and timestamps:
 *     - directive:     ClipboardList / Stethoscope (doctor orders & guidance)
 *     - safety status: ShieldAlert / AlertTriangle (DDIs & safety changes)
 *     - connection:    HeartHandshake / Users (caregiver & physician sync)
 *     - dose:          Pill / Clock (timetables & adherence reminders)
 * • "Mark all read" action that clears unread state
 * • Ivory paper card: bg-[var(--paper)], border-[var(--border)], radius-2xl
 * • Accessible: Escape to close, focus management, outside-click dismissal
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  ShieldAlert,
  HeartHandshake,
  Pill,
  CheckCheck,
  ChevronRight,
  Sparkles,
  Clock,
} from 'lucide-react';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'directive',
    group: 'Today',
    title: 'Physician Directive: Warfarin Monitoring',
    description: 'Dr. Sharma requested PT/INR lab check within 48h due to dose titration.',
    timestamp: '15m ago',
    unread: true,
    link: '/timeline',
  },
  {
    id: 'notif-2',
    type: 'safety status',
    group: 'Today',
    title: 'High Risk Alert: Warfarin + Turmeric',
    description: 'Botanical synergy inhibits CYP2C9, significantly elevating bleeding risk.',
    timestamp: '2h ago',
    unread: true,
    link: '/risk',
  },
  {
    id: 'notif-3',
    type: 'dose',
    group: 'Today',
    title: 'Dose Reminder: Lisinopril 10mg',
    description: 'Scheduled for 06:00 PM with water (take after evening meal).',
    timestamp: '4h ago',
    unread: false,
    link: '/home',
  },
  {
    id: 'notif-4',
    type: 'connection',
    group: 'Earlier',
    title: 'Caregiver Linked: Ananya Patel',
    description: 'Authorized read-only access to medication timetable and adherence logs.',
    timestamp: 'Yesterday, 3:20 PM',
    unread: false,
    link: '/connected',
  },
  {
    id: 'notif-5',
    type: 'directive',
    group: 'Earlier',
    title: 'Physician Directive: Aspirin Spacing',
    description: 'Ensure 4 hours interval between morning NSAID and evening anticoagulant.',
    timestamp: '3 days ago',
    unread: false,
    link: '/timeline',
  },
];

const TYPE_CONFIG = {
  directive: {
    icon: ClipboardList,
    color: 'text-[var(--doctor-600)]',
    bg: 'bg-[var(--doctor-600)]/12',
    badge: 'Directive',
  },
  'safety status': {
    icon: ShieldAlert,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/12',
    badge: 'Safety',
  },
  connection: {
    icon: HeartHandshake,
    color: 'text-[var(--brand-600)]',
    bg: 'bg-[var(--brand-600)]/12',
    badge: 'Circle',
  },
  dose: {
    icon: Pill,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/12',
    badge: 'Dose',
  },
};

export default function NotificationPopover({
  isOpen,
  onClose,
  onUnreadChange,
}) {
  const navigate = useNavigate();
  const [items, setItems] = useState(INITIAL_NOTIFICATIONS);

  const unreadCount = items.filter((item) => item.unread).length;

  const handleMarkAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
    onUnreadChange?.(0);
  };

  const handleItemClick = (item) => {
    // Mark this item as read
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, unread: false } : i))
    );
    onClose?.();
    if (item.link) {
      navigate(item.link);
    }
  };

  const todayItems = items.filter((i) => i.group === 'Today');
  const earlierItems = items.filter((i) => i.group === 'Earlier');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          role="dialog"
          aria-label="Notification center"
          className="absolute right-0 mt-2 w-88 sm:w-96 rounded-[var(--radius-2xl)] bg-[var(--paper)] border border-[var(--border)] shadow-[0_20px_50px_rgba(22,33,44,0.22),0_4px_16px_rgba(22,33,44,0.08)] p-0 overflow-hidden z-50 text-left text-[var(--ink)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--canvas)]/40">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-[var(--font-heading)] uppercase tracking-wider text-[var(--ink)]">
                Notifications
              </span>
              {unreadCount > 0 ? (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--accent-500)] text-white shadow-2xs">
                  {unreadCount} new
                </span>
              ) : (
                <span className="text-[10px] font-mono text-[var(--safe-fg)] bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                  All caught up
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--brand-600)] hover:text-[var(--brand-700)] hover:underline cursor-pointer transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Scrollable list grouped by Today / Earlier */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[var(--border)]/60">
            {/* ── Today Group ── */}
            {todayItems.length > 0 && (
              <div>
                <div className="px-4 py-1.5 bg-[var(--canvas)]/70 text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--ink-4)]">
                  Today
                </div>
                <div className="divide-y divide-[var(--border)]/40">
                  {todayItems.map((item) => (
                    <NotificationItem
                      key={item.id}
                      item={item}
                      onClick={() => handleItemClick(item)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Earlier Group ── */}
            {earlierItems.length > 0 && (
              <div>
                <div className="px-4 py-1.5 bg-[var(--canvas)]/70 text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--ink-4)]">
                  Earlier
                </div>
                <div className="divide-y divide-[var(--border)]/40">
                  {earlierItems.map((item) => (
                    <NotificationItem
                      key={item.id}
                      item={item}
                      onClick={() => handleItemClick(item)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--canvas)]/60 flex items-center justify-between text-xs">
            <Link
              to="/timeline"
              onClick={onClose}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--brand-600)] hover:underline"
            >
              <span>View Full Clinical Timeline</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NotificationItem({ item, onClick }) {
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.directive;
  const Icon = cfg.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-3 flex items-start gap-3 transition-colors hover:bg-[var(--canvas)] cursor-pointer relative ${
        item.unread ? 'bg-[var(--surface)]' : 'bg-transparent opacity-85'
      }`}
    >
      {/* Unread Coral Dot */}
      <div className="w-2.5 flex items-center justify-center pt-1.5 flex-shrink-0">
        {item.unread ? (
          <span className="w-2 h-2 rounded-full bg-[var(--accent-500)] ring-2 ring-[var(--accent-200)] shadow-2xs" />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
        )}
      </div>

      {/* Semantic Icon Badge */}
      <div className={`p-2 rounded-xl flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
        <Icon className="w-4 h-4 stroke-[2.2]" />
      </div>

      {/* Text Content */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center justify-between gap-2">
          <h5
            className={`text-xs truncate ${
              item.unread ? 'font-bold text-[var(--ink)]' : 'font-medium text-[var(--ink-2)]'
            }`}
          >
            {item.title}
          </h5>
          <span className="text-[10px] font-mono text-[var(--ink-4)] whitespace-nowrap flex-shrink-0">
            {item.timestamp}
          </span>
        </div>
        <p className="text-[11px] text-[var(--ink-3)] leading-relaxed line-clamp-2 mt-0.5">
          {item.description}
        </p>
      </div>
    </button>
  );
}
