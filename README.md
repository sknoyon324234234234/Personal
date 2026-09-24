# Xiraiya — Portfolio & Live Service Showroom

![Xiraiya — websites, bots, apps & AI agents](assets/img/og-cover.png)

The personal website of **Xiraiya**, a 21-year-old full-stack developer from Rajshahi, Bangladesh with 5+ years of experience.
It's a cinematic, anime-inspired portfolio where visitors can try a live, interactive version of every service before they hire.

- **Pure HTML, CSS and JavaScript.** No framework and no build step. Open it, edit it and deploy it anywhere.
- **No emojis.** Every icon is a custom SVG from `assets/js/icons.js`.
- **SEO-ready.** Includes meta tags, Open Graph and Twitter cards, schema.org JSON-LD, `sitemap.xml`, `robots.txt` and a web manifest.
- **Accessible.** Uses semantic HTML, a skip link, keyboard support and visible focus styles, and honours `prefers-reduced-motion`.

## Pages

| Page | What's inside |
| --- | --- |
| `index.html` | Cinematic hero with an animated anime mascot (its eyes follow the cursor), intro loader, character sheet, skill radar, 5-year timeline, 11-service bento grid, horizontal "explore" panels, process and tech stack |
| `showcase.html` (**The Lab**) | 11 interactive stages: live website preview, drag-and-drop automation workflow, working Telegram shop bot, Chrome extension popup that edits a page, Minecraft server with plugin commands and a shop GUI, desktop OS with an EXE installer and app, Android app, configurable AI agent, AI chat widget (English + Bangla), e-commerce autopilot feed and an auto-confirming crypto checkout |
| `shop.html` | Full e-commerce demo: filters, product modal, cart, promo codes, AI shopping assistant, checkout with Crypto / bKash / Nagad / card / COD, and an autopilot admin dashboard |
| `components.html` (**UI Kit**) | Figma-style workspace with 50 live components (headers, bars, heroes, buttons, cards, forms, footers, loaders, alerts). It has a layers panel, zoom/pan, an inspector that reads real computed styles, copyable HTML/CSS/JS and present mode |
| `demos.html` + `demos/` | Six complete demo websites (SaaS, restaurant, crypto dashboard, Minecraft server, agency, app landing) and a desktop/laptop/tablet/phone preview studio |
| `tutorials.html` (**Motion Academy**) | After Effects-style tutorial player with a keyframe engine, timeline, layers, effect controls with an easing graph, motion paths, lesson notes, live CSS export, an easing lab and code guides |
| `hire.html` | Packages, a 4-step project configurator with an instant estimate, and a brief hand-off by email, Telegram or WhatsApp. Also covers payment methods, next steps and an FAQ with FAQPage schema |
| `404.html` | Custom "lost shinobi" page |

## Make it yours: edit one file

Almost everything personal lives in **`assets/js/config.js`**:

```js
contact: {
  email: 'your-email@example.com',     // <- replace
  telegram: 'your_telegram_username',  // <- replace (no @)
  whatsapp: '',                         // e.g. '8801XXXXXXXXX'
  github: '', linkedin: '', fiverr: '', upwork: ''
},
stats:    { projects: 120, clients: 70, bots: 40, countries: 12 },  // <- your real numbers
packages: [ /* Spark / Blade / Legend: names, prices, features */ ],
```

`XIRAIYA_SERVICES` in the same file controls each service's name, starting price, delivery time and add-on features. The Lab, the Hire configurator and the footer all read from it.

> **Before you share the site, replace these:**
> - The placeholder email and Telegram username.
> - The stats (projects, clients and so on), which are sample numbers.
> - The package and service prices, which are sample starting prices.
>
> The 5-year timeline in `index.html` (section "01 — The character") is a sample story. Edit it to match your real journey.

Longer copy (the bio, headings and FAQ answers) is plain HTML in each page. Search for the text and edit it.

## Run it locally

```bash
npx serve .          # or: python3 -m http.server 8080
```

Then open `http://localhost:3000` (or `:8080`). Opening `index.html` directly also works.

## Deploy on GitHub Pages (free)

1. Merge this branch into `main`.
2. On GitHub, open **Settings → Pages**, set **Source: Deploy from a branch** and choose **`main` / root**.
3. The site goes live at `https://sknoyon324234234234.github.io/Personal/`.
4. Submit `https://sknoyon324234234234.github.io/Personal/sitemap.xml` in [Google Search Console](https://search.google.com/search-console).

### Using a custom domain or a different host

Canonical URLs, Open Graph images and the sitemap use the full GitHub Pages URL. Replace it everywhere in one go:

```bash
grep -rl "sknoyon324234234234.github.io/Personal/" --include=*.html --include=*.xml --include=*.txt --include=*.js . \
  | xargs sed -i 's#https://sknoyon324234234234.github.io/Personal/#https://yourdomain.com/#g'
```

## Project structure

```
index.html  showcase.html  shop.html  components.html  demos.html  tutorials.html  hire.html  404.html
demos/                 six standalone demo websites
assets/css/            core.css (design system) + one stylesheet per page
assets/js/config.js    your details, prices, services, packages
assets/js/icons.js     custom SVG icon sprite (no emoji)
assets/js/core.js      header/footer, transitions, cursor, reveals, mascot, particles, helpers
assets/js/lab/         one script per Lab stage
assets/js/kit-data.js  UI Kit component library (HTML + CSS for each component)
assets/img/            favicon, app icons, social share image, demo thumbnails
tools/                 og.html + render-assets.js (regenerate images)
sitemap.xml  robots.txt  site.webmanifest  .nojekyll
```

## Regenerate images

Run this after you change the look of the share image, the favicon or a demo site:

```bash
npm i -D playwright && npx playwright install chromium
node tools/render-assets.js
```

## Notes

- Every shop, product, brand, person and review inside the demos is **fictional**.
- **No payment is ever requested or processed**: the crypto, bKash, Nagad and card flows are simulations and are labelled that way on screen. The demo wallet addresses and QR codes are decorative.
- Fonts: Unbounded, Plus Jakarta Sans, JetBrains Mono and Noto Serif JP from Google Fonts, loaded without blocking rendering.
- "Minecraft" is a trademark of Mojang/Microsoft and "Telegram" of Telegram FZ-LLC. The demos only use generic, original artwork.
