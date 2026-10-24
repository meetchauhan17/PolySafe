/**
 * ProfilePage.jsx — Multi-Role Clinical Profile & Preferences
 * ─────────────────────────────────────────────────────────────────────────────
 * Route: /profile
 *
 * Requirements Met:
 * • Editorial layout with Fraunces serif headings, ivory/paper surfaces, and crisp hairlines.
 * • 4 Editorial Tabs: Profile, Care team, Security, Preferences.
 * • Preferences tab includes:
 *   - Theme toggle (Light / Dark) with live palette preview card.
 *   - Text size selector (Sm / Md / Lg) with live scaling sample paragraph preview.
 *   - Language selector (EN / HI / GU) with live translated clinical alert preview.
 *   - Stage Projector Mode toggle with live contrast badge preview.
 * • Role-adaptive identity (Patient, Doctor, Caregiver).
 * • Account deletion danger zone modal requiring "DELETE" typed confirmation.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  User,
  Users,
  Lock,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Stethoscope,
  Heart,
  Phone,
  Mail,
  Building2,
  FileBadge,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2,
  Plus,
  X,
  Sun,
  Moon,
  Type,
  Globe,
  Monitor,
  Eye,
  Sliders,
  Check,
  QrCode,
  ArrowRight,
  KeyRound,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

import Card from '../components/Card';
import BackButton from '../components/BackButton';
import RoleBadge from '../components/RoleBadge';
import StatusPill from '../components/StatusPill';
import EmergencyMedicalCardModal from '../components/EmergencyMedicalCardModal';
import { notify } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/useT';
import { useDisplaySettings } from '../context/DisplaySettingsContext';

// ─── Patient Condition Options ────────────────────────────────────────────────
const CONDITION_OPTIONS = [
  'Hypertension',
  'Type 2 Diabetes',
  'Chronic Kidney Disease',
  'Liver Impairment',
  'Heart Failure / Arrhythmia',
  'History of Falls',
  'Dementia / Cognitive Impairment',
  'Osteoarthritis',
  'GERD',
  'Hyperlipidemia',
];

// ─── Live Translated Alert Previews for Preferences Tab ──────────────────────
const LIVE_TRANSLATION_PREVIEWS = {
  en: {
    langLabel: 'English (Indian English)',
    title: 'Severe Pharmacotherapy Interaction',
    body: 'Concurrent Warfarin and Aspirin significantly multiplies gastrointestinal hemorrhage risk. Renal filtration monitoring recommended.',
    advisory: 'Beers 2023 Geriatric Caution · High-alert synergy',
  },
  hi: {
    langLabel: 'हिन्दी (Hindi)',
    title: 'गंभीर औषधि परस्पर क्रिया चेतावनी',
    body: 'वारफारिन और एस्पिरिन का एक साथ सेवन आंतरिक रक्तस्राव के जोखिम को कई गुना बढ़ा देता है। गुर्दे की निगरानी की सलाह दी जाती है।',
    advisory: 'बीयर्स 2023 जेरियाट्रिक सावधानी · उच्च-जोखिम तालमेल',
  },
  gu: {
    langLabel: 'ગુજરાતી (Gujarati)',
    title: 'ગંભીર દવાઓની ક્રિયાપ્રતિક્રિયા ચેતવણી',
    body: 'વોરફેરિન અને એસ્પિરિનનું એક સાથે સેવન આંતરિક રક્તસ્રાવનું જોખમ નોંધપાત્ર રીતે વધારે છે. કિડનીની તપાસની ભલામણ કરવામાં આવે છે.',
    advisory: 'બિયર્સ 2023 ગેરીયાટ્રિક સાવચેતી · ઉચ્ચ જોખમ',
  },
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const shouldReduceMotion = useReducedMotion();
  const { user, token, logout, isGuest } = useAuth();
  const { t, lang, setLang, textSize, setTextSize } = useT();
  const {
    theme,
    setTheme,
    toggleTheme,
    isProjectorMode,
    toggleProjectorMode,
  } = useDisplaySettings();

  const currentRole = (user?.role || 'PATIENT').toUpperCase();

  // ── 1. Tab Navigation State ──
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'care_team' | 'security' | 'preferences'

  // ── 2. Patient Form State ──
  const [age, setAge] = useState('68');
  const [gender, setGender] = useState('MALE');
  const [conditions, setConditions] = useState(['Hypertension', 'Type 2 Diabetes', 'Osteoarthritis']);
  const [allergies, setAllergies] = useState(['Penicillin', 'Sulfa drugs']);
  const [newAllergyInput, setNewAllergyInput] = useState('');

  // ── 3. Doctor Form State ──
  const [doctorRegNo, setDoctorRegNo] = useState(
    () => localStorage.getItem('polysafe_doc_reg') || 'MCI-2024-88492'
  );
  const [specialty, setSpecialty] = useState(
    () => localStorage.getItem('polysafe_doc_spec') || 'Geriatrics & Clinical Pharmacology'
  );
  const [hospital, setHospital] = useState(
    () => localStorage.getItem('polysafe_doc_hosp') || 'Apollo Multispeciality Hospitals'
  );

  // ── 4. Caregiver Form State ──
  const [caregiverPhone, setCaregiverPhone] = useState(
    () => localStorage.getItem('polysafe_cg_phone') || '+91 98765 43210'
  );
  const [relationship, setRelationship] = useState(
    () => localStorage.getItem('polysafe_cg_rel') || 'Adult Child / Guardian'
  );

  // ── 5. Modals State ──
  const [showEmergencyCard, setShowEmergencyCard] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Lock body scroll and handle Escape key for delete modal
  useEffect(() => {
    if (!showDeleteModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setShowDeleteModal(false);
        setDeleteConfirmText('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [showDeleteModal]);

  // Fetch patient profile from backend if user is patient
  const { data: serverProfile } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: () => axios.get('/patient/profile').then((r) => r.data.patient),
    enabled: !!token && currentRole === 'PATIENT' && !isGuest,
  });

  useEffect(() => {
    if (serverProfile) {
      if (serverProfile.age) setAge(String(serverProfile.age));
      if (serverProfile.gender) setGender(serverProfile.gender);
      if (serverProfile.conditions?.length) setConditions(serverProfile.conditions);
      if (serverProfile.allergies?.length) setAllergies(serverProfile.allergies);
    }
  }, [serverProfile]);

  // Profile Save Mutation
  const saveMutation = useMutation({
    mutationFn: (payload) => axios.post('/patient/profile', payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-profile'] });
      notify.success('Profile Updated', 'Clinical identity records saved.');
    },
    onError: (err) => {
      notify.error('Update Failed', err?.response?.data?.error || 'Could not update profile.');
    },
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (currentRole === 'PATIENT') {
      saveMutation.mutate({
        age: parseInt(age, 10) || 68,
        gender,
        conditions,
        allergies,
      });
    } else if (currentRole === 'DOCTOR') {
      localStorage.setItem('polysafe_doc_reg', doctorRegNo);
      localStorage.setItem('polysafe_doc_spec', specialty);
      localStorage.setItem('polysafe_doc_hosp', hospital);
      notify.success('Credentials Saved', 'Physician practice credentials updated.');
    } else {
      localStorage.setItem('polysafe_cg_phone', caregiverPhone);
      localStorage.setItem('polysafe_cg_rel', relationship);
      notify.success('Caregiver Profile Saved', 'Family contact details updated.');
    }
  };

  const handleToggleCondition = (cond) => {
    setConditions((prev) =>
      prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]
    );
  };

  const handleAddAllergy = (e) => {
    e.preventDefault();
    const trimmed = newAllergyInput.trim();
    if (!trimmed) return;
    if (!allergies.includes(trimmed)) {
      setAllergies([...allergies, trimmed]);
    }
    setNewAllergyInput('');
  };

  const handleRemoveAllergy = (allergyToRemove) => {
    setAllergies(allergies.filter((a) => a !== allergyToRemove));
  };

  // Delete Account Action
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setIsDeleting(true);
    try {
      await axios.delete('/auth/delete-account');
      notify.success('Account Permanently Erased', 'All clinical records have been deleted.');
      logout();
      navigate('/login');
    } catch (err) {
      notify.error('Deletion Failed', err?.response?.data?.error || 'Failed to delete account.');
      setIsDeleting(false);
    }
  };

  // User display metadata
  const displayName = user?.name || (currentRole === 'DOCTOR' ? 'Dr. Sarah Wilson' : 'Ramesh Patel');
  const displayEmail = user?.email || (currentRole === 'DOCTOR' ? 'dr.wilson@apollo.health' : 'ramesh.patel@example.com');
  const userInitials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const previewTranslation = LIVE_TRANSLATION_PREVIEWS[lang] || LIVE_TRANSLATION_PREVIEWS.en;

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans">
      {/* ── 1. Editorial Masthead & Identity Banner ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--paper)] border border-[var(--border)] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Avatar Circle */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--surface)] border-2 border-[var(--border-strong)] text-[var(--ink)] font-black text-xl sm:text-2xl font-[var(--font-heading)] flex items-center justify-center shadow-xs flex-shrink-0">
              {userInitials}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-[var(--ink)] tracking-tight font-[var(--font-heading)]">
                  {displayName}
                </h1>
                <RoleBadge role={currentRole} size="sm" />
              </div>

              <p className="text-xs sm:text-sm text-[var(--ink-2)] font-mono">
                {displayEmail} {user?.phone ? `· ${user.phone}` : ''}
              </p>

              <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-[var(--ink-3)]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Medical Profile · Active Session</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setShowEmergencyCard(true)}
              className="px-4 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 border border-rose-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Paramedic SOS</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Editorial Tabs Navigation ── */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-1 overflow-x-auto scrollbar-none">
        {[
          { id: 'profile', label: 'Clinical Profile', icon: User },
          { id: 'care_team', label: 'Care Team & Circle', icon: Users },
          { id: 'security', label: 'Security & Access', icon: Lock },
          { id: 'preferences', label: 'Display & Preferences', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold tracking-tight transition-all cursor-pointer flex-shrink-0 ${
                isActive
                  ? 'bg-[var(--surface)] text-[var(--ink)] border border-[var(--border)] shadow-xs border-b-2 border-b-[var(--accent-500)]'
                  : 'text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--accent-500)]' : 'text-current'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 3. Tab Content ── */}
      <div className="space-y-6">
        {/* ── TAB 1: PROFILE ── */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card
              title={
                currentRole === 'DOCTOR'
                  ? 'Physician Practice Credentials'
                  : currentRole === 'CAREGIVER'
                  ? 'Caregiver Profile & Relationship'
                  : 'Clinical Baseline & Diagnoses'
              }
              subtitle="Information utilized by interaction engines, STOPP/START criteria, and Beers 2023 evaluation"
              icon={<User className="w-5 h-5 text-[var(--doctor-600)]" />}
              className="p-6 sm:p-8 space-y-6"
            >
              <form onSubmit={handleSaveProfile} className="space-y-6 text-xs font-sans">
                {currentRole === 'PATIENT' && (
                  <>
                    {/* Age and Gender */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-bold font-mono text-[var(--ink)] uppercase tracking-wider text-[11px]">
                          Patient Age (Years)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-[var(--canvas)] border border-[var(--border)] text-sm font-mono font-bold text-[var(--ink)] outline-none focus:border-[var(--brand-600)]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold font-mono text-[var(--ink)] uppercase tracking-wider text-[11px]">
                          Biological Sex
                        </label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-[var(--canvas)] border border-[var(--border)] text-sm font-bold text-[var(--ink)] outline-none focus:border-[var(--brand-600)] cursor-pointer"
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other / Prefer not to say</option>
                        </select>
                      </div>
                    </div>

                    {/* Documented Chronic Diagnoses Chips */}
                    <div className="space-y-2">
                      <label className="font-bold font-mono text-[var(--ink)] uppercase tracking-wider text-[11px] flex items-center justify-between">
                        <span>Documented Chronic Conditions ({conditions.length})</span>
                        <span className="text-[10px] text-[var(--ink-3)]">Click to toggle</span>
                      </label>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {CONDITION_OPTIONS.map((cond) => {
                          const isSelected = conditions.includes(cond);
                          return (
                            <button
                              key={cond}
                              type="button"
                              onClick={() => handleToggleCondition(cond)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-[var(--doctor-600)] text-white shadow-xs'
                                  : 'bg-[var(--canvas)] border border-[var(--border)] text-[var(--ink-2)] hover:border-[var(--border-strong)]'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                              <span>{cond}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Documented Drug Allergies in Vermilion Outline */}
                    <div className="space-y-3 pt-2">
                      <label className="font-bold font-mono text-[var(--ink)] uppercase tracking-wider text-[11px]">
                        Documented Drug Allergies & Hypersensitivities
                      </label>

                      <div className="flex flex-wrap gap-2">
                        {allergies.map((allergy) => (
                          <span
                            key={allergy}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-rose-500 bg-rose-500/10 text-rose-800 dark:text-rose-200 text-xs font-bold"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>{allergy}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAllergy(allergy)}
                              className="ml-1 hover:text-rose-950 cursor-pointer"
                              title="Remove allergy"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Add new allergy */}
                      <div className="flex gap-2 max-w-md pt-1">
                        <input
                          type="text"
                          value={newAllergyInput}
                          onChange={(e) => setNewAllergyInput(e.target.value)}
                          placeholder="Add allergy (e.g. Aspirin, ACE Inhibitors)..."
                          className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--canvas)] border border-[var(--border)] text-xs text-[var(--ink)] outline-none focus:border-rose-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddAllergy}
                          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {currentRole === 'DOCTOR' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-bold font-mono text-[var(--ink)] uppercase tracking-wider text-[11px]">
                          Medical Registration Number (MCI / State)
                        </label>
                        <input
                          type="text"
                          value={doctorRegNo}
                          onChange={(e) => setDoctorRegNo(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-[var(--canvas)] border border-[var(--border)] text-sm font-mono font-bold text-[var(--ink)] outline-none focus:border-[var(--doctor-600)]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold font-mono text-[var(--ink)] uppercase tracking-wider text-[11px]">
                          Primary Clinical Specialty
                        </label>
                        <input
                          type="text"
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-[var(--canvas)] border border-[var(--border)] text-sm font-bold text-[var(--ink)] outline-none focus:border-[var(--doctor-600)]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold font-mono text-[var(--ink)] uppercase tracking-wider text-[11px]">
                        Hospital Affiliation & Department
                      </label>
                      <input
                        type="text"
                        value={hospital}
                        onChange={(e) => setHospital(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-[var(--canvas)] border border-[var(--border)] text-sm text-[var(--ink)] outline-none focus:border-[var(--doctor-600)]"
                      />
                    </div>
                  </div>
                )}

                {currentRole === 'CAREGIVER' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-bold font-mono text-[var(--ink)] uppercase tracking-wider text-[11px]">
                          Primary Contact Phone
                        </label>
                        <input
                          type="text"
                          value={caregiverPhone}
                          onChange={(e) => setCaregiverPhone(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-[var(--canvas)] border border-[var(--border)] text-sm font-mono text-[var(--ink)] outline-none focus:border-[var(--caregiver-600)]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold font-mono text-[var(--ink)] uppercase tracking-wider text-[11px]">
                          Relationship
                        </label>
                        <input
                          type="text"
                          value={relationship}
                          onChange={(e) => setRelationship(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-[var(--canvas)] border border-[var(--border)] text-sm font-bold text-[var(--ink)] outline-none focus:border-[var(--caregiver-600)]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                  <button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="px-6 py-3 rounded-2xl bg-[var(--ink)] text-white hover:bg-[var(--brand-800)] font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {saveMutation.isPending ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}

        {/* ── TAB 2: CARE TEAM ── */}
        {activeTab === 'care_team' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card
              title="Active Care Circle & Clinicians"
              subtitle="Physicians and family proxies who have authorized access to your regimen"
              icon={<Users className="w-5 h-5 text-[var(--doctor-600)]" />}
              className="p-6 sm:p-8 space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl bg-[var(--canvas)] border border-[var(--border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <RoleBadge role="doctor" size="sm" />
                    <StatusPill status="safe" label="Active" size="sm" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[var(--ink)] font-[var(--font-heading)]">
                      Dr. Sarah Wilson, MD
                    </h4>
                    <p className="text-xs text-[var(--ink-3)] font-mono mt-0.5">
                      Cardiology · Apollo Hospitals (Reg: MCI-84920)
                    </p>
                  </div>
                  <p className="text-[11px] text-[var(--ink-2)] font-mono">
                    Authorized for read-only timeline & cascade evaluation.
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-[var(--canvas)] border border-[var(--border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <RoleBadge role="caregiver" size="sm" />
                    <StatusPill status="safe" label="Active" size="sm" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[var(--ink)] font-[var(--font-heading)]">
                      Rajesh Patel (Son)
                    </h4>
                    <p className="text-xs text-[var(--ink-3)] font-mono mt-0.5">
                      Primary Family Proxy · +91 98765 43210
                    </p>
                  </div>
                  <p className="text-[11px] text-[var(--ink-2)] font-mono">
                    Authorized for daily timetable compliance check-ins.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <Link
                  to="/connected-people"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[var(--canvas)] hover:bg-[var(--surface-2)] border border-[var(--border)] text-xs font-bold text-[var(--ink)] inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <Users className="w-4 h-4 text-[var(--doctor-600)]" />
                  <span>Manage Permissions & Add Caregiver</span>
                </Link>

                <Link
                  to="/doctor-share"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[var(--doctor-600)] hover:bg-[var(--doctor-700)] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Issue Doctor Pairing PIN</span>
                </Link>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── TAB 3: SECURITY ── */}
        {activeTab === 'security' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card
              title="Authentication & Security Protocols"
              subtitle="Two-factor verification, session tokens, and cryptographic safety telemetry"
              icon={<Lock className="w-5 h-5 text-[var(--doctor-600)]" />}
              className="p-6 sm:p-8 space-y-6"
            >
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[var(--canvas)] border border-[var(--border)] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                    <div>
                      <h4 className="text-sm font-bold text-[var(--ink)]">Two-Factor OTP Verification</h4>
                      <p className="text-xs text-[var(--ink-3)] font-mono">
                        Passwordless one-time password security active for all logins.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30">
                    Active
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--canvas)] border border-[var(--border)] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <KeyRound className="w-6 h-6 text-[var(--brand-600)]" />
                    <div>
                      <h4 className="text-sm font-bold text-[var(--ink)]">JWT Clinical Session Token</h4>
                      <p className="text-xs text-[var(--ink-3)] font-mono">
                        Cryptographically signed bearer token with 7-day expiration window.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[var(--surface-2)] text-[var(--ink-3)] border border-[var(--border)]">
                    SHA-256
                  </span>
                </div>
              </div>

              {/* Danger Zone: Permanent Account Erasure */}
              <div className="pt-6 border-t border-[var(--border)] space-y-3">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-sm">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Danger Zone: Account Erasure</span>
                </div>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  Permanently deletes your user credentials, active medication records, interaction flags, and disconnects all linked clinicians and caregivers.
                </p>

                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Erase Account & Clinical Data</span>
                </button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── TAB 4: PREFERENCES (WITH LIVE INTERACTIVE PREVIEWS!) ── */}
        {activeTab === 'preferences' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* 1. Theme Selection & Live Swatch Preview */}
            <Card
              title="Interface Theme"
              subtitle="Choose between warm ivory editorial daylight and dark obsidian mode"
              icon={<Sun className="w-5 h-5 text-[var(--accent-500)]" />}
              className="p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center gap-2.5 text-xs font-bold uppercase tracking-wider ${
                    theme === 'light'
                      ? 'bg-[var(--surface)] border-[var(--accent-500)] ring-2 ring-[var(--accent-500)]/20 shadow-xs'
                      : 'bg-[var(--canvas)] border-[var(--border)] opacity-70 hover:opacity-100'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Light Mode (Ivory Editorial)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center gap-2.5 text-xs font-bold uppercase tracking-wider ${
                    theme === 'dark'
                      ? 'bg-[var(--surface)] border-[var(--accent-500)] ring-2 ring-[var(--accent-500)]/20 shadow-xs'
                      : 'bg-[var(--canvas)] border-[var(--border)] opacity-70 hover:opacity-100'
                  }`}
                >
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span>Dark Mode (Obsidian Academic)</span>
                </button>
              </div>

              {/* Live Theme Palette Preview Box */}
              <div className="p-4 rounded-2xl bg-[var(--canvas)] border border-[var(--border)] space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--ink-3)]">
                  Live Theme Swatch Preview:
                </span>
                <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-mono">
                  <div className="p-3 rounded-xl bg-[var(--canvas)] border border-[var(--border)] text-[var(--ink)]">
                    Canvas
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)]">
                    Surface
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--border)] text-[var(--ink)]">
                    Paper
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--doctor-600)] text-white">
                    Ink Blue
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--accent-500)] text-white">
                    Coral
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. Text Size & Live Typography Preview */}
            <Card
              title="Typography Scale & Accessibility"
              subtitle="Adjust base font scale for high-comfort clinical legibility"
              icon={<Type className="w-5 h-5 text-[var(--brand-600)]" />}
              className="p-6 sm:p-8 space-y-6"
            >
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'sm', label: 'Compact (A-)', desc: 'Higher density' },
                  { id: 'md', label: 'Standard (A)', desc: 'Editorial baseline' },
                  { id: 'lg', label: 'Large (A+)', desc: 'Enhanced legibility' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setTextSize(s.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-center space-y-1 ${
                      textSize === s.id
                        ? 'bg-[var(--surface)] border-[var(--brand-600)] ring-2 ring-[var(--brand-600)]/20 shadow-xs'
                        : 'bg-[var(--canvas)] border-[var(--border)] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <p className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider font-mono">
                      {s.label}
                    </p>
                    <p className="text-[10px] text-[var(--ink-3)] font-mono">{s.desc}</p>
                  </button>
                ))}
              </div>

              {/* Live Text Scale Preview Box */}
              <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--ink-3)]">
                  Live Typography Scaling Preview:
                </span>
                <p className="leading-relaxed text-[var(--ink)] font-sans">
                  "PolySafe continuous pharmacotherapy surveillance active. Multi-drug interaction screening, anticholinergic cognitive burden assessment, and Beers 2024 compliance verified across all prescriptions."
                </p>
              </div>
            </Card>

            {/* 3. Language & Live Translated Preview */}
            <Card
              title="Language & Regional Localization"
              subtitle="Select clinical alert language with verified terminology"
              icon={<Globe className="w-5 h-5 text-[var(--doctor-600)]" />}
              className="p-6 sm:p-8 space-y-6"
            >
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'en', label: 'English', native: 'English' },
                  { id: 'hi', label: 'हिन्दी', native: 'Hindi' },
                  { id: 'gu', label: 'ગુજરાતી', native: 'Gujarati' },
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLang(l.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-center space-y-1 ${
                      lang === l.id
                        ? 'bg-[var(--surface)] border-[var(--doctor-600)] ring-2 ring-[var(--doctor-600)]/20 shadow-xs'
                        : 'bg-[var(--canvas)] border-[var(--border)] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <p className="text-base font-black text-[var(--ink)] font-[var(--font-heading)]">
                      {l.label}
                    </p>
                    <p className="text-[11px] text-[var(--ink-3)] font-mono">{l.native}</p>
                  </button>
                ))}
              </div>

              {/* Live Translated Alert Preview Box */}
              <div className="p-5 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-800 dark:text-rose-200">
                    Live Translated Clinical Alert Preview ({previewTranslation.langLabel}):
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white">
                    CRITICAL
                  </span>
                </div>
                <h4 className="text-sm font-bold text-rose-900 dark:text-rose-100 font-[var(--font-heading)]">
                  {previewTranslation.title}
                </h4>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  {previewTranslation.body}
                </p>
                <p className="text-[10px] font-mono text-rose-800 dark:text-rose-300 font-bold pt-1">
                  {previewTranslation.advisory}
                </p>
              </div>
            </Card>

            {/* 4. Stage Projector Mode & Live Preview */}
            <Card
              title="Stage Projector Mode"
              subtitle="High-contrast stage view optimized for projection systems, grand rounds, and intense lighting"
              icon={<Monitor className="w-5 h-5 text-[var(--accent-500)]" />}
              className="p-6 sm:p-8 space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--canvas)] border border-[var(--border)]">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[var(--ink)] font-[var(--font-heading)]">
                    Auditorium & Projector Presentation Mode
                  </h4>
                  <p className="text-xs text-[var(--ink-3)] max-w-md leading-relaxed">
                    Maximizes contrast, enlarges touch targets, and flattens decorative effects to ensure clear visibility from 20 feet away.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleProjectorMode}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95 ${
                    isProjectorMode
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] text-[var(--ink)]'
                  }`}
                >
                  {isProjectorMode ? 'Projector Mode ON' : 'Projector Mode OFF'}
                </button>
              </div>

              {/* Live Projector Preview Badge */}
              <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--ink-3)]">
                  Live Projector Status:
                </span>
                <span
                  className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                    isProjectorMode
                      ? 'bg-amber-500/20 text-amber-900 dark:text-amber-100 border-amber-500 font-black'
                      : 'bg-[var(--canvas)] text-[var(--ink-3)] border-[var(--border)]'
                  }`}
                >
                  {isProjectorMode ? '⚡ PROJECTOR: ACTIVE (HIGH CONTRAST)' : 'PROJECTOR: INACTIVE'}
                </span>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* ── Delete Account Confirmation Modal ── */}
      {showDeleteModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) {
              setShowDeleteModal(false);
              setDeleteConfirmText('');
            }
          }}
        >
          <div className="w-full max-w-md bg-[var(--surface)] border-2 border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 z-[201] my-auto">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-black text-[var(--ink)] font-[var(--font-heading)]">
                Permanent Account Deletion
              </h3>
            </div>

            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              This action cannot be undone. All medication records, adverse symptom cascaded logs, physician links, and verified clinical profiles will be permanently erased.
            </p>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-mono font-bold text-[var(--ink)]">
                Type <span className="text-rose-600 font-black">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-4 py-3 rounded-2xl bg-[var(--canvas)] border border-[var(--border)] text-sm font-mono font-bold text-[var(--ink)] outline-none focus:border-rose-500"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                disabled={isDeleting}
                className="ps-btn ps-btn-secondary py-2.5 px-4 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-40"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Permanently Erase</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Paramedic Emergency Medical Card Modal ── */}
      <EmergencyMedicalCardModal
        isOpen={showEmergencyCard}
        onClose={() => setShowEmergencyCard(false)}
        isDemo={true}
      />
    </div>
  );
}
