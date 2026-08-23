<div align="center">

# PolySafe

### *Continuous Clinical Polypharmacy Risk, Prescribing Cascade & Drug Interaction Platform*

<p align="center">
  <strong>Preventing adverse drug events across fragmented care silos through continuous, multi-agent pharmacological intelligence.</strong>
</p>

<p align="center">
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/Frontend-React_19_·_Vite_8-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Backend-Node.js_22_·_Express_5-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" /></a>
  <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/Database-Prisma_ORM_·_PostgreSQL-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma ORM" /></a>
  <a href="https://socket.io/"><img src="https://img.shields.io/badge/Realtime-Socket.IO_4.8-010101?style=flat-square&logo=socketdotio&logoColor=white" alt="Socket.io" /></a>
  <a href="https://groq.com/"><img src="https://img.shields.io/badge/LLM-Groq_LLaMA--3.3--70B-F55036?style=flat-square" alt="Groq" /></a>
  <a href="https://ai.google.dev/"><img src="https://img.shields.io/badge/Vision_OCR-Gemini_Flash-4285F4?style=flat-square&logo=google&logoColor=white" alt="Gemini Vision" /></a>
  <a href="https://rxnav.nlm.nih.gov/"><img src="https://img.shields.io/badge/Standards-NLM_RxNorm-005A9C?style=flat-square" alt="RxNorm" /></a>
  <a href="#master-verification-audit"><img src="https://img.shields.io/badge/Audit_Suite-18/18_Passed_(100%25)-008080?style=flat-square" alt="Audit" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-gray?style=flat-square" alt="License" /></a>
</p>

<br/>

[Overview](#overview) &bull; [Key Differentiators](#key-differentiators) &bull; [Clinical Engine Matrix](#clinical-engine-matrix) &bull; [Architecture](#system-architecture) &bull; [Access Matrix](#role-based-access-control-matrix) &bull; [API Reference](#api-reference) &bull; [Quickstart](#quickstart) &bull; [Deployment](#deployment-guide) &bull; [Clinical Evidence](#clinical-evidence-base)

---

</div>

## Overview

In multi-condition and geriatric patients taking 5 or more concurrent medications, conventional drug interaction checkers routinely fail because they evaluate medications **two-at-a-time in static isolation**. 

PolySafe addresses the 4 primary clinical failure modes of fragmented healthcare delivery:

```
+---------------------------------------------------------------------------------------------------------+
|                                    FOUR PILLARS OF POLYPHARMACY RISK                                    |
+------------------------------------+------------------------------------+-------------------------------+
| RISK FACTOR                        | CLINICAL FAILURE MODE              | POLYSAFE INTERVENTION         |
+------------------------------------+------------------------------------+-------------------------------+
| 1. Care Fragmentation              | Specialists prescribe in silos     | Unified cross-doctor timeline |
|                                    | without full regimen visibility.   | with consent-based sharing.   |
|                                    |                                    |                               |
| 2. Prescribing Cascades            | Drug side effects are misdiagnosed | Correlates symptom onset with |
|                                    | as new conditions, adding drugs.   | drug initiation dates.        |
|                                    |                                    |                               |
| 3. Herbal / OTC Blind Spots        | Patients omit supplements during   | Curated botanical-drug cross  |
|                                    | visits, risking bleeding events.   | reference engine.             |
|                                    |                                    |                               |
| 4. Cumulative Anticholinergic Load | Multiple mild drugs compound into  | Real-time ACB cognitive score |
|                                    | delirium, falls, and fractures.    | and sedation load meter.      |
+------------------------------------+------------------------------------+-------------------------------+
```

---

## Key Differentiators

```
                                  +-------------------------------+
                                  |   PolySafe Intelligence Hub   |
                                  +---------------+---------------+
                                                  |
        +-------------------------+---------------+-------------------------+
        |                         |               |                         |
+-------v-------+         +-------v-------+       |                 +-------v-------+
|  DDInter 2024 |         |   ACB Scale   |       |                 | Prescribing   |
| 222,385 Pairs |         |  Cumulative   |       |                 | Cascade Engine|
+---------------+         +---------------+       |                 +---------------+
                                                  |
                                  +---------------v---------------+
                                  |   Dual-Persona LLM Engine     |
                                  |  * Patient: Plain Language    |
                                  |  * Doctor: Clinical Mechanism |
                                  |  * 3 Doctor Action Items      |
                                  +-------------------------------+
```

- **DDInter 2024 Integration:** Evaluates active regimens against 222,385 bidirectional pairwise interaction records across 4 clinical severity classifications (`Contraindicated`, `Major`, `Moderate`, `Minor`, and `Unknown`).
- **Cumulative Anticholinergic Burden (ACB):** Calculates total cognitive load (0 to 6+ scale) to prevent acute delirium and fall hazards.
- **Prescribing Cascade Correlator:** Maps symptom logs against prior prescription start dates and CaDeN rules.
- **Indian Formulary 5-Layer Multi-Salt Resolver:** Breaks down branded multi-constituent formulations (e.g., *Augmentin 625*, *Pan-D*, *Naxdom 500*, *Combiflam*, *Zerodol SP*, *Stamlo Beta*, *Telma H*) to pure active chemical salts.
- **Multi-Engine Packaging & Label OCR:** Multimodal extraction (Gemini Vision $\rightarrow$ RxNorm $\rightarrow$ Tesseract $\rightarrow$ OCR.space $\rightarrow$ Manual) with confidence scoring.
- **Multi-Layer AI Pill Imprint Identifier:** Stamped tablet and capsule code identification with cascading Groq LLaMA-3.3, Gemini Flash, and NLM RxNav fallback with instant auto-caching.
- **4-System Organ Toxicity Radar:** Quantifies stress indices for **Renal Clearance**, **Hepatic Metabolism**, **Cardiovascular Strain**, and **CNS Burden**.

---

## Clinical Engine Matrix

| Clinical Subsystem | Underlying Dataset / Model | Mechanism & Scope |
| :--- | :--- | :--- |
| **Drug-Drug Interactions** | **DDInter 2024 Master Dataset** | 222,385 validated bidirectional pairs; distinguishes uncatalogued pairs (`notInDataset: true`) from verified safe combinations. |
| **Anticholinergic Burden** | **ACB Scale (Boustani et al.)** | Tallies individual drug scores (0–3) into a cumulative regimen load index (`Normal`, `Moderate`, `Critical`). |
| **Cascade Detection** | **CaDeN Prescribing Protocols** | Rule-based engine linking symptom keywords with offending drug pharmacological classes initiated within 90 days. |
| **Herbal Cross-Reactivity** | **MSKCC & Natural Medicines Database** | Identifies bleeding, metabolic, and clearance interference between botanical supplements and pharmaceuticals. |
| **Medication Harm Tiers** | **WHO / NCI 5-Tier Classification** | Assigns Tier L1 (Low) to Tier L5 (Critical Risk) based on therapeutic index, narrow safety margins, and clearance pathways. |
| **Post-Market Adverse Events**| **FDA OFFSIDES Pharmacovigilance** | 7,330 curated adverse reaction signals with Proportional Reporting Ratios ($\text{PRR} \ge 2.0$). |
| **Brand-to-Salt Resolution**| **Indian Formulary + RxNorm + AI** | 5-layer cascading pipeline resolving branded combination products to exact chemical salt constituents. |
| **Organ Toxicity Radar** | **Pharmacokinetic Toxicity Modeler** | Maps drug clearance pathways to compute live organ load percentages across Renal, Hepatic, Cardio, and CNS systems. |

---

## System Architecture

```
+-----------------------------------------------------------------------------------------+
|                                CLIENT LAYER (React 19 + Vite 8)                         |
|  * Industrial Skeuomorphic Design Tokens    * TanStack React Query v5 Data Layer        |
|  * Recharts 4-Organ Toxicity Radar Chart    * Framer Motion Animations & A11y Controls  |
|  * Real-Time Socket.IO Client Listeners     * BFCache PageShow Session Protection       |
+--------------------------------------------+--------------------------------------------+
                                             | HTTP REST / WebSocket JSON
+--------------------------------------------v--------------------------------------------+
|                              SERVER API LAYER (Node.js 22 + Express 5)                  |
|  * JWT Auth & Brute-Force Rate Limiting     * Socket.IO Room Broadcaster Engine         |
|  * DDInter 222K Pairwise Evaluator          * Cumulative ACB Burden Calculator          |
|  * Prescribing Cascade Correlator           * 5-Layer Indian Drug Resolver Core         |
|  * 4-System Organ Toxicity Engine           * Dual LLM Clinical Explanation Service     |
+--------------------------------------------+--------------------------------------------+
                                             | Prisma ORM Client
+--------------------------------------------v--------------------------------------------+
|                             PERSISTENCE & DATASETS (PostgreSQL / SQLite)                |
|  * User & Patient Profiles (Role-Based)     * Active & Discontinued Medication Lifecycle|
|  * DDInter Reference (222,385 records)      * Anticholinergic Burden Scoring Map        |
|  * CaDeN Cascade Rule Repository            * Herb-Drug Interaction Clinical Dataset   |
|  * FDA OFFSIDES Pharmacovigilance (PRR>=2.0)* Loose Pill Physical Imprint Catalog       |
+-----------------------------------------------------------------------------------------+
```

---

## Role-Based Access Control Matrix

PolySafe strictly enforces zero-trust, patient-consented role boundaries:

| Data & Functional Capabilities | Patient | Doctor (Connected) | Caregiver (Connected) |
| :--- | :---: | :---: | :---: |
| **Active Medication Timeline** | Full Read / Write | Full Read-Only | Restricted (No Drug Names) |
| **Risk Explanations** | Plain Patient Language | Clinical + Plain Rationale | Hidden |
| **Safety Status (Safe / Caution / Critical)** | Yes | Yes | Yes |
| **Daily Dose & Timing Schedule** | Full Details | Full Details | Time & Form / Color Only |
| **Symptom Logging & Cascade History** | Full Access | Full Access | Hidden |
| **Pre-Prescribing Safety Simulator** | N/A | Full Simulation Access | N/A |
| **STOPP/START Deprescribing Assistant** | N/A | Full Access | N/A |
| **Atomic Drug Substitution** | N/A | Authorized Write | N/A |
| **Clinical Directive Issuance** | N/A | Authorized Write | N/A |
| **Access Revocation** | Instant 1-Click | Cannot Manage Permissions | Cannot Manage Permissions |

---

## API Reference

### Authentication (`/auth`)
```http
POST /auth/check-email
POST /auth/patient/signup-send-otp
POST /auth/patient/verify-signup-otp
POST /auth/patient/login
POST /auth/doctor/signup
POST /auth/doctor/login
GET  /auth/me
```

### Medication Management (`/medicine`)
```http
GET    /medicine
POST   /medicine
GET    /medicine/search?q=:query
GET    /medicine/:id/resolve
GET    /medicine/:id/sideeffects
DELETE /medicine/:id
POST   /medicine/identify-pill
```

### Patient Analytics & Timeline (`/patient`)
```http
GET  /patient/home-summary
GET  /patient/timeline
POST /patient/profile
```

### Clinical Connections & Doctor Portal (`/connection`)
```http
POST /connection/generate-code
POST /connection/claim-code
POST /connection/:id/approve
GET  /connection/doctor-patient/:id/clinical-summary
POST /connection/doctor-safety-check
POST /connection/doctor-substitute
POST /connection/doctor-deprescribe
POST /connection/directive
POST /connection/:id/revoke
```

### Caregiver Portal (`/caregiver`)
```http
GET /caregiver/patients
GET /caregiver/patient-summary/:id
```

---

## Quickstart

### Prerequisites
- **Node.js:** v18.0.0+ (v20+ LTS recommended)
- **npm:** v9.0.0+
- **Database:** PostgreSQL or SQLite (default local development)
- **Git**

### 1. Clone & Install
```bash
git clone https://github.com/meetchauhan17/PolySafe.git
cd PolySafe
```

### 2. Backend Initialization
```bash
cd backend
npm install

# Initialize Prisma schema and SQLite / Postgres database
npx prisma db push

# Seed DDInter, ACB, Cascade, Herb-Drug, Imprints, and OFFSIDES datasets
npm run seed

# Launch Backend Server on http://localhost:5000
npm start
```

### 3. Frontend Initialization
```bash
# In a separate terminal window
cd ../frontend
npm install

# Launch Vite Client on http://localhost:3000
npm run dev
```

---

## Master Verification Audit

PolySafe includes an automated 18-step test suite validating all clinical workflows end-to-end:

```bash
cd backend
npm test
```

```
================================================================
      PolySafe Automated 18-Step Master System & API Audit      
================================================================
[STEP 1/18] PASS: POST /auth/patient/signup-send-otp (OTP Dispatched)
[STEP 2/18] PASS: POST /auth/patient/verify-signup-otp (User Created)
[STEP 3/18] PASS: POST /auth/doctor/signup (Doctor Registered)
[STEP 4/18] PASS: POST /auth/patient/login (Password Auth Verified)
[STEP 5/18] PASS: POST /auth/doctor/login (Doctor Auth Verified)
[STEP 6/18] PASS: GET /auth/me (RBAC Roles Enforced)
[STEP 7/18] PASS: POST /patient/profile (Baseline Clinical Profile Saved)
[STEP 8/18] PASS: POST /medicine (Warfarin 5mg - Harm Level L5 Assigned)
[STEP 9/18] PASS: POST /medicine (Aspirin 81mg - Pairwise DDInter Flagged)
[STEP 10/18] PASS: POST /medicine (Ginkgo Biloba - Herb-Drug Interaction Flagged)
[STEP 11/18] PASS: GET /patient/home-summary (Harm Gauge Calculated)
[STEP 12/18] PASS: GET /patient/timeline (Chronological Provenance Verified)
[STEP 13/18] PASS: POST /medicine/identify-pill (Loose Pill Imprint Resolved)
[STEP 14/18] PASS: POST /symptom (Symptom Logged & Prescribing Cascade Checked)
[STEP 15/18] PASS: POST /connection/generate-code (6-Digit Share PIN Generated)
[STEP 16/18] PASS: POST /connection/claim-code + approve (Doctor Paired & Approved)
[STEP 17/18] PASS: GET /connection/mine + POST /connection/doctor-safety-check (Simulation OK)
[STEP 18/18] PASS: DELETE /medicine/:id (Soft-Delete Provenance Preserved)
================================================================
                 18/18 tests passed (100% OK)                   
================================================================
```

---

## Deployment Guide

### Backend (Render Blueprint)
1. Link your GitHub repository to [Render](https://render.com).
2. Select **New &rarr; Blueprint** and point to `render.yaml`.
3. Render provisions the PostgreSQL instance, executes migrations, seeds datasets, and deploys the Node.js service.

### Frontend (Vercel SPA)
1. Import repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Vite`.
4. Configure Environment Variable:
   - `VITE_API_URL` = `https://your-polysafe-backend.onrender.com`
5. Deploy (Vercel automatically reads `frontend/vercel.json` for client-side routing).

---

## Clinical Evidence Base

- **DDInter Database:** Validated pharmacological interaction reference base (222,385 records).
- **NLM RxNorm & RxNav:** US National Library of Medicine concept standardizer and RxCUI terminology.
- **Anticholinergic Cognitive Burden Scale:** Boustani et al., *Aging & Mental Health*, 2008.
- **Beers Criteria 2023:** American Geriatrics Society updated criteria for potentially inappropriate medication use.
- **STOPP/START Criteria v3:** O'Mahony et al., *European Geriatric Medicine*, 2023.
- **FDA OFFSIDES Database:** Tatonetti et al., *Science Translational Medicine*, post-market signal miner.

---

## Security, Privacy & Ethics

- **Informational Buffer:** PolySafe operates strictly as a safety information layer; findings require confirmation by licensed healthcare practitioners.
- **Immediate Data Minimization:** Prescription label photos uploaded for OCR are processed in temporary memory and immediately unlinked and removed from disk.
- **Cryptographic Access Control:** Role boundaries are enforced via signed JWTs and backend route-level RBAC guards.
- **Clinical Provenance:** Discontinued medications are soft-deleted (`removedAt`) rather than erased, preserving full clinical timelines.

---

## License

This project is open-source under the [MIT License](https://opensource.org/licenses/MIT).
