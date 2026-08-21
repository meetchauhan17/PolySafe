# PolySafe UI & Visual Design System Audit
**Document:** `POLYSAFE_UI_AUDIT.md`  
**Date of Audit:** August 21, 2026  
**Scope:** Comprehensive inspection of every page in `/frontend/src/pages/` and component in `/frontend/src/components/`, design tokens (`tokens.css`), typography, color contrast, and layout styling across the platform.

---

## Executive Summary

PolySafe uses a **Warm Clay Neumorphic (Soft UI)** design system tailored for healthcare and clinical polypharmacy safety:
- **Base Surface:** Warm Clay (`#EDE8DC`) with dual-source extruded shadows (`rgba(191,180,155,0.55)` dark / `rgba(255,255,255,0.65)` light).
- **Core Typography:** **Fraunces** (Warm Editorial Serif for Headings) + **Source Sans 3** (High-legibility Body) + **IBM Plex Mono** (Dosages & Clinical Codes).
- **Clinical Safety Carve-Out:** Critical safety banners (`SAFE`, `CAUTION`, `DANGER/CRITICAL`) intentionally bypass neumorphic blending to maintain solid high-contrast backgrounds and 2px solid borders (WCAG AAA compliant).
- **Role Identity Theming:** **Patient** (Trust Teal `#2B6E5E`), **Doctor** (Deep Navy `#1B4B66`), and **Caregiver** (Warm Ochre `#8A6D3B`).

---

## 1. PAGE-BY-PAGE DETAILED UI AUDIT

### 1. `LoginPage.jsx` (`/login`)
- **Styling Approach:** Tailwind CSS v4 utility classes + Neumorphic custom tokens (`polysafe-card`, `icon-well`, `neu-inset`, `neu-extruded`) + Framer Motion animations.
- **Components Used & Structure:**
  - `Card`: Container for role selection, credentials, and OTP verification.
  - `PageTransition`: Route-level animated transitions.
  - `Lucide Icons`: `User`, `HeartHandshake`, `Stethoscope`, `Lock`, `Mail`, `Sparkles`, `ShieldCheck`.
  - Structure: Centered `max-w-lg` container on `#EDE8DC` backdrop $\rightarrow$ Brand Emblem Header $\rightarrow$ 3-Tab Neumorphic Role Selector $\rightarrow$ Conditional Form Step (`email` $\rightarrow$ `login` / `signup` $\rightarrow$ `otp`) $\rightarrow$ 1-Click Guest Mode Card.
- **Screenshot Equivalent Description:**
  - **Layout:** Centered single-column card with 32px corner radii on a warm matte clay background.
  - **Colors:** Warm clay `#EDE8DC`, Trust Teal `#2B6E5E`, Ink text `#1C2B27`, Muted `#5C6B64`, Danger red `#B23D25` (lockout countdown).
  - **Card Styles:** Extruded soft molded cards with 9px/16px dual shadows and circular inset icon wells.
  - **Spacing:** `px-4 py-8` container padding with `space-y-6` between header, form, and guest action.
  - **Button Styles:** Primary teal CTA with extruded elevation (`shadow-[4px_4px_8px_rgba(191,180,155,0.5)]`), active inset depression, and smooth hover elevation.

---

### 2. `OnboardingPage.jsx` (`/onboarding`)
- **Styling Approach:** Tailwind CSS + custom molded chip styles + dynamic progress indicator bar.
- **Components Used & Structure:**
  - `Card`: Main wizard card.
  - `PageTransition`: Smooth step progression.
  - Interactive Condition Chips: Multi-select button array (`Diabetes`, `Hypertension`, `Kidney Issues`, `Liver Issues`, `Heart Condition`).
  - Structure: Centered `max-w-md` wizard $\rightarrow$ Stepper progress dots $\rightarrow$ Step 1 (Age numerical stepper) $\rightarrow$ Step 2 (Condition tags) $\rightarrow$ Step 3 (Allergies tag input) $\rightarrow$ Navigation action bar (`Continue` / `Skip`).
- **Screenshot Equivalent Description:**
  - **Layout:** Focused single-card wizard with centered heading and step indicator dots.
  - **Colors:** Clay `#EDE8DC`, Trust Teal `#2B6E5E`, Active badge green `#E4F2E9`.
  - **Card Styles:** 32px rounded container with subtle 1px border accent (`#DCD5C6`).
  - **Spacing:** `space-y-6` layout flow, `gap-2` for condition pill tags.
  - **Button Styles:** Pill buttons transitioning from clay extruded (`#EDE8DC`) to active solid teal (`#2B6E5E` text-white).

---

### 3. `HomePage.jsx` (`/home`)
- **Styling Approach:** Tailwind CSS + Neumorphic Card tokens + Framer Motion animations + SVG progress rings.
- **Components Used & Structure:**
  - `Card`: Used for Status Banner, Regimen Risk Card, Schedule, and Medication tiles.
  - `DrugHarmBadge` & `DrugHarmPanel`: WHO/NCI 5-tier harm indicators (Tier 1–5).
  - `MedicineTypeBadge`: Prescription (Rx), OTC, and Herbal chips.
  - `SignOutConfirmButton`: Modal confirmation for session termination.
  - `EmptyIllustrations`: SVG empty-state placeholders.
  - Structure: Top Hero Header $\rightarrow$ Clinical Safety Banner (`SAFE` / `CAUTION` / `CRITICAL`) $\rightarrow$ Polypharmacy Regimen Risk Card (L1–L5) $\rightarrow$ Today's Schedule with reminder bell toggles $\rightarrow$ Active Medication Grid with OFFSIDES adverse effect expanders.
- **Screenshot Equivalent Description:**
  - **Layout:** Broad `max-w-5xl` dashboard grid with prominent top safety banner and 2-column or list-view medication cards.
  - **Colors:** High-contrast status tints (`#E4F2E9` green, `#FBEED9` amber, `#FBE4DE` red) surrounded by `#EDE8DC` clay surfaces.
  - **Card Styles:** Bold 2px colored borders on triage banners; soft extruded 32px molded clay cards for medications.
  - **Spacing:** `py-6 px-4` page container, `gap-4` grid spacing, `p-5` card internal padding.
  - **Button Styles:** Quick-action pill buttons (`+ Add Medicine`, `⚡ Risk Analysis`), daily reminder bell toggles with active amber glow.

---

### 4. `AddMedicinePage.jsx` (`/add-medicine`)
- **Styling Approach:** Tailwind CSS + Neumorphic molded inputs + interactive OCR scanning overlays + custom dropdown autocomplete.
- **Components Used & Structure:**
  - `Card`: Multi-modal prescription intake card.
  - `ScanResultsReviewCard`: Pre-fill review card displaying confidence badges, RxNorm chips, and prescriber attribution.
  - `DrugHarmBadge`: Real-time harm level preview on autocomplete items.
  - Loose Pill Imprint Modal: Imprint search with shape and color filters.
  - Duplicate Conflict Resolver Modal: Side-by-side dosage update confirm.
  - Structure: Top Navigation $\rightarrow$ Camera/Upload Dropzone $\rightarrow$ Gemini Scan Review Card $\rightarrow$ Indian Brand Autocomplete Search $\rightarrow$ Strength & Type Selectors $\rightarrow$ Frequency & Meal Timing $\rightarrow$ Live Socket.IO Interaction Evaluation CTA.
- **Screenshot Equivalent Description:**
  - **Layout:** Vertical form workflow with prominent top scanning zone and expandable autocomplete results panel.
  - **Colors:** Deep Teal `#2B6E5E`, Orange accent `#E0824B`, Soft Mint `#F4FAF8`, Neutral Ink `#1C2B27`.
  - **Card Styles:** Inset deep wells (`--neu-inset-deep`) for text inputs, extruded elevation for type selector cards.
  - **Spacing:** `space-y-6` between form sections, `gap-3` between dosage preset chips.
  - **Button Styles:** High-elevation teal primary CTA with scanning spinner and tactile press states.

---

### 5. `RiskAnalysisPage.jsx` (`/risk-analysis`)
- **Styling Approach:** Tailwind CSS + Molded Clay Tabs + Circular SVG progress meters + Dual-audience layout.
- **Components Used & Structure:**
  - `Card`: Container for risk meters and interaction breakdowns.
  - `DrugHarmBadge` & `DrugHarmPanel`: Harm meter breakdown.
  - `RiskAnalysisSkeleton`: Loading state skeleton.
  - Audience Tab Switcher: "For You" (Plain Patient Summary) vs "For the Doctor" (Pharmacology & Mechanism).
  - Structure: Hero Risk Banner $\rightarrow$ 2-Column Meter Grid (WHO/NCI Harm Meter + Anticholinergic ACB Gauge) $\rightarrow$ Audience Tab Switcher $\rightarrow$ Flagged Drug-Drug / Herb-Drug Interaction Cards.
- **Screenshot Equivalent Description:**
  - **Layout:** Analytical 2-column desktop / 1-column mobile layout with circular gauges and detailed expandable flag cards.
  - **Colors:** Risk reds (`#B23D25`), Caution ambers (`#B5791A`), Navy clinical tags (`#1B4B66`), Clay canvas (`#EDE8DC`).
  - **Card Styles:** High-contrast 2px bordered flag cards with severity badges in top-right.
  - **Spacing:** `gap-6` between meter panels, `space-y-4` between interaction cards.
  - **Button Styles:** Neumorphic tab pills that depress into an inset well when selected.

---

### 6. `LogSymptomPage.jsx` (`/log-symptom`)
- **Styling Approach:** Tailwind CSS + Neumorphic textarea with inset well + quick-select chip grid.
- **Components Used & Structure:**
  - `Card`: Main symptom logging card.
  - Quick-Select Symptom Chips: 11 common complaints (Ankle swelling, Dizziness, Dry mouth, Constipation, etc.).
  - Structure: Centered `max-w-2xl` container $\rightarrow$ Title with HeartPulse icon $\rightarrow$ Quick symptom suggestion chips $\rightarrow$ Free-text description textarea $\rightarrow$ Onset date picker $\rightarrow$ Prescribing Cascade analysis CTA.
- **Screenshot Equivalent Description:**
  - **Layout:** Clean single-column form with interactive chip cloud above a large description box.
  - **Colors:** Warm clay `#EDE8DC`, Deep teal `#2B6E5E`, Text ink `#1C2B27`.
  - **Card Styles:** Molded 32px card with drilled-in icon well.
  - **Spacing:** `gap-2` between symptom chips, `p-4` internal textarea padding.
  - **Button Styles:** Tactile quick-select chips that append text into the description field on click.

---

### 7. `SymptomResultPage.jsx` (`/symptom-result`)
- **Styling Approach:** Tailwind CSS + High-contrast amber warning banner + Structured clinical recommendation callouts.
- **Components Used & Structure:**
  - `Card`: Result and conversation guide container.
  - `CascadeMatchCard`: Prescribing cascade alert component with root drug identification.
  - Structure: Top Back Navigation $\rightarrow$ Prescribing Cascade Detection Alert Card (Offending Drug + Probability + Mechanism) $\rightarrow$ Doctor Conversation Guide Card $\rightarrow$ Return Home CTA.
- **Screenshot Equivalent Description:**
  - **Layout:** High-urgency centered alert layout highlighting drug-induced symptoms over secondary disease.
  - **Colors:** Alert amber `#FBEED9`, Amber border `#B5791A`, Charcoal ink `#232724`, Soft White `#FFFFFF`.
  - **Card Styles:** Solid 2px amber border with soft inner white sub-cards for discussion talking points.
  - **Spacing:** `space-y-6` between warning card and doctor preparation checklist.
  - **Button Styles:** Secondary return action buttons and primary consultation print/share actions.

---

### 8. `TimelinePage.jsx` (`/timeline`)
- **Styling Approach:** Tailwind CSS + Vertical animated timeline thread (`#E0824B`) + Framer Motion staggered list items.
- **Components Used & Structure:**
  - `Card`: Timeline event item cards.
  - `TimelineSkeleton`: Loading state placeholder.
  - `EmptyTimelineIllustration`: Empty-state SVG graphic.
  - Provenance Badges: Source tags (`Patient Self-Added`, `Dr. Sharma`, `Caregiver Added`).
  - Structure: Page Header $\rightarrow$ Chronological vertical timeline thread with animated nodes $\rightarrow$ Active and Discontinued Medication Events with flags $\rightarrow$ Discontinue medication action.
- **Screenshot Equivalent Description:**
  - **Layout:** Vertical chronological feed linked by an unbroken orange line with pulsating node markers.
  - **Colors:** Timeline orange `#E0824B`, Clay base `#EDE8DC`, Mint green `#E4F2E9`, Flag rose `#FBE4DE`.
  - **Card Styles:** Molded clay cards offset to the right of the vertical connector line.
  - **Spacing:** `pl-8` thread offset, `space-y-6` between historical medication events.
  - **Button Styles:** Small inline action buttons (`Discontinue`, `View Flag`).

---

### 9. `DoctorDashboardPage.jsx` (`/doctor-dashboard`)
- **Styling Approach:** Tailwind CSS + Doctor role navy accents (`#1B4B66`) + Responsive split-pane layout + Pre-prescribing modal.
- **Components Used & Structure:**
  - `Card`: Patient roster and timeline containers.
  - `DoctorSafetyCheckModal`: Pre-prescribing interaction testing modal.
  - `DrugHarmBadge`: Harm tier indicators.
  - `DoctorPatientListSkeleton` & `DoctorPatientDetailSkeleton`: Split loading states.
  - Structure: Doctor Header with Medical License $\rightarrow$ 6-Digit Patient Code Claim Card $\rightarrow$ Split Pane (Left: Connected Patient Roster; Right: Patient Detail, Timeline, Interaction Flags, and Pre-Prescribing Safety Check CTA).
- **Screenshot Equivalent Description:**
  - **Layout:** Dual-column clinical workstation with scrollable patient sidebar and comprehensive review pane.
  - **Colors:** Doctor Navy `#1B4B66`, Soft Ice Blue `#E9F1F5`, Alert Crimson `#B23D25`, Clay `#EDE8DC`.
  - **Card Styles:** Clinical cards with subtle navy borders (`border-[#1B4B66]/20`) and high-density typography.
  - **Spacing:** `gap-6` between sidebar and detail view, compact table padding (`py-2 px-3`).
  - **Button Styles:** High-contrast Navy primary CTA (`Run Safety Check`) and molded claim code button.

---

### 10. `DoctorSharePage.jsx` (`/share`)
- **Styling Approach:** Tailwind CSS + 6-digit individual PIN input grid + Canvas QR Code renderer + Expiry countdown.
- **Components Used & Structure:**
  - `Card`: Main share code card.
  - `QRCode`: Scannable SVG/Canvas QR Code.
  - `ExpiryCountdown`: Real-time 15-minute countdown clock.
  - Structure: Centered `max-w-md` card $\rightarrow$ Header with security lock icon $\rightarrow$ 6 Individual Inset Digit Boxes $\rightarrow$ Scannable QR Code Canvas $\rightarrow$ 15-Minute Expiry Indicator $\rightarrow$ Real-time approval polling listener.
- **Screenshot Equivalent Description:**
  - **Layout:** High-contrast security modal centered on screen with prominent numerical display.
  - **Colors:** Clay `#EDE8DC`, Charcoal `#1C2B27`, Accent Orange `#E0824B`, Teal `#2B6E5E`.
  - **Card Styles:** Deep inset shadow wells for each digit slot (`box-shadow: var(--neu-inset-deep)`).
  - **Spacing:** `gap-2` between 6 digit boxes, `space-y-5` vertical stack.
  - **Button Styles:** Molded icon buttons for `Copy Code` and `Refresh Code`.

---

### 11. `CaregiverViewPage.jsx` (`/caregiver-view`)
- **Styling Approach:** Tailwind CSS + Warm ochre caregiver accents (`#8A6D3B`) + Large-touch-target simplified layout.
- **Components Used & Structure:**
  - `Card`: Simplified patient summary and reminder cards.
  - `EmptyCaregiversIllustration` & `EmptyScheduleIllustration`: Empty state visuals.
  - Structure: Caregiver Header $\rightarrow$ Pending Invites Banner $\rightarrow$ Patient Status Card (`All Clear` / `Caution` / `Critical`) $\rightarrow$ Daily Schedule Timeline (Morning, Noon, Evening, Bedtime) with dose reminder badges.
- **Screenshot Equivalent Description:**
  - **Layout:** High-readability card stream designed for non-technical family members.
  - **Colors:** Ochre `#8A6D3B`, Warm Gold `#F7F3EB`, Safe Green `#E4F2E9`, Clay `#EDE8DC`.
  - **Card Styles:** Generously padded cards (`p-6`) with large icons and clear time labels.
  - **Spacing:** `space-y-6` between schedule segments, `gap-3` between dose items.
  - **Button Styles:** Large pill buttons for `Accept Invite` and `Mark Taken`.

---

### 12. `ConnectedPeoplePage.jsx` (`/connected`)
- **Styling Approach:** Tailwind CSS + Dual-section role segregation + Status badges.
- **Components Used & Structure:**
  - `Card`: Connection list cards and invite form card.
  - Status Badges: `Pending` (amber), `Approved` (green), `Revoked` (gray).
  - Structure: Page Header $\rightarrow$ Approved Doctors Section $\rightarrow$ Approved Caregivers Section $\rightarrow$ Invite Caregiver by Phone Form $\rightarrow$ Link to QR Code Share.
- **Screenshot Equivalent Description:**
  - **Layout:** Organized 2-section management dashboard with card list of active connections and quick invitation form.
  - **Colors:** Navy `#1B4B66` (Doctor), Ochre `#8A6D3B` (Caregiver), Clay `#EDE8DC`.
  - **Card Styles:** Neumorphic cards with role icon wells on left and status badge/revoke actions on right.
  - **Spacing:** `space-y-6` layout, `p-4` connection row padding.
  - **Button Styles:** Danger outline button (`Revoke Access`) and teal primary invite button.

---

### 13. `ProfilePage.jsx` (`/profile`)
- **Styling Approach:** Tailwind CSS + Inset editable form fields + Multi-select condition chips.
- **Components Used & Structure:**
  - `Card`: Profile details and health summary container.
  - Condition Tag Matrix: Multi-select condition buttons.
  - Structure: User Header with avatar well $\rightarrow$ Personal Information (Email, Role, Age) $\rightarrow$ Known Conditions Editor $\rightarrow$ Medication Allergies Editor $\rightarrow$ Save Changes / Sign Out Actions.
- **Screenshot Equivalent Description:**
  - **Layout:** Centered `max-w-2xl` account management page.
  - **Colors:** Clay `#EDE8DC`, Teal `#2B6E5E`, Text Ink `#1C2B27`.
  - **Card Styles:** Molded container with edit mode toggle button in header.
  - **Spacing:** `space-y-5` field grouping, `gap-2` condition chip grid.
  - **Button Styles:** Toggle condition pills that switch from extruded clay to solid teal.

---

### 14. `InsightsPage.jsx` (`/insights`)
- **Styling Approach:** Tailwind CSS + Recharts interactive SVG charts + Custom tooltip cards.
- **Components Used & Structure:**
  - `Card`: Chart containers and metric summaries.
  - `ResponsiveContainer`, `AreaChart`, `BarChart`, `LineChart`: Recharts visualization engines.
  - `CustomChartTooltip`: Custom branded tooltip component.
  - Structure: Analytics Header $\rightarrow$ Monthly Medication Trend Chart $\rightarrow$ Anticholinergic Burden Trajectory Chart $\rightarrow$ Drug Class Distribution Breakdown.
- **Screenshot Equivalent Description:**
  - **Layout:** Visual analytics dashboard with responsive 1-column / 2-column chart grids.
  - **Colors:** Teal curve `#2B6E5E`, Amber risk line `#E0824B`, Clay card `#EDE8DC`, White tooltip `#FFFFFF`.
  - **Card Styles:** Wide chart cards with legend badges and threshold reference lines.
  - **Spacing:** `h-64` chart viewport height, `gap-6` between metric cards.
  - **Button Styles:** Time-range filter pills (`3M`, `6M`, `1Y`).

---

## 2. COMPONENT DESIGN SYSTEM ARCHITECTURE

| Component | File | Primary Responsibility | Styling Mechanics |
|---|---|---|---|
| `<Card />` | [`Card.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/components/Card.jsx) | Core molded surface container | Neumorphic dual shadows (`--neu-extruded`), 32px radii, clinical safety carve-out variants (`safe`, `caution`, `danger`). |
| `<DrugHarmBadge />` | [`DrugHarmLevel.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/components/DrugHarmLevel.jsx) | WHO/NCI 5-Tier Drug Harm Indicator | Tiered colors (L1 Green $\rightarrow$ L5 Red), pill chips, and full expandable harm panels. |
| `<EmptyIllustrations />` | [`EmptyIllustrations.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/components/EmptyIllustrations.jsx) | Custom SVG empty states | Zero-dependency inline SVGs with warm clay palette accents. |
| `<Navbar />` | [`Navbar.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/components/Navbar.jsx) | Navigation bar | Sticky header, backdrop blur, active tab highlight pills, responsive mobile view. |
| `<GuestLockModal />` | [`GuestLockModal.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/components/GuestLockModal.jsx) | Read-only guest mode modal | Glassmorphic overlay, lock icon well, sign-in CTA. |
| `<Skeletons />` | [`Skeletons.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/components/Skeletons.jsx) | Skeleton loaders | Warm clay pulse animations matching exact card geometries. |
| `<PageTransition />` | [`PageTransition.jsx`](file:///c:/Meet/xyz/PolySafe/frontend/src/components/PageTransition.jsx) | Animated route transitions | Framer Motion fade-and-slide motion wrappers with reduced-motion support. |

---

## 3. TOP 5 UI PROBLEMS OBSERVED ACROSS ALL PAGES

### 1. Inconsistent Card Surface Backgrounds (Neumorphic Clay `#EDE8DC` vs Flat `bg-white`)
- **Problem:** While top-level `<Card />` components use the unified warm clay background (`#EDE8DC`), several nested cards and tooltips (e.g., in `InsightsPage.jsx` chart tooltips, `SymptomResultPage.jsx` discussion boxes, and `DoctorDashboardPage.jsx` prescription preview cards) use flat `bg-white` or `bg-white/80`.
- **Impact:** Breaks the tactile "molded clay" illusion by introducing stark flat white patches.
- **Recommendation:** Replace ad-hoc `bg-white` inner boxes with sub-surface inset wells (`bg-[#E6E0D3]` with `--neu-inset-sm`) or high-contrast clinical tints.

---

### 2. Mixed Hardcoded Hex Codes vs Design Token CSS Variables
- **Problem:** Multiple pages hardcode raw hex values like `bg-[#FBF8F2]`, `bg-[#F5F0E8]`, `border-[#DCD5C6]`, and `border-[#E7E1D3]` instead of referencing centralized CSS variables (`var(--brand-paper)`, `var(--brand-card)`, `var(--brand-border-visible)`).
- **Impact:** Minor color drift between screens where some backgrounds appear slightly yellow-shifted while others appear warm gray.
- **Recommendation:** Refactor inline hex values into Tailwind theme alias classes or standard CSS variables from `tokens.css`.

---

### 3. Form Input Inset Styling Divergence
- **Problem:** Input fields across `LoginPage.jsx`, `OnboardingPage.jsx`, `AddMedicinePage.jsx`, and `LogSymptomPage.jsx` have slight styling discrepancies. Some use deep drilled inset wells (`box-shadow: var(--neu-inset-deep)`), while others use traditional flat borders (`border border-[#DCD5C6]`).
- **Impact:** Form controls look tactile on some pages and standard flat on others.
- **Recommendation:** Create a reusable `<Input />` and `<Textarea />` component that standardizes `--neu-inset` shadow wells, 16px corner radii, and focused teal glow rings.

---

### 4. Mobile Responsiveness & Padding Compression on Small Viewports (<375px)
- **Problem:** The 6-digit PIN grid in `DoctorSharePage.jsx` and the 2-column harm meter grid in `RiskAnalysisPage.jsx` use wide padding (`p-6` / `p-8`) without adjusting on extra-small mobile viewports.
- **Impact:** On narrow mobile screens (320px–375px), digit boxes can shrink or wrap awkwardly, and gauge labels can overlap.
- **Recommendation:** Add responsive padding modifiers (`p-4 sm:p-6`) and `min-w-0` overflow guards on grid columns.

---

### 5. Interactive Focus Rings & Tactile Active States on Custom Elements
- **Problem:** While primary buttons have active press effects, several custom clickable elements (such as quick-select symptom chips in `LogSymptomPage.jsx`, condition toggles in `ProfilePage.jsx`, and reminder bell buttons in `HomePage.jsx`) lack keyboard `:focus-visible` focus rings and `:active` inset depressions.
- **Impact:** Inconsistent tactile feel and accessibility gaps for keyboard-only or screen-reader users.
- **Recommendation:** Standardize all clickable chips and icon buttons with `.polysafe-card-interactive` hover elevation, active inset shadow, and `focus-visible:ring-2 focus-visible:ring-[#2B6E5E]`.
