'use strict';
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../../');

const edits = [
  {
    file: 'frontend/src/pages/LogSymptomPage.jsx',
    find: 'check for drug-induced prescribing cascades',
    replace: 'check for medicine side effect chains (prescribing cascades)'
  },
  {
    file: 'frontend/src/pages/LogSymptomPage.jsx',
    find: 'This tool helps you identify possible drug side effects — it is not a diagnosis.',
    replace: 'This tool helps you identify possible medicine side effects — it is not a medical diagnosis.'
  },
  {
    file: 'frontend/src/pages/TimelinePage.jsx',
    find: 'Prescribing cascades often develop silently over months as new drugs are introduced to treat side effects of previous drugs.',
    replace: 'Prescribing cascades often develop silently over months as new medicines are introduced to treat side effects of previous medicines.'
  },
  {
    file: 'frontend/src/pages/RiskAnalysisPage.jsx',
    find: "t('risk_analysis.tab_ddi', 'Drug-Drug Interaction Flag')",
    replace: "t('risk_analysis.tab_ddi', 'Medicine Interactions')"
  },
  {
    file: 'frontend/src/i18n/en.json',
    find: '"tab_ddi": "Drug-Drug Interactions"',
    replace: '"tab_ddi": "Medicine Interactions"'
  }
];

let applied = 0;
for (const edit of edits) {
  const filePath = path.join(repoRoot, edit.file);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    continue;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(edit.find)) {
    content = content.replace(edit.find, edit.replace);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Applied microcopy update to ${edit.file}: "${edit.find.slice(0, 30)}..."`);
    applied++;
  } else {
    console.log(`⚠️ String not found in ${edit.file}: "${edit.find.slice(0, 30)}..."`);
  }
}

console.log(`\nMicrocopy pass finished: ${applied} / ${edits.length} updates applied.`);
