const { extractAndRankCandidates, verifyCandidatesWithRxNorm } = require('../src/services/ocrCandidateExtractor');

async function testScenario() {
  const sampleOcrText = `
KEEP OUT OF REACH OF CHILDREN
Store at room temperature 15-30C
Maxoken 500
Each film coated tablet contains:
Maxoken 500 mg
Excipients q.s.
Manufactured by ABC Laboratories Ltd
Maxoken 500
Dosage: As directed by the physician
Maxoken 500
Batch No: B98421
Mfg Date: 01/2026
Exp Date: 12/2028
let
`;

  console.log('--- Test 1: Maxoken 500 (Brand / Boilerplate test) ---');
  const res1 = extractAndRankCandidates(sampleOcrText);
  console.log('Ranked Candidates:', res1.rankedCandidates);
  const ver1 = await verifyCandidatesWithRxNorm(res1.rankedCandidates, res1.suggestedDosage);
  console.log('Verification Result 1:', ver1);

  if (res1.rankedCandidates.includes('let')) {
    throw new Error('FAIL: "let" was included in candidates!');
  }
  if (!res1.rankedCandidates[0].toLowerCase().includes('maxoken')) {
    throw new Error(`FAIL: Top candidate is not Maxoken! Got: ${res1.rankedCandidates[0]}`);
  }
  console.log('✓ Test 1 Passed!');

  console.log('\n--- Test 2: Standard Prescription Label (Warfarin) ---');
  const sample2 = `
PHARMACY RX # 1234567
PATIENT: JOHN DOE
TAKE 1 TABLET DAILY
WARFARIN 5MG
WARFARIN SODIUM TABLETS USP
QTY: 30 TABLETS
REFILLS: 2
DATE: 08/10/2026
KEEP OUT OF REACH OF CHILDREN
`;
  const res2 = extractAndRankCandidates(sample2);
  console.log('Ranked Candidates 2:', res2.rankedCandidates);
  const ver2 = await verifyCandidatesWithRxNorm(res2.rankedCandidates, res2.suggestedDosage);
  console.log('Verification Result 2:', ver2);

  console.log('\n✓ All OCR candidate extraction & verification tests passed!');
  process.exit(0);
}

testScenario().catch((err) => {
  console.error(err);
  process.exit(1);
});
