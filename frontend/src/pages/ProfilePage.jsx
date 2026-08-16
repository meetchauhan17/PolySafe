import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowLeft, User, ShieldCheck, Edit3, Save, X,
  Lock, Mail, Calendar, Activity, AlertCircle,
  Loader2, CheckCircle2, Info,
} from 'lucide-react';
import Card from '../components/Card';
import { notify } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

// ─── Condition options ──────────────────────────────────────────────────────
const CONDITION_OPTIONS = [
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'kidney', label: 'Kidney Issues' },
  { id: 'liver', label: 'Liver Issues' },
  { id: 'heart', label: 'Heart Condition' },
  { id: 'none', label: 'None of the above' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, token, logout } = useAuth();

  const [editing, setEditing] = useState(false);
  const [age, setAge] = useState('');
  const [conditions, setConditions] = useState([]);
  const [allergiesText, setAllergiesText] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  // ─── Fetch current profile ───────────────────────────────────────────────
  const { data: profile, isLoading } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: () => axios.get('/patient/profile').then((r) => r.data.patient),
    enabled: !!token,
  });

  // Sync fetched profile into form state
  useEffect(() => {
    if (profile) {
      setAge(profile.age?.toString() || '');
      setConditions(profile.conditions || []);
      setAllergiesText((profile.allergies || []).join(', '));
    }
  }, [profile]);

  const toggleCondition = (id) => {
    setConditions((prev) => {
      if (id === 'none') return ['none'];
      const without = prev.filter((c) => c !== 'none');
      if (without.includes(id)) return without.filter((c) => c !== id);
      return [...without, id];
    });
  };

  // ─── Save mutation ────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (body) => axios.post('/patient/profile', body).then((r) => r.data),
    onSuccess: () => {
      setErrorMsg(null);
      setEditing(false);
      queryClient.invalidateQueries(['patient-profile']);
      notify.success('Profile Updated', 'Your safety profile has been saved.');
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || 'Failed to save profile.';
      setErrorMsg(msg);
      notify.error('Save Failed', msg);
    },
  });

  const handleSave = (e) => {
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
    saveMutation.mutate({ age: parsedAge, conditions, allergies: allergiesArr });
  };

  const handleCancelEdit = () => {
    // Reset to fetched values
    if (profile) {
      setAge(profile.age?.toString() || '');
      setConditions(profile.conditions || []);
      setAllergiesText((profile.allergies || []).join(', '));
    }
    setEditing(false);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-[88vh] bg-[#EDE8DC] pb-12">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/home')}
            className="btn-secondary p-2.5 rounded-2xl"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1C2B27]" style={{ fontFamily: "'Fraunces', serif" }}>
              My Profile
            </h1>
            <p className="text-xs text-[#5C6B64]">Manage your medication safety profile</p>
          </div>
        </div>

        {/* ── Account info (read-only) ──────────────────────────────────── */}
        <Card title="Account" icon={<User className="w-4 h-4 text-[#2B6E5E]" />} className="space-y-3">
          <div className="space-y-2.5">
            {user?.name && (
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-[#6B726C] font-semibold uppercase tracking-wider">Name</p>
                  <p className="text-sm font-bold text-[#232724]">{user.name}</p>
                </div>
              </div>
            )}
            {user?.email && (
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-[#6B726C] font-semibold uppercase tracking-wider">Email</p>
                  <p className="text-sm font-bold text-[#232724]">{user.email}</p>
                </div>
              </div>
            )}
          </div>
          <div className="p-3 bg-[#F5F0E8] border border-[#E7E1D3] rounded-xl flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 text-[#6B726C] flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#6B726C] leading-relaxed">
              Account details are managed by PolySafe and cannot be changed here. To change your password, sign out and use "Forgot Password" on the login page.
            </p>
          </div>
        </Card>

        {/* ── Health Profile ──────────────────────────────────────────────── */}
        {isLoading ? (
          <Card className="space-y-3 animate-pulse">
            <div className="h-4 bg-[#D8D2C4] rounded w-1/3" />
            <div className="h-3 bg-[#D8D2C4] rounded w-full" />
            <div className="h-3 bg-[#D8D2C4] rounded w-2/3" />
          </Card>
        ) : (
          <form onSubmit={handleSave}>
            <Card
              title="Health Profile"
              icon={<Activity className="w-4 h-4 text-[#2B6E5E]" />}
              badge={
                !editing && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl btn-secondary"
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit
                  </button>
                )
              }
              className="space-y-4"
            >
              {errorMsg && (
                <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              {/* Age */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-widest text-[#6B726C]">
                  Age
                </label>
                {editing ? (
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="input-field w-32 text-sm"
                    placeholder="e.g. 42"
                  />
                ) : (
                  <p className="text-sm font-bold text-[#232724]">
                    {profile?.age ? `${profile.age} years` : <span className="text-[#9CA3AF] italic">Not set</span>}
                  </p>
                )}
              </div>

              {/* Conditions */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold uppercase tracking-widest text-[#6B726C]">
                  Known Health Conditions
                </label>
                {editing ? (
                  <div className="flex flex-wrap gap-2">
                    {CONDITION_OPTIONS.map((opt) => {
                      const active = conditions.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleCondition(opt.id)}
                          className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all ${
                            active
                              ? 'bg-[#2B6E5E] text-white border-[#2B6E5E] shadow-sm'
                              : 'bg-[#EDE8DC] text-[#5C6B64] border-[#D8D2C4] hover:border-[#2B6E5E]/40'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {(profile?.conditions || []).length === 0 ? (
                      <span className="text-sm text-[#9CA3AF] italic">None selected</span>
                    ) : (
                      (profile?.conditions || []).map((c) => {
                        const label = CONDITION_OPTIONS.find((o) => o.id === c)?.label || c;
                        return (
                          <span key={c} className="text-xs font-bold px-3 py-1 rounded-full bg-[#E4F2E9] text-[#2B6E5E] border border-[#2F8558]/30">
                            {label}
                          </span>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Allergies */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-widest text-[#6B726C]">
                  Known Allergies
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={allergiesText}
                    onChange={(e) => setAllergiesText(e.target.value)}
                    placeholder="e.g. Penicillin, Sulfa drugs (comma-separated)"
                    className="input-field text-sm"
                  />
                ) : (
                  <p className="text-sm text-[#232724]">
                    {(profile?.allergies || []).length === 0 ? (
                      <span className="text-[#9CA3AF] italic">None on record</span>
                    ) : (
                      (profile?.allergies || []).join(', ')
                    )}
                  </p>
                )}
              </div>

              {editing && (
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="btn-secondary flex-1 py-2.5 text-sm"
                    disabled={saveMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1 py-2.5 text-sm"
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              )}
            </Card>
          </form>
        )}

        {/* ── Safety notice ──────────────────────────────────────────────── */}
        <div className="flex items-start gap-2.5 p-4 bg-[#F5F0E8] border border-[#E7E1D3] rounded-2xl">
          <Info className="w-4 h-4 text-[#6B726C] flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#6B726C] leading-relaxed">
            <strong className="text-[#232724]">Why does this matter?</strong> Your age, conditions, and allergies are used by PolySafe's safety engine to personalise drug interaction checks and anticholinergic burden calculations. Keeping this accurate improves your safety alerts.
          </p>
        </div>

        {/* ── Danger zone ─────────────────────────────────────────────────── */}
        <Card className="space-y-3 border-rose-200">
          <p className="text-xs font-extrabold uppercase tracking-widest text-rose-600">Account Actions</p>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            className="w-full py-3 text-sm font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl hover:bg-rose-100 transition-colors"
          >
            Sign Out of PolySafe
          </button>
        </Card>

      </div>
    </div>
  );
}
