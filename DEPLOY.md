# Deploying Xiraiya on Hostinger

The site is plain HTML, CSS and JavaScript. There is no build step and nothing to install on the server.
Everything for search engines is generated from one file: `tools/seo.config.json`.

## 1. Point the site at your domain (once)

1. Open `tools/seo.config.json` and set `"url"` to your domain, with `https://` and a trailing slash:
   ```json
   "url": "https://yourdomain.com/",
   ```
   Use `https://www.yourdomain.com/` instead if you prefer the `www` version. The server then redirects
   every other variant (http, www / no-www) to this one address.
2. Run the generator from the project folder (Node.js 18 or newer):
   ```bash
   node tools/seo.js
   ```
   It rewrites every canonical link, Open Graph URL, structured-data URL, `sitemap.xml`, `robots.txt`,
   `llms.txt`, the `.htaccess` redirects and the 404 page's base path. It is safe to run again.
3. Commit and push.

## 2. Upload to Hostinger (pick one)

**A. Git (recommended, auto-updates).** hPanel → Websites → your site → Advanced → **Git**.
Repository `https://github.com/sknoyon324234234234/Personal.git`, branch `main`, install path empty
(so it deploys into `public_html`). Turn on **Auto deployment** and add the webhook it shows you to the
GitHub repo (Settings → Webhooks). Every push then goes live within seconds.

**B. GitHub Action over FTP.** Fill in the variables and secrets listed at the top of
`.github/workflows/hostinger.yml`. Every push to `main` uploads only the site files.

**C. Manual upload.** On GitHub use Code → **Download ZIP** (build tools are left out automatically), then in
hPanel → **File Manager** → `public_html` → Upload → Extract. Make sure `index.html` and `.htaccess` sit
directly inside `public_html`.

## 3. Turn on HTTPS

hPanel → Security → **SSL** → install the free SSL certificate for the domain. `.htaccess` already forces
HTTPS and sends a one-year HSTS header once the site runs on your domain.

## 4. What `.htaccess` does on Hostinger (LiteSpeed)

- One canonical address (HTTPS, www or not as configured) with 301 redirects
- Clean URLs: `/hire` serves `hire.html`; `/index.html` redirects to `/`; `/hire/` redirects to `/hire`
- The custom 404 page for any missing address, at any depth
- Long browser caching for images and fonts, 1 week for CSS and JS, no caching for HTML
- gzip compression, security headers (nosniff, frame, referrer, permissions, COOP, HSTS)
- `tools/`, `.git` and other dot-files are blocked; no directory listings

## 5. Get every page into Google and Bing

1. **Google Search Console** → Add property → *Domain* (verify with the DNS TXT record Hostinger's DNS editor
   accepts) or *URL prefix* (paste the code into `verification.google` in `tools/seo.config.json`, run
   `node tools/seo.js`, push).
2. Sitemaps → submit `sitemap.xml`. It lists all 9 pages with their share images.
3. URL Inspection → paste each page URL → **Request indexing**. New sites usually appear within a few days.
4. **Bing Webmaster Tools** → Import from Google Search Console (this also covers Yahoo and DuckDuckGo).
5. Check the results:
   - Rich Results Test: <https://search.google.com/test/rich-results>
   - Link previews: Facebook Sharing Debugger, the LinkedIn Post Inspector, or paste the link in Telegram
   - Speed: PageSpeed Insights

Sitelinks (the page links under your result in Google) are chosen by Google automatically. The site helps by
giving every page a unique title, description and share image, a clear page hierarchy (BreadcrumbList),
a site-wide page list in structured data, crawlable footer links on every page, and a complete sitemap.

## 6. Editing SEO later

Change titles, descriptions or share-image text in `tools/seo.config.json`, then:

```bash
node tools/render-og.js   # redraw the 1200×630 share images (needs Playwright + Chromium)
node tools/seo.js         # rewrite the tags, sitemap, robots, llms.txt and .htaccess
```

Keep titles under about 60 characters and descriptions under about 158. The generator warns you if they are longer.

## 7. After changing CSS or JS

Run this before you push, so visitors get the new styles and scripts straight away:

```bash
node tools/version-assets.js
```

It adds `?v=<hash>` to every stylesheet and script link, and only changes the ones whose file changed.
`.htaccess` also makes browsers check CSS and JS for updates on every visit, so a forgotten run can't leave
visitors stuck on old files. It can only make the first load after a deploy slower.

## 8. Power sounds (your own clips)

The powers (the 術 button) play only the audio files you add. Put each clip in `assets/sfx/` with one of
these names (mp3, m4a, ogg, wav or webm), then run `node tools/version-assets.js` and push:

| File | Plays |
| --- | --- |
| `chidori` | as Chidori starts charging |
| `chidori-hit` | when it strikes and the page shatters |
| `arise` | the shadow spell, as the dark falls |
| `arise-voice` | a voice saying "Arise", landing on the command |
| `arise-rise` | when the fallen page rises back up |
| `wind` | loops while the wind blows |
| `kamehameha` | the energy charging up |
| `kamehameha-voice` | the full chant; the beam fires on its final HAAA (about 1.3 s before the clip ends) |
| `kamehameha-fire` | HAAAA, as the beam fires |
| `super-saiyan` | the scream while powering up |
| `super-saiyan-burst` | the golden burst at the end |

A power with no clip is silent. Only add clips you have the right to publish.
