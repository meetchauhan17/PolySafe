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
  FileBadge, Bell, Users, Shield, Save, X
} from 'lucide-react';
import Card from '../components/Card';
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
      color: 'var(--role-patient)',
      accentBg: 'bg-[var(--role-patient)]/10 text-[var(--role-patient)]',
      badge: 'PATIENT PORTAL',
    },
    CAREGIVER: {
      title: 'Caregiver Oversight Profile',
      subtitle: 'Manage family contact info and safety alert preferences',
      icon: HeartHandshake,
      color: 'var(--role-caregiver)',
      accentBg: 'bg-[var(--role-caregiver)]/10 text-[var(--role-caregiver)]',
      badge: 'VERIFIED CAREGIVER',
    },
    DOCTOR: {
      title: 'Physician Clinical Profile',
      subtitle: 'Manage your medical license, specialty, and clinical settings',
      icon: Stethoscope,
      color: 'var(--role-doctor)',
      accentBg: 'bg-[var(--role-doctor)]/10 text-[var(--role-doctor)]',
      badge: 'LICENSED CLINICIAN',
    },
  };

  const cfg = roleConfigs[currentRole] || roleConfigs.PATIENT;
  const RoleIcon = cfg.icon;

  return (
    <div className="min-h-[88vh] bg-[var(--chassis)] pb-12">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(getBackPath())}
              className="btn-secondary p-2.5 rounded-2xl cursor-pointer"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[var(--text-primary)] font-display">
                  {cfg.title}
                </h1>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-current ${cfg.accentBg}`}>
                  {cfg.badge}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">{cfg.subtitle}</p>
            </div>
          </div>

          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn-primary py-2 px-3.5 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* ── Global Error Banner ───────────────────────────────────────── */}
        {errorMsg && (
          <div className="p-4 bg-[var(--chassis)] border-2 border-[var(--led-critical)]/30 rounded-2xl flex items-start space-x-3 text-[var(--led-critical)] text-sm shadow-xs font-mono">
            <AlertCircle className="w-5 h-5 text-[var(--led-critical)] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* ── Account Information Card (Common across all 3 roles) ─────── */}
        <Card className="p-6 space-y-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center space-x-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-[var(--shadow-sm)]"
              style={{ backgroundColor: cfg.color }}
            >
              <RoleIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-[var(--text-primary)] font-display truncate">
                {user?.name || 'PolySafe User'}
              </h2>
              <p className="text-xs text-[var(--text-muted)] font-mono flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                <span>{user?.email || '—'}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--chassis-dark)] text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-[var(--chassis)] shadow-[var(--shadow-recessed)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase block">Account Role</span>
              <strong className="text-[var(--text-primary)] font-bold">{currentRole}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--chassis)] shadow-[var(--shadow-recessed)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase block">Status</span>
              <strong className="text-[var(--led-safe)] font-bold flex items-center gap-1">
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
              <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-primary)]" />
              <span className="text-xs font-mono text-[var(--text-muted)]">Loading clinical profile...</span>
            </Card>
          ) : (
            <Card className="p-6 space-y-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--chassis-dark)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)] font-display flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[var(--role-patient)]" />
                  Clinical & Safety Demographics
                </h3>
              </div>

              {editing ? (
                <form onSubmit={handlePatientSave} className="space-y-5">
                  {/* Age Field */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
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
                    <p className="text-[11px] text-[var(--text-muted)] font-mono">
                      Used for Beers Criteria 2023 anticholinergic risk and renal clearance threshold calculations.
                    </p>
                  </div>

                  {/* Conditions Pills */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
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
                                ? 'bg-[var(--role-patient)] text-white shadow-xs'
                                : 'bg-[var(--chassis)] text-[var(--text-muted)] shadow-[var(--shadow-sm)] hover:text-[var(--text-primary)]'
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
                    <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
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
                      className="btn-primary flex-1 py-3 text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {patientSaveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Save Changes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="btn-secondary py-3 px-5 text-xs font-mono font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-xs font-mono">
                  <div className="p-3.5 rounded-2xl bg-[var(--chassis)] shadow-[var(--shadow-recessed)] space-y-1">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block">Age</span>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{age || 'Not configured'} years</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--chassis)] shadow-[var(--shadow-recessed)] space-y-1.5">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block">Active Medical Conditions</span>
                    <div className="flex flex-wrap gap-1.5">
                      {conditions.length > 0 ? (
                        conditions.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-[var(--role-patient)]/15 text-[var(--role-patient)] font-bold text-[11px]">
                            {c}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-[var(--text-muted)] italic">None listed</p>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--chassis)] shadow-[var(--shadow-recessed)] space-y-1">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block">Documented Drug Allergies</span>
                    <p className="text-xs font-bold text-[var(--text-primary)]">{allergiesText || 'No known drug allergies'}</p>
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
          <Card className="p-6 space-y-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--chassis-dark)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)] font-display flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-[var(--role-caregiver)]" />
                Caregiver Preferences & Contact Info
              </h3>
            </div>

            {editing ? (
              <form onSubmit={handleCaregiverSave} className="space-y-5">
                {/* Emergency Contact Phone */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
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
                  <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
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
                  <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
                    Notification Preferences
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyDoseReminders}
                        onChange={(e) => setNotifyDoseReminders(e.target.checked)}
                        className="w-4 h-4 rounded text-[var(--role-caregiver)]"
                      />
                      <span>Receive Daily Dose Check-in Confirmations</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyCriticalAlerts}
                        onChange={(e) => setNotifyCriticalAlerts(e.target.checked)}
                        className="w-4 h-4 rounded text-[var(--role-caregiver)]"
                      />
                      <span>Immediate SMS / Email for Critical Drug Flags</span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    className="btn-primary flex-1 py-3 text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Preferences</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="btn-secondary py-3 px-5 text-xs font-mono font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs font-mono">
                <div className="p-3.5 rounded-2xl bg-[var(--chassis)] shadow-[var(--shadow-recessed)] space-y-1">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block">Emergency Contact Phone</span>
                  <p className="text-sm font-bold text-[var(--text-primary)]">{caregiverPhone}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--chassis)] shadow-[var(--shadow-recessed)] space-y-1">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block">Relationship to Dependent</span>
                  <p className="text-sm font-bold text-[var(--text-primary)]">{relationship}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--chassis)] shadow-[var(--shadow-recessed)] space-y-2">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block">Alert Channels</span>
                  <div className="space-y-1">
                    <p className="text-xs text-[var(--text-primary)]">
                      • Daily Dose Reminders: <strong>{notifyDoseReminders ? 'Enabled' : 'Disabled'}</strong>
                    </p>
                    <p className="text-xs text-[var(--text-primary)]">
                      • Critical Interaction Alerts: <strong>{notifyCriticalAlerts ? 'Enabled' : 'Disabled'}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/caregiver-view')}
                  className="w-full btn-secondary py-2.5 text-xs font-bold font-mono flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-[var(--role-caregiver)]" />
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
          <Card className="p-6 space-y-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--chassis-dark)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)] font-display flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[var(--role-doctor)]" />
                Medical License & Clinical Credentials
              </h3>
            </div>

            {editing ? (
              <form onSubmit={handleDoctorSave} className="space-y-5">
                {/* Medical Registration Number */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
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
                  <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
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
                  <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
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
                  <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
                    Clinical Decision Support Engine Settings
                  </label>
                  <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoBeersCheck}
                      onChange={(e) => setAutoBeersCheck(e.target.checked)}
                      className="w-4 h-4 rounded text-[var(--role-doctor)]"
                    />
                    <span>Automate Beers 2023 & ACB Score Telemetry during Pre-Prescribing</span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    className="btn-primary flex-1 py-3 text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Credentials</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="btn-secondary py-3 px-5 text-xs font-mono font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs font-mono">
                <div className="p-3.5 rounded-2xl bg-[var(--chassis)] shadow-[var(--shadow-recessed)] space-y-1">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block">Medical License Registration</span>
                  <p className="text-sm font-bold text-[var(--role-doctor)] font-mono">{doctorRegNo}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--chassis)] shadow-[var(--shadow-recessed)] space-y-1">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block">Specialization</span>
                  <p className="text-sm font-bold text-[var(--text-primary)]">{specialty}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--chassis)] shadow-[var(--shadow-recessed)] space-y-1">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block">Hospital / Practice Affiliation</span>
                  <p className="text-sm font-bold text-[var(--text-primary)]">{hospital}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--chassis)] shadow-[var(--shadow-recessed)] space-y-1">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block">Clinical Engine Telemetry</span>
                  <p className="text-xs text-[var(--text-primary)]">
                    • AGS Beers 2023 & DDInter AI Check: <strong>{autoBeersCheck ? 'Active' : 'Manual'}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/doctor-dashboard')}
                  className="w-full btn-secondary py-2.5 text-xs font-bold font-mono flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Stethoscope className="w-4 h-4 text-[var(--role-doctor)]" />
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
