/* Shop photo fetcher, run by .github/workflows/shop-photos.yml.

   candidates: reads request.json ({store: {slot: "search query"}}), finds
     free photos (Unsplash, falling back to Openverse), and writes one
     labelled contact sheet per store to sheets/<store>.jpg plus
     candidates.json, so a person can pick the right shot for each slot.
   final: reads select.json ({store: {slot: index}}) and downloads the
     chosen photos to assets/img/shop/<store>/<slot>.jpg, adding each
     photographer to assets/img/shop/credits.json.

   Only free-licence photos are used: Unsplash+ (premium) results are
   skipped, and Openverse is limited to licences that allow commercial use. */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.join(HERE, '..', '..');
const OUT = path.join(ROOT, 'assets', 'img', 'shop');
const mode = process.argv[2];
const N = 6;
const UA = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36', Accept: 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function unsplash(q) {
  const r = await fetch('https://unsplash.com/napi/search/photos?per_page=20&query=' + encodeURIComponent(q), { headers: UA });
  if (!r.ok) throw new Error('unsplash ' + r.status);
  const j = await r.json();
  return j.results.filter((p) => !p.premium && !p.plus).map((p) => ({
    src: 'unsplash', id: p.id, raw: p.urls.raw, alt: p.alt_description || '',
    by: p.user.name, link: 'https://unsplash.com/photos/' + p.id, license: 'Unsplash License'
  }));
}
async function openverse(q) {
  const r = await fetch('https://api.openverse.org/v1/images/?page_size=20&mature=false&license_type=commercial&q=' + encodeURIComponent(q), { headers: UA });
  if (!r.ok) throw new Error('openverse ' + r.status);
  const j = await r.json();
  return j.results.filter((p) => p.width >= 900).map((p) => ({
    src: 'openverse', id: p.id, raw: p.url, thumb: p.thumbnail, alt: p.title || '',
    by: p.creator || 'unknown', link: p.foreign_landing_url, license: (p.license || '').toUpperCase() + ' ' + (p.license_version || '')
  }));
}
function sized(c, w, h) {
  if (c.src === 'unsplash') return c.raw + (c.raw.includes('?') ? '&' : '?') + 'fm=jpg&q=' + (h ? 60 : 78) + '&w=' + w + (h ? '&h=' + h + '&fit=crop' : '&fit=max');
  return h && c.thumb ? c.thumb : c.raw;
}
async function get(url) {
  for (let i = 0; i < 3; i++) {
    try { const r = await fetch(url, { headers: { 'User-Agent': UA['User-Agent'] } }); if (r.ok) return Buffer.from(await r.arrayBuffer()); } catch (e) { /* retry */ }
    await sleep(800 * (i + 1));
  }
  throw new Error('download failed ' + url);
}
const svgText = (t, w, h, size, fill, bg) => Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '"><rect width="100%" height="100%" fill="' + bg + '"/><text x="8" y="' + (h - 8) + '" font-family="DejaVu Sans, sans-serif" font-size="' + size + '" fill="' + fill + '">' + t.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</text></svg>');

async function candidates() {
  const req = JSON.parse(fs.readFileSync(path.join(HERE, 'request.json'), 'utf8'));
  const all = {};
  fs.mkdirSync(path.join(HERE, 'sheets'), { recursive: true });
  for (const store of Object.keys(req)) {
    all[store] = {};
    const rows = [];
    for (const slot of Object.keys(req[store])) {
      const q = req[store][slot];
      let list = [];
      try { list = await unsplash(q); } catch (e) { console.log('!', store, slot, e.message); }
      if (list.length < N) { try { list = list.concat(await openverse(q)); } catch (e) { console.log('!', store, slot, e.message); } }
      list = list.slice(0, N);
      all[store][slot] = list;
      const tiles = [];
      for (let i = 0; i < list.length; i++) {
        try {
          const buf = await get(sized(list[i], 240, 300));
          tiles.push(await sharp(buf).resize(240, 300, { fit: 'cover' }).composite([{ input: svgText(String(i), 34, 30, 20, '#fff', '#000'), left: 0, top: 0 }]).jpeg({ quality: 70 }).toBuffer());
        } catch (e) { tiles.push(null); }
        await sleep(150);
      }
      rows.push({ slot, q, tiles });
      console.log(store, slot, list.length);
      await sleep(400);
    }
    const W = 160 + N * 244, H = rows.length * 304;
    const comp = [];
    rows.forEach((r, y) => {
      comp.push({ input: svgText(r.slot, 160, 300, 16, '#fff', '#222'), left: 0, top: y * 304 });
      r.tiles.forEach((t, x) => { if (t) comp.push({ input: t, left: 160 + x * 244, top: y * 304 }); });
    });
    await sharp({ create: { width: W, height: H, channels: 3, background: '#444' } }).composite(comp).jpeg({ quality: 72 }).toFile(path.join(HERE, 'sheets', store + '.jpg'));
  }
  fs.writeFileSync(path.join(HERE, 'candidates.json'), JSON.stringify(all, null, 1) + '\n');
}

async function final() {
  const sel = JSON.parse(fs.readFileSync(path.join(HERE, 'select.json'), 'utf8'));
  const cand = JSON.parse(fs.readFileSync(path.join(HERE, 'candidates.json'), 'utf8'));
  const credPath = path.join(OUT, 'credits.json');
  const credits = fs.existsSync(credPath) ? JSON.parse(fs.readFileSync(credPath, 'utf8')) : {};
  for (const store of Object.keys(sel)) {
    const dir = path.join(OUT, store);
    fs.mkdirSync(dir, { recursive: true });
    credits[store] = credits[store] || {};
    for (const slot of Object.keys(sel[store])) {
      const pick = sel[store][slot], i = typeof pick === 'number' ? pick : pick.i, xl = typeof pick === 'object' && pick.xl;
      const c = cand[store][slot][i];
      const buf = await get(sized(c, xl ? 1800 : 1000));
      await sharp(buf).rotate().resize(xl ? 1800 : 1000, xl ? 1800 : 1000, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: xl ? 70 : 74, mozjpeg: true, progressive: true }).toFile(path.join(dir, slot + '.jpg'));
      credits[store][slot] = { photographer: c.by, link: c.link, license: c.license };
      console.log(store, slot, c.by);
      await sleep(200);
    }
  }
  fs.writeFileSync(credPath, JSON.stringify(credits, null, 1) + '\n');
}

if (mode === 'candidates') await candidates();
else if (mode === 'final') await final();
else { console.error('usage: node fetch.mjs candidates|final'); process.exit(1); }
