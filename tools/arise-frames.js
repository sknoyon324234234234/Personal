/* XIRAIYA — frame-by-frame captures of the Arise cut, for checking the animation
   the way an animator checks a cut: one screenshot per 60 fps frame, under a paused
   fake clock, so every capture is exact and the same run can be repeated after a change.
   Usage (from the repo root; needs the "playwright" package with Chromium):
     node tools/arise-frames.js capture <dir> [cut|skip|reduce|restore] [port]
         cut      Arise on the home page, frames around the word, the drop, the ranks,
                  the kneel and the end
         skip     Arise, then Esc in the middle of the drop
         reduce   Arise with prefers-reduced-motion
         restore  Chidori first, then Arise raises the page back
     node tools/arise-frames.js sheet <out.jpg|out.png> --dirs before=DIR,after=DIR --from MS --to MS
         [--every N] [--crop X,Y,W,H] [--thumb PX] [--cols N] [--mode grid|rows] [--t0 MS] [--title TEXT]
         a contact sheet of the captured frames between --from and --to (ms after the trigger),
         one block or row per dir, labelled relative to --t0
   Timers, requestAnimationFrame and performance.now run on the fake clock; Web Animations on
   page elements do not, so only the canvas (knights, Monarch, fog, particles) is exact. */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright'))); }

const root = path.resolve(__dirname, '..');
const [cmd, out, ...rest] = process.argv.slice(2);

function range(a, b, step) { const r = []; for (let t = a; t <= b; t += step) r.push(t); return r; }

async function capture(dir, mode, port) {
  fs.mkdirSync(dir, { recursive: true });
  const server = spawn('python3', ['tools/serve.py', String(port)], { cwd: root, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 700));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, reducedMotion: mode === 'reduce' ? 'reduce' : 'no-preference' });
  await ctx.addInitScript(() => {
    try { sessionStorage.setItem('xr-intro', '1'); } catch (e) {}
    /* a seeded Math.random, so the knights stand in the same places on every run */
    let s = 0x9E3779B9 | 0;
    Math.random = function () { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    window.AudioContext = undefined; window.webkitAudioContext = undefined;
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => { errors.push(e.message); console.log('PAGEERROR', e.message); });
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404|net::/.test(m.text())) { errors.push(m.text()); console.log('CONSOLE', m.text()); } });
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });
  await page.clock.runFor(3500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.clock.pauseAt(new Date('2026-01-01T00:00:20Z'));
  await page.clock.runFor(500);
  const frames = [];
  let cur = 0;
  async function shot(t) {
    if (t > cur) { await page.clock.runFor(t - cur); cur = t; }
    const file = `${String(Math.round(t)).padStart(6, '0')}.png`;
    await page.screenshot({ path: path.join(dir, file), animations: 'allow', caret: 'hide' });
    frames.push({ t: Math.round(t), file });
  }
  const state = () => page.evaluate(() => JSON.stringify(window.XRPowers.state()));
  const arise = () => page.evaluate(() => window.XRPowers.arise());
  if (mode === 'cut' || mode === 'restore') {
    if (mode === 'restore') {
      await page.evaluate(() => window.XRPowers.chidori());
      await page.clock.runFor(9000);
      console.log('after chidori', await state());
    }
    await arise();
    /* ms after the trigger: the voice at 500, the word at 1800, the theme at 2350,
       the four hits of the drop at 6310 / 6510 / 6630 / 6750, the first accents at 9250 and 10610 */
    const times = [0, 400, 900, 1400, ...range(1750, 2450, 33), ...range(6250, 7350, 16), ...range(9230, 9800, 33), ...range(10540, 11200, 33),
      ...(mode === 'restore' ? [...range(12500, 13500, 100), ...range(21600, 22200, 33), ...range(24000, 24400, 33), 26500, 28200, 29000] : [11350, 11800, 12500, 14750, 15200, 15800])];
    for (const t of times) await shot(t);
    console.log('end state', await state());
  } else if (mode === 'skip') {
    await arise();
    for (const t of [6400, 6600]) await shot(t);
    await page.keyboard.press('Escape');
    for (const t of [6617, 6700, 6900, 7300, 7800, 8500, 11000]) await shot(t);
    console.log('skip state', await state());
  } else if (mode === 'reduce') {
    await arise();
    for (const t of [0, 100, 300, 600, 700, 1000, 2000]) await shot(t);
    console.log('reduce state', await state());
  }
  const left = await page.evaluate(() => Array.from(document.querySelectorAll('[class^="pw-"]')).map(e => e.className).filter(c => !/^pw-(dock|item|list|toggle|mute|canvas|glow|bloom)/.test(c)));
  console.log('overlays left', JSON.stringify(left));
  fs.writeFileSync(path.join(dir, 'frames.json'), JSON.stringify({ mode, frames, errors }, null, 1));
  await browser.close();
  server.kill();
  console.log('captured', frames.length, 'frames;', errors.length, 'errors');
}

async function sheet(file, args) {
  const opt = {};
  for (let i = 0; i < args.length; i += 2) opt[args[i].replace(/^--/, '')] = args[i + 1];
  const from = +opt.from, to = +opt.to, every = +(opt.every || 1), t0 = +(opt.t0 || from);
  const crop = (opt.crop || '0,0,1280,720').split(',').map(Number);
  const thumb = +(opt.thumb || 320), cols = +(opt.cols || 6), mode = opt.mode || 'grid';
  const sets = opt.dirs.split(',').map(s => {
    const [name, dir] = s.split('=');
    const m = JSON.parse(fs.readFileSync(path.join(dir, 'frames.json'), 'utf8'));
    const fr = m.frames.filter(f => f.t >= from && f.t <= to).filter((f, i) => i % every === 0);
    return { name, frames: fr.map(f => ({ t: f.t, data: 'data:image/png;base64,' + fs.readFileSync(path.join(dir, f.file)).toString('base64') })) };
  });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const url = await page.evaluate(async ({ sets, crop, thumb, cols, mode, title, t0, jpg }) => {
    const [cx, cy, cw, ch] = crop, th = Math.round(thumb * ch / cw), pad = 6, lab = 16, head = title ? 30 : 0, side = mode === 'rows' ? 70 : 0;
    const n = Math.max(...sets.map(s => s.frames.length)), rows = Math.ceil(n / cols);
    const c = document.createElement('canvas');
    if (mode === 'rows') { c.width = side + n * (thumb + pad) + pad; c.height = head + sets.length * (th + lab + pad) + pad; }
    else { c.width = cols * (thumb + pad) + pad; c.height = head + sets.length * (rows * (th + lab + pad) + 24) + pad; }
    const x = c.getContext('2d');
    x.fillStyle = '#111'; x.fillRect(0, 0, c.width, c.height);
    x.textBaseline = 'top';
    if (title) { x.fillStyle = '#eee'; x.font = '700 16px monospace'; x.fillText(title, pad, 8); }
    const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
    let y = head + pad;
    for (const s of sets) {
      x.fillStyle = '#9a6bff'; x.font = '700 14px monospace';
      if (mode === 'rows') x.fillText(s.name, pad, y + th / 2 - 7); else { x.fillText(s.name, pad, y); y += 22; }
      x.font = '600 13px monospace';
      for (let i = 0; i < s.frames.length; i++) {
        const f = s.frames[i], img = await load(f.data);
        const px = mode === 'rows' ? side + pad + i * (thumb + pad) : pad + (i % cols) * (thumb + pad);
        const py = mode === 'rows' ? y : y + Math.floor(i / cols) * (th + lab + pad);
        x.drawImage(img, cx, cy, cw, ch, px, py, thumb, th);
        x.fillStyle = '#bbb'; x.fillText((mode === 'rows' ? '' : '#' + i + '  ') + (f.t - t0 >= 0 ? '+' : '') + (f.t - t0) + 'ms', px, py + th + 2);
      }
      y += (mode === 'rows' ? 1 : rows) * (th + lab + pad) + (mode === 'rows' ? 0 : 2);
    }
    return jpg ? c.toDataURL('image/jpeg', .82) : c.toDataURL('image/png');
  }, { sets, crop, thumb, cols, mode, title: opt.title || '', t0, jpg: /\.jpe?g$/i.test(file) });
  fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
  await browser.close();
  console.log('wrote', file);
}

if (cmd === 'capture') capture(out, rest[0] || 'cut', +(rest[1] || 8093));
else if (cmd === 'sheet') sheet(out, rest);
else { console.log('usage: node tools/arise-frames.js capture <dir> [cut|skip|reduce|restore] [port]\n       node tools/arise-frames.js sheet <out.jpg> --dirs before=DIR,after=DIR --from MS --to MS [options]'); process.exit(1); }
