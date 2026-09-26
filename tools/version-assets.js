#!/usr/bin/env node
/*
  Cache-busting for CSS and JS.

  Adds ?v=<content hash> to every local stylesheet and script link in the pages,
  so a browser that cached an older file fetches the new one right after a deploy
  instead of pairing new HTML with old CSS/JS. Only files that changed get a new
  version. Safe to run again.

  Run it before every push that changes CSS or JS:  node tools/version-assets.js

  Scripts that load more files themselves pass their own ?v= on to them, so their
  version also covers those files (listed in DEPS below).
*/
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const SKIP = new Set(['.git', '.github', '.claude', 'tools', 'assets', 'node_modules']);

const list = dir => fs.readdirSync(path.join(root, dir)).map(f => path.posix.join(dir, f));
const DEPS = {
  'assets/js/powers.js': ['assets/css/powers.css', 'assets/sfx/sounds.js'],
  'assets/js/shop.js': [...list('assets/css/shop'), ...list('assets/js/shop')].sort(),
};

// line endings are normalised so Windows and Linux checkouts give the same hash
const text = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const hashes = {};
function version(f) {
  if (!hashes[f]) {
    const h = crypto.createHash('sha1');
    for (const x of [f, ...(DEPS[f] || [])]) h.update(x + '\0' + text(x) + '\0');
    hashes[f] = h.digest('hex').slice(0, 8);
  }
  return hashes[f];
}

function pages(dir, out) {
  for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.posix.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP.has(e.name) && !e.name.startsWith('.')) pages(rel, out); }
    else if (e.name.endsWith('.html')) out.push(rel);
  }
  return out;
}

const LINK = /((?:href|src)=")((?:\.\.\/)*assets\/[^"?#]+\.(?:css|js))(?:\?v=[0-9a-f]*)?"/g;
let changed = 0;
for (const page of pages('.', [])) {
  const src = fs.readFileSync(path.join(root, page), 'utf8');
  const out = src.replace(LINK, (m, attr, url) => {
    const file = path.posix.normalize(path.posix.join(path.posix.dirname(page), url));
    if (!fs.existsSync(path.join(root, file))) { console.warn(`  missing: ${file} (in ${page})`); return m; }
    return `${attr}${url}?v=${version(file)}"`;
  });
  if (out !== src) { fs.writeFileSync(path.join(root, page), out); changed++; console.log(`  updated ${page}`); }
}
console.log(`${changed} page(s) updated, ${Object.keys(hashes).length} CSS/JS files versioned.`);
