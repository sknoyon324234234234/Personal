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
  siteUrl: 'https://sknoyon324234234234.github.io/Personal/',

  // ---- CONTACT (replace the placeholders with your real handles) -------------
  contact: {
    email: 'your-email@example.com',       // e.g. 'hello@yourdomain.com'
    telegram: 'your_telegram_username',   // username without @
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

  currency: '$'
};

/* ---------------------------------------------------------------------------
   SERVICES — used by the Lab, the Hire page configurator and prices.
   priceFrom = your starting price in USD. Edit freely.
   --------------------------------------------------------------------------- */
window.XIRAIYA_SERVICES = [
  { id: 'web',        icon: 'globe',  jp: '網', name: 'Websites & Web Apps',       priceFrom: 149, days: '5–14',
    short: 'Cinematic landing pages, business sites, dashboards and full web apps.',
    tech: ['HTML/CSS/JS', 'React', 'Next.js', 'Node.js', 'Tailwind', 'WordPress'],
    features: [
      { id: 'pages', label: 'Extra pages (per 5)', price: 60 },
      { id: 'cms', label: 'CMS / admin panel', price: 150 },
      { id: 'auth', label: 'User accounts & login', price: 120 },
      { id: 'seo', label: 'Advanced SEO + analytics', price: 70 },
      { id: 'anim', label: 'Cinematic animations', price: 90 },
      { id: 'i18n', label: 'Multi-language (EN / BN ...)', price: 80 }
    ] },
  { id: 'automation', icon: 'flow',   jp: '自', name: 'Automation Tools',          priceFrom: 99,  days: '3–10',
    short: 'Scrapers, workflow bots, auto-posting, data pipelines and API integrations.',
    tech: ['Python', 'Node.js', 'Playwright', 'Puppeteer', 'n8n', 'Cron / Queues'],
    features: [
      { id: 'scrape', label: 'Web scraping / data extraction', price: 80 },
      { id: 'sheets', label: 'Google Sheets / Excel sync', price: 50 },
      { id: 'sched', label: 'Scheduled runs (24/7 cloud)', price: 60 },
      { id: 'api', label: 'Third-party API integrations', price: 90 },
      { id: 'dash', label: 'Control dashboard', price: 120 }
    ] },
  { id: 'telegram',   icon: 'send',   jp: '伝', name: 'Telegram Bots',             priceFrom: 79,  days: '3–10',
    short: 'Shop bots, support bots, group managers, signal & payment bots.',
    tech: ['Node.js', 'grammY', 'Python', 'aiogram', 'MongoDB', 'Webhooks'],
    features: [
      { id: 'pay', label: 'Payments (crypto / Telegram Stars)', price: 90 },
      { id: 'admin', label: 'Admin panel & broadcast', price: 80 },
      { id: 'ai', label: 'AI replies (LLM)', price: 110 },
      { id: 'groups', label: 'Group moderation', price: 60 },
      { id: 'mini', label: 'Telegram Mini App', price: 180 }
    ] },
  { id: 'extension',  icon: 'puzzle', jp: '拡', name: 'Chrome Extensions',         priceFrom: 119, days: '4–12',
    short: 'Manifest V3 extensions: productivity, scrapers, trackers, page tools.',
    tech: ['Manifest V3', 'JavaScript', 'TypeScript', 'React', 'Service Workers'],
    features: [
      { id: 'popup', label: 'Designed popup UI', price: 50 },
      { id: 'sync', label: 'Cloud sync & accounts', price: 110 },
      { id: 'content', label: 'Page injection / automation', price: 80 },
      { id: 'store', label: 'Chrome Web Store publishing', price: 40 }
    ] },
  { id: 'minecraft',  icon: 'cube',   jp: '塊', name: 'Minecraft Plugins',         priceFrom: 59,  days: '2–10',
    short: 'Custom Paper/Spigot plugins: economies, shops, ranks, minigames.',
    tech: ['Java', 'Paper / Spigot', 'Velocity', 'MySQL', 'Vault', 'PlaceholderAPI'],
    features: [
      { id: 'gui', label: 'Custom inventory GUIs', price: 40 },
      { id: 'db', label: 'MySQL / SQLite storage', price: 50 },
      { id: 'eco', label: 'Economy / shop system', price: 70 },
      { id: 'mini', label: 'Minigame logic', price: 150 },
      { id: 'web', label: 'Server website + store', price: 120 }
    ] },
  { id: 'desktop',    icon: 'window', jp: '機', name: 'Desktop Apps (.exe)',       priceFrom: 149, days: '5–20',
    short: 'Windows software with installers: tools, dashboards, POS, utilities.',
    tech: ['Electron', 'C# / .NET', 'Python', 'Tauri', 'SQLite'],
    features: [
      { id: 'installer', label: 'Signed installer (.exe / .msi)', price: 60 },
      { id: 'update', label: 'Auto-updates', price: 80 },
      { id: 'license', label: 'License keys / activation', price: 100 },
      { id: 'offline', label: 'Offline database', price: 60 }
    ] },
  { id: 'mobile',     icon: 'phone',  jp: '携', name: 'Mobile Apps (.apk)',        priceFrom: 199, days: '10–30',
    short: 'Android apps delivered as APK / Play Store: shops, tools, fitness, delivery.',
    tech: ['Flutter', 'React Native', 'Kotlin', 'Firebase'],
    features: [
      { id: 'push', label: 'Push notifications', price: 60 },
      { id: 'auth', label: 'Login & user profiles', price: 90 },
      { id: 'pay', label: 'In-app payments', price: 110 },
      { id: 'play', label: 'Play Store publishing', price: 50 },
      { id: 'ios', label: 'iOS build too', price: 250 }
    ] },
  { id: 'ai-agent',   icon: 'chip',   jp: '知', name: 'AI Agents',                 priceFrom: 249, days: '7–21',
    short: 'Autonomous agents that plan, use tools, and finish real business tasks.',
    tech: ['Claude / GPT APIs', 'Tool calling', 'RAG', 'Vector DB', 'Python', 'Node.js'],
    features: [
      { id: 'tools', label: 'Custom tools (DB, email, CRM ...)', price: 150 },
      { id: 'rag', label: 'Knowledge base (RAG)', price: 140 },
      { id: 'memory', label: 'Long-term memory', price: 90 },
      { id: 'panel', label: 'Agent config panel', price: 160 },
      { id: 'multi', label: 'Multi-agent workflows', price: 220 }
    ] },
  { id: 'ai-chat',    icon: 'chat',   jp: '話', name: 'AI Chat Systems',           priceFrom: 199, days: '5–15',
    short: 'Website / Telegram / WhatsApp chat that answers, sells and hands off to humans.',
    tech: ['LLM APIs', 'WebSockets', 'Knowledge base', 'Widget SDK'],
    features: [
      { id: 'kb', label: 'Train on your docs & FAQ', price: 90 },
      { id: 'handoff', label: 'Human handoff inbox', price: 120 },
      { id: 'channels', label: 'Telegram + WhatsApp channels', price: 130 },
      { id: 'bangla', label: 'Bangla + English replies', price: 50 }
    ] },
  { id: 'ecommerce',  icon: 'bag',    jp: '店', name: 'E-commerce Stores',         priceFrom: 399, days: '10–30',
    short: 'Custom stores on autopilot: AI agent, auto-payments, inventory, notifications.',
    tech: ['Next.js', 'Node.js', 'Shopify', 'WooCommerce', 'Stripe', 'Crypto gateways'],
    features: [
      { id: 'agent', label: 'AI shopping assistant', price: 180 },
      { id: 'autopilot', label: 'Autopilot agent (restock, replies, recovery)', price: 250 },
      { id: 'crypto', label: 'Crypto auto-payments', price: 150 },
      { id: 'local', label: 'bKash / Nagad payments', price: 90 },
      { id: 'admin', label: 'Custom admin dashboard', price: 200 }
    ] },
  { id: 'crypto',     icon: 'btc',    jp: '貨', name: 'Crypto & Auto Payments',    priceFrom: 149, days: '4–14',
    short: 'Auto-confirming crypto checkouts, invoices, webhooks and payout bots.',
    tech: ['USDT / BTC / ETH / BNB', 'Binance Pay', 'Webhooks', 'HMAC', 'Node.js'],
    features: [
      { id: 'multi', label: 'Multiple coins & networks', price: 80 },
      { id: 'invoice', label: 'Invoices & payment links', price: 70 },
      { id: 'webhook', label: 'Auto-confirm webhooks', price: 90 },
      { id: 'payout', label: 'Automatic payouts', price: 150 }
    ] }
];
