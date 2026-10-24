const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== VERIFYING SECTION 2 NUMBERS ===\n');

  // 1. DDInter in Database (DrugInteractionReference)
  const ddiCount = await prisma.drugInteractionReference.count();
  console.log('1. DDInter total records in DB (DrugInteractionReference):', ddiCount);

  // Distinct unique unordered drug pairs in DB
  const rawPairs = await prisma.$queryRaw`
    SELECT COUNT(*)::int as count FROM (
      SELECT DISTINCT 
        LEAST(LOWER("drugAName"), LOWER("drugBName")) as drug1, 
        GREATEST(LOWER("drugAName"), LOWER("drugBName")) as drug2 
      FROM "drug_interaction_reference"
    ) t;
  `;
  console.log('   DDInter distinct unique unordered drug pairs in DB:', rawPairs[0]?.count);

  // Check if ddinter.csv or raw file exists
  const backendDataDir = path.join(__dirname, '../backend/data');
  const ddinterCsv = path.join(backendDataDir, 'ddinter.csv');
  if (fs.existsSync(ddinterCsv)) {
    console.log('   ddinter.csv size on disk:', (fs.statSync(ddinterCsv).size / (1024 * 1024)).toFixed(2), 'MB');
  }

  // 2. Indian brands, aliases, AI-resolved mappings
  let indianBrandsCount = 0;
  try {
    const indianData = require('../backend/data/indianDrugs.js');
    const indianDrugs = Array.isArray(indianData) ? indianData : (indianData.INDIAN_DRUGS || indianData.indianDrugs || []);
    indianBrandsCount = indianDrugs.length;
    console.log('\n2. Indian brands in formulary (backend/data/indianDrugs.js):', indianBrandsCount);
  } catch (e) {
    console.log('   indianDrugs.js error:', e.message);
  }

  let aliasesCount = 0;
  try {
    const aliasData = require('../backend/src/services/drugAliases.js');
    const aliases = aliasData.DRUG_ALIASES || aliasData.drugAliases || aliasData.ALIASES || aliasData;
    aliasesCount = Object.keys(aliases).length;
    console.log('   Drug aliases count (backend/src/services/drugAliases.js):', aliasesCount);
  } catch (e) {
    console.log('   drugAliases error:', e.message);
  }

  let aiResolvedCount = 0;
  try {
    const aiResolved = JSON.parse(fs.readFileSync(path.join(backendDataDir, 'ai-resolved-drugs.json'), 'utf8'));
    aiResolvedCount = Object.keys(aiResolved).length;
    console.log('   AI-resolved drug mappings (backend/data/ai-resolved-drugs.json):', aiResolvedCount);
  } catch (e) {
    console.log('   ai-resolved-drugs.json error:', e.message);
  }

  // 3. Herb-drug pairs
  const herbCount = await prisma.herbDrugReference.count();
  console.log('\n3. Herb-drug records in DB (HerbDrugReference):', herbCount);
  const rawHerbPairs = await prisma.$queryRaw`
    SELECT COUNT(*)::int as count FROM (
      SELECT DISTINCT LOWER("herbName") as herb, LOWER("drugName") as drug FROM "herb_drug_reference"
    ) t;
  `;
  console.log('   Distinct Herb-Drug pairs in DB:', rawHerbPairs[0]?.count);

  // Also check backend/data/herb-drug.json or seed file if present
  const herbSeedFile = path.join(backendDataDir, 'herb-drug.json');
  if (fs.existsSync(herbSeedFile)) {
    const herbSeed = JSON.parse(fs.readFileSync(herbSeedFile, 'utf8'));
    console.log('   herb-drug.json file records:', herbSeed.length);
  }

  // 4. Cascade rules & distinct cascades
  const cascadeCount = await prisma.cascadeReference.count();
  console.log('\n4. Prescribing cascade records in DB (CascadeReference):', cascadeCount);
  const distinctCascades = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT "causingDrugCategory")::int as drug_cats, COUNT(DISTINCT "symptomKeyword")::int as symptoms FROM "cascade_reference";
  `;
  console.log('   Cascade distinct causing drug categories:', distinctCascades[0]?.drug_cats);
  console.log('   Cascade distinct symptom keywords:', distinctCascades[0]?.symptoms);
  const cascadeJsonPath = path.join(backendDataDir, 'cascade-references.json');
  if (fs.existsSync(cascadeJsonPath)) {
    const cascadeJson = JSON.parse(fs.readFileSync(cascadeJsonPath, 'utf8'));
    console.log('   cascade-references.json rule count:', cascadeJson.length);
  }

  // 5. ACB-scored drugs
  const acbDbCount = await prisma.burdenScore.count();
  console.log('\n5. ACB-scored drugs in DB (BurdenScore):', acbDbCount);
  const burdenJsonPath = path.join(backendDataDir, 'burden-scores.json');
  if (fs.existsSync(burdenJsonPath)) {
    const burdenJson = JSON.parse(fs.readFileSync(burdenJsonPath, 'utf8'));
    console.log('   burden-scores.json drugs count:', Object.keys(burdenJson).length);
  }

  // 6. Harm-level drugs
  const harmJsonPath = path.join(backendDataDir, 'harm-levels.json');
  if (fs.existsSync(harmJsonPath)) {
    const harmJson = JSON.parse(fs.readFileSync(harmJsonPath, 'utf8'));
    console.log('\n6. harm-levels.json drug entries count:', Object.keys(harmJson).length);
  }

  // 7. OFFSIDES signals
  const offsidesDbCount = await prisma.drugSideEffect.count();
  console.log('\n7. OFFSIDES signals in DB (DrugSideEffect):', offsidesDbCount);
  const offsidesSamplePath = path.join(backendDataDir, 'offsides-sample.json');
  if (fs.existsSync(offsidesSamplePath)) {
    const offsidesJson = JSON.parse(fs.readFileSync(offsidesSamplePath, 'utf8'));
    console.log('   offsides-sample.json records count:', Array.isArray(offsidesJson) ? offsidesJson.length : Object.keys(offsidesJson).length);
  }

  // 8. Pill imprints
  const pillDbCount = await prisma.pillImprint.count();
  console.log('\n8. Pill imprints in DB (PillImprint):', pillDbCount);
  const pillJsonPath = path.join(backendDataDir, 'pill-imprints.json');
  if (fs.existsSync(pillJsonPath)) {
    const pillJson = JSON.parse(fs.readFileSync(pillJsonPath, 'utf8'));
    console.log('   pill-imprints.json records count:', Array.isArray(pillJson) ? pillJson.length : Object.keys(pillJson).length);
  }

  // 9. Indications
  const indicationsJsonPath = path.join(backendDataDir, 'indications.json');
  if (fs.existsSync(indicationsJsonPath)) {
    const indicationsJson = JSON.parse(fs.readFileSync(indicationsJsonPath, 'utf8'));
    console.log('\n9. Indications count (backend/data/indications.json):', Object.keys(indicationsJson).length);
  }

  // 10. Prisma models count
  const schemaPath = path.join(__dirname, '../backend/prisma/schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const models = schemaContent.match(/model\s+(\w+)\s+\{/g) || [];
  console.log('\n10. Prisma models count:', models.length);
  console.log('    Prisma model names:', models.map(m => m.replace(/model\s+|\s+\{/g, '')).join(', '));

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  prisma.$disconnect();
});
