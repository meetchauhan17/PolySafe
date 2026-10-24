/**
 * DisplaySettingsContext.jsx — Theme & 3D Visual Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * Controls:
 *  1. Theme: Light & Dark clinical modes, persisted in localStorage.
 *  2. 3D Enablement: Accessible perspective transforms synced with system hardware.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { sync3DAttributes, checkSystem3DSupport } from '../three-d/use3DEnabled';

const THEME_STORAGE_KEY = 'polysafe-theme';
const THREE_D_STORAGE_KEY = 'polysafe_3d_enabled';

const DisplaySettingsContext = createContext(null);

export function DisplaySettingsProvider({ children }) {
  // ─── 1. Theme Initialization (Light vs Dark) ──────────────────────────────
  const [theme, setThemeState] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem('polysafe_theme');
        if (saved === 'dark' || saved === 'light') return saved;
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'dark';
        }
      }
    } catch {
      // Fallback
    }
    return 'light';
  });

  // ─── 2. 3D Enablement Initialization ──────────────────────────────────────
  const [is3DEnabled, setIs3DEnabledState] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const supported = checkSystem3DSupport();
        if (!supported) return false;
        const saved = localStorage.getItem(THREE_D_STORAGE_KEY);
        if (saved !== null) return saved === 'true';
      }
    } catch {}
    return true;
  });

  // Purge any legacy projector mode class and sync 3D enablement
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.remove('projector-mode');
    try {
      localStorage.removeItem('polysafe_projector_mode');
    } catch {}
    sync3DAttributes(is3DEnabled && checkSystem3DSupport());
  }, [is3DEnabled]);

  // Apply data-theme attribute, .dark class, and meta theme-color to documentElement
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#0F151C' : '#EAE6DE');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  // System preference change listener
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem('polysafe_theme');
        if (!saved) {
          setThemeState(e.matches ? 'dark' : 'light');
        }
      } catch {}
    };
    mediaQuery.addEventListener?.('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener?.('change', handleSystemThemeChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setTheme = useCallback((newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
    }
  }, []);

  const toggle3DEnabled = useCallback(() => {
    setIs3DEnabledState((prev) => {
      const next = !prev;
      if (next && !checkSystem3DSupport()) {
        sync3DAttributes(false);
        return false;
      }
      try {
        localStorage.setItem(THREE_D_STORAGE_KEY, next ? 'true' : 'false');
      } catch {}
      sync3DAttributes(next);
      return next;
    });
  }, []);

  const set3DEnabled = useCallback((val) => {
    const next = Boolean(val);
    if (next && !checkSystem3DSupport()) {
      sync3DAttributes(false);
      setIs3DEnabledState(false);
      return;
    }
    try {
      localStorage.setItem(THREE_D_STORAGE_KEY, next ? 'true' : 'false');
    } catch {}
    setIs3DEnabledState(next);
    sync3DAttributes(next);
  }, []);

  const value = {
    isProjectorMode: false,
    toggleProjectorMode: () => {},
    setProjectorMode: () => {},
    theme,
    toggleTheme,
    setTheme,
    is3DEnabled,
    toggle3DEnabled,
    set3DEnabled,
  };

  return (
    <DisplaySettingsContext.Provider value={value}>
      {children}
    </DisplaySettingsContext.Provider>
  );
}

export function useDisplaySettings() {
  const context = useContext(DisplaySettingsContext);
  if (!context) {
    // Graceful fallback if used outside provider
    return {
      isProjectorMode: false,
      toggleProjectorMode: () => {},
      setProjectorMode: () => {},
      theme: 'light',
      toggleTheme: () => {},
      setTheme: () => {},
      is3DEnabled: true,
      toggle3DEnabled: () => {},
      set3DEnabled: () => {},
    };
  }
  return context;
}

export default DisplaySettingsContext;
