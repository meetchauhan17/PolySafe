import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import GuestLockModal from '../components/GuestLockModal';

const TOKEN_KEY = 'polysafe_token';
const USER_KEY = 'polysafe_user';
const ROLE_KEY = 'polysafe_role';

const AuthContext = createContext(null);

/**
 * Safely decodes a JWT payload and validates its expiration.
 * @param {string} token 
 * @returns {object|null} payload if valid and not expired, otherwise null
 */
function decodeAndValidateToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Payload = parts[1];
    const json = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json);

    // Check expiration if 'exp' claim is present (exp is in seconds)
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      console.warn('[AuthContext] Stored token has expired');
      return null;
    }

    return payload;
  } catch (err) {
    console.error('[AuthContext] Failed to decode token:', err);
    return null;
  }
}

/**
 * Configure or clear global axios authorization header.
 * @param {string|null} token 
 */
function setAxiosAuthHeader(token) {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [guestLockState, setGuestLockState] = useState({ isOpen: false, featureName: 'this feature' });

  const openGuestLockModal = useCallback((featureName = 'this feature') => {
    setGuestLockState({ isOpen: true, featureName });
  }, []);

  const closeGuestLockModal = useCallback(() => {
    setGuestLockState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const requireAuth = useCallback((featureName = 'this feature') => {
    if (!user || user.isGuest || !token) {
      openGuestLockModal(featureName);
      return true; // blocked by auth check
    }
    return false; // allowed
  }, [user, token, openGuestLockModal]);

  // ─── Session Validator ──────────────────────────────────────────────────────
  const validateSession = useCallback(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedRole = localStorage.getItem(ROLE_KEY);
      let storedUser = {};
      try {
        storedUser = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
      } catch {
        storedUser = {};
      }

      if (storedToken) {
        const payload = decodeAndValidateToken(storedToken);
        if (payload) {
          const resolvedRole = (payload.role || storedRole || 'PATIENT').toUpperCase();
          const restoredUser = {
            userId: payload.userId || storedUser.id || null,
            role: resolvedRole,
            isGuest: false,
            phone: storedUser.phone || null,
            email: storedUser.email || null,
            name: storedUser.name || null,
            ...storedUser,
          };

          setToken(storedToken);
          setUser(restoredUser);
          setAxiosAuthHeader(storedToken);
          return restoredUser;
        } else {
          // Token expired or malformed — clear storage
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(ROLE_KEY);
          setAxiosAuthHeader(null);
          setToken(null);
          setUser(null);
          return null;
        }
      } else {
        setAxiosAuthHeader(null);
        setToken(null);
        setUser((prev) => (prev?.isGuest ? prev : null));
        return null;
      }
    } catch (err) {
      console.error('[AuthContext] Session validation error:', err);
      setUser(null);
      setToken(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Initialize Auth on Mount & Handle BFCache (pageshow) ─────────────────
  useEffect(() => {
    validateSession();

    const handlePageShow = (event) => {
      // event.persisted is true when restored from back-forward cache (bfcache)
      if (event.persisted) {
        validateSession();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [validateSession]);

  // ─── Login Action ───────────────────────────────────────────────────────────
  const login = useCallback((newToken, roleOverride, userData = {}) => {
    if (!newToken) return;

    const payload = decodeAndValidateToken(newToken);
    const resolvedRole = (roleOverride || payload?.role || 'PATIENT').toUpperCase();

    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(ROLE_KEY, resolvedRole);
    if (userData && Object.keys(userData).length > 0) {
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    }

    setAxiosAuthHeader(newToken);
    setToken(newToken);

    setUser({
      userId: payload?.userId || userData?.id || null,
      role: resolvedRole,
      isGuest: false,
      phone: userData?.phone || null,
      email: userData?.email || null,
      name: userData?.name || null,
      ...userData,
    });
  }, []);

  // ─── Logout Action ──────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ROLE_KEY);
    setAxiosAuthHeader(null);
    setToken(null);
    setUser(null);
  }, []);

  // ─── Guest Mode Action ──────────────────────────────────────────────────────
  const enterGuestMode = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ROLE_KEY);
    setAxiosAuthHeader(null);
    setToken(null);
    setUser({
      userId: null,
      role: null,
      isGuest: true,
    });
  }, []);

  const isGuest = Boolean(user?.isGuest);

  const value = {
    user,
    token,
    isLoading,
    isGuest,
    isAuthenticated: !!user && !user.isGuest && !!token,
    login,
    logout,
    enterGuestMode,
    openGuestLockModal,
    closeGuestLockModal,
    requireAuth,
    checkSession: validateSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <GuestLockModal
        isOpen={guestLockState.isOpen}
        onClose={closeGuestLockModal}
        featureName={guestLockState.featureName}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
