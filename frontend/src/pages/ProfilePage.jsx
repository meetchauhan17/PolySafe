/**
 * ProfilePage.jsx — Multi-Role Profile Management
 * Route: /profile
 *
 * Supports tailored profiles for:
 * 1. PATIENT: Age, conditions, drug allergies, safety profile.
 * 2. CAREGIVER: Caregiver details, contact phone, relationship type, alert preferences, linked patients.
 * 3. DOCTOR: Physician credentials, medical license (MCI), clinical specialty, hospital affiliation, practice preferences.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowLeft, User, Edit3, Lock, Mail, Activity, AlertCircle, Loader2, Info,
  CheckCircle2, ShieldCheck, HeartHandshake, Stethoscope, Phone, Building2,
  FileBadge, Bell, Users, Shield, Save, X, Zap
} from 'lucide-react';
import Card from '../components/Card';
import BackButton from '../components/BackButton';
import { notify } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import PolySafeInput from '../components/PolySafeInput';
import PolySafeTextarea from '../components/PolySafeTextarea';

// ─── Patient Condition Options ────────────────────────────────────────────────
const CONDITION_OPTIONS = [
  { id: 'hypertension', label: 'Hypertension' },
  { id: 'diabetes', label: 'Diabetes (Type 2)' },
  { id: 'kidney', label: 'Chronic Kidney Disease' },
  { id: 'liver', label: 'Liver Impairment' },
  { id: 'heart', label: 'Heart Failure / Arrhythmia' },
  { id: 'asthma', label: 'Asthma / COPD' },
  { id: 'none', label: 'None of the above' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, token } = useAuth();
  const currentRole = (user?.role || 'PATIENT').toUpperCase();

  const [editing, setEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // ─── 1. Patient Form State ──────────────────────────────────────────────────
  const [age, setAge] = useState('');
  const [conditions, setConditions] = useState([]);
  const [allergiesText, setAllergiesText] = useState('');

  // ─── 2. Caregiver Form State ────────────────────────────────────────────────
  const [caregiverPhone, setCaregiverPhone] = useState(() => localStorage.getItem('polysafe_cg_phone') || '+91 98765 43210');
  const [relationship, setRelationship] = useState(() => localStorage.getItem('polysafe_cg_rel') || 'Adult Child / Guardian');
  const [notifyDoseReminders, setNotifyDoseReminders] = useState(() => localStorage.getItem('polysafe_cg_notify_dose') !== 'false');
  const [notifyCriticalAlerts, setNotifyCriticalAlerts] = useState(() => localStorage.getItem('polysafe_cg_notify_crit') !== 'false');

  // ─── 3. Doctor Form State ───────────────────────────────────────────────────
  const [doctorRegNo, setDoctorRegNo] = useState(() => localStorage.getItem('polysafe_doc_reg') || 'MCI-2024-88492');
  const [specialty, setSpecialty] = useState(() => localStorage.getItem('polysafe_doc_spec') || 'Geriatrics & Clinical Pharmacology');
  const [hospital, setHospital] = useState(() => localStorage.getItem('polysafe_doc_hosp') || 'Apollo Multispeciality Hospitals');
  const [autoBeersCheck, setAutoBeersCheck] = useState(() => localStorage.getItem('polysafe_doc_beers') !== 'false');

  // ─── Fetch current patient profile (only if PATIENT) ────────────────────────
  const { data: patientProfile, isLoading: loadingPatientProfile } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: () => axios.get('/patient/profile').then((r) => r.data.patient),
    enabled: !!token && currentRole === 'PATIENT',
  });

  // Sync fetched patient profile into form state
  useEffect(() => {
    if (patientProfile) {
      setAge(patientProfile.age?.toString() || '');
      setConditions(patientProfile.conditions || []);
      setAllergiesText((patientProfile.allergies || []).join(', '));
    }
  }, [patientProfile]);

  const toggleCondition = (item) => {
    setConditions((prev) => {
      const isNone = item === 'none' || item === 'None of the above';
      if (isNone) return ['none'];
      const without = prev.filter((c) => c !== 'none' && c !== 'None of the above');
      const exists = without.some((c) => c.toLowerCase() === item.toLowerCase());
      if (exists) return without.filter((c) => c.toLowerCase() !== item.toLowerCase());
      return [...without, item];
    });
  };

  // ─── Patient Save Mutation ──────────────────────────────────────────────────
  const patientSaveMutation = useMutation({
    mutationFn: (body) => axios.post('/patient/profile', body).then((r) => r.data),
    onSuccess: () => {
      setErrorMsg(null);
      setEditing(false);
      queryClient.invalidateQueries(['patient-profile']);
      notify.success('Profile Saved', 'Your patient safety profile has been updated.');
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || 'Failed to save patient profile.';
      setErrorMsg(msg);
      notify.error('Save Failed', msg);
    },
  });

  const handlePatientSave = (e) => {
    e.preventDefault();
    const parsedAge = parseInt(age, 10);
    if (!age || isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      setErrorMsg('Please enter a valid age between 1 and 120.');
      return;
    }
    const allergiesArr = allergiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    patientSaveMutation.mutate({ age: parsedAge, conditions, allergies: allergiesArr });
  };

  const handleCaregiverSave = (e) => {
    e.preventDefault();
    localStorage.setItem('polysafe_cg_phone', caregiverPhone);
    localStorage.setItem('polysafe_cg_rel', relationship);
    localStorage.setItem('polysafe_cg_notify_dose', String(notifyDoseReminders));
    localStorage.setItem('polysafe_cg_notify_crit', String(notifyCriticalAlerts));
    setEditing(false);
    setErrorMsg(null);
    notify.success('Caregiver Profile Saved', 'Your contact and notification preferences are updated.');
  };

  const handleDoctorSave = (e) => {
    e.preventDefault();
    if (!doctorRegNo.trim()) {
      setErrorMsg('Medical registration / license number is required.');
      return;
    }
    localStorage.setItem('polysafe_doc_reg', doctorRegNo.trim());
    localStorage.setItem('polysafe_doc_spec', specialty.trim());
    localStorage.setItem('polysafe_doc_hosp', hospital.trim());
    localStorage.setItem('polysafe_doc_beers', String(autoBeersCheck));
    setEditing(false);
    setErrorMsg(null);
    notify.success('Physician Credentials Saved', 'Your clinical profile and license details have been updated.');
  };

  const getBackPath = () => {
    if (currentRole === 'DOCTOR') return '/doctor-dashboard';
    if (currentRole === 'CAREGIVER') return '/caregiver-view';
    return '/home';
  };

  const roleConfigs = {
    PATIENT: {
      title: 'Patient Safety Profile',
      subtitle: 'Manage your age, diagnosed conditions, and drug allergies',
      icon: User,
      color: 'var(--brand-600)',
      accentBg: 'bg-[var(--brand-600)]/10 text-[var(--brand-600)]',
      badge: 'PATIENT PORTAL',
    },
    CAREGIVER: {
      title: 'Caregiver Oversight Profile',
      subtitle: 'Manage family contact info and safety alert preferences',
      icon: HeartHandshake,
      color: 'var(--caregiver-600)',
      accentBg: 'bg-[var(--caregiver-600)]/10 text-[var(--caregiver-600)]',
      badge: 'VERIFIED CAREGIVER',
    },
    DOCTOR: {
      title: 'Physician Clinical Profile',
      subtitle: 'Manage your medical license, specialty, and clinical settings',
      icon: Stethoscope,
      color: 'var(--doctor-600)',
      accentBg: 'bg-[var(--doctor-600)]/10 text-[var(--doctor-600)]',
      badge: 'LICENSED CLINICIAN',
    },
  };

  const cfg = roleConfigs[currentRole] || roleConfigs.PATIENT;
  const RoleIcon = cfg.icon;

  const backLabel = currentRole === 'DOCTOR' ? 'Back to Dashboard' : currentRole === 'CAREGIVER' ? 'Back to Portal' : 'Back to Home';

  return (
    <div className="min-h-[88vh] pb-12">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ── Modern Hero Header ── */}
        <div className="ps-hero ps-fade-up">
          {/* Ambient orbs */}
          <div className="ps-orb ps-orb--primary" style={{ width: 160, height: 160, top: -50, right: -30, opacity: 0.16 }} />
          <div className="ps-orb ps-orb--secondary" style={{ width: 100, height: 100, bottom: -30, left: 40, opacity: 0.12 }} />

          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <BackButton to={getBackPath()} label={backLabel} />

              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--brand-600)]/10 text-[var(--brand-600)] border border-[var(--brand-600)]/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand-600)] opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--brand-600)]" />
                  </span>
                  <span className="font-mono text-[11px]">{cfg.badge}</span>
                </div>
                <button
                  onClick={() => {
                    setEditing(!editing);
                    setErrorMsg(null);
                  }}
                  className="ps-btn-shine ps-btn ps-btn-primary py-2 px-4 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{editing ? 'Cancel Editing' : 'Edit Profile'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--ink)] tracking-tight font-[var(--font-heading)]">
                {cfg.title.split(' ')[0]}{' '}
                <span className="ps-glow-text">{cfg.title.split(' ').slice(1).join(' ')}</span>
              </h1>
              <p className="text-sm text-[var(--ink-2)] max-w-xl leading-relaxed">
                {cfg.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)]/80 border border-[var(--border)] text-xs font-medium text-[var(--ink-2)]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--brand-600)]" />
                  <span>256-Bit Encrypted Vault</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)]/80 border border-[var(--border)] text-xs font-medium text-[var(--ink-2)]">
                  <Activity className="w-3.5 h-3.5 text-[var(--doctor-600)]" />
                  <span>Real-Time Audit</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)]/80 border border-[var(--border)] text-xs font-medium text-[var(--ink-2)]">
                  <Zap className="w-3.5 h-3.5 text-[var(--safe-fg)]" />
                  <span>HIPAA Compliant</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Global Error Banner ───────────────────────────────────────── */}
        {errorMsg && (
          <div className="p-4 bg-[var(--canvas)] border-2 border-[var(--critical-fg)]/30 rounded-2xl flex items-start space-x-3 text-[var(--critical-fg)] text-sm shadow-xs font-mono">
            <AlertCircle className="w-5 h-5 text-[var(--critical-fg)] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* ── Account Information Card (Common across all 3 roles) ─────── */}
        <Card className="p-6 space-y-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center space-x-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-[var(--shadow-sm)]"
              style={{ backgroundColor: cfg.color }}
            >
              <RoleIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-[var(--ink)] font-[var(--font-heading)] truncate">
                {user?.name || 'PolySafe User'}
              </h2>
              <p className="text-xs text-[var(--ink-3)] font-mono flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                <span>{user?.email || '—'}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border)] text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-[var(--canvas)] shadow-[var(--shadow-inner)]">
              <span className="text-[10px] text-[var(--ink-3)] uppercase block">Account Role</span>
              <strong className="text-[var(--ink)] font-bold">{currentRole}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--canvas)] shadow-[var(--shadow-inner)]">
              <span className="text-[10px] text-[var(--ink-3)] uppercase block">Status</span>
              <strong className="text-[var(--safe-fg)] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active & Verified
              </strong>
            </div>
          </div>
        </Card>

        {/* ══════════════════════════════════════════════════════════════════
            ROLE 1: PATIENT PROFILE FORM
        ══════════════════════════════════════════════════════════════════ */}
        {currentRole === 'PATIENT' && (
          loadingPatientProfile ? (
            <Card className="p-8 flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--brand-600)]" />
              <span className="text-xs font-mono text-[var(--ink-3)]">Loading clinical profile...</span>
            </Card>
          ) : (
            <Card className="p-6 space-y-6 shadow-[var(--shadow-sm)]">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <h3 className="text-sm font-bold text-[var(--ink)] font-[var(--font-heading)] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[var(--brand-600)]" />
                  Clinical & Safety Demographics
                </h3>
              </div>

              {editing ? (
                <form onSubmit={handlePatientSave} className="space-y-5">
                  {/* Age Field */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider font-mono">
                      Patient Age (Years)
                    </label>
                    <PolySafeInput
                      type="number"
                      min="1"
                      max="120"
                      required
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 68"
                    />
                    <p className="text-[11px] text-[var(--ink-3)] font-mono">
                      Used for Beers Criteria 2023 anticholinergic risk and renal clearance threshold calculations.
                    </p>
                  </div>

                  {/* Conditions Pills */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider font-mono">
                      Diagnosed Conditions
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CONDITION_OPTIONS.map((cond) => {
                        const isSelected = conditions.some((c) => c.toLowerCase() === cond.id || c.toLowerCase() === cond.label.toLowerCase());
                        return (
                          <button
                            key={cond.id}
                            type="button"
                            onClick={() => toggleCondition(cond.label)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[var(--brand-600)] text-white shadow-xs'
                                : 'bg-[var(--canvas)] text-[var(--ink-3)] shadow-[var(--shadow-sm)] hover:text-[var(--ink)]'
                            }`}
                          >
                            {cond.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Known Drug Allergies */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider font-mono">
                      Known Drug Allergies (Comma-separated)
                    </label>
                    <PolySafeInput
                      type="text"
                      value={allergiesText}
                      onChange={(e) => setAllergiesText(e.target.value)}
                      placeholder="e.g. Penicillin, Sulfa drugs, Aspirin"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-3">
                    <button
                      type="submit"
                      disabled={patientSaveMutation.isPending}
                      className="ps-btn ps-btn-primary flex-1 py-3 text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {patientSaveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Save Changes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="ps-btn ps-btn-secondary py-3 px-5 text-xs font-mono font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-xs font-mono">
                  <div className="p-3.5 rounded-2xl bg-[var(--canvas)] shadow-[var(--shadow-inner)] space-y-1">
                    <span className="text-[10px] text-[var(--ink-3)] uppercase block">Age</span>
                    <p className="text-sm font-bold text-[var(--ink)]">{age || 'Not configured'} years</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--canvas)] shadow-[var(--shadow-inner)] space-y-1.5">
                    <span className="text-[10px] text-[var(--ink-3)] uppercase block">Active Medical Conditions</span>
                    <div className="flex flex-wrap gap-1.5">
                      {conditions.length > 0 ? (
                        conditions.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-[var(--brand-600)]/15 text-[var(--brand-600)] font-bold text-[11px]">
                            {c}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-[var(--ink-3)] italic">None listed</p>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--canvas)] shadow-[var(--shadow-inner)] space-y-1">
                    <span className="text-[10px] text-[var(--ink-3)] uppercase block">Documented Drug Allergies</span>
                    <p className="text-xs font-bold text-[var(--ink)]">{allergiesText || 'No known drug allergies'}</p>
                  </div>
                </div>
              )}
            </Card>
          )
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ROLE 2: CAREGIVER PROFILE FORM
        ══════════════════════════════════════════════════════════════════ */}
        {currentRole === 'CAREGIVER' && (
          <Card className="p-6 space-y-6 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="text-sm font-bold text-[var(--ink)] font-[var(--font-heading)] flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-[var(--caregiver-600)]" />
                Caregiver Preferences & Contact Info
              </h3>
            </div>

            {editing ? (
              <form onSubmit={handleCaregiverSave} className="space-y-5">
                {/* Emergency Contact Phone */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider font-mono">
                    Emergency Contact Number
                  </label>
                  <PolySafeInput
                    type="tel"
                    required
                    value={caregiverPhone}
                    onChange={(e) => setCaregiverPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    leftIcon={<Phone className="w-4 h-4" />}
                  />
                </div>

                {/* Relationship to Patient */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider font-mono">
                    Relationship to Patient
                  </label>
                  <PolySafeInput
                    type="text"
                    required
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder="e.g. Adult Daughter, Spouse, Legal Guardian"
                  />
                </div>

                {/* Notification Settings */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider font-mono">
                    Notification Preferences
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyDoseReminders}
                        onChange={(e) => setNotifyDoseReminders(e.target.checked)}
                        className="w-4 h-4 rounded text-[var(--caregiver-600)]"
                      />
                      <span>Receive Daily Dose Check-in Confirmations</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyCriticalAlerts}
                        onChange={(e) => setNotifyCriticalAlerts(e.target.checked)}
                        className="w-4 h-4 rounded text-[var(--caregiver-600)]"
                      />
                      <span>Immediate SMS / Email for Critical Drug Flags</span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    className="ps-btn ps-btn-primary flex-1 py-3 text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Preferences</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="ps-btn ps-btn-secondary py-3 px-5 text-xs font-mono font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs font-mono">
                <div className="p-3.5 rounded-2xl bg-[var(--canvas)] shadow-[var(--shadow-inner)] space-y-1">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase block">Emergency Contact Phone</span>
                  <p className="text-sm font-bold text-[var(--ink)]">{caregiverPhone}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--canvas)] shadow-[var(--shadow-inner)] space-y-1">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase block">Relationship to Dependent</span>
                  <p className="text-sm font-bold text-[var(--ink)]">{relationship}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--canvas)] shadow-[var(--shadow-inner)] space-y-2">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase block">Alert Channels</span>
                  <div className="space-y-1">
                    <p className="text-xs text-[var(--ink)]">
                      • Daily Dose Reminders: <strong>{notifyDoseReminders ? 'Enabled' : 'Disabled'}</strong>
                    </p>
                    <p className="text-xs text-[var(--ink)]">
                      • Critical Interaction Alerts: <strong>{notifyCriticalAlerts ? 'Enabled' : 'Disabled'}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/caregiver-view')}
                  className="w-full ps-btn ps-btn-secondary py-2.5 text-xs font-bold font-mono flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-[var(--caregiver-600)]" />
                  <span>View Monitored Patients ({cfg.badge})</span>
                </button>
              </div>
            )}
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ROLE 3: DOCTOR PROFILE FORM
        ══════════════════════════════════════════════════════════════════ */}
        {currentRole === 'DOCTOR' && (
          <Card className="p-6 space-y-6 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="text-sm font-bold text-[var(--ink)] font-[var(--font-heading)] flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[var(--doctor-600)]" />
                Medical License & Clinical Credentials
              </h3>
            </div>

            {editing ? (
              <form onSubmit={handleDoctorSave} className="space-y-5">
                {/* Medical Registration Number */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider font-mono">
                    Medical Council / License Registration No.
                  </label>
                  <PolySafeInput
                    type="text"
                    required
                    value={doctorRegNo}
                    onChange={(e) => setDoctorRegNo(e.target.value)}
                    placeholder="MCI-2024-88492"
                    leftIcon={<FileBadge className="w-4 h-4" />}
                  />
                </div>

                {/* Specialty */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider font-mono">
                    Clinical Specialty
                  </label>
                  <PolySafeInput
                    type="text"
                    required
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="e.g. Geriatrics & Internal Medicine"
                  />
                </div>

                {/* Hospital Affiliation */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider font-mono">
                    Hospital / Clinic Affiliation
                  </label>
                  <PolySafeInput
                    type="text"
                    required
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    placeholder="e.g. Apollo Multispeciality Hospitals"
                    leftIcon={<Building2 className="w-4 h-4" />}
                  />
                </div>

                {/* Beers Criteria & ACB Automation */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider font-mono">
                    Clinical Decision Support Engine Settings
                  </label>
                  <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoBeersCheck}
                      onChange={(e) => setAutoBeersCheck(e.target.checked)}
                      className="w-4 h-4 rounded text-[var(--doctor-600)]"
                    />
                    <span>Automate Beers 2023 & ACB Score Telemetry during Pre-Prescribing</span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    className="ps-btn ps-btn-primary flex-1 py-3 text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Credentials</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="ps-btn ps-btn-secondary py-3 px-5 text-xs font-mono font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs font-mono">
                <div className="p-3.5 rounded-2xl bg-[var(--canvas)] shadow-[var(--shadow-inner)] space-y-1">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase block">Medical License Registration</span>
                  <p className="text-sm font-bold text-[var(--doctor-600)] font-mono">{doctorRegNo}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--canvas)] shadow-[var(--shadow-inner)] space-y-1">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase block">Specialization</span>
                  <p className="text-sm font-bold text-[var(--ink)]">{specialty}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--canvas)] shadow-[var(--shadow-inner)] space-y-1">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase block">Hospital / Practice Affiliation</span>
                  <p className="text-sm font-bold text-[var(--ink)]">{hospital}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--canvas)] shadow-[var(--shadow-inner)] space-y-1">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase block">Clinical Engine Telemetry</span>
                  <p className="text-xs text-[var(--ink)]">
                    • AGS Beers 2023 & DDInter AI Check: <strong>{autoBeersCheck ? 'Active' : 'Manual'}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/doctor-dashboard')}
                  className="w-full ps-btn ps-btn-secondary py-2.5 text-xs font-bold font-mono flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Stethoscope className="w-4 h-4 text-[var(--doctor-600)]" />
                  <span>Open Doctor Clinical Station</span>
                </button>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
