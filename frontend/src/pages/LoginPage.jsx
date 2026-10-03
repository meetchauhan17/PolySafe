import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { 
  User, 
  HeartHandshake, 
  Stethoscope, 
  ArrowRight, 
  ArrowLeft, 
  Mail, 
  Lock, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  Shield,
  Activity,
  Sparkles,
  RefreshCw,
  KeyRound,
  Compass,
  Check,
  X,
  LogIn,
  UserPlus,
  Zap,
} from 'lucide-react';
import { authApi } from '../api/auth';
import PageTransition from '../components/PageTransition';
import { notify } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import PolySafeInput from '../components/PolySafeInput';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, token, login, enterGuestMode } = useAuth();


  // ─── On Mount: Redirect already authenticated sessions (replace: true) ─────
  useEffect(() => {
    if (user && !user.isGuest && token) {
      const userRole = (user.role || 'PATIENT').toUpperCase();
      if (userRole === 'DOCTOR') {
        navigate('/doctor-dashboard', { replace: true });
      } else if (userRole === 'CAREGIVER') {
        navigate('/caregiver-view', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    }
  }, [user, token, navigate]);

  // Selected Role: null | 'PATIENT' | 'CAREGIVER' | 'DOCTOR'
  const [selectedRole, setSelectedRole] = useState(null);

  // Auth Mode: 'login' (Sign In) | 'signup' (Create Account) | 'otp' (Verify OTP)
  const [authMode, setAuthMode] = useState('login');

  // Global error message displayed in the error banner
  const [errorMsg, setErrorMsg] = useState(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [doctorRegNum, setDoctorRegNum] = useState('');
  const [doctorRegNumTouched, setDoctorRegNumTouched] = useState(false);

  // Lockout State
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [lockoutSecsLeft, setLockoutSecsLeft] = useState(0);

  // ─── Real-time 1-Second Countdown for Lockout ──────────────────────────────
  useEffect(() => {
    if (!lockoutUntil) {
      setLockoutSecsLeft(0);
      return;
    }

    const calcSecs = () => {
      const ms = new Date(lockoutUntil).getTime() - Date.now();
      const secs = ms > 0 ? Math.ceil(ms / 1000) : 0;
      setLockoutSecsLeft(secs);
      if (secs <= 0) {
        setLockoutUntil(null);
        setErrorMsg(null);
      }
    };

    calcSecs();
    const interval = setInterval(calcSecs, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  // OTP state (only used in 'otp' mode)
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [devOtpHint, setDevOtpHint] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const countdownTimerRef = useRef(null);
  const otpInputRefs = useRef([]);

  // Remind Me state
  const [remindMe, setRemindMe] = useState(() => {
    return localStorage.getItem('polysafe_remind_me') !== 'false';
  });

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('polysafe_saved_email');
    if (savedEmail) setEmail(savedEmail);
  }, []);

  // ─── Countdown Timer for OTP Resend ─────────────────────────────────────────
  useEffect(() => {
    if (authMode === 'otp' && countdown > 0) {
      countdownTimerRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      clearTimeout(countdownTimerRef.current);
    }
    return () => clearTimeout(countdownTimerRef.current);
  }, [authMode, countdown]);

  // ─── Signup password strength calculation ───────────────────────────────────
  const calcStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'Empty', color: '#94a3b8', hasLen: false, hasNum: false, hasSpecial: false };
    const hasLen = pwd.length >= 8;
    const hasNum = /\d/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd) || /[A-Z]/.test(pwd);
    let score = 0;
    if (hasLen) score++;
    if (hasNum) score++;
    if (hasSpecial) score++;
    let label = 'Weak', color = '#ef4444';
    if (score === 2) { label = 'Moderate'; color = '#f59e0b'; }
    else if (score === 3) { label = 'Strong'; color = '#10b981'; }
    return { score, label, color, hasLen, hasNum, hasSpecial };
  };

  const passwordStrength = useMemo(() => calcStrength(password), [password]);

  // Field validation errors
  const emailError = useMemo(() => {
    if (!emailTouched) return null;
    const trimmed = email.trim();
    if (!trimmed) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Enter a valid email address.';
    return null;
  }, [email, emailTouched]);

  const passwordError = useMemo(() => {
    if (!passwordTouched) return null;
    if (!password) return 'Password is required.';
    if (authMode === 'signup' && password.length < 8) return 'Password must be at least 8 characters.';
    return null;
  }, [password, passwordTouched, authMode]);

  const nameError = useMemo(() => {
    if (!nameTouched || authMode !== 'signup') return null;
    if (!name.trim() || name.trim().length < 2) return 'Full name must be at least 2 characters.';
    return null;
  }, [name, nameTouched, authMode]);

  const doctorRegNumError = useMemo(() => {
    if (!doctorRegNumTouched || authMode !== 'signup' || selectedRole !== 'DOCTOR') return null;
    if (!doctorRegNum.trim() || doctorRegNum.trim().length < 3) return 'Medical registration number is required.';
    return null;
  }, [doctorRegNum, doctorRegNumTouched, authMode, selectedRole]);

  // ─── Auth Success Handler ──────────────────────────────────────────────────
  const handleAuthSuccess = (data, isNewUser) => {
    setErrorMsg(null);
    if (remindMe) {
      localStorage.setItem('polysafe_saved_email', email.trim());
    } else {
      localStorage.removeItem('polysafe_saved_email');
    }
    const role = (data.user?.role || selectedRole || 'PATIENT').toUpperCase();
    if (data.token) {
      login(data.token, role, data.user);
    }
    notify.success('Welcome to PolySafe', isNewUser ? 'Your account has been verified and created.' : 'Signed in successfully.');
    if (role === 'DOCTOR') {
      navigate('/doctor-dashboard', { replace: true });
    } else if (role === 'CAREGIVER') {
      navigate('/caregiver-view', { replace: true });
    } else if (isNewUser || !data.user?.patient) {
      navigate('/onboarding', { replace: true });
    } else {
      navigate('/home', { replace: true });
    }
  };

  // ─── Mutations ────────────────────────────────────────────────────────────

  // 1. Send OTP Mutation (New Registration only)
  const signupSendOtpMutation = useMutation({
    mutationFn: ({ name, email, password, role, registrationNumber }) => 
      authApi.signupSendOtp({ name, email, password, role, registrationNumber }),
    onSuccess: (data) => {
      setErrorMsg(null);
      setOtp(['', '', '', '', '', '']);
      setCountdown(30);
      setAuthMode('otp');
      notify.success('Verification Code Dispatched', `A 6-digit code was emailed to ${email.trim()}.`);
      if (data._devOtp) setDevOtpHint(data._devOtp);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Failed to send verification code.';
      setErrorMsg(msg);
      notify.error('Send Failed', msg);
    },
  });

  // 2. Verify OTP Mutation (New Registration only)
  const verifySignupOtpMutation = useMutation({
    mutationFn: ({ email, code }) => authApi.verifySignupOtp({ email, code }),
    onSuccess: (data) => handleAuthSuccess(data, true),
    onError: (err) => {
      const msg = err.response?.data?.error || 'Invalid or expired verification code.';
      setErrorMsg(msg);
      notify.error('Verification Failed', msg);
    },
  });

  // 3. Login Mutation (Sign In with password — zero OTP)
  const loginMutation = useMutation({
    mutationFn: ({ email, password, role }) => authApi.patientLogin({ email, password, role }),
    onSuccess: (data) => handleAuthSuccess(data, false),
    onError: (err) => {
      const errData = err.response?.data;
      const msg = errData?.error || 'Invalid email or password.';
      if (errData?.lockedUntil) setLockoutUntil(errData.lockedUntil);
      setErrorMsg(msg);
      notify.error('Sign In Failed', msg);
    },
  });

  // ─── Form Handlers ────────────────────────────────────────────────────────

  const resetFormState = () => {
    setPassword('');
    setPasswordTouched(false);
    setName('');
    setNameTouched(false);
    setDoctorRegNum('');
    setDoctorRegNumTouched(false);
    setLockoutUntil(null);
    setOtp(['', '', '', '', '', '']);
    setDevOtpHint(null);
    setErrorMsg(null);
  };

  const handleSignInSubmit = (e) => {
    e?.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);
    setErrorMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    loginMutation.mutate({ email: cleanEmail, password, role: selectedRole || 'PATIENT' });
  };

  const handleSignUpSubmit = (e) => {
    e?.preventDefault();
    setEmailTouched(true);
    setNameTouched(true);
    setPasswordTouched(true);
    setDoctorRegNumTouched(true);
    setErrorMsg(null);

    const cleanEmail = email.trim();
    const cleanName = name.trim();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!cleanName || cleanName.length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (selectedRole === 'DOCTOR' && (!doctorRegNum.trim() || doctorRegNum.trim().length < 3)) {
      setErrorMsg('Please enter your medical registration / license number.');
      return;
    }
    if (!password || password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }

    signupSendOtpMutation.mutate({
      name: cleanName,
      email: cleanEmail,
      password,
      role: selectedRole || 'PATIENT',
      registrationNumber: selectedRole === 'DOCTOR' ? doctorRegNum.trim() : undefined,
    });
  };

  const handleResendOtp = () => {
    setErrorMsg(null);
    setOtp(['', '', '', '', '', '']);
    setCountdown(30);
    signupSendOtpMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      password,
      role: selectedRole || 'PATIENT',
      registrationNumber: selectedRole === 'DOCTOR' ? doctorRegNum.trim() : undefined,
    });
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, idx) => {
        if (index + idx < 6) {
          newOtp[index + idx] = d;
        }
      });
      setOtp(newOtp);
      const nextFocus = Math.min(index + digits.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setErrorMsg(null);
    const code = otp.join('');
    if (code.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      notify.warning('Code Incomplete', 'Please enter all 6 digits.');
      return;
    }
    verifySignupOtpMutation.mutate({
      email: email.trim(),
      code,
    });
  };

  const roleLabels = {
    PATIENT: { 
      title: 'Patient Portal', 
      subtitle: 'Self medication tracking & real-time interaction safety', 
      accentGradient: 'from-sky-500 to-blue-600',
      badge: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
      btnGradient: 'from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500',
    },
    CAREGIVER: { 
      title: 'Family & Caregiver', 
      subtitle: 'Schedule adherence monitoring & safety status check-ins', 
      accentGradient: 'from-emerald-500 to-teal-600',
      badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
      btnGradient: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500',
    },
    DOCTOR: { 
      title: 'Doctor & Clinician', 
      subtitle: 'Clinical longitudinal oversight, Beers deprescribing & EHR notes', 
      accentGradient: 'from-blue-600 to-indigo-600',
      badge: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/30',
      btnGradient: 'from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500',
    },
  };

  return (
    <PageTransition className="relative min-h-screen bg-[var(--canvas)] text-[var(--ink)] flex flex-col justify-between overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* ── Background Precision Dot Matrix ── */}
      <div className="absolute inset-0 bg-[radial-gradient(#c7d2fe_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* ── Atmospheric Ambient Lighting Orbs ── */}
      <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-b from-blue-600/15 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 -left-48 w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-48 w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── Top Floating Navigation Bar ── */}
      <header className="relative w-full max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-[var(--ink)] font-[var(--font-heading)]">
              Poly<span className="bg-gradient-to-r from-[var(--brand-600)] to-[var(--doctor-600)] bg-clip-text text-transparent">Safe</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--ink-3)] uppercase tracking-widest -mt-0.5">
              Clinical Polypharmacy AI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Live System Indicator */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface)]/80 backdrop-blur-md border border-[var(--border)] text-[11px] font-semibold text-[var(--ink-2)] shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="hidden sm:inline">Clinical Engine v2.4</span>
            <span className="sm:hidden">v2.4</span>
          </div>

        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-4 sm:py-8">
        <div className={`w-full transition-all duration-300 ${selectedRole ? 'max-w-md' : 'max-w-5xl'}`}>

          {/* ── Hero Brand Header (Only shown when no portal is selected) ── */}
          {!selectedRole && (
            <div className="text-center space-y-3 mb-8 sm:mb-10">
              
              {/* Top Pill Status */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface)]/90 backdrop-blur-md border border-[var(--border)] shadow-xs">
                <Zap className="w-3.5 h-3.5 text-[var(--brand-600)]" />
                <span className="text-[11px] font-bold tracking-wider uppercase text-[var(--ink-2)] font-mono">
                  Continuous Clinical Safety Architecture
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--ink)] font-[var(--font-heading)]">
                Select Your <span className="bg-gradient-to-r from-[var(--brand-600)] via-indigo-600 to-[var(--doctor-600)] bg-clip-text text-transparent">Access Portal</span>
              </h1>

              <p className="text-xs sm:text-sm text-[var(--ink-2)] max-w-xl mx-auto leading-relaxed">
                AI-powered multi-drug interaction intelligence, Beers deprescribing guidance, and cognitive anticholinergic burden monitoring.
              </p>

              {/* Trust Metrics Chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 bg-[var(--surface)]/80 backdrop-blur-xs px-3.5 py-1 rounded-full border border-[var(--border)] text-[11px] font-semibold text-[var(--ink-2)] shadow-2xs">
                  <Shield className="w-3.5 h-3.5 text-[var(--brand-600)]" />
                  222K+ Interaction Rules
                </span>
                <span className="inline-flex items-center gap-1.5 bg-[var(--surface)]/80 backdrop-blur-xs px-3.5 py-1 rounded-full border border-[var(--border)] text-[11px] font-semibold text-[var(--ink-2)] shadow-2xs">
                  <Activity className="w-3.5 h-3.5 text-[var(--safe-fg)]" />
                  Real-Time ACB Radar
                </span>
                <span className="inline-flex items-center gap-1.5 bg-[var(--surface)]/80 backdrop-blur-xs px-3.5 py-1 rounded-full border border-[var(--border)] text-[11px] font-semibold text-[var(--ink-2)] shadow-2xs">
                  <Lock className="w-3.5 h-3.5 text-[var(--doctor-600)]" />
                  Zero-Trust RBAC
                </span>
              </div>
            </div>
          )}

          {/* ── Global Error Alert ── */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-500/40 rounded-2xl flex items-start space-x-3 text-rose-700 text-sm animate-fadeIn shadow-md">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1 font-mono">
                <p className="font-semibold">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 0: 3-COLUMN CLINICAL PORTAL SELECTION (EXPANDED VIEW)
          ══════════════════════════════════════════════════════════════════ */}
          {!selectedRole && (
            <div className="space-y-6">
              
              {/* 3-Column Role Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                
                {/* ── Portal 1: Patient ── */}
                <div
                  onClick={() => {
                    setSelectedRole('PATIENT');
                    setAuthMode('login');
                    resetFormState();
                  }}
                  className="group relative bg-[var(--surface)]/95 backdrop-blur-xl rounded-3xl p-6 sm:p-7 flex flex-col justify-between border border-[var(--border)] hover:border-sky-500/60 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1.5 active:scale-[0.99] cursor-pointer transition-all duration-300"
                >
                  {/* Glowing Top Accent Line */}
                  <div className="absolute top-0 left-6 right-6 h-1 bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500 rounded-b-full opacity-70 group-hover:opacity-100 transition-opacity" />

                  <div className="space-y-5">
                    {/* Role Header with Squircle Icon & Badge */}
                    <div className="flex items-center justify-between">
                      <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-sky-500/10 to-blue-500/20 text-sky-600 border border-sky-500/30 flex items-center justify-center group-hover:scale-105 group-hover:bg-gradient-to-tr group-hover:from-sky-500 group-hover:to-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                        <User className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-700 border border-sky-500/25 px-2.5 py-1 rounded-full font-mono">
                        Personal Care
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-[var(--ink)] group-hover:text-sky-600 transition-colors font-[var(--font-heading)]">
                        Patient Portal
                      </h3>
                      <p className="text-xs text-[var(--ink-2)] mt-1.5 leading-relaxed">
                        Track daily prescriptions, OTC & herbal remedies, and receive instant interaction warnings.
                      </p>
                    </div>

                    {/* Feature Checklist */}
                    <div className="space-y-2.5 pt-3 border-t border-[var(--border)] text-xs text-[var(--ink-2)]">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-sky-500 flex-shrink-0" />
                        <span>222K Drug-Drug interaction flags</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-sky-500 flex-shrink-0" />
                        <span>Anticholinergic cognitive load score</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-sky-500 flex-shrink-0" />
                        <span>Gemini Vision prescription scan</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Button */}
                  <div className="mt-6 pt-3 border-t border-[var(--border)]">
                    <div className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-xs flex items-center justify-between shadow-md shadow-sky-600/20 group-hover:shadow-lg group-hover:shadow-sky-600/30 transition-all">
                      <span>Enter Patient Portal</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* ── Portal 2: Family / Caregiver ── */}
                <div
                  onClick={() => {
                    setSelectedRole('CAREGIVER');
                    setAuthMode('login');
                    resetFormState();
                  }}
                  className="group relative bg-[var(--surface)]/95 backdrop-blur-xl rounded-3xl p-6 sm:p-7 flex flex-col justify-between border border-[var(--border)] hover:border-emerald-500/60 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1.5 active:scale-[0.99] cursor-pointer transition-all duration-300"
                >
                  {/* Glowing Top Accent Line */}
                  <div className="absolute top-0 left-6 right-6 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 rounded-b-full opacity-70 group-hover:opacity-100 transition-opacity" />

                  <div className="space-y-5">
                    {/* Role Header with Squircle Icon & Badge */}
                    <div className="flex items-center justify-between">
                      <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/20 text-emerald-600 border border-emerald-500/30 flex items-center justify-center group-hover:scale-105 group-hover:bg-gradient-to-tr group-hover:from-emerald-500 group-hover:to-teal-600 group-hover:text-white transition-all duration-300 shadow-sm">
                        <HeartHandshake className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 border border-emerald-500/25 px-2.5 py-1 rounded-full font-mono">
                        Family Proxy
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-[var(--ink)] group-hover:text-emerald-600 transition-colors font-[var(--font-heading)]">
                        Family / Caregiver
                      </h3>
                      <p className="text-xs text-[var(--ink-2)] mt-1.5 leading-relaxed">
                        Monitor loved ones' daily dose schedules and safety statuses without intrusive clinical notes.
                      </p>
                    </div>

                    {/* Feature Checklist */}
                    <div className="space-y-2.5 pt-3 border-t border-[var(--border)] text-xs text-[var(--ink-2)]">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>Daily dosage timing & schedule</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>High-level statuses (Safe/Caution)</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>Multi-patient family switcher</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Button */}
                  <div className="mt-6 pt-3 border-t border-[var(--border)]">
                    <div className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center justify-between shadow-md shadow-emerald-600/20 group-hover:shadow-lg group-hover:shadow-emerald-600/30 transition-all">
                      <span>Enter Caregiver Portal</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* ── Portal 3: Doctor / Clinician ── */}
                <div
                  onClick={() => {
                    setSelectedRole('DOCTOR');
                    setAuthMode('login');
                    resetFormState();
                  }}
                  className="group relative bg-[var(--surface)]/95 backdrop-blur-xl rounded-3xl p-6 sm:p-7 flex flex-col justify-between border border-[var(--border)] hover:border-indigo-500/60 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1.5 active:scale-[0.99] cursor-pointer transition-all duration-300"
                >
                  {/* Glowing Top Accent Line */}
                  <div className="absolute top-0 left-6 right-6 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600 rounded-b-full opacity-70 group-hover:opacity-100 transition-opacity" />

                  <div className="space-y-5">
                    {/* Role Header with Squircle Icon & Badge */}
                    <div className="flex items-center justify-between">
                      <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/20 text-indigo-600 border border-indigo-500/30 flex items-center justify-center group-hover:scale-105 group-hover:bg-gradient-to-tr group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                        <Stethoscope className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-700 border border-indigo-500/25 px-2.5 py-1 rounded-full font-mono">
                        Verified Clinician
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-[var(--ink)] group-hover:text-indigo-600 transition-colors font-[var(--font-heading)]">
                        Doctor / Clinician
                      </h3>
                      <p className="text-xs text-[var(--ink-2)] mt-1.5 leading-relaxed">
                        Longitudinal timelines, pre-prescribing safety simulations, and Beers deprescribing tools.
                      </p>
                    </div>

                    {/* Feature Checklist */}
                    <div className="space-y-2.5 pt-3 border-t border-[var(--border)] text-xs text-[var(--ink-2)]">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <span>Pre-prescribing risk simulator</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <span>Beers 2023 & STOPP/START v3</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <span>4-System organ toxicity radar</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Button */}
                  <div className="mt-6 pt-3 border-t border-[var(--border)]">
                    <div className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-between shadow-md shadow-indigo-600/20 group-hover:shadow-lg group-hover:shadow-indigo-600/30 transition-all">
                      <span>Enter Clinician Portal</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

              </div>

              {/* ── Horizontal Bottom Banner: Continue as Guest Explorer (Instant Demo) ── */}
              <div
                onClick={() => {
                  enterGuestMode();
                  notify.info('Demo Sandbox Active', 'Exploring PolySafe with pre-loaded clinical sample data.');
                  navigate('/home', { replace: true });
                }}
                className="group relative p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-200/80 hover:border-amber-400 shadow-[0_4px_16px_-4px_rgba(245,158,11,0.15)] hover:shadow-[0_12px_32px_-6px_rgba(245,158,11,0.25)] hover:-translate-y-0.5 active:scale-[0.99] flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300/80 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-sm">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-bold text-[var(--ink)] group-hover:text-amber-700 transition-colors font-[var(--font-heading)]">
                        Explore Live Without Registration
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300/80 font-mono">
                        <Sparkles className="w-3 h-3" />
                        Instant Sandbox
                      </span>
                    </div>
                    <p className="text-xs text-[var(--ink-3)] mt-1 leading-relaxed">
                      Test multi-drug interactions, cascade timelines, and 4-organ toxicity radar using pre-loaded geriatric polypharmacy profiles.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-amber-500/25 group-hover:shadow-lg transition-all flex-shrink-0">
                  <span>Launch Demo Sandbox</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              ROLE AUTH CARD (SIGN IN VS SIGN UP FORM MODAL VIEW)
          ══════════════════════════════════════════════════════════════════ */}
          {selectedRole && (
            <div className="bg-[var(--surface)]/95 backdrop-blur-2xl border border-[var(--border)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-[var(--shadow-lg)]">
              
              {/* Card Header: Back button + Role pill */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    if (authMode === 'otp') {
                      setAuthMode('signup');
                      setErrorMsg(null);
                    } else {
                      setSelectedRole(null);
                      resetFormState();
                    }
                  }}
                  className="group text-xs font-bold text-[var(--ink-3)] hover:text-[var(--brand-600)] flex items-center space-x-2 transition-colors cursor-pointer font-mono"
                >
                  <div className="w-7 h-7 rounded-lg bg-[var(--canvas)] flex items-center justify-center group-hover:bg-[var(--brand-600)]/10 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                  <span>{authMode === 'otp' ? 'Back to Form' : 'All Portals'}</span>
                </button>
                
                <span className={`text-xs font-bold px-3 py-1 rounded-full border font-mono shadow-xs ${roleLabels[selectedRole]?.badge}`}>
                  {roleLabels[selectedRole]?.title}
                </span>
              </div>

              {/* Segmented Switcher: Sign In vs Sign Up */}
              {authMode !== 'otp' && (
                <div className="flex items-center gap-1.5 p-1.5 bg-[var(--canvas)] border border-[var(--border)] rounded-2xl w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setErrorMsg(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      authMode === 'login'
                        ? 'bg-gradient-to-r from-[var(--brand-600)] to-[var(--doctor-600)] text-white shadow-sm'
                        : 'bg-transparent text-[var(--ink-3)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <LogIn className="w-4 h-4 flex-shrink-0" />
                    <span>Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setErrorMsg(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      authMode === 'signup'
                        ? 'bg-gradient-to-r from-[var(--brand-600)] to-[var(--doctor-600)] text-white shadow-sm'
                        : 'bg-transparent text-[var(--ink-3)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <UserPlus className="w-4 h-4 flex-shrink-0" />
                    <span>Create Account</span>
                  </button>
                </div>
              )}

              {/* ── 1. SIGN IN (LOGIN) FORM ── */}
              {authMode === 'login' && (
                <form onSubmit={handleSignInSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl text-[var(--ink)] font-bold font-[var(--font-heading)]">
                      {roleLabels[selectedRole]?.title} Sign In
                    </h2>
                    <p className="text-xs text-[var(--ink-3)] font-medium">
                      Enter your email and password to access your clinical dashboard.
                    </p>
                  </div>

                  {/* Lockout banner */}
                  {lockoutSecsLeft > 0 && (
                    <div className="p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl text-sm text-[var(--ink)] space-y-1 shadow-sm">
                      <div className="flex items-center gap-2 font-bold text-amber-700">
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        Account temporarily locked
                      </div>
                      <p className="text-xs text-[var(--ink-2)] pl-6">
                        Too many failed attempts. Try again in{' '}
                        <strong className="font-bold text-[var(--ink)]">
                          {lockoutSecsLeft} second{lockoutSecsLeft !== 1 ? 's' : ''}
                        </strong>.
                      </p>
                    </div>
                  )}

                  {/* Email Address */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[var(--ink-2)] uppercase tracking-wider">
                      Email Address
                    </label>
                    <PolySafeInput
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onBlur={() => setEmailTouched(true)}
                      onChange={(e) => { setEmail(e.target.value); if (errorMsg) setErrorMsg(null); }}
                      placeholder="name@example.com"
                      error={Boolean(emailError)}
                      leftIcon={<Mail className="w-4 h-4" />}
                      className="text-base"
                    />
                    {emailError && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />{emailError}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[var(--ink-2)] uppercase tracking-wider">
                      Password
                    </label>
                    <PolySafeInput
                      type="password"
                      required
                      value={password}
                      onBlur={() => setPasswordTouched(true)}
                      onChange={(e) => { setPassword(e.target.value); if (errorMsg) setErrorMsg(null); }}
                      placeholder="••••••••••••"
                      disabled={lockoutSecsLeft > 0}
                      error={Boolean(passwordError)}
                      leftIcon={<Lock className="w-4 h-4" />}
                      className="text-base"
                    />
                    {passwordError && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />{passwordError}
                      </p>
                    )}
                  </div>

                  {/* Remind Me */}
                  <div className="flex items-center pt-1">
                    <label className="flex items-center space-x-2 text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={remindMe}
                        onChange={(e) => { setRemindMe(e.target.checked); localStorage.setItem('polysafe_remind_me', String(e.target.checked)); }}
                        className="w-4 h-4 rounded text-[var(--brand-600)] focus:ring-[var(--brand-600)] border-[var(--border)] cursor-pointer"
                      />
                      <span className="font-medium text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
                        Remember email on this device
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loginMutation.isPending || lockoutSecsLeft > 0}
                    className={`w-full py-3.5 px-4 rounded-xl bg-gradient-to-r ${roleLabels[selectedRole]?.btnGradient || 'from-[var(--brand-600)] to-[var(--doctor-600)]'} text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50`}
                  >
                    {loginMutation.isPending ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /><span>Signing In...</span></>
                    ) : (
                      <><span>Sign In to {roleLabels[selectedRole]?.title}</span><ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>

                  {/* Switch to sign up */}
                  <p className="text-center text-xs text-[var(--ink-3)] font-medium pt-2">
                    New to PolySafe?{' '}
                    <button
                      type="button"
                      onClick={() => { setAuthMode('signup'); setErrorMsg(null); }}
                      className="font-bold text-[var(--brand-600)] hover:underline cursor-pointer"
                    >
                      Create a new account
                    </button>
                  </p>
                </form>
              )}

              {/* ── 2. SIGN UP FORM ── */}
              {authMode === 'signup' && (
                <form onSubmit={handleSignUpSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl text-[var(--ink)] font-bold font-[var(--font-heading)]">
                      Create {roleLabels[selectedRole]?.title} Account
                    </h2>
                    <p className="text-xs text-[var(--ink-3)] font-medium">
                      A 6-digit verification code will be sent to your email to verify your identity.
                    </p>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[var(--ink-2)] uppercase tracking-wider">
                      {selectedRole === 'DOCTOR' ? 'Physician Full Name' : 'Full Name'}
                    </label>
                    <PolySafeInput
                      type="text"
                      required
                      autoFocus
                      value={name}
                      onBlur={() => setNameTouched(true)}
                      onChange={(e) => { setName(e.target.value); if (errorMsg) setErrorMsg(null); }}
                      placeholder={selectedRole === 'DOCTOR' ? 'Dr. Priya Sharma, MD' : 'e.g. Priya Sharma'}
                      error={Boolean(nameError)}
                      leftIcon={<User className="w-4 h-4" />}
                      className="text-base"
                    />
                    {nameError && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />{nameError}
                      </p>
                    )}
                  </div>

                  {/* Doctor Medical Registration Number */}
                  {selectedRole === 'DOCTOR' && (
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Medical Registration / License No.
                      </label>
                      <PolySafeInput
                        type="text"
                        required
                        value={doctorRegNum}
                        onBlur={() => setDoctorRegNumTouched(true)}
                        onChange={(e) => { setDoctorRegNum(e.target.value); if (errorMsg) setErrorMsg(null); }}
                        placeholder="MCI-2024-88492"
                        error={Boolean(doctorRegNumError)}
                        leftIcon={<FileText className="w-4 h-4" />}
                        className="text-base"
                      />
                      {doctorRegNumError && (
                        <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />{doctorRegNumError}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Email Address */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Email Address
                    </label>
                    <PolySafeInput
                      type="email"
                      required
                      value={email}
                      onBlur={() => setEmailTouched(true)}
                      onChange={(e) => { setEmail(e.target.value); if (errorMsg) setErrorMsg(null); }}
                      placeholder="name@example.com"
                      error={Boolean(emailError)}
                      leftIcon={<Mail className="w-4 h-4" />}
                      className="text-base"
                    />
                    {emailError && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />{emailError}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Password (min. 8 characters)
                    </label>
                    <PolySafeInput
                      type="password"
                      required
                      value={password}
                      onBlur={() => setPasswordTouched(true)}
                      onChange={(e) => { setPassword(e.target.value); if (errorMsg) setErrorMsg(null); }}
                      placeholder="••••••••••••"
                      error={Boolean(passwordError)}
                      leftIcon={<Lock className="w-4 h-4" />}
                      className="text-base"
                    />
                    {passwordError && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />{passwordError}
                      </p>
                    )}
                    {/* Password strength meter */}
                    {password && (
                      <div className="mt-2 space-y-1.5 p-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-xs">
                        <div className="flex items-center justify-between font-medium">
                          <span className="text-slate-500">Password Strength:</span>
                          <span className="font-bold" style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${(passwordStrength.score / 3) * 100}%`, backgroundColor: passwordStrength.color }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-1 pt-1 text-[11px] text-slate-500 font-medium">
                          <div className="flex items-center gap-1">
                            {passwordStrength.hasLen ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-400" />}
                            <span className={passwordStrength.hasLen ? 'text-[var(--ink)] font-medium' : ''}>8+ characters</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {passwordStrength.hasNum ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-400" />}
                            <span className={passwordStrength.hasNum ? 'text-[var(--ink)] font-medium' : ''}>Contains number</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Remind Me */}
                  <div className="flex items-center pt-1">
                    <label className="flex items-center space-x-2 text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={remindMe}
                        onChange={(e) => { setRemindMe(e.target.checked); localStorage.setItem('polysafe_remind_me', String(e.target.checked)); }}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-[var(--border)] cursor-pointer"
                      />
                      <span className="font-medium text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
                        Remember email on this device
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={signupSendOtpMutation.isPending}
                    className={`w-full py-3.5 px-4 rounded-xl bg-gradient-to-r ${roleLabels[selectedRole]?.btnGradient || 'from-blue-600 to-indigo-600'} text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50`}
                  >
                    {signupSendOtpMutation.isPending ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /><span>Sending Verification Code...</span></>
                    ) : (
                      <><span>Create Account & Send Code</span><ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>

                  {/* Switch to sign in */}
                  <p className="text-center text-xs text-slate-500 font-medium pt-2">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setAuthMode('login'); setErrorMsg(null); }}
                      className="font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Sign in with password
                    </button>
                  </p>
                </form>
              )}

              {/* ── 3. OTP VERIFICATION ── */}
              {authMode === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-xs">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <h2 className="text-2xl text-[var(--ink)] font-bold font-[var(--font-heading)]">
                        Verify Your Email
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Enter the 6-digit code sent to <strong className="text-[var(--ink)]">{email}</strong>.
                    </p>
                  </div>

                  {/* Dev OTP quick fill helper in dev mode */}
                  {devOtpHint && (
                    <div className="p-3 bg-[var(--canvas)] border border-indigo-500/40 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-[var(--ink-2)]">Dev Code: <strong className="text-blue-600 font-bold font-mono">{devOtpHint}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          const digits = devOtpHint.split('');
                          setOtp(digits);
                          otpInputRefs.current[5]?.focus();
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  )}

                  {/* 6 OTP Boxes */}
                  <div className="flex justify-center items-center gap-2 sm:gap-3 my-4">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpInputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => { handleOtpChange(index, e.target.value); if (errorMsg) setErrorMsg(null); }}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        style={{ width: '48px', height: '56px' }}
                        className={`text-center font-mono text-xl font-bold rounded-xl border ${
                          errorMsg 
                            ? 'border-rose-500 bg-rose-50/50 text-rose-600' 
                            : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] focus:border-[var(--brand-600)] focus:ring-2 focus:ring-[var(--brand-600)]/20'
                        } outline-none transition-all shadow-inner`}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>

                  <div className="space-y-3">
                    <button
                      type="submit"
                      disabled={verifySignupOtpMutation.isPending}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
                    >
                      {verifySignupOtpMutation.isPending ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /><span>Activating Account...</span></>
                      ) : (
                        <><CheckCircle2 className="w-5 h-5" /><span>Verify & Create Account</span></>
                      )}
                    </button>

                    <div className="flex items-center justify-between pt-2 text-xs">
                      <button
                        type="button"
                        onClick={() => { setAuthMode('signup'); setOtp(['', '', '', '', '', '']); setErrorMsg(null); }}
                        className="font-bold text-slate-500 hover:text-blue-600 cursor-pointer"
                      >
                        Edit Info
                      </button>

                      {countdown > 0 ? (
                        <span className="text-slate-500 font-medium">
                          Resend in <strong className="text-[var(--ink)] font-mono">0:{countdown < 10 ? `0${countdown}` : countdown}</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={signupSendOtpMutation.isPending}
                          className="font-bold text-blue-600 hover:underline flex items-center space-x-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /><span>Resend Code</span>
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-[var(--ink-3)] border-t border-[var(--border)] z-20">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} PolySafe AI &middot; Clinical Polypharmacy Intelligence Platform</span>
          <span className="text-[11px] text-slate-400">Zero-Trust Protected &middot; HIPAA &amp; ISO-27001 Clinical Guidelines</span>
        </div>
      </footer>

    </PageTransition>
  );
}


