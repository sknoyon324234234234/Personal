/* =====================================================================
   XIRAIYA — SITE CONFIG
   This is the ONE file to edit for your personal details, contact
   links, prices and stats. Everything on the site reads from here.
   ===================================================================== */
window.XIRAIYA_CONFIG = {
  name: 'Xiraiya',
  role: 'Full-Stack Developer · Automation & AI Agent Engineer',
  age: 21,
  city: 'Rajshahi',
  country: 'Bangladesh',
  timezone: 'Asia/Dhaka',
  experienceYears: 5,
  startedYear: 2021,
  available: true,                 // shows the green "Available for work" status

  // Public URL of the site (used for share links). Change it if you use a custom domain.
  siteUrl: 'https://xiraiya.shop/',

  // ---- CONTACT (replace the placeholders with your real handles) -------------
  contact: {
    email: 'your-email@example.com',       // e.g. 'hello@yourdomain.com'
    telegram: 'TheMysteriousGhost',       // username without @
    whatsapp: '',                          // full number with country code, digits only, e.g. '8801XXXXXXXXX'
    github: '',                            // e.g. 'https://github.com/yourname'
    linkedin: '',                          // e.g. 'https://linkedin.com/in/yourname'
    fiverr: '',                            // profile URL (optional)
    upwork: ''                             // profile URL (optional)
  },

  // Optional: a form endpoint (Formspree, Getform, your own API...) that receives
  // the hire form as JSON via POST. Leave empty to use email / Telegram hand-off only.
  formEndpoint: '',

  // ---- STATS (put your real numbers here) ------------------------------------
  stats: {
    projects: 120,      // projects shipped
    clients: 70,        // happy clients
    bots: 40,           // bots & automations running
    countries: 12       // countries served
  },

  // ---- PAYMENTS -------------------------------------------------------------
  payments: {
    terms: '50% to start · 50% on delivery (milestones for bigger builds)',
    methods: ['USDT (TRC20 / BEP20)', 'Bitcoin', 'Ethereum', 'BNB / Binance Pay', 'bKash', 'Nagad', 'Payoneer', 'Bank transfer']
  },

  currency: '$',

  /* Character artwork, shown as a tilting 3D standee. Set a path to '' to fall back
     to the drawn-in-code character. Images: transparent PNG or WebP, full body,
     feet at the bottom, in assets/img/characters/. */
  characters: {
    xiraiya: 'assets/img/characters/xiraiya.webp',
    tsunade: 'assets/img/characters/tsunade.webp',
    toad: 'assets/img/characters/gama.webp',
    slug: 'assets/img/characters/katsuyu.webp',
    // a different Xiraiya pose per spot (data-pose or data-mascot on the page); anything unlisted uses xiraiya above
    poses: {
      hero: 'assets/img/characters/xiraiya-arms.webp',
      crew: 'assets/img/characters/xiraiya-writing.webp',
      lost: 'assets/img/characters/xiraiya-stop.webp'
    }
  },

  // ---- PACKAGES shown on the Hire page (edit names, prices and features) -----
  packages: [
    { name: 'Spark', jp: '火', price: 50, to: 100, per: 'project', tagline: 'Small and simple, done fast.',
      features: ['Landing page ($50–70) or automated Telegram bot ($50–100)', 'Mobile-first design', 'Basic SEO & analytics', '7 days of free fixes', 'Delivery in 2–5 days'] },
    { name: 'Blade', jp: '刃', price: 100, to: 300, per: 'project', tagline: 'A shop or a custom bot.', popular: true,
      features: ['Normal shop ($100–150)', 'Automated shop with AI agent and auto payments ($150–300)', 'Payments: bKash, Nagad, card, crypto', 'Custom UI design', '30 days of free fixes'] },
    { name: 'Legend', jp: '伝', price: 250, to: 500, per: 'project', tagline: 'The biggest builds.',
      features: ['Custom Telegram bot ($150–400)', 'Web apps, AI agents, full systems ($250–500)', 'Admin dashboard + automations', 'Crypto auto-payments & webhooks', '60 days support + handover docs'] }
  ],

  // Typical first reply time shown on the Hire page
  replyTime: 'within a few hours (GMT+6)',

  /* Sound for each power in the dock (effects + voice line in one track, timed to
     the animation). Made with ElevenLabs sound effects and stock voices.
     Remove a line to go back to the built-in synthesized sound for that power. */
  powerSounds: {
    chidori: 'assets/sfx/chidori.mp3',
    arise: 'assets/sfx/arise.mp3',
    wind: 'assets/sfx/wind.mp3',
    kamehameha: 'assets/sfx/kamehameha.mp3',
    slash: 'assets/sfx/slash.mp3',
    ssj: 'assets/sfx/ssj.mp3'
  }
};

/* ---------------------------------------------------------------------------
   SERVICES — used by the Lab, the Hire page configurator and prices.
   priceFrom / priceTo = the price range in USD, tiers = the price list
   shown on the Hire page and in the Lab. More requirements, more money.
   --------------------------------------------------------------------------- */
window.XIRAIYA_SERVICES = [
  { id: 'web',        icon: 'globe',  jp: '網', name: 'Websites & Web Apps',       priceFrom: 50, priceTo: 500, tiers: [['Landing page', 50, 70], ['Business site, up to 5 pages', 80, 150], ['Web app or dashboard', 250, 500]], days: '5–14',
    short: 'Landing pages, business sites, dashboards and full web apps that load fast on any phone.',
    tech: ['HTML/CSS/JS', 'React', 'Next.js', 'Node.js', 'Tailwind', 'WordPress'],
    features: [
      { id: 'pages', label: 'Extra pages (per 5)', price: 25 },
      { id: 'cms', label: 'CMS / admin panel', price: 60 },
      { id: 'auth', label: 'User accounts & login', price: 50 },
      { id: 'seo', label: 'Advanced SEO + analytics', price: 30 },
      { id: 'anim', label: 'Cinematic animations', price: 35 },
      { id: 'i18n', label: 'Multi-language (EN / BN ...)', price: 30 }
    ] },
  { id: 'automation', icon: 'flow',   jp: '自', name: 'Automation Tools',          priceFrom: 40, priceTo: 300, tiers: [['Simple script or scraper', 40, 50], ['Workflow with integrations', 100, 200], ['Full automation system', 250, 300]],  days: '3–10',
    short: 'Scrapers, workflow bots, auto-posting, data pipelines and API integrations.',
    tech: ['Python', 'Node.js', 'Playwright', 'Puppeteer', 'n8n', 'Cron / Queues'],
    features: [
      { id: 'scrape', label: 'Web scraping / data extraction', price: 30 },
      { id: 'sheets', label: 'Google Sheets / Excel sync', price: 20 },
      { id: 'sched', label: 'Scheduled runs (24/7 cloud)', price: 25 },
      { id: 'api', label: 'Third-party API integrations', price: 35 },
      { id: 'dash', label: 'Control dashboard', price: 50 }
    ] },
  { id: 'telegram',   icon: 'send',   jp: '伝', name: 'Telegram Bots',             priceFrom: 50, priceTo: 400, tiers: [['Automated normal bot', 50, 100], ['Custom bot (payments, admin, AI)', 150, 400]],  days: '3–10',
    short: 'Shop bots, support bots, group managers, signal & payment bots.',
    tech: ['Node.js', 'grammY', 'Python', 'aiogram', 'MongoDB', 'Webhooks'],
    features: [
      { id: 'pay', label: 'Payments (crypto / Telegram Stars)', price: 35 },
      { id: 'admin', label: 'Admin panel & broadcast', price: 30 },
      { id: 'ai', label: 'AI replies (LLM)', price: 45 },
      { id: 'groups', label: 'Group moderation', price: 25 },
      { id: 'mini', label: 'Telegram Mini App', price: 70 }
    ] },
  { id: 'extension',  icon: 'puzzle', jp: '拡', name: 'Chrome Extensions',         priceFrom: 40, priceTo: 300, tiers: [['Simple extension', 40, 50], ['Extension with accounts or sync', 100, 200], ['Full product, store-ready', 250, 300]], days: '4–12',
    short: 'Manifest V3 extensions: productivity, scrapers, trackers, page tools.',
    tech: ['Manifest V3', 'JavaScript', 'TypeScript', 'React', 'Service Workers'],
    features: [
      { id: 'popup', label: 'Designed popup UI', price: 20 },
      { id: 'sync', label: 'Cloud sync & accounts', price: 45 },
      { id: 'content', label: 'Page injection / automation', price: 30 },
      { id: 'store', label: 'Chrome Web Store publishing', price: 15 }
    ] },
  { id: 'minecraft',  icon: 'cube',   jp: '塊', name: 'Minecraft Plugins',         priceFrom: 30, priceTo: 250, tiers: [['Simple plugin', 30, 50], ['Economy, shop or ranks', 80, 150], ['Minigame or network system', 200, 250]],  days: '2–10',
    short: 'Custom Paper/Spigot plugins: economies, shops, ranks, minigames.',
    tech: ['Java', 'Paper / Spigot', 'Velocity', 'MySQL', 'Vault', 'PlaceholderAPI'],
    features: [
      { id: 'gui', label: 'Custom inventory GUIs', price: 15 },
      { id: 'db', label: 'MySQL / SQLite storage', price: 20 },
      { id: 'eco', label: 'Economy / shop system', price: 30 },
      { id: 'mini', label: 'Minigame logic', price: 60 },
      { id: 'web', label: 'Server website + store', price: 50 }
    ] },
  { id: 'desktop',    icon: 'window', jp: '機', name: 'Desktop Apps (.exe)',       priceFrom: 50, priceTo: 400, tiers: [['Simple tool', 50, 50], ['App with database', 100, 250], ['Full software + installer, updates', 250, 400]], days: '5–20',
    short: 'Windows software with installers: tools, dashboards, POS, utilities.',
    tech: ['Electron', 'C# / .NET', 'Python', 'Tauri', 'SQLite'],
    features: [
      { id: 'installer', label: 'Signed installer (.exe / .msi)', price: 25 },
      { id: 'update', label: 'Auto-updates', price: 30 },
      { id: 'license', label: 'License keys / activation', price: 40 },
      { id: 'offline', label: 'Offline database', price: 25 }
    ] },
  { id: 'mobile',     icon: 'phone',  jp: '携', name: 'Mobile Apps (.apk)',        priceFrom: 50, priceTo: 500, tiers: [['Simple app', 50, 50], ['App with login and data', 150, 250], ['Full app with payments', 250, 500]], days: '10–30',
    short: 'Android apps delivered as APK / Play Store: shops, tools, fitness, delivery.',
    tech: ['Flutter', 'React Native', 'Kotlin', 'Firebase'],
    features: [
      { id: 'push', label: 'Push notifications', price: 25 },
      { id: 'auth', label: 'Login & user profiles', price: 35 },
      { id: 'pay', label: 'In-app payments', price: 45 },
      { id: 'play', label: 'Play Store publishing', price: 20 },
      { id: 'ios', label: 'iOS build too', price: 100 }
    ] },
  { id: 'ai-agent',   icon: 'chip',   jp: '知', name: 'AI Agents',                 priceFrom: 50, priceTo: 500, tiers: [['Single-task agent', 50, 50], ['Agent with custom tools', 150, 250], ['Multi-agent system', 250, 500]], days: '7–21',
    short: 'Agents that use your tools and data to finish real work, like restocking or clearing a support inbox.',
    tech: ['Claude / GPT APIs', 'Tool calling', 'RAG', 'Vector DB', 'Python', 'Node.js'],
    features: [
      { id: 'tools', label: 'Custom tools (DB, email, CRM ...)', price: 60 },
      { id: 'rag', label: 'Knowledge base (RAG)', price: 55 },
      { id: 'memory', label: 'Long-term memory', price: 35 },
      { id: 'panel', label: 'Agent config panel', price: 65 },
      { id: 'multi', label: 'Multi-agent workflows', price: 90 }
    ] },
  { id: 'ai-chat',    icon: 'chat',   jp: '話', name: 'AI Chat Systems',           priceFrom: 50, priceTo: 300, tiers: [['FAQ chat widget', 50, 50], ['Chat trained on your docs', 100, 200], ['Multi-channel with human handoff', 250, 300]], days: '5–15',
    short: 'Chat for your website, Telegram or WhatsApp. Answers customers and passes the tricky ones to you.',
    tech: ['LLM APIs', 'WebSockets', 'Knowledge base', 'Widget SDK'],
    features: [
      { id: 'kb', label: 'Train on your docs & FAQ', price: 35 },
      { id: 'handoff', label: 'Human handoff inbox', price: 50 },
      { id: 'channels', label: 'Telegram + WhatsApp channels', price: 50 },
      { id: 'bangla', label: 'Bangla + English replies', price: 20 }
    ] },
  { id: 'ecommerce',  icon: 'bag',    jp: '店', name: 'E-commerce Stores',         priceFrom: 100, priceTo: 500, tiers: [['Normal shop', 100, 150], ['Automated shop: AI agent + auto payments', 150, 300], ['Large custom store', 300, 500]], days: '10–30',
    short: 'Custom stores that mostly run themselves: AI assistant, auto-payments, stock and order alerts.',
    tech: ['Next.js', 'Node.js', 'Shopify', 'WooCommerce', 'Stripe', 'Crypto gateways'],
    features: [
      { id: 'agent', label: 'AI shopping assistant', price: 70 },
      { id: 'autopilot', label: 'Autopilot agent (restock, replies, recovery)', price: 100 },
      { id: 'crypto', label: 'Crypto auto-payments', price: 60 },
      { id: 'local', label: 'bKash / Nagad payments', price: 35 },
      { id: 'admin', label: 'Custom admin dashboard', price: 80 }
    ] },
  { id: 'crypto',     icon: 'btc',    jp: '貨', name: 'Crypto & Auto Payments',    priceFrom: 50, priceTo: 250, tiers: [['Payment button or link', 50, 50], ['Auto-confirming checkout', 100, 200], ['Full payment + payout system', 200, 250]], days: '4–14',
    short: 'Auto-confirming crypto checkouts, invoices, webhooks and payout bots.',
    tech: ['USDT / BTC / ETH / BNB', 'Binance Pay', 'Webhooks', 'HMAC', 'Node.js'],
    features: [
      { id: 'multi', label: 'Multiple coins & networks', price: 30 },
      { id: 'invoice', label: 'Invoices & payment links', price: 30 },
      { id: 'webhook', label: 'Auto-confirm webhooks', price: 35 },
      { id: 'payout', label: 'Automatic payouts', price: 60 }
    ] }
];
