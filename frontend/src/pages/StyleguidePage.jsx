// src/pages/StyleguidePage.jsx
import React, { useState } from 'react';
import {
  Plus,
  ArrowRight,
  Search,
  Mail,
  AlertCircle,
  Check,
  Shield,
  Trash2,
  Bell,
  Sun,
  Moon,
  Pill,
  Sliders,
  Sparkles,
  Info,
  Clock,
  Heart,
  Calendar,
  FileText,
  Copy,
  Layers,
  Activity,
  User,
  Stethoscope,
  HeartHandshake,
  UserCheck,
  ShoppingBag,
  Leaf,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  RotateCcw,
  RotateCw,
  Play,
  MousePointer,
  Box,
  Cpu,
  Eye,
  Sparkles as SparklesIcon,
} from 'lucide-react';
import Button, { IconButton } from '../components/Button';
import Input, { Textarea, Select } from '../components/Input';
import Chip from '../components/Chip';
import Toggle from '../components/Toggle';
import SegmentedControl from '../components/SegmentedControl';
import Tabs, { TabList, Tab, TabPanel } from '../components/Tabs';
import Card, { CardHeader, CardSection } from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import PullQuote from '../components/PullQuote';
import StatTile from '../components/StatTile';
import Divider from '../components/Divider';
import KeyValueList from '../components/KeyValueList';
import StatusPill from '../components/StatusPill';
import RoleBadge from '../components/RoleBadge';
import TypeChip from '../components/TypeChip';
import StatusDot from '../components/StatusDot';
import { DrugHarmBadge } from '../components/Badge';
import { useDisplaySettings } from '../context/DisplaySettingsContext';

// Motion Layer Components
import {
  CountUp,
  DrawLine,
  DrawDivider,
  Reveal,
  Magnetic,
  Pressable,
  HoverLift,
  Shimmer,
  ShimmerText,
  StaggerContainer,
  StaggerItem,
  SharedActivePill,
  Spotlight,
  useReducedMotion,
} from '../motion';
import RiskRing from '../components/RiskRing';
import Meter, { ACBMeter } from '../components/Meter';

// CSS 3D Layer Components (No WebGL)
import {
  TiltCard,
  TiltCardLayer,
  FlipCard,
  FloatingCapsule,
  ShieldMark,
  DepthStack,
  DepthLayer,
  use3DEnabled,
} from '../three-d';
import Logo, { LogoMark } from '../components/Logo';
import {
  EmptyMedicinesIllustration,
  EmptyFlagsIllustration,
  EmptyConnectionsIllustration,
  EmptySymptomsIllustration,
  EmptyPatientsIllustration,
  EmptyDataIllustration,
  EmptySearchIllustration,
} from '../components/EmptyIllustrations';
import PillLoader from '../components/PillLoader';
import { ClinicalIcon, MedicineTypeIcon, AlertSeverityIcon } from '../components/IconMap';
import {
  OnboardingAgeIllustration,
  OnboardingConditionsIllustration,
  OnboardingReviewIllustration,
} from '../components/OnboardingIllustrations';

export default function StyleguidePage() {
  const {
    theme,
    toggleTheme,
    is3DEnabled,
    toggle3DEnabled,
  } = useDisplaySettings();
  const prefersReduced = useReducedMotion();

  // Local interactive states for live demonstration
  const [interactiveInputVal, setInteractiveInputVal] = useState('');
  const [doseVal, setDoseVal] = useState('500');
  const [segmentedVal, setSegmentedVal] = useState('daily');
  const [filterSegmentVal, setFilterSegmentVal] = useState('all');
  const [tabVal, setTabVal] = useState('medications');
  const [toggle1, setToggle1] = useState(false);
  const [toggle2, setToggle2] = useState(true);
  const [toggle3, setToggle3] = useState(true);
  const [selectedChips, setSelectedChips] = useState(['morning', 'dinner']);

  // Motion layer interactive demonstration keys
  const [countUpKey, setCountUpKey] = useState(0);
  const [staggerKey, setStaggerKey] = useState(0);
  const [sheenKey, setSheenKey] = useState(0);

  // 3D Layer Component Toggles
  const [tiltCardToggle, setTiltCardToggle] = useState(true);
  const [flipDemoFlipped, setFlipDemoFlipped] = useState(false);
  const [floatingObjToggle, setFloatingObjToggle] = useState(true);
  const [depthStackToggle, setDepthStackToggle] = useState(true);

  const toggleChip = (id) => {
    setSelectedChips((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] transition-colors duration-200">
      {/* ── TOP STICKY BAR ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[var(--surface-glass)] backdrop-blur-md border-b border-[var(--border)] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-[var(--shadow-xs)]">
        <div className="flex items-center gap-3">
          <Logo size="sm" showTagline={true} tagline="Editorial Design System" />
        </div>

        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--safe-bg)] text-[var(--safe-ink)] border border-[var(--safe-fg)]">
            <Check className="w-3.5 h-3.5" /> WCAG AA 116/116 Passed
          </span>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="ps-btn ps-btn-secondary !min-h-[38px] !px-3 !py-1 text-xs gap-1.5"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-[var(--caution-fg)]" /> : <Moon className="w-4 h-4 text-[var(--ink-2)]" />}
            <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ───────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-14">
        {/* Intro Hero Card */}
        <Card variant="paper" size="section" cornerFold className="relative overflow-hidden">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--accent-600)] bg-[var(--accent-100)] px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5" /> Ivory Editorial Architecture
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold font-[var(--font-heading)] text-[var(--ink)] tracking-tight">
              Surfaces, Building Blocks & Badges
            </h2>
            <p className="text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
              The PolySafe surface system establishes visual depth through warm ivory cards, framer-motion layout
              animations, Fraunces serif headings, calm status dots, and tactile controls.
            </p>
          </div>
        </Card>

        {/* ── 1. SURFACE SYSTEM & CARD VARIANTS ──────────────────── */}
        <section id="surfaces" className="space-y-6">
          <SectionHeader
            number="01 /"
            kicker="Surfaces & Containers"
            title="Card Variants & Physical Frames"
            description="Paper, raised, outlined, inset, status, interactive, and 14px folded-corner gradient frames."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Paper Card */}
            <Card variant="paper" cornerFold>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-600)] font-mono">
                    Variant: paper
                  </span>
                  <span className="text-[11px] font-mono text-[var(--ink-3)]">corner-fold</span>
                </div>
                <h4 className="text-base font-bold font-[var(--font-heading)] text-[var(--ink)]">
                  Feature & Passport Hero
                </h4>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  --paper background, warm ink paper shadow, hairline border, and authentic 14px folded corner.
                </p>
              </div>
            </Card>

            {/* Raised Card */}
            <Card variant="raised">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-600)] font-mono">
                  Variant: raised
                </span>
                <h4 className="text-base font-bold font-[var(--font-heading)] text-[var(--ink)]">
                  Standard Clinical Surface
                </h4>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  --surface fill with shadow-sm. On hover, gently lifts 2px with shadow-md and border-strong.
                </p>
              </div>
            </Card>

            {/* Inset Card */}
            <Card variant="inset">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] font-mono">
                  Variant: inset
                </span>
                <h4 className="text-base font-bold font-[var(--font-heading)] text-[var(--ink)]">
                  Stat Well & Inset Matrix
                </h4>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  --surface-2 background with subtle inner shadow, ideal for embedded telemetry and stat tiles.
                </p>
              </div>
            </Card>

            {/* Status Card: Safe */}
            <Card variant="status" status="safe">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <StatusPill status="safe" size="sm" />
                  <span className="text-xs font-bold text-[var(--safe-ink)]">Normal Profile</span>
                </div>
                <h4 className="text-base font-bold font-[var(--font-heading)] text-[var(--ink)]">
                  Safe Regimen Status
                </h4>
                <p className="text-xs text-[var(--ink-2)]">
                  Left 4px emerald accent bar highlighting verified safe prescribing parameters.
                </p>
              </div>
            </Card>

            {/* Status Card: Caution */}
            <Card variant="status" status="caution">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <StatusPill status="caution" size="sm" />
                  <span className="text-xs font-bold text-[var(--caution-ink)]">Drug-Herb Alert</span>
                </div>
                <h4 className="text-base font-bold font-[var(--font-heading)] text-[var(--ink)]">
                  Caution Flagged
                </h4>
                <p className="text-xs text-[var(--ink-2)]">
                  Left 4px amber-gold accent bar denoting potential pharmacokinetic conflict.
                </p>
              </div>
            </Card>

            {/* Status Card: Critical */}
            <Card variant="status" status="critical">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <StatusPill status="critical" size="sm" />
                  <span className="text-xs font-bold text-[var(--critical-ink)]">Severe DDInter</span>
                </div>
                <h4 className="text-base font-bold font-[var(--font-heading)] text-[var(--ink)]">
                  Critical Warning
                </h4>
                <p className="text-xs text-[var(--ink-2)]">
                  Left 4px vermilion accent bar warning of high-risk drug interaction.
                </p>
              </div>
            </Card>

            {/* Outlined Card */}
            <Card variant="outlined">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] font-mono">
                  Variant: outlined
                </span>
                <h4 className="text-base font-bold font-[var(--font-heading)] text-[var(--ink)]">
                  Transparent Outlined Frame
                </h4>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  Transparent fill with 1px border. Lightweight for secondary details or metadata rosters.
                </p>
              </div>
            </Card>

            {/* Interactive Card */}
            <Card variant="interactive" onClick={() => alert('Interactive card clicked!')}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-600)] font-mono">
                    Variant: interactive
                  </span>
                  <ArrowRight className="w-4 h-4 text-[var(--brand-600)]" />
                </div>
                <h4 className="text-base font-bold font-[var(--font-heading)] text-[var(--ink)]">
                  Clickable Action Card
                </h4>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  Keyboard accessible, active press scale, focus ring, and hover lift ready for tilt hooks.
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* ── 2. EDITORIAL BUILDING BLOCKS ───────────────────────── */}
        <section id="building-blocks" className="space-y-6">
          <SectionHeader
            number="02 /"
            kicker="Editorial System"
            title="Typography & Building Blocks"
            description="SectionHeader, PullQuote, StatTile, Divider, and KeyValueList components."
          />

          {/* Stat Tiles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile
              label="Active Medications"
              value={5}
              delta="0"
              deltaType="neutral"
              deltaLabel="Stable regimen"
              sparklineData={[5, 5, 4, 5, 5, 5, 5]}
              icon={<Pill className="w-4 h-4" />}
            />
            <StatTile
              label="Interaction Risk Score"
              value="18"
              suffix="/100"
              delta="-12%"
              deltaType="positive"
              deltaLabel="Decreased risk after de-prescribing"
              sparklineData={[34, 30, 28, 25, 22, 20, 18]}
              icon={<Shield className="w-4 h-4" />}
            />
            <StatTile
              label="Anticholinergic Burden"
              value="1.0"
              suffix="ACB"
              delta="+0.5"
              deltaType="negative"
              deltaLabel="Elevated cognitive burden"
              sparklineData={[0, 0.5, 0.5, 1.0, 1.0]}
              icon={<Activity className="w-4 h-4" />}
            />
            <StatTile
              label="Adherence Rate"
              value="96"
              suffix="%"
              delta="+4%"
              deltaType="positive"
              sparklineData={[88, 90, 91, 92, 94, 95, 96]}
              icon={<Calendar className="w-4 h-4" />}
            />
          </div>

          {/* PullQuote Component */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-xs)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-3)] block mb-1">
              PullQuote Component (Risk Story Highlight)
            </span>
            <PullQuote
              quote="Patient concurrently prescribed Warfarin (anticoagulant) and Aspirin (antiplatelet). While clinically intentional for high-risk stroke prophylaxis, the cumulative bleeding probability necessitates weekly INR tracking and omeprazole gastroprotection."
              attribution="Clinical Pharmacology Diagnostic Engine"
              source="DDInter Rule #7842"
            />
          </div>

          {/* KeyValueList & Dividers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="raised">
              <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)] mb-3">
                KeyValueList Component
              </h4>
              <KeyValueList
                items={[
                  { key: 'patient-id', label: 'Patient Clinical ID', value: 'PS-IND-884920', mono: true, copyable: true },
                  { key: 'blood-type', label: 'Blood Group', value: 'B+ Positive' },
                  { key: 'primary-condition', label: 'Primary Diagnosis', value: 'Atrial Fibrillation' },
                  { key: 'attending-dr', label: 'Consulting Physician', value: 'Dr. Sarah Wilson, MD' },
                  { key: 'last-sync', label: 'Telemetry Sync', value: '14 mins ago' },
                ]}
              />
            </Card>

            <Card variant="raised" className="space-y-4">
              <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)]">
                Divider Component Variants
              </h4>
              <p className="text-xs text-[var(--ink-3)]">
                Hairline rule with centered small-caps label, solid or dashed.
              </p>
              <Divider label="Prescribed Regimen" />
              <div className="p-3 rounded-lg bg-[var(--surface-2)] text-xs text-[var(--ink-2)]">
                Oral solid dosage medications active in current 24-hour cycle.
              </div>
              <Divider dashed label="Optional Herbals & OTC" />
              <div className="p-3 rounded-lg bg-[var(--surface-2)] text-xs text-[var(--ink-2)]">
                Herbal supplements and self-administered OTC remedies.
              </div>
            </Card>
          </div>
        </section>

        {/* ── 3. BADGES & CALM STATUS DOTS ───────────────────────── */}
        <section id="badges" className="space-y-6">
          <SectionHeader
            number="03 /"
            kicker="Clinical Classification"
            title="Badges, Personas & Calm Status Dots"
            description="StatusPill (icon + word + color), DrugHarmBadge L1..L5, RoleBadge personas, TypeChip, and Calm StatusDot."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* StatusPills */}
            <Card variant="raised" className="space-y-3">
              <div>
                <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)]">
                  StatusPill (Icon + Word + Color)
                </h4>
                <p className="text-xs text-[var(--ink-3)]">
                  WCAG requirement: status never communicated by color alone.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <StatusPill status="safe" />
                <StatusPill status="caution" />
                <StatusPill status="critical" />
                <StatusPill status="unknown" />
              </div>

              <div className="pt-2 border-t border-[var(--border)]">
                <span className="text-xs font-semibold text-[var(--ink-3)] block mb-1.5">Size Variants</span>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status="safe" size="sm" />
                  <StatusPill status="safe" size="md" />
                  <StatusPill status="safe" size="lg" />
                </div>
              </div>
            </Card>

            {/* DrugHarmBadges L1-L5 */}
            <Card variant="raised" className="space-y-3">
              <div>
                <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)]">
                  DrugHarmBadge (L1 through L5)
                </h4>
                <p className="text-xs text-[var(--ink-3)]">
                  Numbered tier tokens with high-contrast text and descriptive tooltips.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <DrugHarmBadge level="L1" showLabel />
                <DrugHarmBadge level="L2" showLabel />
                <DrugHarmBadge level="L3" showLabel />
                <DrugHarmBadge level="L4" showLabel />
                <DrugHarmBadge level="L5" showLabel />
              </div>

              <div className="pt-2 border-t border-[var(--border)]">
                <span className="text-xs font-semibold text-[var(--ink-3)] block mb-1.5">Compact Numbered Badges</span>
                <div className="flex items-center gap-2">
                  <DrugHarmBadge level="L1" />
                  <DrugHarmBadge level="L2" />
                  <DrugHarmBadge level="L3" />
                  <DrugHarmBadge level="L4" />
                  <DrugHarmBadge level="L5" />
                </div>
              </div>
            </Card>

            {/* RoleBadges & TypeChips */}
            <Card variant="raised" className="space-y-3">
              <div>
                <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)]">
                  RoleBadge & TypeChip
                </h4>
                <p className="text-xs text-[var(--ink-3)]">
                  Personas and medication regulatory category chips.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-[var(--ink-3)] block">Role Personas</span>
                <div className="flex flex-wrap gap-2">
                  <RoleBadge role="patient" />
                  <RoleBadge role="doctor" />
                  <RoleBadge role="caregiver" />
                  <RoleBadge role="guest" />
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border)] space-y-2">
                <span className="text-xs font-semibold text-[var(--ink-3)] block">Medication Types</span>
                <div className="flex flex-wrap gap-2">
                  <TypeChip type="rx" />
                  <TypeChip type="otc" />
                  <TypeChip type="herbal" />
                </div>
              </div>
            </Card>

            {/* Calm StatusDot Demonstration */}
            <Card variant="raised" className="space-y-3 md:col-span-2 lg:col-span-3">
              <div>
                <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)]">
                  Calm StatusDot (No Glow, Subtle 2s Pulse Only For Critical)
                </h4>
                <p className="text-xs text-[var(--ink-3)]">
                  Replaces distracting glow LEDs with calm, clinical precision dots. Reduced-motion safe.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6 p-4 rounded-xl bg-[var(--surface-2)]">
                <div className="flex items-center gap-2">
                  <StatusDot status="safe" size="md" />
                  <span className="text-xs font-semibold text-[var(--ink-2)]">Safe (Solid emerald)</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusDot status="caution" size="md" />
                  <span className="text-xs font-semibold text-[var(--ink-2)]">Caution (Solid amber)</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusDot status="critical" size="md" />
                  <span className="text-xs font-semibold text-[var(--ink-2)]">Critical (Calm 2s pulse)</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusDot status="online" size="md" />
                  <span className="text-xs font-semibold text-[var(--ink-2)]">Online (Solid green)</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusDot status="unknown" size="md" />
                  <span className="text-xs font-semibold text-[var(--ink-2)]">Unknown (Solid grey)</span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* ── 4. BUTTONS & CONTROLS ───────────────────────────────── */}
        <section id="buttons" className="space-y-6">
          <SectionHeader
            number="04 /"
            kicker="Interactive Actions"
            title="Buttons & Call-to-Actions"
            description="Pill shaped, subtle top-light inner highlights, trailing arrow hover nudges, coral Accent CTA, and animated pill loader glyphs."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary & Accent CTA */}
            <Card variant="raised" className="space-y-4">
              <div>
                <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)]">
                  Primary & Accent CTA
                </h4>
                <p className="text-xs text-[var(--ink-3)]">
                  Primary uses --brand-600 with white text. Accent CTA uses coral --accent-500 with INK text (--on-accent), max 1 per screen.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" showArrow>
                  Primary Action
                </Button>
                <Button variant="accent" icon={<Plus className="w-4 h-4" />}>
                  Add Medicine
                </Button>
                <Button variant="primary" loading>
                  Analyzing
                </Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
              </div>

              <div className="pt-2 border-t border-[var(--border)]">
                <span className="text-xs font-semibold text-[var(--ink-3)] block mb-2">Accent CTA States (Ink text on coral)</span>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="accent" size="sm">Small Accent</Button>
                  <Button variant="accent" size="md">Medium Accent</Button>
                  <Button variant="accent" size="lg">Large Accent</Button>
                  <Button variant="accent" loading>Saving</Button>
                </div>
              </div>
            </Card>

            {/* Secondary, Ghost & Danger */}
            <Card variant="raised" className="space-y-4">
              <div>
                <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)]">
                  Secondary, Ghost & Danger
                </h4>
                <p className="text-xs text-[var(--ink-3)]">
                  Secondary tints to --brand-50. Danger uses vermilion or outlined critical-ink.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="danger" icon={<Trash2 className="w-4 h-4" />}>
                  Delete
                </Button>
                <Button variant="danger-outline">
                  Cancel Outlined
                </Button>
                <Button variant="success" icon={<Check className="w-4 h-4" />}>
                  Confirmed
                </Button>
              </div>

              <div className="pt-2 border-t border-[var(--border)]">
                <span className="text-xs font-semibold text-[var(--ink-3)] block mb-2">Button Sizes & Full Width</span>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Button size="sm">Small (36px/44px)</Button>
                    <Button size="md">Medium (44px)</Button>
                    <Button size="lg">Large (52px)</Button>
                  </div>
                  <Button variant="primary" fullWidth showArrow>
                    Full Width Button Variant
                  </Button>
                </div>
              </div>
            </Card>

            {/* Icon Buttons */}
            <Card variant="raised" className="space-y-4 md:col-span-2">
              <div>
                <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)]">
                  Accessible Icon Buttons (Minimum 44px Touch Targets)
                </h4>
                <p className="text-xs text-[var(--ink-3)]">
                  Required aria-label, 44px min touch target on all sizes, animated pill glyph on loading.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <IconButton icon={<Search className="w-5 h-5" />} label="Search medication" variant="secondary" size="md" />
                <IconButton icon={<Bell className="w-5 h-5" />} label="Notifications" variant="ghost" size="md" />
                <IconButton icon={<Plus className="w-5 h-5" />} label="Quick add" variant="primary" size="md" />
                <IconButton icon={<Shield className="w-5 h-5" />} label="Safety shield" variant="accent" size="md" />
                <IconButton icon={<Trash2 className="w-5 h-5" />} label="Delete item" variant="danger" size="md" />
                <IconButton icon={<Check className="w-5 h-5" />} label="Loading action" variant="primary" size="md" loading />
                <IconButton icon={<Mail className="w-5 h-5" />} label="Disabled action" variant="secondary" size="md" disabled />
              </div>
            </Card>
          </div>
        </section>

        {/* ── 5. FORM INPUTS & SELECTS ───────────────────────────── */}
        <section id="inputs" className="space-y-6">
          <SectionHeader
            number="05 /"
            kicker="Input Controls"
            title="Form Inputs, Selects & Textareas"
            description="Surface-2 fill, 1px border, 14px radius, floating labels, coral focus underline bar, and JetBrains Mono."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card variant="raised" className="space-y-4">
              <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)]">
                Floating Label & Coral Underline
              </h4>
              <Input
                label="Patient Full Name"
                placeholder="e.g. Ramesh Patel"
                value={interactiveInputVal}
                onChange={(e) => setInteractiveInputVal(e.target.value)}
                hint="As printed on government healthcare ID"
              />
            </Card>

            <Card variant="raised" className="space-y-4">
              <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)]">
                Icon Integration & Floating Label
              </h4>
              <Input
                label="Search Drug Database"
                placeholder="Search by brand or generic..."
                leftIcon={<Search className="w-4 h-4" />}
                hint="Over 12,000 verified Indian drug formulations"
              />
            </Card>

            <Card variant="raised" className="space-y-4">
              <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)]">
                Numeric & Dose (JetBrains Mono)
              </h4>
              <Input
                label="Prescription Dosage (mg)"
                type="number"
                numeric
                value={doseVal}
                onChange={(e) => setDoseVal(e.target.value)}
                hint="Dose calibrated per single tablet"
              />
            </Card>

            <Card variant="raised" className="space-y-4">
              <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)]">
                Inline Error State
              </h4>
              <Input
                label="Email Address"
                defaultValue="invalid-email-format"
                error="Please enter a valid clinical contact email address"
                leftIcon={<Mail className="w-4 h-4" />}
              />
            </Card>

            <Card variant="raised" className="space-y-4">
              <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)]">
                Success Verification State
              </h4>
              <Input
                label="Government ABHA ID"
                defaultValue="91-4829-1029-3841"
                success="ABHA Healthcare ID verified against national registry"
                numeric
              />
            </Card>

            <Card variant="raised" className="space-y-4">
              <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)]">
                Disabled State
              </h4>
              <Input
                label="Prescription ID (Locked)"
                defaultValue="RX-2026-MUM-9842"
                disabled
                hint="Read-only clinical identifier"
              />
            </Card>

            <Card variant="raised" className="space-y-4">
              <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)]">
                Custom Select Dropdown
              </h4>
              <Select label="Dosing Frequency" defaultValue="bid">
                <option value="od">Once Daily (OD) - Morning</option>
                <option value="bid">Twice Daily (BID) - Morning & Evening</option>
                <option value="tid">Three Times Daily (TID)</option>
                <option value="prn">As Needed (SOS / PRN)</option>
              </Select>
            </Card>

            <Card variant="raised" className="space-y-4 md:col-span-2">
              <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)]">
                Clinical Notes Textarea
              </h4>
              <Textarea
                label="Physician Instructions / Food Precautions"
                rows={3}
                placeholder="e.g. Take 30 minutes before breakfast with full glass of water. Avoid grapefruit juice..."
                hint="Visible to both patient and caregiver"
              />
            </Card>
          </div>
        </section>

        {/* ── 6. SEGMENTED CONTROLS & TABS ───────────────────────── */}
        <section id="segmented-and-tabs" className="space-y-6">
          <SectionHeader
            number="06 /"
            kicker="Navigation"
            title="Segmented Controls & Tabs"
            description="Sliding indicator with framer-motion layout animation in ivory-paper (--paper) with a soft shadow."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="raised" className="space-y-5">
              <div>
                <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)]">
                  Segmented Control (Sliding Ivory-Paper Indicator)
                </h4>
                <p className="text-xs text-[var(--ink-3)]">
                  Click between options to experience the spring sliding indicator.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-[var(--ink-3)] block mb-1.5">Schedule Frequency</span>
                  <SegmentedControl
                    name="schedule"
                    value={segmentedVal}
                    onChange={setSegmentedVal}
                    options={[
                      { value: 'daily', label: 'Daily', icon: <Clock className="w-3.5 h-3.5" /> },
                      { value: 'weekly', label: 'Weekly', icon: <Calendar className="w-3.5 h-3.5" /> },
                      { value: 'timeline', label: 'Timeline', icon: <Sliders className="w-3.5 h-3.5" /> },
                    ]}
                  />
                </div>

                <div>
                  <span className="text-xs font-semibold text-[var(--ink-3)] block mb-1.5">Risk Severity (Full Width)</span>
                  <SegmentedControl
                    name="risk-filter"
                    value={filterSegmentVal}
                    onChange={setFilterSegmentVal}
                    fullWidth
                    options={[
                      { value: 'all', label: 'All' },
                      { value: 'safe', label: 'Safe' },
                      { value: 'caution', label: 'Caution' },
                      { value: 'critical', label: 'Critical' },
                    ]}
                  />
                </div>
              </div>
            </Card>

            <Card variant="raised" className="space-y-5">
              <div>
                <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)]">
                  Interactive Tabs with Panels
                </h4>
                <p className="text-xs text-[var(--ink-3)]">
                  Sliding indicator pill with synchronized accessible panels.
                </p>
              </div>

              <Tabs
                value={tabVal}
                onChange={setTabVal}
                tabs={[
                  {
                    id: 'medications',
                    label: 'Medications',
                    icon: <Pill className="w-3.5 h-3.5" />,
                    content: (
                      <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm space-y-1">
                        <span className="font-bold text-[var(--ink)]">Active Regimen (5 Drugs)</span>
                        <p className="text-xs text-[var(--ink-3)]">
                          Metformin 500mg, Atorvastatin 20mg, Amlodipine 5mg, Aspirin 75mg, Pantoprazole 40mg.
                        </p>
                      </div>
                    ),
                  },
                  {
                    id: 'interactions',
                    label: 'Interactions',
                    icon: <Shield className="w-3.5 h-3.5" />,
                    content: (
                      <div className="p-4 rounded-xl bg-[var(--caution-bg)] border border-[var(--caution-fg)] text-sm space-y-1">
                        <span className="font-bold text-[var(--caution-ink)]">1 Moderate Risk Detected</span>
                        <p className="text-xs text-[var(--caution-ink)]">
                          Aspirin + Amlodipine: potential reduced antihypertensive efficacy; blood pressure monitoring recommended.
                        </p>
                      </div>
                    ),
                  },
                  {
                    id: 'timeline',
                    label: 'Dosing Timeline',
                    icon: <Clock className="w-3.5 h-3.5" />,
                    content: (
                      <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm space-y-1">
                        <span className="font-bold text-[var(--ink)]">Next Dose in 2 Hours</span>
                        <p className="text-xs text-[var(--ink-3)]">
                          Metformin 500mg with evening dinner.
                        </p>
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          </div>
        </section>

        {/* ── 7. CHIPS & TOGGLES ──────────────────────────────────── */}
        <section id="chips-and-toggles" className="space-y-6">
          <SectionHeader
            number="07 /"
            kicker="Form Selectors"
            title="Chips & Toggle Switches"
            description="Selected chip is brand-100 with a Check icon. Toggles have minimum 44px touch targets and ivory-paper knobs."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="raised" className="space-y-4">
              <div>
                <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)]">
                  Selectable Chips (Filter & Tags)
                </h4>
                <p className="text-xs text-[var(--ink-3)]">
                  Selected state applies --brand-100 fill, --brand-700 text, and prepends a Check icon.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {[
                  { id: 'morning', label: 'Morning (08:00)' },
                  { id: 'afternoon', label: 'Afternoon (13:00)' },
                  { id: 'dinner', label: 'Dinner (20:00)' },
                  { id: 'bedtime', label: 'Bedtime (22:00)' },
                  { id: 'prn', label: 'SOS / As Needed' },
                ].map((chip) => (
                  <Chip
                    key={chip.id}
                    selected={selectedChips.includes(chip.id)}
                    onClick={() => toggleChip(chip.id)}
                  >
                    {chip.label}
                  </Chip>
                ))}
              </div>

              <div className="pt-2 border-t border-[var(--border)] space-y-2">
                <span className="text-xs font-semibold text-[var(--ink-3)] block">Removable & Disabled Chips</span>
                <div className="flex flex-wrap gap-2.5">
                  <Chip removable onRemove={() => alert('Chip removed')}>
                    Metformin 500mg
                  </Chip>
                  <Chip removable onRemove={() => alert('Chip removed')} selected>
                    Atorvastatin 20mg
                  </Chip>
                  <Chip disabled>
                    Locked Drug
                  </Chip>
                </div>
              </div>
            </Card>

            <Card variant="raised" className="space-y-5">
              <div>
                <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)]">
                  Tactile Toggle Switches
                </h4>
                <p className="text-xs text-[var(--ink-3)]">
                  Ivory-paper knob, smooth 120ms ease-out glide, and guaranteed 44px touch targets.
                </p>
              </div>

              <div className="space-y-4">
                <Toggle
                  checked={toggle1}
                  onChange={setToggle1}
                  label="Daily WhatsApp Adherence Reminders"
                  description="Receive gentle alerts 15 minutes before scheduled dose time"
                />

                <Toggle
                  checked={toggle2}
                  onChange={setToggle2}
                  label="High-Contrast Visual Assist"
                  description="Boosts stroke weights and boundaries for high-visibility clinical viewing"
                />

                <Toggle
                  checked={toggle3}
                  onChange={setToggle3}
                  variant="accent"
                  label="Emergency Caregiver SOS Broadcast"
                  description="Accent coral toggle for high-priority notification channel"
                />

                <Toggle
                  checked={false}
                  disabled
                  label="Biometric Prescription Lock (Disabled on Guest)"
                  description="Requires authenticated doctor fingerprint or PIN"
                />
              </div>
            </Card>
          </div>
        </section>

        {/* ── 8. MOTION LAYER & VISUAL EFFECTS ───────────────────── */}
        <section id="motion-layer" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <SectionHeader
              number="08 /"
              kicker="Animation & Visual Effects"
              title="Motion Primitives & CSS Effects"
              description="Framer Motion layer with global reduced-motion guard (100ms opacity fades), 260ms ease-emph transitions, 60ms stagger, 700ms SVG line draws, count-ups, magnetic hover, and paper-stack depths."
            />
            <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                prefersReduced
                  ? 'bg-[var(--caution-bg)] text-[var(--caution-ink)] border-[var(--caution-fg)]'
                  : 'bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-100)]'
              }`}>
                <Activity className="w-3.5 h-3.5" />
                {prefersReduced ? 'Reduced Motion Active' : 'Spring Curves Active'}
              </span>
            </div>
          </div>

          {/* Subgrid A: Stagger & CountUp & DrawLine */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stagger Container (60ms) */}
            <Card variant="raised" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)]">
                    Stagger Container (60ms Stagger Interval)
                  </h4>
                  <p className="text-xs text-[var(--ink-3)]">
                    Child items enter sequentially with a 60ms stagger delay. Lists &gt; 20 items auto-disable layout shifts to prevent reflow.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStaggerKey((k) => k + 1)}
                  className="ps-btn ps-btn-secondary !min-h-[36px] !px-2.5 !py-1 text-xs gap-1.5 cursor-pointer"
                  title="Replay 60ms Stagger Animation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Replay</span>
                </button>
              </div>

              <StaggerContainer key={staggerKey} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StaggerItem>
                  <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--canvas)] border border-[var(--border)] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-600)]">Step 01</span>
                    <p className="text-xs font-bold text-[var(--ink)]">Rx Ingestion</p>
                    <p className="text-[11px] text-[var(--ink-3)]">OCR & Voice parsed</p>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--canvas)] border border-[var(--border)] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-600)]">Step 02</span>
                    <p className="text-xs font-bold text-[var(--ink)]">Cross-Match</p>
                    <p className="text-[11px] text-[var(--ink-3)]">222K DDInter pairs</p>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--canvas)] border border-[var(--border)] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--safe-600)]">Step 03</span>
                    <p className="text-xs font-bold text-[var(--ink)]">Safe Dosage</p>
                    <p className="text-[11px] text-[var(--ink-3)]">Beers 2024 verified</p>
                  </div>
                </StaggerItem>
              </StaggerContainer>
            </Card>

            {/* CountUp Numerals & DrawLine SVG */}
            <Card variant="raised" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)]">
                    Numeral CountUp &amp; DrawLine SVG (700ms)
                  </h4>
                  <p className="text-xs text-[var(--ink-3)]">
                    Numerals count up with cubic ease-out using tabular font. SVG rings &amp; bars stroke-draw over 700ms.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCountUpKey((k) => k + 1)}
                  className="ps-btn ps-btn-secondary !min-h-[36px] !px-2.5 !py-1 text-xs gap-1.5 cursor-pointer"
                  title="Replay CountUp and DrawLine"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Count</span>
                </button>
              </div>

              <div key={countUpKey} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="flex items-center justify-center p-3 rounded-[var(--radius-md)] bg-[var(--canvas)] border border-[var(--border)]">
                  <RiskRing score={3.8} size={110} label="Moderate" />
                </div>
                <div className="space-y-3 p-3 rounded-[var(--radius-md)] bg-[var(--canvas)] border border-[var(--border)]">
                  <ACBMeter value={2} />
                  <div className="pt-2 border-t border-[var(--border)] flex justify-between items-baseline">
                    <span className="text-xs text-[var(--ink-3)] font-medium">Interactions Scanned:</span>
                    <span className="text-base font-bold text-[var(--ink)]">
                      <CountUp value={222140} duration={0.8} />
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Subgrid B: Magnetic, Pressable, HoverLift & Shimmer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Magnetic Button */}
            <Card variant="raised" className="space-y-3">
              <div>
                <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)] flex items-center gap-1.5">
                  <MousePointer className="w-4 h-4 text-[var(--brand-600)]" /> Magnetic Pill Button
                </h4>
                <p className="text-xs text-[var(--ink-3)]">
                  Attracts toward cursor on hover up to max 6px displacement (desktop only).
                </p>
              </div>

              <div className="p-4 rounded-[var(--radius-md)] bg-[var(--canvas)] flex items-center justify-center min-h-[90px]">
                <Magnetic maxOffset={6}>
                  <Button variant="primary" showArrow>
                    Magnetic Action
                  </Button>
                </Magnetic>
              </div>
            </Card>

            {/* Pressable & HoverLift */}
            <Card variant="raised" className="space-y-3">
              <div>
                <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)]">
                  Pressable &amp; HoverLift
                </h4>
                <p className="text-xs text-[var(--ink-3)]">
                  Tactile scale(0.98) on click and gentle -2px elevation on hover.
                </p>
              </div>

              <div className="p-4 rounded-[var(--radius-md)] bg-[var(--canvas)] flex items-center justify-center gap-3 min-h-[90px]">
                <Pressable>
                  <div className="px-3.5 py-2 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-bold text-[var(--ink)] shadow-xs cursor-pointer">
                    Pressable (.98)
                  </div>
                </Pressable>

                <HoverLift>
                  <div className="px-3.5 py-2 rounded-full bg-[var(--accent-500)] text-[var(--on-accent)] text-xs font-bold shadow-xs cursor-pointer">
                    HoverLift (-2px)
                  </div>
                </HoverLift>
              </div>
            </Card>

            {/* Ivory Shimmer Skeleton */}
            <Card variant="raised" className="space-y-3">
              <div>
                <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)]">
                  Ivory Shimmer Skeleton
                </h4>
                <p className="text-xs text-[var(--ink-3)]">
                  Warm ivory tones gradient sweep (--surface-2 to --paper).
                </p>
              </div>

              <div className="p-4 rounded-[var(--radius-md)] bg-[var(--canvas)] space-y-2.5 min-h-[90px]">
                <div className="flex items-center gap-2.5">
                  <Shimmer width="36px" height="36px" rounded="rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Shimmer height="12px" width="60%" />
                    <Shimmer height="10px" width="40%" />
                  </div>
                </div>
                <Shimmer height="14px" width="100%" />
              </div>
            </Card>
          </div>

          {/* Subgrid C: Visual Effects Utilities (.glass, .spotlight, .paper-stack, .halo, .sheen) */}
          <div className="space-y-3">
            <h4 className="text-base font-bold font-[var(--font-heading)] text-[var(--ink)]">
              CSS Visual Effects Utilities
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* .glass */}
              <div className="glass p-4 rounded-[var(--radius-lg)] space-y-2">
                <span className="font-mono text-xs font-bold text-[var(--brand-700)] bg-[var(--brand-50)] px-2 py-0.5 rounded">
                  .glass
                </span>
                <p className="text-xs font-bold text-[var(--ink)]">Surface Glass</p>
                <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
                  var(--surface-glass) with 14px backdrop blur and hairline border.
                </p>
              </div>

              {/* .spotlight */}
              <Spotlight className="p-4 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-2 cursor-crosshair">
                <span className="font-mono text-xs font-bold text-[var(--accent-600)] bg-[var(--accent-100)] px-2 py-0.5 rounded">
                  .spotlight
                </span>
                <p className="text-xs font-bold text-[var(--ink)]">Hero Spotlight</p>
                <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
                  Subtle coral radial glow tracking pointer on hero areas (desktop fine-pointer).
                </p>
              </Spotlight>

              {/* .paper-stack */}
              <div className="p-2">
                <div className="paper-stack p-4 rounded-[var(--radius-lg)] bg-[var(--paper)] border border-[var(--border)] shadow-xs space-y-2">
                  <span className="font-mono text-xs font-bold text-[var(--ink-2)] bg-[var(--canvas-2)] px-2 py-0.5 rounded">
                    .paper-stack
                  </span>
                  <p className="text-xs font-bold text-[var(--ink)]">Layered Stack</p>
                  <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
                    Two pseudo-element sheets rotated 2deg &amp; -1.5deg with shadows.
                  </p>
                </div>
              </div>

              {/* .halo */}
              <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-2">
                <span className="font-mono text-xs font-bold text-[var(--brand-600)] bg-[var(--brand-50)] px-2 py-0.5 rounded">
                  .halo
                </span>
                <div className="flex items-center gap-2 pt-1">
                  <div className="halo w-8 h-8 rounded-full bg-[var(--brand-600)] text-white flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-[var(--ink)]">Icon Halo</span>
                </div>
                <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
                  Soft brand-100 ring behind key security &amp; clinical icons.
                </p>
              </div>

              {/* .sheen */}
              <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--safe-600)] bg-[var(--safe-bg)] px-2 py-0.5 rounded">
                    .sheen
                  </span>
                  <button
                    type="button"
                    onClick={() => setSheenKey((k) => k + 1)}
                    className="text-[11px] text-[var(--brand-600)] hover:underline cursor-pointer font-bold"
                  >
                    Sweep
                  </button>
                </div>
                <div key={sheenKey} className="sheen p-2.5 rounded bg-[var(--surface-2)]">
                  <p className="text-xs font-bold text-[var(--ink)]">Light Sweep</p>
                  <p className="text-[11px] text-[var(--ink-3)]">
                    One-time light sweep across card on view.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 9. CSS 3D LAYER (PHYSICAL DEPTH & OBJECTS) ───────────── */}
        <section id="three-d-layer" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <SectionHeader
              number="09 /"
              kicker="CSS 3D & Physical Depth"
              title="3D Layer: Tilt, Flip, Floating Objects & Depth Stack"
              description="Pure CSS perspective, preserve-3d, and layered vector objects. Centrally controlled via html 3d-enabled attribute, auto-disabled in reduced-motion and low-power devices."
            />
            {/* Master 3D Enablement Switch */}
            <div className="flex items-center gap-3 p-2.5 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--border)] shadow-xs self-start sm:self-auto flex-shrink-0">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-[var(--brand-600)]" />
                <span className="text-xs font-bold font-[var(--font-heading)] text-[var(--ink)]">
                  3D Engine:
                </span>
              </div>
              <Toggle
                checked={is3DEnabled}
                onChange={toggle3DEnabled}
                size="sm"
                label="Master 3D Toggle"
                hideLabel={true}
              />
            </div>
          </div>

          {/* Diagnostic System Telemetry Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
              <span className="text-[var(--ink-3)] font-medium">Hardware Concurrency:</span>
              <span className="font-mono font-bold text-[var(--ink)]">
                {typeof navigator !== 'undefined' ? `${navigator.hardwareConcurrency || 4} cores` : '4 cores'}
              </span>
            </div>
            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
              <span className="text-[var(--ink-3)] font-medium">Reduced Motion:</span>
              <span className={`font-mono font-bold ${prefersReduced ? 'text-[var(--caution-ink)]' : 'text-[var(--safe-ink)]'}`}>
                {prefersReduced ? 'ACTIVE (3D Off)' : 'OFF (3D Allowed)'}
              </span>
            </div>
            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
              <span className="text-[var(--ink-3)] font-medium">HTML [3d-enabled]:</span>
              <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                is3DEnabled && !prefersReduced
                  ? 'bg-[var(--safe-bg)] text-[var(--safe-ink)]'
                  : 'bg-[var(--caution-bg)] text-[var(--caution-ink)]'
              }`}>
                {is3DEnabled && !prefersReduced ? 'true' : 'false'}
              </span>
            </div>
          </div>

          {/* 3D Showcase Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. useTilt & TiltCard with Parallax Depth Layers */}
            <Card variant="raised" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)] flex items-center gap-2">
                    <Box className="w-4 h-4 text-[var(--brand-600)]" />
                    TiltCard with Parallax Depth Layers
                  </h4>
                  <p className="text-xs text-[var(--ink-3)]">
                    Pointer-driven perspective 1000px tilt, spring smoothing, glare reflection, and translateZ(20px/40px) layers.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[11px] font-bold text-[var(--ink-3)]">Tilt:</span>
                  <Toggle
                    checked={tiltCardToggle}
                    onChange={setTiltCardToggle}
                    size="sm"
                    label="Toggle Tilt Effect"
                    hideLabel={true}
                  />
                </div>
              </div>

              <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--canvas)] flex items-center justify-center min-h-[220px]">
                <TiltCard
                  max={tiltCardToggle && is3DEnabled && !prefersReduced ? 7 : 0}
                  glare={tiltCardToggle && is3DEnabled && !prefersReduced}
                  scale={1.02}
                  className="w-full max-w-sm cursor-pointer"
                >
                  <div className="p-5 space-y-4">
                    {/* Depth Layer 40px: Icon with Soft Halo */}
                    <TiltCardLayer depth={tiltCardToggle && is3DEnabled ? 40 : 0} className="flex items-center justify-between">
                      <div className="halo w-10 h-10 rounded-full bg-[var(--brand-600)] text-white flex items-center justify-center shadow-md">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <StatusPill status="SAFE" label="Verified Regimen" size="sm" />
                    </TiltCardLayer>

                    {/* Depth Layer 20px: Title & Description */}
                    <TiltCardLayer depth={tiltCardToggle && is3DEnabled ? 20 : 0} className="space-y-1">
                      <h5 className="text-base font-bold font-[var(--font-heading)] text-[var(--ink)]">
                        Clinical Parallax Depth
                      </h5>
                      <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                        Notice how the security icon floats above the text card layer as your pointer moves across the surface.
                      </p>
                    </TiltCardLayer>

                    {/* Depth Layer 30px: Footer Meta */}
                    <TiltCardLayer depth={tiltCardToggle && is3DEnabled ? 30 : 0} className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--ink-3)] font-mono">
                      <span>perspective: 1000px</span>
                      <span>glare: specular</span>
                    </TiltCardLayer>
                  </div>
                </TiltCard>
              </div>
            </Card>

            {/* 2. FlipCard (Two-Sided Clinical Card) */}
            <Card variant="raised" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)] flex items-center gap-2">
                    <RotateCw className="w-4 h-4 text-[var(--brand-600)]" />
                    FlipCard (Paramedic Emergency Card)
                  </h4>
                  <p className="text-xs text-[var(--ink-3)]">
                    3D flip (rotateY 180deg, 600ms ease-emph), keyboard operable (Enter/Space), aria-pressed.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[11px] font-bold text-[var(--ink-3)]">Flip:</span>
                  <Toggle
                    checked={flipDemoFlipped}
                    onChange={setFlipDemoFlipped}
                    size="sm"
                    label="Toggle Flip Card"
                    hideLabel={true}
                  />
                </div>
              </div>

              <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--canvas)] flex items-center justify-center min-h-[220px]">
                <FlipCard
                  isFlipped={flipDemoFlipped}
                  onFlip={setFlipDemoFlipped}
                  className="w-full max-w-sm"
                  ariaLabel="Paramedic Emergency Medical Passport"
                  front={
                    <div className="p-5 rounded-[var(--radius-xl)] bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--critical-ink)] bg-[var(--critical-bg)] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-[var(--critical-fg)]" /> Emergency ID
                        </span>
                        <span className="text-xs font-mono font-bold text-[var(--ink-3)]">BLOOD: O+</span>
                      </div>
                      <div>
                        <h5 className="text-base font-bold font-[var(--font-heading)] text-[var(--ink)]">
                          Mrs. Kamla Devi Patel
                        </h5>
                        <p className="text-xs text-[var(--ink-2)]">Age 68 &bull; Atrial Fibrillation, Hypertension</p>
                      </div>
                      <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--surface-2)] text-[11px] text-[var(--ink-2)] space-y-1">
                        <span className="font-bold text-[var(--critical-ink)] block">Critical Flag:</span>
                        <span>High hemorrhage risk with Warfarin + Aspirin concurrent regimen.</span>
                      </div>
                    </div>
                  }
                  back={
                    <div className="p-5 rounded-[var(--radius-xl)] bg-[var(--paper)] border border-[var(--border)] shadow-sm space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-700)] bg-[var(--brand-50)] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-[var(--brand-600)]" /> Directives
                        </span>
                        <span className="text-xs font-mono font-bold text-[var(--ink-3)]">REF: #809148</span>
                      </div>
                      <div className="space-y-1.5 text-xs text-[var(--ink)]">
                        <p className="font-bold font-[var(--font-heading)]">Physician on Call:</p>
                        <p className="text-[var(--ink-2)]">Dr. Sarah Wilson (Cardiology) &bull; +91 98200 12345</p>
                      </div>
                      <div className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--canvas-2)] text-[11px] font-mono text-[var(--ink-3)] space-y-0.5">
                        <span className="font-bold block text-[var(--ink-2)]">Verification Hash:</span>
                        <span className="truncate block">0x4a7e8f...91bc22 (Tamper-evident)</span>
                      </div>
                    </div>
                  }
                />
              </div>
            </Card>

            {/* 3. Floating 3D Objects: FloatingCapsule & ShieldMark */}
            <Card variant="raised" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)] flex items-center gap-2">
                    <Box className="w-4 h-4 text-[var(--brand-600)]" />
                    Floating 3D Objects (Pure CSS &amp; SVG)
                  </h4>
                  <p className="text-xs text-[var(--ink-3)]">
                    Two-tone pill capsule (blue/coral) and beveled clinical shield. 6s slow float with scaling ground shadows.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[11px] font-bold text-[var(--ink-3)]">Float:</span>
                  <Toggle
                    checked={floatingObjToggle}
                    onChange={setFloatingObjToggle}
                    size="sm"
                    label="Toggle Float Animation"
                    hideLabel={true}
                  />
                </div>
              </div>

              <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--canvas)] grid grid-cols-1 sm:grid-cols-2 gap-6 items-center justify-items-center min-h-[200px]">
                {/* Floating Capsule */}
                <div className="flex flex-col items-center gap-2">
                  <div className={!floatingObjToggle || !is3DEnabled || prefersReduced ? 'transform-none' : ''}>
                    <FloatingCapsule size="md" />
                  </div>
                  <span className="text-xs font-bold font-[var(--font-heading)] text-[var(--ink-2)]">
                    &lt;FloatingCapsule /&gt;
                  </span>
                  <span className="text-[10px] text-[var(--ink-3)] font-mono">
                    Two-Tone Pill &bull; 6s Float
                  </span>
                </div>

                {/* ShieldMark */}
                <div className="flex flex-col items-center gap-2">
                  <div className={!floatingObjToggle || !is3DEnabled || prefersReduced ? 'transform-none' : ''}>
                    <ShieldMark size={76} />
                  </div>
                  <span className="text-xs font-bold font-[var(--font-heading)] text-[var(--ink-2)]">
                    &lt;ShieldMark /&gt;
                  </span>
                  <span className="text-[10px] text-[var(--ink-3)] font-mono">
                    3D Bevel Check &bull; 6s Sway
                  </span>
                </div>
              </div>
            </Card>

            {/* 4. DepthStack (Hero Parallax Shift) */}
            <Card variant="raised" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold font-[var(--font-heading)] text-[var(--ink)] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[var(--brand-600)]" />
                    DepthStack (Hero Parallax Shift)
                  </h4>
                  <p className="text-xs text-[var(--ink-3)]">
                    Multi-layer parallax container shifting child planes up to max 12px based on cursor position.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[11px] font-bold text-[var(--ink-3)]">Parallax:</span>
                  <Toggle
                    checked={depthStackToggle}
                    onChange={setDepthStackToggle}
                    size="sm"
                    label="Toggle Parallax Shift"
                    hideLabel={true}
                  />
                </div>
              </div>

              <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--canvas)] min-h-[200px]">
                <DepthStack
                  maxOffset={depthStackToggle && is3DEnabled && !prefersReduced ? 12 : 0}
                  className="p-6 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--border)] shadow-xs relative min-h-[170px] flex flex-col justify-between"
                >
                  {/* Background Depth Layer (0.25x) */}
                  <DepthLayer depth={0.25} className="absolute inset-0 p-4 pointer-events-none opacity-20">
                    <div className="w-32 h-32 rounded-full bg-[var(--brand-100)] filter blur-xl ml-auto" />
                  </DepthLayer>

                  {/* Midground Depth Layer (0.6x) */}
                  <DepthLayer depth={0.6} className="space-y-2 relative z-10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-600)] bg-[var(--accent-100)] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <SparklesIcon className="w-3 h-3" /> Parallax Plane
                    </span>
                    <h5 className="text-base font-bold font-[var(--font-heading)] text-[var(--ink)]">
                      Hero Intelligence Radar
                    </h5>
                    <p className="text-xs text-[var(--ink-2)]">
                      Move your mouse over this card to observe the background glow, text, and metric badge shifting at different speeds.
                    </p>
                  </DepthLayer>

                  {/* Foreground Depth Layer (1.0x) */}
                  <DepthLayer depth={1.0} className="relative z-20 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[var(--brand-600)]">maxOffset: 12px</span>
                    <StatusPill status="SAFE" label="Parallax Active" size="sm" />
                  </DepthLayer>
                </DepthStack>
              </div>
            </Card>
          </div>
        </section>

        {/* ── 07. EDITORIAL BRAND, LINE-ART EMPTY STATES, PILL LOADER & TYPED ICONS ──────────────────── */}
        <section id="brand-and-editorial" className="space-y-6">
          <SectionHeader
            number="07 /"
            kicker="Identity & Editorial Art"
            title="Brand Mark, Line-Art Empty States, Pill Loader & Typed Icons"
            description="Bespoke clinical brand mark, 2px-stroke empty state illustrations under 3KB, signature rotating pill loader, and typed icon map."
          />

          {/* Subsection 1: Logo & Brand Marks */}
          <Card variant="paper" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-lg font-bold font-[var(--font-heading)] text-[var(--ink)]">
                  Minimal Modern Brand Mark Architectures (2026)
                </h4>
                <p className="text-xs text-[var(--ink-3)]">
                  Pure solid vector planes, clean negative space, zero cartoon outlines. Built for modern clinical AI.
                </p>
              </div>
              <span className="text-xs font-mono text-[var(--brand-700)] bg-[var(--brand-50)] px-3 py-1 rounded-full border border-[var(--brand-200)] self-start sm:self-auto">
                3 Minimal Architectures
              </span>
            </div>

            {/* The 3 Concepts Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Concept 1 */}
              <div className="p-5 rounded-2xl bg-[var(--surface)] border-2 border-[var(--brand-300)] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[var(--brand-700)] uppercase tracking-wide">
                    Concept 1 · Synergy Cross (Default)
                  </span>
                  <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    RECOMMENDED
                  </span>
                </div>
                <div className="p-4 bg-[var(--paper)] rounded-xl border border-[var(--border)] flex items-center justify-center">
                  <Logo size="lg" concept="cross" showTagline={true} />
                </div>
                <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
                  Two pharmaceutical capsules (Brand Sapphire + Warm Coral) intersecting to form an iconic Swiss medical cross (+) with a luminous core. Pure geometry.
                </p>
              </div>

              {/* Concept 2 */}
              <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
                <span className="text-[11px] font-mono font-bold text-[var(--ink-2)] uppercase tracking-wide">
                  Concept 2 · Monolith Shield
                </span>
                <div className="p-4 bg-[var(--paper)] rounded-xl border border-[var(--border)] flex items-center justify-center">
                  <Logo size="lg" concept="shield" showTagline={true} />
                </div>
                <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
                  Aerodynamic two-tone clinical crest with a precision medical cross carved in negative space. Authoritative, solid, and protective.
                </p>
              </div>

              {/* Concept 3 */}
              <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
                <span className="text-[11px] font-mono font-bold text-[var(--ink-2)] uppercase tracking-wide">
                  Concept 3 · Minimalist Capsule
                </span>
                <div className="p-4 bg-[var(--paper)] rounded-xl border border-[var(--border)] flex items-center justify-center">
                  <Logo size="lg" concept="capsule" showTagline={true} />
                </div>
                <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
                  Pure 45° floating pharmaceutical capsule with bi-chamber color blocks (Sapphire + Coral) and clinical cross. Frameless and lightweight.
                </p>
              </div>
            </div>

            {/* Color Surface Variants */}
            <h5 className="text-xs font-mono font-bold text-[var(--ink-3)] uppercase tracking-wider pt-2">
              Cross-Surface Adaptability
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="space-y-2 text-center sm:text-left">
                <span className="text-[11px] font-mono font-bold text-[var(--ink-3)] uppercase">Standard Light / Ivory</span>
                <div className="p-4 bg-[var(--paper)] rounded-xl border border-[var(--border)] flex items-center justify-center sm:justify-start">
                  <Logo size="md" concept="cross" showTagline={true} />
                </div>
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <span className="text-[11px] font-mono font-bold text-[var(--ink-3)] uppercase">Dark Navy Header / Doctor Bar</span>
                <div className="p-4 bg-[#0B1B2B] rounded-xl border border-[#1E293B] flex items-center justify-center sm:justify-start">
                  <Logo size="md" concept="cross" variant="white" showTagline={true} />
                </div>
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <span className="text-[11px] font-mono font-bold text-[var(--ink-3)] uppercase">Monochrome (Print & Fax)</span>
                <div className="p-4 bg-[var(--paper)] rounded-xl border border-[var(--border)] flex items-center justify-center sm:justify-start">
                  <Logo size="md" concept="cross" variant="mono" showTagline={true} />
                </div>
              </div>
            </div>
          </Card>

          {/* Subsection 2: The 7 Empty State Line-Art Illustrations */}
          <Card variant="paper" className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold font-[var(--font-heading)] text-[var(--ink)]">
                The 7 Editorial Line-Art Empty States (All &lt; 3 KB)
              </h4>
              <span className="text-xs font-mono text-[var(--brand-600)] bg-[var(--brand-50)] px-2.5 py-1 rounded-full border border-[var(--brand-200)]">
                2px stroke · Ivory · Blue &amp; Coral accents
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-2">
                <EmptyMedicinesIllustration className="w-24 h-24 mx-auto" />
                <h5 className="text-xs font-bold font-[var(--font-heading)] text-[var(--ink)]">Medicines</h5>
                <p className="text-[11px] text-[var(--ink-3)]">Open prescription bottle &amp; capsule</p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-2">
                <EmptyFlagsIllustration className="w-24 h-24 mx-auto" />
                <h5 className="text-xs font-bold font-[var(--font-heading)] text-[var(--ink)]">Flags &amp; Alerts</h5>
                <p className="text-[11px] text-[var(--ink-3)]">Clinical shield &amp; safe checkmark</p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-2">
                <EmptyConnectionsIllustration className="w-24 h-24 mx-auto" />
                <h5 className="text-xs font-bold font-[var(--font-heading)] text-[var(--ink)]">Connections</h5>
                <p className="text-[11px] text-[var(--ink-3)]">Care network nodal stethoscope</p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-2">
                <EmptySymptomsIllustration className="w-24 h-24 mx-auto" />
                <h5 className="text-xs font-bold font-[var(--font-heading)] text-[var(--ink)]">Symptoms</h5>
                <p className="text-[11px] text-[var(--ink-3)]">Cardiac waveform clipboard</p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-2">
                <EmptyPatientsIllustration className="w-24 h-24 mx-auto" />
                <h5 className="text-xs font-bold font-[var(--font-heading)] text-[var(--ink)]">Doctor Patients</h5>
                <p className="text-[11px] text-[var(--ink-3)]">Physician clipboard &amp; safe registry</p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-2">
                <EmptyDataIllustration className="w-24 h-24 mx-auto" />
                <h5 className="text-xs font-bold font-[var(--font-heading)] text-[var(--ink)]">Trends &amp; Insights</h5>
                <p className="text-[11px] text-[var(--ink-3)]">Trend chart calibration bars</p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-2">
                <EmptySearchIllustration className="w-24 h-24 mx-auto" />
                <h5 className="text-xs font-bold font-[var(--font-heading)] text-[var(--ink)]">Search &amp; Formulary</h5>
                <p className="text-[11px] text-[var(--ink-3)]">Microscope &amp; chemical vial</p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-2">
                <OnboardingAgeIllustration className="w-24 h-24 mx-auto" />
                <h5 className="text-xs font-bold font-[var(--font-heading)] text-[var(--ink)]">Onboarding Calibration</h5>
                <p className="text-[11px] text-[var(--ink-3)]">Age &amp; Beers criteria dial</p>
              </div>
            </div>
          </Card>

          {/* Subsection 3: Pill Loader & Typed Iconography */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="paper" className="space-y-4">
              <h4 className="text-lg font-bold font-[var(--font-heading)] text-[var(--ink)]">
                Signature Rotating Pill Loader
              </h4>
              <p className="text-xs text-[var(--ink-2)]">
                Capsule rotates smoothly with dual-tone color split (Brand Blue &amp; Coral) and Fraunces typography.
              </p>
              <div className="p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
                <PillLoader size="md" label="Analyzing Clinical Safety..." sublabel="Checking Beers criteria &amp; ACB scores" />
              </div>
            </Card>

            <Card variant="paper" className="space-y-4">
              <h4 className="text-lg font-bold font-[var(--font-heading)] text-[var(--ink)]">
                Typed Icon Map (1.75 Stroke, 16/20/24px, Halo)
              </h4>
              <p className="text-xs text-[var(--ink-2)]">
                Strict Lucide-react iconography always inside a halo or paired with status text.
              </p>
              <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <ClinicalIcon name="CRITICAL" text="Critical Alert" />
                  <ClinicalIcon name="MAJOR" text="Major Interaction" />
                  <ClinicalIcon name="MODERATE" text="Moderate Burden" />
                  <ClinicalIcon name="SAFE" text="Verified Safe" />
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--border)]">
                  <MedicineTypeIcon type="PRESCRIPTION" showLabel={true} />
                  <MedicineTypeIcon type="OTC" showLabel={true} />
                  <MedicineTypeIcon type="HERBAL" showLabel={true} />
                  <MedicineTypeIcon type="BIOLOGIC" showLabel={true} />
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* ── 10. ACCESSIBILITY & TOKENS AUDIT ─────────────────────── */}
        <Card variant="paper" size="section" className="space-y-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-700)] bg-[var(--brand-50)] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> WCAG AA Compliance
            </span>
            <h3 className="text-xl font-bold font-[var(--font-heading)] text-[var(--ink)] mt-2">
              Accessibility & Motion Checklist
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-[var(--canvas)] border border-[var(--border)] space-y-1">
              <span className="font-bold text-[var(--ink)] block flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[var(--safe-fg)]" /> 44px Touch Targets
              </span>
              <p className="text-[var(--ink-3)]">
                Buttons, icon buttons, inputs, segmented options, chips, and toggles meet or exceed 44x44px interactive hit area.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--canvas)] border border-[var(--border)] space-y-1">
              <span className="font-bold text-[var(--ink)] block flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[var(--safe-fg)]" /> WCAG AA Contrast
              </span>
              <p className="text-[var(--ink-3)]">
                All 116 token pairs verified across light and dark modes (minimum 4.5:1 for body and 3:1 for large display text).
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--canvas)] border border-[var(--border)] space-y-1">
              <span className="font-bold text-[var(--ink)] block flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[var(--safe-fg)]" /> Status Never By Color
              </span>
              <p className="text-[var(--ink-3)]">
                Every badge, error, and status pill combines color + lucide-react icon + descriptive clinical label text.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--canvas)] border border-[var(--border)] space-y-1">
              <span className="font-bold text-[var(--ink)] block flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[var(--safe-fg)]" /> Prefers Reduced Motion
              </span>
              <p className="text-[var(--ink-3)]">
                All CSS animations, spring transitions, and loaders collapse to 0.01ms under prefers-reduced-motion: reduce.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
