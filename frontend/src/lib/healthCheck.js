/**
 * frontend/src/lib/healthCheck.js
 *
 * Pre-stage comprehensive health check diagnostic utility.
 * Verifies API reachability, Postgres connectivity, DEMO_MODE, AI LLM keys, and Socket.IO.
 */

import axios from 'axios';
import { io as socketIO } from 'socket.io-client';
import { getSocketUrl } from '../context/SocketContext';

/**
 * Runs end-to-end connectivity & telemetry audit
 * @returns {Promise<{
 *   apiReachable: boolean,
 *   dbReachable: boolean,
 *   demoMode: boolean,
 *   groqKeyPresent: boolean,
 *   geminiKeyPresent: boolean,
 *   socketConnected: boolean,
 *   latencyMs: number,
 *   timestamp: string,
 *   error: string | null
 * }>}
 */
export async function performHealthCheck() {
  const startTime = performance.now();
  let apiReachable = false;
  let dbReachable = false;
  let demoMode = false;
  let groqKeyPresent = false;
  let geminiKeyPresent = false;
  let socketConnected = false;
  let errorMsg = null;

  // 1. Check HTTP /health
  try {
    const resp = await axios.get('/health', {
      timeout: 5000,
      _silent: true,
    });
    if (resp.status === 200) {
      apiReachable = true;
      dbReachable = Boolean(resp.data?.db);
      demoMode = Boolean(resp.data?.demoMode);
      groqKeyPresent = Boolean(resp.data?.groqKey);
      geminiKeyPresent = Boolean(resp.data?.geminiKey);
    }
  } catch (err) {
    apiReachable = false;
    errorMsg = err.message || 'API unreachable';
  }

  const latencyMs = Math.round(performance.now() - startTime);

  // 2. Check Socket.IO reachability
  try {
    socketConnected = await new Promise((resolve) => {
      const socketUrl = getSocketUrl();
      const socket = socketIO(socketUrl, {
        timeout: 3000,
        transports: ['websocket', 'polling'],
        reconnection: false,
      });

      const timer = setTimeout(() => {
        socket.disconnect();
        resolve(false);
      }, 2500);

      socket.on('connect', () => {
        clearTimeout(timer);
        socket.disconnect();
        resolve(true);
      });

      socket.on('connect_error', () => {
        clearTimeout(timer);
        socket.disconnect();
        resolve(false);
      });
    });
  } catch {
    socketConnected = false;
  }

  return {
    apiReachable,
    dbReachable,
    demoMode,
    groqKeyPresent,
    geminiKeyPresent,
    socketConnected,
    latencyMs,
    timestamp: new Date().toLocaleTimeString(),
    error: errorMsg,
  };
}
