<div align="center">

# PolySafe

### Continuous Clinical Polypharmacy Risk, Prescribing Cascade & Drug Interaction Platform

**Preventing preventable adverse drug events across fragmented care silos through continuous, multi-agent pharmacological intelligence.**

<br/>

[![Production Web App](https://img.shields.io/badge/Production_App-poly--safe.vercel.app-0284c7?style=for-the-badge&logo=vercel&logoColor=white)](https://poly-safe.vercel.app)
[![Production REST API](https://img.shields.io/badge/Production_API-polysafe--backend.vercel.app-16a34a?style=for-the-badge&logo=vercel&logoColor=white)](https://polysafe-backend.vercel.app/health)
[![Master Verification Audit](https://img.shields.io/badge/Master_Audit-18/18_Passed_(100%25)-0d9488?style=for-the-badge&logo=checkmarx&logoColor=white)](#master-verification-audit-1818-passed)

<br/>

[![React 19](https://img.shields.io/badge/Frontend-React_19_·_Vite_8-0284c7?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![Node.js 22](https://img.shields.io/badge/Backend-Node.js_22_·_Express_5-16a34a?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Neon Postgres](https://img.shields.io/badge/Database-Neon_Serverless_PostgreSQL-00e599?style=flat-square&logo=postgresql&logoColor=black)](https://neon.tech/)
[![Prisma ORM](https://img.shields.io/badge/ORM-Prisma_5.22-334155?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Groq LLaMA](https://img.shields.io/badge/Clinical_LLM-Groq_LLaMA--3.3--70B-dc2626?style=flat-square)](https://groq.com/)
[![Gemini Vision](https://img.shields.io/badge/Vision_OCR-Gemini_2.5_Flash_Lite-2563eb?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![RxNorm Standards](https://img.shields.io/badge/Terminology-NLM_RxNorm-0284c7?style=flat-square)](https://rxnav.nlm.nih.gov/)
[![License MIT](https://img.shields.io/badge/License-MIT-64748b?style=flat-square)](https://opensource.org/licenses/MIT)

<br/>

[Live Deployments](#live-deployments) | [Master Study Kit](#master-study-kit-exam--presentation-playbooks) | [Clinical Problem](#the-clinical-problem-statement) | [Core Safety Subsystems](#the-5-core-safety-subsystems) | [Mathematical Scoring Models](#deterministic-mathematical-scoring-models) | [Role Portals](#role-based-clinical-portals) | [Team Presentation Guide](#5-person-team-presentation-division) | [API Reference](#api-endpoint-reference-76-endpoints) | [Database Architecture](#database-architecture) | [Quickstart](#local-installation--quickstart) | [Verification Audit](#master-verification-audit-1818-passed)

---

</div>

## Live Deployments

PolySafe is fully deployed in production on Vercel Serverless paired with Neon Serverless PostgreSQL.

| Environment | Endpoint URL | Status | Specification |
|:---|:---|:---:|:---|
| **Frontend Web App** | [`https://poly-safe.vercel.app`](https://poly-safe.vercel.app) | ACTIVE | Single Page Application with offline PWA caching & multi-lingual support |
| **Backend REST API** | [`https://polysafe-backend.vercel.app`](https://polysafe-backend.vercel.app) | ACTIVE | Serverless Node 22 API with rate-limiting & Prisma connection pooling |
| **Diagnostic Heartbeat** | [`https://polysafe-backend.vercel.app/health`](https://polysafe-backend.vercel.app/health) | 200 OK | `{"status":"ok","api":true,"db":true,"demoMode":false}` |

---

## Master Study Kit: Exam, Presentation & Defense Playbooks

For academic examinations, hackathon presentations, and clinical defense panels, PolySafe provides three synchronized study and documentation artifacts:

| Resource Document | Format | Size | Purpose & Scope |
|:---|:---:|:---:|:---|
| [`POLYSAFE_MASTER_PROJECT_AND_JUDGES_GUIDE.md`](./POLYSAFE_MASTER_PROJECT_AND_JUDGES_GUIDE.md) | Markdown | 45 KB (625 lines) | **Complete 11-Chapter Team Bible**: Plain-English concept, clinical urgency, all 7 math scoring models, 5 subsystems, 3 portals, architecture, 5-person role scripts, 5-minute live demo choreography, top 15 judge defense Q&As, and medical glossary. |
| [`POLYSAFE_EXAM_STUDY_GUIDE.pdf`](./POLYSAFE_EXAM_STUDY_GUIDE.pdf) | PDF (Print-Ready) | 908 KB | **Physical Exam & Judge Handout**: Pre-compiled, high-density study guide styled like an academic clinical pharmacology exam paper. Ideal for printing on standard A4 or offline reading on tablets/phones. |
| [`POLYSAFE_EXAM_STUDY_GUIDE.html`](./POLYSAFE_EXAM_STUDY_GUIDE.html) | Interactive HTML | 42 KB (792 lines) | **Print-Optimized Template**: Custom `@media print` layout with typography (`Inter`, `JetBrains Mono`), double-rule exam borders, math callouts, and auto-page breaks. Open in Chrome/Edge and press `Ctrl + P` to print. |

### How to Use the Study Kit

* **For Team Pre-Pitch Revision**: Read [`POLYSAFE_MASTER_PROJECT_AND_JUDGES_GUIDE.md`](./POLYSAFE_MASTER_PROJECT_AND_JUDGES_GUIDE.md) Chapter 8 (5-Person Role Scripts) and Chapter 10 (Top 15 Tough Judge Questions).
* **For Booth Demonstrations**: Print [`POLYSAFE_EXAM_STUDY_GUIDE.pdf`](./POLYSAFE_EXAM_STUDY_GUIDE.pdf) or keep it open on an iPad/tablet to show judges full mathematical rigor.
* **To Recompile the PDF from HTML**: Run this PowerShell command from the project root:
  ```powershell
  Start-Process -FilePath "msedge.exe" -ArgumentList "--headless", "--disable-gpu", "--run-all-compositor-stages-before-draw", "--print-to-pdf=`"C:\Meet\xyz\PolySafe\POLYSAFE_EXAM_STUDY_GUIDE.pdf`"", "`"file:///C:/Meet/xyz/PolySafe/POLYSAFE_EXAM_STUDY_GUIDE.html`"" -Wait
  ```

---

## Executive System Overview

PolySafe transforms drug interaction detection from disconnected, isolated pair-checks into an all-regimen safety engine. It continuously evaluates cumulative drug-drug interactions, prescribing cascades, duplicate salt toxicity, anticholinergic cognitive burden, and organ clearance burdens across distributed care providers.

```text
+-----------------------------------------------------------------------------+
|                         SYSTEM CAPABILITY MATRIX                            |
+--------------------------+--------------------------------------------------+
| Regimen Processing       | Whole-Regimen Cumulative Analysis (not pairs)    |
| Multi-Salt Resolution    | 5-Layer Indian & Global Brand-to-Salt Mapper     |
| Prescribing Cascades     | Directed Temporal Graph Traversal (581 Rules)    |
| Cognitive Risk Metric    | Validated Boustani ACB Scale (567 Drugs)         |
| Herb-Drug Surveillance   | 526 Botanical Monographs Cross-Referenced        |
| Prescriber Collaboration | Consent-Based Ephemeral 6-Digit PIN Sync         |
| Doctor Simulation        | "What-If" Pre-Prescribing Safety Simulator       |
| Multimodal Intake        | Gemini 2.5 Flash Lite + Imprint Lookup (560)     |
| Verification Audit       | 18/18 Automated Integration Test Steps (100%)    |
+--------------------------+--------------------------------------------------+
```

---

## The Clinical Problem Statement

In geriatric and multi-morbidity patients taking 5 or more concurrent medications (Polypharmacy), traditional pharmacy systems fail because they evaluate medications in static pairs.

### Primary Clinical Statistics
* **30%+ of Emergency Hospital Admissions** in senior citizens (age 65+) are directly caused by Adverse Drug Events (ADEs).
* **Over 50% of these hospitalizations are entirely preventable** with continuous, multi-drug pharmacological surveillance.

```text
+-------------------------------------------------------------------------------------------------------------+
|                                    FOUR FATAL TRAPS IN HEALTHCARE TODAY                                     |
+--------------------+-------------------------------------------+--------------------------------------------+
| TRAP               | CLINICAL ROOT CAUSE                       | POLYSAFE PRECISION SOLUTION                |
+--------------------+-------------------------------------------+--------------------------------------------+
| 1. Care            | Specialists prescribe in functional silos | Prescriber swimlane timeline with          |
|    Fragmentation   | without visibility into outside regimens. | consent-based 6-digit sync PIN.            |
|                    |                                           |                                            |
| 2. Prescribing     | Adverse drug reactions are misdiagnosed   | Directed chronological graph correlating   |
|    Cascades        | as new medical diseases, adding drugs.    | symptom onset dates with drug start dates. |
|                    |                                           |                                            |
| 3. Hidden Multi-   | Branded medications contain 2-3 active    | 5-Layer molecular resolver decomposing     |
|    Salt Compounds  | salts, leading to accidental overdoses.   | commercial brands into pure active salts.  |
|                    |                                           |                                            |
| 4. Herb & OTC      | Patients omit supplements during clinic   | 526-monograph botanical clinical cross-    |
|    Blind Spots     | visits, precipitating severe hemorrhages. | reference matrix.                          |
+--------------------+-------------------------------------------+--------------------------------------------+
```

---

## The 5 Core Safety Subsystems

PolySafe executes across five deterministic layers:

```mermaid
graph TD
    subgraph Data Sources & Clinical Reference Bases
        DD[DDInter Database<br/>222,383 Records / 160,235 Pairs]
        ACB[Boustani Anticholinergic Scale<br/>567 Calibrated Burden Scores]
        CAS[Prescribing Cascade Rules<br/>581 Documented Drug-Symptom Pairs]
        HERB[Herb-Drug Interaction Matrix<br/>526 Botanical Clinical Monographs]
        PIM[FDA/NLM Pill Imprints<br/>560 Authenticated Markings]
    end

    subgraph Core Deterministic Processing Engines
        D5[Deterministic Safety Engine]
        RES[5-Layer Multi-Salt Resolver]
        RAD[Organ Clearance Modeler]
    end

    DD --> D5
    ACB --> D5
    CAS --> D5
    HERB --> D5
    PIM --> RES
    RES --> D5
    D5 --> RAD

    subgraph Clinical Output Interfaces
        OUT1[WHO 5-Tier Regimen Risk]
        OUT2[Interactive Timetable & Passport]
        OUT3[Physician Pre-Prescription Simulator]
        OUT4[Caregiver Adherence Telemetry]
    end

    RAD --> OUT1
    RAD --> OUT2
    RAD --> OUT3
    RAD --> OUT4
```

### 1. 5-Layer Indian Formulation Resolver
Decomposes complex branded fixed-dose combinations into standardized active chemical salts:
* **Layer 1: Indian Formulary Cache** - Instant matching for combinations like *Combiflam*, *Augmentin 625*, *Zerodol SP*, and *Pan-D*.
* **Layer 2: NLM RxNorm & RxNav** - Standardized clinical concept resolution for global pharmaceutical entities.
* **Layer 3: Approximate String Matcher** - Handles phonetic misspellings such as *"Metforrmin"* or *"Amlodipine"*.
* **Layer 4: Botanical Registry** - Standardizes alternative preparations including *Ashwagandha*, *Ginkgo Biloba*, and *Turmeric*.
* **Layer 5: LLM Chemical Fallback** - Structured fallback via Groq LLaMA-3.3-70B with deterministic chemistry verification.

### 2. Deterministic Cumulative Regimen Engine
Evaluates all active medications simultaneously against 222,383 verified DDInter interaction records, AGS Beers Criteria 2023, and STOPP/START v3 guidelines to determine a unified WHO 5-Tier risk index.

### 3. Prescribing Cascade Correlator
Continuously evaluates newly logged patient symptoms against 581 clinical cascade rules. If a patient develops peripheral ankle edema after starting Amlodipine, PolySafe warns clinicians against prescribing a secondary loop diuretic.

### 4. Anticholinergic Cognitive Burden (ACB) Meter
Calculates cumulative muscarinic receptor blockade using the validated Boustani Scale across 567 scored medications. Scores equal to or exceeding 3 trigger immediate clinician alerts for acute delirium, memory impairment, and fall risks.

### 5. Multimodal Intelligent Intake
* **Prescription Vision OCR**: Dual-pipeline optical character recognition utilizing Google Gemini 2.5 Flash Lite for handwritten doctor slips, with offline Tesseract fallback.
* **Pill Imprint Identifier**: Identifies loose, unboxed pills by stamped code, shape, and color (e.g., `L484` maps to *Acetaminophen 500mg*).
* **Multi-Lingual Voice Intake**: Voice search supported in English, Hindi, and Gujarati.

---

## Deterministic Mathematical Scoring Models

> **Clinical Principle**: In safety-critical healthcare software, deterministic mathematics must always govern decision outputs. Generative AI is strictly restricted to plain-language explanation synthesis.

### 1. Regimen Risk Index Formula (WHO 5-Tier Scale)
Let $\mathcal{M} = \{m_1, \dots, m_N\}$ be the set of active medications. Each drug has an inherent toxicity score $h_i \in \{1, 2, 3, 4, 5\}$:

$$\mu_{\text{risk}} = \frac{1}{N} \sum_{i=1}^N h_i \quad \text{(Mean Toxicity)}$$

$$h_{\max} = \max_{1 \le i \le N} (h_i) \quad \text{(Peak Toxicity)}$$

$$F_{\text{major}} = \big|\{f \in \mathcal{F} \mid \text{Severity}(f) \in \{\text{MAJOR}, \text{CONTRAINDICATED}\}\}\big|$$

#### Clinical Decision Tree:
$$\mathcal{L}_{\text{regimen}} = 
\begin{cases} 
5 \text{ (CRITICAL)}, & \text{if } h_{\max} = 5 \;\lor\; F_{\text{active}} \ge 3 \\
4 \text{ (HIGH)},     & \text{else if } \mu_{\text{risk}} \ge 3.5 \;\lor\; F_{\text{major}} \ge 1 \\
3 \text{ (MODERATE)}, & \text{else if } \mu_{\text{risk}} \ge 2.5 \\
2 \text{ (MILD)},     & \text{else if } \mu_{\text{risk}} \ge 1.5 \\
1 \text{ (LOW)},      & \text{otherwise } (\mu_{\text{risk}} < 1.5)
\end{cases}$$

### 2. Anticholinergic Cognitive Burden (ACB) Equation
$$\text{TotalACB} = \sum_{i=1}^N \text{Score}(m_i) \quad \text{where } \text{Score}(m_i) \in \{0, 1, 2, 3\}$$

* **Score 0 (Normal)**: Baseline cholinergic cognitive function intact.
* **Score 1 - 2 (Moderate Burden)**: Mild drowsiness; potential memory complaints.
* **Score >= 3 (Critical Burden)**: Triples 12-month delirium, cognitive decline, and hip fracture incidence.

### 3. Duplicate Salt Toxicity & Safe Ceiling Limits
$$\text{Dose}_{\text{cumulative}}(S_k) = \sum_{i \in \text{Products}} \text{Dose}(m_i, S_k) \times \text{DailyFrequency}(m_i)$$

$$\text{Alert Triggered if: } \text{Dose}_{\text{cumulative}}(S_k) > \text{CeilingLimit}(S_k)$$

*(Example: Paracetamol daily ceiling is 4,000 mg/day in healthy adults, reduced to 2,000 mg/day in hepatic or elderly patients).*

### 4. Prescribing Cascade Directed Graph Traversal
Modeled as a directed temporal graph $G = (V, E)$ where $V = \text{Drugs} \cup \text{Symptoms}$:

$$\text{Cascade Match: } (m_A \rightarrow s) \in E \;\land\; (s \rightarrow m_B) \in E \;\land\; t(m_A) < t(s) \le t(m_B)$$

### 5. 4-System Organ Clearance Toxicity Vector
$$\vec{O}_{\text{regimen}} = \big[ O_{\text{Renal}}, \; O_{\text{Hepatic}}, \; O_{\text{Cardiovascular}}, \; O_{\text{CNS}} \big] \in [0.0, 1.0]^4$$

$$O_{\text{organ}} = \min\left(1.0, \; \frac{1}{2.5} \sum_{i=1}^N c_{\text{organ}}(m_i)\right)$$

### 6. Longitudinal 7-Day Adherence Metric
$$\text{Adherence \%} = \left( \frac{\text{Logged Doses with Status = 'TAKEN'}}{\text{Total Scheduled Dose Slots in last 7 days}} \right) \times 100$$

---

## Role-Based Clinical Portals

```text
+-----------------------------------------------------------------------------+
| PATIENT PORTAL (/home, /timeline, /medication-passport)                     |
| * Dynamic WHO 5-Tier Safety Status Ring                                     |
| * Morning, Noon, Evening, and Bedtime Daily Regimen Timetable               |
| * Trilingual Interface: English, Hindi, and Gujarati                        |
| * Projector Mode for high-contrast viewing on outpatient clinic monitors    |
| * Emergency Medical Passport with QR code verification                      |
+-----------------------------------------------------------------------------+
| DOCTOR PORTAL (/doctor-dashboard)                                           |
| * Ephemeral 6-digit PIN and QR code synchronization                         |
| * Prescriber Swimlane timeline categorizing Cardiology, Ortho, and OTC      |
| * Pre-Prescribing "What-If" Safety Simulator for candidate medications     |
| * Directives Dispatcher transmitting binding instructions to patient app    |
+-----------------------------------------------------------------------------+
| CAREGIVER PORTAL (/caregiver)                                               |
| * Privacy Shield: Adherence telemetry with ZERO drug name leakage           |
| * Dose status logs tracking taken versus missed administration times        |
| * Real-time reminder dispatching for overdue dose intervals                 |
+-----------------------------------------------------------------------------+
```

---

## 5-Person Team Presentation Division

Optimized for academic defenses and hackathon evaluations. Each member presents a focused 45-60 second domain:

| Member | Role & Focus | Core Speaking Points | Live Demo Screen Action |
|:---:|:---|:---|:---|
| **Member 1** | **Team Lead**<br/>*Problem & Urgency* | "Over 30% of elderly hospitalizations stem from adverse drug reactions. Specialists prescribe in silos, and conventional checkers test only pairs. PolySafe evaluates whole-regimen cumulative safety." | Introduce team, state clinical thesis, maintain presentation pacing. |
| **Member 2** | **Frontend Architect**<br/>*Patient Experience* | "Seniors require radical simplicity. The patient portal provides immediate safety clarity via our WHO status ring. We provide native Hindi, Gujarati, and English with offline PWA caching." | Toggle language (Hindi/Gujarati), toggle Projector Mode, present Medication Passport. |
| **Member 3** | **Pharmacology Lead**<br/>*Multi-Salt & Math* | "70% of Indian prescriptions are multi-salt combinations. Our 5-Layer Resolver deconstructs Combiflam into Ibuprofen and Paracetamol, preventing fatal overdoses. Our cascade engine stops misdiagnosis chains." | Add Combiflam to demonstrate salt deconstruction; point out ACB cognitive meter and cascade alerts. |
| **Member 4** | **AI & Vision Specialist**<br/>*OCR & Plain Explanations* | "Seniors struggle typing complex drug names. Our dual-vision Gemini OCR reads physical prescription slips, our pill finder identifies loose stamps like L484, and Groq LLaMA provides dual clinical and plain-text summaries." | Trigger prescription upload, match pill imprint `L484`, toggle between clinical and plain-text explanations. |
| **Member 5** | **Cloud & Doctor Portal**<br/>*Sync & Infrastructure* | "Physicians sync securely via 6-digit PIN. Before writing a prescription, our 'What-If' simulator checks candidate drugs against active regimens. Deployed serverless on Vercel and Neon Postgres with an 18/18 passed test audit." | Open Doctor Portal, run "What-If" simulation on Ibuprofen 400mg, show live `/health` endpoint response. |

---

## API Endpoint Reference (76 Endpoints)

PolySafe provides 76 production-tested REST endpoints across 9 functional routers:

### 1. Authentication & Identity (`/auth`)
* `POST /auth/check-email` - Check registration state for login vs signup routing.
* `POST /auth/patient/signup-send-otp` - Dispatch 6-digit email OTP for patient registration.
* `POST /auth/patient/verify-signup-otp` - Validate OTP and issue signed Bearer JWT.
* `POST /auth/patient/login` - Authenticate patient credentials with lockout protection.
* `POST /auth/doctor/signup` / `POST /auth/doctor/login` - Physician registration with medical license validation.
* `POST /auth/caregiver/signup-send-otp` / `POST /auth/caregiver/login` - Caregiver onboarding and authentication.
* `GET /auth/me` - Validate active session and return user role.

### 2. Medication Management & Resolution (`/medicine`)
* `GET /medicine` - Fetch all active medications for authenticated patient.
* `POST /medicine` - Add medication, resolve active salts, and trigger 5-dimension safety checks.
* `POST /medicine/batch` - Atomically validate and commit multi-drug prescription regimens.
* `GET /medicine/search?q=:query` - Search formulary with generic active chemical cross-referencing.
* `GET /medicine/:id/resolve` - Deconstruct specific product into active chemical salts.
* `DELETE /medicine/:id` - Soft-delete medication (`removedAt`) preserving clinical timeline records.
* `POST /medicine/identify-pill` - Identify loose physical pills by stamped code, shape, and color.

### 3. Prescription Vision OCR (`/medicine/scan`)
* `POST /medicine/scan` - Multipart image upload processed via Gemini 2.5 Flash Lite + Tesseract OCR.

### 4. Patient Diagnostics & Schedule (`/patient`)
* `GET /patient/home-summary` - Unified clinical dashboard payload (WHO tier, ACB score, interaction count, schedule).
* `GET /patient/timeline` - Chronological prescriber swimlane timeline with discontinued therapy history.
* `POST /patient/profile` - Update patient baseline metrics (age, conditions, allergies).
* `POST /patient/dose` - Record dose administration event (`TAKEN`, `SKIPPED`, `MISSED`).
* `GET /patient/adherence?days=7` - Calculate longitudinal 7-day adherence percentage and streak.

### 5. Physician Collaboration & Simulation (`/connection`)
* `POST /connection/generate-code` - Generate ephemeral single-use 6-digit linking PIN.
* `POST /connection/claim-code` - Doctor claims patient connection code.
* `POST /connection/doctor-safety-check` - Pre-prescribing "What-If" simulation testing hypothetical candidate drugs.
* `POST /connection/doctor-substitute` - Atomically replace an interacting medication with a safer alternative.
* `POST /connection/directive` - Transmit physician clinical directive to patient dashboard.

### 6. Caregiver Privacy-Protected Portal (`/caregiver`)
* `GET /caregiver/my-patients` - Retrieve linked patients with high-level risk badges.
* `GET /caregiver/patient-summary/:patientId` - Schedule telemetry with zero drug-name disclosure.
* `POST /caregiver/remind-patient/:patientId` - Dispatch immediate dose reminder notification.

### 7. Diagnostics (`/health`)
* `GET /health` - Return service heartbeat, database connection status, and runtime environment.

---

## Database Architecture

PolySafe utilizes Prisma ORM mapped to a Neon Serverless PostgreSQL instance:

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
```

---

## Local Installation & Quickstart

### Prerequisites
* **Node.js**: v18+ (Node.js 22 LTS recommended)
* **PostgreSQL**: v14+ (Local instance or Neon Serverless connection)
* **npm**: v9+

### 1. Clone the Repository
```bash
git clone https://github.com/meetchauhan17/PolySafe.git
cd PolySafe
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

Configure `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/polysafe?schema=public"
JWT_SECRET="your-secure-jwt-secret-key"
PORT=5000
NODE_ENV="development"
DEMO_MODE="false"

# Optional AI Credentials (built-in fallbacks available)
GROQ_API_KEY="your_groq_api_key"
GEMINI_API_KEY="your_gemini_api_key"
```

Initialize database and run seeders:
```bash
npx prisma db push
npm run seed
npm run dev
```
*Backend server initializes on `http://localhost:5000`.*

### 3. Frontend Setup
```bash
# In a separate terminal session
cd ../frontend
npm install
npm run dev
```
*Frontend application initializes on `http://localhost:3000`.*

---

## Master Verification Audit (18/18 Passed)

PolySafe includes an automated 18-step end-to-end integration test suite verifying clinical algorithms and API endpoints:

```bash
cd backend
npm test
```

```text
================================================================
      PolySafe Automated 18-Step Master System & API Audit      
================================================================
[HEALTH CHECK] GET /health OK (API: true, DB: true, DEMO: false)
[STEP 1/18] PASS: POST /auth/patient/signup-send-otp (Verification code sent)
[STEP 2/18] PASS: POST /auth/patient/verify-signup-otp (User Created)
[STEP 3/18] PASS: POST /auth/doctor/signup (Doctor Registered)
[STEP 4/18] PASS: POST /auth/patient/login (JWT Issued)
[STEP 5/18] PASS: POST /auth/doctor/login (Doctor JWT Issued)
[STEP 6/18] PASS: GET /auth/me (Authenticated role: PATIENT)
[STEP 7/18] PASS: POST /patient/profile (Age: 68, Conditions: HTN, AFib)
[STEP 8/18] PASS: POST /medicine (Warfarin 5mg - Harm Level L5 Assigned)
[STEP 9/18] PASS: POST /medicine (Aspirin 81mg - DDInter Flag Triggered)
[STEP 10/18] PASS: POST /medicine (Ginkgo Biloba - Herb-Drug Flag Triggered)
[STEP 11/18] PASS: GET /patient/home-summary (Status: CRITICAL, Level: L5)
[STEP 12/18] PASS: GET /patient/timeline (Chronological Provenance Verified)
[STEP 13/18] PASS: POST /medicine/identify-pill (Imprint "L484" Matched)
[STEP 14/18] PASS: POST /symptom (Log "swollen ankles" - Cascade Evaluated)
[STEP 15/18] PASS: POST /connection/generate-code (6-Digit Share PIN Created)
[STEP 16/18] PASS: POST /connection/claim-code + approve (Doctor Paired)
[STEP 17/18] PASS: GET /connection/mine + POST /connection/doctor-safety-check (Simulation OK)
[STEP 18/18] PASS: DELETE /medicine/:id (Soft-Delete Provenance Preserved)
================================================================
                 18/18 tests passed (100% OK)                   
================================================================
ALL 18 CLINICAL ENDPOINTS & SYSTEM WORKFLOWS VERIFIED (100% OK)
```

---

## Detailed Study Guide Chapter Index

The [`POLYSAFE_MASTER_PROJECT_AND_JUDGES_GUIDE.md`](./POLYSAFE_MASTER_PROJECT_AND_JUDGES_GUIDE.md) document contains 11 comprehensive chapters:

1. **What is PolySafe in Plain English?** - Relatable grandfather narrative, multi-doctor silos, and whole-regimen safety vs pair-checking.
2. **The Big Problem (Why PolySafe Must Exist)** - Clinical statistics (30%+ senior admissions, 50%+ preventable) and the 4 fatal healthcare traps.
3. **All Scores & Mathematical Logic (Maths First)**:
   - 3.1 Regimen Risk Score (Level 1 to 5) with mean toxicity $\mu_{\text{risk}}$, $h_{\max}$, and piecewise decision tree.
   - 3.2 Anticholinergic Cognitive Burden (Boustani ACB Score 0 to 12+).
   - 3.3 DDInter Interaction Severity, mechanistic classifications, and mathematical weights.
   - 3.4 Duplicate Salt Toxicity & Safe Ceiling Limits ($Dose_{\text{cumulative}}(S_k) > CeilingLimit(S_k)$).
   - 3.5 Prescribing Cascade Temporal Graph Traversal ($t(m_A) < t(s) \le t(m_B)$).
   - 3.6 Rolling 7-Day Adherence Percentage and Streak tracking.
   - 3.7 4-System Organ Toxicity Vector ($[Renal, Hepatic, Cardio, CNS]$).
4. **The 5 Core Safety Subsystems** - Detailed architectural mechanics of each layer.
5. **The 3 User Portals** - Patient Portal, Doctor Portal, and Caregiver Portal with privacy firewall.
6. **Complete Technical Architecture & Cloud Stack** - Frontend, backend, and Neon PostgreSQL database layers.
7. **Live Deployment & Cloud Infrastructure** - Live service endpoints, serverless database tier, and health diagnostics.
8. **5-Person Team Role Division** - Exact 45-60s speaking scripts and live demo click actions for all 5 team members.
9. **5-Minute Live Demo Timeline** - Second-by-second choreography for hackathon presentations.
10. **Judge Defense Bible** - Top 15 tough judge questions with golden, authoritative model answers.
11. **Medical & Technical Glossary** - Clear, simple definitions for 16 clinical and technical terms.

---

## Clinical Evidence Base & Standards

1. **DDInter Consortium**: Xiong et al., *DDInter: an online drug-drug interaction database with pharmacological mechanisms and safety levels*, Nucleic Acids Research, 2022. (222,383 records, 160,235 unique pairs).
2. **Anticholinergic Cognitive Burden (ACB) Scale**: Boustani M. et al., *Impact of anticholinergics on the aging brain*, Aging & Mental Health, 2008. (567 scored drugs).
3. **AGS Beers Criteria 2023**: The 2023 American Geriatrics Society Beers Criteria Update Expert Panel, Journal of the American Geriatrics Society, 2023.
4. **STOPP/START Criteria Version 3**: O'Mahony D. et al., *European Geriatric Medicine*, 2023.
5. **Prescribing Cascade Framework**: Rochon PA, Gurwitz JH. *The prescribing cascade revisited*, The Lancet, 2017. (581 clinical cascade rules).
6. **FDA OFFSIDES Post-Market Database**: Tatonetti NP. et al., *Data-driven prediction of drug effects and interactions*, Science Translational Medicine, 2012. (1.2M+ signals).
7. **NLM RxNorm Standards**: US National Library of Medicine standardized clinical drug nomenclature and RxCUI identifiers.
8. **Indian Pharmacopoeia Commission (IPC)**: National drug formulary standards for Fixed-Dose Combinations (FDCs).

---

## License & Clinical Ethical Boundaries

* **Informational Decision-Support Only**: PolySafe is a Clinical Decision Support System (CDSS) designed to assist licensed clinicians, patients, and caregivers. It does not replace independent professional medical judgment or diagnosis.
* **Privacy by Design**: Strict RBAC guarantees that caregivers never receive confidential medical diagnoses or raw drug names, and doctor connections require explicit patient PIN authorization.
* **License**: Licensed under the [MIT License](https://opensource.org/licenses/MIT).
