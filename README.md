<div align="center">

# 🛡️ PolySafe

### *AI-Powered Polypharmacy Risk & Prescribing Cascade Engine*

<p align="center">
  <strong>Harm doesn't come from one bad prescription — it comes from what nobody is watching together.</strong>
</p>

[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<br/>

[🌟 Features](#-key-innovations) • [🏗️ Architecture](#-system-architecture) • [🔒 Permission Matrix](#-consent-driven-permission-matrix) • [⚡ Quickstart](#-getting-started) • [🚀 Deployment](#-deployment-guide) • [📚 Clinical Evidence](#-clinical-datasets--evidence)

---

</div>

## 📌 The Problem We Solve

In elderly and multi-condition patients, standard drug interaction checkers fail because they only check medications **two-at-a-time in isolation**. They miss the 4 real drivers of polypharmacy hospitalizations:

1. **Care Fragmentation:** A cardiologist prescribes *Drug A*; an orthopedist prescribes *Drug B* two months later. Neither physician has access to the full, active medication list.
2. **Prescribing Cascades:** A drug's adverse effect (e.g. Amlodipine causing peripheral ankle edema) is misdiagnosed as a new clinical condition, triggering a second unnecessary prescription (e.g. Furosemide).
3. **The "Not Real Medicine" Blind Spot:** Herbal supplements (Turmeric, Ashwagandha, Ginkgo Biloba) and OTC drugs are rarely reported during 10-minute clinic visits, despite severe bleeding and metabolic risks with anticoagulants.
4. **Cumulative Anticholinergic / Sedative Burden:** Multiple mild drugs add up to a dangerous cumulative load, causing confusion, fall fractures, and acute delirium even when every pairwise check is "safe."

**PolySafe** unifies the patient's entire medication lifecycle into a chronological, continuous safety timeline that catches all 4 gaps before harm occurs.

---

## 💡 Key Innovations

```
                                  ┌──────────────────────────────┐
                                  │   PolySafe Analysis Engine   │
                                  └──────────────┬───────────────┘
                                                 │
      ┌─────────────────────────┬────────────────┼─────────────────────────┬─────────────────────────┐
      │                         │                │                         │                         │
┌─────▼──────────────┐   ┌──────▼─────────────┐  │                  ┌──────▼─────────────┐   ┌──────▼─────────────┐
│ 1. Cross-Doctor    │   │ 2. Prescribing     │  │                  │ 3. Herb / OTC      │   │ 4. Cumulative      │
│    Timeline        │   │    Cascade Engine  │  │                  │    Interaction DB  │   │    Burden (ACB)    │
├────────────────────┤   ├────────────────────┤  │                  ├────────────────────┤   ├────────────────────┤
│ Chronological feed │   │ Maps symptom onset │  │                  │ Cross-checks herbs │   │ Scores cumulative  │
│ with consent-based │   │ to drug start date │  │                  │ against clinical   │   │ anticholinergic    │
│ role permissions   │   │ & known cascades   │  │                  │ interaction refs   │   │ sedative load (0-6)│
└────────────────────┘   └────────────────────┘  │                  └────────────────────┘   └────────────────────┘
                                                 │
                                     ┌───────────▼───────────┐
                                     │  Dual Explanation LLM │
                                     ├───────────────────────┤
                                     │ • Plain-Language      │
                                     │ • Clinical Rationale  │
                                     │ • 3 Doctor Questions  │
                                     └───────────────────────┘
```

### 1. 📅 Cross-Doctor Chronological Timeline
Tracks every prescription, OTC, and herbal addition chronologically with distinct visual markers, source attribution, dosage history, and strike-through preservation for discontinued drugs.

### 2. ⚡ Prescribing Cascade Detection Engine
When a patient logs a symptom (e.g. *leg swelling*, *dizziness*, *dry mouth*), PolySafe correlates symptom onset with preceding medication additions, warning physicians against treating a side effect with another drug.

### 3. 🌿 Herb-Drug & OTC Interaction Database
Built-in curated knowledge base cross-referencing Ayurvedic and herbal supplements against mainstream pharmaceuticals (e.g. *Turmeric + Warfarin*, *Ginkgo + Aspirin*, *St. John's Wort + SSRIs*).

### 4. 🧠 Cumulative Anticholinergic / Sedative Burden (ACB)
Computes cumulative anticholinergic cognitive load across all active regimens (0 to 6+ scale: `Normal`, `Moderate`, `Critical`), flagging delirium and fall risks before pairwise checks would trigger.

### 5. 📷 Smart Dual-Engine Prescription Label Scanner
Extracts active drug names, strengths, and dosages from camera photos or blister pack images using local Tesseract OCR, NLM RxNorm approximate fuzzy matching, and Indian combination brand resolution (e.g. *Naxdom 500* → *Naproxen 500mg + Domperidone 10mg*).

### 6. 🩺 Doctor Dashboard & Prescribing Safety Simulator
Physicians can enter a 6-digit patient share code to review read-only records and simulate proposed new prescriptions against the patient's existing regimen in real time before writing a script.

### 7. 🛡️ Privacy-Preserved Caregiver View
Empowers family members with high-level safety statuses (`SAFE` / `CAUTION` / `CRITICAL`) and daily dosage schedules **without exposing confidential drug names or diagnoses**.

---

## 🔒 Consent-Driven Permission Matrix

PolySafe adheres to strict zero-trust, patient-consent principles:

| Data / Feature | 👤 Patient | 🩺 Doctor (Connected) | 🤝 Caregiver (Connected) |
|---|:---:|:---:|:---:|
| **Medication Timeline** | Full Read / Write | Full Read-Only | ❌ No Drug Names |
| **Risk Explanations** | Plain-Language | Clinical + Plain | ❌ Hidden |
| **Safety Status (Safe / Caution)** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Daily Dose Schedule** | ✅ Exact Names & Times | ✅ Exact Names & Times | ✅ Time & Type Only |
| **Symptom Logs & Cascade Analysis** | Full Access | Full Access | ❌ Hidden |
| **Prescribing Safety Check** | ❌ N/A | ✅ Test Proposed Drugs | ❌ N/A |
| **Add / Edit / Remove Medicines** | ✅ Yes | ❌ Read-Only (Liability) | ❌ Read-Only |
| **Revoke Access Permissions** | ✅ Instant One-Click | ❌ Cannot manage others | ❌ Cannot manage others |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (React 19 + Vite)                       │
│  • Warm Clay Neumorphic UI (#EDE8DC)    • TanStack React Query v5           │
│  • Recharts Trends & Burden Trajectory • Framer Motion Micro-Animations     │
│  • Real-time Socket.IO updates         • Route-level lazyWithRetry Recovery │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / WebSockets
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                        BACKEND API (Node.js + Express 5)                    │
│  • RBAC Auth & JWT Middleware          • Socket.IO Live Room Broadcaster    │
│  • Prescription OCR Engine             • Prescribing Cascade Correlator     │
│  • DDInter 2024 Pairwise Checker       • ACB Burden Index Calculator        │
│  • Indian Brand Alias Resolver         • Dual-Persona Explanation Formatter │
└──────────────────────┬───────────────────────────────┬──────────────────────┘
                       │                               │
┌──────────────────────▼───────┐             ┌─────────▼──────────────────────┐
│    DATABASE (Prisma ORM)     │             │    EXTERNAL MEDICAL APIS       │
│  • PostgreSQL / SQLite       │             │  • NLM RxNorm / RxNav REST API │
│  • DDInter Reference Table   │             │  • Groq LLM (Dual Explanation) │
│  • ACB Burden Scoring Map    │             │  • Local Tesseract OCR Engine  │
│  • Cascade Rule Registry     │             │  • OCR.space Cloud Fallback    │
└──────────────────────────────┘             └────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/meetchauhan17/PolySafe.git
cd PolySafe
```

### 2. Backend Setup
```bash
cd backend
npm install

# Push Prisma schema to database (auto-generates SQLite / Postgres tables)
npx prisma db push

# Seed DDInter, ACB burden scores, herb-drug pairs, and cascade rules
npm run seed

# Start backend server (runs on http://localhost:5000)
npm start
```

### 3. Frontend Setup
```bash
# In a new terminal window
cd ../frontend
npm install

# Start Vite dev server (runs on http://localhost:3000)
npm run dev
```

Open **`http://localhost:3000`** in your browser.

---

## 🧪 Testing with Included Sample Prescriptions

PolySafe includes test samples for instant OCR validation without needing a physical prescription:
- Navigate to **Add Medicine** (`http://localhost:3000/add-medicine`).
- Click **`⚡ Try Sample (Naxdom 500)`** to run a live scan on the included multi-ingredient blister pack fixture (`Naproxen 500mg + Domperidone 10mg`).
- Watch PolySafe extract the drug, verify it via RxNorm, and check for interactions against your active regimen.

---

## 🚢 Deployment Guide

### Backend on Render
The backend includes a root `render.yaml` Blueprint for 1-click deployment on [Render](https://render.com):
1. Connect your GitHub repository to Render.
2. Choose **New → Blueprint** and select `render.yaml`.
3. Render automatically provisions the PostgreSQL database and Node.js Web Service.

### Frontend on Vercel
1. Import the repository on [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Vite`.
4. Add Environment Variable:
   - `VITE_API_URL` = `https://your-polysafe-backend.onrender.com`
5. Deploy.

---

## 📚 Clinical Datasets & Evidence

| Component | Source / Protocol | Clinical Role |
|---|---|---|
| **Drug-Drug Interactions** | **DDInter 2024 Database** | Validated pairwise pharmacological interaction references |
| **Drug Standardization** | **NLM RxNorm & RxNav** | Standardized RxCUI concept mapping & synonym normalization |
| **Anticholinergic Burden** | **ACB Cognitive Scale (Boustani et al.)** | Cumulative anticholinergic load scoring (0, 1, 2, 3+) |
| **Herb-Drug Interactions** | **MSKCC & Natural Medicines Database** | Botanical and supplement cross-reactivity mapping |
| **Prescribing Cascades** | **Canadian Deprescribing Network (CaDeN)** | Documented drug-induced symptom cascade rules |

---

## 🛡️ Security, Privacy & Ethics

- **Zero Diagnostic Overreach:** Every patient-facing summary includes mandatory clinical disclaimers. PolySafe acts as an informational safety buffer, not a diagnostic replacement.
- **Immediate Data Minimization:** Uploaded prescription label photos are processed in temporary memory/disk and **instantly unlinked and removed** upon scan completion.
- **Strict Role-Based Access Control:** Role boundaries (Patient, Doctor, Caregiver) are enforced cryptographically via signed JWTs and server-side route guards.

---

## 👥 Authors

- **Meet Chauhan** ([@meetchauhan17](https://github.com/meetchauhan17))
- **PolySafe Team** — *IEEE WIE ILS 2026 National Hackathon (Track 2: HealthTech)*

---

<div align="center">
  <sub>Built with ❤️ for safer geriatric and multi-condition polypharmacy care.</sub>
</div>
