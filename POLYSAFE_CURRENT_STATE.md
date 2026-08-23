# PolySafe Master Technical Architecture & Current State Manual
**Document Version:** 4.0.0  
**Build Date:** August 21, 2026  
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
9. [Component Library, Modals & Clinical Panels](#9-component-library-modals--clinical-panels)
10. [Design System, Neomorphism & Zero-Emoji Iconography](#10-design-system-neomorphism--zero-emoji-iconography)
11. [Authentication, Role-Based Access Control & Security Safeguards](#11-authentication-role-based-access-control--security-safeguards)
12. [Automated Verification, Integration Tests & QA Protocols](#12-automated-verification-integration-tests--qa-protocols)
13. [Environment Configuration & Production Deployment](#13-environment-configuration--production-deployment)
14. [Changelog & Historical Milestones](#14-changelog--historical-milestones)

---

## 1. EXECUTIVE OVERVIEW & PLATFORM PHILOSOPHY

Polypharmacy—the concurrent use of five or more medications—is a leading cause of preventable hospitalizations, cognitive impairment, severe drug-drug adverse reactions, and iatrogenic prescribing cascades in aging populations. 

**PolySafe** is an enterprise-grade clinical safety and polypharmacy risk management platform engineered to resolve the fragmentation between patients, consulting physicians, and caregivers.

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
│ • OCR Rx Intake  │    │ • Organ Tox Radar│    │ • Daily Schedule │
│ • Regimen Risk   │    │ • Deprescribing  │    │ • Dose Reminders │
│ • Side Effects   │    │ • Drug Substitute│    │ • Critical Flags │
│ • Cascade Alerts │    │ • Safety Checks  │    │ • Read-Only      │
│ • QR Share Code  │    │ • Directives Push│    │   Access         │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

### Core Clinical Objectives:
1. **Prevent Adverse Drug Events (ADEs)**: Instant bi-directional cross-matching against 222,000+ validated pharmacological interaction pairs from DDInter.
2. **Halt Prescribing Cascades**: Detect when newly logged symptoms (e.g. peripheral edema, dry cough, hypokalemia) are actually side effects of active drugs (e.g. Amlodipine, Lisinopril, Furosemide) before a secondary drug is mistakenly prescribed.
3. **Decentralize Geriatric Deprescribing**: Equip doctors with STOPP/START criteria, gradual tapering protocol calculators, and 1-click drug substitution tools.
4. **Bridge the Indian Formulary Gap**: Resolve branded fixed-dose combination formulations (e.g. *Augmentin 625*, *Pan-D*, *Telma-H*, *Glycomet-GP2*) down to active international chemical salts and RxNorm CUIs.
5. **Mitigate Cumulative Cognitive Burden**: Track Anticholinergic Cognitive Burden (ACB) scores in real-time to lower delirium, memory impairment, and fall risks.

---

## 2. COMPLETE REPOSITORY DIRECTORY TREE

```
PolySafe/
├── backend/
│   ├── data/                                 # Seed datasets and pre-computed caches
│   │   ├── ai-resolved-drugs.json            # 273 pre-computed brand-to-salt mappings (121.5 KB)
│   │   ├── burden-scores.json                # 30 anticholinergic drugs with ACB scores 0-3 (4.9 KB)
│   │   ├── cascade-references.json           # 20 prescribing cascade clinical pairs (8.2 KB)
│   │   ├── ddinter.csv                       # 222,385 drug-drug interaction pairs (13.1 MB)
│   │   ├── ddinter_downloads_code_A.csv      # ATC Class A: Alimentary tract & metabolism (2.1 MB)
│   │   ├── ddinter_downloads_code_B.csv      # ATC Class B: Blood and blood forming organs (1.4 MB)
│   │   ├── ddinter_downloads_code_C.csv      # ATC Class C: Cardiovascular system (3.2 MB)
│   │   ├── ddinter_downloads_code_D.csv      # ATC Class D: Dermatologicals (0.6 MB)
│   │   ├── ddinter_downloads_code_G.csv      # ATC Class G: Genito-urinary system (0.8 MB)
│   │   ├── ddinter_downloads_code_H.csv      # ATC Class H: Systemic hormonal preparations (0.4 MB)
│   │   ├── ddinter_downloads_code_J.csv      # ATC Class J: Anti-infectives for systemic use (2.3 MB)
│   │   ├── ddinter_downloads_code_L.csv      # ATC Class L: Antineoplastic & immunomodulating (1.8 MB)
│   │   ├── ddinter_downloads_code_M.csv      # ATC Class M: Musculo-skeletal system (0.9 MB)
│   │   ├── ddinter_downloads_code_N.csv      # ATC Class N: Nervous system (3.8 MB)
│   │   ├── ddinter_downloads_code_P.csv      # ATC Class P: Antiparasitic products (0.3 MB)
│   │   ├── ddinter_downloads_code_R.csv      # ATC Class R: Respiratory system (1.2 MB)
│   │   ├── ddinter_downloads_code_S.csv      # ATC Class S: Sensory organs (0.5 MB)
│   │   ├── ddinter_downloads_code_V.csv      # ATC Class V: Various (0.2 MB)
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
│   ├── tmp/                                  # Temporary upload storage for Multer
│   ├── test-all-endpoints.js                 # 18-step master sequential integration test suite
│   ├── .env.example                          # Environment variable template
│   └── package.json                          # Backend dependencies and scripts
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── auth.js                       # Axios HTTP client with Bearer token interceptor
│   │   ├── assets/                           # Static assets, fonts, brand logos
│   │   ├── components/                       # Shared reusable UI component library
│   │   │   ├── Card.jsx                      # Neomorphic / glassmorphic card container
│   │   │   ├── DrugHarmBadge.jsx             # WHO/NCI 5-tier harm badges & OFFSIDES panels
│   │   │   ├── EmptyIllustrations.jsx        # Custom SVG illustrations for empty states
│   │   │   ├── ErrorBoundary.jsx             # React error boundary with fallback UI
│   │   │   ├── GuestLockModal.jsx            # Modal intercepting guest actions
│   │   │   ├── Navbar.jsx                    # Top navigation bar with role switcher & user menu
│   │   │   ├── PageTransition.jsx            # Framer Motion page entrance animations
│   │   │   ├── PolySafeInput.jsx             # Neomorphic text and number input field
│   │   │   ├── PolySafeSelect.jsx            # Neomorphic dropdown selector
│   │   │   ├── PolySafeTextarea.jsx          # Neomorphic multiline text input
│   │   │   ├── ProtectedRoute.jsx            # Auth and role route guard
│   │   │   ├── SignOutConfirmButton.jsx      # Confirmation modal for signing out
│   │   │   └── Skeletons.jsx                 # Pulsing shimmer loading skeletons
│   │   ├── context/
│   │   │   └── AuthContext.jsx               # Global React auth state, token sync, guest mode
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
│   │   ├── utils/
│   │   │   └── toast.js                      # Sonner toast notifications helper
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
└── README.md                                 # Public overview and quickstart guide
```

---

## 3. FULL DATABASE ARCHITECTURE & PRISMA SCHEMA

The database layer utilizes Prisma ORM against a relational PostgreSQL engine. All relations enforce referential integrity with cascading deletes for patient-owned sub-resources and soft-delete safeguards for clinical audit trails.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ─── ENUMS ───────────────────────────────────────────────────────────────────

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

// ─── AUTHENTICATION & USER MANAGEMENT ────────────────────────────────────────

model User {
  id                  String       @id @default(uuid())
  name                String       @default("PolySafe User")
  phone               String?      @unique
  email               String       @unique
  passwordHash        String?
  role                Role         @default(PATIENT)
  failedLoginAttempts Int          @default(0)
  lockedUntil         DateTime?
  createdAt           DateTime     @default(now())

  patient             Patient?
  medicinesAdded      Medicine[]   @relation("AddedByUser")
  connections         Connection[] @relation("ConnectedUser")
}

model OtpCode {
  id        String   @id @default(uuid())
  email     String
  code      String
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([email])
  @@index([email, code])
  @@map("otp_code")
}

model PendingSignup {
  id           String   @id @default(uuid())
  name         String
  email        String
  passwordHash String
  role         Role     @default(PATIENT)
  code         String
  expiresAt    DateTime
  used         Boolean  @default(false)
  createdAt    DateTime @default(now())

  @@index([email])
  @@index([email, code])
  @@map("pending_signup")
}

// ─── PATIENT PROFILE & MEDICATION REGIMEN ────────────────────────────────────

model Patient {
  id               String            @id @default(uuid())
  userId           String            @unique
  user             User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  age              Int
  conditions       String[]          // e.g. ["diabetes", "hypertension", "chronic_kidney_disease"]
  allergies        String[]          // e.g. ["penicillin", "aspirin", "sulfa_drugs"]

  medicines        Medicine[]
  symptoms         Symptom[]
  connections      Connection[]
  interactionFlags InteractionFlag[]
}

model Medicine {
  id               String            @id @default(uuid())
  patientId        String
  patient          Patient           @relation(fields: [patientId], references: [id], onDelete: Cascade)

  name             String
  standardizedCode String?           // RxNorm Concept Unique Identifier (RxCUI)
  type             MedicineType      @default(PRESCRIPTION)
  addedBy          String            // User ID of person who added the medicine
  addedByUser      User              @relation("AddedByUser", fields: [addedBy], references: [id])
  dateAdded        DateTime          @default(now())
  dosage           String?           // e.g. "500mg", "10mg once daily"
  harmLevel        Int               @default(3) // 1=Low, 2=Mild, 3=Moderate, 4=High, 5=Critical
  removedAt        DateTime?         // Soft-delete timestamp: null = active

  // Extended Clinical Metadata Fields
  frequency        String?           // e.g. "Once daily (OD)", "Twice daily (BD)", "At bedtime (HS)"
  foodInstruction  String?           // "with_food", "before_food", "after_food", "empty_stomach"
  prescribedBy     String?           // Prescribing physician name or "Self-prescribed"
  notes            String?           // Patient's clinical instructions & personal reminders
  reminderEnabled  Boolean           @default(false) // Daily push notification reminder toggle
  refillDate       DateTime?         // Next prescription refill / renewal date

  symptoms              Symptom[]         @relation("PossibleCauseMedicine")
  interactionFlagsAsA   InteractionFlag[] @relation("MedicineA")
  interactionFlagsAsB   InteractionFlag[] @relation("MedicineB")
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

// ─── CONSENT & ACCESS MANAGEMENT ─────────────────────────────────────────────

model Connection {
  id              String           @id @default(uuid())
  patientId       String
  patient         Patient          @relation(fields: [patientId], references: [id], onDelete: Cascade)
  connectedUserId String?
  connectedUser   User?            @relation("ConnectedUser", fields: [connectedUserId], references: [id], onDelete: SetNull)
  role            ConnectionRole   @default(DOCTOR)
  status          ConnectionStatus @default(PENDING)
  shareCode       String?          @unique
  expiresAt       DateTime?
  createdAt       DateTime         @default(now())

  @@index([shareCode])
}

// ─── CLINICAL FLAGS & KNOWLEDGE BASES ────────────────────────────────────────

model InteractionFlag {
  id                  String   @id @default(uuid())
  patientId           String
  patient             Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  medicineAId         String
  medicineA           Medicine @relation("MedicineA", fields: [medicineAId], references: [id], onDelete: Cascade)
  medicineBId         String
  medicineB           Medicine @relation("MedicineB", fields: [medicineBId], references: [id], onDelete: Cascade)
  severity            String   // "Minor", "Moderate", "Major", "Contraindicated"
  clinicalExplanation String   // Deep pharmacology explanation for clinicians
  plainExplanation    String   // Plain language explanation for patients
  generatedBy         String?  // LLM model or rule identifier (e.g. "groq-llama-3.3-70b")
  dateFlagged         DateTime @default(now())
}

model DrugInteractionReference {
  id        Int     @id @default(autoincrement())
  drugAName String
  drugBName String
  severity  String  // "Minor", "Moderate", "Major", "Contraindicated"
  ddinterId String? // Original DDInter dataset identifier

  @@index([drugAName, drugBName])
  @@index([drugBName, drugAName])
  @@map("drug_interaction_reference")
}

model BurdenScore {
  id       Int    @id @default(autoincrement())
  drugName String @unique
  score    Int    // Anticholinergic Cognitive Burden score (0, 1, 2, or 3)

  @@index([drugName])
  @@map("burden_score")
}

model CascadeReference {
  id                  Int    @id @default(autoincrement())
  symptomKeyword      String // e.g. "edema", "cough", "constipation", "dizziness"
  causingDrugCategory String // e.g. "Calcium Channel Blockers", "ACE Inhibitors"
  description         String // Clinical explanation of cascade mechanism

  @@index([symptomKeyword])
  @@map("cascade_reference")
}

model HerbDrugReference {
  id          Int    @id @default(autoincrement())
  herbName    String // e.g. "Ashwagandha", "Ginkgo Biloba", "St. John's Wort"
  drugName    String // e.g. "Warfarin", "Clopidogrel", "Sertraline"
  severity    String // "Moderate", "Major", "Contraindicated"
  description String // Mechanistic rationale for adverse interaction

  @@index([herbName])
  @@index([drugName])
  @@map("herb_drug_reference")
}

model PillImprint {
  id          String  @id @default(uuid())
  imprintCode String  // Physical debossed/embossed text (e.g. "L484", "M365")
  drugName    String  // Identified generic or brand name
  strength    String? // e.g. "500mg", "10mg/325mg"
  shape       String? // "round", "oval", "capsule", "rectangle"
  color       String? // "white", "yellow", "blue", "red", "orange"

  @@index([imprintCode])
  @@map("pill_imprint")
}

model DrugSideEffect {
  id            Int      @id @default(autoincrement())
  rxcui         String?  // Standardized RxCUI concept
  drugName      String   // Chemical entity name
  sideEffect    String   // Adverse event term from MedDRA / FAERS
  prr           Float    // Proportional Reporting Ratio (PRR >= 2.0 = statistically significant)
  reportingFreq Float?   // Percentage frequency in clinical trial / FAERS cohorts
  severity      String?  // "Mild", "Moderate", "Severe"
  source        String   @default("OFFSIDES_FDA")
  createdAt     DateTime @default(now())

  @@index([drugName])
  @@index([rxcui])
  @@index([drugName, prr])
  @@map("drug_side_effect")
}
```

---

## 4. MASTER REST API SPECIFICATION & ENDPOINT CONTRACTS

All API endpoints return JSON. Authenticated endpoints require the header `Authorization: Bearer <token>`.

### 4.1 Authentication (`/auth`)

#### `POST /auth/check-email`
- **Auth:** Public
- **Request Body:** `{ "email": "patient@example.com", "role": "PATIENT" }`
- **Response 200:** `{ "exists": true, "hasPassword": true }`

#### `POST /auth/patient/signup-send-otp`
- **Auth:** Public
- **Request Body:** `{ "name": "Priya Sharma", "email": "priya@example.com", "password": "Password123!", "role": "PATIENT" }`
- **Response 200:** `{ "message": "Verification code sent to your email." }`

#### `POST /auth/patient/verify-signup-otp`
- **Auth:** Public
- **Request Body:** `{ "email": "priya@example.com", "code": "482910" }`
- **Response 200:** `{ "token": "jwt_string...", "user": { "id": "uuid", "name": "Priya Sharma", "email": "priya@example.com", "role": "PATIENT" } }`

#### `POST /auth/patient/login`
- **Auth:** Public
- **Rate Limit:** 5 consecutive failures locks account for 20 seconds
- **Request Body:** `{ "email": "priya@example.com", "password": "Password123!" }`
- **Response 200:** `{ "token": "jwt_string...", "user": { "id": "uuid", "name": "Priya Sharma", "email": "priya@example.com", "role": "PATIENT" } }`

#### `POST /auth/doctor/signup`
- **Auth:** Public
- **Request Body:** `{ "name": "Dr. Rajesh Gupta", "email": "dr.gupta@hospital.org", "password": "SecurePassword123!", "medicalRegNumber": "MCI-48201-2012" }`
- **Response 201:** `{ "token": "jwt_string...", "user": { "id": "uuid", "name": "Dr. Rajesh Gupta", "role": "DOCTOR" } }`

#### `POST /auth/doctor/login`
- **Auth:** Public
- **Request Body:** `{ "email": "dr.gupta@hospital.org", "password": "SecurePassword123!" }`
- **Response 200:** `{ "token": "jwt_string...", "user": { "id": "uuid", "name": "Dr. Rajesh Gupta", "role": "DOCTOR" } }`

#### `GET /auth/me`
- **Auth:** Bearer Token (Any Role)
- **Response 200:** `{ "user": { "id": "uuid", "name": "Priya Sharma", "email": "priya@example.com", "role": "PATIENT", "patient": { "id": "uuid", "age": 68, "conditions": ["hypertension"], "allergies": ["aspirin"] } } }`

---

### 4.2 Patient Baseline & Timeline (`/patient`)

#### `POST /patient/profile`
- **Auth:** `PATIENT`
- **Request Body:** `{ "age": 68, "conditions": ["hypertension", "type_2_diabetes"], "allergies": ["penicillin"] }`
- **Response 200:** `{ "message": "Profile updated successfully.", "patient": { "id": "uuid", "age": 68, "conditions": [...], "allergies": [...] } }`

#### `GET /patient/home-summary`
- **Auth:** `PATIENT`
- **Response 200:**
```json
{
  "status": "CAUTION",
  "activeMedicationCount": 4,
  "activeFlags": [
    {
      "id": "uuid",
      "severity": "Major",
      "medicineA": { "name": "Warfarin", "dosage": "5mg" },
      "medicineB": { "name": "Aspirin", "dosage": "81mg" },
      "plainExplanation": "Taking Aspirin together with Warfarin significantly increases your risk of internal stomach bleeding."
    }
  ],
  "regimenRisk": {
    "score": 4.2,
    "level": "L5 Critical Risk",
    "badgeColor": "red",
    "explanation": "Active regimen contains Narrow Therapeutic Index anticoagulant Warfarin."
  },
  "anticholinergicBurden": {
    "totalScore": 2,
    "level": "Moderate Risk",
    "explanation": "Cumulative sedative and memory burden present from active regimen."
  }
}
```

#### `GET /patient/timeline`
- **Auth:** `PATIENT`, `DOCTOR`, `CAREGIVER`
- **Response 200:** Returns chronological array of medicines with `provenance` metadata ("Patient Self-Added", "Doctor Prescribed", "Doctor Substituted", "Caregiver Added") and `discontinued` status flag.

---

### 4.3 Medication Lifecycle (`/medicine`)

#### `POST /medicine`
- **Auth:** `PATIENT`, `CAREGIVER`
- **Request Body:**
```json
{
  "name": "Augmentin 625 Duo",
  "dosage": "625mg twice daily",
  "type": "PRESCRIPTION",
  "frequency": "Twice daily (BD)",
  "foodInstruction": "with_food",
  "prescribedBy": "Dr. Rajesh Gupta",
  "notes": "Complete full 7-day course without skipping.",
  "reminderEnabled": true,
  "refillDate": "2026-09-01",
  "forceUpdate": false
}
```
- **Response 201:** Returns created medicine with resolved chemical salts, assigned WHO harm level, and initiates asynchronous interaction evaluation.

#### `PUT /medicine/:id`
- **Auth:** `PATIENT`
- **Request Body:** Allows editing `dosage`, `type`, `frequency`, `foodInstruction`, `prescribedBy`, `notes`, `reminderEnabled`, and `refillDate`. Locks `name` to protect historical audit trails.
- **Response 200:** `{ "message": "Medicine updated successfully.", "medicine": { ... } }`

#### `DELETE /medicine/:id`
- **Auth:** `PATIENT`, `CAREGIVER`
- **Response 200:** Stamps `removedAt = new Date()` (soft-delete), removes active interaction flags, and recalculates regimen burden.

#### `GET /medicine/search?q=telma`
- **Auth:** Any Role
- **Response 200:** Autocomplete array matching Indian formulations, generics, dosage strengths, and WHO harm level ratings.

#### `GET /medicine/:id/sideeffects`
- **Auth:** `PATIENT`, `DOCTOR`
- **Response 200:** Returns adverse reactions mined from FDA OFFSIDES with PRR $\ge 2.0$, grouped by frequency and severity.

#### `POST /medicine/identify-pill`
- **Auth:** Any Role
- **Request Body:** `{ "imprint": "L484", "shape": "oval", "color": "white" }`
- **Response 200:** `{ "matched": true, "drugName": "Acetaminophen", "strength": "500mg", "manufacturer": "Major Pharmaceuticals" }`

---

### 4.4 Prescription Multimodal OCR (`/medicine/scan`)

#### `POST /medicine/scan`
- **Auth:** `PATIENT`, `CAREGIVER`
- **Payload:** `multipart/form-data` with file field `image`
- **Response 200:**
```json
{
  "success": true,
  "engine": "gemini-2.5-flash-vision",
  "data": {
    "drug_name": "Pan-D",
    "generic_name": "Pantoprazole 40mg + Domperidone 30mg",
    "strength": "40mg / 30mg",
    "form": "Capsule",
    "frequency": "Once daily before breakfast",
    "duration": "14 days",
    "prescriber": "Dr. S. K. Mehta, MD",
    "confidence": "High",
    "rxNormVerified": true
  }
}
```

---

### 4.5 Doctor Portal & Clinical Governance (`/connection`)

#### `POST /connection/generate-code`
- **Auth:** `PATIENT`
- **Response 200:** `{ "shareCode": "948201", "expiresAt": "2026-08-21T17:15:00.000Z", "qrDataUrl": "data:image/png;base64,..." }`

#### `POST /connection/claim-code`
- **Auth:** `DOCTOR`
- **Request Body:** `{ "code": "948201" }`
- **Response 200:** Links physician to patient in `APPROVED` status for clinical consultation.

#### `POST /connection/doctor-safety-check`
- **Auth:** `DOCTOR`
- **Request Body:** `{ "patientId": "uuid", "proposedDrugName": "Ciprofloxacin 500mg" }`
- **Response 200:** Simulates prescribing impact; returns decision (`SAFE`, `CAUTION`, `CRITICAL`), conflicting drugs, and projected regimen risk score.

#### `POST /connection/doctor-substitute`
- **Auth:** `DOCTOR`
- **Request Body:**
```json
{
  "patientId": "uuid",
  "oldMedicineId": "uuid-of-amlodipine",
  "substituteDrugName": "Ramipril",
  "substituteDosage": "5mg once daily",
  "rationale": "Patient developed severe bilateral ankle edema secondary to Amlodipine."
}
```
- **Response 200:** Atomically discontinues old drug, creates substitute drug, executes full interaction re-check, and emits real-time event to patient.

#### `POST /connection/doctor-directive`
- **Auth:** `DOCTOR`
- **Request Body:**
```json
{
  "patientId": "uuid",
  "text": "Avoid grapefruit and high-potassium salt substitutes while taking Ramipril. Check serum creatinine in 14 days.",
  "category": "DIETARY_INSTRUCTION",
  "priority": "HIGH"
}
```
- **Response 200:** Persists clinical order and broadcasts `DIRECTIVE_ISSUED` event to patient's active session.

#### `GET /connection/doctor-patient/:id/clinical-summary`
- **Auth:** `DOCTOR`
- **Response 200:** Returns complete clinical consultation summary including:
  - Active & historical medications
  - Detected DDInter flags & plain explanations
  - Anticholinergic Cognitive Burden score
  - 4-System Organ Toxicity Breakdown (`renal`, `hepatic`, `cardiovascular`, `cnsCognitive`)

---

## 5. REAL-TIME WEBSOCKET & SOCKET.IO ARCHITECTURE

PolySafe maintains persistent WebSocket channels over Socket.IO (v4.8.3) to provide instant clinical alerts without polling.

```
┌─────────────────┐                               ┌─────────────────┐
│ Doctor Actions  │                               │ Patient Browser │
│ (Dashboard UI)  │                               │   (Home Page)   │
└────────┬────────┘                               └────────▲────────┘
         │                                                 │
         │ POST /connection/doctor-*                       │ WS Event Push
         ▼                                                 │
┌──────────────────────────────────────────────────────────┴────────┐
│                        SOCKET.IO SERVER                           │
│  Rooms: 'patient-{patientId}', 'patient-{userId}'                 │
│                                                                   │
│  Events:                                                          │
│  • DOCTOR_PRESCRIBED    • DOCTOR_SUBSTITUTED                      │
│  • DOCTOR_DEPRESCRIBED  • DIRECTIVE_ISSUED                        │
│  • interaction-checked  • interaction-check-result                │
└───────────────────────────────────────────────────────────────────┘
```

### Event Payload Catalog:

#### 1. `DOCTOR_SUBSTITUTED`
```json
{
  "action": "DOCTOR_SUBSTITUTED",
  "patientId": "uuid",
  "doctorName": "Dr. Rajesh Gupta",
  "discontinued": "Amlodipine 10mg",
  "prescribed": "Ramipril 5mg",
  "rationale": "Ankle edema resolution.",
  "issuedAt": "2026-08-21T16:30:00.000Z"
}
```

#### 2. `DIRECTIVE_ISSUED`
```json
{
  "action": "DIRECTIVE_ISSUED",
  "patientId": "uuid",
  "doctorName": "Dr. Rajesh Gupta",
  "text": "Avoid grapefruit juice. Schedule repeat potassium test.",
  "category": "DIETARY_INSTRUCTION",
  "priority": "HIGH",
  "issuedAt": "2026-08-21T16:31:00.000Z"
}
```

#### 3. `interaction-checked`
Emitted immediately after asynchronous interaction analysis completes in the background following medication ingestion.

---

## 6. CLINICAL ENGINES & ALGORITHMIC SERVICES

### 6.1 5-Layer Indian Formulation & Generic Resolver

Branded pharmaceuticals in India often contain multiple active ingredients under proprietary trade names. The resolver decomposes trade names into standardized international generic entities via five sequential layers:

```
Input Drug String (e.g. "Augmentin 625 Duo")
   │
   ▼
[Layer 1: Indian Formulary Map (0ms)] ──────────► Match? ──► Return Chemical Salts
   │ No
   ▼
[Layer 2: Local AI Cache (0ms)] ────────────────► Match? ──► Return Cached RxNorm
   │ No
   ▼
[Layer 3: Fuzzy Levenshtein Distance <= 2] ────► Match? ──► Correct Typo & Return
   │ No
   ▼
[Layer 4: NLM RxNorm REST API] ─────────────────► Match? ──► Return Standard RxCUI
   │ No
   ▼
[Layer 5: Groq LLM Clinical Decomposer] ────────► Fallback ──► Parse Active Salts & Class
```

---

### 6.2 WHO/NCI 5-Tier Drug Harm & Regimen Burden Engine

Drugs are assigned a base intrinsic harm level according to clinical toxicity risk and therapeutic window:
- **Level 1 (Low Risk)**: Multivitamins, saline nasal sprays, simple antacids.
- **Level 2 (Mild Risk)**: Metformin, Cetirizine, Paracetamol (at therapeutic doses).
- **Level 3 (Moderate Risk)**: ACE inhibitors, Beta-blockers, Statins, Proton Pump Inhibitors.
- **Level 4 (High Risk)**: High-potency NSAIDs, Loop Diuretics, Oral Corticosteroids, Sedatives.
- **Level 5 (Critical Risk / NTI)**: Narrow Therapeutic Index drugs requiring therapeutic blood monitoring (Warfarin, Digoxin, Lithium, Phenytoin, Theophylline).

**Regimen Harm Formula:**
$$\text{Regimen Score} = \max\left( \text{Harm}_{\text{max}}, \frac{\sum_{i=1}^n \text{Harm}_i}{n} + 0.3 \times N_{\text{Major Flags}} \right)$$

*Rule: If any active drug is Level 5, the entire regimen escalates to **L5 Critical Risk** automatically.*

---

### 6.3 4-System Organ & System Toxicity Radar

Quantifies cumulative physiological strain imposed on vital organ systems:
1. **Renal Toxicity (0–100)**: Evaluates nephrotoxic drug burden (e.g. triple whammy: ACEi + Diuretic + NSAID).
2. **Hepatic Toxicity (0–100)**: Evaluates cytochrome P450 load, statin-fibrate co-administration, and high-dose acetaminophen.
3. **Cardiovascular Toxicity (0–100)**: Quantifies combined QT-prolongation risk (e.g. Azithromycin + Ondansetron) and proarrhythmic burden.
4. **CNS / Cognitive Burden (0–100)**: Evaluates central anticholinergic and sedative load linked to delirium and cognitive decline.

---

### 6.4 Anticholinergic Cognitive Burden (ACB) Index

Evaluates active medications against the validated 0–3 ACB scale:
- **Score 0**: No anticholinergic properties.
- **Score 1**: Potential anticholinergic effects (e.g. Atenolol, Ranitidine, Furosemide).
- **Score 2**: Significant anticholinergic effects (e.g. Belladonna, Carbamazepine).
- **Score 3**: Severe, high-potency anticholinergics (e.g. Amitriptyline, Oxybutynin, Diphenhydramine, Chlorpheniramine).

*Cumulative ACB $\ge 3$ triggers a **High Cognitive / Fall Risk Alert** for elderly patients.*

---

### 6.5 High-Speed DDInter Interaction Search

- Indexed on both `(drugAName, drugBName)` and `(drugBName, drugAName)` for sub-5 millisecond response times.
- Evaluates severe pairwise combinations (e.g. Warfarin + NSAID $\rightarrow$ severe gastrointestinal hemorrhage; Potassium-sparing diuretic + ACEi $\rightarrow$ fatal hyperkalemia).

---

### 6.6 4-Stage Multimodal Prescription OCR Pipeline

1. **Stage 1 (Primary)**: Google Gemini 2.5 Flash Vision (`@google/generative-ai`) parses prescription handwriting and medicine packaging into rigid JSON schema.
2. **Stage 2 (RxNorm Validation)**: Validates extracted drug names against NLM RxNav to discard non-drug noise.
3. **Stage 3 (Tesseract Offline Fallback)**: Runs local `tesseract-ocr` binary if cloud AI is unavailable.
4. **Stage 4 (Cloud OCR.space Fallback)**: Secondary cloud OCR endpoint for low-contrast images.
5. **Non-Medicine Rejection**: Blocks non-pharmaceutical images with HTTP 400.

---

### 6.7 Prescribing Cascade Detector

Correlates newly logged symptoms against known adverse effect profiles of active medications:
- *Amlodipine* $\rightarrow$ logs "ankle swelling" $\rightarrow$ alerts against adding *Furosemide*.
- *Lisinopril* $\rightarrow$ logs "chronic dry cough" $\rightarrow$ alerts against adding *Dextromethorphan* / *Antihistamines*.
- *NSAIDs* $\rightarrow$ logs "elevated blood pressure" $\rightarrow$ alerts against escalating antihypertensive doses.

---

### 6.8 FDA OFFSIDES Adverse Event Signal Miner

Mines statistically significant post-marketing adverse drug events from FAERS where the Proportional Reporting Ratio satisfies $\text{PRR} \ge 2.0$ ($p < 0.05$).

---

### 6.9 Loose Pill Imprint Matcher

Identifies unidentified pills found in unmarked bottles using debossed alphanumeric imprints, pill shape, and color codes (e.g. imprint `"L484"` + `"white"` + `"oval"` $\rightarrow$ *Acetaminophen 500mg*).

---

### 6.10 Herb-Drug Interaction Matrix

Cross-checks botanical supplements and traditional Ayurvedic / herbal remedies against allopathic regimens:
- *Ashwagandha* + *Benzodiazepines* $\rightarrow$ excessive CNS sedation.
- *Ginkgo Biloba* + *Antiplatelets / Anticoagulants* $\rightarrow$ elevated hemorrhage risk.
- *St. John's Wort* + *SSRIs / Statins* $\rightarrow$ Serotonin syndrome / CYP3A4 induction.

---

## 7. CLINICAL DATASETS, SEED FILES & REFERENCE REGISTRIES

| Registry File | Size | Records | Clinical Purpose |
|---|---|---|---|
| `ddinter.csv` | 13.1 MB | 222,385 pairs | Validated drug-drug interaction matrix |
| `indianDrugs.js` | 13.5 KB | 35+ brands / 251 aliases | CDSCO Indian brand formulations |
| `harm-levels.json` | 8.5 KB | 205 drugs | WHO/NCI 5-tier harm indices |
| `burden-scores.json` | 4.9 KB | 30 drugs | Validated ACB cognitive burden scores |
| `cascade-references.json` | 8.2 KB | 20 pairs | Documented prescribing cascade pathways |
| `herb-drug-interactions.json` | 9.7 KB | 24 pairs | Botanical-allopathic interaction mechanisms |
| `pill-imprints.json` | 4.4 KB | 26 imprints | Loose tablet & capsule physical imprints |
| `offsides-sample.json` | 10.8 KB | 86 events | FDA FAERS adverse drug signals (PRR $\ge 2.0$) |
| `ai-resolved-drugs.json` | 121.5 KB | 273 mappings | Brand-to-salt pre-computed disk cache |
| `drugbank-id-cache.json` | 43.7 KB | 1,514 mappings | DrugBank to RxNorm cross-references |

---

## 8. FRONTEND ARCHITECTURE & PAGE-BY-PAGE SPECIFICATIONS

The client application is built with **React 19**, **Vite 8**, **TailwindCSS 4**, **@tanstack/react-query**, and **Framer Motion**.

### Summary of Application Pages:

1. **`LoginPage.jsx` (`/login`)**:
   - Role switcher tabs: Patient, Doctor, Caregiver.
   - Interactive email verification with automatic OTP code box focus.
   - Returning user password authentication with 5-attempt lockout notification.
   - 1-Click Guest Exploration Mode.

2. **`OnboardingPage.jsx` (`/onboarding`)**:
   - Step 1: Patient age input.
   - Step 2: Chronic conditions tag cloud (Hypertension, Diabetes, CKD, CAD, Asthma).
   - Step 3: Drug allergy tag cloud (Penicillin, Sulfa, Aspirin, Cephalosporins).

3. **`HomePage.jsx` (`/home`)**:
   - **Physician Directives Banner**: Live Socket.IO updates for prescriptions, substitutions, and directives.
   - **Status Banner**: Triaged SAFE (green), CAUTION (amber), or CRITICAL (red) status indicator.
   - **WHO/NCI Regimen Harm Meter**: Animated L1–L5 gauge with score breakdown.
   - **Active Medication Cards**: Displays dosage, type, harm badge, food timing, and reminder status.
   - **Expandable Adverse Reactions**: FDA OFFSIDES side effects explorer per medication.
   - **3-Tab Edit Medication Modal**: Full clinical editing suite.

4. **`AddMedicinePage.jsx` (`/add-medicine`)**:
   - Camera & file prescription intake with Gemini Vision Structured Review Card.
   - 30+ Indian brand autocomplete with real-time harm level badges.
   - Loose Pill Imprint identifier.
   - Duplicate dosage conflict modal with `forceUpdate` override.

5. **`RiskAnalysisPage.jsx` (`/risk-analysis`)**:
   - Dual Tab Architecture: "For You" (plain language) vs "For the Doctor" (pharmacological mechanisms).
   - Anticholinergic Cognitive Burden meter (0–3 ACB).
   - Detailed DDInter interaction cards with clinical citations.

6. **`LogSymptomPage.jsx` (`/log-symptom`)**:
   - Quick-select complaint chips (Swollen ankles, Dry cough, Muscle cramps, Dizziness).
   - Freeform symptom description input with onset date picker.

7. **`SymptomResultPage.jsx` (`/symptom-result`)**:
   - Prescribing Cascade root-cause alert.
   - Identifies offending active drug and warns against adding treat-the-side-effect prescriptions.

8. **`TimelinePage.jsx` (`/timeline`)**:
   - Vertical animated prescription audit trail with provenance pills.
   - Soft-delete and discontinue actions.

9. **`DoctorDashboardPage.jsx` (`/doctor-dashboard`)**:
   - 6-digit patient share code claiming.
   - Connected patient roster with real-time status.
   - **Organ & System Toxicity Radar**: 4-system organ burden score bars.
   - **Clinical Deprescribing Assistant**: STOPP/START criteria & tapering protocols.
   - **1-Click Drug Substitution Modal**: Atomically swaps medications with interaction re-checks.
   - **Write Clinical Directive Panel**: Publishes urgent, high, and normal priority orders.
   - **Print-Ready Clinical Report Modal**: Full consultation report view for printing or PDF export.
   - **Pre-Prescribing Safety Check Modal**: Evaluates proposed drugs before prescription.

10. **`DoctorSharePage.jsx` (`/share`)**:
    - High-contrast 6-digit temporary share code.
    - Scannable QR Code canvas with 15-minute live countdown timer.

11. **`CaregiverViewPage.jsx` (`/caregiver-view`)**:
    - Simplified non-clinical daily schedule for elderly relatives.
    - Critical safety flags and dose reminders.

12. **`ConnectedPeoplePage.jsx` (`/connected`)**:
    - Consent management center listing approved physicians and caregivers.
    - 1-Click access revocation.

13. **`ProfilePage.jsx` (`/profile`)**:
    - Baseline medical profile editor (age, conditions, allergies).
    - Account credentials and session logout.

14. **`InsightsPage.jsx` (`/insights`)**:
    - Interactive Recharts analytics displaying monthly polypharmacy trends and drug class breakdown.

---

## 9. COMPONENT LIBRARY, MODALS & CLINICAL PANELS

### Key Modular Components (`frontend/src/components/`):

1. **`Card.jsx`**: Glassmorphic / neomorphic card container with subtle borders and ambient double shadows.
2. **`DrugHarmBadge.jsx`**: Color-coded WHO/NCI 5-tier harm badges (L1 Low to L5 Critical) and expandable OFFSIDES adverse effect panels.
3. **`PhysicianDirectivesBanner` (in `HomePage.jsx`)**: Real-time event receiver showing color-coded dismissible cards with live green pulse dots.
4. **`EditMedicineModal` (in `HomePage.jsx`)**: 3-Tab rich clinical editor:
   - **Tab 1: Basic Info**: Locked medicine name, type toggle (Rx, OTC, Herbal), dosage, prescriber.
   - **Tab 2: Schedule & Timing**: 12 frequency options, 4 food timing cards (`Utensils`, `Clock`, `Coffee`, `Droplets`), refill date picker, reminder switch.
   - **Tab 3: Clinical Notes**: 500-char notes textarea, 8 quick-add chips, settings summary.
5. **`DoctorSafetyCheckModal` (in `DoctorDashboardPage.jsx`)**: Interactive modal allowing doctors to test candidate drugs against a patient's active regimen.
6. **`DrugSubstituteModal` (in `DoctorDashboardPage.jsx`)**: 1-Click drug swap tool.
7. **`OrganToxicityPanel` (in `DoctorDashboardPage.jsx`)**: 4-system organ risk score bars with level indicators.
8. **`WriteDirectivePanel` (in `DoctorDashboardPage.jsx`)**: Form to issue clinical directives.
9. **`EmptyIllustrations.jsx`**: Custom themed SVG illustrations for empty patient, medicine, and flag lists.
10. **`Skeletons.jsx`**: Pulsing placeholder loading states for dashboards and detail views.

---

## 10. DESIGN SYSTEM — INDUSTRIAL SKEUOMORPHISM (SOFT UI) & ZERO-EMOJI ICONOGRAPHY

### Industrial Skeuomorphism (Soft UI) Visual Philosophy
PolySafe v4.0 implements an **Industrial Skeuomorphic (Soft UI)** design system inspired by precision laboratory instruments, physical clinical hardware, and aerospace control consoles. Every component feels tactile, molded, and physically engineered into a continuous cool grey aluminum chassis.

#### Design Tokens (`frontend/src/styles/tokens.css`):
```css
:root {
  /* ── CHASSIS SURFACE ── */
  --chassis:       #e0e5ec;
  --chassis-dark:  #d1d9e6;
  --chassis-light: #eef1f6;
  --panel:         #f0f2f5;

  /* ── TEXT ── */
  --text-primary:  #1a1f2e;
  --text-muted:    #4a5568;
  --text-inverse:  #ffffff;

  /* ── BRAND ACCENTS: Hematology Purple + Bio Teal ── */
  --accent-primary:        #7c3aed;
  --accent-primary-dark:   #5b21b6;
  --accent-primary-light:  #ede9fe;
  --accent-primary-glow:   rgba(124, 58, 237, 0.45);

  --accent-secondary:      #0f766e;
  --accent-secondary-dark: #0d5c56;
  --accent-secondary-light:#d0fdf4;
  --accent-secondary-glow: rgba(15, 118, 110, 0.45);

  /* ── CLINICAL LED INDICATORS ── */
  --led-safe:          #15803d;
  --led-safe-glow:     rgba(21, 128, 61, 0.55);
  --led-caution:       #b45309;
  --led-caution-glow:  rgba(180, 83, 9, 0.55);
  --led-critical:      #dc2626;
  --led-critical-glow: rgba(220, 38, 38, 0.55);
  --led-online:        #22c55e;
  --led-online-glow:   rgba(34, 197, 94, 0.60);

  /* ── NEUMORPHIC SHADOW SYSTEM ── */
  --shadow-card:          8px 8px 16px #babecc, -8px -8px 16px #ffffff;
  --shadow-card-hover:    10px 10px 20px #babecc, -10px -10px 20px #ffffff;
  --shadow-floating:      12px 12px 24px #babecc, -12px -12px 24px #ffffff, inset 1px 1px 0 rgba(255,255,255,0.5);
  --shadow-pressed:       inset 6px 6px 12px #babecc, inset -6px -6px 12px #ffffff;
  --shadow-recessed:      inset 4px 4px 8px #babecc, inset -4px -4px 8px #ffffff;
  --shadow-recessed-deep: inset 8px 8px 16px #babecc, inset -8px -8px 16px #ffffff;
  --shadow-sm:            5px 5px 10px #babecc, -5px -5px 10px #ffffff;

  /* ── TYPOGRAPHY ── */
  --font-display: 'Inter', sans-serif;
  --font-body:    'Inter', sans-serif;
  --font-mono:    'JetBrains Mono', 'Roboto Mono', monospace;
}
```

#### Physical Control Elements:
1. **Molded Chassis Panels (`ps-card`)**: 32px border-radius containers with dual-light shadows, physical corner screw indentations, and vertical vent cooling slots.
2. **Clinical LED Indicators (`LedIndicator.jsx`)**: Glowing status diodes with keyframe pulses (`led-pulse`, `led-pulse-fast`) paired with uppercase monospace telemetry labels.
3. **Recessed Wells (`ps-input`, `ps-textarea`, `ps-select`)**: Molded negative-space input channels drilled into the chassis surface.
4. **Tactile Keys (`PolySafeButton.jsx`)**: Mechanical spring push keys with physical displacement on active press (`translateY(2px)` and inset shadows).
5. **Zero-Emoji Standard**: 100% Lucide SVG widgets across all pages and clinical panels.

#### Lucide Icon Usage Mapping:

| Purpose | Icon Widget | Component Location |
|---|---|---|
| Prescription / Rx | `<Pill className="w-4 h-4" />` | Global / Badges |
| Herbal Formulation | `<Leaf className="w-4 h-4" />` | Type Toggle |
| OTC Medication | `<ShoppingBag className="w-4 h-4" />` | Type Toggle |
| After Food Timing | `<Utensils className="w-4 h-4" />` | Edit Modal |
| Before Food Timing | `<Clock className="w-4 h-4" />` | Edit Modal |
| With Food Timing | `<Coffee className="w-4 h-4" />` | Edit Modal |
| Empty Stomach | `<Droplets className="w-4 h-4" />` | Edit Modal |
| Schedule & Refill | `<CalendarDays className="w-4 h-4" />` | Edit Modal |
| Clinical Notes | `<PenLine className="w-4 h-4" />` | Edit Modal |
| Bedtime Quick Note | `<Moon className="w-3 h-3" />` | Quick Note Chip |
| Morning Quick Note | `<Sun className="w-3 h-3" />` | Quick Note Chip |
| Alcohol Warning | `<Wine className="w-3 h-3" />` | Quick Note Chip |
| Grapefruit Warning | `<UtensilsCrossed className="w-3 h-3" />` | Quick Note Chip |
| Exercise Timing | `<Dumbbell className="w-3 h-3" />` | Quick Note Chip |
| Lab Monitoring | `<TestTube2 className="w-3 h-3" />` | Quick Note Chip |
| Renal Toxicity | `<FlaskConical className="w-4 h-4" />` | Organ Radar |
| Hepatic Toxicity | `<Activity className="w-4 h-4" />` | Organ Radar |
| Cardiovascular Toxicity | `<Heart className="w-4 h-4" />` | Organ Radar |
| CNS / Cognitive | `<Brain className="w-4 h-4" />` | Organ Radar |
| Drug Substitution | `<ArrowLeftRight className="w-4 h-4" />` | Doctor Action Bar |
| Clinical Directive | `<MessageSquare className="w-4 h-4" />` | Doctor Action Bar |
| Save Action | `<Save className="w-3.5 h-3.5" />` | Modal Footers |

---

## 11. AUTHENTICATION, ROLE-BASED ACCESS CONTROL & SECURITY SAFEGUARDS

1. **Password Security**: Passwords hashed using `bcrypt` with 10 salt rounds.
2. **Account Lockout**: After 5 consecutive failed login attempts, `failedLoginAttempts` triggers `lockedUntil = now() + 20 seconds`.
3. **Session Recovery**: `GET /auth/me` validates the JWT token on app boot and syncs user roles and patient profile IDs into `AuthContext`.
4. **Guest Mode Isolation**: Non-destructive guest session allows exploratory navigation; write operations (adding medicines, generating share codes) trigger `GuestLockModal`.
5. **Back-Button Loop Prevention**: Fixed via session validation in `RootRedirect`.
6. **Data Privacy**: Caregivers receive redacted read-only schedules without raw pharmacological interaction telemetry.

---

## 12. AUTOMATED VERIFICATION, INTEGRATION TESTS & QA PROTOCOLS

PolySafe includes an automated 18-step sequential integration test runner located at `backend/test-all-endpoints.js`:

```
================================================================
          POLYSAFE MASTER ENDPOINT VERIFICATION SUITE
================================================================
✔ [STEP 1/18] PASS: POST /auth/patient/signup-send-otp
✔ [STEP 2/18] PASS: POST /auth/patient/verify-signup-otp
✔ [STEP 3/18] PASS: POST /auth/doctor/signup
✔ [STEP 4/18] PASS: POST /auth/patient/login
✔ [STEP 5/18] PASS: POST /auth/doctor/login
✔ [STEP 6/18] PASS: GET /auth/me
✔ [STEP 7/18] PASS: POST /patient/profile (Age: 68, Conditions: Hypertension, AFib)
✔ [STEP 8/18] PASS: POST /medicine (Warfarin 5mg — harmLevel: 5 Critical Risk)
✔ [STEP 9/18] PASS: POST /medicine (Aspirin 81mg — Triggered 1 DDInter flag)
✔ [STEP 10/18] PASS: POST /medicine (Ginkgo Biloba, HERBAL — harmLevel: 1)
✔ [STEP 11/18] PASS: GET /patient/home-summary (Status: CAUTION, Regimen: L5)
✔ [STEP 12/18] PASS: GET /patient/timeline (Audit trail verified)
✔ [STEP 13/18] PASS: POST /medicine/identify-pill (Imprint "L484" -> Acetaminophen)
✔ [STEP 14/18] PASS: POST /symptom (Log "swollen ankles" -> Cascade evaluated)
✔ [STEP 15/18] PASS: POST /connection/generate-code (Generated 6-digit Code)
✔ [STEP 16/18] PASS: POST /connection/claim-code + approve (Doctor connected)
✔ [STEP 17/18] PASS: GET /connection/mine + POST /connection/doctor-safety-check
✔ [STEP 18/18] PASS: DELETE /medicine/:id (Soft-delete Aspirin, stamps removedAt)
================================================================
                 18/18 tests passed (100% OK)
================================================================
```

### Running the Test Suite:
```bash
cd backend
node test-all-endpoints.js
```

---

## 13. ENVIRONMENT CONFIGURATION & PRODUCTION DEPLOYMENT

### Environment Variables Matrix (`.env`):

| Variable | Description | Example / Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/polysafe` |
| `JWT_SECRET` | Secret key for JWT signing | 256-bit cryptographically secure string |
| `JWT_EXPIRES_IN` | Token lifetime duration | `7d` |
| `PORT` | Backend HTTP & WebSocket port | `5000` |
| `NODE_ENV` | Environment identifier | `production` / `development` |
| `GROQ_API_KEY` | Groq API Key for clinical translations | `gsk_...` |
| `GEMINI_API_KEY` | Google Gemini API Key for OCR | `AIzaSy...` |
| `OCR_SPACE_API_KEY` | Cloud OCR.space API Key | Free tier key |
| `RESEND_API_KEY` | Resend API Key for transactional OTPs | `re_...` |
| `RESEND_FROM_EMAIL` | Sender email address | `onboarding@resend.dev` |
| `DEMO_MODE` | Offline fixture toggle | `false` |

### Production Build & Launch Commands:

#### Backend:
```bash
cd backend
npm install
npx prisma db push
node src/index.js
```

#### Frontend:
```bash
cd frontend
npm install
npm run build
npm run preview
```

---

## 14. CHANGELOG & HISTORICAL MILESTONES

- **v1.0.0**: Core authentication, patient baseline onboarding, DDInter database seeding (222,000+ interaction pairs).
- **v2.0.0**: Indian formulary 5-layer resolution engine, WHO/NCI 5-tier harm classification, ACB cognitive burden index.
- **v3.0.0**: 4-Stage multimodal prescription OCR with Gemini 2.5 Flash Vision, prescribing cascade detection, FDA OFFSIDES adverse reaction signal mining.
- **v3.5.0**: Doctor portal overhaul: STOPP/START deprescribing assistant, pre-prescribing safety checks, temporary QR code sharing.
- **v4.0.0 (Current Release)**:
  - **Industrial Skeuomorphism (Soft UI) Rebuild**: Complete visual redesign of the PolySafe frontend to a physical, tactile laboratory control console aesthetic.
  - Base cool grey aluminum chassis (`#e0e5ec`), hematology purple (`#7c3aed`), and bio teal (`#0f766e`) accents with dual-light shadow extrusion and recessed input wells.
  - Physical control panels (`ps-card`) with corner screw indentations and vertical ventilation cooling slots across all card variants.
  - Precision clinical LED status indicators (`LedIndicator.jsx`) with glowing pulse keyframes.
  - Tactile mechanical buttons (`PolySafeButton.jsx`) and recessed well inputs (`PolySafeInput.jsx`, `PolySafeSelect.jsx`, `PolySafeTextarea.jsx`).
  - Added 4-System Organ & System Toxicity Radar (Renal, Hepatic, Cardiovascular, CNS).
  - Added 1-Click Drug Substitution Tool with atomic transaction safety and interaction re-checking.
  - Added Clinical Directive Broadcasting via Socket.IO.
  - Fixed `/connected` and `/share` navigation routing in patient & doctor portal shells.
  - Harmonized Safe, Caution, and Critical Status cards to modern industrial skeuomorphic chassis aesthetics.
  - **Calibrated Skeuomorphic Shadow System**: Replaced raw, blown-out `#ffffff` neumorphic drop shadows with subtle, calibrated specular light reflections (`rgba(255,255,255,0.7)`) to eliminate white glow halos and element overlap across the entire application.
  - **Precision OTP Verification Boxes**: Added dedicated `.otp-box` skeuomorphic recessed well styles with fixed 48x56px dimensions and centered monospace numbers, resolving the horizontal overflow bug on the registration verification screen.
  - **Medical Cyan & Slate Blue Color Token Architecture**: Deployed the refreshed dual-mode color token system in `tokens.css` with Light Mode blue-grey chassis (`#eef2f7`), Medical Cyan (`#0891b2`), Slate Blue (`#2d6a9f`), and Protective Green (`#2d8a6e`), paired with Dark Mode navy-slate chassis (`#1a2233`) and brightened LEDs.
  - **Dynamic Theme Mode Switcher**: Added dark mode toggle with persistent `localStorage` cache (`polysafe-theme`) and zero-flash inline HTML `<head>` hydration in `index.html` and `Navbar.jsx`.
  - **Clinical Capsule Action Button Matching ([HomePage.jsx](file:///c:/Meet/xyz/PolySafe/frontend/src/pages/HomePage.jsx))**: Re-styled the "View Clinical Explanation" button to precisely match the `DrugHarmPanel` capsule component (`[ 🟠 L4 · High Risk ⌄ ]`). Features a full-width rounded pill capsule (`rounded-full bg-[var(--chassis)] border border-[rgba(255,255,255,0.6)] shadow-[var(--shadow-sm)]`), an authentic glowing `<LedIndicator size="sm" />`, crisp severity-colored monospace text (`text-xs font-mono font-bold`), and a right-aligned `<ChevronRight />` arrow, creating 100% component consistency across the dashboard.
  - **Eliminated Inset Card Corner Clipping & Spacing Bug ([DrugHarmLevel.jsx](file:///c:/Meet/xyz/PolySafe/frontend/src/components/DrugHarmLevel.jsx))**: Added explicit `space-y-3.5` flow wrapper inside `PolypharmacyHarmDashboard` so that the 2 Stat Inset Wells and the 5-Tier Spectrum Meter maintain comfortable 14px separation, preventing the rounded corner collision and shadow overlap artifact.
  - **Refined Spectrum Meter Baseline & Clean Pulse Indicator ([DrugHarmLevel.jsx](file:///c:/Meet/xyz/PolySafe/frontend/src/components/DrugHarmLevel.jsx))**: Fixed the spectrum meter layout so that all 5 tier labels align on a single uniform horizontal baseline inside the card boundaries. Replaced muddy outer drop-shadows with a crisp embedded active pulse dot and clean ring highlight (`ring-2 ring-white/90`), keeping the active tier completely distinct without overflow or clipping.
  - Passed 18/18 master automated integration tests, 3-role unified auth test suite, and user account verification suite with 100% success.
