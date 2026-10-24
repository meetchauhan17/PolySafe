# PolySafe Stage Presentation: 8-Step Demo Tour Scripts (20s Each)

*Total Demo Duration: 2 minutes 40 seconds (8 × 20 seconds)*  
*Designed for live stage presentation, projector clarity, and zero-stumble execution.*

---

### Step 1: Stage Setup & Projector Mode (20s)
- **Viewport:** 1920×1080 or 1366×768 (`?projector=1`)
- **Route:** `/home?projector=1`
- **Visual Action:**
  - Start on PolySafe Home in default theme.
  - Click the **Projector Mode toggle** in the top bar (presentation icon).
  - Observe instant scaling: base typography increases to 18px/19px, contrast jumps to pure WCAG AAA tokens, secondary decorative chrome and subtle ambient orbs fade away, and click targets expand to 48px.
- **Presenter Script (20s):**
  > *"When presenting clinical data on venue projectors, low contrast and tiny fonts can be hazardous. With one click, PolySafe enters Projector Mode—enlarging base typography to 19px, boosting clinical contrast to pure black-on-white, and stripping away distracting chrome so judges in the back row see critical risk alerts clearly."*

---

### Step 2: Geriatric Polypharmacy & 4-Organ Toxicity Radar (20s)
- **Viewport:** 1440×900 / Projector Mode
- **Route:** `/home`
- **Visual Action:**
  - Scroll smoothly to the **Composite Regimen Risk Level** and **4-Organ Toxicity Radar**.
  - Hover over the Renal and Cardiovascular organ meters.
  - Point to the Anticholinergic Cognitive Burden (ACB) score badge showing high cognitive load.
- **Presenter Script (20s):**
  > *"Here is Kamala, a 68-year-old taking six concurrent medications. Rather than looking at isolated pills, PolySafe's home dashboard calculates her holistic regimen risk. Our 4-organ toxicity radar highlights severe cardiovascular and renal clearance strain, while flagging an ACB score of 4—warning doctors of severe delirium and fall risk before symptoms spiral."*

---

### Step 3: Indian Multi-Salt Formulation Ingestion & Resolution (20s)
- **Viewport:** 1440×900
- **Route:** `/add-medicine`
- **Visual Action:**
  - Type or select Indian branded medicine `Augmentin 625` or `Naxdom 500`.
  - Watch the 5-Layer Indian Formulary Engine instantly deconstruct the brand into its constituent chemical salts: *Amoxicillin (500mg) + Clavulanate (125mg)* or *Naproxen + Domperidone*.
  - Show the assigned Harm Level L3 and meal timing rule ("After food").
- **Presenter Script (20s):**
  > *"In India and global markets, medicines are prescribed under commercial brand names that mask multiple active chemicals. PolySafe's 5-Layer Indian Resolver immediately unpacks Naxdom into Naproxen and Domperidone, mapping them to RxNorm codes and ensuring drug interactions aren't missed just because of brand terminology."*

---

### Step 4: Multi-Drug & Herb-Drug Interaction Matrix (20s)
- **Viewport:** 1440×900
- **Route:** `/risk-analysis`
- **Visual Action:**
  - Switch between the **List**, **Grid Matrix**, and dynamic **SVG Interaction Web**.
  - Click the critical red chord connecting *Warfarin* + *Aspirin* + *Ginkgo Biloba*.
  - Reveal the DDInter 2024 pharmacological mechanism and the herbal bleeding warning.
- **Presenter Script (20s):**
  > *"PolySafe checks active regimens against DDInter's 222,000 validated pairs. Our interactive SVG web reveals a critical triangle: Warfarin, Aspirin, and herbal Ginkgo Biloba. Most clinic checkers overlook herbal supplements, but PolySafe's botanical cross-reference catches the occult bleeding hazard and offers safer alternatives instantly."*

---

### Step 5: Prescribing Cascade Detection & Timeline (20s)
- **Viewport:** 1440×900
- **Route:** `/log-symptom` $\rightarrow$ `/timeline`
- **Visual Action:**
  - Type *"Swollen ankles and lower leg edema"* into the symptom logger.
  - Submit and observe the instantaneous Cascade Detection alert: *Amlodipine side effect misdiagnosed as heart failure*.
  - Click over to `/timeline` to see the chronological swimlane linking Amlodipine initiation with Furosemide prescription.
- **Presenter Script (20s):**
  > *"The silent killer in elderly care is the prescribing cascade—treating a drug side effect with another drug. When Kamala logs swollen ankles, PolySafe cross-references her initiation timeline. It proves her edema started 14 days after starting Amlodipine, advising her doctor to deprescribe rather than add an unnecessary diuretic."*

---

### Step 6: Longitudinal Pharmacovigilance & ACB Surveillance (20s)
- **Viewport:** 1440×900
- **Route:** `/insights`
- **Visual Action:**
  - Scroll past the Regimen Grade (Score: 68, Grade C) to the **30-Day Polypharmacy Trend** area chart.
  - Show the **8-Week Anticholinergic Cognitive Burden Timeline**.
  - Hover over the medication adherence heatmap showing daily intake consistency.
- **Presenter Script (20s):**
  > *"Our Longitudinal Insights suite provides clinicians with surveillance curves over time. The 8-week cognitive burden graph plots cumulative anticholinergic spikes, while the 30-day polypharmacy trend monitors pill count reduction during deprescribing trials, paired with our 100-point regimen safety index."*

---

### Step 7: Caregiver Companion & Safe Dose Tracking (20s)
- **Viewport:** 1440×900 / 375×667 Mobile
- **Route:** `/caregiver-view`
- **Visual Action:**
  - Show the circular Adherence Ring (e.g., 88% on-time completion).
  - Demonstrate the zero-drug-name privacy shield (caregiver sees scheduled times and intake status without HIPAA drug name disclosure).
  - Click the **Send Live Dose Reminder** ping button; show the instant toast alert.
- **Presenter Script (20s):**
  > *"For family members caring for elderly parents, our Caregiver View displays real-time adherence and daily dose rings. Crucially, it protects privacy by hiding sensitive psychiatric and cardiac medication names while giving caregivers a one-tap button to send live reminder pings directly to their parent's phone."*

---

### Step 8: Clinician Portal & Pre-Prescription Safety Handshake (20s)
- **Viewport:** 1440×900
- **Route:** `/doctor-dashboard`
- **Visual Action:**
  - Open Doctor Clinic Board showing active patient roster.
  - Enter proposed new prescription: *Ibuprofen 400mg*.
  - Click **Run Safety Check**; show instant red blocker: *Severe gastrointestinal bleeding risk with Warfarin, renal clearance drop, and Beers Criteria NSAID violation*.
- **Presenter Script (20s):**
  > *"Finally, when Kamala visits Dr. Wilson, they connect via a secure 6-digit handshake. Before signing a prescription, Dr. Wilson tests Ibuprofen. In 200 milliseconds, PolySafe runs a multi-agent safety check, warning against the catastrophic NSAID-anticoagulant combination and proposing safe acetaminophen dosing instead."*
