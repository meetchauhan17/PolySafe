# PolySafe Frontend Client

<p align="center">
  <strong>Clinical Polypharmacy Risk Telemetry, Prescribing Cascade Interception & Pharmacovigilance Interface</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Framework-React_19_·_Vite_8-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Styling-TailwindCSS_v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="TailwindCSS 4" />
  <img src="https://img.shields.io/badge/Icons-Lucide_React-F56565?style=flat-square" alt="Lucide React" />
  <img src="https://img.shields.io/badge/State-TanStack_Query_v5-FF4154?style=flat-square&logo=react-query&logoColor=white" alt="TanStack Query" />
  <img src="https://img.shields.io/badge/Realtime-Socket.IO_Client_4.8-010101?style=flat-square&logo=socketdotio&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/Indications-691_Curated_Medicines-008080?style=flat-square" alt="Indications" />
</p>

---

## Overview

The PolySafe Frontend is an enterprise clinical client designed to bridge fragmented healthcare silos between **Patients**, **Attending Physicians**, and **Family Caregivers**. Built on React 19 and Vite 8, the interface delivers real-time pharmacological risk feedback, presymptomatic prescribing cascade detection, and pharmacovigilance signals with zero visual lag.

---

## Key Clinical Features & Formularies

### 1. Clinical Indications Formulary (691 Mapped Medicines)
- **File:** `src/utils/indications.js`
- **Scope:** 691 curated pharmaceutical and OTC formulations mapped to their exact clinical therapeutic indications (e.g., "What this medicine is used for").
- **Clinical Classes:** Cardiovascular, Anti-Diabetic, Antibacterial/Antiviral, CNS/Psychiatric, Analgesic/NSAID, Respiratory, Gastrointestinal, Endocrine, and Oncology.
- **Utility:** Provides instant therapeutic context alongside interaction alerts, ensuring patients and clinicians understand both the intended purpose and risk profile of every drug in the regimen.

### 2. Pharmacovigilance Telemetry Drawers (`KnownSideEffectsPanel`)
- **Component:** `src/components/DrugHarmLevel.jsx`
- **Signals:** Directly visualizes post-market adverse drug reactions from the **FDA OFFSIDES** database with Proportional Reporting Ratios (PRR up to 50×).
- **Multi-Factor Risk Display:**
  - Ranked adverse reactions by reporting disproportionality.
  - Anticholinergic Cognitive Burden (ACB) scores (0–3) from the 561-drug Beers 2024 index.
  - Known prescribing cascade triggers and offending drug classes.
  - Herbal cross-reaction cautions (526 monographs).

### 3. Dual-Persona Clinical Explanations
- Toggleable clinical explanations powered by Groq LLaMA-3.3-70B with Google Gemini Flash fallback:
  - **For the Patient:** Plain-language, low-jargon guidance, warning signs, and dietary tips.
  - **For the Doctor:** Pharmacodynamic mechanisms, CYP450 enzyme pathways, and recommended clinical interventions.

### 4. Interactive Organ Toxicity Radar
- Interactive Recharts visualization tracking 4 physiological systems:
  - **Renal Clearance**
  - **Hepatic Metabolism**
  - **Cardiovascular Strain**
  - **Central Nervous System (CNS) Burden**

---

## Design System: Clinical Telemetry & Elevated Surface

PolySafe adheres to a strict medical-grade UI design system codified in `src/tokens.css`:

| Token | Value | Clinical Purpose |
| :--- | :--- | :--- |
| `--chassis` | `#eef2f7` | Base cool-grey aluminum continuous canvas |
| `--chassis-dark` | `#dde4ee` | Recessed wells, borders, and input backgrounds |
| `--brand-surface` | `#ffffff` / `#1e293b` | Crisp elevated cards and modal containers |
| `--accent-primary` | `#0891b2` | Medical Cyan for patient actions and telemetry |
| `--role-doctor` | `#2d6a9f` | Clinical Slate Blue for physician workflows |
| `--role-caregiver` | `#2d8a6e` | Protective Emerald for caregiver views |
| `--led-safe` | `#16a34a` | Green clinical status diode |
| `--led-caution` | `#c07a0a` | Warm amber warning diode |
| `--led-critical` | `#dc2626` | Emergency crimson interaction diode |

### Visual Rules
- **Zero-Emoji Iconography:** All visual cues exclusively utilize calibrated SVGs from `lucide-react`.
- **Zero-Bleed Elevation:** Soft, crisp multi-layer shadows (`--shadow-card`, `--shadow-card-hover`, `--shadow-floating`) eliminate visual fog and bleeding.
- **Accessibility & Contrast:** Exceeds WCAG AAA standards with text contrast ratios up to 13.8:1 on primary surfaces.

---

## Page Architecture & Routes

```
src/
├── pages/
│   ├── LoginPage.jsx                 # /login             (Role toggle: Patient, Doctor, Caregiver + OTP)
│   ├── OnboardingPage.jsx            # /onboarding        (Clinical history, allergies, chronic conditions)
│   ├── HomePage.jsx                  # /home              (Live regimen, LED status, daily dose timeline)
│   ├── AddMedicinePage.jsx           # /add-medicine      (RxNorm autocomplete, camera OCR, pill imprint)
│   ├── RiskAnalysisPage.jsx          # /risk-analysis     (Harm gauges, ACB index, dual explanation)
│   ├── LogSymptomPage.jsx            # /log-symptom       (Symptom intake with 11 quick chips)
│   ├── SymptomResultPage.jsx         # /symptom-result    (Prescribing cascade detection & doctor guide)
│   ├── TimelinePage.jsx              # /timeline          (Chronological active/discontinued audit trail)
│   ├── InsightsPage.jsx              # /insights          (Pharmacological category & risk charts)
│   ├── DoctorDashboardPage.jsx       # /doctor-dashboard  (Physician hub: 2-tier banner, organ radar)
│   ├── DoctorSharePage.jsx           # /share             (6-digit claim PIN + live QR code)
│   ├── CaregiverViewPage.jsx         # /caregiver-view    (Redacted daily dose compliance schedule)
│   ├── ConnectedPeoplePage.jsx       # /connected         (Patient consent & connection management)
│   └── ProfilePage.jsx               # /profile           (Demographics, conditions, allergens)
```

---

## Component Library

- **`Card.jsx`**: Base elevated chassis container with calibrated borders.
- **`LedIndicator.jsx`**: Hardware-style pulsing clinical status diode.
- **`DrugHarmBadge.jsx`**: WHO/NCI 5-tier harm classification indicator.
- **`DrugHarmLevel.jsx`**: Harm tier display integrated with the expandable `KnownSideEffectsPanel`.
- **`PolySafeButton.jsx`**: Tactile interactive button with active depression styling.
- **`PolySafeInput.jsx`**: Accessible form control with recessed chassis styling.
- **`ClinicalLoader.jsx`**: High-precision medical telemetry spinner.
- **`GuestLockModal.jsx`**: Frosted glass interceptor for unauthenticated demonstration flows.

---

## Development & Build Commands

```bash
# Install frontend dependencies
npm install

# Start Vite development server (default port 3000)
npm run dev

# Compile production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## Production Deployment

- **Vercel Configuration:** Pre-configured with `vercel.json` for seamless client-side single-page application (SPA) routing:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
- **Environment Variables:**
  - `VITE_API_URL`: Root URL of the PolySafe backend service (e.g. `http://localhost:5000` or production URL).
