# PolySafe Current Build State & Technical Architecture Audit
**Date of Audit:** August 21, 2026  
**Repository:** `meetchauhan17/PolySafe`  
**Scope:** Comprehensive inspection of `/backend` and `/frontend` source files, Prisma database schemas, seeded clinical datasets, REST API routes, Socket.IO real-time event streams, UI design systems, and automated test suites.

---

## 1. EXECUTIVE SUMMARY

PolySafe is a full-stack, clinical-grade **AI-powered polypharmacy risk management and clinical safety platform**. It protects polymedicated patients (especially elderly individuals managing multi-morbidity regimens) from harmful drug-drug interactions, adverse side effects, anticholinergic cognitive burden, prescribing cascades, and organ toxicity.

The platform provides dedicated, role-tailored interfaces for:
1. **Patients**: Medication tracking, OCR prescription scanning, WHO/NCI 5-tier regimen harm metrics, adverse effect explorer, symptom-cascade root cause analysis, temporary doctor QR share codes, and live physician directive banners.
2. **Doctors**: Clinical dashboard, patient code claiming, interactive Regimen Timelines, STOPP/START deprescribing assistant with tapering protocols, 4-system Organ Toxicity Radar, 1-click drug substitution, inline clinical directive publishing, and pre-prescribing safety checks with projected risk modeling.
3. **Caregivers**: Simplified non-clinical daily schedules, dosage alerts, and emergency risk notifications for dependent family members.

---

## 2. FEATURE & COMPONENT MATRIX

### Backend Routes (`/backend/src/routes/`)

| File | Endpoints | Status | Description |
|---|---|:---:|---|
| [`auth.js`](file:///c:/Meet/xyz/PolySafe/backend/src/routes/auth.js) | `POST /auth/check-email`<br>`POST /auth/patient/signup-send-otp`<br>`POST /auth/patient/verify-signup-otp`<br>`POST /auth/patient/login`<br>`POST /auth/doctor/signup`<br>`POST /auth/doctor/login`<br>`GET /auth/me` | ✅ BUILT | Role-based signup/login with Email OTP via Resend, password hashing (`bcrypt`), JWT generation, 5-attempt rate-limiting lockout, and `/auth/me` session recovery. |
| [`patient.js`](file:///c:/Meet/xyz/PolySafe/backend/src/routes/patient.js) | `POST /patient/profile`<br>`GET /patient/home-summary`<br>`GET /patient/timeline` | ✅ BUILT | Patient onboarding and clinical baseline profile management (age, chronic conditions, drug allergies), home dashboard summary with active alerts and WHO/NCI regimen harm tiering, and chronological medication audit trail. |
| [`medicine.js`](file:///c:/Meet/xyz/PolySafe/backend/src/routes/medicine.js) | `POST /medicine`<br>`GET /medicine/search`<br>`GET /medicine/:id/resolve`<br>`GET /medicine/:id/sideeffects`<br>`POST /medicine/identify-pill`<br>`PUT /medicine/:id`<br>`DELETE /medicine/:id` | ✅ BUILT | Full medicine lifecycle: 5-layer Indian formulation resolution, WHO/NCI harm tiering, duplicate conflict resolution (`forceUpdate`), 3-tab extended clinical metadata updates (dosage, type, frequency, food instruction, prescriber, personal notes, reminders, refill date), FDA OFFSIDES side effects query, loose pill imprint identification, soft-delete, and async Socket.IO interaction checking. |
| [`scan.js`](file:///c:/Meet/xyz/PolySafe/backend/src/routes/scan.js) | `POST /medicine/scan` | ✅ BUILT | 4-Stage prescription OCR pipeline: Google Gemini 2.5 Flash Vision (structured JSON extraction) $\rightarrow$ RxNorm verification $\rightarrow$ Local Tesseract OCR fallback $\rightarrow$ Cloud OCR.space fallback. Includes non-medicine photo rejection and stop-word filtering. |
| [`interactionFlag.js`](file:///c:/Meet/xyz/PolySafe/backend/src/routes/interactionFlag.js) | `GET /interaction-flag/:id` | ✅ BUILT | Direct query of flagged clinical drug-drug/herb-drug interactions by ID with dual clinical/plain explanations, source transparency, and cumulative anticholinergic burden breakdown. |
| [`symptom.js`](file:///c:/Meet/xyz/PolySafe/backend/src/routes/symptom.js) | `POST /symptom`<br>`GET /symptom/my-symptoms` | ✅ BUILT | Symptom logging with automated Prescribing Cascade detection against active medication timeline (identifies root-cause offending drugs like Amlodipine $\rightarrow$ ankle swelling $\rightarrow$ prevents unwarranted diuretic additions). |
| [`connection.js`](file:///c:/Meet/xyz/PolySafe/backend/src/routes/connection.js) | `POST /connection/generate-code`<br>`POST /connection/claim-code`<br>`POST /connection/:id/approve`<br>`POST /connection/:id/revoke`<br>`GET /connection/mine`<br>`POST /connection/doctor-safety-check`<br>`GET /connection/doctor-patient/:id/timeline`<br>`GET /connection/doctor-patient/:id/clinical-summary`<br>`POST /connection/doctor-deprescribe`<br>`POST /connection/doctor-substitute`<br>`POST /connection/doctor-directive`<br>`GET /connection/doctor-patient/:id/directives` | ✅ BUILT | Doctor-patient consent workflows: 6-digit share codes with QR canvas, claim/approve/revoke endpoints, read-only patient timeline query, pre-prescribing safety checks, STOPP/START deprescribing protocol initiation, 1-click drug substitution, clinical directive broadcasting via Socket.IO, and 4-system organ toxicity calculation. |
| [`caregiver.js`](file:///c:/Meet/xyz/PolySafe/backend/src/routes/caregiver.js) | `POST /caregiver/invite`<br>`POST /caregiver/claim`<br>`GET /caregiver/patient-summary/:patientId` | ✅ BUILT | Caregiver invite by phone number, pending claim verification, and redacted read-only medication schedule & risk oversight for elderly family members. |

---

### Frontend Pages (`/frontend/src/pages/`)

| File | Route | Role Access | Status | Description |
|---|---|:---:|:---:|---|
| [`LoginPage.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/pages/LoginPage.jsx) | `/login` | Public | ✅ BUILT | Interactive role switcher (Patient / Doctor / Caregiver), email check, OTP input verification, password login, back-button loop avoidance, and 1-click Guest Mode exploration. |
| [`OnboardingPage.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/pages/OnboardingPage.jsx) | `/onboarding` | Patient | ✅ BUILT | Multi-step medical baseline collection (Age, chronic health conditions tags, medication allergies tags) with real-time payload persistence. |
| [`HomePage.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/pages/HomePage.jsx) | `/home` | Patient | ✅ BUILT | Clinical status banner (SAFE / CAUTION / CRITICAL), Physician Directives Banner (live Socket.IO events), WHO/NCI Polypharmacy Regimen Risk Card (L1–L5), active medication cards with harm badges, expandable OFFSIDES side effects panel, rich 3-tab Edit Medication Modal, and Discontinue Confirmation Modal. |
| [`AddMedicinePage.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/pages/AddMedicinePage.jsx) | `/add-medicine` | Patient / Caregiver | ✅ BUILT | Multi-modal prescription intake: Gemini Vision scan with structured review card (confidence badges, RxNorm verification, prescriber attribution, form pre-fill), 30+ Indian brand autocomplete, loose pill imprint search, classification selector, and duplicate conflict resolver. |
| [`RiskAnalysisPage.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/pages/RiskAnalysisPage.jsx) | `/risk-analysis` | Patient / Doctor | ✅ BUILT | Deep pharmacological breakdown: Dual Tab View ("For You" vs "For the Doctor"), WHO/NCI 5-tier harm meter, Cumulative Anticholinergic Burden gauge (0–3 ACB), and flagged interaction cards. |
| [`LogSymptomPage.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/pages/LogSymptomPage.jsx) | `/log-symptom` | Patient | ✅ BUILT | Plain-language symptom logger with quick-select common complaint chips (ankle swelling, dry cough, dizziness, muscle pain) and start date picker. |
| [`SymptomResultPage.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/pages/SymptomResultPage.jsx) | `/symptom-result` | Patient | ✅ BUILT | Prescribing Cascade alert card: identifies offending drug, probability score, clinical mechanism, and warning against adding secondary treat-the-side-effect prescriptions. |
| [`TimelinePage.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/pages/TimelinePage.jsx) | `/timeline` | Patient / Doctor | ✅ BUILT | Chronological prescription audit trail with animated vertical connector line, provenance metadata pills (Patient Self-Added, Doctor Added, Caregiver Added), and soft-delete/discontinue action. |
| [`DoctorDashboardPage.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/pages/DoctorDashboardPage.jsx) | `/doctor-dashboard` | Doctor | ✅ BUILT | Physician command center: 6-digit patient code claim panel, connected patients sidebar, Regimen Timeline with risk flags, Clinical Deprescribing Assistant (STOPP/START), Patient Logged Symptoms tab, Organ & System Toxicity Radar, 1-click Drug Substitution Modal, Write Clinical Directive panel, Print-Ready Clinical Consultation Report Modal, and Pre-Prescribing Safety Check Modal. |
| [`DoctorSharePage.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/pages/DoctorSharePage.jsx) | `/share` | Patient | ✅ BUILT | High-contrast 6-digit temporary share code generator with scannable QR Code canvas and 15-minute live expiration countdown timer. |
| [`CaregiverViewPage.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/pages/CaregiverViewPage.jsx) | `/caregiver-view` | Caregiver | ✅ BUILT | Streamlined, non-clinical oversight screen showing simplified medication schedules, daily reminders, and severe risk warnings for elderly family members. |
| [`ConnectedPeoplePage.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/pages/ConnectedPeoplePage.jsx) | `/connected` | Patient | ✅ BUILT | Patient-controlled consent manager listing approved doctors and invited caregivers with 1-click access revocation. |
| [`ProfilePage.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/pages/ProfilePage.jsx) | `/profile` | Patient / Doctor | ✅ BUILT | User profile management, chronic condition editor, allergy manager, account metadata, and session logout. |
| [`InsightsPage.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/pages/InsightsPage.jsx) | `/insights` | Patient / Doctor | ✅ BUILT | Polypharmacy analytics: monthly medication count trends (Recharts), drug category breakdown pie chart, and cumulative risk trajectory. |

---

## 3. DATABASE SCHEMA (Prisma ORM)

Database engine: **PostgreSQL** (production/staging) / **SQLite** (local testing) via Prisma Client.

```prisma
// Enums
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

// Core User & Auth
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

// Patient Baseline & Regimen
model Patient {
  id               String            @id @default(uuid())
  userId           String            @unique
  user             User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  age              Int
  conditions       String[]          // e.g. ["diabetes", "hypertension", "kidney"]
  allergies        String[]          // e.g. ["penicillin", "aspirin", "sulfa"]

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
  standardizedCode String?           // RxNorm CUI code
  type             MedicineType      @default(PRESCRIPTION)
  addedBy          String            // userId of creator
  addedByUser      User              @relation("AddedByUser", fields: [addedBy], references: [id])
  dateAdded        DateTime          @default(now())
  dosage           String?
  harmLevel        Int               @default(3) // 1=Low, 2=Mild, 3=Moderate, 4=High, 5=Critical
  removedAt        DateTime?         // Soft-delete timestamp

  // Extended Clinical Metadata
  frequency        String?           // e.g. "Once daily (OD)", "Twice daily (BD)"
  foodInstruction  String?           // "with_food", "before_food", "after_food", "empty_stomach"
  prescribedBy     String?           // Prescribing physician name or "Self"
  notes            String?           // Patient's clinical instructions & reminders
  reminderEnabled  Boolean           @default(false)
  refillDate       DateTime?         // Next prescription refill date

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

// Doctor/Caregiver Connections
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

// Clinical Flags & Knowledge Bases
model InteractionFlag {
  id                  String   @id @default(uuid())
  patientId           String
  patient             Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  medicineAId         String
  medicineA           Medicine @relation("MedicineA", fields: [medicineAId], references: [id], onDelete: Cascade)
  medicineBId         String
  medicineB           Medicine @relation("MedicineB", fields: [medicineBId], references: [id], onDelete: Cascade)
  severity            String   // "Minor", "Moderate", "Major", "Contraindicated"
  clinicalExplanation String
  plainExplanation    String
  generatedBy         String?
  dateFlagged         DateTime @default(now())
}

model DrugInteractionReference {
  id        Int     @id @default(autoincrement())
  drugAName String
  drugBName String
  severity  String
  ddinterId String?

  @@index([drugAName, drugBName])
  @@index([drugBName, drugAName])
  @@map("drug_interaction_reference")
}

model BurdenScore {
  id       Int    @id @default(autoincrement())
  drugName String @unique
  score    Int    // Anticholinergic score 0–3

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

model PillImprint {
  id          String  @id @default(uuid())
  imprintCode String
  drugName    String
  strength    String?
  shape       String?
  color       String?

  @@index([imprintCode])
  @@map("pill_imprint")
}

model DrugSideEffect {
  id            Int      @id @default(autoincrement())
  rxcui         String?
  drugName      String
  sideEffect    String
  prr           Float    // Proportional Reporting Ratio (>= 2.0)
  reportingFreq Float?
  severity      String?
  source        String   @default("OFFSIDES_FDA")
  createdAt     DateTime @default(now())

  @@index([drugName])
  @@index([rxcui])
  @@index([drugName, prr])
  @@map("drug_side_effect")
}
```

---

## 4. CLINICAL DATASETS & SEED SOURCES

| Data File | Size / Records | Description & Clinical Utility |
|---|---|---|
| `ddinter.csv` | 13.1 MB (~222,380 rows) | Comprehensive indexed database of validated drug-drug interaction pairs with severity gradings. |
| `ddinter_downloads_code_A.csv` ... `_V.csv` | 13.5 MB total (8 ATC classes) | Anatomical Therapeutic Chemical sub-datasets for targeted pharmacological interaction lookups. |
| `indianDrugs.js` | 13.5 KB (35+ brands / 251 aliases) | High-frequency Indian market formulations (e.g. Augmentin, Pan-D, Telma-H, Glycomet-GP) mapped to chemical salts and WHO harm tiers. |
| `harm-levels.json` | 8.5 KB (205 indexed drugs) | WHO/NCI 5-Tier drug harm indices (1=Low, 2=Mild, 3=Moderate, 4=High, 5=Critical Narrow Therapeutic Index drugs like Warfarin, Digoxin, Lithium). |
| `burden-scores.json` | 4.9 KB (30 anticholinergic drugs) | Validated Anticholinergic Cognitive Burden (ACB) scores (0 to 3 scale) for quantifying dementia and fall risk in geriatric patients. |
| `cascade-references.json` | 8.2 KB (20 cascade mechanisms) | Documented prescribing cascades (e.g. Amlodipine $\rightarrow$ Peripheral Edema $\rightarrow$ Furosemide; NSAID $\rightarrow$ Hypertension $\rightarrow$ Antihypertensive). |
| `herb-drug-interactions.json` | 9.7 KB (24 clinical mechanisms) | Documented herb-drug interactions (e.g. Ashwagandha + Sedatives, Ginkgo Biloba + Antiplatelets, St. John's Wort + SSRIs). |
| `pill-imprints.json` | 4.4 KB (26 imprints) | Physical pill visual identification database mapping imprint codes, shapes, and colors to active chemical entities. |
| `offsides-sample.json` | 10.8 KB (86 FDA adverse reactions) | Mining of FDA Adverse Event Reporting System (FAERS) for statistical off-label adverse event signals with PRR $\ge 2.0$. |
| `ai-resolved-drugs.json` | 121.5 KB (273 pre-computed mappings) | Fast-path disk cache for brand-to-salt resolution, preventing redundant external API calls. |
| `drugbank-id-cache.json` | 43.7 KB (1,514 RxNorm mappings) | Cross-reference table linking DrugBank identifiers directly to standardized RxNorm CUIs. |

---

## 5. CORE CLINICAL SERVICES & ENGINES

1. **`aiDrugResolver.js` (5-Layer Indian Formulation Resolver)**:
   - **Layer 1: Indian Formulary Dictionary exact match (0ms)** — instant lookup against curated CDSCO brand-to-salt mapping.
   - **Layer 2: Local AI Cache (0ms)** — queries `ai-resolved-drugs.json` for previously decomposed brands.
   - **Layer 3: Fuzzy Levenshtein Match ($\le 2$ distance)** — handles OCR typos and misspelling (e.g., *Naxdum 500 $\rightarrow$ Naxdom 500*).
   - **Layer 4: NLM RxNorm REST API** — queries standard generic concept identifiers (`https://rxnav.nlm.nih.gov/REST/rxcui.json`).
   - **Layer 5: Groq LLM Decomposer (`llama-3.3-70b-versatile`)** — structured clinical decomposition for novel/unindexed combination formulations.

2. **`regimenRisk.js` (WHO/NCI 5-Tier Regimen Risk Engine)**:
   - Computes weighted patient regimen harm scores (1 to 5).
   - Applies automated escalation rules:
     - Level 5 Critical override if any Narrow Therapeutic Index drug is active (Warfarin, Digoxin, Lithium, Phenytoin).
     - Score elevation based on high-severity interaction count and total drug polypharmacy burden ($\ge 5$ drugs).

3. **`burdenIndex.js` (Anticholinergic Cognitive Burden Engine)**:
   - Calculates cumulative ACB score across all active medications.
   - Returns risk stratification: **Low (0)**, **Moderate (1–2)**, or **High Cognitive / Fall Risk (3+)** with clinical explanations.

4. **`interactionLookup.js` (High-Performance DDInter Engine)**:
   - Evaluates active medication pairs against bi-directional indexes.
   - Generates dual clinical and plain-language explanations with source provenance.

5. **`scan.js` (4-Stage Multimodal Prescription OCR)**:
   - **Stage 1**: Google Gemini 2.5 Flash Vision (`@google/generative-ai`) extracts structured JSON: `drug_name`, `generic_name`, `strength`, `form`, `frequency`, `duration`, `prescriber`, `confidence`.
   - **Stage 2**: RxNorm verification confirms valid pharmaceutical concept.
   - **Stage 3**: Local Tesseract OCR fallback (`node-tesseract-ocr`) handles offline/rate-limited states.
   - **Stage 4**: Cloud OCR.space REST API fallback.
   - **Non-Medicine Rejection**: Rejects non-pharmaceutical photos with 400 Bad Request.

6. **`connection.js` (Doctor Clinical Intelligence Engine)**:
   - **Organ & System Toxicity Radar**: Calculates organ-specific drug burden scores (0–100) across 4 systems:
     - **Renal**: Evaluates nephrotoxic burden (NSAIDs, loop diuretics, ACE inhibitors, aminoglycosides).
     - **Hepatic**: Evaluates hepatotoxic burden (statins, methotrexate, acetaminophen, antifungals).
     - **Cardiovascular**: Evaluates QT-prolonging and proarrhythmic burden (antiarrhythmics, macrolides, fluoroquinolones).
     - **CNS / Cognitive**: Evaluates anticholinergic burden on brain/cognitive function.
   - **1-Click Drug Substitution (`POST /connection/doctor-substitute`)**: Discontinues offending medication and prescribes replacement alternative in a single atomic transaction while executing full interaction re-checking.
   - **Clinical Directive Broadcasting (`POST /connection/doctor-directive`)**: Publishes categorized orders (Regimen Advice, Dietary Instruction, Lifestyle Order, Monitoring Instruction, Follow-Up Notice) with urgency levels (Urgent, High, Normal) and pushes real-time events to the patient via Socket.IO.

---

## 6. DESIGN SYSTEM & UI/UX ARCHITECTURE

### Aesthetics & Typography
- **Typography**: `Fraunces` (high-end optical serif for clinical headings) + `Inter` / `Outfit` (ultra-clean sans-serif for numbers, data tables, and body copy).
- **Color Palette**:
  - Deep Dark Sage: `#1C2B27` (primary brand text)
  - Clinical Forest Green: `#2B6E5E` (primary clinical action color)
  - Warm Parchment / Alabaster: `#EDE8DC` / `#FDFBF7` (neomorphic warm card surfaces)
  - Sand Neutral Border: `#D5CEBF`
  - High-Risk Danger Red: `#B23D25` (critical interaction warnings)
  - Moderate Caution Amber: `#B5791A` (moderate alerts)
- **Zero-Emoji Policy**: Completely free of raw Unicode emojis across all 27+ frontend files. All visual indicators, food instruction cards, tab labels, quick-note chips, and status badges utilize high-fidelity **Lucide SVG icon widgets** (`Utensils`, `Clock`, `Coffee`, `Droplets`, `Pill`, `CalendarDays`, `PenLine`, `Moon`, `Sun`, `Wine`, `Dumbbell`, `TestTube2`, `Save`, `ChevronLeft`, `ChevronRight`, `CheckCircle`, `XCircle`, `MessageSquare`, `ArrowLeftRight`, `BarChart2`).
- **Neomorphic & Glassmorphic Elevation**: Tailored double-shadow utility tokens (`shadow-[12px_12px_24px_rgba(191,180,155,0.7),-12px_-12px_24px_rgba(255,255,255,0.8)]` and inset wells `shadow-[inset_3px_3px_6px_rgba(191,180,155,0.5),inset_-3px_-3px_6px_rgba(255,255,255,0.6)]`).
- **Motion & Micro-interactions**: `framer-motion` spring animations for page transitions, tab switches, modal scale-ins, and animated score bars with `useReducedMotion` accessibility support.

---

## 7. AUTOMATED VERIFICATION SUITE

Located at [`backend/test-all-endpoints.js`](file:///c:/Meet/xyz/PolySafe/backend/test-all-endpoints.js), this master 18-step sequential suite executes full end-to-end integration tests:

```
✔ [STEP 1/18] PASS: POST /auth/patient/signup-send-otp
✔ [STEP 2/18] PASS: POST /auth/patient/verify-signup-otp
✔ [STEP 3/18] PASS: POST /auth/doctor/signup
✔ [STEP 4/18] PASS: POST /auth/patient/login
✔ [STEP 5/18] PASS: POST /auth/doctor/login
✔ [STEP 6/18] PASS: GET /auth/me
✔ [STEP 7/18] PASS: POST /patient/profile (Age: 68, Conditions: Hypertension, Atrial Fibrillation)
✔ [STEP 8/18] PASS: POST /medicine (Warfarin 5mg — harmLevel: 5 Critical Risk, RxCUI: 11289)
✔ [STEP 9/18] PASS: POST /medicine (Aspirin 81mg — Triggered 1 DDInter flag with Warfarin)
✔ [STEP 10/18] PASS: POST /medicine (Ginkgo Biloba, HERBAL — harmLevel: 1)
✔ [STEP 11/18] PASS: GET /patient/home-summary (Status: CAUTION, Regimen Level: L5)
✔ [STEP 12/18] PASS: GET /patient/timeline (Medicines on timeline: 3, Provenance label verified)
✔ [STEP 13/18] PASS: POST /medicine/identify-pill (Imprint "L484" — Matched: Acetaminophen)
✔ [STEP 14/18] PASS: POST /symptom (Log "swollen ankles" — Cascade match evaluated)
✔ [STEP 15/18] PASS: POST /connection/generate-code (Generated 6-digit Code)
✔ [STEP 16/18] PASS: POST /connection/claim-code + approve (Approved doctor connection)
✔ [STEP 17/18] PASS: GET /connection/mine + POST /connection/doctor-safety-check (Decision: CRITICAL)
✔ [STEP 18/18] PASS: DELETE /medicine/:id (Soft-delete Aspirin, stamps removedAt)
================================================================
                 18/18 tests passed (100% OK)
================================================================
```

---

## 8. ENVIRONMENT CONFIGURATION

| Variable Name | Purpose | Production Default / Mode |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/polysafe` |
| `JWT_SECRET` | Secret key for signing authentication tokens | 256-bit cryptographically secure string |
| `JWT_EXPIRES_IN` | Session duration | `7d` |
| `GROQ_API_KEY` | Groq LLM API Key for clinical translations | Active (`llama-3.3-70b-versatile`) |
| `GEMINI_API_KEY` | Google Gemini Vision API Key for prescription OCR | Active (`gemini-2.5-flash` / `gemini-1.5-flash`) |
| `OCR_SPACE_API_KEY` | Cloud OCR.space API Key for fallback OCR | Active |
| `RESEND_API_KEY` | Resend API Key for live transactional email OTPs | Active (Stub mode in local dev if omitted) |
| `PORT` | Backend HTTP & WebSocket server port | `5000` |
| `NODE_ENV` | Environment configuration | `production` / `development` |
| `DEMO_MODE` | Deterministic offline fixtures flag | `false` |

---

## 9. DEPLOYMENT & PRODUCTION READINESS

1. **Repository**: Main branch is clean, fully synced, and committed (`meetchauhan17/PolySafe`).
2. **Build Verification**: `npm run build` in `/frontend` compiles 2,940 modules with **0 errors and 0 warnings** in ~600ms.
3. **Database Migrations**: Prisma schema is completely in sync with database tables (`npx prisma db push`).
4. **Hosting Configs**:
   - `render.yaml` root manifest provisions Web Service `polysafe-backend` with managed PostgreSQL.
   - `frontend/vercel.json` configures client-side SPA routing and caching headers.
5. **Security**: Bcrypt password hashing, rate-limiting lockout protection, role-based JWT access controls, sanitized SQL via Prisma ORM, and safe Multer file uploads with automated disk cleanup.
