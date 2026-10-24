<div align="center">

# PolySafe

### Continuous Clinical Polypharmacy Risk, Prescribing Cascade & Drug Interaction Platform

Preventing adverse drug events across fragmented care silos through continuous, multi-agent pharmacological intelligence.

[![React 19](https://img.shields.io/badge/Frontend-React_19_·_Vite_8-0ea5e9?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_22_·_Express_5-16a34a?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Prisma ORM](https://img.shields.io/badge/Database-Prisma_ORM_·_PostgreSQL-334155?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Socket.IO](https://img.shields.io/badge/Realtime-Socket.IO_4.8-1e293b?style=flat-square&logo=socketdotio&logoColor=white)](https://socket.io/)
[![Groq LLaMA](https://img.shields.io/badge/LLM-Groq_LLaMA--3.3--70B-dc2626?style=flat-square)](https://groq.com/)
[![Gemini Vision](https://img.shields.io/badge/Vision_OCR-Gemini_2.5_Flash_Lite-2563eb?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![RxNorm Standards](https://img.shields.io/badge/Standards-NLM_RxNorm-0284c7?style=flat-square)](https://rxnav.nlm.nih.gov/)
[![Master Audit](https://img.shields.io/badge/Audit_Suite-18/18_Passed_(100%25)-0d9488?style=flat-square)](#master-verification-audit)
[![License](https://img.shields.io/badge/License-MIT-64748b?style=flat-square)](https://opensource.org/licenses/MIT)

<br/>

[Overview](#overview) • [Clinical Problem Statement](#clinical-problem-statement) • [Core Differentiators](#core-differentiators) • [Clinical Safety Subsystems](#clinical-safety-subsystems) • [Deterministic 5-Dimension Engine](#deterministic-5-dimension-safety-engine) • [Multi-Salt Formulation Resolver](#indian-formulary-5-layer-multi-salt-resolver) • [System Architecture](#system-architecture) • [Role-Based Access Control](#role-based-access-control-matrix) • [API Endpoint Reference](#api-endpoint-reference) • [Database Architecture](#database-architecture) • [Installation & Setup](#installation--quickstart) • [Offline Resilience](#offline-resilience--demo-mode) • [Verification Audit](#master-verification-audit) • [Evidence Base](#clinical-evidence-base)

---

</div>

## Overview

In multi-condition and geriatric patients taking 5 or more concurrent medications, conventional drug interaction checkers routinely fail because they evaluate medications **two-at-a-time in static isolation**. 

PolySafe is a production-grade clinical pharmacovigilance platform built for patients, attending physicians, and caregivers. It evaluates whole-regimen cumulative toxicity in real time across fragmented clinical silos, detecting drug-drug interactions, prescribing cascades, duplicate chemical salts, anticholinergic cognitive burdens, food-drug spacing conflicts, and botanical supplement risks.

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
| 3. Hidden Multi-Salt Formulations  | Branded Indian medicines hide 2-3  | 5-layer resolution into pure  |
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

## Clinical Problem Statement

Polypharmacy (concurrent use of 5 or more medications) and hyperpolypharmacy (10 or more medications) account for over **30% of emergency hospital admissions** in adults aged 65 and older. 

The clinical breakdown originates from four fundamental bottlenecks:

1. **Static Pairwise Blindness:** Standard clinical checkers flag isolated pairs (e.g. A + B), completely missing multi-drug interactions (e.g. A + B + C + D) that compound renal strain, QT prolongation, or central nervous system depression.
2. **The Prescribing Cascade Trap:** When a drug induces a subtle adverse reaction (e.g. amlodipine causing peripheral leg edema), clinicians frequently misdiagnose the symptom as heart failure or venous insufficiency and prescribe a second medication (e.g. furosemide), triggering dehydration, hypokalemia, and further prescription additions.
3. **Combination Brand Obfuscation:** In regional markets such as India, multi-ingredient fixed-dose combinations (e.g. *Combiflam*, *Zerodol SP*, *Pan-D*, *Augmentin 625*) conceal active ingredients under trade names, leading patients to unknowingly ingest toxic daily cumulative doses of Paracetamol, Aceclofenac, or Domperidone.
4. **Caregiver Information Asymmetry:** Non-clinical family members manage complicated medication schedules with zero visibility into high-alert drugs or missed-dose risks, while strict privacy standards prohibit exposing sensitive clinical diagnostic records to third parties.

---

## Core Differentiators

```mermaid
graph TD
    subgraph Data Sources & Reference Bases
        DD[DDInter Verified Database<br/>222,383 Records / 160,235 Pairs]
        ACB[Boustani Anticholinergic Scale<br/>567 Calibrated Burden Scores]
        CAS[Prescribing Cascade Rules<br/>581 Documented Drug-Symptom Pairs]
        HERB[Herb-Drug Interaction Matrix<br/>526 Botanical Clinical Monographs]
        OFF[FDA OFFSIDES Dataset<br/>1,225,552 Pharmacovigilance Signals]
        PIM[FDA/NLM Pill Imprints<br/>560 Authenticated Markings]
    end

    subgraph Core Processing Engines
        D5[5-Dimension Deterministic Engine]
        RES[5-Layer Multi-Salt Resolver]
        RAD[Organ Clearance Modeler]
    end

    DD --> D5
    ACB --> D5
    CAS --> D5
    HERB --> D5
    OFF --> D5
    PIM --> RES
    RES --> D5
    D5 --> RAD

    subgraph Clinical Outputs
        OUT1[WHO 5-Tier Regimen Risk]
        OUT2[Interactive Force-Directed Web]
        OUT3[Physician Workstation & Clinic Board]
        OUT4[Caregiver Privacy Shield Telemetry]
        OUT5[ISO 7810 Wallet Card & Clinical Report]
    end

    RAD --> OUT1
    RAD --> OUT2
    RAD --> OUT3
    RAD --> OUT4
    RAD --> OUT5
```

- **DDInter Verified Reference Base:** Evaluates active regimens against **222,383 database records** representing **160,235 distinct unique unordered drug pairs** categorized into `Major`, `Moderate`, and `Minor` severity tiers.
- **5-Dimension Deterministic Safety Engine:** Runs beyond pairwise lookups to catch duplicate chemical salts, therapeutic class duplication, patient drug allergies, AGS Beers 2023 disease-drug contraindications, and food/chelation interval spacing.
- **Indian Formulary 5-Layer Multi-Salt Resolver:** Decomposes combination trade names (e.g. *Pan-D*, *Combiflam*, *Augmentin 625*, *Zerodol SP*, *Naxdom 500*, *Telma H*, *Stamlo Beta*) into exact chemical constituents across dictionary, disk cache, RxNorm, Groq Llama-3.3-70b, and Gemini 2.5 Flash Lite fallback layers.
- **Cumulative Anticholinergic Cognitive Burden (ACB):** Quantifies total anticholinergic/sedative load across **567 scored medications** calibrated against the Boustani ACB Scale and AGS Beers Criteria to prevent cognitive decline and fall hazards.
- **Prescribing Cascade Correlator:** **581 clinical cascade rules** (spanning 30 drug classes and 480 symptom keywords) linking patient symptom onset to prior prescriptions to intercept misdiagnosed drug-induced adverse events.
- **Herb-Drug Cross-Reactivity Engine:** **526 clinical interaction pairs** mapping botanical and Ayurvedic supplements (e.g. Ginkgo Biloba, Turmeric/Curcumin, Ashwagandha, St. John's Wort) against pharmaceuticals to prevent hemorrhage and metabolic failure.
- **Post-Market Pharmacovigilance (OFFSIDES):** **1,225,552 adverse drug event signals** in database derived from FDA AERS post-market reporting with Proportional Reporting Ratios ($\text{PRR} \ge 2.0$).
- **Pill Imprint Identifier:** **560 authentic FDA/NLM pill imprints** indexed with shape, color, scoring, and debossed code matching.
- **Clinical Indications Formulary:** **691 curated indications** explaining therapeutic purpose in patient-friendly and professional medical terminology.
- **PolySafe Harm Level (L1 to L5):** Deterministic 5-level risk stratification (L1: Minimal to L5: Critical Risk) evaluating narrow therapeutic index (NTI), organ clearance pathways, and Beers criteria.
- **Interactive Force-Directed Interaction Web:** Dynamic HTML5 Canvas graph rendering multidimensional drug clusters, color-coded severity links, and drag-and-drop node physics.
- **Caregiver Privacy Shield:** Real-time dose logging telemetry and live reminder nudges via Socket.IO with zero leak of confidential drug names.
- **Accessible Visual Controls:** Dynamic text size adjustment, light/dark clinical themes, and reduced-motion ergonomics for all clinical workflows.

---

## Clinical Safety Subsystems

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

Beyond traditional two-drug lookups, PolySafe executes a multi-dimensional clinical safety audit across 5 deterministic vectors:

```
[Regimen & Patient Profile Input]
              |
              +--> 1. DUPLICATE INGREDIENT DETECTION
              |      Decomposes multi-salt brands into chemical active substances.
              |      Flags when two different trade drugs contain identical chemical salts
              |      (e.g., Dolo 650 + Combiflam = toxic cumulative Paracetamol dose).
              |
              +--> 2. THERAPEUTIC CLASS REDUNDANCY
              |      Maps each agent to anatomical-therapeutic chemical classes.
              |      Flags duplicative mechanisms of action without additive benefit
              |      (e.g., Ibuprofen + Naproxen = double NSAID gastrointestinal bleed risk).
              |
              +--> 3. ALLERGEN CROSS-REACTIVITY MAPPING
              |      Cross-references documented patient allergies against drug classes.
              |      Catches beta-lactam, sulfonamide, and salicylate sensitivities
              |      (e.g., Documented Penicillin allergy vs. Augmentin / Amoxicillin prescription).
              |
              +--> 4. DISEASE-DRUG CONTRAINDICATIONS
              |      Applies AGS Beers 2023 and STOPP/START criteria against chronic diagnoses.
              |      Identifies organ vulnerabilities and disease-exacerbating prescriptions
              |      (e.g., NSAID prescribed to patient with Chronic Kidney Disease or Heart Failure).
              |
              +--> 5. FOOD & CHELATION SPACING PROTOCOLS
                     Calculates clinical spacing intervals between drugs and meals.
                     Prevents chelation, malabsorption, and acute metabolic antagonism
                     (e.g., Levothyroxine 4 hours apart from Calcium; Warfarin consistent Vitamin K).
```

---

## Indian Formulary 5-Layer Multi-Salt Resolver

Branded medicines in India frequently bundle two or three active pharmaceutical ingredients under a proprietary trade name. PolySafe resolves trade names to pure active salts using a 5-layer deterministic pipeline:

```mermaid
flowchart TD
    A[Input: Trade Brand Name e.g. Pan-D, Combiflam] --> B{Layer 1: Exact Local Dictionary}
    B -- Match Found --> Z[Return Canonical Generic Salts]
    B -- Not Found --> C{Layer 2: Local AI Resolution Cache}
    C -- Match Found --> Z
    C -- Not Found --> D{Layer 3: NLM RxNorm / RxNav Concept}
    D -- Match Found --> Z
    D -- Not Found --> E{Layer 4: Groq LLaMA-3.3-70B Structured JSON}
    E -- Match Found --> F[Cache to ai-resolved-drugs.json]
    F --> Z
    E -- Failure / Timeout --> G{Layer 5: Gemini 2.5 Flash Lite Vision/Text}
    G -- Match Found --> F
    G -- Fallback --> H[Heuristic Extraction / Manual Prompt]
    H --> Z
```

---

## System Architecture

```
+-----------------------------------------------------------------------------------------+
|                                CLIENT LAYER (React 19 + Vite 8)                         |
|  * Industrial Design System (WCAG AA)        * TanStack React Query v5 Data Layer       |
|  * Recharts 4-Organ Toxicity Radar Chart     * Framer Motion Animations & A11y Controls |
|  * Interactive Canvas Interaction Web Graph  * Trilingual Localization (EN, HI, GU)     |
|  * Real-Time Socket.IO Client Telemetry      * Dynamic Text Scaling & Theme Controls    |
+--------------------------------------------+--------------------------------------------+
                                             | HTTP REST / WebSocket JSON
+--------------------------------------------v--------------------------------------------+
|                              SERVER API LAYER (Node.js 22 + Express 5)                  |
|  * JWT Auth & Brute-Force Rate Limiting     * 76 API Route Handlers across 9 Routers   |
|  * DDInter 222K Pairwise Interaction Engine * Cumulative ACB Cognitive Calculator (567) |
|  * Prescribing Cascade Correlator (581)     * Deterministic 5-Dimension Safety Engine  |
|  * 5-Layer Indian Multi-Salt Resolver Core  * Dual-Persona Clinical Explanation Service|
+--------------------------------------------+--------------------------------------------+
                                             | Prisma ORM Client
+--------------------------------------------v--------------------------------------------+
|                             PERSISTENCE & DATASETS (PostgreSQL)                        |
|  * 15 Prisma ORM Models                     * Active & Soft-Deleted Medication Regimens |
|  * DrugInteractionReference (222,383 rows)  * BurdenScore (567 ACB-scored drugs)       |
|  * CascadeReference (581 rules in DB)       * HerbDrugReference (526 pairs in DB)      |
|  * DrugSideEffect (1,225,552 OFFSIDES rows) * PillImprint (560 imprints in DB)         |
+-----------------------------------------------------------------------------------------+
```

---

## Role-Based Access Control Matrix

PolySafe enforces patient-consented, role-based boundaries:

| Data & Functional Capabilities | Patient | Doctor (Connected) | Caregiver (Connected) |
| :--- | :---: | :---: | :---: |
| **Active Medication Timeline & Swimlanes** | Full Read / Write | Full Read-Only | Restricted (Form & Color Only, No Drug Names) |
| **Risk Explanations & Mechanisms** | Plain Patient Language | Clinical + Pharmacological Rationale | Hidden |
| **Safety Status (Normal / Caution / Critical)**| Accessible | Accessible | Accessible |
| **Dose Logging & 7-Day Adherence Streak** | Full Logging | Telemetry Review | Adherence % & Missed Dose Notifications |
| **Symptom Logging & Cascade History** | Full Access | Full Access | Hidden |
| **Pre-Prescribing Safety Simulator** | N/A | Full Simulation Access | N/A |
| **Physician Deprescribing Suggestions** | N/A | Full Access | N/A |
| **Clinical Directive Issuance** | Receives Directives | Authorized Write | Notification of Update |
| **Live Patient Dose Reminder Nudge** | Receives Reminders | N/A | Live One-Tap Ping |
| **Emergency Medical Card & Passport (QR)** | Full Access | Full Access | Emergency View |
| **Access Revocation** | Instant 1-Click | Cannot Manage Permissions | Cannot Manage Permissions |

---

## API Endpoint Reference

The backend provides **76 production-tested route handlers** structured across 9 domain modules:

### 1. Authentication & Identity (`/auth`)
- `POST /auth/check-email`: Verifies account existence and registration state.
- `POST /auth/patient/signup-send-otp`: Dispatches 6-digit cryptographic verification code to email.
- `POST /auth/patient/verify-signup-otp`: Validates code, registers user, and issues signed Bearer JWT.
- `POST /auth/patient/login`: Authenticates patient via password or verified email credential.
- `POST /auth/doctor/signup`: Registers licensed physician with medical license number.
- `POST /auth/doctor/login`: Physician credential authentication.
- `POST /auth/caregiver/signup-send-otp`: Initiates caregiver registration via OTP.
- `POST /auth/caregiver/verify-signup-otp`: Verifies caregiver identity.
- `POST /auth/caregiver/login`: Authenticates caregiver.
- `POST /auth/forgot-password`: Generates secure password reset token.
- `POST /auth/reset-password`: Resets credentials with cryptographic token.
- `POST /auth/logout`: Clears authorization session.
- `GET /auth/me`: Retrieves current authenticated user context and role.
- `DELETE /auth/delete-account`: Purges account data per privacy standards.

### 2. Medication Management (`/medicine`)
- `GET /medicine`: Lists all active medications for authenticated patient.
- `POST /medicine`: Adds medication, resolves salts, assigns harm level, runs 5D safety checks.
- `POST /medicine/batch`: Atomically validates and commits multi-drug prescription intake.
- `GET /medicine/search?q=:query`: Formulary autocomplete with generic resolution.
- `GET /medicine/:id/resolve`: Decomposes specific medication into active chemical salts.
- `GET /medicine/:id/sideeffects`: Retrieves FDA OFFSIDES post-market adverse event signals.
- `DELETE /medicine/:id`: Soft-deletes medication (`removedAt`) preserving clinical timeline history.
- `POST /medicine/identify-pill`: Matches physical pill imprint code, color, and shape.
- `GET /medicine/barcode/:code`: Resolves EAN/UPC barcode against local pharmaceutical registry.

### 3. Prescription OCR & Vision Extraction (`/medicine/scan`)
- `POST /medicine/scan`: Extracts medications, dosage strengths, frequency, instructions, and clinical indications from camera photos or file uploads via Gemini Vision / OCR.space.

### 4. Patient Analytics & Doses (`/patient`)
- `GET /patient/home-summary`: Returns WHO harm score, ACB score, interaction count, and top alerts.
- `GET /patient/timeline`: Chronological prescriber swimlane timeline with discontinued history.
- `POST /patient/profile`: Updates chronic diagnoses, age, gender, and documented drug allergies.
- `POST /patient/dose`: Records dose event (`TAKEN`, `SKIPPED`, `MISSED`) with timestamp.
- `GET /patient/doses?date=YYYY-MM-DD`: Returns full regimen schedule for target date.
- `GET /patient/adherence?days=7`: Calculates longitudinal adherence percentage and streak.

### 5. Clinical Connections & Physician Collaboration (`/connection`)
- `POST /connection/generate-code`: Generates 24-hour single-use 6-digit sharing PIN.
- `POST /connection/claim-code`: Physician claims patient connection via PIN.
- `GET /connection/pending`: Lists pending doctor connection requests awaiting patient approval.
- `GET /connection/mine`: Lists all approved patients linked to the authenticated physician.
- `POST /connection/:id/approve`: Patient grants read-only clinical access to doctor.
- `POST /connection/:id/revoke`: Patient immediately revokes doctor access.
- `GET /connection/doctor-patients`: Returns triage priority list with ACB and interaction tallies.
- `GET /connection/doctor-patient/:id/clinical-summary`: Full patient regimen summary for doctor review.
- `GET /connection/doctor-patient/:id/timeline`: Prescriber swimlane history for selected patient.
- `POST /connection/doctor-safety-check`: Pre-prescribing simulator evaluating hypothetical candidate drugs against patient's active regimen.
- `POST /connection/doctor-substitute`: Atomically substitutes an interacting drug with safer alternative.
- `POST /connection/doctor-deprescribe`: Issues structured deprescribing recommendation.
- `POST /connection/directive`: Pushes high-priority physician directive to patient timeline.
- `GET /connection/doctor-patient/:id/directives`: Lists historical directives for patient.

### 6. Caregiver Privacy-Protected Portal (`/caregiver`)
- `GET /caregiver/my-patients`: Returns list of linked patients with safe/caution/critical badges.
- `GET /caregiver/patient-summary/:patientId`: Zero-leak daily schedule (dose times, colors, form, NO drug names).
- `POST /caregiver/remind-patient/:patientId`: Triggers real-time dose reminder notification via Socket.IO.

### 7. Longitudinal Analytics & Radar (`/analytics`)
- `GET /analytics/regimen-score`: Composite 0-100 Regimen Health Index.
- `GET /analytics/polypharmacy-trend`: 30-day longitudinal risk trajectory.
- `GET /analytics/drug-classes`: Pharmacological category distribution.
- `GET /analytics/acb-timeline`: 8-week retrospective anticholinergic burden trend.
- `GET /analytics/top-interactions`: Ranked active drug interaction pairs.
- `GET /analytics/cascade-risk-map`: Topological prescribing cascade risk analysis.

### 8. Symptoms & Cascade Interception (`/symptom`)
- `POST /symptom`: Logs patient symptom, cross-checks start dates of active drugs, flags cascades.
- `GET /symptom/history`: Returns chronological symptom logs with correlated offending drugs.

### 9. System Diagnostics (`/health`)
- `GET /health`: Returns service heartbeat, database connectivity, demo mode status, and uptime.

---

## Database Architecture

PolySafe uses **Prisma ORM** with **PostgreSQL**. The database schema is organized into user accounts, clinical records, and reference datasets:

```mermaid
erDiagram
    User ||--o| Patient : "has profile"
    User ||--o{ Medicine : "adds"
    User ||--o{ Connection : "participates in"
    Patient ||--o{ Medicine : "takes"
    Patient ||--o{ Symptom : "logs"
    Patient ||--o{ Connection : "authorizes"
    Patient ||--o{ InteractionFlag : "has"
    Patient ||--o{ DoseLog : "records"
    Medicine ||--o{ InteractionFlag : "medicineA"
    Medicine ||--o{ InteractionFlag : "medicineB"
    Medicine ||--o{ DoseLog : "scheduled for"
    Medicine ||--o{ Symptom : "possible cause"

    DrugInteractionReference {
        int id PK
        string drugAName
        string drugBName
        string severity
        string ddinterId
    }

    BurdenScore {
        int id PK
        string drugName UK
        int score
    }

    CascadeReference {
        int id PK
        string symptomKeyword
        string causingDrugCategory
        string description
    }

    HerbDrugReference {
        int id PK
        string herbName
        string drugName
        string severity
        string description
    }

    PillImprint {
        string id PK
        string imprintCode
        string drugName
        string strength
        string shape
        string color
    }

    DrugSideEffect {
        int id PK
        string rxcui
        string drugName
        string sideEffect
        float prr
        string severity
    }
```

---

## Installation & Quickstart

### Prerequisites
- **Node.js:** v18.0.0+ (v22+ LTS recommended)
- **npm:** v9.0.0+
- **PostgreSQL:** v14+ (Local instance or cloud hosted e.g. Neon, Supabase, Railway)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/meetchauhan17/PolySafe.git
cd PolySafe
```

### 2. Backend Configuration & Setup
```bash
cd backend
npm install

# Copy environment template
cp .env.example .env
```

Configure your `.env` file:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/polysafe?schema=public"
JWT_SECRET="your-secure-random-jwt-key"
PORT=5000
NODE_ENV="development"
DEMO_MODE="false"

# AI Credentials (Optional for local dev, fallback works automatically)
GROQ_API_KEY="gsk_your_groq_api_key_here"
GEMINI_API_KEY="your_gemini_api_key_here"

# Email Verification (Optional for local dev, console outputs OTP)
RESEND_API_KEY="re_your_resend_api_key_here"
```

Initialize database and seed clinical datasets:
```bash
# Push Prisma schema to PostgreSQL
npx prisma db push

# Seed DDInter (222k), ACB (567), Cascades (581), Herb-Drug (526), Pill Imprints (560), OFFSIDES (1.2M)
npm run seed

# Launch Backend API Server on http://localhost:5000
npm run dev
```

### 3. Frontend Setup
```bash
# In a separate terminal window
cd ../frontend
npm install

# Launch Vite Client Server on http://localhost:3000
npm run dev
```

Visit **http://localhost:3000** in your browser.

---

## Offline Resilience & Demo Mode

PolySafe is engineered for mission-critical reliability on stage, during live medical demonstrations, and in environments with zero internet connectivity:

### 1. Offline Client-Side Guest Demo Mode
Click **"Try the sample patient"** on the login page:
- **Zero Backend Calls:** Renders the complete patient dashboard, risk analysis, timeline swimlanes, 3D pill inspection, and interaction matrix using authenticated clinical mock fixtures in browser memory.
- **Offline Formulary Resolver:** Includes full offline local dictionary and instant symptom auto-fill.

### 2. Backend DEMO_MODE Flag
Set `DEMO_MODE="true"` in `backend/.env`:
- Intercepts all external API calls (OCR, RxNorm, Groq, Gemini) and responds with pre-validated deterministic clinical payloads in `< 10ms`.
- Fully documented in `backend/src/lib/demo.js` with zero silent failures.

### 3. Service Worker & Progressive Web App
- Core application bundles and fonts are precached via Service Worker.
- Complies with W3C Web App Manifest standards for home screen and desktop installation.

---

## Master Verification Audit

Run the automated test suite to verify end-to-end clinical logic and API endpoints:

```bash
cd backend
npm test
```

```
================================================================
      PolySafe Automated 18-Step Master System & API Audit      
================================================================
[x] [HEALTH CHECK] GET /health OK (API: true, DB: true, DEMO: false)
[x] [STEP 1/18] PASS: POST /auth/patient/signup-send-otp (OTP Dispatched)
[x] [STEP 2/18] PASS: POST /auth/patient/verify-signup-otp (User Created)
[x] [STEP 3/18] PASS: POST /auth/doctor/signup (Doctor Registered)
[x] [STEP 4/18] PASS: POST /auth/patient/login (Password Auth Verified)
[x] [STEP 5/18] PASS: POST /auth/doctor/login (Doctor Auth Verified)
[x] [STEP 6/18] PASS: GET /auth/me (RBAC Roles Enforced)
[x] [STEP 7/18] PASS: POST /patient/profile (Baseline Clinical Profile Saved)
[x] [STEP 8/18] PASS: POST /medicine (Warfarin 5mg - Harm Level L5 Assigned)
[x] [STEP 9/18] PASS: POST /medicine (Aspirin 81mg - Pairwise DDInter Flagged)
[x] [STEP 10/18] PASS: POST /medicine (Ginkgo Biloba - Herb-Drug Interaction Flagged)
[x] [STEP 11/18] PASS: GET /patient/home-summary (Harm Gauge Calculated)
[x] [STEP 12/18] PASS: GET /patient/timeline (Chronological Provenance Verified)
[x] [STEP 13/18] PASS: POST /medicine/identify-pill (Loose Pill Imprint Resolved)
[x] [STEP 14/18] PASS: POST /symptom (Symptom Logged & Prescribing Cascade Checked)
[x] [STEP 15/18] PASS: POST /connection/generate-code (6-Digit Share PIN Generated)
[x] [STEP 16/18] PASS: POST /connection/claim-code + approve (Doctor Paired & Approved)
[x] [STEP 17/18] PASS: GET /connection/mine + POST /connection/doctor-safety-check (Simulation OK)
[x] [STEP 18/18] PASS: DELETE /medicine/:id (Soft-Delete Provenance Preserved)
================================================================
                 18/18 tests passed (100% OK)                   
================================================================
```

### Specialized Verification Suites
- `node backend/scripts/verify-full-autofill.cjs`: Headless Puppeteer verification of Section 2 clinical auto-fill, symptom chip selection, and recommendation drawers (**3/3 passed**).
- `npm run test:resolver`: Validates the Indian 5-Layer Brand-to-Salt Resolver (**12/12 passed**).
- `node tests/test-safety-checks.js`: Validates the 5-Dimension Safety Engine (**8/8 passed**).
- `node tests/test-dose-tracking.js`: Validates dose scheduling, adherence streaks, and caregiver privacy (**6/6 passed**).
- `node tests/test-doctor-safety-check.js`: Validates pre-prescribing simulation checks (**3/3 passed**).
- `node tests/test-production-features.js`: Validates password resets, account deletion, and session revocation (**4/4 passed**).

---

## Clinical Evidence Base

1. **DDInter Reference Base:** Xiong et al., *DDInter: an online drug-drug interaction database with pharmacological mechanisms and safety levels*, Nucleic Acids Research, 2022. (222,383 records, 160,235 unique pairs).
2. **Anticholinergic Cognitive Burden (ACB) Scale:** Boustani M, Campbell N, Munger S, Maidment I, Fox C. *Impact of anticholinergics on the aging brain*, Aging & Mental Health, 2008. (567 scored drugs).
3. **Beers Criteria for Potentially Inappropriate Medication Use:** The 2023 American Geriatrics Society (AGS) Beers Criteria Update Expert Panel, Journal of the American Geriatrics Society, 2023.
4. **STOPP/START Criteria Version 3:** O'Mahony D, Cherubini A, Guiteras AR, et al., *European Geriatric Medicine*, 2023.
5. **Prescribing Cascade Identification Framework:** Rochon PA, Gurwitz JH. *The prescribing cascade revisited*, The Lancet, 2017.
6. **FDA OFFSIDES Post-Market Signal Database:** Tatonetti NP, Ye PP, Daneshjou R, Altman RB. *Data-driven prediction of drug effects and interactions*, Science Translational Medicine, 2012. (1.2M+ records).
7. **NLM RxNorm & RxNav:** US National Library of Medicine concept standardizer and RxCUI clinical formulation terminology.
8. **Indian Pharmacopoeia Commission & CDSCO:** National drug formulary references for Indian combination brands and fixed-dose formulations.

---

## Security, Privacy & Ethics

- **Decision-Support Boundary:** PolySafe operates as an informational decision-support and risk-alert layer. It does not replace independent clinical judgment, diagnosis, or prescription orders by licensed practitioners.
- **Zero-Leak Caregiver Privacy Shield:** Caregivers receive dose adherence telemetry and reminder nudges without disclosing confidential prescription names or diagnostic details.
- **Immediate Data Minimization:** Prescription label images uploaded for OCR/Vision extraction are processed in temporary memory and unlinked immediately after text parsing.
- **Cryptographic Access Control:** Role boundaries are enforced via signed JWTs, bcrypt password hashing, and route-level authorization guards.
- **Clinical Provenance:** Discontinued medications are soft-deleted (`removedAt`) rather than erased, preserving complete chronological medical provenance.

---

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
