// scripts/generate-icons.js
const fs = require('fs');
const path = require('path');
const puppeteer = require('../backend/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const publicDir = path.resolve(__dirname, '../frontend/public');
  const svgContent = fs.readFileSync(path.join(publicDir, 'favicon.svg'), 'utf8');

  async function renderIcon(size, filename, withBg = true) {
    await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    const innerSize = Math.round(size * 0.76);
    const html = [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '<style>',
      '  * { margin: 0; padding: 0; box-sizing: border-box; }',
      '  body {',
      '    width: ' + size + 'px;',
      '    height: ' + size + 'px;',
      '    display: flex;',
      '    align-items: center;',
      '    justify-content: center;',
      '    background: ' + (withBg ? '#FAF8F5' : 'transparent') + ';',
      '    overflow: hidden;',
      '  }',
      '  .icon-wrap {',
      '    width: ' + innerSize + 'px;',
      '    height: ' + innerSize + 'px;',
      '    display: flex;',
      '    align-items: center;',
      '    justify-content: center;',
      '  }',
      '  svg { width: 100%; height: 100%; }',
      '</style>',
      '</head>',
      '<body>',
      '  <div class="icon-wrap">',
      svgContent,
      '  </div>',
      '</body>',
      '</html>'
    ].join('\n');

    await page.setContent(html, { waitUntil: 'load' });
    const buf = await page.screenshot({ type: 'png', omitBackground: !withBg });
    const dest = path.join(publicDir, filename);
    fs.writeFileSync(dest, buf);
    console.log('Generated ' + filename + ' (' + size + 'x' + size + ')');
  }

  await renderIcon(192, 'icon-192.png', true);
  await renderIcon(512, 'icon-512.png', true);
  await renderIcon(180, 'apple-touch-icon.png', true);

  await browser.close();
  console.log('Successfully generated PWA and Apple Touch icons with Synergy Cross logo!');
})();
