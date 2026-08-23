# PolySafe Master Technical Architecture & Current State Manual
**Document Version:** 5.2.0  
**Build Date:** August 23, 2026  
**Repository:** `meetchauhan17/PolySafe`  
**License:** Proprietary / Healthcare Safety Protocol  
**Target Environment:** Node.js v20+ / PostgreSQL 15+ / React 19 / Vite 8 / TailwindCSS 4  

---

## TABLE OF CONTENTS
1. [Executive Overview & Platform Philosophy](#1-executive-overview--platform-philosophy)
2. [Complete Repository Directory Tree](#2-complete-repository-directory-tree)
3. [Full Database Architecture & Prisma Schema](#3-full-database-architecture--prisma-schema)
4. [Master REST API Specification & Endpoint Contracts](#4-master-rest-api-specification--endpoint-contracts)
5. [Real-Time WebSocket & Socket.IO Architecture](#5-real-time-websocket--socketio-architecture)
6. [Clinical Engines & Algorithmic Services](#6-clinical-engines--algorithmic-services)
   - [6.1 5-Layer Indian Formulation & Generic Resolver](#61-5-layer-indian-formulation--generic-resolver)
   - [6.2 WHO/NCI 5-Tier Drug Harm & Regimen Burden Engine](#62-whonci-5-tier-drug-harm--regimen-burden-engine)
   - [6.3 4-System Organ & System Toxicity Radar](#63-4-system-organ--system-toxicity-radar)
   - [6.4 Anticholinergic Cognitive Burden (ACB) Index](#64-anticholinergic-cognitive-burden-acb-index)
   - [6.5 High-Speed DDInter Interaction Search](#65-high-speed-ddinter-interaction-search)
   - [6.6 4-Stage Multimodal Prescription OCR Pipeline](#66-4-stage-multimodal-prescription-ocr-pipeline)
   - [6.7 Prescribing Cascade Detector](#67-prescribing-cascade-detector)
   - [6.8 FDA OFFSIDES Adverse Event Signal Miner](#68-fda-offsides-adverse-event-signal-miner)
   - [6.9 Loose Pill Imprint Matcher](#69-loose-pill-imprint-matcher)
   - [6.10 Herb-Drug Interaction Matrix](#610-herb-drug-interaction-matrix)
7. [Clinical Datasets, Seed Files & Reference Registries](#7-clinical-datasets-seed-files--reference-registries)
8. [Frontend Architecture & Page-by-Page Specifications](#8-frontend-architecture--page-by-page-specifications)
9. [Doctor Command Center Architecture & Clinical Modals](#9-doctor-command-center-architecture--clinical-modals)
10. [Component Library, Modals & Clinical Panels](#10-component-library-modals--clinical-panels)
11. [Design System, Surface Tokens & Neomorphism Calibration](#11-design-system-surface-tokens--neomorphism-calibration)
12. [Authentication, Role-Based Access Control & Security Safeguards](#12-authentication-role-based-access-control--security-safeguards)
13. [Automated Verification, Integration Tests & QA Protocols](#13-automated-verification-integration-tests--qa-protocols)
14. [Environment Configuration & Production Deployment](#14-environment-configuration--production-deployment)
15. [Changelog & Historical Milestones](#15-changelog--historical-milestones)

---

## 1. EXECUTIVE OVERVIEW & PLATFORM PHILOSOPHY

Polypharmacy—the concurrent clinical use of multiple prescription, OTC, and herbal medications—is a leading cause of preventable hospital admissions, acute organ toxicity, cumulative cognitive decline, and iatrogenic prescribing cascades in patients with multiple chronic conditions.

**PolySafe** is an enterprise-grade pharmacovigilance and real-time clinical decision support platform engineered to bridge the safety divide between Patients, Attending Physicians, and Family Caregivers.

```
       ┌────────────────────────────────────────────────────────┐
       │                   POLYSAFE PLATFORM                    │
       └──────────────────────────┬─────────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   PATIENT APP    │    │  DOCTOR PORTAL   │    │  CAREGIVER VIEW  │
│                  │    │                  │    │                  │
│ • OCR Rx Intake  │    │ • 2-Tier Banner  │    │ • Daily Schedule │
│ • Regimen Risk   │    │ • Organ Radar    │    │ • Dose Reminders │
│ • Side Effects   │    │ • Deprescribing  │    │ • Critical Flags │
│ • Cascade Alerts │    │ • Drug Substitute│    │ • Read-Only      │
│ • QR Share Code  │    │ • Pre-Rx Sim     │    │   Access         │
│ • Herb Cross-Check│   │ • Directives Push│    │ • Timeline Sync  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

### Core Clinical Capabilities:
1. **Prevent Adverse Drug Events (ADEs)**: Real-time bi-directional cross-matching against 222,385+ validated pharmacological interaction pairs from DDInter.
2. **Halt Prescribing Cascades**: Detect when newly logged symptoms (e.g. peripheral edema, persistent dry cough, constipation) are side effects of active medications (e.g. Amlodipine, Lisinopril, Verapamil) before a secondary drug is mistakenly prescribed.
3. **Decentralize Geriatric Deprescribing**: Equip doctors with STOPP/START criteria, gradual tapering calculators, and 1-click drug substitution workflows.
4. **Bridge the Indian Formulary Gap**: Resolve branded fixed-dose combination formulations (e.g. *Augmentin 625*, *Pan-D*, *Telma-H*, *Glycomet-GP2*) down to active international chemical salts and RxNorm CUIs.
5. **Mitigate Cumulative Cognitive Burden**: Track Anticholinergic Cognitive Burden (ACB) scores in real-time to prevent drug-induced delirium and fall risks.
6. **Real-Time Synchronized Telemetry**: Instant Socket.IO event propagation across patient, doctor, and caregiver views whenever medications are added, modified, or deprescribed.

---

## 2. COMPLETE REPOSITORY DIRECTORY TREE

```
PolySafe/
├── backend/
│   ├── data/                                 # Clinical seed datasets and pre-computed caches
│   │   ├── ai-resolved-drugs.json            # 273 pre-computed brand-to-salt mappings (121.5 KB)
│   │   ├── burden-scores.json                # 30 anticholinergic drugs with ACB scores 0-3 (4.9 KB)
│   │   ├── cascade-references.json           # 20 prescribing cascade clinical pairs (8.2 KB)
│   │   ├── ddinter.csv                       # 222,385 drug-drug interaction pairs (13.1 MB)
│   │   ├── drugbank-id-cache.json            # 1,514 DrugBank ID to RxNorm mappings (43.7 KB)
│   │   ├── harm-levels.json                  # 205 drug harm level classifications (8.5 KB)
│   │   ├── herb-drug-interactions.json       # 24 herb-drug clinical mechanisms (9.7 KB)
│   │   ├── indian-aliases-generated.json     # 251 normalized Indian brand synonyms (77.0 KB)
│   │   ├── indianDrugs.js                    # 35+ CDSCO Indian brand formulations (13.5 KB)
│   │   ├── offsides-sample.json              # 86 FDA adverse reactions with PRR >= 2.0 (10.8 KB)
│   │   └── pill-imprints.json                # 26 loose pill physical imprints (4.4 KB)
│   ├── prisma/                               # Database schemas and migration seeders
│   │   ├── schema.prisma                     # Master Prisma ORM schema (14 models, 4 enums)
│   │   ├── seed.js                           # DDInter CSV streaming database seeder
│   │   ├── seed-burden.js                    # Anticholinergic burden table seeder
│   │   ├── seed-cascade.js                   # Prescribing cascade reference seeder
│   │   ├── seed-herb-drug.js                 # Herb-drug interaction seeder
│   │   ├── seed-offsides.js                  # FDA OFFSIDES side effects seeder
│   │   ├── seed-pills.js                     # Loose pill imprints seeder
│   │   ├── seedIndianDrugs.js                # Indian formulary disk cache seeder
│   │   └── seedDatabases.js                  # Multi-source combined seeder
│   ├── src/
│   │   ├── lib/
│   │   │   ├── demo.js                       # Deterministic offline mock fixtures
│   │   │   ├── email.js                      # Resend transactional email OTP client
│   │   │   └── prisma.js                     # Singleton Prisma client connection pool
│   │   ├── middlewares/
│   │   │   ├── auth.js                       # JWT extraction and validation middleware
│   │   │   ├── rateLimiter.js                # Express rate limiters for auth endpoints
│   │   │   └── requireRole.js                # Role-Based Access Control (RBAC) guard
│   │   ├── routes/
│   │   │   ├── auth.js                       # Authentication, OTP, login, lockout, /me
│   │   │   ├── caregiver.js                  # Caregiver invitations, claims, summary
│   │   │   ├── connection.js                 # Doctor-patient linking, safety checks, directives
│   │   │   ├── interactionFlag.js            # Flag queries, dual explanations, ACB scores
│   │   │   ├── medicine.js                   # CRUD medicine, search, resolve, imprints, side effects
│   │   │   ├── patient.js                    # Profile, home summary, timeline audit trail
│   │   │   ├── scan.js                       # 4-stage multimodal Gemini prescription OCR
│   │   │   └── symptom.js                    # Symptom logging and cascade analysis
│   │   ├── services/
│   │   │   ├── aiDrugResolver.js             # 5-layer formulation resolution engine
│   │   │   ├── burdenIndex.js                # Anticholinergic cognitive burden calculator
│   │   │   ├── drugAliases.js                # Brand and generic synonym resolver
│   │   │   ├── explanationGenerator.js       # Groq dual-audience clinical explanation generator
│   │   │   ├── interactionLookup.js          # DDInter indexed bi-directional search
│   │   │   ├── ocrCandidateExtractor.js      # Token n-gram OCR candidate extractor
│   │   │   └── regimenRisk.js                # WHO/NCI 5-tier harm and escalation engine
│   │   └── index.js                          # Express server, Socket.IO setup, error handler
│   ├── tests/                                # Automated verification & test suites
│   │   ├── test-all-endpoints.js             # 18-step master sequential integration test suite
│   │   ├── test-block1-auth.js               # Authentication & lockout test suite
│   │   ├── test-doctor-safety-check.js       # Pre-prescribing simulation test
│   │   ├── test-hybrid-scan.js               # OCR vision & parsing test
│   │   ├── test-indian-resolver.js           # 5-layer Indian formulation test
│   │   ├── test-unified-3roles-auth.js       # Multi-role authentication validation suite
│   │   └── test-user-specified-accounts.js   # Account provisioning and verification suite
│   ├── .env.example                          # Environment variable template
│   └── package.json                          # Backend dependencies and scripts
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── auth.js                       # Axios HTTP client with Bearer token interceptor
│   │   ├── assets/                           # Static brand assets and icon maps
│   │   ├── components/                       # Shared reusable UI component library
│   │   │   ├── Card.jsx                      # Elevated clinical card container
│   │   │   ├── ClinicalLoader.jsx            # High-precision clinical pulsing loader
│   │   │   ├── DrugHarmBadge.jsx             # WHO/NCI 5-tier harm badges & OFFSIDES panels
│   │   │   ├── EmptyIllustrations.jsx        # Custom SVG illustrations for empty states
│   │   │   ├── ErrorBoundary.jsx             # React error boundary with fallback UI
│   │   │   ├── GuestLockModal.jsx            # Modal intercepting guest actions
│   │   │   ├── LedIndicator.jsx              # Multi-state clinical hardware diode
│   │   │   ├── Navbar.jsx                    # Top navigation bar with role switcher & user menu
│   │   │   ├── PageTransition.jsx            # Framer Motion page entrance animations
│   │   │   ├── PolySafeButton.jsx            # Tactile clinical button component
│   │   │   ├── PolySafeInput.jsx             # Styled clinical text and number input field
│   │   │   ├── PolySafeSelect.jsx            # Styled clinical dropdown selector
│   │   │   ├── PolySafeTextarea.jsx          # Styled clinical multiline text input
│   │   │   ├── ProtectedRoute.jsx            # Auth and role route guard
│   │   │   ├── SignOutConfirmButton.jsx      # Confirmation modal for signing out
│   │   │   └── Skeletons.jsx                 # Pulsing shimmer loading skeletons
│   │   ├── context/
│   │   │   └── AuthContext.jsx               # Global React auth state, token sync, guest mode
│   │   ├── layouts/
│   │   │   ├── PatientLayout.jsx             # Patient shell with navigation and alerts
│   │   │   ├── DoctorLayout.jsx              # Doctor shell with clinical command bar
│   │   │   └── CaregiverLayout.jsx           # Caregiver shell with patient switcher
│   │   ├── pages/                            # Top-level application routes
│   │   │   ├── AddMedicinePage.jsx           # Multimodal scan, brand search, pill imprint
│   │   │   ├── CaregiverViewPage.jsx         # Non-clinical schedule & risk alerts for caregivers
│   │   │   ├── ConnectedPeoplePage.jsx       # Doctor/caregiver consent & access revocation
│   │   │   ├── DoctorDashboardPage.jsx       # Doctor command center, organ radar, deprescribing
│   │   │   ├── DoctorSharePage.jsx           # 6-digit code generator with QR code canvas
│   │   │   ├── HomePage.jsx                  # Patient dashboard, risk meters, active medications
│   │   │   ├── InsightsPage.jsx              # Recharts polypharmacy trends & category analysis
│   │   │   ├── LoginPage.jsx                 # Role tabs, email check, OTP input, password
│   │   │   ├── LogSymptomPage.jsx            # Symptom intake with quick-select complaint chips
│   │   │   ├── OnboardingPage.jsx            # Baseline medical profile setup
│   │   │   ├── ProfilePage.jsx               # Profile, allergies, conditions, account settings
│   │   │   ├── RiskAnalysisPage.jsx          # Dual-audience risk breakdown, ACB meter
│   │   │   ├── SymptomResultPage.jsx         # Prescribing cascade alert card & guidance
│   │   │   └── TimelinePage.jsx              # Chronological prescription timeline
│   │   ├── styles/
│   │   │   └── tokens.css                    # Unified CSS custom properties, chassis, and shadows
│   │   ├── utils/
│   │   │   └── toast.jsx                     # Sonner toast notifications helper
│   │   ├── App.jsx                           # Route definitions, React Query provider
│   │   ├── index.css                         # Tailwind CSS 4 design tokens & base rules
│   │   └── main.jsx                          # React 19 root DOM entry point
│   ├── public/                               # Static favicons, web manifests
│   ├── package.json                          # Frontend dependencies and Vite configuration
│   ├── vite.config.js                        # Vite 8 configuration with Tailwind plugin
│   └── vercel.json                           # Vercel SPA routing and rewrite rules
│
├── render.yaml                               # Render cloud deployment blueprint
├── POLYSAFE_CURRENT_STATE.md                 # Master architecture manual (this file)
├── POLYSAFE_UI_AUDIT.md                      # UI and visual design system audit
└── README.md                                 # Public overview and quickstart guide
```

---

## 3. FULL DATABASE ARCHITECTURE & PRISMA SCHEMA

The database layer utilizes Prisma ORM connected to PostgreSQL 15+. All models enforce strict relational constraints, foreign keys, and indexes for millisecond query performance.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  PATIENT
  DOCTOR
  CAREGIVER
}

enum MedicineType {
  PRESCRIPTION
  OVER_THE_COUNTER
  HERBAL
}

enum Priority {
  URGENT
  HIGH
  NORMAL
}

enum DirectiveCategory {
  REGIMEN_ADVICE
  DIETARY_INSTRUCTION
  LIFESTYLE_ORDER
  MONITORING_INSTRUCTION
  FOLLOW_UP
}

model User {
  id              String             @id @default(uuid())
  email           String             @unique
  passwordHash    String?
  role            Role               @default(PATIENT)
  name            String?
  patientProfile  PatientProfile?
  doctorProfile   DoctorProfile?
  caregiverProfile CaregiverProfile?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
}

model PatientProfile {
  id              String             @id @default(uuid())
  userId          String             @unique
  user            User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  age             Int?
  conditions      String[]           @default([])
  allergies       String[]           @default([])
  shareCode       String?            @unique
  shareCodeExpires DateTime?
  medicines       Medicine[]
  symptoms        SymptomLog[]
  doctorConnections DoctorConnection[]
  caregiverAccess CaregiverAccess[]
  directives      ClinicalDirective[]
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
}

model DoctorProfile {
  id              String             @id @default(uuid())
  userId          String             @unique
  user            User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  licenseNumber   String?
  specialization  String?
  hospitalAffiliation String?
  connections     DoctorConnection[]
  directivesWritten ClinicalDirective[]
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
}

model CaregiverProfile {
  id              String             @id @default(uuid())
  userId          String             @unique
  user            User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  relationship    String?
  patientsManaged CaregiverAccess[]
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
}

model Medicine {
  id              String             @id @default(uuid())
  patientId       String
  patient         PatientProfile     @relation(fields: [patientId], references: [id], onDelete: Cascade)
  name            String
  brandName       String?
  genericName     String?
  rxNormCui       String?
  drugBankId      String?
  dosage          String?
  frequency       String?            // e.g. "Once Daily", "Twice Daily"
  timing          String?            // e.g. "Morning", "Night", "Before Food"
  prescribedBy    String?            @default("Self-logged")
  type            MedicineType       @default(PRESCRIPTION)
  harmLevel       String?            @default("L1") // L1, L2, L3, L4, L5
  discontinued    Boolean            @default(false)
  discontinuedAt  DateTime?
  discontinuedReason String?
  taperPlan       String?
  remindersEnabled Boolean           @default(true)
  interactionFlags InteractionFlag[]
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  @@index([patientId, discontinued])
}

model InteractionFlag {
  id              String             @id @default(uuid())
  medicineId      String
  medicine        Medicine           @relation(fields: [medicineId], references: [id], onDelete: Cascade)
  drugA           String
  drugB           String
  severity        String             // "Major", "Moderate", "Minor", "Contraindicated"
  mechanism       String?
  patientExplanation String?
  clinicalExplanation String?
  createdAt       DateTime           @default(now())
}

model SymptomLog {
  id              String             @id @default(uuid())
  patientId       String
  patient         PatientProfile     @relation(fields: [patientId], references: [id], onDelete: Cascade)
  symptom         String
  severity        Int                @default(3) // 1-5 scale
  onsetDate       DateTime?
  notes           String?
  cascadeSuspected Boolean           @default(false)
  offendingDrug   String?
  cascadeConfidence Float?
  createdAt       DateTime           @default(now())
}

model DoctorConnection {
  id              String             @id @default(uuid())
  doctorId        String
  doctor          DoctorProfile      @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  patientId       String
  patient         PatientProfile     @relation(fields: [patientId], references: [id], onDelete: Cascade)
  status          String             @default("APPROVED") // "PENDING", "APPROVED", "REVOKED"
  approvedAt      DateTime           @default(now())
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  @@unique([doctorId, patientId])
}

model CaregiverAccess {
  id              String             @id @default(uuid())
  caregiverId     String
  caregiver       CaregiverProfile   @relation(fields: [caregiverId], references: [id], onDelete: Cascade)
  patientId       String
  patient         PatientProfile     @relation(fields: [patientId], references: [id], onDelete: Cascade)
  accessLevel     String             @default("READ_ONLY") // "READ_ONLY", "MANAGE_REMINDERS"
  status          String             @default("APPROVED")
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  @@unique([caregiverId, patientId])
}

model ClinicalDirective {
  id              String             @id @default(uuid())
  doctorId        String
  doctor          DoctorProfile      @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  patientId       String
  patient         PatientProfile     @relation(fields: [patientId], references: [id], onDelete: Cascade)
  text            String
  category        DirectiveCategory  @default(REGIMEN_ADVICE)
  priority        Priority           @default(HIGH)
  acknowledged    Boolean            @default(false)
  acknowledgedAt  DateTime?
  createdAt       DateTime           @default(now())
}
```

---

## 4. MASTER REST API SPECIFICATION & ENDPOINT CONTRACTS

All API endpoints require `Authorization: Bearer <JWT>` except `/api/auth/login`, `/api/auth/register`, `/api/auth/send-otp`, and `/api/auth/verify-otp`.

### 4.1 Authentication (`/api/auth`)
- `POST /api/auth/check-email`: Inspects if an email exists and returns the associated role.
- `POST /api/auth/send-otp`: Dispatches a 6-digit cryptographic verification code via Resend email API.
- `POST /api/auth/verify-otp`: Validates the code, marks email verified, and generates a JWT.
- `POST /api/auth/login`: Authenticates credentials with lockout protection after 5 consecutive failures.
- `POST /api/auth/register`: Provisions User, Profile, and initial role metadata.
- `GET /api/auth/me`: Returns authenticated user context, profile IDs, and permissions.

### 4.2 Patient & Clinical Summary (`/api/patient`)
- `GET /api/patient/home-summary`: Returns aggregated polypharmacy risk, active medication count, ACB score, and daily reminder schedule.
- `GET /api/patient/timeline`: Full chronological audit trail of all active and discontinued medications with initiation and deprescribing dates.
- `GET /api/patient/profile`: Returns age, diagnosed conditions, drug allergies, and active doctor/caregiver connections.
- `PUT /api/patient/profile`: Updates conditions, allergies, age, and contact information.

### 4.3 Medication Management (`/api/medicine`)
- `GET /api/medicine/search?q=:query`: Real-time autocomplete resolving Indian brands and generic formulations.
- `POST /api/medicine`: Adds a new medicine, triggers 5-layer generic resolution, recalculates regimen risk, runs DDInter matrix, and emits Socket.IO event.
- `DELETE /api/medicine/:id`: Removes or discontinues a medication record.
- `PATCH /api/medicine/:id/reminders`: Toggles schedule alerts.
- `GET /api/medicine/imprints?imprint=:code`: Matches loose pill physical markings.
- `GET /api/medicine/side-effects/:name`: FDA OFFSIDES proportional reporting ratio (PRR) adverse event signals.

### 4.4 Symptom Logging & Cascade Mining (`/api/symptom`)
- `POST /api/symptom`: Logs a patient symptom and runs the Prescribing Cascade evaluation algorithm.
- `GET /api/symptom/history`: Returns past logged symptoms and suspected drug-induced etiologies.

### 4.5 Doctor Collaboration & Telemetry (`/api/connection`)
- `POST /api/connection/generate-share-code`: Creates a 6-digit time-expiring patient linking code.
- `POST /api/connection/claim-patient`: Physician links a patient record using their 6-digit code.
- `GET /api/connection/doctor-patients`: Returns list of connected patients with active regimen counts and critical interaction flags.
- `GET /api/connection/patient-summary/:id`: Detailed clinical summary including Organ Toxicity Radar, Beers 2023 alerts, ACB scores, and active regimen.
- `POST /api/connection/doctor-safety-check`: Pre-prescribing simulation checking interaction and polypharmacy score changes before issuing an Rx.
- `POST /api/connection/doctor-prescribe`: Directly issues a new prescription into the patient's active timeline.
- `POST /api/connection/doctor-deprescribe`: Executes a structured deprescribing order, marking the drug discontinued with rationale and tapering guidance.
- `POST /api/connection/doctor-substitute`: Atomically discontinues an existing drug and prescribes an alternative replacement.
- `POST /api/connection/directive`: Pushes a high-priority clinical instruction to the patient's dashboard.

### 4.6 Caregiver Telemetry (`/api/caregiver`)
- `POST /api/caregiver/claim-patient`: Caregiver links a dependent using their share code.
- `GET /api/caregiver/patients`: Returns list of managed patients.
- `GET /api/caregiver/patient-summary/:id`: Read-only daily dose schedule, compliance tracking, and emergency alert flags.

### 4.7 Prescription Multimodal OCR (`/api/scan`)
- `POST /api/scan/prescription`: 4-stage Gemini 1.5/2.0 multimodal vision analysis extracting drug names, strengths, dosages, and instructions from single or multi-sided photos.

---

## 5. REAL-TIME WEBSOCKET & SOCKET.IO ARCHITECTURE

PolySafe incorporates a dedicated Socket.IO event bus connecting patients, physicians, and caregivers in real-time.

```
┌──────────────────┐           Socket.IO Bus          ┌──────────────────┐
│  Doctor Action   │ ───────► (Node.js / Express) ────► Patient / Caregiver
│ (Deprescribe/Rx) │           Event Broadcast        │ (Instant Re-render)
└──────────────────┘                                  └──────────────────┘
```

### Emitted Socket Events:
1. **`medication_updated`**: Triggered on addition, dosage change, or discontinuation. Refreshes patient timeline and caregiver schedules immediately.
2. **`safety_status_updated`**: Emitted when regimen risk level or DDInter flags change.
3. **`directive_created`**: High-priority alert notifying the patient of a new doctor order.
4. **`connection_approved`**: Notifies doctor when patient grants record access.
5. **`timeline_synced`**: Real-time cross-tab synchronization of discontinued vs. active medications.

---

## 6. CLINICAL ENGINES & ALGORITHMIC SERVICES

### 6.1 5-Layer Indian Formulation & Generic Resolver
Resolves commercial branded medications (e.g. *Augmentin 625*, *Pan-D*, *Telma-H*, *Glycomet-GP2*) down to active international chemical salts:
- **Layer 1**: Direct In-Memory Alias Map (Exact brand match).
- **Layer 2**: Normalized String & Dosage Stripper (Removes strengths like "625mg", "D", "Plus").
- **Layer 3**: CDSCO Formulation Dictionary Lookup.
- **Layer 4**: Pre-computed AI Salt Cache (`ai-resolved-drugs.json`).
- **Layer 5**: Fallback Generative Pharmacology Parser.

### 6.2 WHO/NCI 5-Tier Drug Harm & Regimen Burden Engine
Classifies each medication and the overall cumulative regimen across 5 clinical harm levels:
- **L1 (Minimal / Safe)**: Vitamins, emollients, simple supplements.
- **L2 (Low Risk)**: Standard maintenance monotherapies with high safety margins.
- **L3 (Moderate Risk)**: Standard polypharmacy, narrow-index therapies, dual combinations.
- **L4 (High Risk)**: Potent cardiovascular, central nervous system, or immunosuppressive agents.
- **L5 (Severe / Critical)**: Chemotherapeutics, high-dose anticoagulants, multi-drug contraindications.

### 6.3 4-System Organ & System Toxicity Radar
Calculates targeted organ impact based on active drug metabolic pathways:
- **Renal System**: Evaluates NSAIDs, ACE inhibitors, diuretics, and aminoglycosides.
- **Hepatic System**: Evaluates Paracetamol, Statins, Azoles, and anticonvulsants.
- **Cardiovascular System**: Evaluates Antiarrhythmics, Beta-blockers, Calcium channel blockers, and QT-prolonging agents.
- **CNS / Cognitive System**: Evaluates Sedatives, Anticholinergics, Opioids, and Benzodiazepines.

### 6.4 Anticholinergic Cognitive Burden (ACB) Index
Evaluates regimen against validated ACB scales (0 to 3+ points per drug). Scores $ge 3$ trigger urgent clinical alerts for delirium, cognitive decline, and fall hazards in elderly patients.

### 6.5 High-Speed DDInter Interaction Search
Indexed bi-directional lookup across 222,385 interaction pairs with sub-millisecond query performance.

### 6.6 4-Stage Multimodal Prescription OCR Pipeline
Processes raw prescription photographs through token extraction, spelling correction against Indian brand dictionaries, and dosage schedule extraction.

### 6.7 Prescribing Cascade Detector
Maps patient-reported complaints (e.g. ankle swelling, dry cough, dizziness) against known drug adverse reaction profiles to identify iatrogenic cascades before secondary drugs are added.

### 6.8 FDA OFFSIDES Adverse Event Signal Miner
Mines 86+ real-world post-marketing adverse drug reactions with Proportional Reporting Ratios (PRR) $ge 2.0$.

### 6.9 Loose Pill Imprint Matcher
Identifies unidentified tablets based on physical alphanumeric markings, geometric shape, and color.

### 6.10 Herb-Drug Interaction Matrix
Cross-checks Ayurvedic, herbal, and dietary supplements (e.g. Ashwagandha, Ginkgo Biloba, St. John's Wort, Turmeric) against prescription drugs for bleeding and metabolic interaction risks.

---

## 7. CLINICAL DATASETS, SEED FILES & REFERENCE REGISTRIES

| Dataset File | Size | Records | Clinical Purpose |
| :--- | :--- | :--- | :--- |
| `ddinter.csv` | 13.1 MB | 222,385 pairs | Primary drug-drug interaction matrix |
| `ai-resolved-drugs.json` | 121.5 KB | 273 mappings | Indian brand-to-salt pre-computed mappings |
| `burden-scores.json` | 4.9 KB | 30 drugs | Anticholinergic Cognitive Burden (ACB) scale |
| `cascade-references.json` | 8.2 KB | 20 pairs | Common prescribing cascade etiologies |
| `offsides-sample.json` | 10.8 KB | 86 signals | FDA post-marketing adverse reaction signals |
| `herb-drug-interactions.json`| 9.7 KB | 24 pairs | Herbal and Ayurvedic interaction mechanisms |
| `pill-imprints.json` | 4.4 KB | 26 imprints | Physical loose tablet imprint matching |
| `indian-aliases-generated.json`| 77.0 KB | 251 synonyms | Normalized Indian brand phonetic aliases |

---

## 8. FRONTEND ARCHITECTURE & PAGE-BY-PAGE SPECIFICATIONS

The frontend is built with React 19, Vite 8, TailwindCSS 4, Framer Motion, and TanStack React Query.

### 14 Top-Level Application Pages:
1. **`LoginPage.jsx` (`/login`)**: Role switcher (Patient, Doctor, Caregiver), passwordless OTP email verification, and 1-click guest preview.
2. **`OnboardingPage.jsx` (`/onboarding`)**: Clinical baseline profile wizard capturing age, conditions, and drug allergies.
3. **`HomePage.jsx` (`/home` / `/`)**: Patient command center with live status banner, cumulative regimen risk meter, active medication cards with OFFSIDES expanders, and daily reminder schedule.
4. **`AddMedicinePage.jsx` (`/add-medicine`)**: Multimodal intake supporting single/two-sided photo scan, Indian brand search autocomplete, dosage presets, and pill imprint identifier.
5. **`RiskAnalysisPage.jsx` (`/risk-analysis`)**: Dual-audience risk breakdown with interactive audience toggle ("For You" vs "For the Doctor"), WHO/NCI harm gauges, and ACB score index.
6. **`LogSymptomPage.jsx` (`/log-symptom`)**: Symptom intake with quick-select complaint chips and onset date picker.
7. **`SymptomResultPage.jsx` (`/symptom-result`)**: Prescribing cascade detector alert displaying root offending drug probability and doctor conversation guide.
8. **`TimelinePage.jsx` (`/timeline`)**: Chronological audit trail showing active and discontinued medications with initiation dates, prescribing physicians, and taper notes.
9. **`InsightsPage.jsx` (`/insights`)**: Pharmacological category distribution charts and long-term polypharmacy risk trends rendered with Recharts.
10. **`ProfilePage.jsx` (`/profile`)**: Patient demographics, condition chips, allergy badges, connected doctor permissions, and account settings.
11. **`DoctorDashboardPage.jsx` (`/doctor-dashboard` / `/doctor` / `/doctor/patients`)**: Comprehensive physician workspace with patient search, two-tier patient header, 4-system organ toxicity radar, deprescribing assistant, and pre-prescribing safety simulator.
12. **`DoctorSharePage.jsx` (`/doctor-share` / `/share`)**: 6-digit patient share code generator with live QR code canvas for instant clinic check-in.
13. **`ConnectedPeoplePage.jsx` (`/connected-people` / `/connected`)**: Active clinical consent management allowing patients to approve or revoke doctor and caregiver access with 1 click.
14. **`CaregiverViewPage.jsx` (`/caregiver-view` / `/caregiver`)**: Non-clinical dashboard displaying patient daily schedule, missed dose alerts, and critical interaction warnings.

---

## 9. DOCTOR COMMAND CENTER ARCHITECTURE & CLINICAL MODALS

The Doctor Command Center (`DoctorDashboardPage.jsx`) serves as the primary workspace for attending physicians:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TWO-TIER PATIENT HEADER                         │
├──────────────────────────────────────┬─────────────────────────────────┤
│ [Avatar] Meet Chauhan                │ [SAFETY CHECK / PRESCRIBE]      │
│ [CONSENT APPROVED] · Age 21          │                                 │
├──────────────────────────────────────┼─────────────────────────────────┤
│ [Age: 21 yrs] [Conditions] [Allergy] │ [Report] [Substitute] [Directive│
└──────────────────────────────────────┴─────────────────────────────────┘
```

### Key Physician Tools:
1. **Organ & System Toxicity Radar**: 4 distinct elevated clinical cards tracking Renal, Hepatic, Cardiovascular, and CNS toxicity levels with flagged drug tags.
2. **Pre-Prescribing Safety Check (`DoctorSafetyCheckModal`)**: Real-time simulation checking interaction flags and score changes before prescribing. Features solid `rounded-2xl` surface and studio frosted glass backdrop (`bg-[#0f172a]/75 backdrop-blur-md`).
3. **Clinical Consultation & Risk Assessment Report (`ClinicalConsultationReportModal`)**: Complete print-ready pharmacovigilance summary with patient demographics, active regimen table, DDInter matrix, and physician sign-off line.
4. **Drug Substitution Order (`DrugSubstituteModal`)**: Atomically replaces an active medication with an alternative drug and records the clinical rationale.
5. **Write Clinical Directive (`WriteDirectivePanel`)**: Pushes priority instructions directly to the patient's dashboard.
6. **Deprescribing Assistant**: Identifies candidates for medication reduction based on Beers 2023 and STOPP/START criteria with 1-click discontinuation.

---

## 10. COMPONENT LIBRARY, MODALS & CLINICAL PANELS

- **`Card.jsx`**: Base container utilizing `bg-[var(--brand-surface)]`, clean `rounded-2xl` radius, and non-bleeding clinical elevation shadows (`--shadow-card`).
- **`DrugHarmBadge.jsx`**: Color-coded badges for WHO/NCI Tiers 1 through 5 with expandable OFFSIDES side effect profiles.
- **`LedIndicator.jsx`**: High-visibility hardware diode component supporting Safe (green), Caution (amber), Critical (red), and Online (cyan) states.
- **`PolySafeButton.jsx`**: Primary, secondary, and ghost buttons with subtle active depression and loading spinners.
- **`PolySafeInput.jsx` / `PolySafeSelect.jsx` / `PolySafeTextarea.jsx`**: Form controls with chassis backgrounds, subtle borders, and accessible focus rings.
- **`ClinicalLoader.jsx`**: Precision pulsing medical spinner with contextual status messages.
- **`GuestLockModal.jsx`**: Accessible modal prompting guest users to create an account before saving permanent records.

---

## 11. DESIGN SYSTEM, SURFACE TOKENS & NEOMORPHISM CALIBRATION

The design system is defined in `frontend/src/styles/tokens.css` and `frontend/src/index.css`:

```css
:root {
  /* Surface Tokens */
  --chassis:               #eef2f7;
  --chassis-dark:          #dde4ee;
  --chassis-panel:         #f7f9fc;
  --brand-surface:         #ffffff;
  --brand-card:            #ffffff;
  
  /* Text Tokens */
  --text-primary:          #0f1923;
  --text-secondary:        #3d5068;
  --text-muted:            #6b7f96;
  
  /* Role Colors */
  --accent-primary:        #0891b2; /* Medical Cyan */
  --role-doctor:           #2d6a9f; /* Clinical Slate Blue */
  --role-caregiver:        #2d8a6e; /* Protective Emerald */
  
  /* Clinical LED Indicators */
  --led-safe:              #16a34a;
  --led-caution:           #c07a0a;
  --led-critical:          #dc2626;
  
  /* Calibrated Soft Shadows (Zero Fog / Zero Bleed) */
  --shadow-card:           0 2px 8px -2px rgba(15, 25, 35, 0.08), 0 1px 3px 0 rgba(15, 25, 35, 0.04);
  --shadow-card-hover:     0 6px 16px -4px rgba(15, 25, 35, 0.12), 0 2px 6px -1px rgba(15, 25, 35, 0.06);
  --shadow-floating:       0 12px 24px -6px rgba(15, 25, 35, 0.14), 0 4px 10px -2px rgba(15, 25, 35, 0.06);
  --shadow-recessed:       inset 0 1px 3px 0 rgba(15, 25, 35, 0.06);
}
```

---

## 12. AUTHENTICATION, ROLE-BASED ACCESS CONTROL & SECURITY SAFEGUARDS

1. **Passwordless Email OTP**: Authenticates users with 6-digit codes sent via Resend API.
2. **Brute-Force Lockout Protection**: Automatically locks accounts for 15 minutes after 5 consecutive failed login attempts.
3. **Role-Based Access Control (RBAC)**: Enforces strict route and API isolation:
   - Patients can only access their personal medication records and consent links.
   - Doctors can only access patients who have explicitly shared an active 6-digit consent code.
   - Caregivers are restricted to read-only schedules and emergency alert flags.
4. **Automated Account Provisioning**: Verified automated test accounts:
   - Patient: `meetc8030@gmail.com`
   - Doctor: `meetchauhan286@gmail.com`
   - Caregiver: `caregiver.polysafe@gmail.com`

---

## 13. AUTOMATED VERIFICATION, INTEGRATION TESTS & QA PROTOCOLS

The repository includes end-to-end automated test suites verifying all platform layers:

```bash
# 1. Run master backend integration test suite (18 sequential steps)
node backend/test-all-endpoints.js

# 2. Verify multi-role authentication & OTP delivery
node backend/test-unified-3roles-auth.js

# 3. Verify user-specified clinical accounts
node backend/test-user-specified-accounts.js

# 4. Verify frontend production build
cd frontend && npm run build
```

---

## 14. ENVIRONMENT CONFIGURATION & PRODUCTION DEPLOYMENT

### Required Backend Environment Variables (`.env`):
```env
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/polysafe_db?schema=public"
JWT_SECRET="your-256-bit-cryptographic-jwt-secret"
RESEND_API_KEY="re_your_resend_api_key"
GEMINI_API_KEY="your_gemini_vision_api_key"
GROQ_API_KEY="your_groq_dual_explanation_api_key"
FRONTEND_URL="http://localhost:3000"
```

### Required Frontend Environment Variables:
```env
VITE_API_URL="http://localhost:5000/api"
VITE_SOCKET_URL="http://localhost:5000"
```

---

## 15. CHANGELOG & HISTORICAL MILESTONES

- **v5.2.0 (August 23, 2026)**:
  - Redesigned Doctor Command Center with non-overlapping 2-tier patient header.
  - Modernized Pre-Prescribing Simulator and Clinical Report modals with studio frosted glass backdrops (`bg-[#0f172a]/75 backdrop-blur-md`).
  - Added explicit `--brand-surface` token definitions resolving modal background bleed-through.
  - Implemented real-time Socket.IO timeline synchronization for discontinued and substituted medications.
- **v5.1.0 (August 22, 2026)**:
  - Cleaned skeuomorphic corner screws and vent slits in favor of refined clinical card elevation.
  - Calibrated non-bleeding shadow tokens across light and dark modes.
  - Added dedicated patient deduplication in doctor sidebar connections.
- **v5.0.0 (August 21, 2026)**:
  - Released Multi-Role Architecture (Patient, Doctor, Caregiver).
  - Added 4-System Organ Toxicity Radar and Geriatric Deprescribing Assistant.
