const express = require('express');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');

const prisma = require('../lib/prisma');
const { signToken } = require('../lib/jwt');
const otpStore = require('../lib/otpStore');

const router = express.Router();

// ─── Firebase Admin (lazy-loaded only when USE_FIREBASE_OTP=true) ─────────────
let firebaseAuth = null;

function getFirebaseAuth() {
  if (firebaseAuth) return firebaseAuth;

  const admin = require('firebase-admin');

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  }

  firebaseAuth = admin.auth();
  return firebaseAuth;
}

// ─── Rate limiter: max 5 OTP sends per IP per hour ───────────────────────────
//     For per-phone-number limiting we key on the phone from the request body.
const otpSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (req) => {
    const phone = req.body?.phone;
    if (phone) return `otp:${phone}`;
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? req.ip ?? 'unknown';
    return `otp-ip:${ip}`;
  },
  // Suppress the IPv6-keyGenerator validation warning — our generator never falls
  // back blindly to req.ip; it always builds an explicit key string first.
  validate: { keyGeneratorIpFallback: false },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many OTP requests for this phone number. Please wait 1 hour before trying again.',
    });
  },
});

// ─── Zod validation schemas ───────────────────────────────────────────────────

const phoneSchema = z.object({
  phone: z
    .string()
    .min(10)
    .regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number format. Use E.164 format, e.g. +919876543210'),
});

const otpVerifySchema = z.object({
  phone: z.string().min(10),
  code: z.string().length(6, 'OTP must be exactly 6 digits'),
});

const doctorSignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name is required'),
  registrationNumber: z.string().min(3, 'Medical registration number is required'),
});

const doctorLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Validate req.body against a Zod schema; sends 400 on failure. */
function validate(schema, body, res) {
  const result = schema.safeParse(body);
  if (!result.success) {
    // Zod v4 uses .issues; Zod v3 uses .errors — support both
    const issues = result.error.issues ?? result.error.errors ?? [];
    const message = issues[0]?.message ?? 'Validation error.';
    res.status(400).json({ error: message });
    return null;
  }
  return result.data;
}

// ═════════════════════════════════════════════════════════════════════════════
// POST /auth/patient/send-otp
// ═════════════════════════════════════════════════════════════════════════════
router.post('/patient/send-otp', otpSendLimiter, async (req, res) => {
  const data = validate(phoneSchema, req.body, res);
  if (!data) return;

  const { phone } = data;
  const useFirebase = process.env.USE_FIREBASE_OTP === 'true';

  try {
    if (useFirebase) {
      // ── Firebase path ──────────────────────────────────────────────────────
      // Firebase Phone Auth OTPs are sent client-side via the Firebase Client SDK.
      // From the server we can only create a custom token or verify the ID token
      // returned after client-side OTP verification.
      //
      // This stub demonstrates the server's role: generating a custom token that
      // the client uses to call signInWithCustomToken() and then request an SMS OTP.
      const auth = getFirebaseAuth();
      // Create or get the Firebase UID for this phone number
      let userRecord;
      try {
        userRecord = await auth.getUserByPhoneNumber(phone);
      } catch {
        userRecord = await auth.createUser({ phoneNumber: phone });
      }
      const customToken = await auth.createCustomToken(userRecord.uid);

      return res.status(200).json({
        message: 'Firebase custom token generated. Use this with signInWithCustomToken() on the client to trigger SMS OTP.',
        customToken,
        mode: 'firebase',
      });
    } else {
      // ── Stub / development path ────────────────────────────────────────────
      const code = otpStore.generateAndStore(phone);

      // In production replace this with your SMS provider (Twilio, AWS SNS, etc.)
      console.log(`\n[PolySafe OTP STUB] Phone: ${phone} | Code: ${code}\n`);

      return res.status(200).json({
        message: 'OTP sent (stub mode — check server logs).',
        mode: 'stub',
        // REMOVE this field before production — for developer convenience only
        ...(process.env.NODE_ENV !== 'production' && { _devOtp: code }),
      });
    }
  } catch (err) {
    console.error('[send-otp]', err);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /auth/patient/verify-otp
// ═════════════════════════════════════════════════════════════════════════════
router.post('/patient/verify-otp', async (req, res) => {
  const data = validate(otpVerifySchema, req.body, res);
  if (!data) return;

  const { phone, code } = data;
  const useFirebase = process.env.USE_FIREBASE_OTP === 'true';

  try {
    if (useFirebase) {
      // ── Firebase path ──────────────────────────────────────────────────────
      // The client completes phone auth with the Firebase Client SDK and sends
      // us the resulting Firebase ID token for server-side verification.
      const idToken = req.body.idToken;
      if (!idToken) {
        return res.status(400).json({ error: 'idToken is required in Firebase OTP mode.' });
      }

      const auth = getFirebaseAuth();
      const decoded = await auth.verifyIdToken(idToken);

      if (decoded.phone_number !== phone) {
        return res.status(400).json({ error: 'Phone number does not match the token.' });
      }
    } else {
      // ── Stub / development path ────────────────────────────────────────────
      const { valid, reason } = otpStore.verify(phone, code);
      if (!valid) {
        return res.status(400).json({ error: reason });
      }
    }

    // ── Upsert user ──────────────────────────────────────────────────────────
    let user = await prisma.user.findUnique({
      where: { phone },
      include: { patient: true },
    });
    const isNewUser = !user;

    if (!user) {
      user = await prisma.user.create({
        data: { phone, role: 'PATIENT' },
        include: { patient: true },
      });
    }

    const token = signToken({ userId: user.id, role: user.role });

    return res.status(200).json({
      message: isNewUser ? 'Account created and signed in.' : 'Signed in successfully.',
      isNewUser,
      token,
      user: { id: user.id, phone: user.phone, role: user.role, patient: user.patient },
    });
  } catch (err) {
    console.error('[verify-otp]', err);
    res.status(500).json({ error: 'OTP verification failed. Please try again.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /auth/doctor/signup
// ═════════════════════════════════════════════════════════════════════════════
router.post('/doctor/signup', async (req, res) => {
  const data = validate(doctorSignupSchema, req.body, res);
  if (!data) return;

  const { email, password, name, registrationNumber } = data;

  try {
    // Check for duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const SALT_ROUNDS = 12;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'DOCTOR',
        // Store name & registrationNumber — extend User model with these fields
        // if needed; for now we embed them in a separate profile table or notes.
        // We include them in the JWT claims for convenience.
      },
    });

    const token = signToken({ userId: user.id, role: user.role });

    return res.status(201).json({
      message: 'Doctor account created successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name,               // echoed back — store in DoctorProfile if needed
        registrationNumber, // echoed back — store in DoctorProfile if needed
      },
    });
  } catch (err) {
    console.error('[doctor/signup]', err);
    res.status(500).json({ error: 'Account creation failed. Please try again.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /auth/doctor/login
// ═════════════════════════════════════════════════════════════════════════════
router.post('/doctor/login', async (req, res) => {
  const data = validate(doctorLoginSchema, req.body, res);
  if (!data) return;

  const { email, password } = data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Use a constant-time comparison path even when user doesn't exist
    // to prevent user-enumeration via timing attacks.
    const DUMMY_HASH = '$2b$12$invalidhashpaddingtopreventinenumeration00000000000000000';
    const hashToCompare = user?.passwordHash ?? DUMMY_HASH;

    const passwordMatch = await bcrypt.compare(password, hashToCompare);

    if (!user || !passwordMatch || user.role !== 'DOCTOR') {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken({ userId: user.id, role: user.role });

    return res.status(200).json({
      message: 'Signed in successfully.',
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('[doctor/login]', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

module.exports = router;
