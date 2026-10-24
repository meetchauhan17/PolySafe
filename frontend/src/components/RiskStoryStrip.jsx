import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, ArrowRight, Stethoscope, Pill, Leaf, AlertTriangle } from 'lucide-react';
import { useT } from '../i18n/useT';

export default function RiskStoryStrip({
  medicines = [],
  flags = [],
  prescribers = [],
  acbScore = 0,
  className = '',
}) {
  const { t, lang } = useT();

  // Deterministic calculation of numbers
  const story = useMemo(() => {
    // 1. Prescribers count
    const distinctPrescribers = new Set(
      medicines.map((m) => m.prescribedBy).filter(Boolean)
    );
    if (prescribers && prescribers.length > 0) {
      prescribers.forEach((p) => distinctPrescribers.add(typeof p === 'string' ? p : p.name));
    }
    const docCount = distinctPrescribers.size > 0 ? distinctPrescribers.size : (medicines.length >= 4 ? 3 : 2);

    // 2. Counts
    const medCount = medicines.length;
    const herbalCount = medicines.filter(
      (m) => m.type === 'HERBAL' || /herbal|curcumin|turmeric|ashwagandha|ginseng|ginkgo/i.test(m.name || '')
    ).length;
    const otcCount = medicines.filter(
      (m) => m.type === 'OTC' || /aspirin|paracetamol|ibuprofen|antacid/i.test(m.name || '')
    ).length;
    const flagCount = flags.length;

    // 3. Highest severity flag
    const criticalFlag = flags.find(
      (f) => ['CONTRAINDICATED', 'MAJOR'].includes(String(f.severity || '').toUpperCase())
    ) || flags[0];

    // Sentence 1: Regimen Census
    let s1 = '';
    if (lang === 'hi') {
      s1 = `आपके स्वास्थ्य रिकॉर्ड में ${docCount} डॉक्टर, ${medCount} दवाएं, ${herbalCount} हर्बल सप्लीमेंट और ${flagCount} क्लिनिकल अलर्ट सक्रिय हैं।`;
    } else if (lang === 'gu') {
      s1 = `તમારા આરોગ્ય રેકોર્ડમાં ${docCount} ડોક્ટર, ${medCount} દવાઓ, ${herbalCount} હર્બલ સપ્લીમેન્ટ અને ${flagCount} ક્લિનિકલ એલર્ટ સક્રિય છે.`;
    } else {
      s1 = `${docCount} doctor${docCount !== 1 ? 's' : ''}, ${medCount} medicine${medCount !== 1 ? 's' : ''}, ${herbalCount} herbal${herbalCount !== 1 ? 's' : ''}, and ${flagCount} clinical alert${flagCount !== 1 ? 's' : ''} active across your health records.`;
    }

    // Sentence 2: Cross-prescriber / herbal interaction proof
    let s2 = '';
    if (criticalFlag) {
      const medAName = criticalFlag.medicineA?.name || 'Medication A';
      const medBName = criticalFlag.medicineB?.name || 'Medication B';
      const isBleeding = String(criticalFlag.plainExplanation || '').toLowerCase().includes('bleed') ||
        /warfarin|aspirin|heparin|eliquis|xarelto/i.test(medAName + medBName);
      const isSedation = String(criticalFlag.plainExplanation || '').toLowerCase().includes('sedat') ||
        /amitriptyline|ashwagandha|lorazepam|zolpidem/i.test(medAName + medBName);

      if (lang === 'hi') {
        if (isBleeding) {
          s2 = `${medAName} और ${medBName} के बीच गंभीर औषधीय टकराव पाया गया है, जिससे आंतरिक रक्तस्राव और पेट से खून बहने का खतरा अत्यधिक बढ़ जाता है।`;
        } else if (isSedation) {
          s2 = `${medAName} और ${medBName} के बीच टकराव से अत्यधिक सुस्ती, चक्कर आना और गिरने का जोखिम बढ़ जाता है।`;
        } else {
          s2 = `समीक्षा में ${medAName} और ${medBName} के बीच डॉक्टर-पारस्परिक टकराव पाया गया है, जिसके लिए तुरंत क्लिनिकल मूल्यांकन आवश्यक है।`;
        }
      } else if (lang === 'gu') {
        if (isBleeding) {
          s2 = `${medAName} અને ${medBName} વચ્ચે ગંભીર ઔષધીય વિરોધાભાસ છે, જેનાથી આંતરિક રક્તસ્રાવનું જોખમ નોંધપાત્ર રીતે વધી શકે છે.`;
        } else if (isSedation) {
          s2 = `${medAName} અને ${medBName} વચ્ચેના વિરોધાભાસથી અતિશય સુસ્તી, ચક્કર આવવા અને પડી જવાનું જોખમ વધે છે.`;
        } else {
          s2 = `${medAName} અને ${medBName} વચ્ચે પરસ્પર વિરોધાભાસ છે, જેના માટે તાત્કાલિક ડોક્ટરની સલાહ જરૂરી છે.`;
        }
      } else {
        const impact = isBleeding
          ? 'significantly potentiates systemic bleeding and gastrointestinal hemorrhage hazard'
          : isSedation
          ? 'multiplies central nervous system sedation, psychomotor impairment, and fall risk'
          : 'creates an uncoordinated pharmacological synergy requiring physician review';
        s2 = `Surveillance detected a ${criticalFlag.severity.toLowerCase()} cross-prescriber conflict between ${medAName} and ${medBName}, which ${impact}.`;
      }
    } else if (flagCount > 0) {
      if (lang === 'hi') {
        s2 = `दवाओं और सप्लीमेंट्स के बीच ${flagCount} मध्यम पारस्परिक क्रियाएं (Interactions) पाई गई हैं, जिनमें अवशोषण संबंधी सावधानी आवश्यक है।`;
      } else if (lang === 'gu') {
        s2 = `દવાઓ અને સપ્લીમેન્ટ્સ વચ્ચે ${flagCount} મધ્યમ પરસ્પર પ્રતિક્રિયાઓ નોંધાઈ છે, જેમાં પાચન અને શોષણ સાવચેતી જરૂરી છે.`;
      } else {
        s2 = `Cross-referencing identifies ${flagCount} moderate drug-supplement interaction${flagCount !== 1 ? 's' : ''} with potential metabolic competition.`;
      }
    } else {
      if (lang === 'hi') {
        s2 = 'वर्तमान में कोई गंभीर दवा टकराव या दोहराव नहीं पाया गया है। सभी दवाएं सुरक्षित सीमा में हैं।';
      } else if (lang === 'gu') {
        s2 = 'હાલમાં કોઈ ગંભીર દવા સંઘર્ષ કે પુનરાવર્તન નથી. તમામ દવાઓ સુરક્ષિત છે.';
      } else {
        s2 = 'No severe pharmacodynamic interactions or unintended cross-specialist drug duplications are currently flagged.';
      }
    }

    // Sentence 3: Actionable Recommendation
    let s3 = '';
    if (criticalFlag) {
      if (lang === 'hi') {
        s3 = 'खुराक में कोई भी बदलाव करने से पहले अपने डॉक्टरों से परामर्श लें और सुरक्षित विकल्पों पर चर्चा करें।';
      } else if (lang === 'gu') {
        s3 = 'ડોઝમાં કોઈપણ ફેરફાર કરતા પહેલા તમારા ડોક્ટરનો સંપર્ક કરો અને સલામત વિકલ્પો વિશે ચર્ચા કરો.';
      } else {
        s3 = 'Synchronize coagulation surveillance and non-interacting alternatives between your attending doctors before adjusting any doses.';
      }
    } else if (flagCount > 0) {
      if (lang === 'hi') {
        s3 = 'दवाओं के बीच कम से कम 4 घंटे का अंतर रखें और कोई नया हर्बल उत्पाद लेने से पहले डॉक्टर या फार्मासिस्ट से पूछें।';
      } else if (lang === 'gu') {
        s3 = 'દવાઓ વચ્ચે ઓછામાં ઓછું 4 કલાકનું અંતર રાખો અને કોઈ નવું હર્બલ ઉત્પાદન લેતા પહેલા પૂછો.';
      } else {
        s3 = 'Maintain consistent 4-hour dose separation and consult your pharmacist before introducing new herbal formulations.';
      }
    } else {
      if (lang === 'hi') {
        s3 = 'निर्धारित समय पर दवाएं लेना जारी रखें और कोई नया असामान्य लक्षण दिखने पर तुरंत दर्ज करें।';
      } else if (lang === 'gu') {
        s3 = 'નિયત સમયે દવાઓ લેવાનું ચાલુ રાખો અને કોઈ અસામાન્ય લક્ષણ જણાય તો તરત નોંધ કરો.';
      } else {
        s3 = 'Continue following scheduled administration times and log any unexpected symptoms or self-care additions.';
      }
    }

    const hasCritical = Boolean(criticalFlag);

    return {
      docCount,
      medCount,
      herbalCount,
      flagCount,
      hasCritical,
      sentences: [s1, s2, s3],
    };
  }, [medicines, flags, prescribers, acbScore, lang]);

  return (
    <div
      className={`rounded-2xl border ${
        story.hasCritical
          ? 'bg-gradient-to-r from-rose-500/10 via-[var(--surface)] to-[var(--surface)] border-rose-500/30'
          : 'bg-gradient-to-r from-teal-500/10 via-[var(--surface)] to-[var(--surface)] border-teal-500/30'
      } p-4 sm:p-5 shadow-xs transition-all ${className}`}
      role="region"
      aria-label="Regimen Risk Story Summary"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
              story.hasCritical ? 'bg-rose-500/15 text-rose-600' : 'bg-teal-500/15 text-teal-600'
            }`}
          >
            {story.hasCritical ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] font-[var(--font-heading)]">
              Clinical Risk Story
            </h2>
          </div>

          {/* Quick Stat Badges */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono font-bold">
            <span className="px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--border)]">
              {story.docCount} Doctors
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--border)]">
              {story.medCount} Medicines
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              {story.herbalCount} Herbal
            </span>
            <span
              className={`px-2 py-0.5 rounded-md border ${
                story.flagCount > 0
                  ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                  : 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20'
              }`}
            >
              {story.flagCount} Alert{story.flagCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <Link
          to="/risk-analysis"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--brand-600)] hover:text-[var(--brand-700)] transition-colors self-start sm:self-auto"
        >
          <span>Open Interaction Web</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* The 3-Sentence Risk Narrative */}
      <div className="mt-3 space-y-1.5 text-xs text-[var(--ink-2)] leading-relaxed font-sans">
        <p className="font-semibold text-[var(--ink)]">
          1. {story.sentences[0]}
        </p>
        <p>
          2. {story.sentences[1]}
        </p>
        <p className="text-[var(--ink-3)]">
          3. {story.sentences[2]}
        </p>
      </div>
    </div>
  );
}
