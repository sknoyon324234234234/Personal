/* Regenerates the social share image, favicons and demo thumbnails.
   Usage (from the repo root):  npx playwright@1 install chromium   (once)
                                node tools/render-assets.js
   Requires the "playwright" package (npm i -D playwright or a global install). */
const path = require('path');
const fs = require('fs');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const root = path.resolve(__dirname, '..');
const file = p => 'file://' + path.join(root, p);
const out = p => path.join(root, 'assets/img', p);

(async () => {
  const browser = await chromium.launch();

  // 1) Open Graph cover 1200x630
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, ignoreHTTPSErrors: true });
  for (let attempt = 1; attempt <= 6; attempt++) {
    await og.goto(file('tools/og.html'), { waitUntil: 'networkidle' });
    await og.evaluate(() => document.fonts.ready);
    const ok = await og.evaluate(() => document.fonts.check('800 54px "Shippori Mincho B1"') && document.fonts.check('500 14px "JetBrains Mono"'));
    if (ok) break;
    console.log('fonts not ready, retrying (' + attempt + ')');
  }
  await og.waitForTimeout(1500);
  await og.screenshot({ path: out('og-cover.png') });
  console.log('og-cover.png');

  // 2) Favicons / app icons from favicon.svg
  const svg = fs.readFileSync(out('favicon.svg'), 'utf8');
  for (const [name, size] of [['favicon-32.png', 32], ['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
    const p = await browser.newPage({ viewport: { width: size, height: size } });
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
    await p.screenshot({ path: out(name), omitBackground: true });
    await p.close();
    console.log(name);
  }

  // 3) Demo thumbnails (800x500 JPEG)
  fs.mkdirSync(out('demos'), { recursive: true });
  for (const n of ['aurele', 'nordhem', 'halide', 'kage', 'stride', 'nova-saas', 'sakura-bistro', 'vault-dashboard', 'blockrealm', 'pulse-app', 'mori-tea', 'haven', 'ledger', 'nomad', 'devdocs']) {
    const p = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: .625, ignoreHTTPSErrors: true });
    await p.goto(file('demos/' + n + '.html'), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.addStyleTag({ content: '.by{display:none!important}' });
    await p.waitForTimeout(2000);
    await p.screenshot({ path: out('demos/' + n + '.jpg'), type: 'jpeg', quality: 82 });
    await p.close();
    console.log('demos/' + n + '.jpg');
  }
  await browser.close();
})();
