/* Frame-by-frame captures of the Super Saiyan power-up under begin-frame control:
   virtual time, rAF, timers and Web Animations all advance together, 16.667 ms per frame.
   Same conventions as tools/arise-frames.js: home page, 1280x720, seeded Math.random,
   no audio, intro skipped.
   node tools/ssj-frames.js capture <dir> [ssj|reduce|phone] [port] [everyN]
       ssj      the power-up on the home page at 1280x720, a screenshot every N frames
       reduce   the same with prefers-reduced-motion
       phone    the same at 390x844
   node tools/ssj-frames.js sheet <out.jpg> --dirs before=DIR,after=DIR --from MS --to MS
       [--step MS | --every N] [--crop X,Y,W,H] [--thumb PX] [--cols N] [--mode grid|rows] [--title TEXT]
       a contact sheet of the captured frames between --from and --to (ms after the tap); --step keeps
       one frame per that many ms in every dir, so runs captured at different rates line up */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright'))); }
const root = path.resolve(__dirname, '..');
const [cmd, out, ...rest] = process.argv.slice(2);
const FRAME = 1000 / 60;

async function capture(dir, mode, port, every) {
  fs.mkdirSync(dir, { recursive: true });
  const server = spawn('python3', ['tools/serve.py', String(port)], { cwd: root, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
  const browser = await chromium.launch({ headless: true, args: ['--enable-begin-frame-control', '--run-all-compositor-stages-before-draw', '--disable-new-content-rendering-timeout', '--disable-threaded-animation', '--disable-threaded-scrolling', '--disable-checker-imaging'] });
  const phone = mode === 'phone';
  const ctx = await browser.newContext({ viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 720 }, deviceScaleFactor: 1, reducedMotion: mode === 'reduce' ? 'reduce' : 'no-preference' });
  await ctx.addInitScript(() => {
    try { sessionStorage.setItem('xr-intro', '1'); } catch (e) {}
    let s = 0x9E3779B9 | 0;
    Math.random = function () { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    window.AudioContext = undefined; window.webkitAudioContext = undefined;
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => { errors.push(e.message); console.log('PAGEERROR', e.message); });
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404|net::/.test(m.text())) { errors.push(m.text()); console.log('CONSOLE', m.text()); } });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('HeadlessExperimental.enable').catch(() => {});
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 300));
  const vt = await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  const base = vt.virtualTimeTicksBase;
  let elapsed = 0;
  async function step(shotPath) {
    const expired = new Promise(r => cdp.once('Emulation.virtualTimeBudgetExpired', r));
    await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'advance', budget: FRAME });
    await expired;
    elapsed += FRAME;
    const r = await cdp.send('HeadlessExperimental.beginFrame', { frameTimeTicks: base + elapsed, interval: FRAME, noDisplayUpdates: false, screenshot: shotPath ? { format: 'png' } : undefined });
    if (shotPath && r.screenshotData) fs.writeFileSync(shotPath, Buffer.from(r.screenshotData, 'base64'));
    else if (shotPath) console.log('no screenshot at', shotPath, JSON.stringify(r));
  }
  /* let the page settle and paint */
  for (let i = 0; i < 90; i++) await step();
  await page.evaluate(() => window.scrollTo(0, 0));
  for (let i = 0; i < 6; i++) await step();
  const frames = [];
  const t0 = elapsed;
  await page.evaluate(() => { window.__ssjT0 = performance.now(); window.XRPowers.ssj(true); });
  const total = mode === 'reduce' ? 1400 : 3400;
  let n = 0;
  while (elapsed - t0 < total) {
    const t = Math.round(elapsed - t0);
    const want = n % every === 0;
    const file = `${String(t).padStart(6, '0')}.png`;
    await step(want ? path.join(dir, file) : null);
    if (want) frames.push({ t: Math.round(elapsed - t0), file });
    n++;
  }
  console.log('end state', await page.evaluate(() => JSON.stringify(window.XRPowers.state())));
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
  const from = +opt.from, to = +opt.to, every = +(opt.every || 1), t0 = +(opt.t0 || 0);
  const crop = (opt.crop || '0,0,1280,720').split(',').map(Number);
  const thumb = +(opt.thumb || 320), cols = +(opt.cols || 6), mode = opt.mode || 'grid';
  const sets = opt.dirs.split(',').map(s => {
    const [name, dir] = s.split('=');
    const m = JSON.parse(fs.readFileSync(path.join(dir, 'frames.json'), 'utf8'));
    const step = +(opt.step || 0), all = m.frames.filter(f => f.t >= from - step / 2 && f.t <= to + step / 2), times = [];
    for (let x = from; x <= to + 1 && step; x += step) times.push(x);
    /* with --step, the frame nearest each tick, so runs captured at different rates line up */
    const fr = step ? times.map(x => all.reduce((b, f) => Math.abs(f.t - x) < Math.abs(b.t - x) ? f : b)).filter((f, i, a) => a.indexOf(f) === i) : all.filter((f, i) => i % every === 0);
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
      x.fillStyle = '#ffc83a'; x.font = '700 14px monospace';
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
    return jpg ? c.toDataURL('image/jpeg', .84) : c.toDataURL('image/png');
  }, { sets, crop, thumb, cols, mode, title: opt.title || '', t0, jpg: /\.jpe?g$/i.test(file) });
  fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
  await browser.close();
  console.log('wrote', file);
}

if (cmd === 'capture') capture(out, rest[0] || 'ssj', +(rest[1] || 8097), +(rest[2] || 1));
else if (cmd === 'sheet') sheet(out, rest);
else { console.log('usage'); process.exit(1); }
