'use strict';
const puppeteer = require('puppeteer');
const axeSource = require('axe-core').source;

async function inspectAxe() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const routes = [
    { url: 'http://localhost:3000/home', role: 'PATIENT' },
    { url: 'http://localhost:3000/add-medicine', role: 'PATIENT' },
    { url: 'http://localhost:3000/risk-analysis', role: 'PATIENT' },
    { url: 'http://localhost:3000/doctor-dashboard', role: 'DOCTOR' },
  ];

  for (const r of routes) {
    await page.evaluateOnNewDocument((role) => {
      localStorage.setItem('polysafe_is_guest', 'true');
      localStorage.setItem('polysafe_guest_mode', 'true');
      localStorage.setItem('polysafe_role', role);
    }, r.role);

    await page.goto(r.url, { waitUntil: 'networkidle2' });
    await new Promise(res => setTimeout(res, 1200));

    await page.evaluate(axeSource);
    const results = await page.evaluate(async () => {
      return await window.axe.run(document, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
        },
      });
    });

    console.log(`\n======================================================`);
    console.log(`URL: ${r.url} (Role: ${r.role})`);
    console.log(`Total violations: ${results.violations.length}`);
    for (const v of results.violations) {
      console.log(`\nViolation: [${v.id}] (${v.impact}) - ${v.description}`);
      for (const node of v.nodes.slice(0, 3)) {
        console.log(`  Target: ${node.target.join(' ')}`);
        console.log(`  HTML: ${node.html.slice(0, 160)}`);
        console.log(`  Failure Summary: ${node.failureSummary}`);
      }
    }
  }

  await browser.close();
}

inspectAxe();
