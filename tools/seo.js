#!/usr/bin/env node
/* XIRAIYA — SEO generator.
   Reads tools/seo.config.json and writes, for every page:
     title, description, canonical, hreflang, robots, Open Graph, Twitter card,
     search-engine verification and one JSON-LD @graph (WebSite, Person,
     ProfessionalService with prices, WebPage, BreadcrumbList, page extras),
   plus crawlable footer links, sitemap.xml, robots.txt, llms.txt and the 404 base path.

   Moving to a new domain (e.g. Hostinger):
     1. set "url" in tools/seo.config.json, e.g. "https://xiraiya.com/"
     2. run:  node tools/seo.js
   Every old absolute URL in the site is rewritten to the new one. Safe to run again. */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const write = (f, s) => fs.writeFileSync(path.join(root, f), s);
const cfg = JSON.parse(read('tools/seo.config.json'));
let SITE = cfg.url.trim();
if (!/\/$/.test(SITE)) SITE += '/';
const BASE_PATH = new URL(SITE).pathname;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const abs = p => SITE + (p || '');
const today = new Date().toISOString().slice(0, 10);

/* ---------- 1. move every absolute URL to the configured domain ---------- */
const statePath = 'tools/.seo-state.json';
let oldUrl = null;
try { oldUrl = JSON.parse(read(statePath)).url; } catch (e) {
  const m = read('index.html').match(/<link rel="canonical" href="([^"]+)"/);
  if (m) oldUrl = m[1].replace(/index\.html$/, '');
}
function walk(dir, out) {
  for (const n of fs.readdirSync(path.join(root, dir))) {
    if (n === '.git' || n === 'node_modules' || n === 'shop-photos') continue;
    const rel = path.join(dir, n), st = fs.statSync(path.join(root, rel));
    if (st.isDirectory()) walk(rel, out);
    else if (/\.(html|js|css|xml|txt|json|webmanifest|md|htaccess)$/.test(n) && rel !== statePath && rel !== path.join('tools', 'seo.config.json')) out.push(rel);
  }
  return out;
}
if (oldUrl && oldUrl !== SITE) {
  let n = 0;
  for (const f of walk('.', [])) { const s = read(f); if (s.includes(oldUrl)) { write(f, s.split(oldUrl).join(SITE)); n++; } }
  console.log('Moved URLs from ' + oldUrl + ' to ' + SITE + ' in ' + n + ' files');
}

/* ---------- 2. services and prices, straight from assets/js/config.js ---------- */
const services = [];
read('assets/js/config.js').replace(/name: '([^']+)',\s*priceFrom: (\d+), priceTo: (\d+)/g, (m, name, lo, hi) => { services.push({ name, lo: +lo, hi: +hi }); });

function lastmod(f) {
  try { const d = execSync('git log -1 --format=%cI -- "' + f + '"', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); if (d) return d.slice(0, 10); } catch (e) { /* no git */ }
  return today;
}

/* ---------- 3. structured data ---------- */
const ID = { site: abs('#website'), person: abs('#person'), biz: abs('#business'), logo: abs('#logo') };
function graph(p) {
  const url = abs(p.path), img = abs('assets/img/' + p.image.file), per = cfg.person;
  const G = [
    { '@type': 'WebSite', '@id': ID.site, url: SITE, name: cfg.name, alternateName: cfg.alternateName, inLanguage: cfg.language, publisher: { '@id': ID.person } },
    { '@type': 'Person', '@id': ID.person, name: per.name, jobTitle: per.jobTitle, description: per.description, url: SITE, image: abs(per.image),
      address: { '@type': 'PostalAddress', addressLocality: per.city, addressCountry: per.country }, knowsAbout: per.knowsAbout, sameAs: per.sameAs.length ? per.sameAs : undefined, worksFor: { '@id': ID.biz } },
    { '@type': 'ProfessionalService', '@id': ID.biz, name: cfg.name + ' — Development Studio', url: SITE, image: abs('assets/img/og/home.jpg'), logo: abs('assets/img/icon-512.png'),
      founder: { '@id': ID.person }, address: { '@type': 'PostalAddress', addressLocality: per.city, addressCountry: per.country }, areaServed: 'Worldwide', sameAs: per.sameAs.length ? per.sameAs : undefined,
      contactPoint: per.sameAs.filter(u => /t\.me\//.test(u)).map(u => ({ '@type': 'ContactPoint', contactType: 'customer support', url: u, availableLanguage: ['English', 'Bengali'] })),
      priceRange: '$' + Math.min.apply(null, services.map(s => s.lo)) + ' – $' + Math.max.apply(null, services.map(s => s.hi)),
      paymentAccepted: 'bKash, Nagad, USDT, Bitcoin, Ethereum, Binance Pay, Payoneer, bank transfer', currenciesAccepted: 'USD, BDT',
      hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Development services', itemListElement: services.map(s => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, provider: { '@id': ID.person } },
        priceSpecification: { '@type': 'PriceSpecification', priceCurrency: 'USD', minPrice: s.lo, maxPrice: s.hi } })) } },
    { '@type': [p.type === 'Course' || p.type === 'WebApplication' ? 'WebPage' : p.type], '@id': url + '#webpage', url, name: p.title, description: p.description, inLanguage: cfg.language,
      isPartOf: { '@id': ID.site }, about: { '@id': p.id === 'home' ? ID.person : ID.biz }, author: { '@id': ID.person },
      primaryImageOfPage: { '@type': 'ImageObject', url: img, width: 1200, height: 630 }, image: img, dateModified: lastmod(p.file),
      breadcrumb: { '@id': url + '#breadcrumb' }, mainEntity: p.id === 'home' ? { '@id': ID.person } : undefined },
    { '@type': 'BreadcrumbList', '@id': url + '#breadcrumb', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE }].concat(p.id === 'home' ? [] : [{ '@type': 'ListItem', position: 2, name: p.name, item: url }]) }
  ];
  if (p.type === 'WebApplication') G.push({ '@type': 'WebApplication', name: p.name, url, applicationCategory: 'DeveloperApplication', operatingSystem: 'Any (web browser)', description: p.description, offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' }, author: { '@id': ID.person } });
  if (p.type === 'Course') G.push({ '@type': 'Course', name: p.name, url, description: p.description, inLanguage: cfg.language, isAccessibleForFree: true, provider: { '@id': ID.person },
    hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online', courseWorkload: 'PT6H' }, offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD', category: 'Free' } });
  if (p.id === 'home') G.push({ '@type': 'ItemList', '@id': abs('#pages'), name: 'Site pages', itemListElement: cfg.pages.filter(q => q.id !== 'home').map((q, i) => ({ '@type': 'SiteNavigationElement', position: i + 1, name: q.name, description: q.description, url: abs(q.path) })) });
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': G }).replace(/<\//g, '<\\/');
}

/* ---------- 4. the <head> block ---------- */
function head(p) {
  const url = abs(p.path), img = abs('assets/img/' + p.image.file), v = cfg.verification || {};
  return [
    '<!-- seo:start (generated by tools/seo.js — edit tools/seo.config.json instead) -->',
    '<title>' + esc(p.title) + '</title>',
    '<meta name="description" content="' + esc(p.description) + '">',
    p.keywords ? '<meta name="keywords" content="' + esc(p.keywords) + '">' : '',
    '<meta name="author" content="' + esc(cfg.person.name) + '">',
    '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">',
    '<link rel="canonical" href="' + url + '">',
    '<link rel="alternate" hreflang="' + cfg.language + '" href="' + url + '">',
    '<link rel="alternate" hreflang="x-default" href="' + url + '">',
    '<link rel="sitemap" type="application/xml" title="Sitemap" href="' + abs('sitemap.xml') + '">',
    v.google ? '<meta name="google-site-verification" content="' + esc(v.google) + '">' : '',
    v.bing ? '<meta name="msvalidate.01" content="' + esc(v.bing) + '">' : '',
    v.yandex ? '<meta name="yandex-verification" content="' + esc(v.yandex) + '">' : '',
    '<meta property="og:type" content="' + (p.id === 'home' ? 'profile' : 'website') + '">',
    '<meta property="og:site_name" content="' + esc(cfg.name) + '">',
    '<meta property="og:locale" content="' + cfg.locale + '">',
    '<meta property="og:title" content="' + esc(p.ogTitle) + '">',
    '<meta property="og:description" content="' + esc(p.ogDescription) + '">',
    '<meta property="og:url" content="' + url + '">',
    '<meta property="og:image" content="' + img + '">',
    '<meta property="og:image:secure_url" content="' + img + '">',
    '<meta property="og:image:type" content="image/jpeg">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:alt" content="' + esc(p.name + ' — ' + cfg.name) + '">',
    '<meta name="twitter:card" content="summary_large_image">',
    cfg.twitter ? '<meta name="twitter:site" content="@' + esc(cfg.twitter) + '">' : '',
    '<meta name="twitter:title" content="' + esc(p.ogTitle) + '">',
    '<meta name="twitter:description" content="' + esc(p.ogDescription) + '">',
    '<meta name="twitter:image" content="' + img + '">',
    '<meta name="twitter:image:alt" content="' + esc(p.name + ' — ' + cfg.name) + '">',
    '<script type="application/ld+json">\n' + graph(p) + '\n</script>',
    '<!-- seo:end -->'
  ].filter(Boolean).join('\n');
}
const STRIP = [
  /<!-- seo:start[\s\S]*?<!-- seo:end -->\n?/g,
  /<title>[\s\S]*?<\/title>\n?/g,
  /<meta name="(description|keywords|author|robots|googlebot|google-site-verification|msvalidate\.01|yandex-verification)"[^>]*>\n?/g,
  /<meta (property|name)="(og|twitter):[^"]+"[^>]*>\n?/g,
  /<link rel="(canonical|sitemap)"[^>]*>\n?/g,
  /<link rel="alternate" hreflang[^>]*>\n?/g
];
function footerLinks(cur) {
  return '<footer class="site-footer" id="site-footer"><nav class="seo-nav" aria-label="All pages"><ul>' +
    cfg.pages.map(q => '<li><a href="' + (q.path || './') + '"' + (q.id === cur ? ' aria-current="page"' : '') + '>' + esc(q.name) + '</a></li>').join('') + '</ul></nav></footer>';
}

for (const p of cfg.pages) {
  let s = read(p.file);
  for (const re of STRIP) s = s.replace(re, '');
  /* page-specific structured data (FAQ, demo list) stays; generic blocks are replaced by the graph */
  s = s.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>\n?/g, (m, body) => /FAQPage|hasPart/.test(body) ? m : '');
  s = s.replace(/(<meta name="viewport"[^>]*>\n)/, '$1' + head(p) + '\n');
  s = s.replace(/<footer class="site-footer" id="site-footer">[\s\S]*?<\/footer>/, footerLinks(p.id));
  write(p.file, s);
  if (p.title.length > 62) console.warn('! title over 62 chars: ' + p.file);
  if (p.description.length > 160) console.warn('! description over 160 chars: ' + p.file);
}
console.log('Updated ' + cfg.pages.length + ' pages');

/* ---------- 5. 404 page works at any depth on Apache/LiteSpeed ---------- */
let e404 = read('404.html');
e404 = e404.replace(/<base href="[^"]*">\n?/, '').replace(/(<meta name="viewport"[^>]*>\n)/, '$1<base href="' + BASE_PATH + '">\n');
if (!/name="robots"/.test(e404)) e404 = e404.replace(/(<base href[^>]*>\n)/, '$1<meta name="robots" content="noindex">\n');
write('404.html', e404);

/* ---------- 6. sitemap.xml ---------- */
const sm = ['<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
for (const p of cfg.pages) {
  const url = abs(p.path);
  sm.push('  <url>', '    <loc>' + url + '</loc>', '    <lastmod>' + lastmod(p.file) + '</lastmod>', '    <changefreq>' + p.changefreq + '</changefreq>', '    <priority>' + p.priority + '</priority>',
    '    <xhtml:link rel="alternate" hreflang="' + cfg.language + '" href="' + url + '"/>',
    '    <image:image><image:loc>' + abs('assets/img/' + p.image.file) + '</image:loc><image:title>' + esc(p.name + ' — ' + cfg.name) + '</image:title></image:image>',
    '  </url>');
}
sm.push('</urlset>', '');
write('sitemap.xml', sm.join('\n'));

/* ---------- 7. robots.txt and llms.txt ---------- */
write('robots.txt', [
  '# ' + cfg.name + ' — ' + SITE,
  'User-agent: *',
  'Allow: /',
  'Disallow: ' + BASE_PATH + 'tools/',
  '',
  'Sitemap: ' + abs('sitemap.xml'),
  ''
].join('\n'));
write('llms.txt', [
  '# ' + cfg.name,
  '',
  '> ' + cfg.person.description,
  '',
  'Services (USD): ' + services.map(s => s.name + ' $' + s.lo + '–' + s.hi).join('; ') + '.',
  '',
  '## Pages',
  '',
  ...cfg.pages.map(p => '- [' + p.name + '](' + abs(p.path) + '): ' + p.description),
  ''
].join('\n'));


/* ---------- 8. .htaccess for Apache / LiteSpeed hosting (Hostinger) ---------- */
const HOST = new URL(SITE).host, WWW = /^www\./.test(HOST), BARE = HOST.replace(/^www\./, '');
const isLocal = /github\.io$|localhost/.test(HOST);
write('.htaccess', [
  '# Generated by tools/seo.js for ' + SITE + ' — Apache / LiteSpeed (Hostinger).',
  '# GitHub Pages ignores this file.',
  '',
  'Options -Indexes',
  'DirectoryIndex index.html',
  'AddDefaultCharset UTF-8',
  'ErrorDocument 404 ' + BASE_PATH + '404.html',
  '',
  '<IfModule mod_mime.c>',
  '  AddType image/webp .webp',
  '  AddType image/avif .avif',
  '  AddType image/svg+xml .svg',
  '  AddType font/woff2 .woff2',
  '  AddType application/manifest+json .webmanifest',
  '  AddType text/plain .txt',
  '</IfModule>',
  '',
  '<IfModule mod_rewrite.c>',
  '  RewriteEngine On',
  '  RewriteBase ' + BASE_PATH,
  isLocal ? '  # (HTTPS and host redirects switch on once the site runs on its own domain)' : '  # one canonical origin: HTTPS and ' + (WWW ? 'www' : 'no www'),
  isLocal ? '' : '  RewriteCond %{HTTPS} off [OR]\n  RewriteCond %{HTTP_HOST} !^' + HOST.replace(/\./g, '\\.') + '$ [NC]\n  RewriteRule ^(.*)$ https://' + HOST + '/$1 [R=301,L]',
  '  # block tooling and dot-files',
  '  RewriteRule ^(tools|\\.git|\\.claude)(/|$) - [F,L]',
  '  RewriteRule (^|/)\\.(?!well-known) - [F,L]',
  '  # /index.html → /',
  '  RewriteCond %{THE_REQUEST} \\s/+(.*/)?index\\.html[\\s?] [NC]',
  '  RewriteRule ^(.*/)?index\\.html$ ' + BASE_PATH + '$1 [R=301,L]',
  '  # /hire/ → /hire (keeps relative asset paths working)',
  '  RewriteCond %{REQUEST_FILENAME} !-d',
  '  RewriteRule ^(.+)/$ ' + BASE_PATH + '$1 [R=301,L]',
  '  # clean URLs: /hire serves hire.html',
  '  RewriteCond %{REQUEST_FILENAME} !-d',
  '  RewriteCond %{REQUEST_FILENAME}.html -f',
  '  RewriteRule ^(.+)$ $1.html [L]',
  '</IfModule>',
  '',
  '<IfModule mod_headers.c>',
  '  Header always set X-Content-Type-Options "nosniff"',
  '  Header always set X-Frame-Options "SAMEORIGIN"',
  '  Header always set Referrer-Policy "strict-origin-when-cross-origin"',
  '  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"',
  '  Header always set Cross-Origin-Opener-Policy "same-origin"',
  isLocal ? '' : '  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"',
  '  <FilesMatch "\\.(html|xml|txt|webmanifest)$">',
  '    Header set Cache-Control "no-cache, must-revalidate"',
  '  </FilesMatch>',
  '  <FilesMatch "\\.(css|js)$">',
  '    Header set Cache-Control "public, max-age=604800, stale-while-revalidate=86400"',
  '  </FilesMatch>',
  '  <FilesMatch "\\.(png|jpe?g|webp|avif|gif|svg|ico|woff2?)$">',
  '    Header set Cache-Control "public, max-age=31536000, immutable"',
  '  </FilesMatch>',
  '</IfModule>',
  '',
  '<IfModule mod_deflate.c>',
  '  AddOutputFilterByType DEFLATE text/html text/css text/plain text/xml application/xml application/javascript text/javascript application/json application/manifest+json image/svg+xml',
  '</IfModule>',
  '',
  '<IfModule mod_expires.c>',
  '  ExpiresActive On',
  '  ExpiresDefault "access plus 1 week"',
  '  ExpiresByType text/html "access plus 0 seconds"',
  '  ExpiresByType application/xml "access plus 0 seconds"',
  '  ExpiresByType text/css "access plus 1 week"',
  '  ExpiresByType application/javascript "access plus 1 week"',
  '  ExpiresByType image/webp "access plus 1 year"',
  '  ExpiresByType image/png "access plus 1 year"',
  '  ExpiresByType image/jpeg "access plus 1 year"',
  '  ExpiresByType image/svg+xml "access plus 1 year"',
  '  ExpiresByType font/woff2 "access plus 1 year"',
  '</IfModule>',
  ''
].filter(l => l !== '').join('\n').replace(/\n(<IfModule|# one|  # )/g, '\n$1') + '\n');

write(statePath, JSON.stringify({ url: SITE, generated: new Date().toISOString() }, null, 2) + '\n');
console.log('Wrote sitemap.xml, robots.txt, llms.txt, .htaccess and 404 base "' + BASE_PATH + '"');
