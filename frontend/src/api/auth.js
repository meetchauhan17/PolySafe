import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authApi = {
  // Patient / Caregiver OTP
  sendPatientOtp: async (phone) => {
    const response = await api.post('/auth/patient/send-otp', { phone });
    return response.data;
  },

  verifyPatientOtp: async ({ phone, code }) => {
    const response = await api.post('/auth/patient/verify-otp', { phone, code });
    return response.data;
  },

  // Doctor Auth
  doctorSignup: async ({ email, password, name, registrationNumber }) => {
    const response = await api.post('/auth/doctor/signup', {
      email,
      password,
      name,
      registrationNumber,
    });
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
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  getProfile: async (token) => {
    const response = await api.get('/patient/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getHomeSummary: async (token) => {
    const response = await api.get('/patient/home-summary', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
