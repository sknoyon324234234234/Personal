/* XIRAIYA — frame-by-frame captures of the Chidori strike and the destruction, for
   checking the cut the way an animator checks a cut: one screenshot per 60 fps frame.
   Time is stepped with Chromium's BeginFrame control under paused virtual time, so
   timers, requestAnimationFrame, the canvas AND the Web Animations on the page pieces,
   the camera and the shake all advance together and every capture is exact.
   Usage (from the repo root; needs the "playwright" package with Chromium):
     node tools/chidori-frames.js capture <dir> [strike|reduce|restore] [port]
         strike   Chidori on the home page: the charge, the dash, the strike, the break,
                  the rubble settling and the ruin
         reduce   Chidori with prefers-reduced-motion
         restore  Chidori, then Arise raises the page back (a few frames, for the end state)
     node tools/chidori-frames.js sheet <out.jpg|out.png> --dirs before=DIR,after=DIR --from MS --to MS
         [--every N] [--crop X,Y,W,H] [--thumb PX] [--cols N] [--mode grid|rows] [--t0 MS] [--title TEXT]
         a contact sheet of the captured frames between --from and --to (ms after the trigger),
         one block or row per dir, labelled relative to --t0
   Conventions shared with tools/arise-frames.js: home page, 1280x720, intro skipped,
   seeded Math.random, no AudioContext. */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright'))); }

const root = path.resolve(__dirname, '..');
const [cmd, out, ...rest] = process.argv.slice(2);
const FRAME = 1000 / 60;

function range(a, b, step) { const r = []; for (let t = a; t <= b; t += step) r.push(t); return r; }

async function capture(dir, mode, port) {
  fs.mkdirSync(dir, { recursive: true });
  const server = spawn('python3', ['tools/serve.py', String(port)], { cwd: root, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 700));
  const browser = await chromium.launch({
    args: ['--enable-begin-frame-control', '--run-all-compositor-stages-before-draw', '--disable-new-content-rendering-timeout',
      '--disable-threaded-animation', '--disable-threaded-scrolling', '--disable-checker-imaging']
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, reducedMotion: mode === 'reduce' ? 'reduce' : 'no-preference' });
  await ctx.addInitScript(() => {
    try { sessionStorage.setItem('xr-intro', '1'); } catch (e) {}
    /* a seeded Math.random, so the rubble lands in the same places on every run */
    let s = 0x9E3779B9 | 0;
    Math.random = function () { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    window.AudioContext = undefined; window.webkitAudioContext = undefined;
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => { errors.push(e.message); console.log('PAGEERROR', e.message); });
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404|net::/.test(m.text())) { errors.push(m.text()); console.log('CONSOLE', m.text()); } });
  const cdp = await ctx.newCDPSession(page);
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  /* freeze virtual time; from here on every frame is stepped by hand */
  const vt = await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  const base = vt.virtualTimeTicksBase;
  let elapsed = 0;
  async function step(shotFile, budget) {
    budget = budget || FRAME;
    const expired = new Promise(r => cdp.once('Emulation.virtualTimeBudgetExpired', r));
    await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pauseIfNetworkFetchesPending', budget });
    await expired;
    elapsed += budget;
    const r = await cdp.send('HeadlessExperimental.beginFrame', { frameTimeTicks: base + elapsed, interval: budget, noDisplayUpdates: false, screenshot: shotFile ? { format: 'png' } : undefined });
    if (shotFile && r.screenshotData) fs.writeFileSync(shotFile, Buffer.from(r.screenshotData, 'base64'));
    return r;
  }
  /* a few settled frames before the trigger */
  for (let i = 0; i < 6; i++) await step();
  const frames = [];
  let cur = 0;
  const t0 = elapsed;
  async function shot(t) {
    /* a long wait between shots is crossed in 50 ms frames (timers still fire in order), the last half second frame by frame */
    while (elapsed - t0 + 500 < t) await step(null, 50);
    while (elapsed - t0 + FRAME <= t + 1e-6) await step();
    const file = `${String(Math.round(t)).padStart(6, '0')}.png`;
    await step(path.join(dir, file));
    cur = elapsed - t0;
    frames.push({ t: Math.round(cur), file });
  }
  const state = () => page.evaluate(() => JSON.stringify(window.XRPowers.state()));
  await page.evaluate(() => window.XRPowers.chidori());
  let times;
  if (mode === 'reduce') times = [0, 100, 200, 300, 400, 500, 600, 700, 800, 1000, 1500, 2000, 3000];
  else if (mode === 'restore') times = [3300, 4000, 5000, 6000, 8000];
  else {
    /* ms after the trigger: surges at 840 / 1020 / 2040, the dash at 2840, the strike at 3300 */
    times = [0, 300, 600, ...range(830, 1100, 33), 1500, ...range(2030, 2200, 33), 2500, ...range(2800, 3280, 33), ...range(3300, 4700, FRAME), ...range(4700, 6200, FRAME * 3), ...range(6200, 9000, 200)];
  }
  for (const t of times) await shot(t);
  console.log('end state', await state());
  if (mode === 'restore') {
    /* then Arise raises the page back: the drop at 6310, the rubble rising on the beats, the wake at 19820, the end */
    await shot(9000);
    await page.evaluate(() => window.XRPowers.arise());
    for (const t of [9000 + 500, 9000 + 6400, 9000 + 7000, 9000 + 9500, 9000 + 12800, 9000 + 16500, 9000 + 20000, 9000 + 21000, 9000 + 24500, 9000 + 27500, 9000 + 29500]) await shot(t);
    console.log('restore state', await state());
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

if (cmd === 'capture') capture(out, rest[0] || 'strike', +(rest[1] || 8094));
else if (cmd === 'sheet') sheet(out, rest);
else { console.log('usage: node tools/chidori-frames.js capture <dir> [strike|reduce|restore] [port]\n       node tools/chidori-frames.js sheet <out.jpg> --dirs before=DIR,after=DIR --from MS --to MS [options]'); process.exit(1); }
