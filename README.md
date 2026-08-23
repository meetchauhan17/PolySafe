<div align="center">

# PolySafe

### *AI-Powered Clinical Polypharmacy Risk, Prescribing Cascade & Drug-Drug Interaction Platform*

<p align="center">
  <strong>Harm does not come from a single bad prescription — it comes from the interactions nobody is watching together.</strong>
</p>

[![React 19](https://img.shields.io/badge/Frontend-React_19_|_Vite_8-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_22_|_Express_5-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Prisma ORM](https://img.shields.io/badge/Database-Prisma_ORM_|_PostgreSQL-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Socket.IO](https://img.shields.io/badge/Realtime-Socket.io_4.8-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://socket.io/)
[![Groq AI](https://img.shields.io/badge/LLM-Groq_LLaMA--3.3--70B-F55036?style=flat-square&logo=fastapi&logoColor=white)](https://groq.com/)
[![Google Gemini](https://img.shields.io/badge/Vision_OCR-Gemini_Flash_Multimodal-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![RxNorm](https://img.shields.io/badge/Standards-NLM_RxNorm_/_RxNav-005A9C?style=flat-square)](https://rxnav.nlm.nih.gov/)
[![Tests](https://img.shields.io/badge/Automated_Audit-18/18_Passed_(100%25)-008080?style=flat-square)](https://github.com/meetchauhan17/PolySafe)
[![License: MIT](https://img.shields.io/badge/License-MIT-gray?style=flat-square)](https://opensource.org/licenses/MIT)

<br/>

[Clinical Problem](#the-clinical-challenge) &bull; [Key Engines](#core-clinical-engines) &bull; [Architecture](#system-architecture) &bull; [Permission Matrix](#three-persona-permission-matrix) &bull; [API Reference](#api-endpoints--services) &bull; [Quickstart](#installation--setup) &bull; [Deployment](#deployment-configuration) &bull; [Evidence](#clinical-datasets--evidence-base)

---

</div>

## The Clinical Challenge

Standard pharmacy management and drug-checker utilities evaluate medications **two-at-a-time in static pairs**. In geriatric and multi-condition patients managing 5+ concurrent medications, isolated checks fail to catch the primary drivers of preventable adverse drug events (ADEs):

1. **Care Fragmentation:** Patients consult separate specialists (e.g., cardiologists, orthopedists, psychiatrists) who operate in disparate EHR silos without access to the full, active medication regimen.
2. **Prescribing Cascades:** An adverse drug effect (e.g., Amlodipine-induced peripheral ankle edema) is misdiagnosed as a new clinical condition, prompting a second unnecessary prescription (e.g., Furosemide).
3. **The Natural/OTC Blind Spot:** Herbal formulations (Turmeric, Ashwagandha, Ginkgo Biloba, St. John's Wort) and OTC analgesics are rarely disclosed during clinic visits, despite posing severe hemorrhage and metabolic risks when combined with anticoagulants.
4. **Cumulative Anticholinergic / Sedative Burden:** Multiple mild anticholinergic drugs compound into acute cognitive impairment, daytime somnolence, delirium, and fall-related fractures.

**PolySafe** provides a unified, continuous safety layer that aggregates prescriptions, herbal supplements, symptom logs, and physical pill imprints into a single intelligence timeline.

---

## Core Clinical Engines

```
                               ┌─────────────────────────────────────────┐
                               │        PolySafe Intelligence Hub        │
                               └────────────────────┬────────────────────┘
                                                    │
      ┌──────────────────────┬──────────────────────┼──────────────────────┬──────────────────────┐
      │                      │                      │                      │                      │
┌─────▼──────────────┐ ┌─────▼──────────────┐ ┌─────▼──────────────┐ ┌─────▼──────────────┐ ┌─────▼──────────────┐
│ 1. DDInter Matrix  │ │ 2. ACB Burden      │ │ 3. Cascade Engine  │ │ 4. 5-Layer Formulary│ │ 5. Vision / Imprint│
│ 222K Curated Pairs │ │ Cognitive Load 0-3+│ │ Symptom Correlation│ │ Indian Salt Mapping │ │ Gemini & Groq OCR  │
└────────────────────┘ └────────────────────┘ └────────────────────┘ └────────────────────┘ └────────────────────┘
                                                    │
                                      ┌─────────────▼─────────────┐
                                      │   Dual-Persona LLM Core   │
                                      │ • Plain Patient Language  │
                                      │ • Formal Clinical Summary │
                                      │ • 3 Doctor Action Items   │
                                      └───────────────────────────┘
```

### 1. High-Precision Drug-Drug Interaction (DDInter 2024)
- Leverages the complete **DDInter Reference Dataset (222,385 validated pairs)** with bidirectional indexing.
- Distinguishes 4 distinct clinical risk levels: `Contraindicated`, `Major`, `Moderate`, `Minor`, and `Unknown (Documented but Unclassified)`.
- Explicitly flags when an interaction is uncatalogued (`notInDataset: true`) rather than misrepresenting absence of evidence as clinical safety.

### 2. Cumulative Anticholinergic Cognitive Burden (ACB Scale)
- Scores regimens against the validated Anticholinergic Cognitive Burden scale (0 to 6+ cumulative index).
- Displays real-time risk tiers (`0 = Normal`, `1–2 = Moderate`, `3+ = Critical`) to prevent acute delirium and fall hazards in geriatric populations.

### 3. Prescribing Cascade Correlation Detector
- Evaluates newly logged symptoms against previous medication start dates and documented cascade rules from the Canadian Deprescribing Network (CaDeN).
- Flags potential drug-induced side effects before they are misdiagnosed and treated with redundant secondary therapies.

### 4. Botanical & OTC Supplement Cross-Checker
- Built-in clinical monograph knowledge base cross-referencing natural supplements (Ginkgo Biloba, Turmeric/Curcumin, St. John's Wort, Ashwagandha, Garlic extract, Ginseng) against pharmaceutical agents.
- Visually demarcated with distinct botanical badges and mechanism summaries.

### 5. WHO/NCI 5-Tier Medication Harm Level Matrix
- Categorizes all active drugs into Tier L1 through Tier L5 based on therapeutic index, narrow safety margins, organ clearance risks, and WHO essential medicine guidelines.
- Computes overall regimen risk scores and identifies peak risk agents on the patient dashboard.

### 6. OFFSIDES FDA Adverse Drug Reaction Explorer
- Integrates 7,330 curated adverse reaction signals from the UCSF/FDA OFFSIDES pharmacovigilance database with Proportional Reporting Ratios ($\text{PRR} \ge 2.0$).
- Provides patients and physicians with statistical post-market adverse reaction profiles for active regimens.

### 7. Indian Formulary 5-Layer Multi-Salt Resolver
- Resolves complex Indian branded combination formulations (e.g., *Augmentin 625*, *Pan-D*, *Naxdom 500*, *Combiflam*, *Zerodol SP*, *Stamlo Beta*, *Telma H*) down to exact active generic salts via a 5-layer cascading architecture:
  - **Layer 1:** Curated Indian Brand Dictionary (instant local resolution).
  - **Layer 2:** On-Disk Chemical Salt Cache.
  - **Layer 3:** NIH NLM RxNorm / RxNav Concept Standardization.
  - **Layer 4:** Fuzzy DDInter String Matcher.
  - **Layer 5:** Gemini Flash & Groq LLM Decomposer.

### 8. 4-System Organ Toxicity Radar
- Quantifies organ stress across **Renal Clearance**, **Hepatic Metabolism**, **Cardiovascular Strain**, and **CNS/Cognitive Load**.
- Rendered on the Doctor Dashboard to guide personalized clinical dosage adjustments.

### 9. Multi-Engine Prescription & Packaging Vision OCR
- **Stage 1:** Google Gemini Vision Multimodal extraction from packaging, blister strips, and handwritten prescription slips.
- **Stage 2:** RxNorm validation and synonym reconciliation.
- **Stage 3:** Local offline Tesseract OCR fallback.
- **Stage 4:** Cloud OCR.space secondary fallback.
- **Stage 5:** Manual input review with automated confidence indicators.

### 10. Multi-Layer AI Loose Pill Imprint Identifier
- Identifies stamped tablet and capsule codes (e.g., `L484`, `AN 627`, `TEVA 3109`, `M367`, `K 56`) using local reference catalogs with cascading fallback to Groq LLaMA-3.3-70B, Google Gemini Flash, and NLM RxNav REST APIs.
- Auto-caches resolved imprints to the database for subsequent 0ms lookups.

---

## Three-Persona Permission Matrix

PolySafe enforces a zero-trust, patient-consented access control model across three discrete system roles:

| Data & Clinical Capabilities | Patient | Doctor (Connected) | Caregiver (Connected) |
| :--- | :---: | :---: | :---: |
| **Active Medication Timeline** | Full Read / Write | Full Read-Only | Restricted (No Drug Names) |
| **Risk Explanations** | Plain Patient Language | Clinical + Plain Rationale | Hidden |
| **Safety Status (Safe / Caution / Critical)** | Yes | Yes | Yes |
| **Daily Dosage & Timing Schedule** | Full Details | Full Details | Time & Shape / Color Only |
| **Symptom Logging & Cascade History** | Full Access | Full Access | Hidden |
| **Pre-Prescribing Safety Simulator** | N/A | Full Simulation Access | N/A |
| **STOPP/START Deprescribing Assistant** | N/A | Full Access | N/A |
| **Atomic Drug Substitution** | N/A | Authorized Write | N/A |
| **Clinical Directive Issuance** | N/A | Authorized Write | N/A |
| **Access Revocation** | Instant 1-Click | Cannot Manage Permissions | Cannot Manage Permissions |

---

## System Architecture

```
+-----------------------------------------------------------------------------+
|                           CLIENT LAYER (React 19 + Vite 8)                  |
|  * Industrial Skeuomorphic Tokenized UI     * TanStack React Query v5       |
|  * Recharts Organ Radar & ACB Trajectories   * Framer Motion Animations     |
|  * Real-time Socket.IO State Listeners      * BFCache Session Protection    |
+--------------------------------------┬--------------------------------------+
                                       │ HTTP REST / WebSocket JSON
+--------------------------------------▼--------------------------------------+
|                     SERVER API LAYER (Node.js 22 + Express 5)               |
|  * JWT Auth & Brute-Force Rate Limiting     * Socket.IO Room Broadcaster    |
|  * DDInter 222K Interaction Evaluator       * ACB Burden Calculator         |
|  * Prescribing Cascade Correlator           * 5-Layer Indian Drug Resolver  |
|  * 4-System Organ Toxicity Modeler          * Dual LLM Explanation Core     |
+--------------------------------------┬--------------------------------------+
                                       │ Prisma ORM Client
+--------------------------------------▼--------------------------------------+
|                       DATA PERSISTENCE (PostgreSQL / SQLite)                |
|  * Users & Role Profiles (Patient / Doctor / Caregiver)                     |
|  * Active & Discontinued Medications (Soft-Delete Provenance)               |
|  * Interaction Flags, Symptoms, Connections, and Directives                 |
|  * Reference: DDInter, ACB Scores, Cascades, Herbs, Imprints, OFFSIDES      |
+-----------------------------------------------------------------------------+
```

---

## API Endpoints & Services

### Authentication (`/auth`)
- `POST /auth/check-email` &mdash; Validates account existence for role-based authentication branching.
- `POST /auth/patient/signup-send-otp` &mdash; Dispatches 6-digit verification code via Resend.
- `POST /auth/patient/verify-signup-otp` &mdash; Verifies OTP, provisions patient account, and issues signed JWT.
- `POST /auth/patient/login` &mdash; Password login with bcrypt verification and 5-attempt brute-force lockout.
- `POST /auth/doctor/signup` &mdash; Direct doctor registration with medical license credential validation.
- `POST /auth/doctor/login` &mdash; Doctor password authentication.
- `GET /auth/me` &mdash; Returns authenticated profile, role, and active permissions.

### Medication Management (`/medicine`)
- `GET /medicine` &mdash; Retrieves active patient medication regimen.
- `POST /medicine` &mdash; Adds new prescription/OTC/herbal drug, computes WHO harm tier, standardizes RxNorm code, and triggers asynchronous DDInter + ACB calculation.
- `GET /medicine/search?q=:query` &mdash; Real-time 5-layer brand-to-salt autocomplete.
- `GET /medicine/:id/resolve` &mdash; Detailed AI salt decomposition and food instruction metadata.
- `GET /medicine/:id/sideeffects` &mdash; FDA OFFSIDES adverse reaction profile with PRR scores.
- `DELETE /medicine/:id` &mdash; Soft-deletes medication to preserve clinical provenance on the timeline.
- `POST /medicine/identify-pill` &mdash; Loose pill imprint lookup via OCR or code input with AI fallback.

### Patient Hub & Analytics (`/patient`)
- `GET /patient/home-summary` &mdash; Comprehensive dashboard payload (regimen harm index, peak risk agent, active flags, clinical directives).
- `GET /patient/timeline` &mdash; Chronological medication lifecycle history with doctor attribution.
- `POST /patient/profile` &mdash; Updates age, chronic conditions, and drug allergies.

### Clinical Connections & Doctor Portal (`/connection`)
- `POST /connection/generate-code` &mdash; Generates 6-digit numerical share PIN and QR code data URL (24-hour TTL).
- `POST /connection/claim-code` &mdash; Doctor claims patient PIN.
- `POST /connection/:id/approve` &mdash; Patient grants access to doctor or caregiver.
- `GET /connection/doctor-patient/:id/clinical-summary` &mdash; Complete clinical summary with 4-system organ toxicity radar.
- `POST /connection/doctor-safety-check` &mdash; Pre-prescribing simulation engine evaluating hypothetical regimens.
- `POST /connection/doctor-substitute` &mdash; Atomic 1-click drug replacement (discontinue high-risk + prescribe alternative).
- `POST /connection/doctor-deprescribe` &mdash; 1-click geriatric deprescribing adhering to Beers 2023 / STOPP criteria.
- `POST /connection/directive` &mdash; Issues doctor directive with instant real-time patient notification.
- `POST /connection/:id/revoke` &mdash; Immediately revokes practitioner or caregiver data access.

### Caregiver Portal (`/caregiver`)
- `GET /caregiver/patients` &mdash; Lists all linked patients with switcher metadata.
- `GET /caregiver/patient-summary/:id` &mdash; Redacted safety dashboard (schedule, adherence, and risk status).

---

## Installation & Setup

### Prerequisites
- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **npm:** v9.0.0 or higher
- **PostgreSQL** or **SQLite** (default local development)
- **Git**

### 1. Clone Repository
```bash
git clone https://github.com/meetchauhan17/PolySafe.git
cd PolySafe
```

### 2. Backend Configuration & Launch
```bash
cd backend
npm install

# Configure Environment Variables
cp .env.example .env

# Initialize Database Schema & Run Migrations
npx prisma db push

# Seed Clinical Datasets (DDInter, ACB Scores, Cascades, Herb-Drug, Imprints, OFFSIDES)
npm run seed

# Launch Backend API Server (http://localhost:5000)
npm start
```

### 3. Frontend Configuration & Launch
```bash
# In a separate terminal
cd ../frontend
npm install

# Start Vite Development Server (http://localhost:3000)
npm run dev
```

---

## Environment Variables

### Backend (`/backend/.env`)
```ini
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db" # or "postgresql://user:password@localhost:5432/polysafe"
JWT_SECRET="your_production_signed_jwt_secret_key"
RESEND_API_KEY="re_your_resend_api_key"
GROQ_API_KEY="gsk_your_groq_api_key"
GEMINI_API_KEY="your_google_gemini_flash_api_key"
OCR_SPACE_API_KEY="your_ocr_space_api_key"
DEMO_MODE=false
```

### Frontend (`/frontend/.env`)
```ini
VITE_API_URL="http://localhost:5000"
```

---

## Automated Verification Audit

PolySafe includes an automated 18-step master test suite covering the entire API lifecycle:

```bash
cd backend
npm test
```

### Audit Results: 18 / 18 Tests Passed (100%)
- `[STEP 1/18]` POST /auth/patient/signup-send-otp (OTP Generation & Dispatch)
- `[STEP 2/18]` POST /auth/patient/verify-signup-otp (User Provisioning & Token Issue)
- `[STEP 3/18]` POST /auth/doctor/signup (Doctor Credential Registration)
- `[STEP 4/18]` POST /auth/patient/login (Password Authentication without OTP)
- `[STEP 5/18]` POST /auth/doctor/login (Doctor Password Login)
- `[STEP 6/18]` GET /auth/me (RBAC Authorization Verification)
- `[STEP 7/18]` POST /patient/profile (Clinical Baseline Setup)
- `[STEP 8/18]` POST /medicine (Warfarin 5mg &mdash; L5 Critical Harm Classification)
- `[STEP 9/18]` POST /medicine (Aspirin 81mg &mdash; Pairwise DDInter Flag Triggered)
- `[STEP 10/18]` POST /medicine (Ginkgo Biloba &mdash; Herb-Drug Interaction Flag)
- `[STEP 11/18]` GET /patient/home-summary (Harm Gauge & Peak Risk Calculation)
- `[STEP 12/18]` GET /patient/timeline (Chronological Provenance Tracking)
- `[STEP 13/18]` POST /medicine/identify-pill (Loose Pill Imprint Resolution)
- `[STEP 14/18]` POST /symptom (Symptom Logging & Prescribing Cascade Check)
- `[STEP 15/18]` POST /connection/generate-code (6-Digit PIN Generation)
- `[STEP 16/18]` POST /connection/claim-code + approve (Doctor Connection Approval)
- `[STEP 17/18]` GET /connection/mine + POST /connection/doctor-safety-check (Simulation Engine)
- `[STEP 18/18]` DELETE /medicine/:id (Soft-Delete Lifecycle Verification)

---

## Deployment Configuration

### Backend on Render
The repository includes a root `render.yaml` blueprint:
1. Connect your GitHub repository to [Render](https://render.com).
2. Select **New &rarr; Blueprint** and link `render.yaml`.
3. Render automatically provisions the PostgreSQL database, applies Prisma migrations, seeds reference datasets, and starts the web service.

### Frontend on Vercel
1. Import the repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Vite`.
4. Add Environment Variable:
   - `VITE_API_URL` = `https://your-polysafe-backend.onrender.com`
5. Deploy (Vercel automatically applies `frontend/vercel.json` SPA rewrite rules).

---

## Clinical Datasets & Evidence Base

| Clinical Domain | Reference Dataset / Standard | Clinical Mechanism & Function |
| :--- | :--- | :--- |
| **Drug-Drug Interactions** | **DDInter 2024 (222,385 Pairs)** | Validated bidirectional pairwise interaction severities |
| **Drug Concept Standardization** | **NLM RxNorm & RxNav REST API** | Standardized RxCUI concept mapping & synonym resolution |
| **Anticholinergic Burden** | **ACB Cognitive Scale (Boustani et al.)** | Cumulative anticholinergic load scoring (0, 1, 2, 3+) |
| **Botanical Cross-Reactivity** | **MSKCC & Natural Medicines Database** | Herb-drug interaction mechanisms & bleeding risks |
| **Prescribing Cascades** | **Canadian Deprescribing Network (CaDeN)** | Drug-induced symptom correlation rules |
| **Geriatric Pharmacotherapy** | **Beers Criteria 2023 / STOPP-START v3** | High-risk medication identification for deprescribing |
| **Adverse Drug Reactions** | **FDA OFFSIDES Pharmacovigilance (NCATS)** | Post-market adverse reaction signals with $\text{PRR} \ge 2.0$ |

---

## Security, Privacy & Medical Ethics

- **Non-Diagnostic Informational Buffer:** PolySafe operates strictly as a safety information layer. Every patient report includes explicit disclaimers emphasizing that findings require clinical verification by licensed healthcare practitioners.
- **Immediate Data Minimization:** Prescription label images uploaded for OCR processing are parsed in temporary memory and immediately unlinked and removed from disk upon extraction completion.
- **Zero-Trust Access Boundaries:** Role isolation between Patients, Physicians, and Caregivers is enforced cryptographically using signed JWTs and backend route-level RBAC guards.
- **Provenance Integrity:** Discontinued medications are never erased from patient history; they receive soft-delete timestamps (`removedAt`) to maintain comprehensive clinical timelines.

---

## Project Information

- **Lead Developer:** Meet Chauhan ([@meetchauhan17](https://github.com/meetchauhan17))
- **Repository:** [https://github.com/meetchauhan17/PolySafe](https://github.com/meetchauhan17/PolySafe)
- **License:** MIT License &mdash; Open for clinical research and healthcare innovation.
