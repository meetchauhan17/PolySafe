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

 // Global error message displayed in the error banner
 const [errorMsg, setErrorMsg] = useState(null);

 // ── Patient/Caregiver 3-step flow state ─────────────────────────────────────
 // Step 0: role select to Step 1: email entry to Step 2a: signup form
 // OR to Step 2b: login form to Step 3: OTP verification (new users only)
 const [pcStep, setPcStep] = useState('email'); // 'email' | 'signup' | 'login' | 'otp'

 const [patientEmail, setPatientEmail] = useState('');
 const [patientEmailTouched, setPatientEmailTouched] = useState(false);

 // Signup-specific fields
 const [signupName, setSignupName] = useState('');
 const [signupPassword, setSignupPassword] = useState('');
 const [signupTouched, setSignupTouched] = useState({ name: false, password: false });

 // Login-specific fields
 const [loginPassword, setLoginPassword] = useState('');
 const [loginTouched, setLoginTouched] = useState({ password: false });
 const [lockoutUntil, setLockoutUntil] = useState(null); // ISO string or null
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

 // OTP state (shared, only used in 'otp' step)
 const [otp, setOtp] = useState(['', '', '', '', '', '']);
 const [devOtpHint, setDevOtpHint] = useState(null);
 const [countdown, setCountdown] = useState(30);
 const countdownTimerRef = useRef(null);
 const otpInputRefs = useRef([]);

 // Remind Me state
 const [remindMe, setRemindMe] = useState(() => {
 return localStorage.getItem('polysafe_remind_me') !== 'false';
 });

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

 // Load remembered email on mount
 useEffect(() => {
 const savedEmail = localStorage.getItem('polysafe_saved_email');
 if (savedEmail) setPatientEmail(savedEmail);
 }, []);

 // ─── Countdown Timer for OTP Resend ─────────────────────────────────────────
 useEffect(() => {
 if (pcStep === 'otp' && countdown > 0) {
 countdownTimerRef.current = setTimeout(() => {
 setCountdown((prev) => prev - 1);
 }, 1000);
 } else {
 clearTimeout(countdownTimerRef.current);
 }
 return () => clearTimeout(countdownTimerRef.current);
 }, [pcStep, countdown]);

 // ─── Signup password strength (shared helper) ────────────────────────────────
 const calcStrength = (pwd) => {
 if (!pwd) return { score: 0, label: 'Empty', color: '#6B726C', hasLen: false, hasNum: false, hasSpecial: false };
 const hasLen = pwd.length >= 8;
 const hasNum = /\d/.test(pwd);
 const hasSpecial = /[^A-Za-z0-9]/.test(pwd) || /[A-Z]/.test(pwd);
 let score = 0;
 if (hasLen) score++;
 if (hasNum) score++;
 if (hasSpecial) score++;
 let label = 'Weak', color = '#B23D25';
 if (score === 2) { label = 'Moderate'; color = '#B5791A'; }
 else if (score === 3) { label = 'Strong'; color = '#2B6E5E'; }
 return { score, label, color, hasLen, hasNum, hasSpecial };
 };

 const signupPasswordStrength = useMemo(() => calcStrength(signupPassword), [signupPassword]);

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

 // ─── Patient / Caregiver Inline Validation ───────────────────────────────────
 const emailError = useMemo(() => {
 if (!patientEmailTouched) return null;
 if (!patientEmail.trim()) return 'Email address is required.';
 if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail.trim())) return 'Please enter a valid email address.';
 return null;
 }, [patientEmail, patientEmailTouched]);

 const signupErrors = useMemo(() => {
 const errors = {};
 if (signupTouched.name) {
 if (!signupName.trim()) errors.name = 'Full name is required.';
 else if (signupName.trim().length < 2) errors.name = 'Please enter your full name (at least 2 characters).';
 }
 if (signupTouched.password) {
 if (!signupPassword) errors.password = 'Password is required.';
 else if (signupPassword.length < 8) errors.password = 'Password must be at least 8 characters.';
 }
 return errors;
 }, [signupName, signupPassword, signupTouched]);

 const loginPasswordError = useMemo(() => {
 if (!loginTouched.password) return null;
 if (!loginPassword) return 'Password is required.';
 return null;
 }, [loginPassword, loginTouched]);

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

 // ── Helper: navigate after successful patient/caregiver auth ─────────────────
 const handlePatientAuthSuccess = (data, isNewUser = false) => {
 setErrorMsg(null);
 if (remindMe) {
 localStorage.setItem('polysafe_saved_email', patientEmail.trim());
 } else {
 localStorage.removeItem('polysafe_saved_email');
 }
 if (data.token) {
 login(data.token, selectedRole || 'PATIENT', data.user);
 }
 notify.success('Welcome to PolySafe', isNewUser ? 'Your account has been created.' : 'Signed in successfully.');
 if (selectedRole === 'CAREGIVER') {
 navigate('/caregiver-view', { replace: true });
 } else if (isNewUser || !data.user?.patient) {
 navigate('/onboarding', { replace: true });
 } else {
 navigate('/home', { replace: true });
 }
 };

 // 1. Check Email Mutation
 // Also handles "smooth redirect": if the user somehow reached signup but the
 // email already exists (or vice versa), we silently move them to the right step.
 const checkEmailMutation = useMutation({
 mutationFn: ({ email, role }) => authApi.checkEmail({ email, role }),
 onSuccess: (data) => {
 setErrorMsg(null);
 const targetStep = data.exists ? 'login' : 'signup';
 // Smooth redirect: if we're already on a step and get a contradictory result,
 // silently move to the correct step and show a brief contextual notice.
 if (pcStep === 'signup' && data.exists) {
 notify.info('Account Found', 'This email already has an account. Sign in instead.');
 } else if (pcStep === 'login' && !data.exists) {
 notify.info('New Email', 'No account found. Create one below.');
 }
 setPcStep(targetStep);
 },
 onError: (err) => {
 const msg = err.response?.data?.error || 'Could not check email. Please try again.';
 setErrorMsg(msg);
 notify.error('Error', msg);
 },
 });

 // 2. Signup: Send OTP Mutation
 const signupSendOtpMutation = useMutation({
 mutationFn: ({ name, email, password, role }) => authApi.signupSendOtp({ name, email, password, role }),
 onSuccess: (data) => {
 setErrorMsg(null);
 setOtp(['', '', '', '', '', '']);
 setCountdown(30);
 setPcStep('otp');
 notify.success('Code Sent', `A 6-digit code was sent to ${patientEmail.trim()}.`);
 if (data._devOtp) setDevOtpHint(data._devOtp);
 setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
 },
 onError: (err) => {
 const msg = err.response?.data?.error || 'Failed to send verification code.';
 setErrorMsg(msg);
 notify.error('Send Failed', msg);
 },
 });

 // 3. Signup: Verify OTP Mutation
 const verifySignupOtpMutation = useMutation({
 mutationFn: ({ email, code }) => authApi.verifySignupOtp({ email, code }),
 onSuccess: (data) => handlePatientAuthSuccess(data, true),
 onError: (err) => {
 const msg = err.response?.data?.error || 'Invalid or expired code. Please try again.';
 setErrorMsg(msg);
 notify.error('Verification Failed', msg);
 },
 });

 // 4. Login Mutation (returning users — email + password, no OTP)
 const patientLoginMutation = useMutation({
 mutationFn: ({ email, password, role }) => authApi.patientLogin({ email, password, role }),
 onSuccess: (data) => handlePatientAuthSuccess(data, false),
 onError: (err) => {
 const errData = err.response?.data;
 const msg = errData?.error || 'Invalid email or password.';
 if (errData?.lockedUntil) setLockoutUntil(errData.lockedUntil);
 setErrorMsg(msg);
 notify.error('Sign In Failed', msg);
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
 const errData = err.response?.data;
 const msg = errData?.error || err.message || 'Invalid email or password.';
 if (errData?.lockedUntil) setLockoutUntil(errData.lockedUntil);
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

 const resetPcFlow = () => {
 setPcStep('email');
 setPatientEmail('');
 setPatientEmailTouched(false);
 setSignupName('');
 setSignupPassword('');
 setSignupTouched({ name: false, password: false });
 setLoginPassword('');
 setLoginTouched({ password: false });
 setLockoutUntil(null);
 setOtp(['', '', '', '', '', '']);
 setDevOtpHint(null);
 setErrorMsg(null);
 };

 const handleEmailContinue = (e) => {
 e?.preventDefault();
 setPatientEmailTouched(true);
 setErrorMsg(null);
 const cleanEmail = patientEmail.trim();
 if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
 setErrorMsg('Please enter a valid email address.');
 return;
 }
 checkEmailMutation.mutate({ email: cleanEmail, role: selectedRole || 'PATIENT' });
 };

 const handleSignupSubmit = (e) => {
 e?.preventDefault();
 setSignupTouched({ name: true, password: true });
 setErrorMsg(null);
 const cleanName = signupName.trim();
 const cleanEmail = patientEmail.trim();
 if (!cleanName || cleanName.length < 2) { setErrorMsg('Please enter your full name.'); return; }
 if (!signupPassword || signupPassword.length < 8) { setErrorMsg('Password must be at least 8 characters.'); return; }
 signupSendOtpMutation.mutate({ name: cleanName, email: cleanEmail, password: signupPassword, role: selectedRole || 'PATIENT' });
 };

 const handleLoginSubmit = (e) => {
 e?.preventDefault();
 setLoginTouched({ password: true });
 setErrorMsg(null);
 if (!loginPassword) { setErrorMsg('Please enter your password.'); return; }
 patientLoginMutation.mutate({ email: patientEmail.trim(), password: loginPassword, role: selectedRole || 'PATIENT' });
 };

 // Resend OTP (calls signup-send-otp again with same data stored in state)
 const handleResendOtp = () => {
 setErrorMsg(null);
 setOtp(['', '', '', '', '', '']);
 setCountdown(30);
 signupSendOtpMutation.mutate({
 name: signupName.trim(),
 email: patientEmail.trim(),
 password: signupPassword,
 role: selectedRole || 'PATIENT',
 });
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
 verifySignupOtpMutation.mutate({
 email: patientEmail.trim(),
 code,
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
 <PageTransition className="min-h-[88vh] bg-[#EDE8DC] flex items-center justify-center px-4 py-12">
 <div className="max-w-xl w-full space-y-6">

 {/* Brand Header */}
 <div className="text-center space-y-2">
 <div className="icon-well w-16 h-16 mx-auto mb-2">
 <ShieldCheck className="w-8 h-8 text-[#2B6E5E]" />
 </div>
 <h1 className="text-3xl md:text-4xl text-[#1C2B27] font-bold tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
 PolySafe
 </h1>
 <p className="text-sm text-[#5C6B64] max-w-sm mx-auto">
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
 <h2 className="text-2xl text-[#1C2B27] font-bold" style={{ fontFamily: "'Fraunces', serif" }}>
 I am a...
 </h2>
 <p className="text-xs text-[#5C6B64]">
 Select your account type to access the appropriate clinical or personal dashboard
 </p>
 </div>

 {/* Three primary tappable role cards */}
 <div className="grid grid-cols-1 gap-4">
 {/* Card 1: Patient */}
 <div
 onClick={() => {
 setSelectedRole('PATIENT');
 resetPcFlow();
 }}
 className="p-5 flex items-start space-x-4 group cursor-pointer bg-[#EDE8DC] shadow-[6px_6px_14px_rgba(191,180,155,0.55),-6px_-6px_14px_rgba(255,255,255,0.65)] hover:shadow-[10px_10px_20px_rgba(191,180,155,0.65),-10px_-10px_20px_rgba(255,255,255,0.75)] active:shadow-[inset_4px_4px_8px_rgba(191,180,155,0.55)] rounded-2xl transition-all duration-180"
 >
 <div className="icon-well w-12 h-12 flex-shrink-0 group-hover:scale-105 transition-transform">
 <User className="w-6 h-6 text-[#2B6E5E]" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between">
 <h3 className="text-lg font-bold text-[#1C2B27] group-hover:text-[#2B6E5E] transition-colors" style={{ fontFamily: "'Fraunces', serif" }}>
 Patient
 </h3>
 <span className="text-[11px] font-bold bg-[#EDE8DC] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.45),inset_-2px_-2px_4px_rgba(255,255,255,0.6)] text-[#2B6E5E] px-2.5 py-0.5 rounded-xl">
 Email + Password
 </span>
 </div>
 <p className="text-xs text-[#5C6B64] mt-1 leading-relaxed">
 I manage my own medications, log daily symptoms, and monitor drug interaction alerts.
 </p>
 </div>
 <ArrowRight className="w-5 h-5 text-[#5C6B64] group-hover:text-[#2B6E5E] group-hover:translate-x-1 transition-all self-center flex-shrink-0" />
 </div>

 {/* Card 2: Caregiver */}
 <div
 onClick={() => {
 setSelectedRole('CAREGIVER');
 resetPcFlow();
 }}
 className="p-5 flex items-start space-x-4 group cursor-pointer bg-[#EDE8DC] shadow-[6px_6px_14px_rgba(191,180,155,0.55),-6px_-6px_14px_rgba(255,255,255,0.65)] hover:shadow-[10px_10px_20px_rgba(191,180,155,0.65),-10px_-10px_20px_rgba(255,255,255,0.75)] active:shadow-[inset_4px_4px_8px_rgba(191,180,155,0.55)] rounded-2xl transition-all duration-180"
 >
 <div className="icon-well w-12 h-12 flex-shrink-0 group-hover:scale-105 transition-transform">
 <HeartHandshake className="w-6 h-6 text-[#8A6D3B]" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between">
 <h3 className="text-lg font-bold text-[#1C2B27] group-hover:text-[#8A6D3B] transition-colors" style={{ fontFamily: "'Fraunces', serif" }}>
 Family / Caregiver
 </h3>
 <span className="text-[11px] font-bold bg-[#EDE8DC] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.45),inset_-2px_-2px_4px_rgba(255,255,255,0.6)] text-[#8A6D3B] px-2.5 py-0.5 rounded-xl">
 Email + Password
 </span>
 </div>
 <p className="text-xs text-[#5C6B64] mt-1 leading-relaxed">
 I help an elderly family member manage prescriptions, verify sedative risks, and receive reminders.
 </p>
 </div>
 <ArrowRight className="w-5 h-5 text-[#5C6B64] group-hover:text-[#8A6D3B] group-hover:translate-x-1 transition-all self-center flex-shrink-0" />
 </div>

 {/* Card 3: Doctor */}
 <div
 onClick={() => {
 setSelectedRole('DOCTOR');
 setErrorMsg(null);
 setDoctorTouched({ email: false, password: false, name: false, registrationNumber: false });
 }}
 className="p-5 flex items-start space-x-4 group cursor-pointer bg-[#EDE8DC] shadow-[6px_6px_14px_rgba(191,180,155,0.55),-6px_-6px_14px_rgba(255,255,255,0.65)] hover:shadow-[10px_10px_20px_rgba(191,180,155,0.65),-10px_-10px_20px_rgba(255,255,255,0.75)] active:shadow-[inset_4px_4px_8px_rgba(191,180,155,0.55)] rounded-2xl transition-all duration-180"
 >
 <div className="icon-well w-12 h-12 flex-shrink-0 group-hover:scale-105 transition-transform">
 <Stethoscope className="w-6 h-6 text-[#1B4B66]" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between">
 <h3 className="text-lg font-bold text-[#1C2B27] group-hover:text-[#1B4B66] transition-colors" style={{ fontFamily: "'Fraunces', serif" }}>
 Doctor / Clinician
 </h3>
 <span className="text-[11px] font-bold bg-[#EDE8DC] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.45),inset_-2px_-2px_4px_rgba(255,255,255,0.6)] text-[#1B4B66] px-2.5 py-0.5 rounded-xl">
 Email + Password
 </span>
 </div>
 <p className="text-xs text-[#5C6B64] mt-1 leading-relaxed">
 I am a prescribing physician reviewing patient timelines, DDInter pharmacology, and prescribing cascades.
 </p>
 </div>
 <ArrowRight className="w-5 h-5 text-[#5C6B64] group-hover:text-[#1B4B66] group-hover:translate-x-1 transition-all self-center flex-shrink-0" />
 </div>
 </div>

 {/* Divider */}
 <div className="relative flex items-center justify-center my-4">
 <div className="border-t border-[rgba(191,180,155,0.4)] w-full" />
 <span className="bg-[#EDE8DC] px-3 text-[11px] font-semibold text-[#5C6B64] uppercase tracking-wider absolute">
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
 <div className="p-2.5 bg-[#EDE8DC] shadow-[inset_2px_2px_4px_rgba(191,180,155,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.6)] border border-[rgba(191,180,155,0.3)] text-[#2B6E5E] rounded-xl group-hover:bg-[#2B6E5E] group-hover:text-white transition-colors">
 <Compass className="w-5 h-5" />
 </div>
 <div className="flex-1">
 <div className="flex items-center justify-between">
 <h4 className="text-sm font-bold text-[#232724] group-hover:text-[#2B6E5E] transition-colors">
 Continue as Guest
 </h4>
 <span className="text-[10px] font-bold text-[#2B6E5E] bg-[#E4F2E9] px-2 py-0.5 rounded-full border border-[#2B6E5E]/30">
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
 PATIENT / CAREGIVER 3-STEP AUTH FLOW
 ══════════════════════════════════════════════════════════════════ */}
 {(selectedRole === 'PATIENT' || selectedRole === 'CAREGIVER') && (
 <Card className="p-6 md:p-8 space-y-6">
 {/* Card header: back button + role badge */}
 <div className="flex items-center justify-between pb-4 border-b border-[#E7E1D3]">
 <button
 type="button"
 onClick={() => {
 if (pcStep === 'email') {
 setSelectedRole(null);
 resetPcFlow();
 } else if (pcStep === 'signup' || pcStep === 'login') {
 setPcStep('email');
 setErrorMsg(null);
 } else if (pcStep === 'otp') {
 setPcStep('signup');
 setErrorMsg(null);
 }
 }}
 className="text-xs font-bold text-[#6B726C] hover:text-[#2B6E5E] flex items-center space-x-1 transition-colors cursor-pointer"
 >
 <ArrowLeft className="w-4 h-4" />
 <span>
 {pcStep === 'email'
 ? `Change Role (${selectedRole === 'PATIENT' ? 'Patient' : 'Caregiver'})`
 : 'Back'}
 </span>
 </button>
 <span className="text-xs font-semibold px-2.5 py-1 bg-[#E4F2E9] text-[#2B6E5E] rounded-lg border border-[#2B6E5E]/20">
 {pcStep === 'email' && 'Step 1 of 3'}
 {pcStep === 'signup' && 'Step 2 of 3 — New Account'}
 {pcStep === 'login' && 'Sign In'}
 {pcStep === 'otp' && 'Step 3 of 3 — Verify'}
 </span>
 </div>

 {/* ── Step 1: Email entry ── */}
 {pcStep === 'email' && (
 <form onSubmit={handleEmailContinue} className="space-y-5">
 <div className="space-y-2">
 <h2 className="text-2xl text-[#232724] font-bold" style={{ fontFamily: "'Fraunces', serif" }}>
 Enter Your Email
 </h2>
 <p className="text-xs text-[#6B726C]">
 We'll check if you have an account and show the right next step.
 </p>
 {/* OTP explainer — sets expectation before the user commits */}
 <div className="flex items-start gap-2 mt-1 p-2.5 bg-[#E4F2E9]/60 border border-[#2B6E5E]/15 rounded-xl">
 <ShieldCheck className="w-3.5 h-3.5 text-[#2B6E5E] flex-shrink-0 mt-0.5" />
 <p className="text-[11px] text-[#2B6E5E] leading-relaxed">
 We'll verify your email once when you sign up — after that, just use your password.
 </p>
 </div>
 </div>

 <div className="space-y-1">
 <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
 Email Address
 </label>
 <PolySafeInput
 type="email"
 required
 autoFocus
 value={patientEmail}
 onBlur={() => setPatientEmailTouched(true)}
 onChange={(e) => { setPatientEmail(e.target.value); if (errorMsg) setErrorMsg(null); }}
 placeholder="priya@example.com"
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

 <button
 type="submit"
 disabled={checkEmailMutation.isPending}
 className="btn-primary w-full text-base py-3.5 mt-1"
 >
 {checkEmailMutation.isPending ? (
 <><Loader2 className="w-5 h-5 animate-spin" /><span>Checking...</span></>
 ) : (
 <><span>Continue</span><ArrowRight className="w-5 h-5" /></>
 )}
 </button>
 </form>
 )}

 {/* ── Step 2a: Signup form (new user) ── */}
 {pcStep === 'signup' && (
 <form onSubmit={handleSignupSubmit} className="space-y-4">
 <div className="space-y-2">
 <h2 className="text-2xl text-[#232724] font-bold" style={{ fontFamily: "'Fraunces', serif" }}>
 Create Your Account
 </h2>
 {/* Read-only email pill with edit link */}
 <div className="flex items-center gap-2">
 <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F3F0EA] border border-[#E7E1D3] rounded-xl text-xs text-[#232724] font-medium min-w-0">
 <Mail className="w-3.5 h-3.5 text-[#6B726C] flex-shrink-0" />
 <span className="truncate">{patientEmail}</span>
 </div>
 <button
 type="button"
 onClick={() => { setPcStep('email'); setErrorMsg(null); }}
 className="text-xs font-bold text-[#2B6E5E] hover:underline whitespace-nowrap cursor-pointer flex-shrink-0"
 >
 Change
 </button>
 </div>
 <p className="text-xs text-[#6B726C]">
 A 6-digit verification code will be emailed to you after you set a password — this only happens once.
 </p>
 </div>

 {/* Full Name */}
 <div className="space-y-1">
 <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">Full Name</label>
 <PolySafeInput
 type="text"
 required
 autoFocus
 value={signupName}
 onBlur={() => setSignupTouched((t) => ({ ...t, name: true }))}
 onChange={(e) => { setSignupName(e.target.value); if (errorMsg) setErrorMsg(null); }}
 placeholder="e.g. Priya Sharma"
 error={Boolean(signupErrors.name)}
 leftIcon={<User className="w-4 h-4" />}
 className="text-base"
 />
 {signupErrors.name && (
 <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
 <AlertCircle className="w-3.5 h-3.5" />{signupErrors.name}
 </p>
 )}
 </div>

 {/* Password */}
 <div className="space-y-1">
 <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">Password (min. 8 characters)</label>
 <PolySafeInput
 type="password"
 required
 value={signupPassword}
 onBlur={() => setSignupTouched((t) => ({ ...t, password: true }))}
 onChange={(e) => { setSignupPassword(e.target.value); if (errorMsg) setErrorMsg(null); }}
 placeholder="••••••••••••"
 error={Boolean(signupErrors.password)}
 leftIcon={<Lock className="w-4 h-4" />}
 className="text-base"
 />
 {signupErrors.password && (
 <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
 <AlertCircle className="w-3.5 h-3.5" />{signupErrors.password}
 </p>
 )}
 {/* Password strength meter */}
 {signupPassword && (
 <div className="mt-2 space-y-1.5 p-2.5 bg-[#FAF8F5] border border-[#E7E1D3] rounded-xl text-xs">
 <div className="flex items-center justify-between">
 <span className="text-[#6B726C]">Password Strength:</span>
 <span className="font-bold" style={{ color: signupPasswordStrength.color }}>{signupPasswordStrength.label}</span>
 </div>
 <div className="h-1.5 w-full bg-[#E7E1D3] rounded-full overflow-hidden">
 <div
 className="h-full rounded-full transition-all duration-300"
 style={{ width: `${(signupPasswordStrength.score / 3) * 100}%`, backgroundColor: signupPasswordStrength.color }}
 />
 </div>
 <div className="grid grid-cols-2 gap-1 pt-1 text-[11px] text-[#6B726C]">
 <div className="flex items-center gap-1">
 {signupPasswordStrength.hasLen ? <Check className="w-3 h-3 text-[#2B6E5E]" /> : <X className="w-3 h-3 text-[#9CA3AF]" />}
 <span className={signupPasswordStrength.hasLen ? 'text-[#232724] font-medium' : ''}>8+ characters</span>
 </div>
 <div className="flex items-center gap-1">
 {signupPasswordStrength.hasNum ? <Check className="w-3 h-3 text-[#2B6E5E]" /> : <X className="w-3 h-3 text-[#9CA3AF]" />}
 <span className={signupPasswordStrength.hasNum ? 'text-[#232724] font-medium' : ''}>Contains number</span>
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
 className="w-4 h-4 rounded text-[#2B6E5E] focus:ring-[#2B6E5E] border-[#E7E1D3] cursor-pointer"
 />
 <span className="font-medium text-[#6B726C] hover:text-[#232724] transition-colors">Remind me on this device</span>
 </label>
 </div>

 <button
 type="submit"
 disabled={signupSendOtpMutation.isPending}
 className="btn-primary w-full text-base py-3.5 mt-1"
 >
 {signupSendOtpMutation.isPending ? (
 <><Loader2 className="w-5 h-5 animate-spin" /><span>Sending Code...</span></>
 ) : (
 <><span>Create Account & Send Code</span><ArrowRight className="w-5 h-5" /></>
 )}
 </button>

 {/* Already have an account? Smooth redirect */}
 <p className="text-center text-xs text-[#6B726C]">
 Already have an account?{' '}
 <button
 type="button"
 onClick={() => checkEmailMutation.mutate({ email: patientEmail.trim(), role: selectedRole || 'PATIENT' })}
 className="font-bold text-[#2B6E5E] hover:underline cursor-pointer"
 >
 Sign in instead
 </button>
 </p>
 </form>
 )}

 {/* ── Step 2b: Login form (returning user) ── */}
 {pcStep === 'login' && (
 <form onSubmit={handleLoginSubmit} className="space-y-4">
 <div className="space-y-2">
 <h2 className="text-2xl text-[#232724] font-bold" style={{ fontFamily: "'Fraunces', serif" }}>
 Welcome Back
 </h2>
 {/* Read-only email pill with "Change" link */}
 <div className="flex items-center gap-2">
 <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F3F0EA] border border-[#E7E1D3] rounded-xl text-xs text-[#232724] font-medium min-w-0">
 <Mail className="w-3.5 h-3.5 text-[#6B726C] flex-shrink-0" />
 <span className="truncate">{patientEmail}</span>
 </div>
 <button
 type="button"
 onClick={() => { setPcStep('email'); setLoginPassword(''); setLoginTouched({ password: false }); setErrorMsg(null); }}
 className="text-xs font-bold text-[#2B6E5E] hover:underline whitespace-nowrap cursor-pointer flex-shrink-0"
 >
 Change
 </button>
 </div>
 </div>

 {/* Lockout banner — prominent live seconds countdown, auto-reenables */}
 {lockoutSecsLeft > 0 && (
 <div className="p-4 bg-[#FBEED9] border-2 border-[#B5791A] rounded-2xl text-sm text-[#7A4A0A] space-y-1 shadow-sm">
 <div className="flex items-center gap-2 font-bold text-[#7A4A0A]">
 <AlertCircle className="w-4 h-4 text-[#B5791A] flex-shrink-0" />
 Account temporarily locked
 </div>
 <p className="text-xs text-[#7A4A0A] pl-6">
 Too many failed attempts. Try again in{' '}
 <strong className="font-bold font-mono text-[#1C2B27]">
 {lockoutSecsLeft} second{lockoutSecsLeft !== 1 ? 's' : ''}
 </strong>.
 </p>
 </div>
 )}

 {/* Password */}
 <div className="space-y-1">
 <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">Password</label>
 <PolySafeInput
 type="password"
 required
 autoFocus
 value={loginPassword}
 onBlur={() => setLoginTouched({ password: true })}
 onChange={(e) => { setLoginPassword(e.target.value); if (errorMsg) setErrorMsg(null); }}
 placeholder="••••••••••••"
 disabled={lockoutSecsLeft > 0}
 error={Boolean(loginPasswordError)}
 leftIcon={<Lock className="w-4 h-4" />}
 className="text-base"
 />
 {loginPasswordError && (
 <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
 <AlertCircle className="w-3.5 h-3.5" />{loginPasswordError}
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
 className="w-4 h-4 rounded text-[#2B6E5E] focus:ring-[#2B6E5E] border-[#E7E1D3] cursor-pointer"
 />
 <span className="font-medium text-[#6B726C] hover:text-[#232724] transition-colors">Remind me on this device</span>
 </label>
 </div>

 <button
 type="submit"
 disabled={patientLoginMutation.isPending || lockoutSecsLeft > 0}
 className="btn-primary w-full text-base py-3.5 mt-1"
 >
 {patientLoginMutation.isPending ? (
 <><Loader2 className="w-5 h-5 animate-spin" /><span>Signing In...</span></>
 ) : (
 <><KeyRound className="w-5 h-5" /><span>Sign In</span></>
 )}
 </button>

 {/* Don't have an account? Smooth redirect */}
 <p className="text-center text-xs text-[#6B726C]">
 Don't have an account?{' '}
 <button
 type="button"
 onClick={() => checkEmailMutation.mutate({ email: patientEmail.trim(), role: selectedRole || 'PATIENT' })}
 className="font-bold text-[#2B6E5E] hover:underline cursor-pointer"
 >
 Create one
 </button>
 </p>
 </form>
 )}

 {/* ── Step 3: OTP Verification (new users only) ── */}
 {pcStep === 'otp' && (
 <form onSubmit={handleVerifyOtp} className="space-y-6">
 <div className="space-y-1 text-center">
 <h2 className="text-2xl text-[#232724] font-bold" style={{ fontFamily: "'Fraunces', serif" }}>
 Enter Verification Code
 </h2>
 <p className="text-xs text-[#6B726C]">
 6-digit code sent to <span className="font-bold text-[#232724]">{patientEmail}</span>
 </p>
 </div>

 {/* Dev OTP hint */}
 {devOtpHint && (
 <div className="p-3 bg-[#E4F2E9] border border-[#2B6E5E]/30 rounded-xl flex items-center justify-between text-xs text-[#2B6E5E]">
 <div className="flex items-center space-x-2">
 <Sparkles className="w-4 h-4" />
 <span><strong>Dev OTP:</strong> {devOtpHint}</span>
 </div>
 <button type="button" onClick={handleFillDevOtp} className="font-bold underline cursor-pointer">Autofill</button>
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
 onChange={(e) => { handleOtpChange(index, e.target.value); if (errorMsg) setErrorMsg(null); }}
 onKeyDown={(e) => handleOtpKeyDown(index, e)}
 className={`otp-box ${errorMsg ? 'input-error' : ''}`}
 autoFocus={index === 0}
 />
 ))}
 </div>

 <div className="space-y-3">
 <button
 type="submit"
 disabled={verifySignupOtpMutation.isPending}
 className="btn-primary w-full text-base py-3.5"
 >
 {verifySignupOtpMutation.isPending ? (
 <><Loader2 className="w-5 h-5 animate-spin" /><span>Verifying...</span></>
 ) : (
 <><CheckCircle2 className="w-5 h-5" /><span>Verify & Create Account</span></>
 )}
 </button>

 <div className="flex items-center justify-between pt-2 text-xs">
 <button
 type="button"
 onClick={() => { setPcStep('signup'); setOtp(['', '', '', '', '', '']); setErrorMsg(null); }}
 className="font-bold text-[#6B726C] hover:text-[#2B6E5E] cursor-pointer"
 >
 Change Password
 </button>

 {countdown > 0 ? (
 <span className="text-[#6B726C] font-medium">
 Resend in <strong className="text-[#232724]">0:{countdown < 10 ? `0${countdown}` : countdown}</strong>
 </span>
 ) : (
 <button
 type="button"
 onClick={handleResendOtp}
 disabled={signupSendOtpMutation.isPending}
 className="font-bold text-[#2B6E5E] hover:underline flex items-center space-x-1 cursor-pointer"
 >
 <RefreshCw className="w-3.5 h-3.5" /><span>Resend Code</span>
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
 {/* Doctor Lockout banner */}
 {doctorMode === 'login' && lockoutSecsLeft > 0 && (
 <div className="p-4 bg-[#FBEED9] border-2 border-[#B5791A] rounded-2xl text-sm text-[#7A4A0A] space-y-1 shadow-sm">
 <div className="flex items-center gap-2 font-bold text-[#7A4A0A]">
 <AlertCircle className="w-4 h-4 text-[#B5791A] flex-shrink-0" />
 Account temporarily locked
 </div>
 <p className="text-xs text-[#7A4A0A] pl-6">
 Too many failed attempts. Try again in{' '}
 <strong className="font-bold font-mono text-[#1C2B27]">
 {lockoutSecsLeft} second{lockoutSecsLeft !== 1 ? 's' : ''}
 </strong>.
 </p>
 </div>
 )}

 {doctorMode === 'signup' && (
 <>
 {/* Name field */}
 <div className="space-y-1">
 <label className="block text-xs font-bold text-[#232724] uppercase tracking-wider">
 Physician Full Name
 </label>
 <PolySafeInput
 type="text"
 required
 value={doctorForm.name}
 onBlur={() => setDoctorTouched((t) => ({ ...t, name: true }))}
 onChange={(e) => {
 setDoctorForm({ ...doctorForm, name: e.target.value });
 if (errorMsg) setErrorMsg(null);
 }}
 placeholder="Dr. Priya Sharma, MD"
 error={Boolean(doctorErrors.name)}
 leftIcon={<User className="w-4 h-4" />}
 />
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
 <PolySafeInput
 type="text"
 required
 value={doctorForm.registrationNumber}
 onBlur={() => setDoctorTouched((t) => ({ ...t, registrationNumber: true }))}
 onChange={(e) => {
 setDoctorForm({ ...doctorForm, registrationNumber: e.target.value });
 if (errorMsg) setErrorMsg(null);
 }}
 placeholder="MCI-2024-88492"
 error={Boolean(doctorErrors.registrationNumber)}
 leftIcon={<FileText className="w-4 h-4" />}
 />
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
 <PolySafeInput
 type="email"
 required
 value={doctorForm.email}
 onBlur={() => setDoctorTouched((t) => ({ ...t, email: true }))}
 onChange={(e) => {
 setDoctorForm({ ...doctorForm, email: e.target.value });
 if (errorMsg) setErrorMsg(null);
 }}
 placeholder="dr.sharma@hospital.org"
 error={Boolean(doctorErrors.email)}
 leftIcon={<Mail className="w-4 h-4" />}
 />
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
 disabled={doctorLoginMutation.isPending || doctorSignupMutation.isPending || (doctorMode === 'login' && lockoutSecsLeft > 0)}
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
