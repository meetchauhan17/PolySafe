import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App.jsx';
import { notify } from './utils/toast';

// PolySafe Display & Theme Initialization
try {
  const savedTheme = localStorage.getItem('polysafe-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.documentElement.classList.remove('projector-mode');
  localStorage.removeItem('polysafe_projector_mode');
} catch (e) {}

// Configure global API base URL from VITE_API_URL for production deployment
if (import.meta.env.VITE_API_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL;
}

// Global 8-second request timeout for all API communications
axios.defaults.timeout = 8000;

// Global response interceptor for resilient clinical notifications
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'Network connection issue. Please check your connectivity.';
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      message = 'Request timed out after 8s. The server may be waking up.';
    } else if (error.response?.data?.error) {
      message = typeof error.response.data.error === 'string'
        ? error.response.data.error
        : 'Request could not be completed.';
    } else if (error.response?.status >= 500) {
      message = 'Server encountered a temporary issue. Please retry.';
    }

    const url = error.config?.url || '';
    // Avoid toast spam on background silent pings or autocomplete keystrokes
    if (
      !error.config?._silent &&
      error.response?.status !== 401 &&
      error.response?.status !== 403 &&
      !url.includes('/health') &&
      !url.includes('/medicine/search') &&
      !url.includes('/socket.io')
    ) {
      notify.error('Network Notice', message);
    }
    return Promise.reject(error);
  }
);

// Register PolySafe Offline PWA Service Worker in production only; unregister in dev
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PolySafe PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PolySafe PWA] Service Worker registration failed:', err);
        });
    });
  } else {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name);
        }
      });
    }
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
