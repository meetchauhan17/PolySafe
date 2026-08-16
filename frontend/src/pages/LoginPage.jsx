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
  Sparkles,
  RefreshCw,
  KeyRound,
  Compass,
  Check,
  X,
} from 'lucide-react';
import { authApi } from '../api/auth';
import Card from '../components/Card';
import PageTransition from '../components/PageTransition';
import { notify } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

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

  // Selected Role: null (role select screen) | 'PATIENT' | 'CAREGIVER' | 'DOCTOR'
  const [selectedRole, setSelectedRole] = useState(null);

  // Patient / Caregiver Email & OTP state
  const [patientName, setPatientName] = useState('Priya Sharma');
  const [patientEmail, setPatientEmail] = useState('priya.sharma@example.com');
  const [patientTouched, setPatientTouched] = useState({
    name: false,
    email: false,
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const countdownTimerRef = useRef(null);
  const otpInputRefs = useRef([]);

  // Doctor Auth state
  const [doctorMode, setDoctorMode] = useState('login'); // 'login' | 'signup'
  const [doctorForm, setDoctorForm] = useState({
    email: '',
    password: '',
    name: '',
    registrationNumber: '',
  });
  const [doctorTouched, setDoctorTouched] = useState({
    email: false,
    password: false,
    name: false,
    registrationNumber: false,
  });

  // Remind Me state
  const [remindMe, setRemindMe] = useState(() => {
    return localStorage.getItem('polysafe_remind_me') !== 'false';
  });

  // Load remembered credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('polysafe_saved_email');
    const savedName = localStorage.getItem('polysafe_saved_name');
    if (savedEmail && !patientEmail) {
      setPatientEmail(savedEmail);
    }
    if (savedName && !patientName) {
      setPatientName(savedName);
    }
  }, []);

  // ─── Countdown Timer for OTP Resend ─────────────────────────────────────────
  useEffect(() => {
    if (otpSent && countdown > 0) {
      countdownTimerRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      clearTimeout(countdownTimerRef.current);
    }
    return () => clearTimeout(countdownTimerRef.current);
  }, [otpSent, countdown]);

  const startCountdown = () => {
    setCountdown(30);
  };

  // ─── Password Strength Calculations (For Doctor Signup) ─────────────────────
  const passwordStrength = useMemo(() => {
    const pwd = doctorForm.password;
    if (!pwd) return { score: 0, label: 'Empty', color: '#6B726C', hasLen: false, hasNum: false, hasSpecial: false };

    const hasLen = pwd.length >= 8;
    const hasNum = /\d/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd) || /[A-Z]/.test(pwd);

    let score = 0;
    if (hasLen) score++;
    if (hasNum) score++;
    if (hasSpecial) score++;

    let label = 'Weak';
    let color = '#B23D25'; // danger red
    if (score === 2) {
      label = 'Moderate';
      color = '#B5791A'; // amber
    } else if (score === 3) {
      label = 'Strong';
      color = '#2B6E5E'; // safe deep teal
    }

    return { score, label, color, hasLen, hasNum, hasSpecial };
  }, [doctorForm.password]);

  // ─── Patient / Caregiver Inline Validation Checks ───────────────────────────
  const patientErrors = useMemo(() => {
    const errors = {};
    if (patientTouched.name) {
      if (!patientName.trim()) {
        errors.name = 'Full name is required.';
      } else if (patientName.trim().length < 2) {
        errors.name = 'Please enter your full name (at least 2 characters).';
      }
    }

    if (patientTouched.email) {
      if (!patientEmail.trim()) {
        errors.email = 'Email address is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail.trim())) {
        errors.email = 'Please enter a valid email address.';
      }
    }

    return errors;
  }, [patientName, patientEmail, patientTouched]);

  // ─── Doctor Inline Validation Checks ─────────────────────────────────────────
  const doctorErrors = useMemo(() => {
    const errors = {};
    if (doctorTouched.email) {
      if (!doctorForm.email.trim()) {
        errors.email = 'Email address is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(doctorForm.email.trim())) {
        errors.email = 'Please enter a valid email address.';
      }
    }

    if (doctorTouched.password) {
      if (!doctorForm.password) {
        errors.password = 'Password is required.';
      } else if (doctorMode === 'signup' && doctorForm.password.length < 8) {
        errors.password = 'Password must be at least 8 characters.';
      }
    }

    if (doctorMode === 'signup') {
      if (doctorTouched.name && !doctorForm.name.trim()) {
        errors.name = 'Doctor / Physician name is required.';
      }
      if (doctorTouched.registrationNumber && !doctorForm.registrationNumber.trim()) {
        errors.registrationNumber = 'Medical registration or license number is required.';
      }
    }

    return errors;
  }, [doctorForm, doctorTouched, doctorMode]);

  // ─── TanStack Query Mutations ──────────────────────────────────────────────

  // 1. Send Email OTP Mutation
  const sendOtpMutation = useMutation({
    mutationFn: ({ name, email }) => authApi.sendPatientOtp({ name, email }),
    onSuccess: (data) => {
      setErrorMsg(null);
      setOtpSent(true);
      startCountdown();
      notify.success('Verification Code Sent', `A 6-digit code has been sent to ${patientEmail.trim()}.`);
      if (data._devOtp) {
        setDevOtpHint(data._devOtp);
      }
      // Focus first OTP box
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    },
    onError: (err) => {
      const msg = err.response?.data?.error || err.message || 'Failed to send verification code. Please check your email.';
      setErrorMsg(msg);
      notify.error('Email Dispatch Failed', msg);
    },
  });

  // 2. Verify Email OTP Mutation
  const verifyOtpMutation = useMutation({
    mutationFn: ({ email, code, role, name }) => authApi.verifyPatientOtp({ email, code, role, name }),
    onSuccess: (data) => {
      setErrorMsg(null);
      if (remindMe) {
        localStorage.setItem('polysafe_saved_email', patientEmail.trim());
        localStorage.setItem('polysafe_saved_name', patientName.trim());
      } else {
        localStorage.removeItem('polysafe_saved_email');
        localStorage.removeItem('polysafe_saved_name');
      }

      if (data.token) {
        login(data.token, selectedRole || 'PATIENT', data.user);
      }

      notify.success('Authentication Verified', 'Welcome to PolySafe.');

      // Navigate with replace: true so Login page does not sit in browser history
      if (selectedRole === 'CAREGIVER') {
        navigate('/caregiver-view', { replace: true });
      } else if (data.isNewUser || data.message?.toLowerCase().includes('created') || !data.user?.patient) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    },
    onError: (err) => {
      const msg = err.response?.data?.error || err.message || 'Invalid or expired verification code. Please try again.';
      setErrorMsg(msg);
      notify.error('Verification Failed', msg);
    },
  });

  // 3. Doctor Login Mutation
  const doctorLoginMutation = useMutation({
    mutationFn: ({ email, password }) => authApi.doctorLogin({ email, password }),
    onSuccess: (data) => {
      setErrorMsg(null);
      if (remindMe) {
        localStorage.setItem('polysafe_saved_doctor_email', doctorForm.email.trim());
      } else {
        localStorage.removeItem('polysafe_saved_doctor_email');
      }

      if (data.token) {
        login(data.token, 'DOCTOR', data.user);
      }
      notify.success('Doctor Login Successful', 'Welcome to your Clinical Workstation.');
      navigate('/doctor-dashboard', { replace: true });
    },
    onError: (err) => {
      const msg = err.response?.data?.error || err.message || 'Invalid email or password.';
      setErrorMsg(msg);
      notify.error('Login Failed', msg);
    },
  });

  // 4. Doctor Signup Mutation
  const doctorSignupMutation = useMutation({
    mutationFn: (payload) => authApi.doctorSignup(payload),
    onSuccess: (data) => {
      setErrorMsg(null);
      if (data.token) {
        login(data.token, 'DOCTOR', data.user);
      }
      notify.success('Practice Account Created', 'Welcome to PolySafe Clinical Portal.');
      navigate('/doctor-dashboard', { replace: true });
    },
    onError: (err) => {
      const msg = err.response?.data?.error || err.message || 'Signup failed. Please verify credentials.';
      setErrorMsg(msg);
      notify.error('Registration Failed', msg);
    },
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSendOtp = (e) => {
    e?.preventDefault();
    setPatientTouched({ name: true, email: true });
    setErrorMsg(null);

    const cleanName = patientName.trim();
    const cleanEmail = patientEmail.trim();

    if (!cleanName) {
      setErrorMsg('Please enter your full name.');
      notify.warning('Name Required', 'Please enter your full name.');
      return;
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      notify.warning('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    sendOtpMutation.mutate({ name: cleanName, email: cleanEmail });
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste of multiple digits
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
    verifyOtpMutation.mutate({
      email: patientEmail.trim(),
      code,
      role: selectedRole || 'PATIENT',
      name: patientName.trim(),
    });
  };

  const handleFillDevOtp = () => {
    if (devOtpHint) {
      const digits = devOtpHint.split('');
      setOtp(digits);
      otpInputRefs.current[5]?.focus();
      notify.info('Dev Code Applied', `Filled ${devOtpHint}`);
    }
  };

  const handleDoctorSubmit = (e) => {
    e.preventDefault();
    setErrorMsg(null);

    // Touch all relevant fields
    setDoctorTouched({
      email: true,
      password: true,
      name: true,
      registrationNumber: true,
    });

    if (doctorMode === 'signup') {
      if (!doctorForm.name.trim() || !doctorForm.registrationNumber.trim() || !doctorForm.email.trim() || !doctorForm.password) {
        setErrorMsg('Please fill in all required doctor registration fields.');
        notify.warning('Missing Fields', 'Please fill in all required fields.');
        return;
      }
      if (doctorForm.password.length < 8) {
        setErrorMsg('Password must be at least 8 characters long.');
        notify.warning('Password Too Short', 'Password must be at least 8 characters long.');
        return;
      }
      doctorSignupMutation.mutate({
        ...doctorForm,
        email: doctorForm.email.trim(),
        name: doctorForm.name.trim(),
        registrationNumber: doctorForm.registrationNumber.trim(),
      });
    } else {
      if (!doctorForm.email.trim() || !doctorForm.password) {
        setErrorMsg('Please provide both email and password.');
        notify.warning('Credentials Required', 'Please enter your professional email and password.');
        return;
      }
      doctorLoginMutation.mutate({
        email: doctorForm.email.trim(),
        password: doctorForm.password,
      });
    }
  };

  return (
    <PageTransition className="min-h-[88vh] bg-[#FBF8F2] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full space-y-6">

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3.5 bg-[#E4F2E9] rounded-2xl border-2 border-[#2B6E5E]/20 text-[#2B6E5E] mb-1 shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl text-[#232724] font-bold tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
            PolySafe
          </h1>
          <p className="text-sm text-[#6B726C] max-w-sm mx-auto">
            AI Polypharmacy Interaction & Cumulative Burden Protection System
          </p>
        </div>

        {/* Global Error Alert */}
        {errorMsg && (
          <div className="p-4 bg-[#FBE4DE] border-2 border-[#B23D25]/30 rounded-2xl flex items-start space-x-3 text-[#B23D25] text-sm animate-fadeIn shadow-xs">
            <AlertCircle className="w-5 h-5 text-[#B23D25] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 1: ROLE SELECTION CARDS
           ══════════════════════════════════════════════════════════════════ */}
        {!selectedRole && (
          <Card className="p-6 md:p-8 space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl text-[#232724] font-bold" style={{ fontFamily: "'Fraunces', serif" }}>
                I am a...
              </h2>
              <p className="text-xs text-[#6B726C]">
                Select your account type to access the appropriate clinical or personal dashboard
              </p>
            </div>

            {/* Three primary tappable role cards */}
            <div className="grid grid-cols-1 gap-3.5">
              {/* Card 1: Patient */}
              <div
                onClick={() => {
                  setSelectedRole('PATIENT');
                  setErrorMsg(null);
                  setOtpSent(false);
                  setPatientTouched({ name: false, email: false });
                }}
                className="polysafe-card-interactive p-5 flex items-start space-x-4 group cursor-pointer border-2 border-[#E7E1D3] hover:border-[#2B6E5E] bg-white transition-all duration-180"
              >
                <div className="p-3.5 bg-[#E4F2E9] text-[#2B6E5E] rounded-2xl group-hover:bg-[#2B6E5E] group-hover:text-white transition-colors">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#232724] group-hover:text-[#2B6E5E] transition-colors" style={{ fontFamily: "'Fraunces', serif" }}>
                      Patient
                    </h3>
                    <span className="text-[11px] font-bold bg-[#E4F2E9] text-[#2B6E5E] px-2.5 py-0.5 rounded-full border border-[#2B6E5E]/20">
                      Email + OTP
                    </span>
                  </div>
                  <p className="text-xs text-[#6B726C] mt-1 leading-relaxed">
                    I manage my own medications, log daily symptoms, and monitor drug interaction alerts.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-[#6B726C] group-hover:text-[#2B6E5E] group-hover:translate-x-1 transition-all self-center" />
              </div>

              {/* Card 2: Caregiver */}
              <div
                onClick={() => {
                  setSelectedRole('CAREGIVER');
                  setErrorMsg(null);
                  setOtpSent(false);
                  setPatientTouched({ name: false, email: false });
                }}
                className="polysafe-card-interactive p-5 flex items-start space-x-4 group cursor-pointer border-2 border-[#E7E1D3] hover:border-[#8A6D3B] bg-white transition-all duration-180"
              >
                <div className="p-3.5 bg-[#FBF8F2] border border-[#8A6D3B]/20 text-[#8A6D3B] rounded-2xl group-hover:bg-[#8A6D3B] group-hover:text-white transition-colors">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#232724] group-hover:text-[#8A6D3B] transition-colors" style={{ fontFamily: "'Fraunces', serif" }}>
                      Family / Caregiver
                    </h3>
                    <span className="text-[11px] font-bold bg-[#FBEED9] text-[#8A6D3B] px-2.5 py-0.5 rounded-full border border-[#8A6D3B]/20">
                      Email + OTP
                    </span>
                  </div>
                  <p className="text-xs text-[#6B726C] mt-1 leading-relaxed">
                    I help an elderly family member manage prescriptions, verify sedative risks, and receive reminders.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-[#6B726C] group-hover:text-[#8A6D3B] group-hover:translate-x-1 transition-all self-center" />
              </div>

              {/* Card 3: Doctor */}
              <div
                onClick={() => {
                  setSelectedRole('DOCTOR');
                  setErrorMsg(null);
                  setDoctorTouched({ email: false, password: false, name: false, registrationNumber: false });
                }}
                className="polysafe-card-interactive p-5 flex items-start space-x-4 group cursor-pointer border-2 border-[#E7E1D3] hover:border-[#1B4B66] bg-white transition-all duration-180"
              >
                <div className="p-3.5 bg-[#1B4B66]/10 text-[#1B4B66] rounded-2xl group-hover:bg-[#1B4B66] group-hover:text-white transition-colors">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#232724] group-hover:text-[#1B4B66] transition-colors" style={{ fontFamily: "'Fraunces', serif" }}>
                      Doctor / Clinician
                    </h3>
                    <span className="text-[11px] font-bold bg-[#1B4B66]/10 text-[#1B4B66] px-2.5 py-0.5 rounded-full border border-[#1B4B66]/20">
                      Email + Password
                    </span>
                  </div>
                  <p className="text-xs text-[#6B726C] mt-1 leading-relaxed">
                    I am a prescribing physician reviewing patient timelines, DDInter pharmacology, and prescribing cascades.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-[#6B726C] group-hover:text-[#1B4B66] group-hover:translate-x-1 transition-all self-center" />
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-[#E7E1D3] w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider absolute">
                or explore without an account
              </span>
            </div>

            {/* Card 4: Continue as Guest (Outlined style, visually lighter) */}
            <div
              onClick={() => {
                enterGuestMode();
                notify.info('Demo Mode Active', 'Exploring PolySafe with realistic sample data.');
                navigate('/home', { replace: true });
              }}
              className="p-4 rounded-2xl border-2 border-[#E7E1D3] hover:border-[#2B6E5E] bg-[#FAF8F5] hover:bg-[#E4F2E9]/20 flex items-center space-x-3.5 group cursor-pointer transition-all duration-180"
            >
              <div className="p-2.5 bg-white border border-[#E7E1D3] text-[#2B6E5E] rounded-xl group-hover:bg-[#2B6E5E] group-hover:text-white transition-colors">
                <Compass className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#232724] group-hover:text-[#2B6E5E] transition-colors">
                    Continue as Guest
                  </h4>
                  <span className="text-[10px] font-bold text-[#2B6E5E] bg-white px-2 py-0.5 rounded-full border border-[#2B6E5E]/20">
                    Instant Demo
                  </span>
                </div>
                <p className="text-xs text-[#6B726C] mt-0.5">
                  Browse sample medications, risk graphs, and timeline cascades.
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#2B6E5E] group-hover:translate-x-1 transition-all" />
            </div>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 2: PATIENT / CAREGIVER EMAIL + OTP FLOW
           ══════════════════════════════════════════════════════════════════ */}
        {(selectedRole === 'PATIENT' || selectedRole === 'CAREGIVER') && (
          <Card className="p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E7E1D3]">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole(null);
                  setOtpSent(false);
                  setErrorMsg(null);
                  setPatientTouched({ name: false, email: false });
                }}
                className="text-xs font-bold text-[#6B726C] hover:text-[#2B6E5E] flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Change Role ({selectedRole === 'PATIENT' ? 'Patient' : 'Caregiver'})</span>
              </button>

              <span className="text-xs font-semibold px-2.5 py-1 bg-[#E4F2E9] text-[#2B6E5E] rounded-lg border border-[#2B6E5E]/20">
                Secure Email Sign-In
              </span>
            </div>

            {!otpSent ? (
              // Step 2A: Full Name & Email Form
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-2xl text-[#232724] font-bold" style={{ fontFamily: "'Fraunces', serif" }}>
                    Create Your Account
                  </h2>
                  <p className="text-xs text-[#6B726C]">
                    We will send a 6-digit verification code to your email.
                  </p>
                </div>

                {/* Full Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-[#6B726C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                    <input
                      type="text"
                      required
                      value={patientName}
                      onBlur={() => setPatientTouched((t) => ({ ...t, name: true }))}
                      onChange={(e) => {
                        setPatientName(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="e.g. Priya Sharma"
                      className={`input-field has-icon-left pl-11 text-base ${patientErrors.name ? 'input-error' : ''}`}
                    />
                  </div>
                  {patientErrors.name && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {patientErrors.name}
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-[#6B726C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                    <input
                      type="email"
                      required
                      value={patientEmail}
                      onBlur={() => setPatientTouched((t) => ({ ...t, email: true }))}
                      onChange={(e) => {
                        setPatientEmail(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="priya@example.com"
                      className={`input-field has-icon-left pl-11 text-base ${patientErrors.email ? 'input-error' : ''}`}
                    />
                  </div>
                  {patientErrors.email && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {patientErrors.email}
                    </p>
                  )}
                </div>

                {/* Remind Me / Keep me signed in */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 text-xs text-[#232724] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={remindMe}
                      onChange={(e) => {
                        setRemindMe(e.target.checked);
                        localStorage.setItem('polysafe_remind_me', String(e.target.checked));
                      }}
                      className="w-4 h-4 rounded text-[#2B6E5E] focus:ring-[#2B6E5E] border-[#E7E1D3] cursor-pointer"
                    />
                    <span className="font-medium text-[#6B726C] hover:text-[#232724] transition-colors">
                      Remind me on this device (Save login)
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={sendOtpMutation.isPending}
                  className="btn-primary w-full text-base py-3.5 mt-2"
                >
                  {sendOtpMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              // Step 2B: 6-Digit OTP Form
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-1 text-center">
                  <h2 className="text-2xl text-[#232724] font-bold" style={{ fontFamily: "'Fraunces', serif" }}>
                    Enter 6-Digit Code
                  </h2>
                  <p className="text-xs text-[#6B726C]">
                    Code sent to your email: <span className="font-bold text-[#232724]">{patientEmail}</span>
                  </p>
                </div>

                {/* Dev Mode OTP auto-hint banner */}
                {devOtpHint && (
                  <div className="p-3 bg-[#E4F2E9] border border-[#2B6E5E]/30 rounded-xl flex items-center justify-between text-xs text-[#2B6E5E]">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-[#2B6E5E]" />
                      <span><strong>Demo Mode OTP:</strong> {devOtpHint}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleFillDevOtp}
                      className="font-bold underline hover:text-[#1B453A] cursor-pointer"
                    >
                      Autofill Code
                    </button>
                  </div>
                )}

                {/* 6 OTP Boxes */}
                <div className="flex justify-center items-center gap-2 sm:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => {
                        handleOtpChange(index, e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={`otp-box ${errorMsg ? 'input-error' : ''}`}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={verifyOtpMutation.isPending}
                    className="btn-primary w-full text-base py-3.5"
                  >
                    {verifyOtpMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Verify & Sign In</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp(['', '', '', '', '', '']);
                        setErrorMsg(null);
                      }}
                      className="font-bold text-[#6B726C] hover:text-[#2B6E5E] cursor-pointer"
                    >
                      Change Email Address
                    </button>

                    {countdown > 0 ? (
                      <span className="text-[#6B726C] font-medium">
                        Resend code in <strong className="text-[#232724]">0:{countdown < 10 ? `0${countdown}` : countdown}</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={sendOtpMutation.isPending}
                        className="font-bold text-[#2B6E5E] hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Resend Code</span>
                      </button>
                    )}
                  </div>
                </div>
              </form>
            )}
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 3: DOCTOR EMAIL + PASSWORD FLOW (LOGIN / SIGNUP)
           ══════════════════════════════════════════════════════════════════ */}
        {selectedRole === 'DOCTOR' && (
          <Card className="p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E7E1D3]">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole(null);
                  setErrorMsg(null);
                }}
                className="text-xs font-bold text-[#6B726C] hover:text-[#1B4B66] flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Change Role</span>
              </button>

              <span className="text-xs font-semibold px-2.5 py-1 bg-[#1B4B66]/10 text-[#1B4B66] rounded-lg border border-[#1B4B66]/20">
                Physician Credentials
              </span>
            </div>

            {/* Login vs Signup Tab Switcher */}
            <div className="segmented-toggle-container w-full">
              <button
                type="button"
                onClick={() => {
                  setDoctorMode('login');
                  setErrorMsg(null);
                }}
                className={`segmented-toggle-btn flex-1 justify-center ${
                  doctorMode === 'login' ? 'active' : ''
                }`}
              >
                Doctor Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setDoctorMode('signup');
                  setErrorMsg(null);
                }}
                className={`segmented-toggle-btn flex-1 justify-center ${
                  doctorMode === 'signup' ? 'active' : ''
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleDoctorSubmit} className="space-y-4">
              {doctorMode === 'signup' && (
                <>
                  {/* Name field */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
                      Physician Full Name
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-[#6B726C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                      <input
                        type="text"
                        required
                        value={doctorForm.name}
                        onBlur={() => setDoctorTouched((t) => ({ ...t, name: true }))}
                        onChange={(e) => {
                          setDoctorForm({ ...doctorForm, name: e.target.value });
                          if (errorMsg) setErrorMsg(null);
                        }}
                        placeholder="Dr. Priya Sharma, MD"
                        className={`input-field has-icon-left pl-11 ${doctorErrors.name ? 'input-error' : ''}`}
                      />
                    </div>
                    {doctorErrors.name && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {doctorErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Medical Registration Number */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
                      Medical Registration / License No.
                    </label>
                    <div className="relative flex items-center">
                      <FileText className="w-4 h-4 text-[#6B726C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                      <input
                        type="text"
                        required
                        value={doctorForm.registrationNumber}
                        onBlur={() => setDoctorTouched((t) => ({ ...t, registrationNumber: true }))}
                        onChange={(e) => {
                          setDoctorForm({ ...doctorForm, registrationNumber: e.target.value });
                          if (errorMsg) setErrorMsg(null);
                        }}
                        placeholder="MCI-2024-88492"
                        className={`input-field has-icon-left pl-11 ${doctorErrors.registrationNumber ? 'input-error' : ''}`}
                      />
                    </div>
                    {doctorErrors.registrationNumber && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {doctorErrors.registrationNumber}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Email Address */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
                  Professional Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-[#6B726C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                  <input
                    type="email"
                    required
                    value={doctorForm.email}
                    onBlur={() => setDoctorTouched((t) => ({ ...t, email: true }))}
                    onChange={(e) => {
                      setDoctorForm({ ...doctorForm, email: e.target.value });
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="dr.sharma@hospital.org"
                    className={`input-field has-icon-left pl-11 ${doctorErrors.email ? 'input-error' : ''}`}
                  />
                </div>
                {doctorErrors.email && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {doctorErrors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
                  Password {doctorMode === 'signup' && '(min. 8 characters)'}
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#6B726C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                  <input
                    type="password"
                    required
                    value={doctorForm.password}
                    onBlur={() => setDoctorTouched((t) => ({ ...t, password: true }))}
                    onChange={(e) => {
                      setDoctorForm({ ...doctorForm, password: e.target.value });
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="••••••••••••"
                    className={`input-field has-icon-left pl-11 ${doctorErrors.password ? 'input-error' : ''}`}
                  />
                </div>
                {doctorErrors.password && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {doctorErrors.password}
                  </p>
                )}

                {/* Remind Me / Stay signed in */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center space-x-2 text-xs text-[#232724] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={remindMe}
                      onChange={(e) => {
                        setRemindMe(e.target.checked);
                        localStorage.setItem('polysafe_remind_me', String(e.target.checked));
                      }}
                      className="w-4 h-4 rounded text-[#1B4B66] focus:ring-[#1B4B66] border-[#E7E1D3] cursor-pointer"
                    />
                    <span className="font-medium text-[#6B726C] hover:text-[#232724] transition-colors">
                      Remind me on this device (Save login)
                    </span>
                  </label>
                </div>

                {/* Password strength meter — Visible during signup only */}
                {doctorMode === 'signup' && doctorForm.password && (
                  <div className="mt-2 space-y-1.5 p-2.5 bg-[#FAF8F5] border border-[#E7E1D3] rounded-xl text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B726C]">Password Strength:</span>
                      <span className="font-bold" style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-[#E7E1D3] rounded-full overflow-hidden flex gap-1">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(passwordStrength.score / 3) * 100}%`,
                          backgroundColor: passwordStrength.color,
                        }}
                      />
                    </div>

                    {/* Hints checklist */}
                    <div className="grid grid-cols-2 gap-1 pt-1 text-[11px] text-[#6B726C]">
                      <div className="flex items-center gap-1">
                        {passwordStrength.hasLen ? (
                          <Check className="w-3 h-3 text-[#2B6E5E]" />
                        ) : (
                          <X className="w-3 h-3 text-[#9CA3AF]" />
                        )}
                        <span className={passwordStrength.hasLen ? 'text-[#232724] font-medium' : ''}>8+ characters</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {passwordStrength.hasNum ? (
                          <Check className="w-3 h-3 text-[#2B6E5E]" />
                        ) : (
                          <X className="w-3 h-3 text-[#9CA3AF]" />
                        )}
                        <span className={passwordStrength.hasNum ? 'text-[#232724] font-medium' : ''}>Contains number</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={doctorLoginMutation.isPending || doctorSignupMutation.isPending}
                className="btn-primary w-full text-base py-3.5 mt-2"
              >
                {(doctorLoginMutation.isPending || doctorSignupMutation.isPending) ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-5 h-5" />
                    <span>
                      {doctorMode === 'signup' ? 'Create Doctor Account' : 'Sign In to Clinical Portal'}
                    </span>
                  </>
                )}
              </button>
            </form>
          </Card>
        )}

        {/* Footer Disclaimer */}
        <div className="text-center text-xs text-[#6B726C]">
          <p>PolySafe is an informational clinical decision support system.</p>
          <p className="text-[11px] text-[#6B726C]/80 mt-0.5">
            Prescription changes must always be confirmed directly with your healthcare provider.
          </p>
        </div>

      </div>
    </PageTransition>
  );
}
