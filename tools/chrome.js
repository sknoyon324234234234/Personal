/* XIRAIYA — a tiny stand-in for Playwright's Chromium, used by the render tools when the
   "playwright" package is not installed. It drives the Chrome or Edge already on the machine
   over the DevTools protocol (Node 22+, for its built-in WebSocket). Set CHROME_PATH to pick
   a browser. Only what the tools use: launch, newPage({ viewport }), addInitScript, goto,
   evaluate, waitForTimeout, screenshot({ path, type, quality }), close. */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'
].filter(Boolean);

async function launch() {
  const exe = CANDIDATES.find(p => fs.existsSync(p));
  if (!exe) throw new Error('no Chrome or Edge found: set CHROME_PATH, or install playwright');
  if (typeof WebSocket === 'undefined') throw new Error('Node 22+ is needed (built-in WebSocket), or install playwright');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xr-chrome-'));
  const proc = spawn(exe, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + dir, '--no-first-run', '--no-default-browser-check',
    '--hide-scrollbars', '--mute-audio', '--allow-file-access-from-files', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const url = await new Promise((ok, no) => {
    let buf = '';
    proc.stderr.on('data', d => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) ok(m[1]); });
    proc.on('exit', c => no(new Error('the browser exited (' + c + ')')));
    setTimeout(() => no(new Error('the browser did not start')), 20000);
  });
  const ws = new WebSocket(url);
  await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
  let id = 0;
  const wait = new Map(), listeners = [];
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && wait.has(m.id)) { const w = wait.get(m.id); wait.delete(m.id); if (m.error) w.no(new Error(m.error.message)); else w.ok(m.result); }
    else listeners.slice().forEach(f => f(m));
  };
  const send = (method, params, sessionId) => new Promise((ok, no) => { const i = ++id; wait.set(i, { ok, no }); ws.send(JSON.stringify({ id: i, method, params: params || {}, sessionId })); });

  return {
    async newPage(opts) {
      const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
      const s = (m, p) => send(m, p, sessionId);
      await s('Page.enable'); await s('Runtime.enable');
      const vp = (opts && opts.viewport) || { width: 1280, height: 720 };
      await s('Emulation.setDeviceMetricsOverride', { width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: false });
      const loaded = () => new Promise(ok => {
        const f = m => { if (m.sessionId === sessionId && m.method === 'Page.loadEventFired') { listeners.splice(listeners.indexOf(f), 1); ok(); } };
        listeners.push(f);
      });
      return {
        /* raw protocol access, for tools that need more than the basics */
        cdp: s,
        on(method, fn) { listeners.push(m => { if (m.sessionId === sessionId && m.method === method) fn(m.params); }); },
        addInitScript: fn => s('Page.addScriptToEvaluateOnNewDocument', { source: '(' + fn + ')()' }),
        async goto(u) { const l = loaded(); await s('Page.navigate', { url: u }); await l; },
        async evaluate(fn, arg) {
          const r = await s('Runtime.evaluate', { expression: '(' + fn + ')(' + JSON.stringify(arg === undefined ? null : arg) + ')', awaitPromise: true, returnByValue: true });
          if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text);
          return r.result.value;
        },
        waitForTimeout: ms => new Promise(r => setTimeout(r, ms)),
        async screenshot(o) {
          const png = o.type === 'png', r = await s('Page.captureScreenshot', png ? { format: 'png' } : { format: 'jpeg', quality: o.quality || 88 });
          fs.writeFileSync(o.path, Buffer.from(r.data, 'base64'));
        }
      };
    },
    async close() {
      try { await send('Browser.close'); } catch (e) {}
      ws.close(); proc.kill();
      setTimeout(() => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} }, 500);
    }
  };
}

module.exports = { chromium: { launch } };
