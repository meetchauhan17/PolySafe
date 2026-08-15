# 🛡️ POLYSAFE — THE DEFINITIVE A-TO-Z MASTER REFERENCE MANUAL
**AI-Powered Polypharmacy Risk Engine, Prescribing Cascade Detector & Consent-Based Medication Timeline**
*IEEE WIE ILS 2026 National Hackathon | Track 2: HealthTech | Problem Statement #4*

---

## 📑 TABLE OF CONTENTS
1. [EXECUTIVE SUMMARY & PROBLEM STATEMENT](#1-executive-summary--problem-statement)
2. [THE CLINICAL PROBLEM & REAL-WORLD EVIDENCE](#2-the-clinical-problem--real-world-evidence)
3. [THE FOUR CORE INNOVATIONS (ONE UNIFIED ENGINE)](#3-the-four-core-innovations-one-unified-engine)
4. [COMPLETE SYSTEM ARCHITECTURE & TECH STACK](#4-complete-system-architecture--tech-stack)
5. [COMPLETE REPOSITORY & FOLDER STRUCTURE (FILE-BY-FILE CODE BREAKDOWN)](#5-complete-repository--folder-structure-file-by-file-code-breakdown)
6. [DATA MODEL & DATABASE SCHEMA (PRISMA POSTGRESQL)](#6-data-model--database-schema-prisma-postgresql)
7. [COMPLETE API REFERENCE (ALL ENDPOINTS & SCHEMAS)](#7-complete-api-reference-all-endpoints--schemas)
8. [AI & LLM ENGINE (GROQ LLAMA 3.3 + PROMPTS + GUARDRAILS)](#8-ai--llm-engine-groq-llama-33--prompts--guardrails)
9. [OCR PRESCRIPTION SCANNER & RXNORM STANDARDIZATION](#9-ocr-prescription-scanner--rxnorm-standardization)
10. [PERMISSION MATRIX & CONSENT ARCHITECTURE (RBAC)](#10-permission-matrix--consent-architecture-rbac)
11. [FRONTEND DESIGN SYSTEM & 13-PAGE UI SPECIFICATION](#11-frontend-design-system--13-page-ui-specification)
12. [DEMO_MODE & LIVE DEMO ZERO-NETWORK RESILIENCE](#12-demo_mode--live-demo-zero-network-resilience)
13. [LOCAL DEVELOPMENT & SEEDING GUIDE](#13-local-development--seeding-guide)
14. [PRODUCTION DEPLOYMENT (RENDER + VERCEL)](#14-production-deployment-render--vercel)
15. [LIVE DEMO PITCH SCRIPT & JUDGE PRESENTATION GUIDE](#15-live-demo-pitch-script--judge-presentation-guide)
16. [ANTICIPATED TOUGH QUESTIONS & BULLETPROOF ANSWERS](#16-anticipated-tough-questions--bulletproof-answers)
17. [POST-HACKATHON ROADMAP & ABDM/FHIR INTEGRATION](#17-post-hackathon-roadmap--abdm-fhir-integration)

---

## 1. EXECUTIVE SUMMARY & PROBLEM STATEMENT

### The Hackathon Problem Statement
> *"Build an AI system that detects harmful drug interactions from multiple prescriptions and explains risks in simple language to doctors and patients."*

### Why Existing Solutions Fail
Traditional drug interaction checkers (e.g. WebMD, Drugs.com, Medscape) only evaluate medications **two at a time in isolation**. They assume a static list of medications entered all at once. In the real world, medical harm in polypharmacy patients is caused by what **nobody is watching across time and multiple providers**.

### PolySafe's Value Proposition
PolySafe is a **consent-based, timeline-first polypharmacy safety platform** that watches four distinct clinical gaps simultaneously:
1. **Cross-Doctor Fragmentation:** Prescriptions added months apart by different specialists without shared EHR context.
2. **Prescribing Cascades:** Drug side effects misdiagnosed as new illnesses, triggering unnecessary follow-up prescriptions.
3. **The Herbal / OTC Blind Spot:** Ayurvedic remedies, herbal supplements, and OTC drugs that patients never disclose to physicians.
4. **Cumulative Anticholinergic / Sedative Burden (ACB):** Sub-threshold sedative loads that look harmless drug-by-drug but combine into critical delirium and fall risks.

Every flagged risk is explained **twice by Groq Llama-3.3**:
- **Clinical Summary:** Pharmacological mechanism, CYP enzyme pathways, and actionable guidance for clinicians.
- **Plain-Language Summary:** Calibrated, non-alarmist explanation referencing the patient's age and conditions with mandatory non-diagnostic framing.

---

## 2. THE CLINICAL PROBLEM & REAL-WORLD EVIDENCE

### The Polypharmacy Crisis in Numbers
- **45%** of adults aged 65 and older take **5 or more** prescription medications daily.
- **20%** of elderly patients take **10 or more** medications.
- Hospital readmission risk increases exponentially with medication count: **~10% for 1–2 drugs** up to **38% for 8+ drugs**.
- **Under 5%** of drug-induced symptoms (prescribing cascades) are correctly attributed to the offending drug by prescribing physicians.

### The Real-World Clinical Story
An elderly patient (Mrs. Sharma, age 72) visits a cardiologist and is prescribed **Amlodipine 5mg** for hypertension. Six weeks later, she experiences bilateral ankle swelling (peripheral edema) — a well-documented adverse effect of calcium channel blockers. 

Instead of recognizing the side effect, a different general practitioner assumes it is congestive fluid retention and prescribes **Furosemide 20mg** (a loop diuretic). The diuretic causes dizziness, orthostatic hypotension, and electrolyte loss. To manage her dizziness and sleep issues, she buys an OTC antihistamine. Two weeks later, she falls and suffers a hip fracture.

**PolySafe breaks this cascade before the second drug is prescribed.**

---

## 3. THE FOUR CORE INNOVATIONS (ONE UNIFIED ENGINE)

```
                                  ┌─────────────────────────────────────────┐
                                  │      PolySafe Unified Safety Engine     │
                                  └────────────────────┬────────────────────┘
                                                       │
         ┌─────────────────────────┬───────────────────┴───────────────────┬─────────────────────────┐
         │                         │                                       │                         │
┌────────▼──────────────┐ ┌────────▼──────────────┐               ┌────────▼──────────────┐ ┌────────▼──────────────┐
│  1. Cross-Doctor      │ │  2. Prescribing       │               │  3. Herbal / OTC      │ │  4. Cumulative        │
│     Timeline          │ │     Cascade Detector  │               │     Blind-Spot Check  │ │     ACB Burden Index  │
├───────────────────────┤ ├───────────────────────┤               ├───────────────────────┤ ├───────────────────────┤
│ • Chronological feed  │ │ • Natural language    │               │ • Dedicated 3-way     │ │ • 0–3+ ACB scale      │
│ • Source attribution  │ │   symptom logger      │               │   type selector       │ │ • Sums sedative &     │
│   (Dr. X / Self)      │ │ • Date cross-ref      │               │ • Clinical herb-drug  │ │   anticholinergic     │
│ • Consent-based RBAC  │ │ • Cascade knowledge   │               │   reference registry  │ │   load across drugs   │
└───────────────────────┘ └───────────────────────┘               └───────────────────────┘ └───────────────────────┘
                                                       │
                                           ┌───────────▼───────────┐
                                           │  Groq Llama-3.3 LLM   │
                                           ├───────────────────────┤
                                           │ • Clinical One-Liner  │
                                           │ • Plain Patient Text  │
                                           └───────────────────────┘
```

### Innovation 1: Cross-Doctor Medication Timeline
- Maintains an immutable, timestamped record of every medication addition.
- Attaches provenance metadata: prescribed by Dr. Mehta (Cardiology), Dr. Rao (GP), or self-logged (Herbal/OTC).
- Visual timeline with colored dot markers (Teal = Safe, Crimson = Flagged) and instant flag associations.

### Innovation 2: Prescribing Cascade Detector (Symptom Origin Checker)
- Patients log daily symptoms in plain text (e.g. *"my ankles have been swelling up since last Tuesday"*).
- The engine searches a curated medical registry of **prescribing cascade pairs** (sourced from Rochon & Gurwitz literature and the Canadian Deprescribing Network).
- Filters the patient's medication list: only considers drugs added **before** the symptom start date.
- Outputs calm, non-accusatory advice: *"Leg swelling is a known side effect of Amlodipine (added Jan 12). Ask your doctor if this medicine could be related before starting a new treatment."*

### Innovation 3: Herbal / OTC Blind-Spot Checker
- Features an explicit 3-way toggle on medication input: **Prescription | OTC | Herbal**.
- Herbal medications are evaluated against both the DDInter chemical dataset and a dedicated **HerbDrugReference** database (Turmeric, St. John's Wort, Ginkgo Biloba, Ashwagandha, Garlic, Ginseng, Ginger, etc.).
- Catches critical interactions that standard electronic medical record (EMR) systems miss (e.g. Turmeric potentiation of Warfarin/Aspirin bleeding).

### Innovation 4: Cumulative Anticholinergic / Sedative Burden (ACB) Index
- Standard checkers miss drug pairs that have no direct chemical interaction but compound sedative toxicity.
- Scores every active drug on the validated **Anticholinergic Cognitive Burden (ACB) 0–3 scale**:
  - `0`: No anticholinergic/sedative effect
  - `1`: Mild burden (e.g. Atenolol, Ranitidine, Furosemide)
  - `2`: Moderate burden (e.g. Belladonna, Baclofen)
  - `3`: Severe burden (e.g. Amitriptyline, Diphenhydramine, Hydroxyzine, Oxybutynin)
- Calculates cumulative sum across the patient's entire active list:
  - **0:** Normal (Low risk)
  - **1–2:** Moderate (Caution — monitor for drowsiness)
  - **3+:** Critical (High risk of falls, delirium, and cognitive decline)

---

## 4. COMPLETE SYSTEM ARCHITECTURE & TECH STACK

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 FRONTEND (React 19 + Vite 8)                           │
│  Tailwind CSS v4 (Design System) · TanStack React Query v5 · Socket.IO Client · Axios  │
└───────────────────────────────────────────▲────────────────────────────────────────────┘
                                            │ HTTP / WebSocket (Port 5000)
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│                             BACKEND API (Node.js + Express 5)                          │
│                                                                                        │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────────────┐  │
│  │   Auth Middleware    │  │  Interaction Engine  │  │  Socket.IO Event Dispatcher  │  │
│  │  (JWT + RBAC + OTP)  │  │  (DDInter + ACB +    │  │  (patient-${userId} rooms)   │  │
│  │                      │  │   Herb-Drug Cascade) │  │                              │  │
│  └──────────────────────┘  └──────────┬───────────┘  └──────────────────────────────┘  │
│                                       │                                                │
│  ┌────────────────────────────────────┼─────────────────────────────────────────────┐  │
│  │ External Service Integrations      │                                             │  │
│  │ • Groq API (Llama-3.3-70b) ────────┤ Dual Clinical / Plain Explanations          │  │
│  │ • NLM RxNorm / RxNav API ──────────┤ RxCUI Drug Name Standardization             │  │
│  │ • OCR.space Engine 2 ──────────────┤ Prescription Label Image Extraction         │  │
│  │ • Demo Fallback Mock Layer ────────┤ Offline / Venue Wi-Fi Resilience            │  │
│  └────────────────────────────────────┴─────────────────────────────────────────────┘  │
└───────────────────────────────────────────▲────────────────────────────────────────────┘
                                            │ Prisma ORM Client
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│                             POSTGRESQL RELATIONAL DATABASE                             │
│  User · Patient · Medicine · InteractionFlag · Symptom · Connection · Seed Datasets    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. COMPLETE REPOSITORY & FOLDER STRUCTURE (FILE-BY-FILE CODE BREAKDOWN)

### 📂 Directory Tree Overview
```
PolySafe/
├── README.md                           # Quickstart, local setup & deployment overview
├── POLYSAFE_COMPLETE_ATOZ_MANUAL.md    # Master A-to-Z reference manual (this document)
├── PolySafe_Master_Project.md          # Hackathon problem statement & product requirements
├── render.yaml                         # 1-Click Render Blueprint specification (Backend + DB)
├── .gitignore                          # Root version control exclusion rules
│
├── backend/                            # Node.js + Express 5 API Server & Prisma ORM
│   ├── .env                            # Active environment variables (keys, DB connection)
│   ├── .env.example                    # Template environment variables with documentation
│   ├── package.json                    # Backend scripts, Prisma hooks, and dependencies
│   ├── package-lock.json               # Deterministic dependency tree lockfile
│   │
│   ├── data/                           # Clinical Reference Datasets & Seed Files
│   │   ├── ddinter.csv                 # 240,000+ Drug-Drug Interaction records from DDInter
│   │   ├── ddinter_downloads_code_*.csv# Split DDInter category CSV tables (A, B, D, H, L, P, R, V)
│   │   ├── burden-scores.json          # 0–3 ACB Anticholinergic/Sedative score mappings
│   │   ├── cascade-references.json     # Documented symptom-to-drug prescribing cascade pairs
│   │   └── herb-drug-interactions.json # Clinical herb-to-pharmaceutical interaction registries
│   │
│   ├── prisma/                         # Database Modeling & Automated Seeding
│   │   ├── schema.prisma               # Prisma relational schema (PostgreSQL / SQLite)
│   │   ├── seed.js                     # Unified master seeder (runs all 4 seed scripts)
│   │   ├── seed-burden.js              # Seeder for BurdenScore table
│   │   ├── seed-cascade.js             # Seeder for CascadeReference table
│   │   └── seed-herb-drug.js           # Seeder for HerbDrugReference table
│   │
│   ├── src/                            # Backend Application Source Code
│   │   ├── index.js                    # Express app initialization, CORS, Socket.IO & routing
│   │   │
│   │   ├── lib/                        # Core Utilities & Shared Singletons
│   │   │   ├── prisma.js               # Global PrismaClient singleton instance
│   │   │   ├── jwt.js                  # JWT token signing, decoding, and verification
│   │   │   ├── otpStore.js             # In-memory OTP storage with 10-minute expiration
│   │   │   └── demo.js                 # Central DEMO_MODE mock layer for offline resilience
│   │   │
│   │   ├── middleware/                 # Request Interceptors & Security
│   │   │   └── auth.js                 # JWT bearer extraction & requireRole() RBAC guards
│   │   │
│   │   ├── routes/                     # REST API Route Handlers
│   │   │   ├── auth.js                 # Phone OTP login, Doctor signup/login, Firebase hooks
│   │   │   ├── patient.js              # Profile intake, Home summary, Medication timeline
│   │   │   ├── medicine.js             # Add medicine, RxNorm standardizer, Async Socket.IO check
│   │   │   ├── scan.js                 # Multipart OCR image upload & heuristic label parser
│   │   │   ├── interactionFlag.js      # Flag detail retrieval with live ACB recalculation
│   │   │   ├── symptom.js              # Symptom logger & prescribing cascade matching
│   │   │   ├── connection.js           # Doctor QR generation, code claim, approval, revoke
│   │   │   └── caregiver.js            # Caregiver-restricted summary (status + generic schedule)
│   │   │
│   │   └── services/                   # Clinical Computation & AI Engines
│   │       ├── interactionLookup.js    # Bidirectional A-B / B-A lookup in DDInter dataset
│   │       ├── burdenIndex.js          # Cumulative ACB burden index sum calculation
│   │       └── explanationGenerator.js # Groq Llama-3.3 prompt execution with 8s timeout
│   │
│   └── tmp/                            # Temporary upload directory for OCR files (auto-deleted)
│
└── frontend/                           # React 19 + Vite 8 SPA Client Application
    ├── index.html                      # HTML entrypoint with Fraunces & Source Sans 3 Google Fonts
    ├── package.json                    # Frontend dependencies (React 19, Tailwind v4, TanStack Query)
    ├── package-lock.json               # Deterministic dependency tree lockfile
    ├── vite.config.js                  # Vite configuration + API reverse proxy table
    ├── vercel.json                     # Vercel deployment rewrite rules for SPA client routing
    ├── .oxlintrc.json                  # Fast Oxlint code linter configuration
    │
    └── src/                            # Frontend Application Source Code
        ├── main.jsx                    # React DOM root render + global axios baseURL setup
        ├── App.jsx                     # TanStack QueryClientProvider + React Router route map
        ├── App.css                     # Component animations, pulsing dots, and modal transitions
        ├── index.css                   # Tailwind CSS v4 design tokens, custom buttons, card styles
        │
        ├── api/                        # Centralized Axios API Clients
        │   └── auth.js                 # authApi and patientApi HTTP request wrappers
        │
        ├── components/                 # Reusable UI Components
        │   └── Navbar.jsx              # Responsive navigation bar with role links and active pills
        │
        ├── lib/                        # Client Utilities
        │   └── jwt.js                  # Client-side JWT parser and role helper
        │
        └── pages/                      # 12 Primary Application View Pages
            ├── LoginPage.jsx           # Dual Patient (Phone+OTP) & Doctor (Email+Pass) login
            ├── OnboardingPage.jsx      # Patient age, chronic conditions, and allergy intake
            ├── HomePage.jsx            # Safety hero card, today's schedule, flags, 4-grid nav
            ├── AddMedicinePage.jsx     # OCR camera/upload, RxNorm lookup, Socket.IO live modal
            ├── RiskAnalysisPage.jsx    # Flag detail, clinical/plain dual text, ACB burden meter
            ├── LogSymptomPage.jsx      # Natural language symptom logging with date picker
            ├── SymptomResultPage.jsx   # Prescribing cascade match card with root cause advice
            ├── TimelinePage.jsx        # Vertical #E0824B timeline with doctor provenance tags
            ├── DoctorSharePage.jsx     # Patient 6-digit code generator + base64 QR code share view
            ├── DoctorDashboardPage.jsx # Doctor claim code input + patient list + read-only timeline
            ├── CaregiverViewPage.jsx   # Caregiver pending invites + status-only hero card
            └── ConnectedPeoplePage.jsx # Patient connection audit list with instant revoke buttons
```

---

### 🔍 Deep Dive: What Each File Does & Code Architecture

#### 1. Backend Core & Middleware

- **`backend/src/index.js`**:
  Initializes Express 5, creates an HTTP server, binds Socket.IO with CORS `*`, mounts all 8 route modules (`/auth`, `/patient`, `/medicine`, `/interaction-flag`, `/symptom`, `/connection`, `/caregiver`), attaches the global error handler, and configures the port listener (`process.env.PORT || 5000`).

- **`backend/src/middleware/auth.js`**:
  Extracts the `Authorization: Bearer <token>` header, verifies the signature with `JWT_SECRET`, decodes `{ userId, role }` onto `req.user`, and exposes `requireRole(['PATIENT', 'DOCTOR', 'CAREGIVER'])` for endpoint protection.

- **`backend/src/lib/jwt.js`**:
  Signs tokens using `jsonwebtoken` with configurable `JWT_EXPIRES_IN` (default 7 days) and validates tokens with fail-fast error throwing if `JWT_SECRET` is missing.

- **`backend/src/lib/otpStore.js`**:
  In-memory OTP store tracking `{ code, expiresAt, attempts }` per phone number with automatic 10-minute expiry and max 3 verification attempts before lockout.

- **`backend/src/lib/demo.js`**:
  Central mock layer. When `DEMO_MODE=true`, provides pre-written fixture data for OCR (`Warfarin 5mg` sample prescription), RxNorm (static mapping table for 10 common drugs), and Groq LLM (`Warfarin + Aspirin` and `Fluconazole + Simvastatin` clinical/plain explanations).

#### 2. Backend Routes

- **`backend/src/routes/auth.js`**:
  - `POST /auth/patient/send-otp`: Rate-limited OTP dispatcher (console log stub or Firebase Phone Auth).
  - `POST /auth/patient/verify-otp`: Validates OTP and issues JWT token.
  - `POST /auth/doctor/signup`: Registers doctors with email, password hash (`bcrypt`), name, and registration number.
  - `POST /auth/doctor/login`: Verifies credentials and issues doctor JWT.

- **`backend/src/routes/patient.js`**:
  - `POST /patient/profile`: Saves patient age, chronic conditions, and drug allergies.
  - `GET /patient/profile`: Retrieves profile data for onboarding pre-filling.
  - `GET /patient/home-summary`: Calculates overall status (`SAFE` vs `CAUTION`), groups medicines, and generates today's diurnal schedule slots (`08:00 AM`, `12:00 PM`, `06:00 PM`, `09:00 PM`).
  - `GET /patient/timeline`: Generates chronological timeline with doctor attribution.

- **`backend/src/routes/medicine.js`**:
  - `POST /medicine`: Standardizes name with RxNorm, checks for duplicates, creates database record, and immediately fires `setImmediate()` async background check. The background worker runs pairwise DDInter checks, calculates ACB cumulative burden, calls Groq LLM, and emits `interaction-checked` via Socket.IO.

- **`backend/src/routes/scan.js`**:
  - `POST /medicine/scan`: Uses Multer to receive prescription images, routes to OCR.space Engine 2, parses candidate names via regex heuristic rules, cleans up disk files in `finally`, and returns the candidate for user review.

- **`backend/src/routes/interactionFlag.js`**:
  - `GET /interaction-flag/:id`: Verifies ownership / doctor connection, recalculates live cumulative ACB burden, and returns the flag's severity, clinical explanation, plain explanation, and `generatedBy` metadata.

- **`backend/src/routes/symptom.js`**:
  - `POST /symptom`: Saves symptom description, searches `CascadeReference` for matching keywords, filters patient medicines by `dateAdded < symptomDate`, and links the probable root-cause drug.

- **`backend/src/routes/connection.js`**:
  - `POST /connection/generate-code`: Generates a random 6-digit code + QR code base64 string using `qrcode`.
  - `POST /connection/claim-code`: Doctor claims code (links `connectedUserId`).
  - `POST /connection/:id/approve` & `POST /connection/:id/revoke`: Patient approves or cuts off access.
  - `POST /connection/add-caregiver`: Patient invites caregiver by phone number.

- **`backend/src/routes/caregiver.js`**:
  - `GET /caregiver/patient-summary/:patientId`: Strict permission filter. Returns only `SAFE/CAUTION/CRITICAL` status and generic reminder times (e.g. `"Prescription medicine · 5mg"`). **Omits all drug names, symptom logs, and clinical explanations.**

#### 3. Backend Services

- **`backend/src/services/interactionLookup.js`**:
  Executes high-performance bidirectional queries (`drugAName = A AND drugBName = B` OR `drugAName = B AND drugBName = A`) against the 240k+ `DrugInteractionReference` table with case-normalization.

- **`backend/src/services/burdenIndex.js`**:
  Fetches all active patient medicines, matches them against `BurdenScore` (ACB 0–3 values), sums the scores, and returns `{ totalScore, level: 'Normal' | 'Moderate' | 'Critical', breakdown }`.

- **`backend/src/services/explanationGenerator.js`**:
  Constructs clinical prompt for Groq Llama-3.3 (`llama-3.3-70b-versatile`), enforces JSON output format, sets an 8-second hard timeout, and falls back to deterministic pharmacological templates on timeout or error.

#### 4. Frontend Key Pages & Components

- **`frontend/src/main.jsx`**:
  Bootstraps React DOM, configures `axios.defaults.baseURL` from `import.meta.env.VITE_API_URL` for production deployment.

- **`frontend/src/App.jsx`**:
  Wraps the app with `QueryClientProvider`, initializes `BrowserRouter`, and declares the 12 primary routes with fallback redirect to `/home`.

- **`frontend/src/components/Navbar.jsx`**:
  Sticky glassmorphism header displaying brand logo, active route pills, role portals (Doctor / Caregiver / Connected People), and auth buttons.

- **`frontend/src/pages/HomePage.jsx`**:
  Patient command center. Displays safety status hero card (`#E4F2E9` green for SAFE, `#FBEED9` amber for CAUTION), today's time-slot reminders, active interaction cards, and 4-grid quick navigation.

- **`frontend/src/pages/AddMedicinePage.jsx`**:
  Input form featuring Prescription OCR camera scan, RxNorm auto-standardizer, 3-way toggle (Rx/OTC/Herbal), and a real-time Socket.IO modal that displays a pulsing dot animation during checking and live-updates with interaction flags.

- **`frontend/src/pages/RiskAnalysisPage.jsx`**:
  Comprehensive risk view with crimson border header, dual "For the Doctor" (clinical) and "For You" (plain text) cards, and horizontal ACB cumulative burden meter.

- **`frontend/src/pages/LogSymptomPage.jsx` & `SymptomResultPage.jsx`**:
  Intelligent symptom logger that alerts patients when a new symptom is likely a prescribing cascade from an existing prescription rather than a new disease.

- **`frontend/src/pages/TimelinePage.jsx`**:
  Vertical `#E0824B` line with colored dot markers (Teal = Safe, Red = Flagged) detailing prescription dates, doctor attribution (`Dr. Mehta · Cardiology`), and interaction notes.

- **`frontend/src/pages/DoctorSharePage.jsx` & `DoctorDashboardPage.jsx`**:
  Consent-based connection management. Patients generate 6-digit codes and QR codes; doctors claim codes and inspect read-only patient timelines.

- **`frontend/src/pages/CaregiverViewPage.jsx` & `ConnectedPeoplePage.jsx`**:
  Caregiver-restricted portal and patient connection audit settings with 1-click access revocation.

---

## 6. DATA MODEL & DATABASE SCHEMA (PRISMA POSTGRESQL)

```prisma
// datasource and generator
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ────────────────────────────────────────────────────────────────────
enum Role {
  PATIENT
  CAREGIVER
  DOCTOR
  PHARMACIST
}

enum MedicineType {
  PRESCRIPTION
  OTC
  HERBAL
}

enum ConnectionRole {
  CAREGIVER
  DOCTOR
}

enum ConnectionStatus {
  PENDING
  APPROVED
  REVOKED
}

// ─── Core Models ──────────────────────────────────────────────────────────────
model User {
  id           String   @id @default(uuid())
  phone        String?  @unique
  email        String?  @unique
  passwordHash String?  // Only for DOCTOR / PHARMACIST roles
  role         Role     @default(PATIENT)
  createdAt    DateTime @default(now())

  // Relations
  patient        Patient?
  medicinesAdded Medicine[]   @relation("AddedByUser")
  connections    Connection[] @relation("ConnectedUser")
}

model Patient {
  id         String   @id @default(uuid())
  userId     String   @unique
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  age        Int
  conditions String[] // e.g. ["Hypertension", "Type 2 Diabetes"]
  allergies  String[] // e.g. ["Penicillin", "Sulfa"]

  // Relations
  medicines        Medicine[]
  symptoms         Symptom[]
  connections      Connection[]
  interactionFlags InteractionFlag[]
}

model Medicine {
  id               String       @id @default(uuid())
  patientId        String
  patient          Patient      @relation(fields: [patientId], references: [id], onDelete: Cascade)

  name             String
  standardizedCode String?      // RxNorm CUI identifier
  type             MedicineType @default(PRESCRIPTION)
  addedBy          String       // userId of the author (Doctor or Patient)
  addedByUser      User         @relation("AddedByUser", fields: [addedBy], references: [id])
  dateAdded        DateTime     @default(now())
  dosage           String?

  // Relations
  symptoms            Symptom[]         @relation("PossibleCauseMedicine")
  interactionFlagsAsA InteractionFlag[] @relation("MedicineA")
  interactionFlagsAsB InteractionFlag[] @relation("MedicineB")
}

model InteractionFlag {
  id                  String   @id @default(uuid())
  patientId           String
  patient             Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)

  medicineAId         String
  medicineA           Medicine @relation("MedicineA", fields: [medicineAId], references: [id], onDelete: Cascade)

  medicineBId         String
  medicineB           Medicine @relation("MedicineB", fields: [medicineBId], references: [id], onDelete: Cascade)

  severity            String   // Contraindicated | Major | Moderate | Minor | Unknown
  clinicalExplanation String   // Formal clinical text for doctors
  plainExplanation    String   // Simple language for patients
  generatedBy         String?  @default("fallback") // groq | fallback | timeout | demo-mock
  dateFlagged         DateTime @default(now())
}

model Symptom {
  id                      String    @id @default(uuid())
  patientId               String
  patient                 Patient   @relation(fields: [patientId], references: [id], onDelete: Cascade)

  description             String
  dateLogged              DateTime  @default(now())

  possibleCauseMedicineId String?
  possibleCauseMedicine   Medicine? @relation("PossibleCauseMedicine", fields: [possibleCauseMedicineId], references: [id], onDelete: SetNull)
}

model Connection {
  id              String           @id @default(uuid())
  patientId       String
  patient         Patient          @relation(fields: [patientId], references: [id], onDelete: Cascade)

  connectedUserId String?          // Null until claimed by doctor
  connectedUser   User?            @relation("ConnectedUser", fields: [connectedUserId], references: [id], onDelete: SetNull)

  role            ConnectionRole   @default(DOCTOR)
  status          ConnectionStatus @default(PENDING)
  shareCode       String?          @unique  // 6-digit one-time code
  expiresAt       DateTime?                 // 24 hours expiry for doctor codes
  createdAt       DateTime         @default(now())

  @@index([shareCode])
}

// ─── Reference Knowledgebases (Read-Only Runtime) ────────────────────────────
model DrugInteractionReference {
  id         Int     @id @default(autoincrement())
  drugAName  String
  drugBName  String
  severity   String  // Contraindicated | Major | Moderate | Minor | Unknown
  ddinterId  String?

  @@index([drugAName, drugBName])
  @@index([drugBName, drugAName])
  @@map("drug_interaction_reference")
}

model BurdenScore {
  id       Int    @id @default(autoincrement())
  drugName String @unique
  score    Int    // 0 | 1 | 2 | 3 (ACB Scale)

  @@index([drugName])
  @@map("burden_score")
}

model CascadeReference {
  id                  Int    @id @default(autoincrement())
  symptomKeyword      String
  causingDrugCategory String
  description         String

  @@index([symptomKeyword])
  @@map("cascade_reference")
}

model HerbDrugReference {
  id          Int    @id @default(autoincrement())
  herbName    String
  drugName    String
  severity    String
  description String

  @@index([herbName])
  @@index([drugName])
  @@map("herb_drug_reference")
}
```

---

## 7. COMPLETE API REFERENCE (ALL ENDPOINTS & SCHEMAS)

### Authentication (`/auth`)

#### `POST /auth/patient/send-otp`
Sends a 6-digit OTP to the patient/caregiver phone number.
- **Request Body:** `{ "phone": "+919876543210" }`
- **Response (200):** `{ "message": "OTP sent successfully." }` (In stub mode, prints OTP to terminal).

#### `POST /auth/patient/verify-otp`
Verifies OTP, returns signed JWT token.
- **Request Body:** `{ "phone": "+919876543210", "code": "123456" }`
- **Response (200):** `{ "token": "jwt_token_here", "user": { "id": "...", "role": "PATIENT", "hasProfile": true } }`

#### `POST /auth/doctor/signup`
Creates a doctor account with medical registration number.
- **Request Body:** `{ "email": "dr.smith@hospital.org", "password": "securepassword", "name": "Dr. Smith", "registrationNumber": "MCI-48291" }`
- **Response (201):** `{ "token": "jwt_token_here", "user": { "id": "...", "role": "DOCTOR" } }`

#### `POST /auth/doctor/login`
Authenticates doctor with email and password.
- **Request Body:** `{ "email": "dr.smith@hospital.org", "password": "securepassword" }`
- **Response (200):** `{ "token": "jwt_token_here", "user": { ... } }`

---

### Patient & Profile (`/patient`)

#### `POST /patient/profile` *(Patient Auth)*
Saves patient age, chronic conditions, and drug allergies.
- **Request Body:** `{ "age": 68, "conditions": ["Hypertension", "Diabetes"], "allergies": ["Penicillin"] }`
- **Response (200):** `{ "patient": { "id": "...", "age": 68, ... } }`

#### `GET /patient/home-summary` *(Patient Auth)*
Returns active medicines, today's schedule, interaction flags, and overall safety status (`SAFE` | `CAUTION` | `CRITICAL`).

#### `GET /patient/timeline` *(Patient Auth)*
Returns chronological medication feed sorted by `dateAdded` descending, including prescribing doctor names and active interaction links.

---

### Medication & Interaction Engine (`/medicine`)

#### `POST /medicine` *(Patient / Caregiver Auth)*
Adds a medication, standardizes name via RxNorm, checks for duplicates, saves record, and asynchronously triggers pairwise DDInter + ACB + Herb-Drug checks.
- **Request Body:** `{ "name": "Warfarin", "type": "PRESCRIPTION", "dosage": "5mg once daily" }`
- **Response (201):** `{ "message": "Medicine added successfully.", "medicine": { ... }, "checkingInteractions": true }`
- **Socket.IO Event Emitted:** `interaction-checked` to room `patient-${userId}`:
  ```json
  {
    "newMedicineName": "Warfarin",
    "flagsFound": [
      {
        "flagId": "flag-uuid",
        "drugA": "Warfarin",
        "drugB": "Aspirin",
        "severity": "Major",
        "clinicalExplanation": "Additive anticoagulant/antiplatelet effect...",
        "plainExplanation": "Taking Warfarin and Aspirin together increases bleeding risk...",
        "generatedBy": "groq"
      }
    ],
    "cumulativeBurden": {
      "totalScore": 2,
      "level": "Moderate",
      "breakdown": [...]
    }
  }
  ```

#### `POST /medicine/scan` *(Auth Required)*
Multipart prescription image upload. Extracts candidate drug name using OCR.space Engine 2 + Heuristic parser. **Never saves without user confirmation.**

---

### Symptoms & Cascade Detection (`/symptom`)

#### `POST /symptom` *(Patient Auth)*
Logs a symptom, checks against `CascadeReference` registry, and filters against drugs added **prior** to the symptom date.
- **Request Body:** `{ "description": "severe leg swelling in ankles", "dateLogged": "2026-08-15" }`
- **Response (201):**
  ```json
  {
    "symptom": { "id": "...", "description": "severe leg swelling..." },
    "cascadeMatch": {
      "found": true,
      "symptom": "leg swelling",
      "causingDrugCategory": "calcium channel blocker",
      "matchedMedicine": { "id": "...", "name": "Amlodipine", "dateAdded": "2026-08-01" },
      "description": "Leg swelling is a documented adverse reaction of calcium channel blockers...",
      "advice": "Before starting a new medication for this symptom, consult your doctor."
    }
  }
  ```

---

### Doctor & Caregiver Connections (`/connection` & `/caregiver`)

#### `POST /connection/generate-code` *(Patient Auth)*
Generates a 6-digit one-time share code and base64 QR code image (24-hour expiry).

#### `POST /connection/claim-code` *(Doctor Auth)*
Doctor claims patient code. Status remains `PENDING` until patient approves.

#### `POST /connection/:id/approve` *(Patient Auth)*
Patient approves doctor access → status becomes `APPROVED`.

#### `POST /connection/:id/revoke` *(Patient Auth)*
Patient immediately revokes doctor or caregiver access.

#### `GET /connection/doctor-patient/:patientId/timeline` *(Connected Doctor Auth)*
Returns full, read-only medication timeline and clinical explanations for the connected patient.

#### `POST /connection/add-caregiver` *(Patient Auth)*
Invites a caregiver by phone number (upserts user with `role: CAREGIVER`).

#### `GET /caregiver/patient-summary/:patientId` *(Connected Caregiver Auth)*
**Strict Permission Boundary:** Returns ONLY safety status (`SAFE` | `CAUTION` | `CRITICAL`) and daily reminder times with generic labels (e.g. `"Prescription medicine · 5mg"`). **Full drug names, symptom logs, and risk details are omitted at the database query level.**

---

## 8. AI & LLM ENGINE (GROQ LLAMA 3.3 + PROMPTS + GUARDRAILS)

PolySafe uses **Groq's Llama-3.3-70b-versatile** model with strict medical guardrails:

```javascript
const systemPrompt = `You are a clinical pharmacologist and patient safety communication specialist.
Your task is to generate two concise, accurate explanations for an identified Drug-Drug Interaction (DDI) and cumulative anticholinergic/sedative burden score.

STRICT MEDICAL GUARDRAILS:
1. ONLY explain the verified severity level (${severity}) and cumulative burden score (${burdenScore}, ${burdenLevel}).
2. NEVER invent, hallucinate, or extrapolate unverified adverse effects or new medical conditions beyond what is provided.
3. For the "clinical" explanation: Write a 1-sentence formal pharmacological summary for a physician or pharmacist.
4. For the "plain" explanation: Write in calm, simple, patient-friendly language. Reference patient age (${patientAge ?? 'Not specified'}) or conditions (${conditionsText}) ONLY if directly relevant to clearance, sedation, or fall risk.
5. MANDATORY PATIENT FRAMING: The "plain" explanation MUST conclude with: "(This is an informational safety alert, not a medical diagnosis.)"

OUTPUT FORMAT (JSON ONLY):
{
  "clinical": "Formal 1-sentence pharmacological summary for clinicians",
  "plain": "Patient-friendly explanation concluding with (This is an informational safety alert, not a medical diagnosis.)"
}`;
```

### Safety Features & Timeout Handling
- **8-Second Hard Timeout:** If Groq API does not respond within 8,000ms, the system immediately falls back to a deterministic pharmacological template.
- **Immediate UI Render:** The frontend immediately displays the raw interaction severity and ACB burden meter with a *"Generating detailed explanation..."* indicator, preventing blank screens or hanging spinners.

---

## 9. OCR PRESCRIPTION SCANNER & RXNORM STANDARDIZATION

### OCR Pipeline
1. Image uploaded via Multer to temporary storage `backend/tmp/`.
2. Sent to **OCR.space Engine 2** (optimized for printed prescription labels and medical receipts).
3. Temporary image file is **immediately deleted from disk** in a `finally` block.
4. Regex heuristic extraction finds candidate drug names:
   - Rule 1: Label patterns (`Rx:`, `Drug:`, `Tablet:`, `Capsule:`)
   - Rule 2: Dose proximity (`Warfarin 5mg` → `Warfarin`)
   - Rule 3: All-caps medication tokens excluding stop words.
   - Rule 4: First substantial line fallback.
5. Candidate is sent to the frontend for **explicit user verification before saving**.

### RxNorm / RxNav Resolution
- Queries NLM REST API: `https://rxnav.nlm.nih.gov/REST/rxcui.json?name={drugName}`.
- Resolves drug to universal **RxCUI code** (e.g. `Warfarin` → `11289`).
- If RxNorm has no match (e.g. Ayurvedic/Herbal), the drug is saved with `standardizedCode: null` without failing the request, and the engine seamlessly checks interactions by normalized name matching.

---

## 10. PERMISSION MATRIX & CONSENT ARCHITECTURE (RBAC)

| Capability | Patient | Doctor (Connected) | Caregiver (Connected) | Unconnected User |
|---|:---:|:---:|:---:|:---:|
| View Complete Drug List | ✅ Full | ✅ Full Read-Only | ❌ No Drug Names | ❌ Blocked (403) |
| View Clinical Explanations | ✅ Yes | ✅ Yes | ❌ Hidden | ❌ Blocked (403) |
| View Plain Explanations | ✅ Yes | ✅ Yes | ❌ Hidden | ❌ Blocked (403) |
| View Safety Status (Safe/Caution/Critical) | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Blocked (403) |
| View Today's Reminder Times | ✅ Yes | ✅ Yes | ✅ Generic Labels Only | ❌ Blocked (403) |
| View Symptom & Cascade Analysis | ✅ Yes | ✅ Yes | ❌ Hidden | ❌ Blocked (403) |
| Add / Modify / Remove Medications | ✅ Full | ❌ Blocked (Liability) | ❌ Blocked | ❌ Blocked (403) |
| Approve / Revoke Connections | ✅ Full | ❌ No | ❌ No | ❌ No |

---

## 11. FRONTEND DESIGN SYSTEM & 13-PAGE UI SPECIFICATION

### Design Tokens
- **Background:** `#FBF8F2` (Warm parchment background — avoids cold hospital white)
- **Primary Brand Color:** `#2B6E5E` (Sage Clinical Teal)
- **Secondary Accent:** `#E0824B` (Warm Amber / Timeline connector)
- **Card Background:** `#FFFFFF` with `2px solid #E7E1D3` border & `16px` border-radius
- **Caution Crimson:** `#B23D25` (Background `#FBE4DE`, Border `#B23D25`)
- **Typography:**
  - Headings: `'Fraunces', serif`
  - Body & UI: `'Source Sans 3', sans-serif`

### Implemented Pages
1. **`/login`** — Dual phone + OTP (patient/caregiver) and email + registration number (doctor) sign-in.
2. **`/onboarding`** — Age, chronic conditions, and allergy intake.
3. **`/home`** — Real-time safety status hero card, today's schedule, recent flags, and 4-grid quick navigation.
4. **`/add-medicine`** — Prescription OCR camera/upload, RxNorm lookup, 3-way toggle (Rx/OTC/Herbal), Socket.IO live checking modal.
5. **`/risk/:id`** — Red-bordered risk detail card, dual clinical/plain explanation cards, ACB burden progress meter.
6. **`/log-symptom`** — Symptom logging with date picker.
7. **`/symptom-result`** — Prescribing cascade match card cross-referencing past drug start dates.
8. **`/timeline`** — Vertical `#E0824B` timeline with colored dot markers and doctor provenance tags.
9. **`/share-with-doctor`** — Patient 6-digit code generator + base64 QR code share view with live pending claim approvals.
10. **`/doctor-dashboard`** — Doctor claim code input + patient roster + embedded read-only timeline.
11. **`/caregiver-view`** — Caregiver pending invites + status-only hero card + generic reminder schedule.
12. **`/connected-people`** — Patient settings to audit all connected doctors/caregivers with instant revocation.

---

## 12. DEMO_MODE & LIVE DEMO ZERO-NETWORK RESILIENCE

PolySafe includes a built-in **Demo Reliability Switch** in `src/lib/demo.js`. When presenting on unstable venue Wi-Fi:

```bash
# In backend/.env
DEMO_MODE="true"
```

### Mock Fallback Guarantees
- **OCR Scan:** Instantly returns a pre-parsed `Warfarin 5mg` sample prescription.
- **RxNorm:** Resolves known demo drugs via an internal static map.
- **Groq LLM:** Returns pre-compiled, medically verified explanations for demo pairs (e.g. Warfarin + Aspirin) with a `DEMO` badge.
- **Zero Code Changes:** Flip the environment variable and restart the backend.

---

## 13. LOCAL DEVELOPMENT & SEEDING GUIDE

### Prerequisites
- Node.js v18+
- PostgreSQL database running locally or in cloud (Supabase, Neon, Railway)

### Step 1: Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

Configure `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/polysafe?schema=public"
JWT_SECRET="dev-secret-key-32-chars-long"
PORT=5000
NODE_ENV="development"
USE_FIREBASE_OTP="false"
DEMO_MODE="false"
GROQ_API_KEY="your_groq_api_key"
OCR_SPACE_API_KEY="your_ocr_space_key"
```

Push schema & seed datasets:
```bash
npm run prisma:push
npm run seed
npm run dev
```

### Step 2: Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 14. PRODUCTION DEPLOYMENT (RENDER + VERCEL)

### Backend Deployment (Render)
1. Push repository to GitHub.
2. In Render, select **Blueprints → New Blueprint Instance** and point to the repo.
3. Render reads root [`render.yaml`](file:///c:/Meet/xyz/PolySafe/render.yaml) to provision:
   - PostgreSQL Database (`polysafe-db`)
   - Web Service (`polysafe-backend`) running `npm install && npx prisma generate && npx prisma db push` and `node src/index.js`.

### Frontend Deployment (Vercel)
1. Import repository into Vercel.
2. Set Root Directory to `frontend`.
3. Set Environment Variable: `VITE_API_URL=https://your-backend.onrender.com`.
4. Deploy (SPA client rewrites handled automatically via [`vercel.json`](file:///c:/Meet/xyz/PolySafe/frontend/vercel.json)).

---

## 15. LIVE DEMO PITCH SCRIPT & JUDGE PRESENTATION GUIDE

### The 3-Minute Winning Demo Script

#### Minute 1: The Problem & Onboarding (0:00 – 1:00)
- *"Judges, polypharmacy kills not because of a single bad prescription, but because nobody watches the patient's full medication journey across time."*
- Open [http://localhost:3000](http://localhost:3000) → Sign in with phone `+919876543210` (OTP: `123456`).
- Show patient profile: Mrs. Sharma, Age 68, Hypertension & Type 2 Diabetes.

#### Minute 2: The Two Core Checks & Dual AI Explanations (1:00 – 2:00)
- Add **Warfarin 5mg** (Prescribed by Dr. Mehta).
- Add **Aspirin 75mg** (OTC) → Real-time Socket.IO modal pops up immediately!
- Click **"View Risk Details"**:
  - Show the **"For the Doctor"** card: clinical pharmacology explanation.
  - Show the **"For You"** card: plain-language explanation with non-diagnostic framing.
  - Show the **Combined Sedative / Pressure Load (ACB Meter)**.
- Add **Turmeric** via the **Herbal toggle** → show the herb-drug blind spot catch.

#### Minute 3: Prescribing Cascade & Doctor Consent Flow (2:00 – 3:00)
- Go to **"Log Symptom"** → type `"leg swelling"`.
- Show the **Symptom Origin Checker**: catches that Amlodipine (started 3 weeks ago) is the root cause, preventing a loop diuretic prescription.
- Show **Timeline**: visual proof of cross-doctor provenance.
- Show **Doctor QR Share & Caregiver Privacy View**: prove the consent RBAC model.

---

## 16. ANTICIPATED TOUGH QUESTIONS & BULLETPROOF ANSWERS

### Q1: *"How is this different from Drugs.com or Medscape interaction checkers?"*
**Answer:** *"Existing tools are static, pairwise checkers. They require someone to type two drugs in at the same moment. PolySafe is a persistent timeline that watches what happens across time: cross-doctor additions, prescribing cascades (linking new symptoms to old drugs), undisclosed herbal supplements, and cumulative anticholinergic burden that looks safe pairwise but causes falls in aggregate."*

### Q2: *"What if the Groq LLM hallucinates an unverified medical claim?"*
**Answer:** *"We use a deterministic lookup layer first (DDInter 240k+ verified interactions and ACB scores). The LLM is strictly constrained via system prompt instructions to ONLY re-phrase the verified severity level and burden score into clinical and plain language. It is forbidden from introducing unverified adverse effects, and every patient text concludes with mandatory non-diagnostic framing."*

### Q3: *"Who can see my medical data? What prevents unauthorized access?"*
**Answer:** *"Nobody sees patient data by default. Doctor connections require a 24-hour expiring 6-digit code or QR scan that the patient must explicitly approve. Doctors receive read-only access and cannot edit prescriptions. Caregivers receive a strictly redacted view showing only overall safety status and reminder times without drug names. Patients can revoke access in one click anytime from Connected People."*

---

## 17. POST-HACKATHON ROADMAP & ABDM/FHIR INTEGRATION

| Area | Hackathon v1 (Current) | Post-Hackathon v2 Production |
|---|---|---|
| **EHR Interoperability** | Standalone PostgreSQL schema | Ayushman Bharat Digital Mission (ABDM) M1/M2/M3 compliance + HL7 FHIR standard |
| **Doctor Credentialing** | Medical Registration Number format validation | Real-time automated verification via National Medical Commission (NMC) API |
| **Handwritten Prescriptions** | OCR.space Engine 2 + Heuristic parser | Fine-tuned Gemini 1.5 Flash Vision model for handwritten Indian physician scripts |
| **Dosage Scheduling** | Deterministic diurnal time slots | Multi-dose chronotherapy scheduling with push notifications & caregiver missed-dose alerts |
| **Dispensing Counter Mode** | Read-only Doctor Portal | Dedicated Pharmacist POS scan & interaction verification screen |

---

*PolySafe — Protecting Vulnerable Patients Across Every Prescription, Provider, and Year.*
