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
  <a href="https://ai.google.dev/"><img src="https://img.shields.io/badge/Vision_OCR-Gemini_2.5_Flash_Lite-4285F4?style=flat-square&logo=google&logoColor=white" alt="Gemini Vision" /></a>
  <a href="https://rxnav.nlm.nih.gov/"><img src="https://img.shields.io/badge/Standards-NLM_RxNorm-005A9C?style=flat-square" alt="RxNorm" /></a>
  <a href="#master-verification-audit"><img src="https://img.shields.io/badge/Audit_Suite-18/18_Passed_(100%25)-008080?style=flat-square" alt="Audit" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-gray?style=flat-square" alt="License" /></a>
</p>

<br/>

[Overview](#overview) &bull; [Key Differentiators](#key-differentiators) &bull; [Clinical Engine Matrix](#clinical-engine-matrix) &bull; [Deterministic 5-Dimension Safety](#deterministic-5-dimension-safety-engine) &bull; [System Architecture](#system-architecture) &bull; [Access Control](#role-based-access-control-matrix) &bull; [API Reference](#api-reference) &bull; [Quickstart](#quickstart) &bull; [Resilience & Offline](#venue-fallback--offline-resilience) &bull; [Verification Audit](#master-verification-audit)

---

</div>

## Overview

In multi-condition and geriatric patients taking 5 or more concurrent medications, conventional drug interaction checkers routinely fail because they evaluate medications **two-at-a-time in static isolation**. 

PolySafe addresses the 5 primary clinical failure modes of fragmented healthcare delivery:

```
+---------------------------------------------------------------------------------------------------------+
|                                    FIVE PILLARS OF POLYPHARMACY RISK                                    |
+------------------------------------+------------------------------------+-------------------------------+
| RISK FACTOR                        | CLINICAL FAILURE MODE              | POLYSAFE INTERVENTION         |
+------------------------------------+------------------------------------+-------------------------------+
| 1. Care Fragmentation              | Specialists prescribe in silos     | Provider swimlane timeline    |
|                                    | without full regimen visibility.   | with consent-based sharing.   |
|                                    |                                    |                               |
| 2. Prescribing Cascades            | Drug side effects are misdiagnosed | Correlates symptom onset with |
|                                    | as new conditions, adding drugs.   | offending drug start dates.   |
|                                    |                                    |                               |
| 3. Hidden Multi-Salt Formulations  | Branded Indian medicines hide 2–3  | 5-layer resolution into pure  |
|                                    | chemical salts, causing overdoses. | active chemical constituents. |
|                                    |                                    |                               |
| 4. Herbal & OTC Blind Spots        | Patients omit supplements during   | Curated botanical-drug cross  |
|                                    | visits, risking bleeding events.   | reference safety engine.      |
|                                    |                                    |                               |
| 5. Cumulative Anticholinergic Load | Multiple mild drugs compound into  | Real-time ACB cognitive score |
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
|  DDInter DB   |         |   ACB Scale   |       |                 | Prescribing   |
| 222,383 Rows  |         |  Cumulative   |       |                 | Cascade Engine|
| 160,235 Pairs |         |  567 Scored   |       |                 | 581 DB Rules  |
+---------------+         +---------------+       |                 +---------------+
                                                  |
                                  +---------------v---------------+
                                  |   5-Dimension Safety Engine   |
                                  |  * Duplicate Active Salts     |
                                  |  * Class Redundancy (NSAIDs)  |
                                  |  * Patient Allergy Mapping    |
                                  |  * AGS Beers 2023 Diseases    |
                                  |  * Food & Chelation Spacing   |
                                  +-------------------------------+
```

- **DDInter Verified Reference Base:** Evaluates active regimens against **222,383 database records** representing **160,235 distinct unique unordered drug pairs** categorized into `Major`, `Moderate`, and `Minor` severity.
- **5-Dimension Deterministic Safety Engine:** Goes beyond pairwise interactions to catch duplicate active salts, therapeutic class duplication, patient drug allergies, AGS Beers 2023 disease-drug contraindications, and food/chelation interval spacing.
- **Indian Formulary 5-Layer Multi-Salt Resolver:** Decomposes combination trade names (e.g. *Pan-D*, *Combiflam*, *Augmentin 625*, *Zerodol SP*, *Naxdom 500*, *Telma H*, *Stamlo Beta*) into exact chemical constituents across dictionary, disk cache, RxNorm, Groq Llama-3.3-70b, and Gemini 2.5 Flash Lite fallback layers.
- **Cumulative Anticholinergic Cognitive Burden (ACB):** Quantifies total anticholinergic/sedative load across **567 scored medications** calibrated against the Boustani ACB Scale and AGS Beers Criteria to prevent cognitive decline and fall hazards.
- **Prescribing Cascade Correlator:** **581 clinical cascade rules** (spanning 30 drug classes and 480 symptom keywords) linking patient symptom onset to prior prescriptions to intercept misdiagnosed drug-induced adverse events.
- **Herb-Drug Cross-Reactivity Engine:** **526 clinical interaction pairs** mapping botanical and Ayurvedic supplements (e.g. Ginkgo Biloba, Turmeric/Curcumin, Ashwagandha, St. John's Wort) against pharmaceuticals to prevent hemorrhage and metabolic failure.
- **Post-Market Pharmacovigilance (OFFSIDES):** **1,225,552 adverse drug event signals** in database derived from FDA AERS post-market reporting.
- **Pill Imprint Identifier:** **560 authentic FDA/NLM pill imprints** indexed with shape, color, scoring, and debossed code matching.
- **Indications Formulary:** **691 curated indications** explaining therapeutic purpose in clear patient language.
- **PolySafe Harm Level (L1 to L5):** Deterministic 5-level risk stratification (L1: Minimal to L5: Critical Risk) evaluating narrow therapeutic index (NTI), organ clearance pathways, and Beers criteria.
- **Interactive Force-Directed Interaction Web:** Dynamic HTML5 Canvas graph rendering multidimensional drug clusters, color-coded severity links, and drag-and-drop node physics.
- **Caregiver Privacy Shield:** Real-time dose logging telemetry and live reminder nudges via Socket.IO with zero leak of confidential drug names.
- **Stage Presentation Projector Mode:** One-click toggle (`?projector=1`) disabling 3D effects and ambient grain while boosting color contrast for auditorium projectors and accessible viewing.

---

## Clinical Engine Matrix

| Clinical Subsystem | Underlying Dataset / Model | Mechanism & Verified Scope |
| :--- | :--- | :--- |
| **Drug-Drug Interactions** | **DDInter Database** | **222,383 records** (**160,235 unique unordered pairs**); categorizes severity as `Major`, `Moderate`, or `Minor`. |
| **Anticholinergic Burden** | **ACB Scale (Boustani et al.)** | **567 scored drugs** in DB; computes cumulative score into `Normal`, `Moderate`, or `Critical` cognitive load. |
| **Cascade Detection** | **CaDeN & Rochon Protocols** | **581 clinical rules** in DB linking symptom keywords with offending pharmacological classes. |
| **Herbal Cross-Reactivity** | **Phytotherapy Research Data** | **526 clinical monographs** covering bleeding risks and CYP450 metabolic interference across botanical supplements. |
| **Pill Imprint Identifier** | **FDA DailyMed & NLM** | **560 physical imprint records** matching tablet/capsule debossed alphanumeric codes, shape, and hue. |
| **Clinical Indications** | **CDSCO & Global Formularies**| **691 curated drug indications** resolving therapeutic purpose across Indian and international brands. |
| **Post-Market Adverse Events**| **FDA OFFSIDES (Tatonetti Lab)** | **1,225,552 pharmacovigilance ADE signals** with Proportional Reporting Ratios ($\text{PRR} \ge 2.0$). |
| **Brand-to-Salt Resolution**| **Indian Formulary + RxNorm + AI** | **5-layer cascading pipeline** resolving trade brands to pure active chemical salts with 296 cached mappings. |
| **Regimen Risk Stratification**| **PolySafe Harm Level (L1 to L5)**| Scores medications L1 to L5; synthesizes active count, ACB score, and DDInter flags into overall regimen status. |
| **Organ Toxicity Radar** | **Pharmacokinetic Modeler** | Maps metabolic clearance pathways to compute Recharts radar telemetry across Renal, Hepatic, Cardio, and CNS systems. |

---

## Deterministic 5-Dimension Safety Engine

PolySafe executes deterministic clinical validations beyond pairwise drug-drug interactions:

```
[Regimen & Patient Profile Input]
              │
              ├─► A. DUPLICATE_INGREDIENT
              │      Finds identical chemical salts in different products (e.g. Dolo 650 + Combiflam)
              │
              ├─► B. DUPLICATE_CLASS
              │      Flags therapeutic redundancy (e.g. 2 NSAIDs like Ibuprofen + Naproxen, or 2 PPIs)
              │
              ├─► C. ALLERGY CROSS-REACTIVITY
              │      Maps patient allergies to drug classes (e.g. Penicillin allergy vs Amoxicillin)
              │
              ├─► D. DISEASE_DRUG CONTRAINDICATIONS
              │      AGS Beers 2023 & STOPP/START checks (e.g. NSAID with Chronic Kidney Disease / HTN)
              │
              └─► E. FOOD & CHELATION SPACING
                     Food timing & interval spacing (e.g. Levothyroxine 4 hrs before Calcium; Warfarin Vitamin K)
```

---

## System Architecture

```
+-----------------------------------------------------------------------------------------+
|                                CLIENT LAYER (React 19 + Vite 8)                         |
|  * Industrial Skeuomorphic Design System    * TanStack React Query v5 Data Layer        |
|  * Recharts 4-Organ Toxicity Radar Chart    * Framer Motion Animations & A11y Controls  |
|  * Interactive Canvas Interaction Web Graph * Trilingual Localization (EN, HI, GU)      |
|  * Real-Time Socket.IO Client Telemetry     * Stage Projector Mode (?projector=1)       |
+--------------------------------------------+--------------------------------------------+
                                             | HTTP REST / WebSocket JSON
+--------------------------------------------v--------------------------------------------+
|                              SERVER API LAYER (Node.js 22 + Express 5)                  |
|  * JWT Auth & Brute-Force Rate Limiting     * 76 API Route Handlers across 9 Routers    |
|  * DDInter 222K Pairwise Interaction Engine * Cumulative ACB Cognitive Calculator (567) |
|  * Prescribing Cascade Correlator (581)     * Deterministic 5-Dimension Safety Engine   |
|  * 5-Layer Indian Multi-Salt Resolver Core  * Dual-Persona Clinical Explanation Service |
+--------------------------------------------+--------------------------------------------+
                                             | Prisma ORM Client
+--------------------------------------------v--------------------------------------------+
|                             PERSISTENCE & DATASETS (PostgreSQL)                         |
|  * 15 Prisma ORM Models                     * Active & Soft-Deleted Medication Regimens |
|  * DrugInteractionReference (222,383 rows)  * BurdenScore (567 ACB-scored drugs)        |
|  * CascadeReference (581 rules in DB)       * HerbDrugReference (526 pairs in DB)       |
|  * DrugSideEffect (1,225,552 OFFSIDES rows) * PillImprint (560 imprints in DB)          |
+-----------------------------------------------------------------------------------------+
```

---

## Role-Based Access Control Matrix

PolySafe strictly enforces patient-consented, role-based boundaries:

| Data & Functional Capabilities | Patient | Doctor (Connected) | Caregiver (Connected) |
| :--- | :---: | :---: | :---: |
| **Active Medication Timeline & Swimlanes** | Full Read / Write | Full Read-Only | Restricted (Form & Color Only, No Drug Names) |
| **Risk Explanations & Mechanisms** | Plain Patient Language | Clinical + Pharmacological Rationale | Hidden |
| **Safety Status (Normal / Caution / Critical)**| Yes | Yes | Yes |
| **Dose Logging & 7-Day Adherence Streak** | Full Logging | Telemetry Review | Adherence % & Missed Dose Notifications |
| **Symptom Logging & Cascade History** | Full Access | Full Access | Hidden |
| **Pre-Prescribing Safety Simulator** | N/A | Full Simulation Access | N/A |
| **Physician Deprescribing Suggestions** | N/A | Full Access | N/A |
| **Clinical Directive Issuance** | Receives Directives | Authorized Write | Notification of Update |
| **Live Patient Dose Reminder Nudge** | Receives Reminders | N/A | Live One-Tap Ping |
| **Emergency Medical Card & Passport (QR)** | Full Access | Full Access | Emergency View |
| **Access Revocation** | Instant 1-Click | Cannot Manage Permissions | Cannot Manage Permissions |

---

## API Reference

The backend exposes **76 route handlers** across 9 distinct modules:

### Authentication (`/auth`)
```http
POST /auth/check-email
POST /auth/patient/signup-send-otp
POST /auth/patient/verify-signup-otp
POST /auth/patient/login
POST /auth/doctor/signup
POST /auth/doctor/login
POST /auth/caregiver/signup-send-otp
POST /auth/caregiver/verify-signup-otp
POST /auth/caregiver/login
POST /auth/forgot-password
POST /auth/reset-password
POST /auth/logout
GET  /auth/me
DELETE /auth/delete-account
```

### Medication Management (`/medicine`)
```http
GET    /medicine
POST   /medicine
POST   /medicine/batch
GET    /medicine/search?q=:query
GET    /medicine/:id/resolve
GET    /medicine/:id/sideeffects
DELETE /medicine/:id
POST   /medicine/identify-pill
GET    /medicine/barcode/:code
POST   /medicine/scan
```

### Patient Analytics & Doses (`/patient`)
```http
GET  /patient/home-summary
GET  /patient/timeline
POST /patient/profile
POST /patient/dose
GET  /patient/doses?date=YYYY-MM-DD
GET  /patient/adherence?days=7
```

### Clinical Connections & Pre-Prescribing (`/connection`)
```http
POST /connection/generate-code
POST /connection/claim-code
POST /connection/:id/approve
GET  /connection/mine
GET  /connection/doctor-patients
GET  /connection/doctor-patient/:id/clinical-summary
POST /connection/doctor-safety-check
POST /connection/doctor-substitute
POST /connection/doctor-deprescribe
POST /connection/directive
POST /connection/:id/revoke
GET  /connection/patient-safety-alerts/:patientId
```

### Caregiver Portal (`/caregiver`)
```http
GET  /caregiver/patients
GET  /caregiver/patient-summary/:patientId
POST /caregiver/remind-patient/:patientId
```

### Symptoms, Prescribing Cascades & System Health
```http
POST /symptom
GET  /symptom/history
GET  /health
```

---

## Quickstart

### Prerequisites
- **Node.js:** v18.0.0+ (v22+ LTS recommended)
- **npm:** v9.0.0+
- **Database:** PostgreSQL (seeded via Prisma)
- **Git**

### 1. Clone Repository
```bash
git clone https://github.com/meetchauhan17/PolySafe.git
cd PolySafe
```

### 2. Backend Setup
```bash
cd backend
npm install

# Initialize Prisma schema and push database
npx prisma db push

# Seed DDInter (222k), ACB (567), Cascades (581), Herb-Drug (526), Imprints (560), OFFSIDES (1.2M)
npm run seed

# Launch Backend API server on http://localhost:5000
npm run dev
```

### 3. Frontend Setup
```bash
# In a separate terminal window
cd ../frontend
npm install

# Launch Vite client server on http://localhost:3000
npm run dev
```

---

## Venue Fallback & Offline Resilience

For live presentations, hackathon stages, or spotty venue connectivity:

### 1. Offline Guest Demo Mode
Click **"Try the sample patient"** on the login page:
- **100% Client-Side:** Home dashboard, Risk Analysis, Timeline Swimlanes, Indian Formulary Resolver, Insights trends, and Doctor/Caregiver demo views run purely in browser memory.
- **Zero API Calls:** No backend server or active internet connection required.

### 2. Progressive Web App (PWA) & Service Worker
- **App Shell Precaching:** Service Worker precaches core bundles, stylesheets, fonts, and icons.
- **Stale-While-Revalidate:** API responses are cached in IndexedDB/CacheStorage; offline banners indicate cached mode when disconnected.
- **Installable:** Meets Web App Manifest criteria for desktop Chrome and mobile installation.

### 3. Stage Projector Mode
Add `?projector=1` to any URL or toggle **Stage Projector Mode** in `/profile`:
- Instantly disables 3D CSS perspective transforms and ambient noise filters.
- Forces high-contrast color values for auditorium projection screens.

### 4. Diagnostic Health Screen
Navigate to `/status` to verify real-time latency, PostgreSQL connection status, and API availability before presenting.

---

## Master Verification Audit

Run the automated test suites to verify end-to-end clinical and system operations:

```bash
cd backend
npm test
```

```
================================================================
      PolySafe Automated 18-Step Master System & API Audit      
================================================================
✔ [HEALTH CHECK] GET /health OK (API: true, DB: true, DEMO: false)
✔ [STEP 1/18] PASS: POST /auth/patient/signup-send-otp (OTP Dispatched)
✔ [STEP 2/18] PASS: POST /auth/patient/verify-signup-otp (User Created)
✔ [STEP 3/18] PASS: POST /auth/doctor/signup (Doctor Registered)
✔ [STEP 4/18] PASS: POST /auth/patient/login (Password Auth Verified)
✔ [STEP 5/18] PASS: POST /auth/doctor/login (Doctor Auth Verified)
✔ [STEP 6/18] PASS: GET /auth/me (RBAC Roles Enforced)
✔ [STEP 7/18] PASS: POST /patient/profile (Baseline Clinical Profile Saved)
✔ [STEP 8/18] PASS: POST /medicine (Warfarin 5mg - Harm Level L5 Assigned)
✔ [STEP 9/18] PASS: POST /medicine (Aspirin 81mg - Pairwise DDInter Flagged)
✔ [STEP 10/18] PASS: POST /medicine (Ginkgo Biloba - Herb-Drug Interaction Flagged)
✔ [STEP 11/18] PASS: GET /patient/home-summary (Harm Gauge Calculated)
✔ [STEP 12/18] PASS: GET /patient/timeline (Chronological Provenance Verified)
✔ [STEP 13/18] PASS: POST /medicine/identify-pill (Loose Pill Imprint Resolved)
✔ [STEP 14/18] PASS: POST /symptom (Symptom Logged & Prescribing Cascade Checked)
✔ [STEP 15/18] PASS: POST /connection/generate-code (6-Digit Share PIN Generated)
✔ [STEP 16/18] PASS: POST /connection/claim-code + approve (Doctor Paired & Approved)
✔ [STEP 17/18] PASS: GET /connection/mine + POST /connection/doctor-safety-check (Simulation OK)
✔ [STEP 18/18] PASS: DELETE /medicine/:id (Soft-Delete Provenance Preserved)
================================================================
                 18/18 tests passed (100% OK)                   
================================================================
```

### Additional Test Suites
- `npm run test:resolver`: Validates the Indian 5-Layer Brand-to-Salt Resolver (**12/12 passed**).
- `node tests/test-safety-checks.js`: Validates the 5-Dimension Safety Engine (**8/8 passed**).
- `node tests/test-dose-tracking.js`: Validates dose scheduling, adherence streaks, and caregiver privacy (**6/6 passed**).
- `node tests/test-doctor-safety-check.js`: Validates pre-prescribing simulation checks (**3/3 passed**).
- `node tests/test-production-features.js`: Validates password resets, account deletion, and session revocation (**4/4 passed**).

---

## Clinical Evidence Base

- **DDInter Database:** Validated pharmacological interaction reference base (222,383 records, 160,235 unique pairs).
- **NLM RxNorm & RxNav:** US National Library of Medicine concept standardizer and RxCUI terminology.
- **Anticholinergic Cognitive Burden Scale:** Boustani et al., *Aging & Mental Health*, 2008 (567 scored drugs).
- **Beers Criteria 2023:** American Geriatrics Society updated criteria for potentially inappropriate medication use.
- **STOPP/START Criteria v3:** O'Mahony et al., *European Geriatric Medicine*, 2023.
- **FDA OFFSIDES Database:** Tatonetti et al., *Science Translational Medicine*, post-market signal miner (1.2M+ records).
- **Indian Pharmacopoeia & CDSCO Formulary:** Reference standards for Indian combination brands and salts.

---

## Security, Privacy & Ethics

- **Informational Safety Buffer:** PolySafe operates strictly as a decision-support and safety-information layer; all findings require confirmation by licensed healthcare practitioners.
- **Zero-Leak Caregiver Shield:** Caregivers receive real-time dose adherence telemetry and reminder nudges with zero disclosure of confidential prescription names.
- **Immediate Data Minimization:** Prescription label photos uploaded for OCR/Vision extraction are processed in temporary memory and immediately unlinked and removed from disk.
- **Cryptographic Access Control:** Role boundaries are enforced via signed JWTs, bcrypt password hashing, and backend route-level RBAC guards.
- **Clinical Provenance:** Discontinued medications are soft-deleted (`removedAt`) rather than erased, preserving full clinical audit timelines.

---

## License

This project is open-source under the [MIT License](https://opensource.org/licenses/MIT).
