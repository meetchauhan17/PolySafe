# PolySafe UI & Visual Design System Audit
**Document:** `POLYSAFE_UI_AUDIT.md`  
**Date of Audit:** August 22, 2026  
**Scope:** Comprehensive inspection of every page in `/frontend/src/pages/` and component in `/frontend/src/components/`, design tokens (`tokens.css`), typography, color contrast, hardware chassis aesthetics, and layout styling across the platform.

---

## Executive Summary

PolySafe employs a cutting-edge **Industrial Skeuomorphic & Medical Telemetry Chassis** design system engineered specifically for clinical polypharmacy safety and pharmacovigilance:
- **Chassis Surface:** Continuous Cool-Grey Aluminum (`#e0e5ec` / `var(--chassis)`) paired with darker recessed wells (`#d1d9e6` / `var(--chassis-dark)`).
- **Calibrated Shadow System:** Refined Soft-UI dual-elevation matrices without harsh white fog or halos:
  - `--shadow-card`: `4px 4px 10px rgba(163, 177, 198, 0.6), -2px -2px 6px rgba(255, 255, 255, 0.7)`
  - `--shadow-floating`: `0 12px 28px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.7)`
  - `--shadow-recessed`: `inset 2px 2px 5px rgba(163, 177, 198, 0.6), inset -1px -1px 3px rgba(255, 255, 255, 0.6)`
  - `--shadow-pressed`: `inset 3px 3px 6px rgba(163, 177, 198, 0.65), inset -2px -2px 5px rgba(255, 255, 255, 0.65)`
- **Hardware Metaphors:**
  - Machined aluminum corner screws on all 4 corners of every panel.
  - Top-right stamped ventilation cooling slots.
  - Multi-state LED indicator diodes (`Safe` green, `Caution` amber, `Critical` red, `Online` blue).
  - High-precision monospace telemetry panels (`JetBrains Mono`).
- **Typography Architecture:**
  - **Display / Headings:** Modern sans-serif grotesque (`Inter`, `font-display`, `font-extrabold`).
  - **Body Text:** Neutral, high-legibility sans-serif (`Inter`, `font-body`).
  - **Clinical Telemetry & Codes:** Precision monospace (`JetBrains Mono`, `Roboto Mono`, `font-mono`).
- **Role Identity Matrix:**
  - **Patient Portal:** Clinical Violet (`#7C3AED` / `var(--accent-primary)`) + Teal accents (`var(--accent-secondary)`).
  - **Physician Portal:** Clinical Blue (`#2563EB` / `var(--role-doctor)`).
  - **Caregiver Portal:** Protective Amber (`#D97706` / `var(--role-caregiver)`).

---

## 1. PAGE-BY-PAGE DETAILED UI AUDIT

### 1. `LoginPage.jsx` (`/login`)
- **Styling Approach:** Industrial aluminum chassis panel + 3-role segmented toggle + Fixed skeuomorphic OTP verification boxes (`.otp-box`).
- **Components Used & Structure:**
  - `Card`: Centered hardware chassis module with corner screws and ventilation louvers.
  - `.otp-box`: Precision 48x56px recessed input slots with monospace font and paste distribution.
  - `Lucide Icons`: `User`, `HeartHandshake`, `Stethoscope`, `Lock`, `Mail`, `Sparkles`, `ShieldCheck`.
  - Structure: Centered `max-w-lg` aluminum module on `#e0e5ec` chassis $\rightarrow$ Stamped PolySafe Brand Mark $\rightarrow$ 3-Role Segmented Selector $\rightarrow$ Conditional Form Step (`email` $\rightarrow$ `login` / `signup` $\rightarrow$ `otp`) $\rightarrow$ 1-Click Guest Mode Card.
- **Visual Design Attributes:**
  - **Layout:** Centered single-column card with 32px corner radii, flush against continuous cool-grey canvas.
  - **Colors:** Chassis `#e0e5ec`, Chassis dark `#d1d9e6`, Clinical Violet `#7C3AED`, Text primary `#1e293b`.
  - **Card Styles:** Extruded aluminum panel with calibrated dual-elevation shadows and inset icon wells.
  - **Spacing:** `px-4 py-8` container padding with `space-y-6` between steps.
  - **Button Styles:** Primary violet CTA with tactile active depression (`--shadow-accent-pressed`).

---

### 2. `OnboardingPage.jsx` (`/onboarding`)
- **Styling Approach:** Step-by-step clinical intake wizard with multi-state tactile condition chips.
- **Components Used & Structure:**
  - `Card`: Aluminum intake module with required/optional badges.
  - `PolySafeInput`: Recessed number input for patient age.
  - Interactive Condition Chips: Multi-select button array (`Diabetes`, `Kidney Issues`, `Liver Issues`, `Heart Condition`, `None`).
  - Structure: Centered `max-w-2xl` wizard $\rightarrow$ Stepper progress $\rightarrow$ Age Step $\rightarrow$ Condition Chips $\rightarrow$ Allergies Textarea $\rightarrow$ Navigation action bar (`Save & Continue` / `Skip`).
- **Visual Design Attributes:**
  - **Layout:** Focused single-card wizard with centered heading and real-time validation badges.
  - **Colors:** Chassis `#e0e5ec`, Clinical Violet `#7C3AED`, LED Safe Green `#10b981`.
  - **Card Styles:** 32px rounded container with machined screws and subtle inset wells.
  - **Spacing:** `space-y-5` between form cards, `grid-cols-1 sm:grid-cols-2` for condition chips.
  - **Button Styles:** Tactile pill buttons transitioning from recessed chassis to active solid violet.

---

### 3. `HomePage.jsx` (`/home`)
- **Styling Approach:** Comprehensive clinical command center with pulsing LED diodes and multi-tier adverse risk meters.
- **Components Used & Structure:**
  - `Card`: Used for Status Overview Banner, Regimen Risk Scorecard, Daily Schedule, and Medication Tiles.
  - `LedIndicator`: Live hardware diodes (`Safe` / `Caution` / `Critical`).
  - `DrugHarmBadge` & `DrugHarmPanel`: WHO/NCI 5-tier harm indicators (Tier 1–5).
  - `MedicineTypeBadge`: Prescription (Rx), OTC, and Herbal chips.
  - `SignOutConfirmButton`: Skeuomorphic modal confirmation for session termination.
  - Structure: Hero Header with Quick-Action CTAs $\rightarrow$ Clinical Safety Banner with glowing LED $\rightarrow$ Cumulative Polypharmacy Regimen Risk Card (L1–L5) $\rightarrow$ Daily Schedule with reminder toggles $\rightarrow$ Active Medication Grid with OFFSIDES adverse effect expanders.
- **Visual Design Attributes:**
  - **Layout:** Broad `max-w-5xl` dashboard grid with prominent top safety banner and 2-column medication cards.
  - **Colors:** High-contrast illuminated borders (`border-[var(--led-*)]/60`) over `#e0e5ec` chassis.
  - **Card Styles:** Corner screws on all 4 corners, top-right ventilation slots, recessed internal wells.
  - **Spacing:** `py-6 px-4` page container, `gap-4` grid spacing, `p-5` card internal padding.
  - **Button Styles:** Quick-action pill buttons (`+ Add Medicine`, `⚡ Risk Analysis`), daily reminder bell toggles with active amber glow.

---

### 4. `AddMedicinePage.jsx` (`/add-medicine`)
- **Styling Approach:** Multimodal OCR AI intake hub with live viewfinder, two-sided scanning, barcode reader, and Indian brand autocomplete.
- **Components Used & Structure:**
  - `Card`: Multi-modal prescription intake card.
  - `ScanResultsReviewCard`: Pre-fill review card displaying confidence badges, RxNorm chips, and prescriber attribution.
  - `DrugHarmBadge`: Real-time harm level preview on autocomplete items.
  - Loose Pill Imprint Modal: Imprint search with shape and color filters.
  - Duplicate Conflict Resolver Modal: Side-by-side dosage update confirmation.
  - Structure: Mode Switcher (`Single Photo` vs `Two-Sided`) in recessed well $\rightarrow$ Camera/Upload Dropzone $\rightarrow$ Gemini Scan Review Card $\rightarrow$ Indian Brand Autocomplete Search $\rightarrow$ Strength & Type Selectors $\rightarrow$ Frequency & Meal Timing $\rightarrow$ Live Socket.IO Interaction Evaluation CTA.
- **Visual Design Attributes:**
  - **Layout:** Vertical form workflow with prominent scanning zone and padded search inputs (`style={{ paddingLeft: '44px' }}`).
  - **Colors:** Clinical Violet `#7C3AED`, Teal accent `#0F766E`, Chassis `#e0e5ec`.
  - **Card Styles:** Inset deep wells (`--shadow-recessed`) for text inputs, extruded elevation for type selector cards.
  - **Spacing:** `space-y-6` between form sections, `gap-3` between dosage preset chips.
  - **Button Styles:** High-elevation violet primary CTA with scanning spinner and tactile press states.

---

### 5. `RiskAnalysisPage.jsx` (`/risk-analysis`)
- **Styling Approach:** Dual-audience pharmacological intelligence engine with WHO/NCI harm gauges and Anticholinergic Cognitive Burden (ACB) telemetry.
- **Components Used & Structure:**
  - `Card`: Container for risk meters and interaction breakdowns.
  - `DrugHarmBadge` & `DrugHarmPanel`: Harm meter breakdown.
  - `RiskAnalysisSkeleton`: Loading state skeleton.
  - Audience Tab Switcher: "For You" (Plain Patient Summary) vs "For the Doctor" (Pharmacology & Mechanism).
  - Structure: Hero Risk Banner $\rightarrow$ 2-Column Meter Grid (WHO/NCI Harm Meter + Anticholinergic ACB Gauge) $\rightarrow$ Audience Tab Switcher $\rightarrow$ Flagged Drug-Drug / Herb-Drug Interaction Cards.
- **Visual Design Attributes:**
  - **Layout:** Analytical 2-column desktop / 1-column mobile layout with circular gauges and detailed expandable flag cards.
  - **Colors:** Risk red (`var(--led-critical)`), Caution amber (`var(--led-caution)`), Doctor Blue (`var(--role-doctor)`), Chassis (`#e0e5ec`).
  - **Card Styles:** 2px illuminated bordered flag cards with severity badges in top-right.
  - **Spacing:** `gap-6` between meter panels, `space-y-4` between interaction cards.
  - **Button Styles:** Segmented tabs with tactile active inset depression.

---

### 6. `LogSymptomPage.jsx` (`/log-symptom`)
- **Styling Approach:** Prescribing cascade detector intake with tactile quick-select complaint chips and onset date pickers.
- **Components Used & Structure:**
  - `Card`: Main symptom logging card.
  - Quick-Select Symptom Chips: 11 common complaints (Ankle swelling, Dizziness, Dry mouth, Constipation, etc.).
  - Structure: Centered `max-w-2xl` container $\rightarrow$ Title with HeartPulse icon $\rightarrow$ Quick symptom suggestion chips $\rightarrow$ Free-text description textarea $\rightarrow$ Onset date picker $\rightarrow$ Prescribing Cascade analysis CTA.
- **Visual Design Attributes:**
  - **Layout:** Clean single-column form with interactive chip cloud above a large description box.
  - **Colors:** Chassis `#e0e5ec`, Clinical Violet `#7C3AED`, Text primary `#1e293b`.
  - **Card Styles:** Molded 32px card with drilled-in icon well and corner screws.
  - **Spacing:** `gap-2` between symptom chips, `p-4` internal textarea padding.
  - **Button Styles:** Tactile quick-select chips that append text into the description field on click.

---

### 7. `SymptomResultPage.jsx` (`/symptom-result`)
- **Styling Approach:** High-contrast clinical cascade alert with root offending drug probability and doctor conversation guide.
- **Components Used & Structure:**
  - `Card`: Result and conversation guide container.
  - `CascadeMatchCard`: Prescribing cascade alert component with root drug identification.
  - Structure: Top Back Navigation $\rightarrow$ Prescribing Cascade Detection Alert Card (Offending Drug + Probability + Mechanism) $\rightarrow$ Doctor Conversation Guide Card $\rightarrow$ Return Home CTA.
- **Visual Design Attributes:**
  - **Layout:** High-urgency centered alert layout highlighting drug-induced symptoms over secondary disease.
  - **Colors:** Caution amber `#f59e0b`, Chassis `#e0e5ec`, Monospace telemetry `#334155`.
  - **Card Styles:** Solid 2px amber/red illuminated border with soft inner sub-cards for discussion talking points.
  - **Spacing:** `space-y-6` between warning card and doctor preparation checklist.
  - **Button Styles:** Secondary return action buttons and primary consultation print/share actions.

---

### 8. `TimelinePage.jsx` (`/timeline`)
- **Styling Approach:** Chronological regimen timeline linked by an illuminated vertical bus with provenance tracking.
- **Components Used & Structure:**
  - `Card`: Timeline event item cards.
  - `TimelineSkeleton`: Loading state placeholder.
  - `EmptyTimelineIllustration`: Empty-state SVG graphic.
  - Provenance Badges: Source tags (`Patient Self-Added`, `Dr. Sharma`, `Caregiver Added`).
  - Structure: Page Header $\rightarrow$ Chronological vertical timeline thread with animated nodes $\rightarrow$ Active and Discontinued Medication Events with flags $\rightarrow$ Discontinue medication action.
- **Visual Design Attributes:**
  - **Layout:** Vertical chronological feed linked by an unbroken violet line (`var(--accent-primary)`) with pulsating node markers.
  - **Colors:** Timeline violet `var(--accent-primary)`, Chassis base `#e0e5ec`, Safe green `var(--led-safe)`, Flag rose `var(--led-critical)`.
  - **Card Styles:** Molded chassis cards offset to the right of the vertical connector line.
  - **Spacing:** `pl-8` thread offset, `space-y-6` between historical medication events.
  - **Button Styles:** Small inline action buttons (`Discontinue`, `View Flag`).

---

### 9. `DoctorDashboardPage.jsx` (`/doctor-dashboard`)
- **Styling Approach:** High-density clinical workstation with split-pane patient browser, 6-digit access PIN connector, pre-prescribing safety simulation, and one-click clinical reports.
- **Components Used & Structure:**
  - `Card`: Patient roster, PIN connector, and clinical timeline containers.
  - `DoctorSafetyCheckModal`: Pre-prescribing interaction testing modal.
  - `DrugHarmBadge`: Harm tier indicators.
  - `DoctorPatientListSkeleton` & `DoctorPatientDetailSkeleton`: Split loading states.
  - Structure: Doctor Header with Medical License $\rightarrow$ 6-Digit Patient Code Claim Card $\rightarrow$ Split Pane (Left: Connected Patient Roster; Right: Patient Detail, Timeline, Interaction Flags, and Pre-Prescribing Safety Check CTA).
- **Visual Design Attributes:**
  - **Layout:** Dual-column clinical workstation with scrollable patient sidebar and comprehensive review pane.
  - **Colors:** Doctor Blue `#2563EB`, Alert Crimson `var(--led-critical)`, Chassis `#e0e5ec`.
  - **Card Styles:** Clinical cards with subtle blue borders and high-density typography.
  - **Spacing:** `gap-6` between sidebar and detail view, compact table padding (`py-2 px-3`).
  - **Button Styles:** High-contrast Blue primary CTA (`Run Safety Check`) and molded claim code button.

---

### 10. `DoctorSharePage.jsx` (`/share`)
- **Styling Approach:** Secure clinical access generation module with 6-digit PIN grid, canvas QR code renderer, and 15-minute countdown clock.
- **Components Used & Structure:**
  - `Card`: Main share code card.
  - `QRCode`: Scannable SVG/Canvas QR Code.
  - `ExpiryCountdown`: Real-time 15-minute countdown clock.
  - Structure: Centered `max-w-md` card $\rightarrow$ Header with security lock icon $\rightarrow$ 6 Individual Inset Digit Boxes $\rightarrow$ Scannable QR Code Canvas $\rightarrow$ 15-Minute Expiry Indicator $\rightarrow$ Real-time approval polling listener.
- **Visual Design Attributes:**
  - **Layout:** High-contrast security modal centered on screen with prominent numerical display.
  - **Colors:** Chassis `#e0e5ec`, Charcoal `#1e293b`, Accent Violet `#7C3AED`, Teal `#0F766E`.
  - **Card Styles:** Deep inset shadow wells for each digit slot (`box-shadow: var(--shadow-recessed)`).
  - **Spacing:** `gap-2` between 6 digit boxes, `space-y-5` vertical stack.
  - **Button Styles:** Molded icon buttons for `Copy Code` and `Refresh Code`.

---

### 11. `CaregiverViewPage.jsx` (`/caregiver-view`)
- **Styling Approach:** High-accessibility patient monitoring portal with simplified medication schedule and dose tracking.
- **Components Used & Structure:**
  - `Card`: Simplified patient summary and reminder cards.
  - `EmptyCaregiversIllustration` & `EmptyScheduleIllustration`: Empty state visuals.
  - Structure: Caregiver Header $\rightarrow$ Pending Invites Banner $\rightarrow$ Patient Status Card (`All Clear` / `Caution` / `Critical`) $\rightarrow$ Daily Schedule Timeline (Morning, Noon, Evening, Bedtime) with dose reminder badges.
- **Visual Design Attributes:**
  - **Layout:** High-readability card stream designed for non-technical family members.
  - **Colors:** Caregiver Amber `#D97706`, Safe Green `var(--led-safe)`, Chassis `#e0e5ec`.
  - **Card Styles:** Generously padded cards (`p-6`) with large icons and clear time labels.
  - **Spacing:** `space-y-6` between schedule segments, `gap-3` between dose items.
  - **Button Styles:** Large pill buttons for `Accept Invite` and `Mark Taken`.

---

### 12. `ConnectedPeoplePage.jsx` (`/connected`)
- **Styling Approach:** Dual-section clinical relationship manager with role segregation and real-time status badges.
- **Components Used & Structure:**
  - `Card`: Connection list cards and invite form card.
  - Status Badges: `Pending` (amber), `Approved` (green), `Revoked` (gray).
  - Structure: Page Header $\rightarrow$ Approved Doctors Section $\rightarrow$ Approved Caregivers Section $\rightarrow$ Invite Caregiver by Phone Form $\rightarrow$ Link to QR Code Share.
- **Visual Design Attributes:**
  - **Layout:** Organized 2-section management dashboard with card list of active connections and quick invitation form.
  - **Colors:** Doctor Blue `#2563EB`, Caregiver Amber `#D97706`, Chassis `#e0e5ec`.
  - **Card Styles:** Neumorphic cards with role icon wells on left and status badge/revoke actions on right.
  - **Spacing:** `space-y-6` layout, `p-4` connection row padding.
  - **Button Styles:** Danger outline button (`Revoke Access`) and violet primary invite button.

---

### 13. `ProfilePage.jsx` (`/profile`)
- **Styling Approach:** Aluminum patient identity card with condition toggles, allergy tags, and read-only account credentials.
- **Components Used & Structure:**
  - `Card`: Profile details and health summary container.
  - Condition Tag Matrix: Multi-select condition buttons.
  - Structure: User Header with avatar well $\rightarrow$ Personal Information (Email, Role, Age) $\rightarrow$ Known Conditions Editor $\rightarrow$ Medication Allergies Editor $\rightarrow$ Save Changes / Sign Out Actions.
- **Visual Design Attributes:**
  - **Layout:** Centered `max-w-2xl` account management page.
  - **Colors:** Chassis `#e0e5ec`, Violet `#7C3AED`, Text `#1e293b`.
  - **Card Styles:** Molded container with edit mode toggle button in header.
  - **Spacing:** `space-y-5` field grouping, `gap-2` condition chip grid.
  - **Button Styles:** Toggle condition pills that switch from recessed chassis to solid violet.

---

### 14. `InsightsPage.jsx` (`/insights`)
- **Styling Approach:** Interactive Recharts SVG analytics suite with floating skeuomorphic tooltip chassis.
- **Components Used & Structure:**
  - `Card`: Chart containers and metric summaries.
  - `ResponsiveContainer`, `AreaChart`, `BarChart`, `LineChart`: Recharts visualization engines.
  - `CustomChartTooltip`: Floating hardware chassis panel with monospace telemetry.
  - Structure: Analytics Header $\rightarrow$ Monthly Medication Trend Chart $\rightarrow$ Anticholinergic Burden Trajectory Chart $\rightarrow$ Drug Class Distribution Breakdown.
- **Visual Design Attributes:**
  - **Layout:** Visual analytics dashboard with responsive 1-column / 2-column chart grids.
  - **Colors:** Violet curve `#7C3AED`, Amber risk line `#f59e0b`, Chassis `#e0e5ec`.
  - **Card Styles:** Wide chart cards with legend badges and threshold reference lines.
  - **Spacing:** `h-64` chart viewport height, `gap-6` between metric cards.
  - **Button Styles:** Time-range filter pills (`3M`, `6M`, `1Y`).

---

## 2. COMPONENT DESIGN SYSTEM ARCHITECTURE

| Component | File | Primary Responsibility | Styling Mechanics |
|---|---|---|---|
| `<Card />` | [`Card.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/components/Card.jsx) | Core molded surface container | Neumorphic dual shadows (`--shadow-card`), 32px radii, 4 corner screws, top-right ventilation slots, illuminated status borders (`safe`, `caution`, `critical`). |
| `<LedIndicator />` | [`LedIndicator.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/components/LedIndicator.jsx) | Hardware status diode | Pulsing glowing LED lights with configurable status (`safe`, `caution`, `critical`, `online`, `offline`) and sizes (`sm`, `md`, `lg`). |
| `<DrugHarmBadge />` | [`DrugHarmLevel.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/components/DrugHarmLevel.jsx) | WHO/NCI 5-Tier Drug Harm Indicator | Tiered colors (L1 Green $\rightarrow$ L5 Red), pill chips, and full expandable harm panels. |
| `<EmptyIllustrations />` | [`EmptyIllustrations.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/components/EmptyIllustrations.jsx) | Custom SVG empty states | Zero-dependency inline SVGs matching the cool-grey aluminum design language. |
| `<Navbar />` | [`Navbar.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/components/Navbar.jsx) | Top navigation bar | Sticky chassis bar, backdrop blur, active tab highlight pills, responsive mobile view. |
| `<GuestLockModal />` | [`GuestLockModal.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/components/GuestLockModal.jsx) | Read-only guest mode modal | Skeuomorphic overlay, lock icon well, sign-in CTA. |
| `<Skeletons />` | [`Skeletons.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/components/Skeletons.jsx) | Skeleton loaders | Chassis pulse animations matching exact card geometries. |
| `<PageTransition />` | [`PageTransition.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/components/PageTransition.jsx) | Animated route transitions | Framer Motion fade-and-slide motion wrappers with reduced-motion support. |

---

## 3. AUDIT STATUS & VERIFICATION

| Verification Metric | Target | Current Status | Notes |
|---|---|---|---|
| **Build Integrity** | 0 build errors | ✅ **100% Passed** | Clean Vite production bundle across 2,943 modules |
| **Shadow Quality** | No white halos / bleed | ✅ **100% Calibrated** | Calibrated specular highlights (`rgba(255,255,255,0.7)`) |
| **Typography Standard** | Modern sans + mono | ✅ **100% Unified** | Purged all legacy serif overrides across all pages |
| **Input Alignment** | Fixed dimensions & centered | ✅ **100% Fixed** | 6-slot OTP & PIN inputs styled with `.otp-box` |
| **Email Verification** | Live SMTP Delivery | ✅ **100% Live** | Nodemailer Gmail SMTP (`strangegaming66@gmail.com`) active |
| **Test Suite** | 18/18 Automated Tests | ✅ **18/18 Passing** | Comprehensive auth, scan, safety & sharing tests verified |
