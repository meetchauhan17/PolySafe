# PolySafe — FINAL Build Sequence (Consolidated, End-to-End)

**This replaces PolySafe_Antigravity_Build_Prompts.md and all six fix-files that came after it.** Everything is merged into one correctly-ordered sequence — nothing to apply on top afterward. Run these 28 prompts in order, testing after each one.

---

### Prompt 1 — Project Scaffolding (Full Dependency List)
```
Set up a full-stack project called PolySafe with /backend and /frontend folders.

Backend: Node.js + Express. Install: express, prisma, @prisma/client, zod, multer, socket.io, cors, dotenv, bcrypt, jsonwebtoken, qrcode, express-rate-limit, axios, resend, node-tesseract-ocr. Set up Express on port 5000 with GET /health returning { status: "ok" }. Set up nodemon for dev.

Frontend: React + Vite. Install: react-router-dom, @tanstack/react-query, socket.io-client, axios, framer-motion, lucide-react, react-hot-toast, recharts.

Set up routing with placeholder pages for: /role-select, /login, /onboarding, /home, /add-medicine, /risk/:id, /log-symptom, /symptom-result, /timeline, /connected-people, /doctor-dashboard, /caregiver-view.

Create /backend/.env.example listing: DATABASE_URL, JWT_SECRET, GROQ_API_KEY, OCR_SPACE_API_KEY, RESEND_API_KEY, DEMO_MODE.

Set up .gitignore covering node_modules, .env, and build folders.
```

---

### Prompt 2 — Design Tokens & Reusable Card Component
```
Create a centralized design tokens file (/frontend/src/styles/tokens.css or tailwind.config.js theme.extend) with these exact values as named tokens — every component must reference these, never hardcode:

Colors: ink #1C2B27, paper #FBF8F2, card #FFFFFF, line #E7E1D3, trust #2B6E5E, trust-dark #1F5347, trust-soft #E5EFEB, safe #2F8558, safe-soft #E4F2E9, caution #B5791A, caution-soft #FBEED9, danger #B23D25, danger-soft #FBE4DE, accent #E0824B.
Fonts: 'Fraunces' (serif, 500/700 weight) for headings, 'Source Sans 3' for body, 'IBM Plex Mono' for numeric/dosage/timestamp data.
Radius: 16-18px for cards, 12px for inputs/buttons.

Build a reusable <Card> component (/frontend/src/components/Card.jsx) accepting children and props (variant: "default"|"caution"|"danger"|"safe", title, icon). Always renders with: white background, 2px border (color per variant), border-radius 16px, padding 20px, box-shadow 0 6px 16px rgba(28,43,39,0.10). Use CSS Grid with align-items:stretch in any multi-card layout so cards in a row are always equal height.

Every box/panel built in later prompts (status cards, feature panels, list rows, flag cards) MUST use this Card component — never one-off inline-styled divs. This is the single fix for inconsistent "AI-generated" looking UI boxes.

Avoid generic AI-SaaS defaults: no default indigo/purple gradients, no default Tailwind blue-600, no generic unstyled components. Every element should visibly belong to the PolySafe brand.
```

---

### Prompt 3 — Toast Notification System (Build Early)
```
Set up react-hot-toast at the app root (or use the sonner alternative if preferred). Create a small wrapper (/frontend/src/utils/toast.js) exporting showSuccess(message), showError(message), showInfo(message) — each styled with the token colors (safe green background for success, danger red for errors, trust teal for info), sliding in from top-right, auto-dismissing after ~4 seconds.

This is built early and deliberately — every prompt from here on that involves a user action (sending an OTP, saving data, an error occurring) should call one of these three functions so no action in the app is ever silent about whether it succeeded or failed.
```

---

### Prompt 4 — Database Schema (Prisma)
```
Create schema.prisma with these models (PostgreSQL provider, DATABASE_URL from env):

User: id, name (String, required), email (unique), phone (nullable, optional/unused for OTP), passwordHash, role (enum: PATIENT, CAREGIVER, DOCTOR, PHARMACIST), registrationNumber (nullable, doctors only), failedLoginAttempts (Int, default 0), lockedUntil (DateTime, nullable), createdAt.

PendingSignup: id, name, email, passwordHash, role, otpCode, expiresAt, createdAt — temporary holding table until OTP is verified; no real User is created until then.

Patient: id, userId, age, conditions (String array), allergies (String array).

Medicine: id, patientId, name, standardizedCode, type (enum: PRESCRIPTION, OTC, HERBAL), addedBy, dateAdded, dosage (nullable).

Symptom: id, patientId, description, dateLogged, possibleCauseMedicineId (nullable).

Connection: id, patientId, connectedUserId, role (enum: CAREGIVER, DOCTOR), status (enum: PENDING, APPROVED, REVOKED), shareCode (nullable), expiresAt (nullable), createdAt.

InteractionFlag: id, patientId, medicineAId, medicineBId, severity, burdenScore (nullable), burdenLevel (nullable), clinicalExplanation, plainExplanation, dateFlagged.

Run prisma migrate dev for the initial migration and generate the client.
```

---

### Prompt 5 — Hybrid Auth Backend (OTP-Once, Password-After)
```
Build authentication in /routes/auth.js with this model: Doctor uses email+password only (no OTP ever). Patient/Caregiver use email+password, with a ONE-TIME OTP verification only at signup — never on subsequent logins.

POST /auth/check-email — accepts { email, role }, returns { exists: true|false }.

POST /auth/patient/signup-send-otp — accepts { name, email, password, role: PATIENT|CAREGIVER }. Validate password min 8 characters. Hash with bcrypt. Store name/email/passwordHash/role in PendingSignup with a generated 6-digit code and 10-minute expiry — do NOT create the real User yet. Send the code via Resend (RESEND_API_KEY) with clear branded copy: "Your PolySafe verification code is: XXXXXX. Expires in 10 minutes." Call showSuccess("Code sent to your email") on success from the frontend side.

POST /auth/patient/verify-signup-otp — accepts { email, code }. Validates against PendingSignup, and only NOW creates the real User record, deletes the pending record, returns a JWT. This is the ONLY point in the entire app where OTP happens.

POST /auth/patient/login — accepts { email, password, role }. Check lockedUntil first (return remaining lockout time if locked). bcrypt-compare password. Success: reset failedLoginAttempts to 0, return JWT. Failure: increment failedLoginAttempts; at 5, set lockedUntil to +15 minutes; always return a generic "invalid email or password" (never reveal which part was wrong).

POST /auth/doctor/signup — accepts { name, email, password, registrationNumber }. bcrypt hash, create User with role DOCTOR directly (no OTP — doctors are email+password only), return JWT.

POST /auth/doctor/login — email + password, bcrypt compare, same lockout logic as patient login, return JWT.

Auth middleware (middleware/auth.js): verify JWT, attach { userId, role } to req.user. requireRole(roles) middleware for role checks.

Rate limiting: signup-send-otp max 5/email/hour. All login endpoints max 10 attempts/IP/15min via express-rate-limit, PLUS the per-account lockedUntil field as a second layer.
```

---

### Prompt 6 — AuthContext, Guest Mode & Back-Button Fix
```
Build a single centralized AuthContext (/frontend/src/context/AuthContext.jsx) — the ONE source of truth for auth state across the whole app. Exposes: user ({ userId, role, isGuest } or null), login(token, role), logout(), enterGuestMode(), isLoading.

On app mount, check localStorage for an existing JWT, validate it isn't expired, restore state automatically. Wrap the app in <AuthProvider> at root. No component anywhere else should read/write the JWT directly — everything goes through useAuth().

Fix the back-button-to-login bug with three changes:
1. Login/role-select pages check useAuth() on mount — if already authenticated, immediately navigate('/home', { replace: true }) (or role-appropriate home) so the login page never stays in browser history once logged in.
2. On successful login, navigate with replace: true, not push.
3. Add a 'pageshow' listener at app root checking event.persisted (bfcache restore) — re-run the session check when true, so a back-cached page doesn't show stale auth state.

Guest Mode: enterGuestMode() sets user to { role: null, isGuest: true }, no backend call, no JWT. Guest sees PatientLayout populated with local DEMO_MODE sample data (mocked frontend-side, no real API calls). Any write action (Add Medicine, Log Symptom, generate Share Code, revoke connection) shows a lock icon; clicking it opens a modal "Sign in to unlock this feature" with a button to the real login flow — never fail silently. Add a persistent top banner in guest views: "You're browsing as a guest — sign in to save real data."

Test explicitly: log in → Home → press back (must NOT show login) → log out → press forward (must NOT show a logged-in page).
```

---

### Prompt 7 — Frontend Auth/Signup UI (Role-Select, Email-First, Guest Mode)
```
Build the role-select screen: four Cards (using the Card component from Prompt 2) — Patient, Family/Caregiver, Doctor/Clinician, and below a divider, a visually lighter "Continue as Guest" option (outlined, not filled — signals lower commitment than the three real roles). Use lucide-react icons for each.

Patient/Caregiver flow — email-first branching:
Step 1: single Email field + "Continue" button, calls POST /auth/check-email.
Step 2a (email exists): show email (read-only, editable) + password field + "Sign In" button, calls POST /auth/patient/login. Show lockout message clearly if account is locked.
Step 2b (new email): show Full Name + Password (min 8 chars, with strength hint) + "Create Account & Send Code" button, calls POST /auth/patient/signup-send-otp. On success, transition to a 6-digit OTP entry screen (individual auto-advancing digit boxes, countdown + resend link active after 30s) — copy reads "code sent to your email". On verify, calls POST /auth/patient/verify-signup-otp, logs in via AuthContext.

Add a one-line explainer near Step 1: "We'll verify your email once when you sign up — after that, just use your password."

Doctor flow: toggle between "Sign In" and "Create Account". Signup collects Full Name, Medical Registration/License No., Professional Email, Password (min 8, with strength hint). All forms use inline validation (red border + message on blur, not just on submit) and the toast system from Prompt 3 for success/error feedback. Add a lightweight Sign Out confirmation ("Sign out of PolySafe?") rather than instant logout.
```

---

### Prompt 8 — Role-Wise Layouts & Route Guards
```
Create a ProtectedRoute component checking: valid JWT present? Role matches the route's requirement? Guests are allowed into patient-layout READ routes (Home, Timeline, Risk Detail viewing) but blocked (shown the lock modal from Prompt 6) on write-action buttons specifically.

Apply guards: /home, /add-medicine, /risk/:id, /log-symptom, /symptom-result, /timeline, /connected-people → PATIENT only (+ guest read-only). /doctor-dashboard → DOCTOR only. /caregiver-view → CAREGIVER only. /onboarding → PATIENT only, and only if no Patient profile exists yet (redirect to /home if one already does).

Build three distinct layout shells:
1. PatientLayout — mobile-first, warm paper background, minimal top bar (logo + Sign Out icon only), FIXED BOTTOM TAB BAR with icons+labels: Home, Add, Timeline, Symptoms, Connected.
2. DoctorLayout — desktop two-pane: left sidebar with "My Patients" list (using Card rows) + "+ Enter Code" button pinned at top, right pane shows selected patient's data. Top bar: logo, doctor name, Sign Out. NEVER render any add/edit controls anywhere in this layout — doctors are read-only by construction, not by hidden CSS.
3. CaregiverLayout — simplest: single centered column, no sidebar/tabs, just the linked patient's status Card + today's reminders, a "Switch Patient" dropdown if multiple linked patients, top bar with logo + Sign Out only.

Also update the Navbar/nav logic in each layout to show ONLY that role's relevant links — a patient must never see Doctor/Caregiver navigation and vice versa, confirmed by directly testing: manually typing another role's route in the URL bar while logged in must redirect away, not render the page.
```

---

### Prompt 9 — Onboarding Page
```
Build /onboarding using PatientLayout and the Card component. Fields: age (number), existing conditions (multi-select chips: Diabetes, Kidney issues, Liver issues, Heart condition, None), allergies (free text, comma-separated, clearly marked optional/skippable). On submit, POST /patient/profile (create this endpoint, saves to Patient model linked to req.user.userId). Redirect to /home on success via showSuccess toast + navigate replace.
```

---

### Prompt 10 — Home / Risk Snapshot Page
```
Build /home inside PatientLayout: a status Card at top (color+icon+text — safe: green checkmark icon on safe-soft background; caution: "!" icon on caution-soft background — NEVER color alone, always icon+word+color together), a "Today" section listing medicines with times, a "Recent flags" section showing active InteractionFlags in caution-variant Cards.

Backend: GET /patient/home-summary — returns medicine list, today's schedule (derived from medicine list), unresolved InteractionFlags, and overall status (SAFE if no flags, CAUTION if any exist).

Empty state (zero medicines): centered custom line-art SVG illustration (simple pill-bottle outline, teal/warm palette, not generic stock art) + "Add your first medicine to get started" + button to /add-medicine — instead of the status card.

Fixed bottom "+ Add Medicine" button with the tactile press effect (translateY down + shadow compress on :active).
```

---

### Prompt 11 — Add Medicine Backend
```
POST /medicine — accepts { name, type: PRESCRIPTION|OTC|HERBAL, dosage }, requires patient auth. Standardize name via RxNorm API (https://rxnav.nlm.nih.gov/REST/rxcui.json?name=) — proceed with standardizedCode: null if no match, never block on this. Zod validation on the body. Duplicate detection: if the same standardized code already exists for this patient, return 409 "Already in your list — update dosage instead?" instead of silently duplicating.
```

---

### Prompt 12 — Dual-Engine OCR (Tesseract + OCR.space Fallback)
```
Build POST /medicine/scan — multipart image upload via Multer, requires patient auth.

Logic: (1) Try local Tesseract OCR first via node-tesseract-ocr (already installed on this machine) — fast, zero network dependency, good for unreliable venue wifi. (2) If Tesseract returns empty/low-confidence text (fewer than 3 recognizable characters, or errors), fall back to the OCR.space API (OCR_SPACE_API_KEY) as a second attempt. (3) If both fail, return a clear error — frontend falls back to manual entry, never leaves the user stuck. (4) Include which engine succeeded in the response for internal debugging only.

Never auto-save an OCR result — always return the extracted text to the frontend for the user to confirm/edit before final submission via POST /medicine.

Frontend: "📷 Scan prescription photo" button on Add Medicine opens file/camera picker, uploads to /medicine/scan, pre-fills the name field with the result.
```

---

### Prompt 13 — Load the DDInter Interaction Dataset
```
I have the real DDInter dataset as 8 CSV files at /backend/data/ddinter/ (ddinter_downloads_code_A/B/D/H/L/P/R/V.csv), columns: DDInterID_A, Drug_A, DDInterID_B, Drug_B, Level (Major/Moderate/Minor/Unknown).

These 8 files overlap — the same pair can appear in multiple files (~28% duplicate rows), but severity never conflicts across duplicates, so dedup is safe with no merge logic needed.

Add DrugInteractionReference to schema.prisma: id, drugAName, drugBName, severity (enum: MAJOR, MODERATE, MINOR, UNKNOWN), sourceId (optional). Migrate. Write a seed script that reads all 8 files, deduplicates on the pair (case-insensitive, order-independent), and bulk-inserts (~160,235 unique rows expected, not 222,383 raw).

Build interactionLookup.js: given two drug names, return one of three distinct outcomes:
- { found: true, severity: "MAJOR"|"MODERATE"|"MINOR" }
- { found: true, severity: "UNKNOWN" } — documented pair, unclassified severity. Show "A documented interaction exists, but its severity isn't classified — worth mentioning to your doctor," never treat as safe or dangerous.
- { found: false } — no record at all. This triggers "not enough data to check this" — distinct from the UNKNOWN case above, never conflate the two.
```

---

### Prompt 14 — Real-Time Interaction Check (Socket.io)
```
Update POST /medicine: after saving, check the new medicine against every existing medicine in the patient's list via interactionLookup. Create an InteractionFlag for each match (MAJOR/MODERATE/MINOR/UNKNOWN alike — flag all documented pairs, distinguish severity in the explanation, not in whether a flag exists).

Set up Socket.io: emit 'interaction-checked' to the patient's room with results once the check (including the burden calculation from Prompt 15 and explanation generation from Prompt 16) completes.

Frontend Add Medicine page: connect to Socket.io, show a "Checking against your current medicines..." pulsing-dot loading state after submit, update live on the event — no reload. If flagged, show "View Risk Details" linking to /risk/:flagId.
```

---

### Prompt 15 — Cumulative Burden Index (Innovation 4)
```
Add BurdenScore to schema.prisma: drugName, score (0-3). Seed /backend/data/burden-scores.json with 15-20 real common drugs (antihistamines, sleep aids, bladder medications, some antidepressants) with realistic scores.

Build calculateCumulativeBurden(patientId) in /services/burdenIndex.js: sum burden scores across the patient's current medicines (default 0 if not found), return { totalScore, level: "Normal"|"Moderate"|"Critical" } (0=Normal, 1-2=Moderate, 3+=Critical). Call this whenever the interaction check runs (Prompt 14), include in the InteractionFlag data and Socket.io payload.
```

---

### Prompt 16 — Dual-Mode Explanation via Groq
```
Build /services/explanationGenerator.js using Groq (GROQ_API_KEY). generateExplanation({ drugA, drugB, severity, burdenScore, burdenLevel, patientAge, patientConditions }) sends a structured prompt requesting JSON with "clinical" (formal, doctor-facing one-liner) and "plain" (simple, patient-facing, referencing their specific conditions/age) explanations.

Explicitly instruct Groq to only explain the given severity/burden data — never invent a new medical claim. Include "not a diagnosis" framing specifically for burden-related explanations.

Call this whenever an InteractionFlag is created, save both explanations to the record, include in the Socket.io event. Handle Groq timeout (8s): return raw severity/burden immediately, let frontend show "Generating detailed explanation..." separately rather than blocking.
```

---

### Prompt 17 — Risk Explanation Detail Page (with Animated Burden Meter)
```
Build /risk/:flagId: red-bordered header Card with severity pill tag + Fraunces headline. Two stacked blocks: "For the doctor" (clinical explanation) and "For you" (plain explanation), each in a Card. Below, a "Combined sedative/pressure load" burden meter: horizontal bar that ANIMATES filling from 0 to its final percentage on page load (600ms ease-out, respecting prefers-reduced-motion), with the note "No single medicine is unsafe alone... based on a recognized clinical scoring method, not a diagnosis."

Fetch from GET /interaction-flag/:id (patient or connected-doctor auth, returns full flag data).
```

---

### Prompt 18 — Symptom Origin Checker (Innovation 2)
```
Add CascadeReference to schema.prisma: symptomKeyword, causingDrugCategory, description. Seed 8-10 real documented prescribing-cascade pairs.

POST /symptom — { description, dateLogged }, saves Symptom, checks description against CascadeReference keywords, cross-references against medicines added before the symptom date, sets possibleCauseMedicineId if matched.

Frontend: /log-symptom (description + date picker) and /symptom-result showing either "No known link found — but worth mentioning to your doctor anyway" or "This may be linked to [drug] started on [date] — worth asking before treating this as something new," calm card design, not alarming.
```

---

### Prompt 19 — Herbal/OTC Unified Entry (Innovation 3)
```
Add HerbDrugReference to schema.prisma: herbName, drugName, severity, description. Seed 10-15 real documented herb-drug interactions (e.g., turmeric/curcumin with blood thinners or BP medication).

Update Add Medicine: three-way toggle (Prescription/OTC/Herbal) sets the `type` field. Update the interaction check (Prompt 14): HERBAL-type medicines also check against HerbDrugReference, using the same InteractionFlag + explanation pipeline.
```

---

### Prompt 20 — Medication Timeline (with Staggered Animation)
```
Build /timeline: vertical thread line (3px, accent color #E0824B) with circular dot markers (teal border normal, red border if flagged) per entry, showing source (e.g. "Dr. Mehta · Family Physician" or "Self-logged · Herbal"), medicine name, date, and a red pill note if flagged. Entries STAGGER IN with a 50-80ms delay between each on page load (respecting prefers-reduced-motion) so the thread visually "draws itself."

Backend: GET /patient/timeline — all medicines sorted by dateAdded descending, joined with source (Connection/User data) and active-flag status.
```

---

### Prompt 21 — Doctor-Patient Connection (Share Code/QR) + Doctor Dashboard Polish
```
POST /connection/generate-code — patient auth, generates 6-digit code + QR (qrcode package), Connection status PENDING, expiresAt +24h.
POST /connection/claim-code — doctor auth, matches unexpired code, sets connectedUserId, status stays PENDING.
GET /connection/pending — patient auth, returns claimed-but-unapproved connections.
POST /connection/:id/approve and /revoke — patient auth only.

Frontend: Doctor Share View (patient side) shows code+QR, "waiting for approval" state, approve/deny prompt. Doctor Dashboard (within DoctorLayout from Prompt 8): "Enter patient code" input, approved-patients list, read-only Timeline+Risk views for selected patient (reuse those components, hide all edit/add buttons entirely for doctor role).

Add subtle 3D depth specifically to this dashboard (professional/desktop context can carry more visual sophistication than patient screens): slight tilt-on-hover for patient list Cards (max 4-5 degrees, CSS perspective or react-parallax-tilt — subtle, not gimmicky), a soft layered gradient-blob background within the brand palette (no generic purple/blue mesh), smooth cross-fade when switching between patients in the detail pane.
```

---

### Prompt 22 — Caregiver Connection + Permission-Restricted Views
```
POST /connection/add-caregiver — patient auth, phone/email-based invite, Connection role CAREGIVER status PENDING.
GET /connection/caregiver-invites + POST /connection/:id/accept — caregiver side.
GET /caregiver/patient-summary/:patientId — caregiver auth, requires APPROVED connection, returns ONLY status (SAFE/CAUTION/CRITICAL) + today's schedule — explicitly no full medicine names, no symptom logs, no full Risk Detail, per the permission matrix.

Frontend: CaregiverLayout (from Prompt 8) shows this restricted view. Build the "Connected People" settings screen for patients: lists all Connections with status, "Revoke access" button per entry calling the revoke endpoint from Prompt 21.
```

---

### Prompt 23 — Demo Mode & Error Handling
```
Add DEMO_MODE env var. When true: RxNorm call returns a mocked response, both OCR engines return pre-set sample text, Groq returns pre-written sample explanations — each clearly commented as a deliberate fallback. Toggle with zero code changes elsewhere.

Error handling across all endpoints: RxNorm no-match → save with standardizedCode null, don't fail. Groq timeout → already handled in Prompt 16, confirm working. Wrap all external API calls (RxNorm, both OCR engines, Groq) in try/catch with specific error messages via the toast system from Prompt 3 — never a generic "something went wrong."
```

---

### Prompt 24 — Motion & Micro-Interactions Sweep
```
Install framer-motion features across the now-complete app (should already be installed from Prompt 1). Add smooth page transitions (fade + slight upward slide, 250ms, AnimatePresence) on route change. Add layout animations (Framer Motion layout prop) to any list that adds/removes items (medicine list, timeline, connected people list) so items reflow smoothly instead of jumping.

Audit and standardize ALL interactive elements for consistent hover/active states: buttons (lift on hover, press-down on active — confirm consistent everywhere, not just some), clickable Cards (subtle lift + border shift on hover), form inputs (smooth focus ring transition, subtle shake on validation error), toggles (smooth sliding transition, not instant swap). Use consistent 150-200ms ease-out timing everywhere.

CRITICAL: wrap all animations to respect prefers-reduced-motion, especially on patient-facing pages given the elderly user base — check this media query and disable/shorten animations when set.
```

---

### Prompt 25 — Custom Illustrations for Empty States
```
Audit every empty state (no medicines, no connected doctors, no symptoms logged, doctor dashboard with no patient selected). Replace generic text/icons with custom inline SVG line-art illustrations matching the brand palette and style (simple, consistent — e.g., outlined pill-bottle for empty medicine list, dotted line motif echoing the Timeline's visual language for empty timeline). Keep all illustrations visually consistent with each other, lightweight (inline SVG, not external images).
```

---

### Prompt 26 — Insights/Trends Data Visualization
```
Build /insights (or wherever Trends lives) using Recharts: a chart of the patient's flag history over time (area or bar, flags per month) using the token colors, not Recharts defaults. Animate chart entry. Add a "burden trend" line if enough history exists, otherwise show the Prompt 25 illustration style for "not enough history yet." Clean minimal tooltips matching the Card styling.
```

---

### Prompt 27 — Skeleton Loading States
```
Replace every loading spinner/blank screen (Home, Timeline, Doctor Dashboard patient list, Risk Detail) with skeleton placeholders matching the actual content shape that will load, using a subtle shimmer animation (gradient sweep, 1.5s loop) in a muted token color — not a generic gray default.
```

---

### Prompt 28 — Final QA, Consistency Sweep & Deployment
```
Full final pass:
1. Responsive check at 375px/768px/1440px — fix broken layouts, overlap, text wrapping.
2. Performance: lazy-load images, confirm route-based code splitting (React.lazy + Suspense).
3. Accessibility re-check: confirm prefers-reduced-motion respected everywhere from Prompts 17/20/24, visible focus states for keyboard nav, WCAG AA contrast on every new visual element.
4. Consistency sweep: confirm zero hardcoded colors/fonts/spacing remain outside the Prompt 2 token system.
5. Cross-role check: confirm Patient/Doctor/Caregiver layouts each feel distinctly appropriate, not a reskinned template.
6. Confirm zero API keys/secrets hardcoded anywhere — everything from env vars.

Add a root README.md: how to run locally (env vars, migrations, seed, starting both servers), Render deployment notes for backend (PORT from env), Vercel deployment notes for frontend (API base URL from env, not hardcoded). List any remaining known gaps/TODOs at the end so the team knows exactly what's left before the live demo.
```

---

### Prompt 29 — Edit & Delete Medicine (Missing CRUD)
```
The app currently has no way to edit or remove a medicine after adding it — the duplicate-detection message ("Already in your list — update dosage instead?") references an update flow that doesn't exist yet. Build it.

PUT /medicine/:id — patient auth, requires ownership check (medicine belongs to req.user's patient record). Accepts { dosage, type } for editing — do NOT allow editing the drug name/standardizedCode itself (if the drug is wrong, delete and re-add, don't silently rename a tracked medicine, since that could corrupt the interaction history). Re-run the interaction + burden check (Prompts 14-15) after an edit, since a dosage/type change could affect burden scoring.

DELETE /medicine/:id — patient auth, ownership check. Soft-delete (add a `removedAt` timestamp field to the Medicine model rather than hard-deleting) so the Medication Timeline can still show it happened historically ("Stopped taking [drug] on [date]") rather than erasing the record entirely — this actually strengthens the Timeline's cross-doctor value, since a doctor reviewing history should see what was stopped and when, not just what's active now.

Frontend: on the Home page's medicine list and a new "My Medicines" management view, add an edit icon (opens a small form to update dosage/type) and a delete icon (shows a confirm: "Stop tracking [drug]? This will be marked as discontinued but kept in your history.") using the toast system to confirm success.

Update GET /patient/home-summary and GET /patient/timeline to exclude removedAt-set medicines from "current" lists but include them (clearly marked "Discontinued") in the Timeline.
```

---

### Prompt 30 — Pill Imprint Lookup (Optional, Safety-Caveated)
```
Add a feature for identifying a loose/unlabeled pill via its imprint code — NOT full photo-based drug recognition (that's not reliably possible with free tools and would be unsafe to claim). This uses the same OCR pipeline already built (Prompt 12) but reads the imprint text stamped on the pill itself.

Add a small reference table PillImprint to schema.prisma: imprintCode, drugName, shape, color — seed it with 20-30 well-known, common imprint codes (e.g., common paracetamol/ibuprofen imprints) as a clearly limited demo dataset, not a comprehensive database.

Build POST /medicine/identify-pill — accepts an image upload, runs it through the existing dual OCR pipeline (Tesseract first, OCR.space fallback) to extract the imprint text, looks it up against PillImprint. ALWAYS return this as "possible matches" plural, never a single confirmed answer, even if there's exactly one match.

Frontend: add an "Identify a loose pill" option (separate from the main "Scan prescription photo" flow, since the use case is different) that shows the possible-match results with a prominent, unmissable caveat: "This is a limited reference lookup, not a medical identification. If you're not certain, do not take this pill — check with a pharmacist." Require the user to explicitly select/confirm a match (or select "not sure, I'll ask a pharmacist" and skip adding it) before it's ever added to their medicine list via the normal POST /medicine flow — never auto-add a pill-ID result directly.
```

- Prompt 3 (old phone-OTP-only auth) → replaced by hybrid email+password auth with one-time OTP at signup (Prompts 5-7)
- Prompt 8 (old OCR.space-only) → replaced by dual-engine Tesseract-first + OCR.space-fallback (Prompt 12)
- Prompt 9 (DDInter loading) → corrected to match your real 8 CSV files, with dedup and Unknown-severity handling built in
- New: role-separation route guards, conditional navigation, Guest Mode, back-button session bug fix (Prompt 6, 8)
- New: design tokens, reusable Card component, toast system built early so later prompts can use them (Prompts 2-3)
- New: role-wise distinct layouts for Patient/Doctor/Caregiver instead of one shared shell (Prompt 8)
- New: motion, 3D depth on Doctor Dashboard, animated burden meter/timeline, illustrations, charts, skeleton loaders (Prompts 17, 20, 21, 24-27)
