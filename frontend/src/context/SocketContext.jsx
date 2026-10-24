import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { io as socketIO } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

/**
 * Resolves the canonical WebSocket backend URL across dev and production.
 */
export function getSocketUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api$/, '');
  }
  if (axios.defaults.baseURL) {
    return axios.defaults.baseURL.replace(/\/api$/, '');
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000';
  }
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
}

/**
 * Global SocketProvider managing a single persistent Socket.IO connection
 * to eliminate connection flapping, duplicate rooms, and re-render reconnect storms.
 */
export function SocketProvider({ children }) {
  const { token, user, isGuest } = useAuth() || {};
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  // Primitive stable keys to prevent object-reference reconnect loops
  const userId = user?.userId || user?.id || null;
  const patientId = user?.patientId || user?.userId || user?.id || null;
  const role = (user?.role || '').toUpperCase();

  useEffect(() => {
    // If not authenticated or in guest mode, disconnect any existing socket
    if (!token || isGuest || !userId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const socketUrl = getSocketUrl();

    // Reuse existing socket if already connected to the same destination
    if (socketRef.current) {
      if (socketRef.current.connected) {
        setIsConnected(true);
      }
      return;
    }

    const socket = socketIO(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });

    const handleConnect = () => {
      setIsConnected(true);
      // Join patient or caregiver room once on connection
      if (role === 'CAREGIVER') {
        socket.emit('join-caregiver-room', { caregiverId: userId, userId });
      } else {
        socket.emit('join-patient-room', { patientId, userId });
      }
    };

    const handleDisconnect = (reason) => {
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect; reconnect manually
        socket.connect();
      }
    };

    const handleConnectError = (err) => {
      console.warn('[SocketContext] Connection attempt warning:', err?.message || err);
      setIsConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    socketRef.current = socket;

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [token, isGuest, userId, patientId, role]);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      isConnected,
      socketUrl: getSocketUrl(),
    }),
    [isConnected]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

/**
 * Access the shared singleton socket instance and connection state.
 */
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    return { socket: null, isConnected: false, socketUrl: getSocketUrl() };
  }
  return context;
}

/**
 * Register a real-time event listener on the singleton socket without disconnecting on unmount.
 * Automatically handles listener cleanup and always uses the latest handler closure.
 */
export function useSocketEvent(eventName, handler) {
  const { socket } = useSocket();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket || !eventName) return;

    const listener = (...args) => {
      if (handlerRef.current) {
        handlerRef.current(...args);
      }
    };

    socket.on(eventName, listener);

    return () => {
      socket.off(eventName, listener);
    };
  }, [socket, eventName]);
}

export default SocketContext;
