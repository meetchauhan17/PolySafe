import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// Configure global API base URL from VITE_API_URL for production deployment (e.g. Vercel -> Render)
if (import.meta.env.VITE_API_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL;
}

// Clear any stale Service Worker caches from previous builds
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
