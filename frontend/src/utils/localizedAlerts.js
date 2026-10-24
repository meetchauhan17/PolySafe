/**
 * frontend/src/utils/localizedAlerts.js
 *
 * Deterministic offline localization templates for:
 * 1. P2 Clinical Alert Types (DUPLICATE_INGREDIENT, DUPLICATE_CLASS, ALLERGY, DISEASE_DRUG, FOOD_SPACING)
 * 2. WHO / NCI 5-Tier Drug Harm Levels (L1 to L5)
 * 3. Clinical Spacing and Dietary Advice
 *
 * Provides instant, zero-network translation in Hindi (Devanagari) and Gujarati.
 */

// ─── Harm Tier Localization ──────────────────────────────────────────────────
export const LOCALIZED_HARM_TIERS = {
  en: {
    1: { label: 'Low Risk', shortLabel: 'L1 LOW', tip: 'Multivitamins, minerals, probiotics, herbs — minimal clinical toxicity.' },
    2: { label: 'Mild Risk', shortLabel: 'L2 MILD', tip: 'Antacids, H2 blockers, PPIs, antihistamines — monitor for mild drowsiness or GI effects.' },
    3: { label: 'Moderate Risk', shortLabel: 'L3 MOD', tip: 'NSAIDs, CCBs, beta2 agonists, antibiotics — routine clinical monitoring advised.' },
    4: { label: 'High Risk', shortLabel: 'L4 HIGH', tip: 'Statins, opioids, SSRIs/SNRIs, TCAs, ARBs, ACEIs, antidiabetics — high-alert prescription medicine.' },
    5: { label: 'Critical Risk', shortLabel: 'L5 CRIT', tip: 'Anticoagulants (Warfarin), insulins, anticonvulsants, lithium — narrow therapeutic index.' },
  },
  hi: {
    1: { label: 'कम जोखिम', shortLabel: 'L1 कम', tip: 'मल्टीविटामिन, खनिज, प्रोबायोटिक्स — न्यूनतम क्लिनिकल विषाक्तता।' },
    2: { label: 'हल्का जोखिम', shortLabel: 'L2 हल्का', tip: 'एंटासिड, एच2 ब्लॉकर्स, पीपीआई — हल्की सुस्ती या पेट के प्रभाव पर नज़र रखें।' },
    3: { label: 'मध्यम जोखिम', shortLabel: 'L3 मध्यम', tip: 'दर्दनिवारक (NSAIDs), कैल्शियम चैनल ब्लॉकर्स, एंटीबायोटिक्स — नियमित निगरानी की सलाह।' },
    4: { label: 'उच्च जोखिम', shortLabel: 'L4 उच्च', tip: 'स्टेटिन, एसएसआरआई, एसीईआई, मधुमेह की दवाएं — उच्च-सतर्कता वाली दवा।' },
    5: { label: 'गंभीर जोखिम', shortLabel: 'L5 गंभीर', tip: 'रक्त पतला करने वाली दवाएं (वारफेरिन), इंसुलिन, मिर्गी की दवाएं — संकीर्ण सुरक्षा सीमा।' },
  },
  gu: {
    1: { label: 'ઓછું જોખમ', shortLabel: 'L1 ઓછું', tip: 'મલ્ટીવિટામિન, મિનરલ્સ, પ્રોબાયોટિક્સ — નહિવત આડઅસરો.' },
    2: { label: 'સામાન્ય જોખમ', shortLabel: 'L2 સામાન્ય', tip: 'એન્ટાસિડ્સ, એચ2 બ્લોકર્સ, પીપીઆઈ — હળવી સુસ્તી કે પાચન અસર પર નજર રાખો.' },
    3: { label: 'મધ્યમ જોખમ', shortLabel: 'L3 મધ્યમ', tip: 'દર્દશામક (NSAIDs), કેલ્શિયમ ચેનલ બ્લોકર્સ, એન્ટિબાયોટિક્સ — નિયમિત દેખરેખ જરૂરી.' },
    4: { label: 'ઊંચું જોખમ', shortLabel: 'L4 ઊંચું', tip: 'સ્ટેટિન્સ, એસએસઆરઆઈ, એસીઈઆઈ, ડાયાબિટીસની દવાઓ — ઉચ્ચ સાવચેતીની દવા.' },
    5: { label: 'ગંભીર જોખમ', shortLabel: 'L5 ગંભીર', tip: 'લોહી પાતળું કરવાની દવાઓ (વોરફરીન), ઇન્સ્યુલિન, આંચકીની દવાઓ — સાંકડી સુરક્ષા સીમા.' },
  },
};

// ─── Severity Label Localization ─────────────────────────────────────────────
export const LOCALIZED_SEVERITIES = {
  en: {
    CRITICAL: 'CRITICAL',
    MAJOR: 'MAJOR',
    MODERATE: 'MODERATE',
    MINOR: 'MINOR',
    INFO: 'INFO',
  },
  hi: {
    CRITICAL: 'गंभीर चेतावनी',
    MAJOR: 'प्रमुख जोखिम',
    MODERATE: 'मध्यम सावधानी',
    MINOR: 'मामूली',
    INFO: 'सूचना',
  },
  gu: {
    CRITICAL: 'ગંભીર ચેતવણી',
    MAJOR: 'મુખ્ય જોખમ',
    MODERATE: 'મધ્યમ સાવધાની',
    MINOR: 'સામાન્ય',
    INFO: 'માહિતી',
  },
};

// ─── Alert Type Titles ───────────────────────────────────────────────────────
export const LOCALIZED_ALERT_TITLES = {
  en: {
    DUPLICATE_INGREDIENT: 'Duplicate Active Ingredient',
    DUPLICATE_CLASS: 'Therapeutic Class Duplication',
    ALLERGY: 'Drug Allergy / Cross-Reactivity',
    DISEASE_DRUG: 'Disease-Drug Caution (Beers/STOPP)',
    FOOD_SPACING: 'Food Conflict & Dose Spacing Advice',
  },
  hi: {
    DUPLICATE_INGREDIENT: 'समान सक्रिय घटक (डुप्लिकेट साल्ट)',
    DUPLICATE_CLASS: 'समान चिकित्सीय श्रेणी का दोहराव',
    ALLERGY: 'दवा एलर्जी और क्रॉस-रिएक्शन जोखिम',
    DISEASE_DRUG: 'बीमारी-दवा सावधानी (बीयर्स/स्टॉप मानदंड)',
    FOOD_SPACING: 'भोजन टकराव और खुराक अंतराल सलाह',
  },
  gu: {
    DUPLICATE_INGREDIENT: 'સમાન સક્રિય ઘટક (ડુપ્લિકેટ સોલ્ટ)',
    DUPLICATE_CLASS: 'સમાન રોગનિવારક વર્ગનું પુનરાવર્તન',
    ALLERGY: 'દવાની એલર્જી અને ક્રોસ-રિએક્શન જોખમ',
    DISEASE_DRUG: 'બીમારી-દવા સાવધાની (બીયર્સ/સ્ટોપ માપદંડ)',
    FOOD_SPACING: 'ખોરાક વિરોધાભાસ અને ડોઝ અંતર સલાહ',
  },
};

/**
 * Deterministically localizes any alert object into Hindi or Gujarati offline.
 *
 * @param {Object} alert - The raw alert { id, type, severity, medicines, plainText, clinicalText, rationale }
 * @param {string} lang - 'en' | 'hi' | 'gu'
 * @returns {Object} Localized alert fields
 */
export function getLocalizedAlert(alert, lang = 'en') {
  if (!alert) return { plainText: '', title: '', severityLabel: '' };
  if (lang === 'en') {
    return {
      plainText: alert.plainText || alert.clinicalText || '',
      title: LOCALIZED_ALERT_TITLES.en[alert.type] || alert.type,
      severityLabel: LOCALIZED_SEVERITIES.en[alert.severity] || alert.severity,
    };
  }

  const medNames = (alert.medicines || []).map((m) => m.name).join(' और ') || 'आपकी दवाएं';
  const medNamesGu = (alert.medicines || []).map((m) => m.name).join(' અને ') || 'તમારી દવાઓ';
  const type = alert.type;
  const rawText = alert.plainText || alert.clinicalText || '';
  const lower = rawText.toLowerCase();

  let localizedPlain = '';

  // A. DUPLICATE_INGREDIENT
  if (type === 'DUPLICATE_INGREDIENT') {
    const isParacetamol = lower.includes('paracetamol') || lower.includes('dolo') || lower.includes('combiflam');
    const isNsaid = lower.includes('ibuprofen') || lower.includes('diclofenac') || lower.includes('naproxen');

    if (lang === 'hi') {
      if (isParacetamol) {
        localizedPlain = `आप दो अलग-अलग दवाओं (${medNames}) में पैरासिटामोल ले रहे हैं। इससे दैनिक सुरक्षित सीमा (4000mg/दिन) पार हो सकती है और लिवर को गंभीर नुकसान हो सकता है। कृपया खुराक तुरंत चेक करें।`;
      } else if (isNsaid) {
        localizedPlain = `आप एक से अधिक दवाओं (${medNames}) में समान दर्द निवारक साल्ट ले रहे हैं। इससे पेट में अल्सर और ब्लीडिंग का खतरा बढ़ जाता है।`;
      } else {
        localizedPlain = `आप एक से अधिक दवाओं (${medNames}) में समान सक्रिय घटक ले रहे हैं। इससे अनजाने में दवा की अधिक मात्रा (ओवरडोज़) हो सकती है।`;
      }
    } else if (lang === 'gu') {
      if (isParacetamol) {
        localizedPlain = `તમે બે અલગ દવાઓમાં (${medNamesGu}) પેરાસીટામોલ લઈ રહ્યા છો. આનાથી દૈનિક સુરક્ષિત મર્યાદા (4000mg/દિવસ) ઓળંગાઈ શકે છે અને લિવરને ગંભીર નુકસાન થઈ શકે છે.`;
      } else if (isNsaid) {
        localizedPlain = `તમે એક કરતાં વધુ દવાઓમાં (${medNamesGu}) સમાન પેઈનકિલર ઘટક લઈ રહ્યા છો. આનાથી પેટમાં અલ્સર અને રક્તસ્રાવનું જોખમ વધે છે.`;
      } else {
        localizedPlain = `તમે એક કરતાં વધુ દવાઓમાં (${medNamesGu}) સમાન સક્રિય ઘટક લઈ રહ્યા છો. આનાથી અજાણતા ઓવરડોઝ થઈ શકે છે.`;
      }
    }
  }

  // B. DUPLICATE_CLASS
  else if (type === 'DUPLICATE_CLASS') {
    if (lang === 'hi') {
      if (lower.includes('nsaid')) {
        localizedPlain = `आपके पास दो अलग-अलग NSAID दर्द निवारक दवाएं (${medNames}) हैं। एक ही वर्ग की दो दर्द निवारक दवाएं लेने से बिना किसी अतिरिक्त लाभ के पेट और गुर्दे के दुष्प्रभावों का खतरा दोगुना हो जाता है।`;
      } else if (lower.includes('ppi') || lower.includes('pantoprazole') || lower.includes('omeprazole')) {
        localizedPlain = `आप दो अलग-अलग एसिडिटी (PPI) दवाएं (${medNames}) ले रहे हैं। एक साथ दो एसिडिटी दवाएं लेने की आवश्यकता नहीं होती और इससे साइड इफेक्ट्स बढ़ सकते हैं।`;
      } else if (lower.includes('statin')) {
        localizedPlain = `आप दो अलग-अलग कोलेस्ट्रॉल कम करने वाली स्टेटिन दवाएं (${medNames}) ले रहे हैं। इससे मांसपेशियों में दर्द और विषाक्तता का खतरा बढ़ जाता है।`;
      } else {
        localizedPlain = `आप एक ही चिकित्सीय वर्ग की दो दवाएं (${medNames}) ले रहे हैं। एक ही श्रेणी की दवाएं दोहराने से अतिरिक्त लाभ के बिना साइड इफेक्ट्स बढ़ सकते हैं।`;
      }
    } else if (lang === 'gu') {
      if (lower.includes('nsaid')) {
        localizedPlain = `તમારી પાસે બે અલગ-અલગ NSAID પેઈનકિલર દવાઓ (${medNamesGu}) છે. એક જ શ્રેણીની બે દવાઓ લેવાથી વધારાના ફાયદા વિના પેટ અને કિડનીની આડઅસરો વધી જાય છે.`;
      } else if (lower.includes('ppi') || lower.includes('pantoprazole') || lower.includes('omeprazole')) {
        localizedPlain = `તમે બે અલગ-અલગ એસિડિટી (PPI) દવાઓ (${medNamesGu}) લઈ રહ્યા છો. એક સાથે બે એસિડિટી દવાઓ લેવાથી આડઅસરો વધી શકે છે.`;
      } else if (lower.includes('statin')) {
        localizedPlain = `તમે બે અલગ-અલગ કોલેસ્ટ્રોલ સ્ટેટિન દવાઓ (${medNamesGu}) લઈ રહ્યા છો. આનાથી સ્નાયુઓમાં દુખાવો થવાનું જોખમ રહે છે.`;
      } else {
        localizedPlain = `તમે એક જ રોગનિવારક વર્ગની બે દવાઓ (${medNamesGu}) લઈ રહ્યા છો. આનાથી ફાયદા વગર આડઅસરો વધી શકે છે.`;
      }
    }
  }

  // C. ALLERGY
  else if (type === 'ALLERGY') {
    if (lang === 'hi') {
      localizedPlain = `गंभीर एलर्जी चेतावनी: आपकी प्रोफ़ाइल में दर्ज दवा एलर्जी के अनुसार, ${medNames} इसी समूह से संबंधित है या इसमें क्रॉस-रिएक्शन हो सकता है। कृपया अपने डॉक्टर या फार्मासिस्ट से तुरंत पुष्टि करें।`;
    } else if (lang === 'gu') {
      localizedPlain = `ગંભીર એલર્જી ચેતવણી: તમારી નોંધાયેલી દવાની એલર્જી અનુસાર, ${medNamesGu} આ જ જૂથની દવા છે અથવા ક્રોસ-રિએક્શન થઈ શકે છે. કૃપા કરીને તાત્કાલિક તમારા ડૉક્ટરની સલાહ લો.`;
    }
  }

  // D. DISEASE_DRUG
  else if (type === 'DISEASE_DRUG') {
    if (lang === 'hi') {
      if (lower.includes('kidney') || lower.includes('गुर्दे')) {
        localizedPlain = `गुर्दे (किडनी) की बीमारी में सावधानी: गुर्दे की कार्यक्षमता कम होने पर ${medNames} का उपयोग सावधानीपूर्वक या खुराक घटाकर किया जाना चाहिए।`;
      } else if (lower.includes('liver') || lower.includes('लिवर')) {
        localizedPlain = `लिवर रोग में सावधानी: लिवर की समस्या वाले मरीजों में ${medNames} के मेटाबॉलिज्म पर असर पड़ता है। डॉक्टर की निगरानी आवश्यक है।`;
      } else if (lower.includes('fall') || lower.includes('गिरने')) {
        localizedPlain = `गिरने के जोखिम में सावधानी: ${medNames} चक्कर आना या सुस्ती पैदा कर सकती है, जिससे बुजुर्गों में संतुलन बिगड़ने और गिरने का खतरा रहता है।`;
      } else if (lower.includes('heart') || lower.includes('हृदय')) {
        localizedPlain = `हृदय रोग में सावधानी: हृदय की स्थिति वाले मरीजों में ${medNames} तरल पदार्थ बनाए रखने या रक्तचाप पर प्रभाव डाल सकती है।`;
      } else if (lower.includes('dementia') || lower.includes('मनोभ्रंश')) {
        localizedPlain = `डिमेंशिया (स्मृति लोप) में सावधानी: ${medNames} मानसिक भ्रम या अत्यधिक उनींदापन बढ़ा सकती है।`;
      } else {
        localizedPlain = `बीमारी-दवा सावधानी: आपकी स्वास्थ्य स्थिति को देखते हुए ${medNames} लेने से पहले डॉक्टर से खुराक की समीक्षा आवश्यक है।`;
      }
    } else if (lang === 'gu') {
      if (lower.includes('kidney') || lower.includes('કિડની')) {
        localizedPlain = `કિડનીની બીમારીમાં સાવચેતી: કિડનીની નબળાઈ ધરાવતા દર્દીઓમાં ${medNamesGu} નો ઉપયોગ સાવધાનીપૂર્વક અથવા ડોઝ ઘટાડીને કરવો જોઈએ.`;
      } else if (lower.includes('liver') || lower.includes('લિવર')) {
        localizedPlain = `લિવરની બીમારીમાં સાવચેતી: લિવરની સમસ્યા ધરાવતા દર્દીઓમાં ${medNamesGu} લેતા પહેલાં ડૉક્ટરની સલાહ જરૂરી છે.`;
      } else if (lower.includes('fall') || lower.includes('પડી')) {
        localizedPlain = `પડી જવાના જોખમમાં સાવચેતી: ${medNamesGu} થી ચક્કર કે સુસ્તી આવી શકે છે, જેનાથી સંતુલન ગુમાવવાનું જોખમ રહે છે.`;
      } else if (lower.includes('heart') || lower.includes('હૃદય')) {
        localizedPlain = `હૃદયરોગમાં સાવચેતી: હૃદયની તકલીફ ધરાવતા દર્દીઓમાં ${medNamesGu} સોજો અથવા બ્લડ પ્રેશર પર અસર કરી શકે છે.`;
      } else if (lower.includes('dementia') || lower.includes('ડિમેન્શિયા')) {
        localizedPlain = `યાદશક્તિની ખામીમાં સાવચેતી: ${medNamesGu} થી માનસિક મૂંઝવણ કે ઊંઘમાં વધારો થઈ શકે છે.`;
      } else {
        localizedPlain = `બીમારી-દવા સાવચેતી: તમારી શારીરિક સ્થિતિ અનુસાર ${medNamesGu} લેતા પહેલાં તબીબી સલાહ લેવી જરૂરી છે.`;
      }
    }
  }

  // E. FOOD_SPACING
  else if (type === 'FOOD_SPACING') {
    if (lang === 'hi') {
      if (lower.includes('grapefruit') || lower.includes('चकोतरा')) {
        localizedPlain = `इस दवा (${medNames}) को लेते समय चकोतरा (ग्रेपफ्रूट) या उसके जूस से बचें। यह दवा के स्तर को खतरनाक रूप से बढ़ा सकता है।`;
      } else if (lower.includes('warfarin') || lower.includes('vitamin k')) {
        localizedPlain = `वारफेरिन लेते समय हरी पत्तेदार सब्जियों (पालक, मेथी) का सेवन सामान्य और एक समान रखें, अचानक बदलाव न करें।`;
      } else if (lower.includes('thyroxine') || lower.includes('calcium') || lower.includes('iron') || lower.includes('4 hour')) {
        localizedPlain = `थायरोक्सिन सुबह खाली पेट लें और कैल्शियम/आयरन सप्लीमेंट या दूध लेने से पहले कम से कम 4 घंटे का अंतर रखें।`;
      } else if (lower.includes('dairy') || lower.includes('antacid') || lower.includes('दूध')) {
        localizedPlain = `एंटीबायोटिक लेने के 2 घंटे पहले और 2 घंटे बाद तक दूध, दही या एंटासिड का सेवन न करें ताकि दवा पूरी तरह अवशोषित हो सके।`;
      } else if (lower.includes('alcohol') || lower.includes('शराब')) {
        localizedPlain = `इस दवा के साथ शराब का सेवन न करें। इससे गंभीर एसिडोसिस या अत्यधिक सुस्ती का खतरा रहता है।`;
      } else {
        localizedPlain = `${medNames} के साथ भोजन और समय का सही अंतर रखें। (सलाह: निर्धारित समय पर लें)।`;
      }
    } else if (lang === 'gu') {
      if (lower.includes('grapefruit')) {
        localizedPlain = `આ દવા (${medNamesGu}) લેતી વખતે ગ્રેપફ્રૂટ અથવા તેના રસથી દૂર રહો. આ દવાની માત્રા વધારી શકે છે.`;
      } else if (lower.includes('warfarin') || lower.includes('vitamin k')) {
        localizedPlain = `વોરફરીન લેતી વખતે લીલા પાંદડાવાળા શાકભાજીનું પ્રમાણ નિયમિત રાખો, અચાનક મોટો ફેરફાર ન કરો.`;
      } else if (lower.includes('thyroxine') || lower.includes('calcium') || lower.includes('iron') || lower.includes('4 hour')) {
        localizedPlain = `થાઇરોક્સિન સવારે ભૂખ્યા પેટે લો અને કેલ્શિયમ/આયર્ન કે દૂધ લેતા પહેલાં ઓછામાં ઓછા 4 કલાકનું અંતર રાખો.`;
      } else if (lower.includes('dairy') || lower.includes('antacid')) {
        localizedPlain = `એન્ટિબાયોટિક લેવાના 2 કલાક પહેલાં કે પછી દૂધ, દહીં અથવા એન્ટાસિડ ન લો જેથી દવા યોગ્ય રીતે શોષાઈ શકે.`;
      } else if (lower.includes('alcohol')) {
        localizedPlain = `આ દવા સાથે દારૂનું સેવન ન કરો. તેનાથી ગંભીર એસિડોસિસ કે ઊંઘનું જોખમ રહે છે.`;
      } else {
        localizedPlain = `${medNamesGu} સાથે ખોરાક અને સમયનું યોગ્ય અંતર જાળવો.`;
      }
    }
  }

  return {
    plainText: localizedPlain || rawText,
    title: (LOCALIZED_ALERT_TITLES[lang] && LOCALIZED_ALERT_TITLES[lang][type]) || LOCALIZED_ALERT_TITLES.en[type] || type,
    severityLabel: (LOCALIZED_SEVERITIES[lang] && LOCALIZED_SEVERITIES[lang][alert.severity]) || alert.severity,
  };
}

/**
 * Returns localized harm tier label and explanation.
 */
export function getLocalizedHarmTier(tierNumber, lang = 'en') {
  const dict = LOCALIZED_HARM_TIERS[lang] || LOCALIZED_HARM_TIERS.en;
  return dict[tierNumber] || dict[1];
}
