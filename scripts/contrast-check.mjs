import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find tokens.css
const tokensPathCandidates = [
  path.resolve(__dirname, '../frontend/src/styles/tokens.css'),
  path.resolve(process.cwd(), 'frontend/src/styles/tokens.css'),
  path.resolve(process.cwd(), 'src/styles/tokens.css'),
];

let tokensCssPath = tokensPathCandidates.find(p => fs.existsSync(p));
if (!tokensCssPath) {
  console.error('Error: Could not locate tokens.css');
  process.exit(1);
}

const cssContent = fs.readFileSync(tokensCssPath, 'utf8');

function parseCssTokens(content) {
  const rootMatches = content.match(/:root\s*\{([^}]+)\}/s);
  const darkMatches = content.match(/\[data-theme=["']?dark["']?\]\s*\{([^}]+)\}/s);

  function extractVars(block) {
    if (!block) return {};
    const tokens = {};
    const lines = block.split('\n');
    for (const line of lines) {
      const match = line.match(/--([\w-]+)\s*:\s*([^;]+);/);
      if (match) {
        tokens[match[1].trim()] = match[2].trim();
      }
    }
    return tokens;
  }

  const rootTokens = extractVars(rootMatches ? rootMatches[1] : '');
  const darkTokens = { ...rootTokens, ...extractVars(darkMatches ? darkMatches[1] : '') };

  return { rootTokens, darkTokens };
}

function hexToRgb(hex) {
  hex = hex.replace('#', '').trim();
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const num = parseInt(hex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function parseColorToRgb(val, bgContext = [255, 255, 255]) {
  val = val.trim();
  if (val.startsWith('#')) {
    return hexToRgb(val);
  }
  const rgbaMatch = val.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (rgbaMatch) {
    const r = parseFloat(rgbaMatch[1]);
    const g = parseFloat(rgbaMatch[2]);
    const b = parseFloat(rgbaMatch[3]);
    const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
    // Composite over background context
    return [
      Math.round(r * a + bgContext[0] * (1 - a)),
      Math.round(g * a + bgContext[1] * (1 - a)),
      Math.round(b * a + bgContext[2] * (1 - a)),
    ];
  }
  return [0, 0, 0];
}

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function luminance(rgb) {
  const r = srgbToLinear(rgb[0]);
  const g = srgbToLinear(rgb[1]);
  const b = srgbToLinear(rgb[2]);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(fgRgb, bgRgb) {
  const l1 = luminance(fgRgb);
  const l2 = luminance(bgRgb);
  const max = Math.max(l1, l2);
  const min = Math.min(l1, l2);
  return (max + 0.05) / (min + 0.05);
}

function resolveToken(tokens, tokenName) {
  let val = tokens[tokenName];
  if (!val) return null;
  while (val && val.startsWith('var(--')) {
    const inner = val.slice(6, -1).trim();
    val = tokens[inner];
  }
  return val;
}

export function runContrastCheck() {
  const { rootTokens, darkTokens } = parseCssTokens(cssContent);

  console.log('='.repeat(78));
  console.log('    PolySafe "Ivory Editorial" WCAG AA Contrast Audit');
  console.log('    Reading tokens from: ' + path.relative(process.cwd(), tokensCssPath));
  console.log('='.repeat(78));

  let totalTested = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  function testTheme(themeName, tokens, isDark) {
    console.log(`\n─── ${themeName.toUpperCase()} THEME ───`);

    const surfaceTokens = ['canvas', 'canvas-2', 'paper', 'surface', 'surface-2', 'surface-3'];
    const textTokens = isDark
      ? [
          { token: 'ink', minRatio: 4.5, label: 'Primary text' },
          { token: 'ink-2', minRatio: 4.5, label: 'Secondary text' },
          { token: 'ink-3', minRatio: 4.5, label: 'Tertiary text' },
          { token: 'brand-link', minRatio: 4.5, label: 'Brand text/link' },
          { token: 'safe-600', minRatio: 4.5, label: 'Safe status text' },
          { token: 'caution-500', minRatio: 4.5, label: 'Caution status text' },
          { token: 'critical-500', minRatio: 4.5, label: 'Critical status text' },
        ]
      : [
          { token: 'ink', minRatio: 4.5, label: 'Primary text' },
          { token: 'ink-2', minRatio: 4.5, label: 'Secondary text' },
          { token: 'ink-3', minRatio: 4.5, label: 'Tertiary text' },
          { token: 'brand-600', minRatio: 4.5, label: 'Brand link' },
          { token: 'brand-700', minRatio: 4.5, label: 'Brand strong' },
          { token: 'safe-600', minRatio: 4.5, label: 'Safe status text' },
          { token: 'safe-ink', minRatio: 4.5, label: 'Safe ink' },
          { token: 'caution-ink', minRatio: 4.5, label: 'Caution ink' },
          { token: 'critical-ink', minRatio: 4.5, label: 'Critical ink' },
        ];

    // 1. Text on surfaces
    for (const surfaceName of surfaceTokens) {
      const surfaceRaw = resolveToken(tokens, surfaceName);
      if (!surfaceRaw) continue;
      const surfaceRgb = parseColorToRgb(surfaceRaw);

      for (const { token: textToken, minRatio, label } of textTokens) {
        const textRaw = resolveToken(tokens, textToken);
        if (!textRaw) continue;
        const textRgb = parseColorToRgb(textRaw, surfaceRgb);
        const ratio = getContrastRatio(textRgb, surfaceRgb);
        const passed = ratio >= minRatio;

        totalTested++;
        if (passed) totalPassed++;
        else totalFailed++;

        const status = passed ? '✔ PASS' : '✖ FAIL';
        console.log(
          `  ${status.padEnd(8)} ${(`--${textToken}`).padEnd(16)} on ${(`--${surfaceName}`).padEnd(14)} : ` +
          `${ratio.toFixed(2)}:1 (req >= ${minRatio}:1)  [${textRaw} on ${surfaceRaw}]`
        );
      }
    }

    // 2. Badges and Specialized UI Pairs (e.g. text on badge-bg)
    console.log(`\n  [${themeName}] Badge & Component Specific Pairs:`);
    const badgePairs = isDark
      ? [
          { fg: 'safe-ink', bg: 'safe-bg', minRatio: 4.5, label: 'Safe Badge' },
          { fg: 'caution-ink', bg: 'caution-bg', minRatio: 4.5, label: 'Caution Badge' },
          { fg: 'critical-ink', bg: 'critical-bg', minRatio: 4.5, label: 'Critical Badge' },
          { fg: 'harm-l1-fg', bg: 'harm-l1-bg', minRatio: 4.5, label: 'Harm Tier L1' },
          { fg: 'harm-l2-fg', bg: 'harm-l2-bg', minRatio: 4.5, label: 'Harm Tier L2' },
          { fg: 'harm-l3-fg', bg: 'harm-l3-bg', minRatio: 4.5, label: 'Harm Tier L3' },
          { fg: 'harm-l4-fg', bg: 'harm-l4-bg', minRatio: 4.5, label: 'Harm Tier L4' },
          { fg: 'harm-l5-fg', bg: 'harm-l5-bg', minRatio: 4.5, label: 'Harm Tier L5' },
          { fg: 'on-accent', bg: 'accent-500', minRatio: 4.5, label: 'Button on-accent' },
          { fg: 'on-brand', bg: 'brand-600', minRatio: 4.5, label: 'Button on-brand' },
        ]
      : [
          { fg: 'safe-ink', bg: 'safe-bg', minRatio: 4.5, label: 'Safe Badge' },
          { fg: 'caution-ink', bg: 'caution-bg', minRatio: 4.5, label: 'Caution Badge' },
          { fg: 'critical-ink', bg: 'critical-bg', minRatio: 4.5, label: 'Critical Badge' },
          { fg: 'harm-l1-fg', bg: 'harm-l1-bg', minRatio: 4.5, label: 'Harm Tier L1' },
          { fg: 'harm-l2-fg', bg: 'harm-l2-bg', minRatio: 4.5, label: 'Harm Tier L2' },
          { fg: 'harm-l3-fg', bg: 'harm-l3-bg', minRatio: 4.5, label: 'Harm Tier L3' },
          { fg: 'harm-l4-fg', bg: 'harm-l4-bg', minRatio: 4.5, label: 'Harm Tier L4' },
          { fg: 'harm-l5-fg', bg: 'harm-l5-bg', minRatio: 4.5, label: 'Harm Tier L5' },
          { fg: 'on-accent', bg: 'accent-500', minRatio: 4.5, label: 'Button on-accent' },
          { fg: 'on-brand', bg: 'brand-600', minRatio: 4.5, label: 'Button on-brand' },
        ];

    for (const { fg, bg, minRatio, label } of badgePairs) {
      const fgRaw = resolveToken(tokens, fg);
      const bgRaw = resolveToken(tokens, bg);
      if (!fgRaw || !bgRaw) {
        console.log(`  ? SKIP   --${fg} on --${bg} (token not found)`);
        continue;
      }
      const bgRgb = parseColorToRgb(bgRaw);
      const fgRgb = parseColorToRgb(fgRaw, bgRgb);
      const ratio = getContrastRatio(fgRgb, bgRgb);
      const passed = ratio >= minRatio;

      totalTested++;
      if (passed) totalPassed++;
      else totalFailed++;

      const status = passed ? '✔ PASS' : '✖ FAIL';
      console.log(
        `  ${status.padEnd(8)} ${label.padEnd(20)} (--${fg} on --${bg}) : ` +
        `${ratio.toFixed(2)}:1 (req >= ${minRatio}:1)`
      );
    }
  }

  testTheme('Light', rootTokens, false);
  testTheme('Dark', darkTokens, true);

  console.log('\n' + '='.repeat(78));
  console.log(`AUDIT SUMMARY: ${totalTested} pairs tested | ${totalPassed} passed | ${totalFailed} failed`);
  if (totalFailed === 0) {
    console.log('🎉 ALL CONTRAST PAIRS MEET OR EXCEED WCAG AA (>= 4.5:1)');
    console.log('='.repeat(78));
    return 0;
  } else {
    console.error(`❌ ${totalFailed} CONTRAST PAIR(S) FAILED WCAG AA REQUIREMENT`);
    console.log('='.repeat(78));
    return 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const code = runContrastCheck();
  process.exit(code);
}
