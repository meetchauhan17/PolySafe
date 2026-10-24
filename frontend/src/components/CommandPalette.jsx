/**
 * frontend/src/components/CommandPalette.jsx
 *
 * Unified Overlay — Command Palette (Cmd+K / Ctrl+K)
 * ─────────────────────────────────────────────────────────────────────────────
 * • Centered glass panel over unified backdrop (rgba(22,33,44, 0.55) + 8px blur)
 * • Grouped results: Pages | Medicines | Actions
 * • Full Indian formulary & patient regimen searching
 * • Recent items: last 5 commands persisted in sessionStorage
 * • Keyboard navigation: ↑↓ navigate, ↵ select, Esc close, aria-activedescendant
 * • Spring entrance: scale .96→1 + y 8px rise (spring stiffness 380, damping 30)
 * • Multilingual support: English, Hindi, Gujarati
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Search, FileBadge, Home, PlusCircle, Clock, HeartPulse, Users,
  UserCircle, Printer, CreditCard, Languages, ArrowRight, Sparkles,
  X, Stethoscope, History, Pill, ShieldAlert, FileText, CheckCircle2,
} from 'lucide-react';
import { useT } from '../i18n/useT';

const RECENT_KEY = 'ps_cmd_recent';
const MAX_RECENT = 5;

// Default patient medicines (used in demo mode and as fallback)
const DEFAULT_MEDICINES = [
  { id: 'med-warfarin', name: 'Warfarin', dosage: '5mg', type: 'PRESCRIPTION', category: 'Anticoagulant (Blood Thinner)', salts: 'Warfarin Sodium' },
  { id: 'med-aspirin', name: 'Aspirin', dosage: '81mg', type: 'OTC', category: 'Antiplatelet / NSAID', salts: 'Acetylsalicylic acid' },
  { id: 'med-lisinopril', name: 'Lisinopril', dosage: '10mg', type: 'PRESCRIPTION', category: 'ACE Inhibitor', salts: 'Lisinopril' },
  { id: 'med-turmeric', name: 'Turmeric (Curcumin)', dosage: '500mg', type: 'HERBAL', category: 'Herbal Supplement', salts: 'Curcuminoids' },
];

function getRecent() {
  try { return JSON.parse(sessionStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}

function saveRecent(id) {
  try {
    const current = getRecent().filter((r) => r !== id).slice(0, MAX_RECENT - 1);
    sessionStorage.setItem(RECENT_KEY, JSON.stringify([id, ...current]));
  } catch {
    // Ignore storage quota
  }
}

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { t, setLang } = useT();
  const reduce = useReducedMotion();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelected] = useState(0);
  const [recent, setRecent] = useState([]);
  const [patientMeds, setPatientMeds] = useState(DEFAULT_MEDICINES);

  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Load custom medicines from localStorage (guest sandbox additions)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('polysafe_guest_medicines');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPatientMeds(parsed);
        }
      }
    } catch {
      // Use defaults
    }
  }, [isOpen]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelected(0);
      setRecent(getRecent());
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  const run = useCallback((cmd) => {
    saveRecent(cmd.id);
    setRecent(getRecent());
    cmd.action();
  }, []);

  // Construct all searchable items grouped into Pages, Medicines, Actions
  const commands = useMemo(() => {
    const pages = [
      {
        id: 'page-home',
        group: 'Pages',
        icon: Home,
        color: 'text-[var(--brand-600)]',
        bg: 'bg-[var(--brand-600)]/10',
        title: t('nav.home', 'Home Dashboard'),
        subtitle: 'Active regimen, clinical status, and dose timetable',
        keywords: ['home', 'dashboard', 'regimen', 'overview', 'होम', 'હોમ'],
        action: () => { navigate('/home'); onClose(); },
      },
      {
        id: 'page-passport',
        group: 'Pages',
        icon: FileBadge,
        color: 'text-[var(--brand-600)]',
        bg: 'bg-[var(--brand-600)]/10',
        title: t('passport.title', 'Medication Passport'),
        subtitle: 'One-page clinical summary and wallet emergency card',
        keywords: ['passport', 'card', 'print', 'a4', 'wallet', 'पासपोर्ट', 'દવા પાસપોર્ટ'],
        action: () => { navigate('/passport'); onClose(); },
      },
      {
        id: 'page-add-medicine',
        group: 'Pages',
        icon: PlusCircle,
        color: 'text-emerald-600',
        bg: 'bg-emerald-500/10',
        title: t('nav.add_med', 'Add Medication'),
        subtitle: 'Search Indian brands, generics, OTC or herbal supplements',
        keywords: ['add', 'medicine', 'drug', 'prescription', 'दवा जोड़ें', 'દવા ઉમેરો'],
        action: () => { navigate('/add-medicine'); onClose(); },
      },
      {
        id: 'page-risk',
        group: 'Pages',
        icon: ShieldAlert,
        color: 'text-amber-600',
        bg: 'bg-amber-500/10',
        title: t('risk_analysis.title', 'Risk & Interaction Analysis'),
        subtitle: 'Pharmacological DDIs, anticholinergic burden, Beers criteria',
        keywords: ['risk', 'interaction', 'ddi', 'acb', 'harm', 'जोखिम', 'જોખમ'],
        action: () => { navigate('/risk'); onClose(); },
      },
      {
        id: 'page-symptoms',
        group: 'Pages',
        icon: HeartPulse,
        color: 'text-rose-600',
        bg: 'bg-rose-500/10',
        title: t('nav.symptoms', 'Log a Symptom'),
        subtitle: 'Prescribing cascade surveillance and timeline cross-reference',
        keywords: ['symptom', 'cascade', 'side effect', 'लक्षण', 'લક્ષણો'],
        action: () => { navigate('/log-symptom'); onClose(); },
      },
      {
        id: 'page-timeline',
        group: 'Pages',
        icon: Clock,
        color: 'text-blue-600',
        bg: 'bg-blue-500/10',
        title: t('nav.timeline', 'Medication Timeline'),
        subtitle: 'Audit trail of prescription changes and doctor directives',
        keywords: ['timeline', 'history', 'log', 'changes', 'टाइमलाइन', 'સમયરેખા'],
        action: () => { navigate('/timeline'); onClose(); },
      },
      {
        id: 'page-share',
        group: 'Pages',
        icon: Stethoscope,
        color: 'text-teal-600',
        bg: 'bg-teal-500/10',
        title: 'Share with Doctor',
        subtitle: 'Generate secure 6-digit clinical portal PIN and QR code',
        keywords: ['doctor', 'share', 'code', 'pin', 'qr', 'डॉक्टर', 'શેર'],
        action: () => { navigate('/share-with-doctor'); onClose(); },
      },
      {
        id: 'page-connected',
        group: 'Pages',
        icon: Users,
        color: 'text-indigo-600',
        bg: 'bg-indigo-500/10',
        title: t('nav.connected', 'Connected People'),
        subtitle: 'Authorized caregivers and attending physicians',
        keywords: ['connected', 'caregiver', 'family', 'doctor', 'जुड़े लोग', 'જોડાયેલા'],
        action: () => { navigate('/connected'); onClose(); },
      },
      {
        id: 'page-profile',
        group: 'Pages',
        icon: UserCircle,
        color: 'text-slate-600',
        bg: 'bg-slate-500/10',
        title: t('nav.profile', 'Profile & Preferences'),
        subtitle: 'Adjust language, font size, and clinical health profile',
        keywords: ['profile', 'settings', 'account', 'language', 'प्रोफ़ाइल', 'પ્રોફાઇલ'],
        action: () => { navigate('/profile'); onClose(); },
      },
    ];

    const medicines = patientMeds.map((med, index) => ({
      id: `med-${med.id || index}-${med.name.toLowerCase().replace(/\s+/g, '-')}`,
      group: 'Medicines',
      icon: Pill,
      color: med.type === 'HERBAL' ? 'text-emerald-600' : med.type === 'OTC' ? 'text-amber-600' : 'text-teal-600',
      bg: med.type === 'HERBAL' ? 'bg-emerald-500/10' : med.type === 'OTC' ? 'bg-amber-500/10' : 'bg-teal-500/10',
      title: `${med.name} ${med.dosage || ''}`.trim(),
      subtitle: `${med.category || med.type || 'Medication'} ${med.salts ? `• ${med.salts}` : ''}`,
      keywords: [med.name, med.dosage, med.salts, med.type, 'medicine', 'dose', 'drug'].filter(Boolean),
      action: () => {
        navigate(`/risk?highlight=${encodeURIComponent(med.name)}`);
        onClose();
      },
    }));

    const actions = [
      {
        id: 'act-print-passport',
        group: 'Actions',
        icon: Printer,
        color: 'text-teal-700',
        bg: 'bg-teal-600/10',
        title: 'Print A4 Medication Passport',
        subtitle: 'Open clinical summary formatted for standard A4 medical handover',
        keywords: ['print', 'pdf', 'a4', 'export', 'download', 'प्रिंट'],
        action: () => { navigate('/passport?view=a4&action=print'); onClose(); },
      },
      {
        id: 'act-wallet-card',
        group: 'Actions',
        icon: CreditCard,
        color: 'text-rose-700',
        bg: 'bg-rose-600/10',
        title: 'View Emergency Wallet Card',
        subtitle: 'ISO/IEC 85.6×54mm wallet card with emergency contact and DDI alerts',
        keywords: ['wallet', 'emergency', 'card', 'icard', 'वॉलेट'],
        action: () => { navigate('/passport?view=wallet'); onClose(); },
      },
      {
        id: 'act-log-symptom',
        group: 'Actions',
        icon: HeartPulse,
        color: 'text-rose-600',
        bg: 'bg-rose-500/10',
        title: 'Report New Adverse Symptom',
        subtitle: 'Check if current symptoms are drug-induced prescribing cascades',
        keywords: ['symptom', 'adverse', 'report', 'cascade', 'लक्षण'],
        action: () => { navigate('/log-symptom'); onClose(); },
      },
      {
        id: 'lang-en',
        group: 'Actions',
        icon: Languages,
        color: 'text-[var(--brand-600)]',
        bg: 'bg-[var(--brand-600)]/10',
        title: 'Switch Language to English',
        subtitle: 'Display user interface in English',
        keywords: ['english', 'en', 'language', 'भाषा'],
        action: () => { setLang('en'); onClose(); },
      },
      {
        id: 'lang-hi',
        group: 'Actions',
        icon: Languages,
        color: 'text-[var(--brand-600)]',
        bg: 'bg-[var(--brand-600)]/10',
        title: 'भाषा बदलें: हिन्दी',
        subtitle: 'पूरा इंटरफ़ेस हिंदी में देखें',
        keywords: ['hindi', 'hi', 'हिंदी', 'हिन्दी', 'भाषा'],
        action: () => { setLang('hi'); onClose(); },
      },
      {
        id: 'lang-gu',
        group: 'Actions',
        icon: Languages,
        color: 'text-[var(--brand-600)]',
        bg: 'bg-[var(--brand-600)]/10',
        title: 'ભાષા બદલો: ગુજરાતી',
        subtitle: 'સંપૂર્ણ ઇન્ટરફેસ ગુજરાતીમાં જુઓ',
        keywords: ['gujarati', 'gu', 'ગુજરાતી', 'ભાષા'],
        action: () => { setLang('gu'); onClose(); },
      },
    ];

    return [...pages, ...medicines, ...actions];
  }, [navigate, onClose, t, setLang, patientMeds]);

  // Filter commands by query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) =>
      c.title.toLowerCase().includes(q) ||
      c.subtitle?.toLowerCase().includes(q) ||
      c.group.toLowerCase().includes(q) ||
      c.keywords?.some((k) => k.toLowerCase().includes(q))
    );
  }, [commands, query]);

  const showRecent = !query.trim() && recent.length > 0;
  const recentCommands = useMemo(() => {
    if (!showRecent) return [];
    return recent.map((id) => commands.find((c) => c.id === id)).filter(Boolean);
  }, [showRecent, recent, commands]);

  const displayList = showRecent ? recentCommands : filtered;

  useEffect(() => { setSelected(0); }, [displayList]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.querySelector(`[data-index="${selectedIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((p) => (p + 1) % Math.max(1, displayList.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((p) => (p - 1 + displayList.length) % Math.max(1, displayList.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (displayList[selectedIndex]) {
        run(displayList[selectedIndex]);
      }
    }
  };

  // Group the filtered list preserving Pages -> Medicines -> Actions order
  const groupedFiltered = useMemo(() => {
    if (showRecent) return null;
    const order = ['Pages', 'Medicines', 'Actions'];
    const groups = {};
    order.forEach((g) => { groups[g] = []; });

    filtered.forEach((cmd) => {
      if (!groups[cmd.group]) groups[cmd.group] = [];
      groups[cmd.group].push(cmd);
    });

    // Remove empty groups
    Object.keys(groups).forEach((key) => {
      if (groups[key].length === 0) delete groups[key];
    });

    return groups;
  }, [filtered, showRecent]);

  const spring = { type: 'spring', stiffness: 380, damping: 30, mass: 0.9 };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[250] flex items-start justify-center pt-[12vh] sm:pt-[15vh] px-4">
          {/* Backdrop: rgba(22,33,44,0.55) + 8px blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.16 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0"
            style={{
              background: 'rgba(22,33,44,0.55)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Centered Glass Panel */}
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            transition={reduce ? { duration: 0.12 } : spring}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label="Command Palette"
            className="relative w-full max-w-xl rounded-[var(--radius-2xl)] bg-[var(--paper)]/95 backdrop-blur-xl border border-[var(--border)] shadow-[0_24px_64px_rgba(22,33,44,0.22),0_4px_16px_rgba(22,33,44,0.08)] overflow-hidden flex flex-col max-h-[75vh] z-10"
          >
            {/* Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] flex-shrink-0">
              <Search className="w-5 h-5 text-[var(--accent-500)] flex-shrink-0" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a page, medicine (Warfarin, Aspirin...), or action..."
                className="flex-1 bg-transparent text-sm font-medium text-[var(--ink)] placeholder-[var(--ink-4)] focus:outline-none"
                role="combobox"
                aria-expanded="true"
                aria-autocomplete="list"
                aria-controls="cmd-list"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 rounded-lg text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--canvas)] transition-colors cursor-pointer"
                  aria-label="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold text-[var(--ink-3)] bg-[var(--surface)] border border-[var(--border)] rounded shadow-2xs">
                  Esc
                </kbd>
              )}
            </div>

            {/* Results List */}
            <div id="cmd-list" ref={listRef} className="flex-1 overflow-y-auto p-2" role="listbox">
              {showRecent && (
                <div>
                  <div className="px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--ink-4)]">
                    <History className="w-3 h-3 text-[var(--accent-500)]" />
                    <span>Recent Searches</span>
                  </div>
                  {recentCommands.map((cmd, idx) => (
                    <CmdItem
                      key={cmd.id}
                      cmd={cmd}
                      idx={idx}
                      selected={idx === selectedIndex}
                      onSelect={() => { setSelected(idx); run(cmd); }}
                      onHover={() => setSelected(idx)}
                    />
                  ))}
                </div>
              )}

              {!showRecent && filtered.length === 0 && (
                <div className="py-12 text-center text-xs text-[var(--ink-3)] space-y-1">
                  <p>No matching commands or medicines found for &ldquo;{query}&rdquo;</p>
                  <p className="text-[11px] text-[var(--ink-4)]">Try &ldquo;Warfarin&rdquo;, &ldquo;Add Medication&rdquo;, or &ldquo;Passport&rdquo;</p>
                </div>
              )}

              {!showRecent && groupedFiltered && Object.entries(groupedFiltered).map(([group, items]) => {
                const groupStartIdx = filtered.indexOf(items[0]);
                return (
                  <div key={group}>
                    <div className="px-3 pt-3 pb-1 text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--ink-4)] flex items-center gap-1.5">
                      <span>{group}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[var(--canvas)] text-[var(--ink-3)]">
                        {items.length}
                      </span>
                    </div>
                    {items.map((cmd, localIdx) => {
                      const globalIdx = groupStartIdx + localIdx;
                      return (
                        <CmdItem
                          key={cmd.id}
                          cmd={cmd}
                          idx={globalIdx}
                          selected={globalIdx === selectedIndex}
                          onSelect={() => { setSelected(globalIdx); run(cmd); }}
                          onHover={() => setSelected(globalIdx)}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Keyboard Hints & Spotlight Branding */}
            <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--canvas)]/70 flex items-center justify-between text-[11px] text-[var(--ink-3)] font-mono flex-shrink-0">
              <div className="flex items-center gap-3">
                <span><kbd className="font-bold px-1 py-0.5 bg-[var(--surface)] border border-[var(--border)] rounded text-[10px]">↑↓</kbd> Navigate</span>
                <span><kbd className="font-bold px-1 py-0.5 bg-[var(--surface)] border border-[var(--border)] rounded text-[10px]">↵</kbd> Select</span>
                <span><kbd className="font-bold px-1 py-0.5 bg-[var(--surface)] border border-[var(--border)] rounded text-[10px]">Esc</kbd> Close</span>
              </div>
              <div className="flex items-center gap-1.5 font-sans font-semibold text-[10px] text-[var(--brand-600)]">
                <Sparkles className="w-3 h-3 text-[var(--accent-500)]" />
                <span>PolySafe Spotlight</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function CmdItem({ cmd, idx, selected, onSelect, onHover }) {
  const Icon = cmd.icon;
  return (
    <button
      id={`cmd-item-${cmd.id}`}
      type="button"
      data-index={idx}
      onClick={onSelect}
      onMouseEnter={onHover}
      role="option"
      aria-selected={selected}
      className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
        selected
          ? 'bg-[var(--brand-600)] text-white shadow-xs'
          : 'hover:bg-[var(--canvas)] text-[var(--ink)]'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
            selected ? 'bg-white/20 text-white' : `${cmd.bg} ${cmd.color}`
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className={`text-xs font-bold truncate ${selected ? 'text-white' : 'text-[var(--ink)]'}`}>
            {cmd.title}
          </div>
          {cmd.subtitle && (
            <div className={`text-[11px] truncate ${selected ? 'text-white/80' : 'text-[var(--ink-3)]'}`}>
              {cmd.subtitle}
            </div>
          )}
        </div>
      </div>
      <ArrowRight
        className={`w-3.5 h-3.5 flex-shrink-0 transition-all ${
          selected ? 'text-white translate-x-0.5' : 'text-[var(--ink-3)] opacity-0'
        }`}
      />
    </button>
  );
}
