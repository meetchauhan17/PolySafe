const fs = require('fs');
const path = require('path');
const bData = path.join(__dirname, '../backend/data');

const files = [
  'cascade-references.json',
  'burden-scores.json',
  'harm-levels.json',
  'pill-imprints.json',
  'disease-drug.json',
  'food-spacing.json',
  'drug-classes.json',
  'allergy-groups.json',
  'offsides-sample.json',
  'ai-resolved-drugs.json'
];

files.forEach(f => {
  const p = path.join(bData, f);
  if (fs.existsSync(p)) {
    try {
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      const isArr = Array.isArray(data);
      const keys = Object.keys(data);
      console.log(f + ' -> ' + (isArr ? ('Array of ' + data.length + ' items') : ('Object with ' + keys.length + ' keys')));
    } catch (e) {
      console.log(f + ' error: ' + e.message);
    }
  } else {
    console.log(f + ' -> NOT FOUND');
  }
});

// Also check frontend/src/data/
const fData = path.join(__dirname, '../frontend/src/data');
if (fs.existsSync(fData)) {
  console.log('\nFrontend src/data files:');
  fs.readdirSync(fData).forEach(f => {
    console.log(' - ' + f);
  });
}
