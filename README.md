# 🛡️ PolySafe — AI-Powered Polypharmacy Risk & Prescribing Cascade Engine

> **IEEE WIE ILS 2026 National Hackathon | Track 2: HealthTech | Problem Statement #4: The Polypharmacy Crisis**  
> *"Harm doesn't come from one bad prescription — it comes from what nobody is watching together."*

---

## 📋 Table of Contents
1. [Overview & Insight](#-overview--insight)
2. [The Four Core Innovations](#-the-four-core-innovations)
3. [System Architecture & Tech Stack](#-system-architecture--tech-stack)
4. [Permission Matrix (Who Sees What)](#-permission-matrix-who-sees-what)
5. [Local Development Setup](#-local-development-setup)
6. [Demo Mode (Live Demo Reliability)](#-demo-mode-live-demo-reliability)
7. [Deployment Guide](#-deployment-guide)
   - [Backend to Render](#backend-deployment-render)
   - [Frontend to Vercel](#frontend-deployment-vercel)
8. [Security, Safety & Privacy](#-security-safety--privacy)
9. [Known Gaps & Future Roadmap (TODOs)](#-known-gaps--future-roadmap-todos)

---

## 🌟 Overview & Insight

Standard drug interaction checkers only evaluate medications **two at a time** in isolation. They miss the real clinical drivers of polypharmacy harm in elderly and multi-condition patients:

1. **Care Fragmentation:** A cardiologist prescribes Drug A; a GP prescribes Drug B two months later; neither doctor sees the other's complete list.
2. **Prescribing Cascades:** A drug's side effect is mistaken for a new medical condition, prompting a second prescription to treat it.
3. **The "Not Real Medicine" Blind Spot:** Herbal supplements, Ayurvedic preparations, and OTC medications are almost never reported during physician visits.
4. **Cumulative Burden Blind Spot:** Multiple mild sedative or anticholinergic drugs combine into critical fall and delirium risks, even when every pairwise check shows "safe."

**PolySafe** provides a unified, persistent medication timeline that watches all four gaps simultaneously and provides dual explanations: **clinical** for the doctor, and **plain-language** for the patient.

---

## 💡 The Four Core Innovations

```
                                  ┌──────────────────────────────┐
                                  │   PolySafe Analysis Engine   │
                                  └──────────────┬───────────────┘
                                                 │
      ┌─────────────────────────┬────────────────┼─────────────────────────┬─────────────────────────┐
      │                         │                │                         │                         │
┌─────▼──────────────┐   ┌──────▼─────────────┐  │                  ┌──────▼─────────────┐   ┌──────▼─────────────┐
│ 1. Cross-Doctor    │   │ 2. Prescribing     │  │                  │ 3. Herb/OTC        │   │ 4. Cumulative      │
│    Timeline        │   │    Cascade Checker │  │                  │    Blind-Spot      │   │    Burden Index    │
├────────────────────┤   ├────────────────────┤  │                  ├────────────────────┤   ├────────────────────┤
│ Tracks prescribing │   │ Matches symptoms   │  │                  │ Cross-checks herbs │   │ Computes ACB       │
│ source (Dr/Self)   │   │ against drug start │  │                  │ against clinical   │   │ sedative score     │
│ with consent RBAC  │   │ dates & cascades   │  │                  │ interaction refs   │   │ across all drugs   │
└────────────────────┘   └────────────────────┘  │                  └────────────────────┘   └────────────────────┘
                                                 │
                                     ┌───────────▼───────────┐
                                     │  Dual LLM Explanation │
                                     ├───────────────────────┤
                                     │ • Doctor (Clinical)   │
                                     │ • Patient (Plain)     │
                                     └───────────────────────┘
```

1. **Cross-Doctor Medication Timeline:** Visual chronological feed tracking every prescription, OTC, and herbal addition, highlighting which doctor prescribed each drug, interaction flags, and active links.
2. **Prescribing Cascade Detector:** Evaluates logged symptoms against documented literature pairs (e.g. Amlodipine leg swelling, NSAID hypertension), cross-referenced with medication start dates.
3. **Herb-Drug Interaction Engine:** Explicitly checks herbal products and supplements against clinical interaction registries (e.g. Turmeric + Anticoagulants, St. John's Wort + Antidepressants).
4. **Cumulative Anticholinergic / Sedative Burden (ACB) Index:** Calculates cumulative sedative and anticholinergic load across all active medicines on a 0–3+ scale (Normal, Moderate, Critical).

---

## 🏗️ System Architecture & Tech Stack

### Frontend
- **Framework:** React 19 + Vite 8
- **Styling:** Vanilla Tailwind CSS v4 (Warm clinical theme: `#FBF8F2` parchment, `#2B6E5E` sage green, `#B23D25` crimson caution, Fraunces serif headings)
- **State & Data:** TanStack React Query v5 + Axios
- **Real-Time:** Socket.IO Client
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js (ESM/CJS) + Express 5
- **ORM & Database:** Prisma ORM + PostgreSQL (compatible with SQLite/Postgres)
- **Real-Time:** Socket.IO Server
- **AI / LLM:** Groq API (`llama-3.3-70b-versatile`) with strict 8s timeout and structured fallback
- **Drug Standardization:** NLM RxNorm / RxNav REST API
- **Prescription Scanning:** OCR.space Engine 2 + Heuristic Label Parser
- **Authentication:** JWT + Role-Based Access Control (RBAC) + Console OTP / Firebase Phone Auth

---

## 🔒 Permission Matrix (Who Sees What)

PolySafe is strictly **consent-based**. No healthcare provider or family member sees patient data without explicit, patient-approved access:

| Feature / Data | Patient | Doctor (Connected) | Caregiver (Connected) |
|---|:---:|:---:|:---:|
| **Medication Timeline** | Full Read/Write | Full Read-Only | ❌ No Drug Names |
| **Risk Explanations** | Plain-Language | Clinical + Plain | ❌ Hidden |
| **Safety Status (Safe/Caution/Critical)** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Daily Reminders (Time + Dosage Type)** | ✅ Yes | ✅ Yes | ✅ Generic Type Only |
| **Symptom Logs & Cascade Analysis** | Full Access | Full Access | ❌ Hidden |
| **Add / Edit / Remove Medicines** | ✅ Yes | ❌ Read-Only (Liability) | ❌ Read-Only |
| **Connection Approval & Revocation** | ✅ Full Control | ❌ Cannot manage others | ❌ Cannot manage others |

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js:** v18.0.0 or higher
- **PostgreSQL:** Local instance or cloud database (e.g. Supabase, Neon, Railway)
- **Git**

### 2. Clone Repository
```bash
git clone https://github.com/your-username/PolySafe.git
cd PolySafe
```

### 3. Backend Setup
```bash
cd backend
npm install

# Create environment file from example
cp .env.example .env
```

Edit `backend/.env` with your values:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/polysafe?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"

# LLM & OCR Service Keys (Optional - mocks exist)
GROQ_API_KEY="gsk_your_groq_api_key"
OCR_SPACE_API_KEY="your_ocr_space_key"

# OTP Mode: "false" for stub (console OTP printed in terminal), "true" for Firebase
USE_FIREBASE_OTP="false"

# Demo Mode: set "true" before live demo for 100% offline fixture resilience
DEMO_MODE="false"
```

Initialize database and seed all reference datasets:
```bash
# Push Prisma schema to database
npm run prisma:push

# Run unified seeder (DDInter CSV, Burden Scores, Cascade References, Herb-Drug Pairs)
npm run seed

# Start backend dev server (runs on http://localhost:5000)
npm run dev
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install

# Start Vite frontend dev server (runs on http://localhost:3000)
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 🎭 Demo Mode (Live Demo Reliability)

When presenting in environments with unreliable venue Wi-Fi, you can enable **Demo Mode** with **zero code changes**:

1. Open `backend/.env`
2. Set `DEMO_MODE="true"`
3. Restart the backend: `npm run dev`

### What happens in Demo Mode:
- **OCR Scan:** `POST /medicine/scan` immediately returns a parsed `Warfarin 5mg` sample prescription without calling OCR.space.
- **RxNorm Standardization:** Drug name queries resolve via an internal static map of known medications without external RxNav HTTP requests.
- **Groq LLM Explanations:** Clinical and plain explanations are returned instantly using pre-compiled pharmacological models with a `DEMO` indicator.
- **Error Handling:** If an API times out (>8s) or is unreachable, the raw severity and cumulative burden score are displayed immediately alongside a *"Generating detailed explanation..."* notice.

---

## 🚢 Deployment Guide

### Backend Deployment (Render)

The backend is fully configured for [Render](https://render.com) deployment using the root `render.yaml` Blueprint or manual web service creation.

#### Option A: Blueprint Deploy (`render.yaml`)
1. Push this repository to GitHub.
2. Go to **Render Dashboard → Blueprints → New Blueprint Instance**.
3. Connect your repository — Render will automatically provision:
   - A managed PostgreSQL instance (`polysafe-db`)
   - A Node.js Web Service (`polysafe-backend`)
   - Automatic build (`npm install && npx prisma generate && npx prisma db push`) and start commands (`node src/index.js`).

#### Option B: Manual Web Service
- **Environment:** Node
- **Root Directory:** `backend`
- **Build Command:** `npm install && npx prisma generate && npx prisma db push`
- **Start Command:** `node src/index.js`
- **Environment Variables:**
  - `DATABASE_URL`: Your PostgreSQL connection string
  - `JWT_SECRET`: Random 32+ character string
  - `NODE_ENV`: `production`
  - `PORT`: `5000` (or leave default; Render injects `$PORT`)
  - `USE_FIREBASE_OTP`: `false`
  - `GROQ_API_KEY`: Your Groq API key
  - `OCR_SPACE_API_KEY`: Your OCR.space key

---

### Frontend Deployment (Vercel)

The frontend is built with Vite and includes `vercel.json` for Single Page Application client-side routing.

1. Import the repository on [Vercel](https://vercel.com).
2. Configure project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add Environment Variable:
   - `VITE_API_URL`: URL of your deployed Render backend (e.g. `https://polysafe-backend.onrender.com`)
4. Deploy.

---

## 🛡️ Security, Safety & Privacy

- **No Hardcoded Secrets:** All credentials (`GROQ_API_KEY`, `OCR_SPACE_API_KEY`, `JWT_SECRET`, Firebase credentials) are injected exclusively via environment variables.
- **Data Minimization in OCR:** Uploaded prescription images are processed in a temporary local folder and **immediately unlinked and deleted** from disk via `finally` blocks upon completion or error.
- **Non-Diagnostic Framing:** Every patient-facing explanation explicitly includes the mandatory framing: *(This is an informational safety alert, not a medical diagnosis. Always consult your doctor before changing medicines.)*
- **Tamper-Resistant Doctor Access:** Doctors have read-only access to connected patient timelines and cannot edit patient lists, preventing unauthorized prescription modifications.

---

## 📌 Known Gaps & Future Roadmap (TODOs)

The following items are documented for transparency prior to live judging and post-hackathon scaling:

| Area | Current Status | Post-Hackathon Roadmap (v2) |
|---|---|---|
| **SMS OTP Delivery** | Console log stub (development) + Firebase Admin adapter | Production SMS gateway integration (e.g. Twilio / MSG91) |
| **Doctor Credential Verification** | Form validation on Medical Registration Number | Automated integration with the National Medical Commission (NMC) registry API |
| **Prescription OCR** | OCR.space Engine 2 + Heuristic regex parsing | Dedicated fine-tuned Vision-LLM (e.g. Gemini 1.5 Flash Vision) for handwritten Indian doctor scripts |
| **Dosage Scheduling** | Time slots derived deterministically across day segments | Customizable multi-frequency scheduling (e.g., TID, PRN, tapering doses) with push notifications |
| **FHIR / ABDM Integration** | Standalone PostgreSQL schema | Ayushman Bharat Digital Mission (ABDM) / HL7 FHIR M1/M2/M3 compliance for EHR data interchange |

---

## 👥 Authors & Acknowledgements
- **Team PolySafe** — IEEE WIE ILS 2026 National Hackathon
- **Clinical Datasets:** DDInter (Drug-Drug Interaction Database), Canadian Deprescribing Network, ACB Scoring Protocol, MSKCC Integrative Medicine Database.
