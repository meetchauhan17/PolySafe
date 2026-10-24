# PolySafe Server Keep-Alive & Cold-Start Prevention Guide

## Problem Context
Free-tier hosting providers (e.g. Render, Railway, Fly.io) automatically spin down web services after **15 minutes of inactivity** to conserve compute resources. 

When a user or hackathon judge accesses the application after an idle period:
- The server requires **15 to 30 seconds** to reboot ("cold start").
- PolySafe includes built-in frontend cold-start protection (`ServerWakeSplash.jsx`) that catches delays over 4 seconds, shows a friendly *"Waking the server, about 20 seconds"* splash, and retries with backoff.
- However, to ensure zero-delay instant responses during live judging, you can configure a **free uptime ping monitor** to hit `/health` every 5 minutes.

---

## 5-Minute Keep-Alive Setup

### Method 1: Cron-Job.org (Recommended — 100% Free, No Card Required)
1. Register a free account at [cron-job.org](https://cron-job.org).
2. Click **Create Cronjob**.
3. **Title:** `PolySafe Backend Keep-Alive`
4. **URL:** `https://<YOUR-RENDER-BACKEND-URL>/health` (e.g., `https://polysafe-backend.onrender.com/health`)
5. **Schedule:** Every **5 minutes** (e.g. `*/5 * * * *`).
6. **Execution timeout:** 30 seconds.
7. Click **Create**.
*Result:* Cron-Job will send a lightweight `GET /health` HTTP request every 5 minutes, preventing Render from ever sleeping.

---

### Method 2: UptimeRobot (Free Plan)
1. Sign up at [uptimerobot.com](https://uptimerobot.com).
2. Click **Add New Monitor**.
3. **Monitor Type:** `HTTP(s)`
4. **Friendly Name:** `PolySafe Health Check`
5. **URL:** `https://<YOUR-RENDER-BACKEND-URL>/health`
6. **Monitoring Interval:** `5 minutes`
7. Click **Create Monitor**.

---

### Method 3: BetterStack (Better Uptime)
1. Sign up at [betterstack.com](https://betterstack.com).
2. Add monitor for URL: `https://<YOUR-RENDER-BACKEND-URL>/health`.
3. Set alert frequency to 3 or 5 minutes.

---

## Endpoint Response Contract
The PolySafe `/health` endpoint is lightweight and non-blocking:
```json
{
  "status": "ok",
  "api": true,
  "db": true,
  "demoMode": true,
  "groqKey": true,
  "geminiKey": true,
  "timestamp": "2026-10-20T09:30:00.000Z"
}
```
- It responds with HTTP `200 OK` in < 25ms.
- It performs a lightweight `SELECT 1` query to verify database pooling without placing load on Postgres.

---

## Pre-Stage Verification Checklist
Before presenting on stage:
1. Open your hidden status dashboard: `https://<your-frontend-url>/status`
2. Verify:
   - **API Reachable:** Green (latency < 100ms)
   - **DB Reachable:** Green (PostgreSQL active)
   - **DEMO_MODE:** Active
   - **Groq/Gemini Keys:** Present
   - **Socket.IO:** Connected
3. If internet at the venue drops, click **Switch to Guest Demo** to run 100% offline from local mock data.
