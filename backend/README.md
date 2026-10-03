# PolySafe Backend API & Clinical Intelligence Engine

<p align="center">
  <strong>High-Throughput Pharmacovigilance, DDInter 222K Matcher & Clinical Telemetry Service</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Runtime-Node.js_22_·_Express_5-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/ORM-Prisma_5-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Database-SQLite_/_PostgreSQL-003B57?style=flat-square&logo=postgresql&logoColor=white" alt="Database" />
  <img src="https://img.shields.io/badge/WebSockets-Socket.IO_4.8-010101?style=flat-square&logo=socketdotio&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/DDInter-222%2C385_Pairs-blue?style=flat-square" alt="DDInter" />
  <img src="https://img.shields.io/badge/Cascades-581_Rules-teal?style=flat-square" alt="Cascades" />
  <img src="https://img.shields.io/badge/Herbs-526_Pairs-green?style=flat-square" alt="Herbs" />
  <img src="https://img.shields.io/badge/Burden_Scores-561_Drugs-orange?style=flat-square" alt="ACB Burden" />
  <img src="https://img.shields.io/badge/Pill_Imprints-560_Records-purple?style=flat-square" alt="Pill Imprints" />
</p>

---

## Overview

The PolySafe Backend provides an enterprise REST and WebSocket API for clinical polypharmacy safety, prescribing cascade interception, and multi-persona pharmacovigilance. It powers high-speed pharmacological lookups against the 222K+ pair DDInter database, evaluates anticholinergic cognitive load across 561 validated agents, correlates patient symptoms with 581 cascade rules, and cross-checks 526 herbal monographs against active prescriptions.

---

## Clinical Datasets & Persisted Tables

| Dataset / Table | Records | Source / Standard | Clinical Scope |
| :--- | :--- | :--- | :--- |
| `DrugInteractionReference` | **222,385 pairs** | DDInter 2024 Master Repository | Pairwise DDI evaluation with bidirectional indexed ILIKE searches (`Contraindicated`, `Major`, `Moderate`, `Minor`). |
| `CascadeReference` | **581 rules** | CaDeN & Rochon Protocols | Matches patient complaints to offending drug classes to intercept iatrogenic prescribing cascades. |
| `HerbDrugReference` | **526 pairs** | Natural Medicines DB, MSKCC, WHO | Cross-checks 50+ herbal extracts against prescription classes for occult bleeding and CYP enzyme inhibition. |
| `BurdenScore` | **567 in DB** (561 unique drugs) | AGS Beers Criteria 2024 / Boustani ACB | Scores anticholinergic burden (0–3) to evaluate cumulative cognitive decline and fall risks. |
| `PillImprint` | **560 imprints** | FDA DailyMed & NLM Pillbox | Identifies unknown loose oral solids by alphanumeric stamp, color, shape, and scoring. |
| `DrugSideEffect` | **152 signals** | FDA OFFSIDES Adverse Events | Surfaces post-marketing adverse reactions with Proportional Reporting Ratios (PRR up to 50×). |
| `Indian Drug Formulary` | **102 brands + 251 aliases + 288 pre-resolved** | CDSCO & Top Indian Pharma | Resolves branded combination products (*Augmentin 625*, *Pan-D*, *Combiflam*, etc.) to active chemical salts. |

---

## Architecture & Directory Structure

```
backend/
├── data/                                 # Authoritative clinical datasets and reference caches
│   ├── ai-resolved-drugs.json            # 288 pre-computed brand-to-salt mappings
│   ├── burden-scores.json                # 561 clinical drugs with ACB scores 0–3 (567 in DB)
│   ├── cascade-references.json           # 581 prescribing cascade clinical pairs
│   ├── ddinter.csv                       # 222,385 drug-drug interaction pairs (13.1 MB)
│   ├── drugbank-id-cache.json            # 1,514 DrugBank ID to RxNorm mappings
│   ├── harm-levels.json                  # 205 drug harm level classifications
│   ├── herb-drug-interactions.json       # 526 herb-drug clinical mechanisms
│   ├── indian-aliases-generated.json     # 251 normalized Indian brand synonyms
│   ├── indianDrugs.js                    # 102 CDSCO Indian brand formulations
│   ├── offsides-sample.json              # 152 FDA adverse reactions (PRR >= 1.5, up to 50x)
│   └── pill-imprints.json                # 560 authentic pill physical imprints
├── prisma/                               # Database ORM schemas and seed scripts
│   ├── schema.prisma                     # Master schema with 14 models and 4 enums
│   ├── seed.js                           # DDInter CSV streaming database seeder
│   ├── seed-burden.js                    # Anticholinergic cognitive burden seeder
│   ├── seed-cascade.js                   # Prescribing cascade reference seeder
│   ├── seed-herb-drug.js                 # Herb-drug interaction seeder
│   ├── seed-pills.js                     # Loose pill imprints seeder
│   ├── seed-offsides.js                  # FDA OFFSIDES side effects seeder
│   └── seedIndianDrugs.js                # Indian formulary disk cache seeder
├── src/
│   ├── lib/                              # Shared singleton utilities (Prisma, demo fixtures, email)
│   ├── middlewares/                      # Auth JWT validation, role guards, and rate limiters
│   ├── routes/                           # Express route controllers (49 endpoints total)
│   ├── services/                         # Core algorithmic engines (burden, cascade, resolver, DDI)
│   └── index.js                          # Express bootstrap & Socket.IO server initialization
└── tests/                                # Automated integration and clinical test suites
    ├── test-all-endpoints.js             # 18-step master system & API integration audit (100% pass)
    └── test-indian-resolver.js           # 5-layer Indian formulation test suite (9/9 pass)
```

---

## API Endpoints (49 Handlers)

### 1. Authentication (`/auth`)
- `POST /auth/check-email`: Verify if user profile exists
- `POST /auth/patient/signup-send-otp`: Dispatch transactional email verification OTP
- `POST /auth/patient/verify-signup-otp`: Verify code and create patient record
- `POST /auth/patient/login`: Authenticate patient with email & password
- `POST /auth/doctor/signup`: Register licensed healthcare practitioner
- `POST /auth/doctor/login`: Authenticate doctor credentials
- `GET  /auth/me`: Retrieve authenticated user identity and RBAC role

### 2. Medication Management (`/medicine`)
- `GET    /medicine`: List patient's active and historical medications
- `POST   /medicine`: Add medication with automatic 5-layer resolution & DDI check
- `POST   /medicine/batch`: Bulk ingest multiple medications (e.g. after OCR scan)
- `GET    /medicine/search`: Autocomplete generic and Indian branded formulations
- `GET    /medicine/:id/resolve`: Resolve brand to chemical salts
- `GET    /medicine/sideeffects/lookup`: Query FDA OFFSIDES adverse reactions by drug name
- `GET    /medicine/:id/sideeffects`: Fetch pharmacovigilance signals for a specific medication
- `DELETE /medicine/:id`: Soft-delete medication (sets `removedAt` to preserve timeline)
- `POST   /medicine/identify-pill`: Match physical tablet by imprint, shape, and color

### 3. Patient Telemetry & Analytics (`/patient`)
- `POST /patient/profile`: Upsert age, diagnosed conditions, and allergen profile
- `GET  /patient/profile`: Retrieve patient clinical baseline
- `GET  /patient/home-summary`: Fetch aggregated risk score, LED status, and dose schedule
- `GET  /patient/timeline`: Complete chronological medication audit trail
- `GET  /patient/insights`: Pharmacological category breakdown and historical risk trajectory

### 4. Prescribing Cascades & Symptoms (`/symptom`)
- `POST /symptom`: Log patient complaint and cross-check against 581 cascade rules
- `GET  /symptom`: Retrieve history of logged symptoms and identified cascade links

### 5. Doctor Command Center & Consented Connections (`/connection`)
- `POST /connection/generate-code`: Generate 6-digit one-time clinic pairing PIN
- `POST /connection/claim-code`: Doctor claims patient pairing code
- `POST /connection/:id/approve`: Patient approves connection request
- `GET  /connection/mine`: Doctor retrieves linked patient directory
- `GET  /connection/doctor-patient/:patientId/timeline`: Complete cross-doctor medication history
- `GET  /connection/doctor-patient/:patientId/clinical-summary`: Organ radar and active risk profile
- `POST /connection/doctor-safety-check`: Pre-prescribing simulation against DDInter & herbs
- `POST /connection/doctor-prescribe`: Authorized physician prescription order
- `POST /connection/doctor-deprescribe`: Authorized deprescribing order with STOPP/START criteria
- `POST /connection/doctor-substitute`: Atomic drug replacement order
- `POST /connection/directive`: Publish clinical directive to patient dashboard
- `POST /connection/:id/revoke`: 1-click patient consent revocation

### 6. Multimodal Prescription Scanning (`/scan`)
- `POST /scan`: Multimodal prescription OCR (Gemini Vision $\rightarrow$ RxNorm $\rightarrow$ Tesseract)
- `POST /identify-pill`: Loose pill imprint identification

---

## Seeding & Initializing Databases

```bash
# Push Prisma schema to database (PostgreSQL or SQLite)
npx prisma db push

# Run full database seeders (DDInter, Cascades, Herbs, Burdens, Imprints, OFFSIDES)
node prisma/seed.js
node prisma/seed-cascade.js
node prisma/seed-herb-drug.js
node prisma/seed-burden.js
node prisma/seed-pills.js
node prisma/seed-offsides.js
```

---

## Verification & Testing

PolySafe includes an end-to-end integration test validating all 18 clinical workflows sequentially:

```bash
npm test
```

Expected output:
```
================================================================
      PolySafe Automated 18-Step Master System & API Audit      
================================================================
[STEP 1/18] PASS: POST /auth/patient/signup-send-otp
[STEP 2/18] PASS: POST /auth/patient/verify-signup-otp
[STEP 3/18] PASS: POST /auth/doctor/signup
[STEP 4/18] PASS: POST /auth/patient/login
[STEP 5/18] PASS: POST /auth/doctor/login
[STEP 6/18] PASS: GET /auth/me
[STEP 7/18] PASS: POST /patient/profile
[STEP 8/18] PASS: POST /medicine (Warfarin 5mg - Harm Level L5)
[STEP 9/18] PASS: POST /medicine (Aspirin 81mg - Pairwise DDInter Flagged)
[STEP 10/18] PASS: POST /medicine (Ginkgo Biloba - Herb-Drug Flagged)
[STEP 11/18] PASS: GET /patient/home-summary (Harm Gauge Calculated)
[STEP 12/18] PASS: GET /patient/timeline (Chronological Provenance Verified)
[STEP 13/18] PASS: POST /medicine/identify-pill (Loose Pill Resolved)
[STEP 14/18] PASS: POST /symptom (Prescribing Cascade Checked)
[STEP 15/18] PASS: POST /connection/generate-code (6-Digit Share PIN)
[STEP 16/18] PASS: POST /connection/claim-code + approve (Doctor Paired)
[STEP 17/18] PASS: GET /connection/mine + POST /connection/doctor-safety-check
[STEP 18/18] PASS: DELETE /medicine/:id (Soft-Delete Provenance Preserved)
================================================================
                 18/18 tests passed (100% OK)                   
================================================================
```
