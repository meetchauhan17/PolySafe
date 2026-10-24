'use strict';

/**
 * stage-audit-runner.js
 * Comprehensive Stage Readiness & Verification Runner
 * - Projector Mode Verification (1920x1080, 1366x768)
 * - Automated Axe Accessibility Audit (Home, Add Medicine, Risk Analysis, Doctor Dashboard)
 * - Console Hygiene & Zero Error Monitor
 * - Multi-Viewport Screenshot Capturing (375, 768, 1440; Light/Dark; EN/HI)
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const axeSource = require('axe-core').source;

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SCREENSHOTS_DIR = path.resolve(__dirname, '../../docs/ui-screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: '375' },
  tablet: { width: 768, height: 1024, name: '768' },
  desktop: { width: 1440, height: 900, name: '1440' },
  projector_1080p: { width: 1920, height: 1080, name: '1920x1080_projector' },
  projector_768p: { width: 1366, height: 768, name: '1366x768_projector' },
};

const PAGES_TO_CAPTURE = [
  { path: '/login', name: 'login', guest: false },
  { path: '/home', name: 'home', guest: true },
  { path: '/add-medicine', name: 'add-medicine', guest: true },
  { path: '/risk-analysis', name: 'risk-analysis', guest: true },
  { path: '/log-symptom', name: 'log-symptom', guest: true },
  { path: '/symptom-result', name: 'symptom-result', guest: true },
  { path: '/timeline', name: 'timeline', guest: true },
  { path: '/insights', name: 'insights', guest: true },
  { path: '/doctor-share', name: 'doctor-share', guest: true },
  { path: '/profile', name: 'profile', guest: true },
  { path: '/medication-passport', name: 'medication-passport', guest: true },
  { path: '/status', name: 'status', guest: true },
];

async function runAudit() {
  console.log('================================================================');
  console.log('       PolySafe Automated Stage Readiness & UI Auditor          ');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const consoleLog = [];
  const axeResults = {};
  const projectorResults = {};
  let capturedCount = 0;

  try {
    const page = await browser.newPage();

    // Listen to all console output
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      // Filter out harmless React dev logs, HMR, or Vite notices
      if (type === 'error' || type === 'warning') {
        if (!text.includes('[vite]') && !text.includes('Download the React DevTools')) {
          consoleLog.push({ type, text, location: msg.location() });
        }
      }
    });

    page.on('pageerror', (err) => {
      consoleLog.push({ type: 'pageerror', text: err.toString() });
    });

    // Helper: Set up demo/guest session in localStorage
    async function setupStorage(theme = 'light', isProjector = false, lang = 'en', role = 'PATIENT') {
      await page.evaluate(({ theme, isProjector, lang, role }) => {
        localStorage.clear();
        localStorage.setItem('polysafe-theme', theme);
        localStorage.setItem('polysafe_theme', theme);
        localStorage.setItem('polysafe_language', lang);
        localStorage.setItem('polysafe_role', role);
        localStorage.setItem('polysafe_guest_mode', 'true');
        if (isProjector) {
          localStorage.setItem('polysafe_projector_mode', 'true');
          document.documentElement.classList.add('projector-mode');
        } else {
          localStorage.setItem('polysafe_projector_mode', 'false');
          document.documentElement.classList.remove('projector-mode');
        }
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }, { theme, isProjector, lang, role });
    }

    // ────────────────────────────────────────────────────────────────
    // PART 1: Projector Mode Verification (1920x1080 & 1366x768)
    // ────────────────────────────────────────────────────────────────
    console.log('🔍 [1/4] Verifying Projector Mode at 1920x1080 & 1366x768...');

    for (const [key, vp] of [
      ['1080p', VIEWPORTS.projector_1080p],
      ['768p', VIEWPORTS.projector_768p],
    ]) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(`${BASE_URL}/home?projector=1`, { waitUntil: 'networkidle2' });
      await setupStorage('light', true, 'en', 'PATIENT');
      await page.reload({ waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 600));

      const metrics = await page.evaluate(() => {
        const html = document.documentElement;
        const computedHtml = window.getComputedStyle(html);
        const hasProjectorClass = html.classList.contains('projector-mode');
        const fontSize = computedHtml.fontSize;

        // Check if secondary chrome is hidden
        const hiddenElements = document.querySelectorAll('.projector-hide, .ps-orb');
        let allHidden = true;
        hiddenElements.forEach(el => {
          const style = window.getComputedStyle(el);
          if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
            allHidden = false;
          }
        });

        // Check click target sizes
        const buttons = Array.from(document.querySelectorAll('button:not([disabled]), a.ps-btn'));
        const smallTargets = buttons.filter(b => {
          const rect = b.getBoundingClientRect();
          return rect.height > 0 && rect.height < 40; // flag if below 40px
        });

        return {
          hasProjectorClass,
          fontSize,
          allSecondaryHidden: allHidden,
          totalButtons: buttons.length,
          smallTargetsCount: smallTargets.length,
        };
      });

      projectorResults[key] = metrics;
      console.log(`  ✓ Resolution ${vp.width}x${vp.height}: Base font=${metrics.fontSize}, Projector class active=${metrics.hasProjectorClass}, Secondary chrome hidden=${metrics.allSecondaryHidden}`);

      // Capture projector screenshots
      const projPath = path.join(SCREENSHOTS_DIR, `projector_${key}_home.png`);
      await page.screenshot({ path: projPath, fullPage: false });
      capturedCount++;
    }

    // ────────────────────────────────────────────────────────────────
    // PART 2: Automated Axe Accessibility Audit
    // ────────────────────────────────────────────────────────────────
    console.log('\n♿ [2/4] Running Automated Axe Accessibility Audit on Core Pages...');
    const axePages = [
      { url: '/home', name: 'Home' },
      { url: '/add-medicine', name: 'Add Medicine' },
      { url: '/risk-analysis', name: 'Risk Analysis' },
      { url: '/doctor-dashboard', name: 'Doctor Dashboard', role: 'DOCTOR' },
    ];

    await page.setViewport({ width: 1440, height: 900 });

    for (const p of axePages) {
      await page.goto(`${BASE_URL}${p.url}`, { waitUntil: 'networkidle2' });
      await setupStorage('light', false, 'en', p.role || 'PATIENT');
      await page.goto(`${BASE_URL}${p.url}`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 800));

      // Inject axe-core
      await page.evaluate(axeSource);

      // Run axe evaluation
      const results = await page.evaluate(async () => {
        return await window.axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
          },
        });
      });

      const violations = results.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
      }));

      const critical = violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
      axeResults[p.name] = {
        totalViolations: violations.length,
        criticalCount: critical.length,
        violations,
      };

      console.log(`  ✓ ${p.name}: ${violations.length} notices (${critical.length} serious/critical)`);
    }

    // ────────────────────────────────────────────────────────────────
    // PART 3: Multi-Viewport Screenshot Capture (Light & Dark, EN & HI)
    // ────────────────────────────────────────────────────────────────
    console.log('\n📸 [3/4] Capturing UI Screenshots across 375px, 768px, 1440px in Light & Dark...');

    const viewportsToRun = [
      VIEWPORTS.mobile,
      VIEWPORTS.tablet,
      VIEWPORTS.desktop,
    ];

    for (const pageDef of PAGES_TO_CAPTURE) {
      for (const vp of viewportsToRun) {
        await page.setViewport({ width: vp.width, height: vp.height });

        // Light mode
        await page.goto(`${BASE_URL}${pageDef.path}`, { waitUntil: 'networkidle2' });
        await setupStorage('light', false, 'en', pageDef.name === 'doctor-dashboard' ? 'DOCTOR' : 'PATIENT');
        await page.reload({ waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 400));

        const lightPath = path.join(SCREENSHOTS_DIR, `${pageDef.name}_${vp.name}_light.png`);
        await page.screenshot({ path: lightPath });
        capturedCount++;

        // Dark mode
        await setupStorage('dark', false, 'en', pageDef.name === 'doctor-dashboard' ? 'DOCTOR' : 'PATIENT');
        await page.reload({ waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 400));

        const darkPath = path.join(SCREENSHOTS_DIR, `${pageDef.name}_${vp.name}_dark.png`);
        await page.screenshot({ path: darkPath });
        capturedCount++;

        // Special: Home in Hindi
        if (pageDef.name === 'home') {
          await setupStorage('light', false, 'hi', 'PATIENT');
          await page.reload({ waitUntil: 'networkidle2' });
          await new Promise(r => setTimeout(r, 400));

          const hiPath = path.join(SCREENSHOTS_DIR, `home_${vp.name}_hi.png`);
          await page.screenshot({ path: hiPath });
          capturedCount++;
        }
      }
      console.log(`  ✓ Saved screenshots for: ${pageDef.name}`);
    }

    // ────────────────────────────────────────────────────────────────
    // PART 4: Summary & Console Hygiene Report
    // ────────────────────────────────────────────────────────────────
    console.log('\n🧹 [4/4] Evaluating Console Hygiene & Network Logs...');
    const criticalErrors = consoleLog.filter(c => c.type === 'pageerror' || (c.type === 'error' && !c.text.includes('favicon')));

    console.log(`  Total Console Messages Logged: ${consoleLog.length}`);
    console.log(`  Critical Page Errors: ${criticalErrors.length}`);

    const auditSummary = {
      timestamp: new Date().toISOString(),
      screenshotsCaptured: capturedCount,
      projectorMode: projectorResults,
      axeResults,
      consoleErrorsCount: criticalErrors.length,
      consoleErrors: criticalErrors,
    };

    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, 'audit-summary.json'),
      JSON.stringify(auditSummary, null, 2),
      'utf8'
    );

    console.log(`\n================================================================`);
    console.log(`✅ Stage Audit Complete! Total Screenshots Saved: ${capturedCount}`);
    console.log(`   Audit Report written to: docs/ui-screenshots/audit-summary.json`);
    console.log(`================================================================\n`);

  } catch (err) {
    console.error('Audit run encountered an error:', err);
  } finally {
    await browser.close();
  }
}

runAudit();
