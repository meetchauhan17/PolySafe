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
  ChevronRight,
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
    if (!pwd) return { score: 0, label: 'Empty', color: 'var(--text-muted)', hasLen: false, hasNum: false, hasSpecial: false };
    const hasLen = pwd.length >= 8;
    const hasNum = /\d/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd) || /[A-Z]/.test(pwd);
    let score = 0;
    if (hasLen) score++;
    if (hasNum) score++;
    if (hasSpecial) score++;
    let label = 'Weak', color = 'var(--led-critical)';
    if (score === 2) { label = 'Moderate'; color = 'var(--led-caution)'; }
    else if (score === 3) { label = 'Strong'; color = 'var(--accent-primary)'; }
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
      color: 'text-[#0891b2]', 
      badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      accentBorder: 'hover:border-cyan-500/60',
      accentGlow: 'hover:shadow-[0_12px_32px_-4px_rgba(8,145,178,0.22)]',
      gradient: 'from-cyan-500/10 via-teal-500/5 to-transparent'
    },
    CAREGIVER: { 
      title: 'Family & Caregiver', 
      subtitle: 'Schedule adherence monitoring & safety status check-ins', 
      color: 'text-[#059669]', 
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      accentBorder: 'hover:border-emerald-500/60',
      accentGlow: 'hover:shadow-[0_12px_32px_-4px_rgba(5,150,105,0.22)]',
      gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent'
    },
    DOCTOR: { 
      title: 'Doctor & Clinician', 
      subtitle: 'Clinical longitudinal oversight, Beers deprescribing & EHR notes', 
      color: 'text-[#4f46e5]', 
      badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      accentBorder: 'hover:border-indigo-500/60',
      accentGlow: 'hover:shadow-[0_12px_32px_-4px_rgba(79,70,229,0.22)]',
      gradient: 'from-indigo-500/10 via-blue-500/5 to-transparent'
    },
  };

  return (
    <PageTransition className="relative min-h-[92vh] bg-[var(--chassis)] flex items-center justify-center px-4 py-12 sm:py-16 overflow-hidden">
      
      {/* ── Atmospheric Ambient Lighting Orbs ── */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-[var(--accent-primary)]/15 via-cyan-400/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 -left-48 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 -right-48 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-xl w-full space-y-7 relative z-10">

        {/* ── Brand Hero Header ── */}
        <div className="text-center space-y-3">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--brand-surface)]/80 backdrop-blur-md border border-[var(--chassis-dark)] shadow-[var(--shadow-sm)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--led-safe)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--led-safe)] shadow-[0_0_6px_var(--led-safe)]" />
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-[var(--text-secondary)] font-mono">
              Clinical Polypharmacy AI &middot; v2.4
            </span>
          </div>

          {/* Logo Emblem */}
          <div className="relative inline-block">
            <div className="w-16 h-16 sm:w-18 sm:h-18 mx-auto rounded-3xl bg-gradient-to-tr from-[var(--brand-surface)] to-[var(--chassis-panel)] p-0.5 shadow-[var(--shadow-card)] border border-white/80 dark:border-white/10 flex items-center justify-center group">
              <div className="w-full h-full rounded-[22px] bg-gradient-to-b from-cyan-500/10 via-transparent to-teal-500/10 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 sm:w-9 sm:h-9 text-[var(--accent-primary)] drop-shadow-[0_2px_8px_rgba(8,145,178,0.35)] transition-transform duration-300 group-hover:scale-105" />
              </div>
            </div>
            {/* Ambient ring glow behind shield */}
            <div className="absolute inset-0 w-16 h-16 sm:w-18 sm:h-18 mx-auto rounded-3xl bg-[var(--accent-primary)]/20 blur-xl -z-10" />
          </div>

          {/* Title & Subtitle */}
          <div>
            <h1 className="text-3xl sm:text-4xl text-[var(--text-primary)] font-extrabold tracking-tight font-display">
              Poly<span className="text-[var(--accent-primary)]">Safe</span>
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto mt-1 leading-relaxed">
              Continuous drug-drug interaction detection, cascade prevention, and cognitive burden protection.
            </p>
          </div>

          {/* Clinical Metrics / Trust Signals */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
            <span className="inline-flex items-center gap-1.5 bg-[var(--brand-surface)]/70 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-[var(--chassis-dark)]/80 text-[11px] font-mono text-[var(--text-secondary)] shadow-xs">
              <Shield className="w-3 h-3 text-[var(--accent-primary)]" />
              222K+ DDInter Pairs
            </span>
            <span className="inline-flex items-center gap-1.5 bg-[var(--brand-surface)]/70 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-[var(--chassis-dark)]/80 text-[11px] font-mono text-[var(--text-secondary)] shadow-xs">
              <Activity className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Real-Time ACB Radar
            </span>
            <span className="inline-flex items-center gap-1.5 bg-[var(--brand-surface)]/70 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-[var(--chassis-dark)]/80 text-[11px] font-mono text-[var(--text-secondary)] shadow-xs">
              <Lock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              Zero-Trust RBAC
            </span>
          </div>
        </div>

        {/* ── Global Error Alert ── */}
        {errorMsg && (
          <div className="p-4 bg-[var(--brand-surface)] border-2 border-[var(--led-critical)]/40 rounded-2xl flex items-start space-x-3 text-[var(--led-critical)] text-sm animate-fadeIn shadow-[var(--shadow-card)]">
            <AlertCircle className="w-5 h-5 text-[var(--led-critical)] flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-mono">
              <p className="font-semibold">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 0: ROLE SELECTION CARDS (PREMIUM CLINICAL PORTAL)
        ══════════════════════════════════════════════════════════════════ */}
        {!selectedRole && (
          <div className="bg-[var(--brand-surface)]/90 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_16px_40px_-12px_rgba(15,25,35,0.08)] dark:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.45)]">
            
            <div className="text-center space-y-1 pb-1">
              <h2 className="text-xl sm:text-2xl text-[var(--text-primary)] font-bold tracking-tight font-display">
                Select Your Access Portal
              </h2>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Sign in with credentials or create a verified healthcare profile
              </p>
            </div>

            {/* Three primary interactive role cards */}
            <div className="grid grid-cols-1 gap-3.5">
              
              {/* ── Role 1: Patient ── */}
              <div
                onClick={() => {
                  setSelectedRole('PATIENT');
                  setAuthMode('login');
                  resetFormState();
                }}
                className="group relative p-4.5 sm:p-5 rounded-2xl bg-[var(--chassis)] hover:bg-gradient-to-r hover:from-cyan-500/[0.08] hover:to-transparent border border-[rgba(255,255,255,0.7)] dark:border-white/5 hover:border-cyan-500/50 shadow-[var(--shadow-card)] hover:shadow-[0_12px_28px_-6px_rgba(8,145,178,0.18)] active:shadow-[var(--shadow-pressed)] cursor-pointer transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  {/* Icon Well */}
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-200 shadow-xs">
                    <User className="w-6 h-6" />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors font-display">
                          Patient
                        </h3>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--brand-surface)] border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 px-2.5 py-0.5 rounded-full shadow-xs">
                        Sign In / Sign Up
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                      Track prescriptions, OTC drugs, herbal supplements, and receive real-time interaction alerts.
                    </p>

                    {/* Micro-Features */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[10px] font-mono text-[var(--text-secondary)]">
                      <span className="bg-[var(--brand-surface)]/80 px-2 py-0.5 rounded-md border border-[var(--chassis-dark)]">
                        OTC & Herbs Check
                      </span>
                      <span className="bg-[var(--brand-surface)]/80 px-2 py-0.5 rounded-md border border-[var(--chassis-dark)]">
                        ACB Delirium Meter
                      </span>
                      <span className="bg-[var(--brand-surface)]/80 px-2 py-0.5 rounded-md border border-[var(--chassis-dark)]">
                        Vision Scan
                      </span>
                    </div>
                  </div>

                  {/* Action Arrow */}
                  <div className="w-8 h-8 rounded-xl bg-[var(--brand-surface)] border border-[var(--chassis-dark)] flex items-center justify-center self-center flex-shrink-0 group-hover:border-cyan-500/50 group-hover:bg-cyan-500 group-hover:text-white text-[var(--text-muted)] transition-all duration-200">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* ── Role 2: Family / Caregiver ── */}
              <div
                onClick={() => {
                  setSelectedRole('CAREGIVER');
                  setAuthMode('login');
                  resetFormState();
                }}
                className="group relative p-4.5 sm:p-5 rounded-2xl bg-[var(--chassis)] hover:bg-gradient-to-r hover:from-emerald-500/[0.08] hover:to-transparent border border-[rgba(255,255,255,0.7)] dark:border-white/5 hover:border-emerald-500/50 shadow-[var(--shadow-card)] hover:shadow-[0_12px_28px_-6px_rgba(16,185,129,0.18)] active:shadow-[var(--shadow-pressed)] cursor-pointer transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  {/* Icon Well */}
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200 shadow-xs">
                    <HeartHandshake className="w-6 h-6" />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors font-display">
                          Family / Caregiver
                        </h3>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--brand-surface)] border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full shadow-xs">
                        Sign In / Sign Up
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                      Monitor family dose schedules, check safety statuses, and send check-in reminders with privacy protection.
                    </p>

                    {/* Micro-Features */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[10px] font-mono text-[var(--text-secondary)]">
                      <span className="bg-[var(--brand-surface)]/80 px-2 py-0.5 rounded-md border border-[var(--chassis-dark)]">
                        Privacy Redaction
                      </span>
                      <span className="bg-[var(--brand-surface)]/80 px-2 py-0.5 rounded-md border border-[var(--chassis-dark)]">
                        Daily Timing Schedule
                      </span>
                      <span className="bg-[var(--brand-surface)]/80 px-2 py-0.5 rounded-md border border-[var(--chassis-dark)]">
                        Multi-Patient Switcher
                      </span>
                    </div>
                  </div>

                  {/* Action Arrow */}
                  <div className="w-8 h-8 rounded-xl bg-[var(--brand-surface)] border border-[var(--chassis-dark)] flex items-center justify-center self-center flex-shrink-0 group-hover:border-emerald-500/50 group-hover:bg-emerald-600 group-hover:text-white text-[var(--text-muted)] transition-all duration-200">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* ── Role 3: Doctor / Clinician ── */}
              <div
                onClick={() => {
                  setSelectedRole('DOCTOR');
                  setAuthMode('login');
                  resetFormState();
                }}
                className="group relative p-4.5 sm:p-5 rounded-2xl bg-[var(--chassis)] hover:bg-gradient-to-r hover:from-indigo-500/[0.08] hover:to-transparent border border-[rgba(255,255,255,0.7)] dark:border-white/5 hover:border-indigo-500/50 shadow-[var(--shadow-card)] hover:shadow-[0_12px_28px_-6px_rgba(79,70,229,0.18)] active:shadow-[var(--shadow-pressed)] cursor-pointer transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  {/* Icon Well */}
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200 shadow-xs">
                    <Stethoscope className="w-6 h-6" />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-display">
                          Doctor / Clinician
                        </h3>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--brand-surface)] border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full shadow-xs">
                        Sign In / Sign Up
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                      Access patient timelines, pre-prescribing safety simulations, STOPP/START deprescribing, and clinical directives.
                    </p>

                    {/* Micro-Features */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[10px] font-mono text-[var(--text-secondary)]">
                      <span className="bg-[var(--brand-surface)]/80 px-2 py-0.5 rounded-md border border-[var(--chassis-dark)]">
                        Pre-Prescribing Simulation
                      </span>
                      <span className="bg-[var(--brand-surface)]/80 px-2 py-0.5 rounded-md border border-[var(--chassis-dark)]">
                        Beers 2023 Criteria
                      </span>
                      <span className="bg-[var(--brand-surface)]/80 px-2 py-0.5 rounded-md border border-[var(--chassis-dark)]">
                        4-Organ Toxicity Radar
                      </span>
                    </div>
                  </div>

                  {/* Action Arrow */}
                  <div className="w-8 h-8 rounded-xl bg-[var(--brand-surface)] border border-[var(--chassis-dark)] flex items-center justify-center self-center flex-shrink-0 group-hover:border-indigo-500/50 group-hover:bg-indigo-600 group-hover:text-white text-[var(--text-muted)] transition-all duration-200">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

            </div>

            {/* ── Refined Divider ── */}
            <div className="relative flex items-center justify-center my-5">
              <div className="border-t border-[var(--chassis-dark)] w-full" />
              <div className="bg-[var(--brand-surface)] px-4 py-0.5 rounded-full border border-[var(--chassis-dark)] shadow-xs absolute">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[var(--accent-primary)]" />
                  Or Explore Without Account
                </span>
              </div>
            </div>

            {/* ── Card 4: Continue as Guest (Interactive Sandbox) ── */}
            <div
              onClick={() => {
                enterGuestMode();
                notify.info('Demo Sandbox Active', 'Exploring PolySafe with pre-loaded clinical sample data.');
                navigate('/home', { replace: true });
              }}
              className="group relative p-4.5 rounded-2xl bg-gradient-to-r from-amber-500/[0.06] via-cyan-500/[0.04] to-indigo-500/[0.06] border border-amber-500/30 hover:border-amber-500/70 shadow-[var(--shadow-card)] hover:shadow-[0_12px_28px_-6px_rgba(245,158,11,0.18)] active:shadow-[var(--shadow-pressed)] flex items-center space-x-4 cursor-pointer transition-all duration-200"
            >
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-white transition-all duration-200 shadow-xs">
                <Compass className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors font-display">
                    Continue as Guest Explorer
                  </h4>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30 shadow-xs font-mono">
                    <Sparkles className="w-3 h-3" />
                    Instant Sandbox
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
                  Browse sample medications, risk graphs, cascade timeline, and 4-organ radar without registration.
                </p>
              </div>
              <div className="w-7 h-7 rounded-lg bg-[var(--brand-surface)] border border-amber-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500 group-hover:text-white text-[var(--text-muted)] transition-all duration-200">
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ROLE AUTH CARD (EXPLICIT SIGN IN VS SIGN UP TABS FOR ALL 3 ROLES)
        ══════════════════════════════════════════════════════════════════ */}
        {selectedRole && (
          <div className="bg-[var(--brand-surface)]/95 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_16px_40px_-12px_rgba(15,25,35,0.08)] dark:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.45)]">
            
            {/* Card Header: Back button + Role pill */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--chassis-dark)]">
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
                className="group text-xs font-bold text-[var(--text-muted)] hover:text-[var(--accent-primary)] flex items-center space-x-1.5 transition-colors cursor-pointer font-mono"
              >
                <div className="w-6 h-6 rounded-lg bg-[var(--chassis)] flex items-center justify-center group-hover:bg-[var(--accent-primary)]/10 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                </div>
                <span>{authMode === 'otp' ? 'Back to Form' : 'Change Role'}</span>
              </button>
              
              <span className={`text-xs font-bold px-3 py-1 rounded-full border font-mono shadow-xs ${roleLabels[selectedRole]?.badge}`}>
                {roleLabels[selectedRole]?.title}
              </span>
            </div>

            {/* Explicit Segmented Switcher: Sign In vs Sign Up */}
            {authMode !== 'otp' && (
              <div className="flex items-center gap-1.5 p-1.5 bg-[var(--chassis)] border border-[var(--chassis-dark)] rounded-2xl shadow-[var(--shadow-recessed)] w-full">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-gradient-to-r from-[#0891b2] to-[#0e7490] text-white shadow-sm border border-white/20'
                      : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--brand-surface)]/60'
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
                      ? 'bg-gradient-to-r from-[#0891b2] to-[#0e7490] text-white shadow-sm border border-white/20'
                      : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--brand-surface)]/60'
                  }`}
                >
                  <UserPlus className="w-4 h-4 flex-shrink-0" />
                  <span>Create Account</span>
                </button>
              </div>
            )}

            {/* ── 1. SIGN IN (LOGIN) FORM — Password only, Zero OTP ── */}
            {authMode === 'login' && (
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-2xl text-[var(--text-primary)] font-bold font-display">
                    {roleLabels[selectedRole]?.title} Sign In
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] font-mono">
                    Enter your email and password to access your account.
                  </p>
                </div>

                {/* Lockout banner */}
                {lockoutSecsLeft > 0 && (
                  <div className="p-4 bg-amber-500/10 border-2 border-[var(--led-caution)] rounded-2xl text-sm text-[var(--text-primary)] space-y-1 shadow-sm font-mono">
                    <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                      <AlertCircle className="w-4 h-4 text-[var(--led-caution)] flex-shrink-0" />
                      Account temporarily locked
                    </div>
                    <p className="text-xs text-[var(--text-primary)] pl-6">
                      Too many failed attempts. Try again in{' '}
                      <strong className="font-bold font-mono text-[var(--text-primary)]">
                        {lockoutSecsLeft} second{lockoutSecsLeft !== 1 ? 's' : ''}
                      </strong>.
                    </p>
                  </div>
                )}

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
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
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium font-mono">
                      <AlertCircle className="w-3.5 h-3.5" />{emailError}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
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
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium font-mono">
                      <AlertCircle className="w-3.5 h-3.5" />{passwordError}
                    </p>
                  )}
                </div>

                {/* Remind Me */}
                <div className="flex items-center pt-1">
                  <label className="flex items-center space-x-2 text-xs cursor-pointer select-none font-mono">
                    <input
                      type="checkbox"
                      checked={remindMe}
                      onChange={(e) => { setRemindMe(e.target.checked); localStorage.setItem('polysafe_remind_me', String(e.target.checked)); }}
                      className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] border-[var(--chassis-dark)] cursor-pointer"
                    />
                    <span className="font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                      Remember email on this device
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loginMutation.isPending || lockoutSecsLeft > 0}
                  className="btn-primary w-full text-base py-3.5 mt-1 cursor-pointer"
                >
                  {loginMutation.isPending ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /><span>Signing In...</span></>
                  ) : (
                    <><span>Sign In</span><ArrowRight className="w-5 h-5" /></>
                  )}
                </button>

                {/* Switch to sign up */}
                <p className="text-center text-xs text-[var(--text-muted)] font-mono pt-2">
                  New to PolySafe?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signup'); setErrorMsg(null); }}
                    className="font-bold text-[var(--accent-primary)] hover:underline cursor-pointer"
                  >
                    Create a new account
                  </button>
                </p>
              </form>
            )}

            {/* ── 2. SIGN UP FORM — Name + (Doctor Reg) + Password → Sends 1-time OTP ── */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-2xl text-[var(--text-primary)] font-bold font-display">
                    Create {roleLabels[selectedRole]?.title}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] font-mono">
                    A 6-digit OTP code will be sent to your email to verify your account once.
                  </p>
                </div>

                {/* Full Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
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
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium font-mono">
                      <AlertCircle className="w-3.5 h-3.5" />{nameError}
                    </p>
                  )}
                </div>

                {/* Doctor Medical Registration Number */}
                {selectedRole === 'DOCTOR' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
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
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium font-mono">
                        <AlertCircle className="w-3.5 h-3.5" />{doctorRegNumError}
                      </p>
                    )}
                  </div>
                )}

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
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
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium font-mono">
                      <AlertCircle className="w-3.5 h-3.5" />{emailError}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
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
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium font-mono">
                      <AlertCircle className="w-3.5 h-3.5" />{passwordError}
                    </p>
                  )}
                  {/* Password strength meter */}
                  {password && (
                    <div className="mt-2 space-y-1.5 p-2.5 bg-[var(--chassis)] border border-[var(--chassis-dark)] rounded-xl text-xs">
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-[var(--text-muted)]">Password Strength:</span>
                        <span className="font-bold" style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-[var(--chassis-dark)] shadow-[var(--shadow-recessed)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${(passwordStrength.score / 3) * 100}%`, backgroundColor: passwordStrength.color }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1 pt-1 text-[11px] text-[var(--text-muted)] font-mono">
                        <div className="flex items-center gap-1">
                          {passwordStrength.hasLen ? <Check className="w-3 h-3 text-[var(--accent-primary)]" /> : <X className="w-3 h-3 text-[#9CA3AF]" />}
                          <span className={passwordStrength.hasLen ? 'text-[var(--text-primary)] font-medium' : ''}>8+ characters</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {passwordStrength.hasNum ? <Check className="w-3 h-3 text-[var(--accent-primary)]" /> : <X className="w-3 h-3 text-[#9CA3AF]" />}
                          <span className={passwordStrength.hasNum ? 'text-[var(--text-primary)] font-medium' : ''}>Contains number</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Remind Me */}
                <div className="flex items-center pt-1">
                  <label className="flex items-center space-x-2 text-xs cursor-pointer select-none font-mono">
                    <input
                      type="checkbox"
                      checked={remindMe}
                      onChange={(e) => { setRemindMe(e.target.checked); localStorage.setItem('polysafe_remind_me', String(e.target.checked)); }}
                      className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] border-[var(--chassis-dark)] cursor-pointer"
                    />
                    <span className="font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                      Remember email on this device
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={signupSendOtpMutation.isPending}
                  className="btn-primary w-full text-base py-3.5 mt-1 cursor-pointer"
                >
                  {signupSendOtpMutation.isPending ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /><span>Sending Verification Code...</span></>
                  ) : (
                    <><span>Create Account & Send Code</span><ArrowRight className="w-5 h-5" /></>
                  )}
                </button>

                {/* Switch to sign in */}
                <p className="text-center text-xs text-[var(--text-muted)] font-mono pt-2">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setErrorMsg(null); }}
                    className="font-bold text-[var(--accent-primary)] hover:underline cursor-pointer"
                  >
                    Sign in with password
                  </button>
                </p>
              </form>
            )}

            {/* ── 3. OTP VERIFICATION (New Registration Only) ── */}
            {authMode === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 shadow-xs">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl text-[var(--text-primary)] font-bold font-display">
                      Verify Your Email
                    </h2>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] font-mono">
                    Enter the 6-digit code sent to <strong className="text-[var(--text-primary)]">{email}</strong>.
                  </p>
                </div>

                {/* Dev OTP quick fill helper in dev mode */}
                {devOtpHint && (
                  <div className="p-3 bg-[var(--chassis)] border border-[var(--accent-primary)]/40 rounded-xl flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--text-muted)]">Dev Code: <strong className="text-[var(--accent-primary)]">{devOtpHint}</strong></span>
                    <button
                      type="button"
                      onClick={() => {
                        const digits = devOtpHint.split('');
                        setOtp(digits);
                        otpInputRefs.current[5]?.focus();
                      }}
                      className="px-2 py-1 bg-[var(--accent-primary)] text-white font-bold rounded-lg cursor-pointer"
                    >
                      Fill Code
                    </button>
                  </div>
                )}

                {/* 6 OTP Boxes with auto-advance and backspace */}
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
                      className={`otp-box ${errorMsg ? 'input-error' : ''}`}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={verifySignupOtpMutation.isPending}
                    className="btn-primary w-full text-base py-3.5 cursor-pointer"
                  >
                    {verifySignupOtpMutation.isPending ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /><span>Activating Account...</span></>
                    ) : (
                      <><CheckCircle2 className="w-5 h-5" /><span>Verify & Create Account</span></>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('signup'); setOtp(['', '', '', '', '', '']); setErrorMsg(null); }}
                      className="font-bold text-[var(--text-muted)] hover:text-[var(--accent-primary)] cursor-pointer"
                    >
                      Edit Info
                    </button>

                    {countdown > 0 ? (
                      <span className="text-[var(--text-muted)] font-medium">
                        Resend in <strong className="text-[var(--text-primary)]">0:{countdown < 10 ? `0${countdown}` : countdown}</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={signupSendOtpMutation.isPending}
                        className="font-bold text-[var(--accent-primary)] hover:underline flex items-center space-x-1 cursor-pointer"
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
    </PageTransition>
  );
}
