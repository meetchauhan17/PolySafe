const fs = require('fs');
const path = require('path');
const puppeteer = require('../backend/node_modules/puppeteer');

const OUT_DIR = path.join(__dirname, '../docs/poster-screenshots');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureAll() {
  console.log('=== STARTING POSTER SCREENSHOT CAPTURE VIA PUPPETEER ===\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--font-render-hinting=none',
    ],
  });

  try {
    // -------------------------------------------------------------
    // Common Setup Function
    // -------------------------------------------------------------
    async function setupPage(viewport = { width: 1440, height: 900, deviceScaleFactor: 2 }, isDark = false) {
      const page = await browser.newPage();
      await page.setViewport(viewport);

      // Inject clean local storage and theme
      await page.evaluateOnNewDocument((darkTheme) => {
        localStorage.clear();
        localStorage.setItem('polysafe_is_guest', 'true');
        localStorage.setItem('polysafe_guest_mode', 'true');
        localStorage.setItem('polysafe_lang', 'en');
        localStorage.setItem('polysafe_theme', darkTheme ? 'dark' : 'light');
      }, isDark);

      return page;
    }

    async function applyCleanStyles(page, isDark = false) {
      await page.evaluate((darkTheme) => {
        // Enforce theme attribute
        document.documentElement.setAttribute('data-theme', darkTheme ? 'dark' : 'light');
        if (darkTheme) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        document.documentElement.lang = 'en';

        // Suppress toasts, debug badges, dev banners
        const style = document.createElement('style');
        style.innerHTML = `
          [data-sonner-toaster], .toaster, #dev-banner, .dev-badge {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
          }
          * {
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
        `;
        document.head.appendChild(style);
      }, isDark);
    }

    // -------------------------------------------------------------
    // 01. Home Dashboard (Light)
    // -------------------------------------------------------------
    console.log('Capturing 01-home-dashboard.png...');
    {
      const page = await setupPage({ width: 1440, height: 900, deviceScaleFactor: 2 }, false);
      await page.goto('http://localhost:3000/home', { waitUntil: 'networkidle0' });
      await applyCleanStyles(page, false);
      await sleep(1500);
      const outPath = path.join(OUT_DIR, '01-home-dashboard.png');
      await page.screenshot({ path: outPath });
      console.log('Saved:', outPath);
      await page.close();
    }

    // -------------------------------------------------------------
    // 01b. Home Dashboard (Dark)
    // -------------------------------------------------------------
    console.log('Capturing 01b-home-dark.png...');
    {
      const page = await setupPage({ width: 1440, height: 900, deviceScaleFactor: 2 }, true);
      await page.goto('http://localhost:3000/home', { waitUntil: 'networkidle0' });
      await applyCleanStyles(page, true);
      await sleep(1500);
      const outPath = path.join(OUT_DIR, '01b-home-dark.png');
      await page.screenshot({ path: outPath });
      console.log('Saved:', outPath);
      await page.close();
    }

    // -------------------------------------------------------------
    // 02. Add Medicine (Brand to Salts Resolution - "Pan-D")
    // -------------------------------------------------------------
    console.log('Capturing 02-add-medicine.png...');
    {
      const page = await setupPage({ width: 1440, height: 900, deviceScaleFactor: 2 }, false);
      await page.goto('http://localhost:3000/add-medicine', { waitUntil: 'networkidle0' });
      await applyCleanStyles(page, false);
      await sleep(1000);

      // Find the name input and type "Pan-D"
      const inputSelector = 'input[placeholder*="Dolo 650"], input[type="text"]';
      await page.waitForSelector(inputSelector);
      await page.click(inputSelector);
      await page.type(inputSelector, 'Pan-D', { delay: 100 });
      await sleep(1200);

      const outPath = path.join(OUT_DIR, '02-add-medicine.png');
      await page.screenshot({ path: outPath });
      console.log('Saved:', outPath);
      await page.close();
    }

    // -------------------------------------------------------------
    // 03. Risk Analysis (Light)
    // -------------------------------------------------------------
    console.log('Capturing 03-risk-analysis.png...');
    {
      const page = await setupPage({ width: 1440, height: 900, deviceScaleFactor: 2 }, false);
      await page.goto('http://localhost:3000/risk', { waitUntil: 'networkidle0' });
      await applyCleanStyles(page, false);
      await sleep(1500);
      const outPath = path.join(OUT_DIR, '03-risk-analysis.png');
      await page.screenshot({ path: outPath });
      console.log('Saved:', outPath);
      await page.close();
    }

    // -------------------------------------------------------------
    // 03b. Risk Analysis (Dark)
    // -------------------------------------------------------------
    console.log('Capturing 03b-risk-analysis-dark.png...');
    {
      const page = await setupPage({ width: 1440, height: 900, deviceScaleFactor: 2 }, true);
      await page.goto('http://localhost:3000/risk', { waitUntil: 'networkidle0' });
      await applyCleanStyles(page, true);
      await sleep(1500);
      const outPath = path.join(OUT_DIR, '03b-risk-analysis-dark.png');
      await page.screenshot({ path: outPath });
      console.log('Saved:', outPath);
      await page.close();
    }

    // -------------------------------------------------------------
    // 04. Timeline Swimlane (Light)
    // -------------------------------------------------------------
    console.log('Capturing 04-timeline-swimlane.png...');
    {
      const page = await setupPage({ width: 1440, height: 900, deviceScaleFactor: 2 }, false);
      await page.goto('http://localhost:3000/timeline', { waitUntil: 'networkidle0' });
      await applyCleanStyles(page, false);
      await sleep(1500);
      const outPath = path.join(OUT_DIR, '04-timeline-swimlane.png');
      await page.screenshot({ path: outPath });
      console.log('Saved:', outPath);
      await page.close();
    }

    // -------------------------------------------------------------
    // 05. Doctor Dashboard (Light)
    // -------------------------------------------------------------
    console.log('Capturing 05-doctor-dashboard.png...');
    {
      const page = await setupPage({ width: 1440, height: 900, deviceScaleFactor: 2 }, false);
      await page.goto('http://localhost:3000/doctor-dashboard', { waitUntil: 'networkidle0' });
      await applyCleanStyles(page, false);
      await sleep(1500);
      const outPath = path.join(OUT_DIR, '05-doctor-dashboard.png');
      await page.screenshot({ path: outPath });
      console.log('Saved:', outPath);
      await page.close();
    }

    // -------------------------------------------------------------
    // 06. Passport or Emergency Card (Light)
    // -------------------------------------------------------------
    console.log('Capturing 06-passport-or-emergency-card.png...');
    {
      const page = await setupPage({ width: 1440, height: 900, deviceScaleFactor: 2 }, false);
      await page.goto('http://localhost:3000/passport', { waitUntil: 'networkidle0' });
      await applyCleanStyles(page, false);
      await sleep(1500);
      const outPath = path.join(OUT_DIR, '06-passport-or-emergency-card.png');
      await page.screenshot({ path: outPath });
      console.log('Saved:', outPath);
      await page.close();
    }

    // -------------------------------------------------------------
    // 07. Mobile Home (390x844 @ 3x)
    // -------------------------------------------------------------
    console.log('Capturing 07-mobile-home.png...');
    {
      const page = await setupPage({ width: 390, height: 844, deviceScaleFactor: 3 }, false);
      await page.goto('http://localhost:3000/home', { waitUntil: 'networkidle0' });
      await applyCleanStyles(page, false);
      await sleep(1500);
      const outPath = path.join(OUT_DIR, '07-mobile-home.png');
      await page.screenshot({ path: outPath });
      console.log('Saved:', outPath);
      await page.close();
    }

    console.log('\n=== ALL SCREENSHOTS CAPTURED SUCCESSFULLY! ===');
  } finally {
    await browser.close();
  }
}

captureAll().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
