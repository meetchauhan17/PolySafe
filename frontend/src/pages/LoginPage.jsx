import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
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
  Check,
  X,
  LogIn,
  UserPlus,
  Zap,
  Sun,
  Moon,
} from 'lucide-react';
import { authApi } from '../api/auth';
import PageTransition from '../components/PageTransition';
import { notify } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { useDisplaySettings } from '../context/DisplaySettingsContext';
import PolySafeInput from '../components/PolySafeInput';
import { useT } from '../i18n/useT';
import LanguageSwitcher from '../components/LanguageSwitcher';
import TextSizeControl from '../components/TextSizeControl';
import Logo from '../components/Logo';
import { DepthStack, DepthLayer, FloatingCapsule, ShieldMark, TiltCard } from '../three-d';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, token, login, enterGuestMode } = useAuth();
  const { theme, toggleTheme } = useDisplaySettings();
  const { t } = useT();

  // ─── On Mount: Redirect already authenticated sessions ─────────────────────
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

  // Selected Role: 'PATIENT' (default) | 'DOCTOR' | 'CAREGIVER'
  const [selectedRole, setSelectedRole] = useState('PATIENT');

  // Auth Mode: 'login' | 'signup' | 'otp' | 'forgot'
  const [authMode, setAuthMode] = useState('login');

  // Global error message
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

  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [devOtpHint, setDevOtpHint] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [focusedOtpIndex, setFocusedOtpIndex] = useState(null);
  const countdownTimerRef = useRef(null);
  const otpInputRefs = useRef([]);

  // Remind Me state
  const [remindMe, setRemindMe] = useState(() => {
    return localStorage.getItem('polysafe_remind_me') !== 'false';
  });

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('polysafe_saved_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setResetEmail(savedEmail);
    }
  }, []);

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

  // ─── Forgot Password State ──────────────────────────────────────────────────
  const [forgotStep, setForgotStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDevOtpHint, setResetDevOtpHint] = useState(null);

  const handleSendResetCode = async (e) => {
    e?.preventDefault();
    const targetEmail = (resetEmail || email).trim();
    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setResetLoading(true);
    setErrorMsg(null);
    try {
      const res = await axios.post('/auth/forgot-password', { email: targetEmail });
      if (res.data?._devOtp) setResetDevOtpHint(res.data._devOtp);
      setForgotStep(2);
      notify.success('A 6-digit verification code has been sent to your email.');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to send password reset code. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e?.preventDefault();
    if (!resetCode || resetCode.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code sent to your email.');
      return;
    }
    if (!newResetPassword || newResetPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }
    setResetLoading(true);
    setErrorMsg(null);
    try {
      await axios.post('/auth/reset-password', {
        email: (resetEmail || email).trim(),
        code: resetCode.trim(),
        newPassword: newResetPassword,
      });
      notify.success('Password reset successfully! You can now sign in with your new password.');
      setEmail((resetEmail || email).trim());
      setPassword('');
      setAuthMode('login');
      setForgotStep(1);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to reset password. Please verify the code.');
    } finally {
      setResetLoading(false);
    }
  };

  // ─── Signup password strength calculation (Segmented Bar) ───────────────────
  const calcStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'Empty', color: 'var(--ink-4)', hasLen: false, hasNum: false, hasSpecial: false };
    const hasLen = pwd.length >= 8;
    const hasNum = /\d/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd) || /[A-Z]/.test(pwd);
    let score = 0;
    if (hasLen) score++;
    if (hasNum) score++;
    if (hasSpecial) score++;
    let label = 'Weak', color = 'var(--critical-500)';
    if (score === 2) { label = 'Moderate'; color = 'var(--caution-500)'; }
    else if (score === 3) { label = 'Strong'; color = 'var(--safe-600)'; }
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

  const verifySignupOtpMutation = useMutation({
    mutationFn: ({ email, code }) => authApi.verifySignupOtp({ email, code }),
    onSuccess: (data) => handleAuthSuccess(data, true),
    onError: (err) => {
      const msg = err.response?.data?.error || 'Invalid or expired verification code.';
      setErrorMsg(msg);
      notify.error('Verification Failed', msg);
    },
  });

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

  // Role metadata with line-art illustrations and semantic palette
  const ROLE_TILES = [
    {
      id: 'PATIENT',
      title: 'Patient',
      subtitle: 'Personal Safety',
      description: 'Track prescriptions, herbals & get instant safety alerts.',
      colorVar: 'var(--brand-600)',
      borderActive: 'border-[var(--brand-600)]',
      bgActive: 'bg-[var(--brand-50)]/60 dark:bg-[var(--brand-900)]/30',
      badgeColor: 'bg-[var(--brand-50)] text-[var(--brand-600)] border-[var(--brand-200)] dark:border-[var(--brand-700)]',
      illustration: (
        <svg className="w-10 h-10 stroke-[var(--brand-600)] fill-none" viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="14" r="7" strokeWidth="2.2" />
          <path d="M11 38c0-7.18 5.82-13 13-13s13 5.82 13 13" strokeWidth="2.2" strokeLinecap="round" />
          <rect x="25" y="25" width="14" height="7" rx="3.5" strokeWidth="1.8" strokeDasharray="3 2" />
        </svg>
      ),
    },
    {
      id: 'DOCTOR',
      title: 'Doctor',
      subtitle: 'Clinician Oversight',
      description: 'Longitudinal timelines, Beers deprescribing & risk simulator.',
      colorVar: 'var(--doctor-600)',
      borderActive: 'border-[var(--doctor-600)]',
      bgActive: 'bg-[var(--doctor-50)]/60 dark:bg-[var(--doctor-900)]/30',
      badgeColor: 'bg-[var(--doctor-50)] text-[var(--doctor-600)] border-[var(--doctor-200)] dark:border-[var(--doctor-700)]',
      illustration: (
        <svg className="w-10 h-10 stroke-[var(--doctor-600)] fill-none" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M15 10v12a9 9 0 0 0 18 0V10" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M24 31v5a4 4 0 0 0 4 4h2" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="33" cy="40" r="2.8" strokeWidth="2.2" />
          <path d="M12 10h6M30 10h6" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'CAREGIVER',
      title: 'Caregiver',
      subtitle: 'Family Proxy',
      description: 'Dose schedule adherence monitoring & health check-ins.',
      colorVar: 'var(--caregiver-600)',
      borderActive: 'border-[var(--caregiver-600)]',
      bgActive: 'bg-[var(--caregiver-50)]/60 dark:bg-[var(--caregiver-900)]/30',
      badgeColor: 'bg-[var(--caregiver-50)] text-[var(--caregiver-600)] border-[var(--caregiver-200)] dark:border-[var(--caregiver-700)]',
      illustration: (
        <svg className="w-10 h-10 stroke-[var(--caregiver-600)] fill-none" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M13 28l5-5a3.5 3.5 0 0 1 5 0l1 1 1-1a3.5 3.5 0 0 1 5 0l4 4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24 16c-2.5-4-7.5-4-10-0.8-2.5 3.2-0.8 7.2 2.5 10.4l7.5 7.4 7.5-7.4c3.3-3.2 5-7.2 2.5-10.4-2.5-3.2-7.5-3.2-10 0.8z" strokeWidth="1.8" strokeDasharray="2.5 2.5" />
          <path d="M9 37h30" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <PageTransition className="relative min-h-screen bg-[var(--canvas)] text-[var(--ink)] flex flex-col justify-between overflow-x-hidden selection:bg-[var(--accent-100)] selection:text-[var(--ink)]">
      {/* ── Background Precision Ambient Grid ── */}
      <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* ── Top Header ── */}
      <header className="relative w-full max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4 z-20">
        <Logo to="/" size="md" showTagline={true} tagline="Clinical Polypharmacy AI" />

        <div className="flex items-center gap-2 sm:gap-3">
          <TextSizeControl />
          <LanguageSwitcher compact={true} />

          {/* Theme Toggle (Sun/Moon) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink-2)] hover:bg-[var(--surface)] hover:text-[var(--ink)] transition-colors cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)]"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 stroke-[2.2]" />
            ) : (
              <Moon className="w-4 h-4 text-[var(--brand-600)] stroke-[2.2]" />
            )}
          </button>

          {/* Live System Indicator */}
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[11px] font-semibold text-[var(--ink-2)] shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--safe-600)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--safe-600)]" />
            </span>
            <span className="font-mono">Engine v2.4 Active</span>
          </div>
        </div>
      </header>

      {/* ── Main Layout: Asymmetric Editorial Split (Left 60% / Right 40%) ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-4 sm:py-6 lg:py-8">
        <div className="w-full max-w-7xl mx-auto">

          {/* Mobile Compact Hero Header (visible only on < 1024px) */}
          <div className="lg:hidden text-center space-y-3 mb-6">
            <div className="flex justify-center">
              <FloatingCapsule size="sm" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink)] font-[var(--font-heading)]">
              Every medicine, one safe picture.
            </h1>
            <p className="text-xs sm:text-sm text-[var(--ink-2)] max-w-md mx-auto leading-relaxed">
              Continuous clinical safety cross-referencing Beers criteria, anticholinergic burden, and adverse cascade alerts in real time.
            </p>
          </div>

          {/* Asymmetric Editorial Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

            {/* ══════════════════════════════════════════════════════════════
                LEFT PANEL (60%): --paper Hero Panel with 3D DepthStack
            ══════════════════════════════════════════════════════════════ */}
            <div className="hidden lg:flex lg:col-span-7 bg-[var(--paper)] text-[var(--ink)] rounded-3xl p-8 xl:p-12 border border-[var(--border)] shadow-[var(--shadow-paper)] flex-col justify-between relative overflow-hidden grain">
              
              {/* Top Editorial Eyebrow */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface)]/90 backdrop-blur-md border border-[var(--border)] shadow-xs">
                  <Zap className="w-3.5 h-3.5 text-[var(--brand-600)]" />
                  <span className="text-[11px] font-bold tracking-wider uppercase text-[var(--ink-2)] font-mono">
                    Continuous Clinical Safety Architecture
                  </span>
                </div>

                <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-[var(--ink)] font-[var(--font-heading)] leading-[1.15]">
                  Every medicine, <br />
                  <span className="text-[var(--brand-600)]">one safe picture.</span>
                </h1>

                <p className="text-base text-[var(--ink-2)] max-w-xl leading-relaxed">
                  Real-time polypharmacy safety cross-referencing Beers criteria, anticholinergic cognitive load, and adverse drug cascade alerts.
                </p>
              </div>

              {/* ── 3D Hero Object: DepthStack with FloatingCapsule, ShieldMark & Parallax Glyphs ── */}
              <div className="my-6 py-4 flex items-center justify-center">
                <DepthStack maxOffset={12} className="relative w-full h-72 flex items-center justify-center select-none overflow-visible">
                  
                  {/* Layer 0.15: Ambient Radial Depth Ring */}
                  <DepthLayer depth={0.15} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-64 rounded-full bg-gradient-to-tr from-[var(--brand-600)]/12 via-[var(--accent-500)]/10 to-transparent blur-2xl" />
                    <div className="w-80 h-80 rounded-full border border-[var(--border)]/50 pointer-events-none" />
                  </DepthLayer>

                  {/* Layer 0.4: Orbiting Pill Glyph 1 (Top-Right) */}
                  <DepthLayer depth={0.4} className="absolute right-12 top-6 z-10">
                    <div className="w-14 h-6 rounded-full bg-gradient-to-r from-[var(--brand-600)] to-white border border-[var(--border)] shadow-md transform -rotate-12 flex items-center justify-center opacity-90">
                      <span className="w-1.5 h-1.5 rounded-full bg-white opacity-95" />
                    </div>
                  </DepthLayer>

                  {/* Layer 0.55: Pure CSS/SVG 3D Clinical Shield Mark */}
                  <DepthLayer depth={0.55} className="absolute left-10 top-10 z-10">
                    <ShieldMark size={76} />
                  </DepthLayer>

                  {/* Layer 0.95: 3D Two-Tone Floating Capsule (Center Foreground) */}
                  <DepthLayer depth={0.95} className="relative z-20 flex items-center justify-center">
                    <FloatingCapsule size="md" />
                  </DepthLayer>

                  {/* Layer 0.7: Orbiting Pill Glyph 2 (Bottom-Right, Coral) */}
                  <DepthLayer depth={0.7} className="absolute right-16 bottom-6 z-20">
                    <div className="w-12 h-5 rounded-full bg-gradient-to-r from-[var(--accent-500)] to-[var(--paper)] border border-[var(--border)] shadow-sm transform rotate-24 flex items-center justify-center opacity-90">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink)] opacity-70" />
                    </div>
                  </DepthLayer>

                </DepthStack>
              </div>

              {/* Bottom 3 Value Points with Icons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[var(--border)]">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--brand-600)] flex items-center justify-center flex-shrink-0 shadow-xs">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-[var(--ink)] font-[var(--font-heading)]">222K+ Rules</h2>
                    <p className="text-[11px] text-[var(--ink-2)] mt-0.5 leading-snug">FDA, CDSCO & DDInter interaction radar.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--safe-600)] flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Activity className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-[var(--ink)] font-[var(--font-heading)]">ACB Radar</h2>
                    <p className="text-[11px] text-[var(--ink-2)] mt-0.5 leading-snug">Quantified cognitive burden scoring.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--accent-600)] flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Sparkles className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-[var(--ink)] font-[var(--font-heading)]">Beers 2023</h2>
                    <p className="text-[11px] text-[var(--ink-2)] mt-0.5 leading-snug">STOPP/START geriatric guidelines.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* ══════════════════════════════════════════════════════════════
                RIGHT PANEL (40%): Raised Form Card with Role Selection
            ══════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-5 bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-paper)] flex flex-col justify-between space-y-6">

              {/* ── Top Role Selector: Three Large <TiltCard> Tiles ── */}
              {authMode !== 'otp' && authMode !== 'forgot' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--ink-2)] uppercase tracking-wider font-mono">
                      Choose Your Role
                    </span>
                    <span className="text-[11px] text-[var(--ink-3)] font-medium">
                      Tailored Interface
                    </span>
                  </div>

                  {/* 3 Large <TiltCard> Tiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5" role="radiogroup" aria-label="Select Access Role">
                    {ROLE_TILES.map((role) => {
                      const isSelected = selectedRole === role.id;
                      return (
                        <TiltCard
                          key={role.id}
                          max={4}
                          scale={1.01}
                          glare={false}
                          className="w-full h-full cursor-pointer"
                        >
                          <button
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => {
                              setSelectedRole(role.id);
                              setErrorMsg(null);
                            }}
                            className={`w-full h-full text-left p-3.5 rounded-2xl border-2 transition-all duration-200 relative flex flex-col justify-between select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)] ${
                              isSelected
                                ? `${role.borderActive} ${role.bgActive} shadow-xs`
                                : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]'
                            }`}
                          >
                            {/* Sliding Highlight Line at Top */}
                            {isSelected && (
                              <span
                                className="absolute top-0 inset-x-3 h-1 rounded-full transition-all duration-300"
                                style={{ backgroundColor: role.colorVar }}
                              />
                            )}

                            {/* Tile Header: Illustration & Check indicator */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="p-1 rounded-xl bg-[var(--canvas)] border border-[var(--border)] shadow-xs">
                                {role.illustration}
                              </div>
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'bg-[var(--brand-600)] border-[var(--brand-600)] text-white'
                                  : 'border-[var(--border-strong)] text-transparent'
                              }`}>
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            </div>

                            {/* Title & Description */}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-sm font-bold text-[var(--ink)] font-[var(--font-heading)]">
                                  {role.title}
                                </h3>
                              </div>
                              <p className="text-[11px] text-[var(--ink-2)] mt-1 leading-snug line-clamp-2">
                                {role.description}
                              </p>
                            </div>
                          </button>
                        </TiltCard>
                      );
                    })}
                  </div>

                  {/* Quiet Coral Guest Button */}
                  <div className="flex items-center justify-between pt-1 px-1">
                    <span className="text-[11px] text-[var(--ink-3)]">Looking for instant exploration?</span>
                    <button
                      type="button"
                      onClick={() => {
                        enterGuestMode();
                        notify.info('Demo Sandbox Active', 'Exploring PolySafe with sample patient data.');
                        navigate('/home', { replace: true });
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent-600)] dark:text-[var(--accent-500)] hover:text-[var(--accent-700)] transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-500)] rounded-md px-1.5 py-0.5"
                    >
                      <span>Try the sample patient</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── Mode Switcher: Sign In vs Create Account ── */}
              {authMode !== 'otp' && authMode !== 'forgot' && (
                <div className="flex items-center gap-1 p-1 bg-[var(--canvas)] border border-[var(--border)] rounded-2xl w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setErrorMsg(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      authMode === 'login'
                        ? 'bg-[var(--surface)] text-[var(--ink)] shadow-xs border border-[var(--border)]'
                        : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{t('login.tab_sign_in', 'Sign In')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setErrorMsg(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      authMode === 'signup'
                        ? 'bg-[var(--surface)] text-[var(--ink)] shadow-xs border border-[var(--border)]'
                        : 'text-[var(--ink-3)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{t('login.tab_create_account', 'Create Account')}</span>
                  </button>
                </div>
              )}

              {/* Global Error Banner */}
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs shadow-xs" role="alert">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <p className="font-semibold leading-relaxed">{errorMsg}</p>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════
                  1. SIGN IN (LOGIN) FORM
              ══════════════════════════════════════════════════════════════ */}
              {authMode === 'login' && (
                <form onSubmit={handleSignInSubmit} className="space-y-4">
                  {/* Lockout banner */}
                  {lockoutSecsLeft > 0 && (
                    <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl text-xs text-[var(--ink)] space-y-1 shadow-xs">
                      <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        Account temporarily locked
                      </div>
                      <p className="text-[11px] text-[var(--ink-2)] pl-6">
                        Too many failed attempts. Try again in{' '}
                        <strong className="font-mono font-bold text-[var(--ink)]">
                          {lockoutSecsLeft}s
                        </strong>.
                      </p>
                    </div>
                  )}

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[var(--ink-2)] uppercase tracking-wider">
                      {t('login.email_label', 'Email Address')}
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
                      className="text-sm"
                    />
                    {emailError && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />{emailError}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[var(--ink-2)] uppercase tracking-wider">
                      {t('login.password_label', 'Password')}
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
                      className="text-sm"
                    />
                    {passwordError && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />{passwordError}
                      </p>
                    )}
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center space-x-2 text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={remindMe}
                        onChange={(e) => { setRemindMe(e.target.checked); localStorage.setItem('polysafe_remind_me', String(e.target.checked)); }}
                        className="w-4 h-4 rounded text-[var(--brand-600)] focus:ring-[var(--brand-600)] border-[var(--border)] cursor-pointer"
                      />
                      <span className="font-medium text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors">
                        {t('login.remind_me', 'Remember email')}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot');
                        setForgotStep(1);
                        setResetEmail(email);
                        setErrorMsg(null);
                      }}
                      className="text-xs font-semibold text-[var(--brand-600)] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loginMutation.isPending || lockoutSecsLeft > 0}
                    className="w-full py-3.5 px-4 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50 ps-shine-button"
                  >
                    {loginMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /><span>Signing In...</span></>
                    ) : (
                      <><span>Sign In as {ROLE_TILES.find(r => r.id === selectedRole)?.title}</span><ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              )}

              {/* ══════════════════════════════════════════════════════════════
                  2. SIGN UP (REGISTRATION) FORM
              ══════════════════════════════════════════════════════════════ */}
              {authMode === 'signup' && (
                <form onSubmit={handleSignUpSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[var(--ink-2)] uppercase tracking-wider">
                      {selectedRole === 'DOCTOR' ? 'Physician Full Name' : t('login.name_label', 'Full Name')}
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
                      className="text-sm"
                    />
                    {nameError && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />{nameError}
                      </p>
                    )}
                  </div>

                  {/* Doctor Registration Number */}
                  {selectedRole === 'DOCTOR' && (
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[var(--ink-2)] uppercase tracking-wider">
                        Medical License / Reg No.
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
                        className="text-sm"
                      />
                      {doctorRegNumError && (
                        <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />{doctorRegNumError}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[var(--ink-2)] uppercase tracking-wider">
                      {t('login.email_label', 'Email Address')}
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
                      className="text-sm"
                    />
                    {emailError && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />{emailError}
                      </p>
                    )}
                  </div>

                  {/* Password + Segmented Strength Meter */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[var(--ink-2)] uppercase tracking-wider">
                      {t('login.password_label', 'Password')}
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
                      className="text-sm"
                    />
                    {passwordError && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />{passwordError}
                      </p>
                    )}

                    {/* Segmented Strength Meter Bar */}
                    {password && (
                      <div className="mt-2 space-y-1.5 p-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-xs">
                        <div className="flex items-center justify-between font-medium">
                          <span className="text-[var(--ink-3)] text-[11px] uppercase tracking-wider font-mono">Password Strength:</span>
                          <span className="font-bold text-xs" style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                        </div>

                        {/* Segmented Bar (3 equal segments) */}
                        <div className="grid grid-cols-3 gap-1.5 h-2 w-full">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              backgroundColor: passwordStrength.score >= 1 ? passwordStrength.color : 'var(--border)',
                            }}
                          />
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              backgroundColor: passwordStrength.score >= 2 ? passwordStrength.color : 'var(--border)',
                            }}
                          />
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              backgroundColor: passwordStrength.score >= 3 ? passwordStrength.color : 'var(--border)',
                            }}
                          />
                        </div>

                        {/* Requirements checklist */}
                        <div className="grid grid-cols-2 gap-1 pt-1 text-[11px] text-[var(--ink-3)] font-medium">
                          <div className="flex items-center gap-1">
                            {passwordStrength.hasLen ? <Check className="w-3 h-3 text-[var(--safe-600)]" /> : <X className="w-3 h-3 text-[var(--ink-4)]" />}
                            <span className={passwordStrength.hasLen ? 'text-[var(--ink)] font-semibold' : ''}>8+ characters</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {passwordStrength.hasNum ? <Check className="w-3 h-3 text-[var(--safe-600)]" /> : <X className="w-3 h-3 text-[var(--ink-4)]" />}
                            <span className={passwordStrength.hasNum ? 'text-[var(--ink)] font-semibold' : ''}>Contains number</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={signupSendOtpMutation.isPending}
                    className="w-full py-3.5 px-4 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50 ps-shine-button"
                  >
                    {signupSendOtpMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /><span>Sending Verification Code...</span></>
                    ) : (
                      <><span>Send Verification Code</span><ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              )}

              {/* ══════════════════════════════════════════════════════════════
                  3. OTP VERIFICATION FORM (6 Large Boxes with Caret Animation)
              ══════════════════════════════════════════════════════════════ */}
              {authMode === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-[var(--brand-50)] text-[var(--brand-600)] border border-[var(--brand-200)] shadow-2xs">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <h2 className="text-xl text-[var(--ink)] font-bold font-[var(--font-heading)]">
                        Verify Your Email
                      </h2>
                    </div>
                    <p className="text-xs text-[var(--ink-2)]">
                      Enter the 6-digit verification code sent to <strong className="text-[var(--ink)]">{email}</strong>.
                    </p>
                  </div>

                  {/* Dev OTP Helper */}
                  {devOtpHint && (
                    <div className="p-3 bg-[var(--canvas)] border border-[var(--brand-300)] rounded-xl flex items-center justify-between text-xs">
                      <span className="text-[var(--ink-2)]">Dev OTP Hint: <strong className="text-[var(--brand-600)] font-mono font-bold">{devOtpHint}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          const digits = devOtpHint.split('');
                          setOtp(digits);
                          otpInputRefs.current[5]?.focus();
                        }}
                        className="px-2.5 py-1 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold rounded-lg cursor-pointer transition-colors shadow-2xs"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  )}

                  {/* 6 Large OTP Boxes with Caret Animation */}
                  <div className="flex justify-center items-center gap-2 sm:gap-3 my-4">
                    {otp.map((digit, index) => {
                      const isFocused = focusedOtpIndex === index;
                      return (
                        <div key={index} className="relative">
                          <input
                            ref={(el) => (otpInputRefs.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onFocus={() => setFocusedOtpIndex(index)}
                            onBlur={() => setFocusedOtpIndex(null)}
                            onChange={(e) => { handleOtpChange(index, e.target.value); if (errorMsg) setErrorMsg(null); }}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            className={`w-11 h-14 sm:w-13 sm:h-16 text-center font-mono text-2xl font-bold rounded-2xl border ${
                              errorMsg
                                ? 'border-rose-400 bg-rose-50/50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
                                : isFocused
                                ? 'border-[var(--brand-600)] bg-[var(--surface)] text-[var(--ink)] ring-3 ring-[var(--brand-600)]/20 shadow-xs'
                                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] shadow-2xs'
                            } outline-none transition-all`}
                            autoFocus={index === 0}
                          />

                          {/* Animated Caret indicator when focused and empty */}
                          {isFocused && !digit && (
                            <span className="absolute inset-x-0 bottom-3 mx-auto w-4 h-0.5 bg-[var(--brand-600)] animate-pulse rounded-full pointer-events-none" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      type="submit"
                      disabled={verifySignupOtpMutation.isPending}
                      className="w-full py-3.5 px-4 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50 ps-shine-button"
                    >
                      {verifySignupOtpMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /><span>Activating Profile...</span></>
                      ) : (
                        <><CheckCircle2 className="w-4 h-4" /><span>Verify & Create Account</span></>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => { setAuthMode('signup'); setOtp(['', '', '', '', '', '']); setErrorMsg(null); }}
                        className="font-bold text-[var(--ink-3)] hover:text-[var(--brand-600)] cursor-pointer"
                      >
                        Edit Details
                      </button>

                      {countdown > 0 ? (
                        <span className="text-[var(--ink-3)] font-medium">
                          Resend code in <strong className="text-[var(--ink)] font-mono">0:{countdown < 10 ? `0${countdown}` : countdown}</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={signupSendOtpMutation.isPending}
                          className="font-bold text-[var(--brand-600)] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /><span>Resend Code</span>
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              )}

              {/* ══════════════════════════════════════════════════════════════
                  4. FORGOT PASSWORD FLOW
              ══════════════════════════════════════════════════════════════ */}
              {authMode === 'forgot' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-xl text-[var(--ink)] font-bold font-[var(--font-heading)]">
                      Reset Password
                    </h2>
                    <p className="text-xs text-[var(--ink-2)]">
                      {forgotStep === 1
                        ? 'Enter your registered email address to receive a 6-digit verification code.'
                        : `Enter the code emailed to ${resetEmail || email} and your new password.`}
                    </p>
                  </div>

                  {forgotStep === 1 ? (
                    <form onSubmit={handleSendResetCode} className="space-y-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-[var(--ink-2)] uppercase tracking-wider">
                          Account Email
                        </label>
                        <PolySafeInput
                          type="email"
                          required
                          autoFocus
                          value={resetEmail || email}
                          onChange={(e) => { setResetEmail(e.target.value); setErrorMsg(null); }}
                          placeholder="name@example.com"
                          leftIcon={<Mail className="w-4 h-4" />}
                          className="text-sm"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={resetLoading}
                        className="w-full py-3.5 px-4 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
                      >
                        {resetLoading ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /><span>Sending Code...</span></>
                        ) : (
                          <><span>Send Verification Code</span><ArrowRight className="w-4 h-4" /></>
                        )}
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => { setAuthMode('login'); setErrorMsg(null); }}
                          className="text-xs font-bold text-[var(--ink-3)] hover:text-[var(--brand-600)] cursor-pointer"
                        >
                          Return to Sign In
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                      {resetDevOtpHint && (
                        <div className="p-3 bg-[var(--canvas)] border border-[var(--brand-300)] rounded-xl flex items-center justify-between text-xs">
                          <span className="text-[var(--ink-2)]">Dev OTP: <strong className="text-[var(--brand-600)] font-mono font-bold">{resetDevOtpHint}</strong></span>
                          <button
                            type="button"
                            onClick={() => setResetCode(resetDevOtpHint)}
                            className="px-2.5 py-1 bg-[var(--brand-600)] text-white font-bold rounded-lg cursor-pointer"
                          >
                            Fill Code
                          </button>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-[var(--ink-2)] uppercase tracking-wider">
                          6-Digit Code
                        </label>
                        <PolySafeInput
                          type="text"
                          required
                          maxLength={6}
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456"
                          leftIcon={<KeyRound className="w-4 h-4" />}
                          className="font-mono text-center tracking-widest text-lg"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-[var(--ink-2)] uppercase tracking-wider">
                          New Password
                        </label>
                        <PolySafeInput
                          type="password"
                          required
                          value={newResetPassword}
                          onChange={(e) => setNewResetPassword(e.target.value)}
                          placeholder="Min. 8 characters"
                          leftIcon={<Lock className="w-4 h-4" />}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={resetLoading}
                        className="w-full py-3.5 px-4 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
                      >
                        {resetLoading ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /><span>Updating Password...</span></>
                        ) : (
                          <><span>Save New Password & Sign In</span><ArrowRight className="w-4 h-4" /></>
                        )}
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => { setAuthMode('login'); setErrorMsg(null); }}
                          className="text-xs font-bold text-[var(--ink-3)] hover:text-[var(--brand-600)] cursor-pointer"
                        >
                          Cancel & Return
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Bottom Security Assurance */}
              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--ink-3)]">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--safe-600)]" />
                  Zero-Trust Encryption
                </span>
                <span className="font-mono">WCAG 2.1 AA</span>
              </div>

            </div>

          </div>
        </div>
      </main>

      {/* ── Minimal Footer ── */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[var(--ink-3)] border-t border-[var(--border)]/60">
        <div>
          © 2026 PolySafe AI. Built for Clinical Pharmacological Precision.
        </div>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-[var(--brand-600)] transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-[var(--brand-600)] transition-colors">Terms of Care</Link>
          <Link to="/styleguide" className="hover:text-[var(--brand-600)] transition-colors">Design System</Link>
        </div>
      </footer>
    </PageTransition>
  );
}
