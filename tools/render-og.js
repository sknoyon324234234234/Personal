/* XIRAIYA — renders one 1200x630 link-preview image per page from tools/seo.config.json.
   Usage (from the repo root):  node tools/render-og.js
   Needs the "playwright" package with Chromium installed (npx playwright install chromium). */
const path = require('path');
const fs = require('fs');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright'))); }

const root = path.resolve(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'tools/seo.config.json'), 'utf8'));
const only = process.argv[2];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, ignoreHTTPSErrors: true });
  fs.mkdirSync(path.join(root, 'assets/img/og'), { recursive: true });
  for (const p of cfg.pages) {
    if (only && p.id !== only) continue;
    const i = p.image, q = new URLSearchParams({ t: i.title, k: i.kicker, s: i.subtitle, jp: i.jp, img: i.art, c: i.color, tags: i.tags });
    if (i.pet) q.set('pet', i.pet);
    await page.goto('file://' + path.join(root, 'tools/og.html') + '?' + q.toString(), { waitUntil: 'networkidle' });
    await page.evaluate(() => Promise.all(['800 70px "Shippori Mincho B1"', '800 24px "Shippori Mincho B1"', '700 15px "JetBrains Mono"', '500 24px "Zen Kaku Gothic New"', '700 15px "Zen Kaku Gothic New"'].map(f => document.fonts.load(f, 'Aa忍'))).then(() => document.fonts.ready));
    await page.evaluate(() => Promise.all([...document.images].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; }))));
    await page.waitForTimeout(300);
    const out = path.join(root, 'assets/img', i.file);
    await page.screenshot({ path: out, type: 'jpeg', quality: 88 });
    if (p.id === 'home') fs.copyFileSync(out, path.join(root, 'assets/img/og-cover.jpg'));
    console.log(i.file);
  }
  await browser.close();
})();
