#!/usr/bin/env node
/* Generate site images and videos with WaveSpeed, on your own computer.

   Your key is read from the WAVESPEED_API_KEY environment variable and is
   never written to disk or printed. Jobs live in tools/wavespeed/jobs.json.

     macOS / Linux:   WAVESPEED_API_KEY=your_key node tools/wavespeed/run.mjs
     Windows (PowerShell):
                      $env:WAVESPEED_API_KEY="your_key"; node tools/wavespeed/run.mjs

   Options:
     --only sage,princess   run just these jobs
     --list                 show the jobs and exit (costs nothing)
     --video                also run jobs marked "video": true (cost more)

   A job can use an earlier job's result as input: write "$ref:<job name>"
   anywhere in its input and it is replaced with that job's output URL.
   Every result is saved to the job's "out" path, and a log of what was made
   (model, prompt, output) is kept in tools/wavespeed/results.json.
   Needs Node 18 or newer (for the built-in fetch). */
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const ROOT = path.join(HERE, '..', '..');
const API = 'https://api.wavespeed.ai/api/v3/';
const KEY = process.env.WAVESPEED_API_KEY;
const args = process.argv.slice(2);
const only = (args.find((a) => a.startsWith('--only')) ? (args[args.indexOf('--only') + 1] || '') : '').split(',').filter(Boolean);
const withVideo = args.includes('--video');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const jobs = JSON.parse(fs.readFileSync(path.join(HERE, 'jobs.json'), 'utf8')).jobs;
if (args.includes('--list')) {
  jobs.forEach((j) => console.log((j.video ? '[video] ' : '[image] ') + j.name.padEnd(12) + j.model + '  ->  ' + j.out));
  process.exit(0);
}
if (!KEY) { console.error('Set WAVESPEED_API_KEY first (see the top of this file).'); process.exit(1); }

const resultsPath = path.join(HERE, 'results.json');
const results = fs.existsSync(resultsPath) ? JSON.parse(fs.readFileSync(resultsPath, 'utf8')) : {};

function resolveRefs(v) {
  if (typeof v === 'string' && v.startsWith('$ref:')) {
    const r = results[v.slice(5)];
    if (!r) throw new Error('job "' + v.slice(5) + '" has no result yet; run it first');
    return r.url;
  }
  if (Array.isArray(v)) return v.map(resolveRefs);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resolveRefs(x)]));
  return v;
}

async function call(url, opts) {
  const r = await fetch(url, { ...opts, headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' } });
  const text = await r.text();
  let j; try { j = JSON.parse(text); } catch (e) { throw new Error('HTTP ' + r.status + ': ' + text.slice(0, 300)); }
  if (!r.ok || (j.code && j.code !== 200)) throw new Error('HTTP ' + r.status + ': ' + (j.message || text.slice(0, 300)));
  return j.data || j;
}

async function run(job) {
  const input = resolveRefs(job.input);
  console.log('\n> ' + job.name + ' (' + job.model + ')');
  const sub = await call(API + job.model, { method: 'POST', body: JSON.stringify(input) });
  const getUrl = (sub.urls && sub.urls.get) || API + 'predictions/' + sub.id + '/result';
  const started = Date.now();
  for (;;) {
    await sleep(job.video ? 5000 : 2000);
    const d = await call(getUrl, { method: 'GET' });
    process.stdout.write('  ' + d.status + ' ' + Math.round((Date.now() - started) / 1000) + 's\r');
    if (d.status === 'completed') {
      const url = d.outputs && d.outputs[0];
      if (!url) throw new Error('finished without an output');
      const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
      const out = path.join(ROOT, job.out);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, buf);
      results[job.name] = { model: job.model, out: job.out, url, prompt: input.prompt || '', made: new Date().toISOString() };
      fs.writeFileSync(resultsPath, JSON.stringify(results, null, 1) + '\n');
      console.log('\n  saved ' + job.out + ' (' + (buf.length / 1024).toFixed(0) + ' KB)');
      return;
    }
    if (d.status === 'failed') throw new Error(d.error || 'generation failed');
    if (Date.now() - started > 15 * 60 * 1000) throw new Error('timed out after 15 minutes');
  }
}

const todo = jobs.filter((j) => (only.length ? only.includes(j.name) : true) && (!j.video || withVideo || only.includes(j.name)));
for (const job of todo) {
  try { await run(job); } catch (e) {
    console.error('\n  ! ' + job.name + ': ' + e.message);
    if (/not found|404|model/i.test(e.message)) console.error('    Check the model id on its wavespeed.ai page and update tools/wavespeed/jobs.json.');
  }
}
console.log('\nDone. Commit the files in assets/img/gen, assets/video and tools/wavespeed/results.json, then push.');
