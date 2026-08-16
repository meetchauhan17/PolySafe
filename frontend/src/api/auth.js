import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inherit global axios Authorization header if set
api.interceptors.request.use((config) => {
  const globalAuth = axios.defaults.headers.common['Authorization'];
  if (globalAuth && !config.headers.Authorization) {
    config.headers.Authorization = globalAuth;
  }
  return config;
});

export const authApi = {
  // ── Step 1: Check if an email already has an account (branches signup vs login) ──
  checkEmail: async ({ email, role }) => {
    const response = await api.post('/auth/check-email', { email, role });
    return response.data; // { exists: boolean }
  },

  // ── New-user flow: hash password server-side, store pending row, send OTP ────
  signupSendOtp: async ({ name, email, password, role }) => {
    const response = await api.post('/auth/patient/signup-send-otp', { name, email, password, role });
    return response.data; // { message, email, _devOtp? }
  },

  // ── New-user flow: verify OTP, promote PendingSignup → real User ─────────────
  verifySignupOtp: async ({ email, code }) => {
    const response = await api.post('/auth/patient/verify-signup-otp', { email, code });
    return response.data; // { token, user, isNewUser }
  },

  // ── Returning-user flow: email + password only, no OTP ───────────────────────
  patientLogin: async ({ email, password, role }) => {
    const response = await api.post('/auth/patient/login', { email, password, role });
    return response.data; // { token, user }
  },

  // ── Doctor Auth (unchanged) ───────────────────────────────────────────────────
  doctorSignup: async ({ email, password, name, registrationNumber }) => {
    const response = await api.post('/auth/doctor/signup', { email, password, name, registrationNumber });
    return response.data;
  },

  doctorLogin: async ({ email, password }) => {
    const response = await api.post('/auth/doctor/login', { email, password });
    return response.data;
  },
};

export const patientApi = {
  saveProfile: async ({ age, conditions, allergies }, token) => {
    const response = await api.post(
      '/patient/profile',
      { age, conditions, allergies },
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
    return response.data;
  },

  getProfile: async (token) => {
    const response = await api.get(
      '/patient/profile',
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
    return response.data;
  },

  getHomeSummary: async (token) => {
    const response = await api.get(
      '/patient/home-summary',
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
    return response.data;
  },
};
