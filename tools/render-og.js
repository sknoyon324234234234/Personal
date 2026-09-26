/* XIRAIYA — renders one 1200x630 link-preview image per page from tools/seo.config.json.
   Each page's image shows that section's own pictures: store photos, demo sites, or
   screenshots of the page itself, laid out as a stack of cards by tools/og.html.
   Usage (from the repo root):
     node tools/render-og.js shots [id]   screenshot the pages listed in "ogShots" into tools/og-shots/
     node tools/render-og.js [id]         render the share images into assets/img/og/
   Uses the "playwright" package with Chromium if it is installed, otherwise the Chrome or
   Edge on this machine (tools/chrome.js). */
const path = require('path');
const fs = require('fs');
const http = require('http');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) {
  try { ({ chromium } = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright'))); } catch (e2) { ({ chromium } = require('./chrome')); }
}

const root = path.resolve(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'tools/seo.config.json'), 'utf8'));
let [cmd, arg] = process.argv.slice(2);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };

/* the site served from the repo, the way the host serves it (clean URLs included) */
function serve() {
  return new Promise(ok => {
    const srv = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      let f = path.join(root, p);
      if (!path.extname(f) && fs.existsSync(f + '.html')) f += '.html';
      fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
    }).listen(0, '127.0.0.1', () => ok(srv));
  });
}

async function shots() {
  const srv = await serve(), base = 'http://127.0.0.1:' + srv.address().port + '/';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  /* no intro curtain, no sound, and the page's own motion settled */
  await page.addInitScript(() => { try { sessionStorage.setItem('xr-intro', '1'); } catch (e) {} window.AudioContext = undefined; window.webkitAudioContext = undefined; });
  fs.mkdirSync(path.join(root, 'tools/og-shots'), { recursive: true });
  for (const s of cfg.ogShots) {
    if (arg && s.id !== arg && !s.id.startsWith(arg + '-')) continue;
    await page.goto(base + s.file);
    await page.waitForTimeout(1800);
    await page.evaluate(y => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, y); }, s.y || 0);
    await page.waitForTimeout(s.y ? 1600 : 400);
    /* the power dock, toasts and floating chrome are not part of the section */
    await page.evaluate(() => { document.querySelectorAll('.pw-dock, .toasts, .pw-canvas, .pw-glow, .pw-bloom').forEach(e => { e.style.visibility = 'hidden'; }); });
    const out = path.join(root, 'tools/og-shots', s.id + '.jpg');
    await page.screenshot({ path: out, type: 'jpeg', quality: 82 });
    console.log('tools/og-shots/' + s.id + '.jpg');
  }
  await browser.close();
  srv.close();
}

async function images() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, ignoreHTTPSErrors: true });
  fs.mkdirSync(path.join(root, 'assets/img/og'), { recursive: true });
  for (const p of cfg.pages) {
    if (arg && p.id !== arg) continue;
    const i = p.image, q = new URLSearchParams({ t: i.title, k: i.kicker, s: i.subtitle, jp: i.jp, c: i.color, tags: i.tags });
    if (i.art) q.set('img', i.art);
    if (i.pet) q.set('pet', i.pet);
    if (i.shots) q.set('shots', i.shots);
    if (i.small) q.set('small', '1');
    await page.goto('file://' + path.join(root, 'tools/og.html').replace(/\\/g, '/') + '?' + q.toString(), { waitUntil: 'networkidle' });
    await page.evaluate(() => Promise.all(['800 70px "Shippori Mincho B1"', '800 24px "Shippori Mincho B1"', '700 15px "JetBrains Mono"', '500 24px "Zen Kaku Gothic New"', '700 15px "Zen Kaku Gothic New"'].map(f => document.fonts.load(f, 'Aa忍'))).then(() => document.fonts.ready));
    await page.evaluate(() => Promise.all([...document.images].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; }))));
    await page.waitForTimeout(300);
    const out = path.join(root, 'assets/img', i.file);
    await page.screenshot({ path: out, type: 'jpeg', quality: 88 });
    if (p.id === 'home') fs.copyFileSync(out, path.join(root, 'assets/img/og-cover.jpg'));
    console.log(i.file);
  }
  await browser.close();
}

(cmd === 'shots' ? shots() : (arg = cmd, images())).catch(e => { console.error(e); process.exit(1); });
