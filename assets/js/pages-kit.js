/* XIRAIYA — Pages Studio: page template generator.
   Builds a complete, standalone HTML page from a design state.
   Everything the studio shows (and exports) comes from here. */
(function () {
  'use strict';

  var FONTS = [
    { id: 'modern', name: 'Inter Tight / Inter', h: '"Inter Tight"', b: 'Inter', q: 'Inter+Tight:wght@500;600;700;800&family=Inter:wght@400;500;600;700', ls: '-.035em' },
    { id: 'editorial', name: 'Fraunces / Figtree', h: 'Fraunces', b: 'Figtree', q: 'Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Figtree:wght@400;500;600;700', ls: '-.03em' },
    { id: 'grotesk', name: 'Space Grotesk / DM Sans', h: '"Space Grotesk"', b: '"DM Sans"', q: 'Space+Grotesk:wght@500;600;700&family=DM+Sans:wght@400;500;600;700', ls: '-.04em' },
    { id: 'classic', name: 'Playfair / Source Sans', h: '"Playfair Display"', b: '"Source Sans 3"', q: 'Playfair+Display:wght@500;600;700;800&family=Source+Sans+3:wght@400;500;600;700', ls: '-.02em' },
    { id: 'friendly', name: 'Nunito / Nunito', h: 'Nunito', b: 'Nunito', q: 'Nunito:wght@400;500;600;700;800;900', ls: '-.025em' },
    { id: 'luxe', name: 'Cormorant / Manrope', h: '"Cormorant Garamond"', b: 'Manrope', q: 'Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700', ls: '-.015em' },
    { id: 'bold', name: 'Syne / Outfit', h: 'Syne', b: 'Outfit', q: 'Syne:wght@600;700;800&family=Outfit:wght@400;500;600;700', ls: '-.035em' },
    { id: 'tech', name: 'JetBrains Mono / IBM Plex Sans', h: '"JetBrains Mono"', b: '"IBM Plex Sans"', q: 'JetBrains+Mono:wght@500;600;700;800&family=IBM+Plex+Sans:wght@400;500;600;700', ls: '-.04em' }
  ];

  var PALETTES = [
    { n: 'Indigo', p: '#5b5bf0', a: '#ff7a59' },
    { n: 'Emerald', p: '#0f8a5f', a: '#f2b441' },
    { n: 'Vermilion', p: '#c4321d', a: '#2c6f65' },
    { n: 'Ocean', p: '#1f6fd6', a: '#12b3a3' },
    { n: 'Grape', p: '#7a3cf0', a: '#f04fa0' },
    { n: 'Sunset', p: '#ef5a3c', a: '#f5b53d' },
    { n: 'Graphite', p: '#18181b', a: '#71717a' },
    { n: 'Lime', p: '#4d7c0f', a: '#0ea5e9' },
    { n: 'Rose', p: '#e11d48', a: '#7c3aed' },
    { n: 'Gold', p: '#a16207', a: '#1e293b' }
  ];

  var TONES = {
    neutral: { n: 'Neutral', L: { bg: '#ffffff', sf: '#f5f5f7', tx: '#16161a', mt: '#5f5f6b' }, D: { bg: '#0d0d11', sf: '#17171d', tx: '#ededf2', mt: '#9d9daa' } },
    warm: { n: 'Warm paper', L: { bg: '#fbf7f0', sf: '#f2ebdf', tx: '#1f1a14', mt: '#6a5f52' }, D: { bg: '#14110d', sf: '#1f1a14', tx: '#f1ebe1', mt: '#a89d8e' } },
    cool: { n: 'Cool slate', L: { bg: '#f6f9fc', sf: '#e9eff6', tx: '#0f1a2a', mt: '#566378' }, D: { bg: '#0a1220', sf: '#121c2e', tx: '#e6eef8', mt: '#8fa0b8' } },
    mint: { n: 'Soft mint', L: { bg: '#f5faf7', sf: '#e7f2ec', tx: '#10201a', mt: '#55695f' }, D: { bg: '#08130f', sf: '#102019', tx: '#e3f1ea', mt: '#8aa598' } }
  };

  var BTN = {
    style: [['solid', 'Solid'], ['outline', 'Outline'], ['soft', 'Soft'], ['gradient', 'Gradient'], ['glass', 'Glass'], ['brutal', 'Brutal'], ['3d', '3D'], ['neon', 'Neon']],
    shape: [['square', 'Square'], ['rounded', 'Rounded'], ['pill', 'Pill']],
    size: [['sm', 'S'], ['md', 'M'], ['lg', 'L']],
    hover: [['lift', 'Lift'], ['glow', 'Glow'], ['shine', 'Shine'], ['press', 'Press'], ['none', 'None']]
  };

  /* ---------------- helpers ---------------- */
  var P = {
    arrow: 'M5 12h14M13 6l6 6-6 6', check: 'M20 6 9 17l-5-5', bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
    shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
    globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
    mail: 'M4 5h16v14H4zM4 6l8 7 8-7', lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4', menu: 'M4 7h16M4 12h16M4 17h16',
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4', home: 'M3 11l9-7 9 7v9H3z', grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    card: 'M3 6h18v12H3zM3 10h18', sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
    bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4', play: 'M7 4l13 8-13 8z',
    pin: 'M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4',
    phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2', eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
    layers: 'M12 3 2 8l10 5 10-5zM2 13l10 5 10-5M2 18l10 5 10-5', code: 'M8 7l-5 5 5 5M16 7l5 5-5 5', spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6',
    x: 'M6 6l12 12M18 6 6 18', plus: 'M12 5v14M5 12h14', clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2', back: 'M19 12H5M11 18l-6-6 6-6'
  };
  function ic(n, cls) { return '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (P[n] || P.spark) + '"/></svg>'; }
  function star() { return '<svg class="st" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3 7 7 .6-5.3 4.7 1.6 7L12 17.8 5.7 21.3l1.6-7L2 9.6 9 9z"/></svg>'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hex(h) { h = String(h || '').replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); var n = parseInt(h, 16); return isNaN(n) ? [0, 0, 0] : [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function lum(h) { var c = hex(h).map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
  function onColor(h) { return lum(h) > .42 ? '#111111' : '#ffffff'; }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }

  var ctx;
  function B(label, kind, icn) { var pri = kind !== 'sec'; return '<a href="#" class="btn ' + (pri ? 'pri' : 'sec') + '">' + '<span>' + esc(label) + '</span>' + (pri && ctx.S.btn.icon ? ic(icn || 'arrow') : '') + '</a>'; }
  function mark() { return '<svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--p)"/><path d="M9 21c3-9 11-9 14 0" stroke="var(--on)" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="16" cy="11" r="3" fill="var(--a)"/></svg>'; }
  function logo() { return '<a href="#" class="logo">' + mark() + '<span>' + esc(ctx.S.brand) + '</span></a>'; }
  function eyebrow(t) { return '<span class="eyebrow"><i></i>' + esc(t) + '</span>'; }
  function av(i) { var c = ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#0ea5e9'][i % 5]; return '<span class="av" style="background:' + c + '">' + 'ASMRJ'[i % 5] + '</span>'; }
  var LINKS = ['Product', 'Pricing', 'Customers', 'Docs'];
  var LOGOS = [['Northwind', 800, 0], ['Halcyon', 600, 1], ['Brightline', 700, 0], ['Orbital', 800, 1], ['Kitefin', 600, 0], ['Monarch', 700, 1]];

  /* ---------------- sections ---------------- */
  var SEC = {};
  SEC.nav = { name: 'Navbar', v: ['Classic', 'Centered', 'Floating pill', 'Minimal', 'Announcement'], r: function (v) {
    var links = '<nav class="links">' + LINKS.map(function (l) { return '<a href="#">' + l + '</a>'; }).join('') + '</nav>';
    var acts = '<div class="acts"><a href="#" class="lnk">Log in</a>' + B('Get started') + '</div>';
    var burger = '<button class="burger" type="button" aria-label="Menu" data-burger>' + ic('menu') + '</button>';
    var mob = '<div class="mnav">' + LINKS.map(function (l) { return '<a href="#">' + l + '</a>'; }).join('') + '<a href="#">Log in</a></div>';
    if (v === 1) return '<header class="nav nav-c"><div class="wrap bar">' + links + logo() + acts + burger + '</div>' + mob + '</header>';
    if (v === 2) return '<header class="nav nav-p"><div class="wrap"><div class="bar pill">' + logo() + links + acts + burger + '</div></div>' + mob + '</header>';
    if (v === 3) return '<header class="nav nav-m"><div class="wrap bar">' + logo() + '<div class="acts">' + B('Book a demo', 'sec') + '<button class="burger on" type="button" aria-label="Menu" data-burger>' + ic('menu') + '<span>Menu</span></button></div></div>' + mob + '</header>';
    var ann = v === 4 ? '<div class="ann"><b>New</b> ' + esc(ctx.S.brand) + ' 2.0 is here, with a faster everything. <a href="#">Read the launch notes ' + ic('arrow') + '</a></div>' : '';
    return ann + '<header class="nav"><div class="wrap bar">' + logo() + links + acts + burger + '</div>' + mob + '</header>';
  } };

  function mock() {
    return '<div class="mock card"><div class="mock-top"><i></i><i></i><i></i><span>app.' + esc(ctx.S.brand.toLowerCase().replace(/[^a-z0-9]/g, '')) + '.com</span></div><div class="mock-b">' +
      '<aside>' + ['home', 'chart', 'users', 'layers', 'sliders'].map(function (n, i) { return '<span class="' + (i === 1 ? 'on' : '') + '">' + ic(n) + '</span>'; }).join('') + '</aside>' +
      '<div class="mock-main"><div class="kp"><div><small>Revenue</small><b>$84.2k</b><em>+12%</em></div><div><small>Users</small><b>12,480</b><em>+8%</em></div><div><small>Churn</small><b>1.9%</b><em class="dn">-0.4</em></div></div>' +
      '<div class="bars">' + [38, 52, 44, 66, 58, 74, 62, 88, 70, 94, 82, 100].map(function (h, i) { return '<i style="height:' + h + '%;animation-delay:' + i * 60 + 'ms"></i>'; }).join('') + '</div></div></div>' +
      '<div class="float f1 card">' + ic('bolt') + '<span><b>Deploy finished</b><small>in 38 seconds</small></span></div><div class="float f2 card"><span class="dot"></span>1,284 online now</div></div>';
  }
  SEC.hero = { name: 'Hero', v: ['Centered', 'Split + product', 'Editorial', 'Gradient + stats', 'Search'], r: function (v) {
    var S = ctx.S, h1 = S.tag, sub = 'Plan, build and ship with one calm workspace. ' + S.brand + ' keeps your team, your data and your customers in the same place.';
    var proof = '<div class="proof"><div class="avs">' + [0, 1, 2, 3].map(av).join('') + '</div><span><b>' + star() + star() + star() + star() + star() + '</b>Loved by 12,000+ teams</span></div>';
    if (v === 1) return '<section class="s hero hero-split"><div class="wrap grid2">' + '<div>' + eyebrow('Now with AI workflows') + '<h1>' + esc(h1) + '</h1><p class="lead">' + esc(sub) + '</p><div class="btns">' + B('Start free trial') + B('Watch demo', 'sec') + '</div>' + proof + '</div>' + mock() + '</div></section>';
    if (v === 2) return '<section class="s hero hero-ed"><div class="wrap"><h1 class="huge">' + esc(h1) + '</h1><div class="ed-row"><p class="lead">' + esc(sub) + '</p><div class="btns">' + B('Get started') + B('See pricing', 'sec') + '</div></div><div class="ed-img"><div class="ed-art"><i></i><i></i><i></i></div><span class="card tagc">' + ic('spark') + 'Designed for focus</span></div></div></section>';
    if (v === 3) return '<section class="s hero hero-g"><div class="mesh"></div><div class="wrap center">' + eyebrow('Trusted by 12,000+ teams') + '<h1>' + esc(h1) + '</h1><p class="lead">' + esc(sub) + '</p><div class="btns jc">' + B('Start for free') + B('Talk to sales', 'sec') + '</div><div class="stats3">' + [['99.99%', 'Uptime'], ['38 ms', 'Median latency'], ['4.9/5', 'Average rating']].map(function (x) { return '<div class="card glass"><b>' + x[0] + '</b><span>' + x[1] + '</span></div>'; }).join('') + '</div></div></section>';
    if (v === 4) return '<section class="s hero hero-s"><div class="wrap center">' + eyebrow('2,400+ templates and guides') + '<h1>' + esc(h1) + '</h1><p class="lead">' + esc(sub) + '</p><form class="sbar card" data-form>' + ic('search') + '<input placeholder="Search templates, guides, people" aria-label="Search">' + '<button class="btn pri" type="submit"><span>Search</span></button></form><div class="tags"><span>Popular:</span>' + ['Onboarding', 'Roadmaps', 'CRM', 'Invoices', 'Hiring'].map(function (t) { return '<a href="#">' + t + '</a>'; }).join('') + '</div></div></section>';
    return '<section class="s hero hero-c"><div class="wrap center">' + eyebrow('New: AI workflows are live') + '<h1>' + esc(h1) + '</h1><p class="lead">' + esc(sub) + '</p><div class="btns jc">' + B('Start free trial') + B('Book a demo', 'sec') + '</div>' + proof + '</div></section>';
  } };

  SEC.logos = { name: 'Logo cloud', v: ['Strip', 'Cards'], r: function (v) {
    var L = LOGOS.map(function (l) { return '<span class="wm" style="font-weight:' + l[1] + ';' + (l[2] ? 'font-style:italic;' : '') + '">' + l[0] + '</span>'; }).join('');
    if (v === 1) return '<section class="s logos"><div class="wrap"><p class="kick center">Teams that ship with ' + esc(ctx.S.brand) + '</p><div class="lgrid">' + LOGOS.map(function (l) { return '<div class="card"><span class="wm" style="font-weight:' + l[1] + '">' + l[0] + '</span></div>'; }).join('') + '</div></div></section>';
    return '<section class="s logos sm"><div class="wrap"><p class="kick center">Trusted by fast-moving teams</p><div class="lstrip">' + L + '</div></div></section>';
  } };

  var FEAT = [['bolt', 'Fast by default', 'Pages load in under a second, on any network, anywhere in the world.'], ['shield', 'Secure from day one', 'SSO, audit logs and encryption at rest. Your security team will relax.'], ['users', 'Built for teams', 'Comments, mentions and live cursors keep everyone on the same page.'], ['chart', 'Real-time analytics', 'Watch numbers move as they happen. No waiting for tomorrow’s report.'], ['layers', 'Integrates everywhere', 'Connect 120+ tools in a click, or build your own with the API.'], ['globe', 'Global by design', 'Every currency, time zone and language your customers use.']];
  SEC.features = { name: 'Features', v: ['Card grid', 'Alternating rows', 'Bento'], r: function (v) {
    var head = function (t) { return '<div class="shead center">' + eyebrow('Features') + '<h2>' + t + '</h2><p class="lead">Everything you need, nothing you will not use.</p></div>'; };
    if (v === 1) return '<section class="s feat-alt"><div class="wrap">' + head('Work the way your team thinks') + FEAT.slice(0, 3).map(function (f, i) {
      return '<div class="frow' + (i % 2 ? ' rev' : '') + '"><div><span class="fic">' + ic(f[0]) + '</span><h3>' + f[1] + '</h3><p>' + f[2] + '</p><ul class="ticks"><li>' + ic('check') + 'Set up in minutes</li><li>' + ic('check') + 'No code required</li><li>' + ic('check') + 'Works on every device</li></ul></div><div class="vis card"><div class="vis-in v' + i + '">' + (i === 0 ? '<b></b><b></b><b></b><b></b>' : i === 1 ? '<span></span><span></span><span></span>' : '<i></i><i></i><i></i><i></i><i></i><i></i>') + '</div></div></div>';
    }).join('') + '</div></section>';
    if (v === 2) return '<section class="s feat-bento"><div class="wrap">' + head('One workspace. Every tool.') + '<div class="bento">' +
      '<div class="card b1"><span class="fic">' + ic('chart') + '</span><h3>Real-time analytics</h3><p>Watch numbers move as they happen.</p><div class="spark"><svg viewBox="0 0 200 60" preserveAspectRatio="none"><path d="M0 50 20 42 40 46 60 30 80 34 100 20 120 26 140 12 160 18 180 6 200 10" fill="none" stroke="var(--p)" stroke-width="3"/></svg></div></div>' +
      '<div class="card b2 inv"><span class="fic">' + ic('bolt') + '</span><h3>Blazing fast</h3><p class="big">0.4s</p><p>median page load</p></div>' +
      '<div class="card b3"><span class="fic">' + ic('users') + '</span><h3>Built for teams</h3><div class="avs">' + [0, 1, 2, 3, 4].map(av).join('') + '</div></div>' +
      '<div class="card b4"><span class="fic">' + ic('shield') + '</span><h3>Secure from day one</h3><p>SSO, audit logs and encryption at rest.</p></div>' +
      '<div class="card b5"><span class="fic">' + ic('layers') + '</span><h3>120+ integrations</h3><div class="chips">' + ['Slack', 'Stripe', 'GitHub', 'Figma', 'Notion', 'Zapier'].map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</div></div>' +
      '</div></div></section>';
    return '<section class="s feat"><div class="wrap">' + head('Everything your team needs to move faster') + '<div class="g3">' + FEAT.map(function (f) { return '<div class="card fc"><span class="fic">' + ic(f[0]) + '</span><h3>' + f[1] + '</h3><p>' + f[2] + '</p></div>'; }).join('') + '</div></div></section>';
  } };

  SEC.stats = { name: 'Stats', v: ['Numbers row', 'Color band'], r: function (v) {
    var st = [['12k+', 'Teams onboard'], ['99.99%', 'Uptime, last 12 months'], ['4.2x', 'Faster shipping'], ['38 ms', 'Median latency']];
    var row = '<div class="g4">' + st.map(function (x) { return '<div class="stat"><b>' + x[0] + '</b><span>' + x[1] + '</span></div>'; }).join('') + '</div>';
    if (v === 1) return '<section class="s stats band"><div class="wrap">' + row + '</div></section>';
    return '<section class="s stats sm"><div class="wrap">' + row + '</div></section>';
  } };

  var QUOTES = [['We replaced four tools with ' + '{b}' + ' and our Monday meeting went from an hour to ten minutes.', 'Amina Rahman', 'Head of Ops, Northwind'], ['The first product our whole team actually likes opening. Support answers in minutes, not days.', 'Samir Hossain', 'CTO, Halcyon'], ['We launched in three countries in one quarter. The setup took an afternoon.', 'Maya Chen', 'Founder, Kitefin']];
  function q(t) { return esc(t.replace('{b}', ctx.S.brand)); }
  SEC.testimonials = { name: 'Testimonials', v: ['Cards', 'Big quote', 'Marquee'], r: function (v) {
    var cards = QUOTES.map(function (x, i) { return '<figure class="card tq"><div class="stars">' + star() + star() + star() + star() + star() + '</div><blockquote>“' + q(x[0]) + '”</blockquote><figcaption>' + av(i) + '<span><b>' + x[1] + '</b><small>' + x[2] + '</small></span></figcaption></figure>'; });
    if (v === 1) return '<section class="s tbig"><div class="wrap center"><div class="stars">' + star() + star() + star() + star() + star() + '</div><blockquote>“' + q(QUOTES[0][0]) + '”</blockquote><div class="who">' + av(0) + '<span><b>' + QUOTES[0][1] + '</b><small>' + QUOTES[0][2] + '</small></span></div></div></section>';
    if (v === 2) return '<section class="s tmq"><div class="shead center wrap">' + eyebrow('Wall of love') + '<h2>People say nice things</h2></div><div class="mq"><div class="mq-in">' + cards.concat(cards).join('') + '</div></div></section>';
    return '<section class="s tcards"><div class="wrap"><div class="shead center">' + eyebrow('Customers') + '<h2>Teams are shipping more, and meeting less</h2></div><div class="g3">' + cards.join('') + '</div></div></section>';
  } };

  var PLANS = [['Starter', 0, 0, 'For side projects and trying things out.', ['Up to 3 projects', 'Community support', '1 GB storage']], ['Pro', 24, 19, 'For growing teams that ship every week.', ['Unlimited projects', 'Priority support', '100 GB storage', 'Advanced analytics']], ['Business', 79, 63, 'For companies with serious needs.', ['Everything in Pro', 'SSO and audit logs', 'Dedicated manager', '99.99% SLA']]];
  SEC.pricing = { name: 'Pricing', v: ['Three cards', 'Toggle + cards', 'Compare table'], r: function (v) {
    var head = '<div class="shead center">' + eyebrow('Pricing') + '<h2>Simple pricing. No surprises.</h2><p class="lead">Start free. Upgrade when you grow. Cancel any time.</p>' + (v === 1 ? '<div class="tgl" data-tgl><button type="button" class="on" data-per="m">Monthly</button><button type="button" data-per="y">Yearly <em>-20%</em></button></div>' : '') + '</div>';
    if (v === 2) {
      var rows = [['Projects', '3', 'Unlimited', 'Unlimited'], ['Storage', '1 GB', '100 GB', '1 TB'], ['Analytics', '-', 'Advanced', 'Advanced'], ['SSO', '-', '-', 'yes'], ['Audit logs', '-', '-', 'yes'], ['Support', 'Community', 'Priority', 'Dedicated']];
      return '<section class="s pricing"><div class="wrap">' + head + '<div class="card tblw"><table class="cmp"><thead><tr><th></th>' + PLANS.map(function (p, i) { return '<th' + (i === 1 ? ' class="hl"' : '') + '><b>' + p[0] + '</b><span class="pr">$' + p[1] + '<small>/mo</small></span>' + B(i === 0 ? 'Start free' : 'Choose ' + p[0], i === 1 ? 'pri' : 'sec') + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rows.map(function (r) { return '<tr><td>' + r[0] + '</td>' + r.slice(1).map(function (c, i) { return '<td' + (i === 1 ? ' class="hl"' : '') + '>' + (c === 'yes' ? ic('check', 'ok') : c === '-' ? '<span class="no">—</span>' : c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div></div></section>';
    }
    return '<section class="s pricing"><div class="wrap">' + head + '<div class="g3 plans">' + PLANS.map(function (p, i) {
      return '<div class="card plan' + (i === 1 ? ' pop' : '') + '">' + (i === 1 ? '<span class="badge">Most popular</span>' : '') + '<h3>' + p[0] + '</h3><p>' + p[3] + '</p><div class="pr"><b data-m="$' + p[1] + '" data-y="$' + p[2] + '">$' + p[1] + '</b><small>/month</small></div>' + B(i === 0 ? 'Start free' : 'Choose ' + p[0], i === 1 ? 'pri' : 'sec') + '<ul class="ticks">' + p[4].map(function (f) { return '<li>' + ic('check') + f + '</li>'; }).join('') + '</ul></div>';
    }).join('') + '</div></div></section>';
  } };

  var FAQ = [['Can I try it before I pay?', 'Yes. Every plan starts with a 14-day trial, and the Starter plan is free forever.'], ['Do you offer discounts for students?', 'Students and non-profits get 50% off any paid plan. Just email us from your school or org address.'], ['Can I change plans later?', 'Any time. Upgrades apply instantly and downgrades apply at the end of your billing cycle.'], ['Where is my data stored?', 'In the region you choose: EU, US or Asia. Backups are encrypted and kept for 30 days.'], ['Do you accept crypto?', 'Yes. We accept USDT, BTC and ETH on yearly plans, as well as all major cards.']];
  SEC.faq = { name: 'FAQ', v: ['Accordion', 'Two columns'], r: function (v) {
    if (v === 1) return '<section class="s faq2"><div class="wrap grid2"><div>' + eyebrow('FAQ') + '<h2>Questions, answered</h2><p class="lead">Cannot find what you need? Our team replies within an hour.</p>' + B('Contact support', 'sec') + '</div><div class="qa">' + FAQ.map(function (f) { return '<div><h3>' + f[0] + '</h3><p>' + f[1] + '</p></div>'; }).join('') + '</div></div></section>';
    return '<section class="s faq"><div class="wrap narrow"><div class="shead center">' + eyebrow('FAQ') + '<h2>Frequently asked questions</h2></div>' + FAQ.map(function (f, i) { return '<details class="acc card"' + (i === 0 ? ' open' : '') + '><summary>' + f[0] + ic('plus') + '</summary><p>' + f[1] + '</p></details>'; }).join('') + '</div></section>';
  } };

  SEC.cta = { name: 'Call to action', v: ['Banner', 'Split + email', 'Minimal'], r: function (v) {
    if (v === 1) return '<section class="s cta2"><div class="wrap"><div class="card grid2 ctab"><div><h2>Get the product update, once a month</h2><p class="lead">New features, customer stories and zero spam.</p></div><form class="nl" data-form><input type="email" placeholder="you@company.com" aria-label="Email" required><button class="btn pri" type="submit"><span>Subscribe</span></button></form></div></div></section>';
    if (v === 2) return '<section class="s cta3"><div class="wrap center"><h2>Ready when you are.</h2><p class="lead">Set up in five minutes. No card needed.</p><div class="btns jc">' + B('Start free trial') + '</div></div></section>';
    return '<section class="s cta1"><div class="wrap"><div class="banner"><div><h2>Start building with ' + esc(ctx.S.brand) + ' today</h2><p>Join 12,000+ teams. Free for 14 days, cancel in one click.</p></div><div class="btns">' + B('Start free trial') + B('Talk to sales', 'sec') + '</div><div class="ring r1"></div><div class="ring r2"></div></div></div></section>';
  } };

  SEC.footer = { name: 'Footer', v: ['Columns', 'Simple', 'Big brand'], r: function (v) {
    var yr = 2026, brand = esc(ctx.S.brand);
    var soc = '<div class="soc">' + ['globe', 'mail', 'code'].map(function (n) { return '<a href="#" aria-label="' + n + '">' + ic(n) + '</a>'; }).join('') + '</div>';
    if (v === 1) return '<footer class="foot f1"><div class="wrap bar">' + logo() + '<nav class="links">' + LINKS.map(function (l) { return '<a href="#">' + l + '</a>'; }).join('') + '</nav><small>© ' + yr + ' ' + brand + '</small></div></footer>';
    if (v === 2) return '<footer class="foot f2"><div class="wrap"><div class="bar"><p class="lead">Made for teams who would rather be building.</p>' + soc + '</div><div class="giant">' + brand + '</div><div class="bar small"><small>© ' + yr + ' ' + brand + ' Inc.</small><nav class="links"><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Status</a></nav></div></div></footer>';
    var cols = [['Product', ['Features', 'Pricing', 'Changelog', 'Roadmap']], ['Company', ['About', 'Careers', 'Blog', 'Press']], ['Resources', ['Docs', 'Guides', 'API', 'Status']]];
    return '<footer class="foot f0"><div class="wrap"><div class="fgrid"><div>' + logo() + '<p>' + esc(ctx.S.tag) + '</p>' + soc + '</div>' + cols.map(function (c) { return '<div><h4>' + c[0] + '</h4>' + c[1].map(function (l) { return '<a href="#">' + l + '</a>'; }).join('') + '</div>'; }).join('') + '</div><div class="bar small"><small>© ' + yr + ' ' + brand + ' Inc. All rights reserved.</small><nav class="links"><a href="#">Privacy</a><a href="#">Terms</a></nav></div></div></footer>';
  } };

  function art(kind) {
    return '<div class="art"><div class="blob b1"></div><div class="blob b2"></div><div class="art-in">' + logo() +
      '<figure class="card glass aq"><blockquote>“' + q(QUOTES[kind ? 2 : 0][0]) + '”</blockquote><figcaption>' + av(kind ? 2 : 0) + '<span><b>' + QUOTES[kind ? 2 : 0][1] + '</b><small>' + QUOTES[kind ? 2 : 0][2] + '</small></span></figcaption></figure></div></div>';
  }
  function social() { return '<div class="socb"><a href="#" class="btn sec"><span class="gl">G</span><span>Google</span></a><a href="#" class="btn sec">' + ic('code') + '<span>GitHub</span></a></div><div class="or"><span>or</span></div>'; }
  SEC.login = { name: 'Login', full: 1, v: ['Centered card', 'Art left', 'Art right', 'Full-bleed'], o: [['social', 'Social buttons', 1], ['remember', 'Remember me', 1], ['magic', 'Magic link option', 0]], r: function (v, o) {
    var form = '<form class="authf" data-form>' + (v === 3 || v === 0 ? logo() : '') + '<h1>Welcome back</h1><p class="lead">Log in to your ' + esc(ctx.S.brand) + ' account.</p>' + (o.social ? social() : '') +
      '<label>Email<input type="email" placeholder="you@company.com" required></label><label><span class="lr">Password <a href="#">Forgot?</a></span><span class="pw"><input type="password" placeholder="Your password" required data-reveal-pw><button type="button" aria-label="Show password" data-eye>' + ic('eye') + '</button></span></label>' +
      (o.remember ? '<label class="chk"><input type="checkbox" checked> Keep me logged in</label>' : '') + '<button class="btn pri full" type="submit"><span>Log in</span>' + (ctx.S.btn.icon ? ic('arrow') : '') + '</button>' +
      (o.magic ? '<button class="btn sec full" type="button">' + ic('mail') + '<span>Email me a magic link</span></button>' : '') + '<p class="alt">New here? <a href="#">Create an account</a></p><div class="okmsg">' + ic('check') + 'Logged in. Redirecting to your dashboard.</div></form>';
    if (v === 1 || v === 2) return '<section class="auth split' + (v === 2 ? ' rev' : '') + '">' + art(0) + '<div class="authw">' + form + '</div></section>';
    if (v === 3) return '<section class="auth bleed"><div class="mesh"></div><div class="card glass authc">' + form + '</div></section>';
    return '<section class="auth ctr"><div class="card authc">' + form + '</div></section>';
  } };

  SEC.signup = { name: 'Sign up', full: 1, v: ['Centered card', 'Art split', 'Multi-step'], o: [['social', 'Social buttons', 1], ['meter', 'Password strength', 1], ['terms', 'Terms checkbox', 1]], r: function (v, o) {
    var pw = '<label>Password<span class="pw"><input type="password" placeholder="At least 8 characters" required data-pwm data-reveal-pw><button type="button" aria-label="Show password" data-eye>' + ic('eye') + '</button></span></label>' + (o.meter ? '<div class="meter" data-meter><i></i><i></i><i></i><i></i><span>Type a password</span></div>' : '');
    var terms = o.terms ? '<label class="chk"><input type="checkbox" required> I agree to the <a href="#">Terms</a> and <a href="#">Privacy Policy</a></label>' : '';
    if (v === 2) return '<section class="auth ctr"><div class="card authc wide"><form class="authf" data-steps data-form>' + logo() + '<div class="prog"><i></i></div><p class="kick" data-stepl>Step 1 of 3</p>' +
      '<div class="stp on"><h1>Create your account</h1><p class="lead">It takes about a minute.</p>' + (o.social ? social() : '') + '<label>Full name<input placeholder="Amina Rahman"></label><label>Work email<input type="email" placeholder="you@company.com"></label>' + pw + '</div>' +
      '<div class="stp"><h1>Set up your workspace</h1><p class="lead">You can change this later.</p><label>Workspace name<input placeholder="Northwind"></label><label>Team size<select><option>Just me</option><option>2 to 10</option><option>11 to 50</option><option>51+</option></select></label><div class="picks">' + ['Engineering', 'Design', 'Marketing', 'Sales'].map(function (t, i) { return '<label><input type="checkbox"' + (i === 0 ? ' checked' : '') + '><span>' + t + '</span></label>'; }).join('') + '</div></div>' +
      '<div class="stp"><h1>Pick a plan</h1><p class="lead">14 days free on every plan.</p><div class="plans2">' + PLANS.map(function (p, i) { return '<label class="card"><input type="radio" name="pl"' + (i === 1 ? ' checked' : '') + '><span><b>' + p[0] + '</b><small>' + p[3] + '</small></span><em>$' + p[1] + '</em></label>'; }).join('') + '</div>' + terms + '</div>' +
      '<div class="snav"><button type="button" class="btn sec" data-back><span>Back</span></button><button type="button" class="btn pri" data-next><span>Continue</span>' + (ctx.S.btn.icon ? ic('arrow') : '') + '</button></div><div class="okmsg">' + ic('check') + 'Account created. Check your inbox to confirm.</div></form></div></section>';
    var form = '<form class="authf" data-form>' + (v === 0 ? logo() : '') + '<h1>Create your account</h1><p class="lead">Free for 14 days. No card needed.</p>' + (o.social ? social() : '') + '<div class="two"><label>First name<input placeholder="Amina"></label><label>Last name<input placeholder="Rahman"></label></div><label>Work email<input type="email" placeholder="you@company.com" required></label>' + pw + terms +
      '<button class="btn pri full" type="submit"><span>Create account</span>' + (ctx.S.btn.icon ? ic('arrow') : '') + '</button><p class="alt">Already have an account? <a href="#">Log in</a></p><div class="okmsg">' + ic('check') + 'Account created. Check your inbox to confirm.</div></form>';
    if (v === 1) return '<section class="auth split">' + art(1) + '<div class="authw">' + form + '</div></section>';
    return '<section class="auth ctr"><div class="card authc">' + form + '</div></section>';
  } };

  SEC.dash = { name: 'Dashboard', full: 1, v: ['Sidebar', 'Icon rail', 'Top bar'], o: [['kpis', 'KPI cards', 1], ['chart', 'Chart', 1], ['table', 'Table', 1]], r: function (v, o) {
    var items = [['home', 'Overview'], ['chart', 'Analytics'], ['users', 'Customers'], ['card', 'Billing'], ['sliders', 'Settings']];
    var nav = items.map(function (x, i) { return '<a href="#" class="' + (i === 0 ? 'on' : '') + '">' + ic(x[0]) + '<span>' + x[1] + '</span></a>'; }).join('');
    var top = '<div class="dtop"><div><h1>Good morning, Amina</h1><p>Here is what happened while you were away.</p></div><div class="dact"><label class="dsr card">' + ic('search') + '<input placeholder="Search" aria-label="Search"></label><button class="ibt card" type="button" aria-label="Notifications">' + ic('bell') + '<i></i></button>' + B('New report', 'pri', 'plus') + '</div></div>';
    var k = o.kpis ? '<div class="g4 kpis">' + [['Revenue', '$84,210', '+12.4%'], ['Active users', '12,480', '+8.1%'], ['Conversion', '3.92%', '+0.6%'], ['Churn', '1.9%', '-0.4%']].map(function (x, i) { return '<div class="card kpi"><small>' + x[0] + '</small><b>' + x[1] + '</b><em class="' + (i === 3 ? 'dn' : '') + '">' + x[2] + '</em></div>'; }).join('') + '</div>' : '';
    var ch = o.chart ? '<div class="card dchart"><div class="dh"><h3>Revenue</h3><div class="tgl sm" data-tgl><button type="button" class="on">30 days</button><button type="button">12 months</button></div></div><svg viewBox="0 0 600 200" preserveAspectRatio="none"><defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--p)" stop-opacity=".3"/><stop offset="1" stop-color="var(--p)" stop-opacity="0"/></linearGradient></defs><path d="M0 150 C50 140 80 120 120 125 S200 90 240 95 320 60 360 70 440 40 480 45 560 20 600 25 V200 H0Z" fill="url(#dg)"/><path d="M0 150 C50 140 80 120 120 125 S200 90 240 95 320 60 360 70 440 40 480 45 560 20 600 25" fill="none" stroke="var(--p)" stroke-width="3" vector-effect="non-scaling-stroke"/></svg></div>' : '';
    var act = '<div class="card dact2"><h3>Activity</h3>' + [['Amina', 'upgraded to Business', '2m'], ['Samir', 'invited 4 teammates', '18m'], ['Maya', 'paid invoice #1042', '1h'], ['Rafi', 'exported a report', '3h']].map(function (x, i) { return '<div class="ai">' + av(i) + '<p><b>' + x[0] + '</b> ' + x[1] + '</p><small>' + x[2] + '</small></div>'; }).join('') + '</div>';
    var tb = o.table ? '<div class="card dtbl"><div class="dh"><h3>Recent customers</h3><a href="#" class="lnk">View all</a></div><table><thead><tr><th>Customer</th><th>Plan</th><th>Status</th><th>MRR</th></tr></thead><tbody>' + [['Northwind', 'Business', 'Active', '$790'], ['Halcyon', 'Pro', 'Active', '$240'], ['Kitefin', 'Pro', 'Trial', '$0'], ['Orbital', 'Business', 'Past due', '$790']].map(function (r) { return '<tr><td><b>' + r[0] + '</b></td><td>' + r[1] + '</td><td><span class="pill ' + (r[2] === 'Active' ? 'g' : r[2] === 'Trial' ? 'b' : 'r') + '">' + r[2] + '</span></td><td>' + r[3] + '</td></tr>'; }).join('') + '</tbody></table></div>' : '';
    var main = '<main class="dmain">' + top + k + '<div class="drow">' + ch + act + '</div>' + tb + '</main>';
    if (v === 2) return '<section class="dash dtopbar"><header class="dhead"><div class="wrap bar">' + logo() + '<nav>' + nav + '</nav>' + av(0) + '</div></header>' + main + '</section>';
    return '<section class="dash' + (v === 1 ? ' rail' : '') + '"><aside class="dside">' + logo() + '<nav>' + nav + '</nav><div class="card up"><b>Upgrade to Business</b><small>SSO, audit logs and more.</small>' + B('Upgrade', 'pri') + '</div></aside>' + main + '</section>';
  } };

  SEC.blog = { name: 'Blog post', v: ['Classic', 'Wide cover', 'Minimal'], r: function (v) {
    var meta = '<div class="bmeta">' + av(1) + '<span><b>Samir Hossain</b><small>Sep 18, 2026 · 7 min read</small></span></div>';
    var body = '<div class="prose"><p class="lead">Most teams do not have a speed problem. They have a waiting problem. Here is how we cut our release cycle from two weeks to two days.</p><h2>Start with the queue, not the code</h2><p>We mapped every step between "done" and "shipped". Nine of the fourteen steps were waiting: for review, for QA, for someone to press a button.</p><blockquote>“Speed is not how fast you type. It is how little you wait.”</blockquote><h2>Three changes that mattered</h2><ul class="ticks"><li>' + ic('check') + 'Reviews within four hours, or the change merges with a follow-up.</li><li>' + ic('check') + 'Every pull request gets a preview link automatically.</li><li>' + ic('check') + 'Feature flags instead of release branches.</li></ul><p>None of this needed a new tool. It needed a rule, a bot and a shared dashboard in ' + esc(ctx.S.brand) + '.</p><pre><code>// flags.ts\nexport const newCheckout = flag(\'new-checkout\', { rollout: 0.1 })</code></pre><p>Two months later, we ship 31 times a week. Nobody works late on Fridays.</p></div>';
    var tags = '<div class="tags">' + ['Engineering', 'Process', 'Culture'].map(function (t) { return '<a href="#">' + t + '</a>'; }).join('') + '</div>';
    if (v === 1) return '<article class="s blog bw"><div class="wrap"><div class="cover"><div class="blob b1"></div><div class="blob b2"></div><div class="cv-in">' + tags + '<h1>How we ship 31 times a week without burning out</h1>' + meta + '</div></div><div class="narrow">' + body + '</div></div></article>';
    if (v === 2) return '<article class="s blog bm"><div class="wrap narrow"><a href="#" class="lnk back">' + ic('back') + 'All posts</a><h1>How we ship 31 times a week without burning out</h1>' + meta + body + '</div></article>';
    return '<article class="s blog bc"><div class="wrap narrow center-h">' + tags + '<h1>How we ship 31 times a week without burning out</h1>' + meta + '<div class="bimg"><div class="ed-art"><i></i><i></i><i></i></div></div></div><div class="wrap narrow">' + body + '</div></article>';
  } };

  SEC.newsletter = { name: 'Newsletter', v: ['Inline', 'Card'], r: function (v) {
    var f = '<form class="nl" data-form><input type="email" placeholder="you@company.com" aria-label="Email" required><button class="btn pri" type="submit"><span>Subscribe</span></button></form><div class="okmsg">' + ic('check') + 'You are in. See you next month.</div>';
    if (v === 1) return '<section class="s nlw"><div class="wrap narrow"><div class="card nlc center"><span class="fic">' + ic('mail') + '</span><h2>Enjoyed this post?</h2><p class="lead">One email a month. Only the good stuff.</p><div data-formw>' + f + '</div></div></div></section>';
    return '<section class="s nlw sm"><div class="wrap narrow"><div class="nli"><div><h3>Get new posts by email</h3><p>Monthly. No spam.</p></div><div data-formw>' + f + '</div></div></div></section>';
  } };

  SEC.contact = { name: 'Contact', v: ['Split', 'Centered form', 'With map'], r: function (v) {
    var form = '<form class="cf" data-form><div class="two"><label>Name<input placeholder="Amina Rahman" required></label><label>Email<input type="email" placeholder="you@company.com" required></label></div><label>Topic<select><option>Sales</option><option>Support</option><option>Partnerships</option><option>Press</option></select></label><label>Message<textarea rows="5" placeholder="How can we help?"></textarea></label><button class="btn pri" type="submit"><span>Send message</span>' + (ctx.S.btn.icon ? ic('arrow') : '') + '</button><div class="okmsg">' + ic('check') + 'Thanks. We will reply within one business day.</div></form>';
    var info = [['mail', 'Email', 'hello@' + ctx.S.brand.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com'], ['phone', 'Phone', '+880 1700 000 000'], ['pin', 'Office', 'Rajshahi, Bangladesh'], ['clock', 'Hours', 'Sun to Thu, 9 to 6']];
    var il = '<div class="info">' + info.map(function (x) { return '<div><span class="fic">' + ic(x[0]) + '</span><span><small>' + x[1] + '</small><b>' + x[2] + '</b></span></div>'; }).join('') + '</div>';
    if (v === 1) return '<section class="s contact"><div class="wrap narrow"><div class="shead center">' + eyebrow('Contact') + '<h1>Let us talk</h1><p class="lead">Questions, demos, partnerships. A human reads every message.</p></div><div class="card pad">' + form + '</div></div></section>';
    if (v === 2) return '<section class="s contact"><div class="wrap"><div class="shead center">' + eyebrow('Contact') + '<h1>Come say hello</h1></div><div class="grid2"><div class="card map"><svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"><rect width="400" height="300" fill="var(--sf)"/><g stroke="var(--ln)" stroke-width="10" fill="none"><path d="M0 90H400M0 210H400M110 0V300M290 0V300"/><path d="M0 40C120 80 260 0 400 60" stroke-width="6"/></g><path d="M0 250C80 230 160 280 240 250S360 230 400 240V300H0Z" fill="color-mix(in srgb,var(--p) 18%,transparent)"/></svg><span class="mpin">' + ic('pin') + '</span><div class="card mcard"><b>' + esc(ctx.S.brand) + ' HQ</b><small>Rajshahi, Bangladesh</small></div></div><div class="card pad">' + form + '</div></div></div></section>';
    return '<section class="s contact"><div class="wrap grid2"><div>' + eyebrow('Contact') + '<h1>Let us talk</h1><p class="lead">Questions, demos, partnerships. A human reads every message and replies within a day.</p>' + il + '</div><div class="card pad">' + form + '</div></div></section>';
  } };

  SEC.notfound = { name: '404', v: ['Big number', 'Illustration', 'Minimal'], r: function (v) {
    var btns = '<div class="btns jc">' + B('Back to home', 'pri', 'home') + B('Contact support', 'sec') + '</div>';
    if (v === 1) return '<section class="s nf center"><div class="wrap narrow"><svg class="nfart" viewBox="0 0 240 160" aria-hidden="true"><circle cx="120" cy="80" r="56" fill="color-mix(in srgb,var(--p) 16%,transparent)"/><ellipse cx="120" cy="80" rx="96" ry="18" fill="none" stroke="var(--a)" stroke-width="4" transform="rotate(-14 120 80)"/><circle cx="104" cy="70" r="7" fill="var(--tx)"/><circle cx="136" cy="70" r="7" fill="var(--tx)"/><path d="M104 100q16-12 32 0" stroke="var(--tx)" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="36" cy="30" r="3" fill="var(--mt)"/><circle cx="210" cy="40" r="4" fill="var(--mt)"/><circle cx="196" cy="130" r="3" fill="var(--mt)"/></svg><h1>This page drifted into space</h1><p class="lead">The link may be broken, or the page moved. Let us get you back on track.</p>' + btns + '</div></section>';
    if (v === 2) return '<section class="s nf nfm"><div class="wrap narrow"><p class="kick">Error 404</p><h1>Page not found.</h1><p class="lead">Sorry, we could not find the page you were looking for.</p><a href="#" class="lnk">' + ic('back') + 'Go back home</a></div></section>';
    return '<section class="s nf center"><div class="wrap narrow"><div class="n404">4<span>0</span>4</div><h1>Lost? It happens.</h1><p class="lead">This page does not exist, but plenty of good ones do.</p><form class="sbar card" data-form>' + ic('search') + '<input placeholder="Search the site" aria-label="Search"><button class="btn pri" type="submit"><span>Search</span></button></form>' + btns + '</div></section>';
  } };

  var PAGES = [
    { id: 'home', name: 'Homepage', ic: 'home', s: ['nav', 'hero', 'logos', 'features', 'stats', 'testimonials', 'cta', 'footer'] },
    { id: 'login', name: 'Log in', ic: 'lock', s: ['login'] },
    { id: 'signup', name: 'Sign up', ic: 'user', s: ['signup'] },
    { id: 'pricing', name: 'Pricing', ic: 'tag', s: ['nav', 'pricing', 'faq', 'cta', 'footer'] },
    { id: 'dashboard', name: 'Dashboard', ic: 'grid', s: ['dash'] },
    { id: 'blog', name: 'Blog post', ic: 'book', s: ['nav', 'blog', 'newsletter', 'footer'] },
    { id: 'contact', name: 'Contact', ic: 'mail', s: ['nav', 'contact', 'faq', 'footer'] },
    { id: 'notfound', name: '404 page', ic: 'alert', s: ['nav', 'notfound', 'footer'] }
  ];
  var LIBRARY = ['nav', 'hero', 'logos', 'features', 'stats', 'testimonials', 'pricing', 'faq', 'cta', 'newsletter', 'contact', 'blog', 'notfound', 'footer'];

  /* ---------------- CSS ---------------- */
  var CSS = [
    '*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--tx);font:400 var(--fs)/1.65 var(--fb),system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden;transition:background .3s,color .3s}',
    'a{color:inherit;text-decoration:none}h1,h2,h3,h4,p,figure,blockquote{margin:0}button,input,select,textarea{font:inherit;color:inherit}button{cursor:pointer;background:none;border:0}',
    'h1,h2,h3,h4,.logo,.huge,.giant,.n404,.stat b,.pr b{font-family:var(--fh),var(--fb),serif;letter-spacing:var(--ls);line-height:1.08;font-weight:700}',
    'h1{font-size:clamp(34px,5.4vw,64px)}h2{font-size:clamp(28px,3.6vw,44px)}h3{font-size:19px;letter-spacing:-.01em}',
    '.i{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none}',
    '.st{width:15px;height:15px;fill:#f5b53d}',
    '.wrap{max-width:1180px;margin:0 auto;padding:0 24px}.narrow{max-width:760px}.wrap.narrow{max-width:760px}.center{text-align:center}.center-h{text-align:center}',
    '.s{padding:calc(96px*var(--sp)) 0}.s.sm{padding:calc(48px*var(--sp)) 0}',
    '.card{background:var(--sf);border:var(--bw) solid var(--ln);border-radius:var(--r);box-shadow:var(--sh)}',
    '.lead{font-size:calc(var(--fs)*1.15);color:var(--mt);max-width:640px}.center .lead,.shead .lead{margin-left:auto;margin-right:auto}',
    '.eyebrow{display:inline-flex;align-items:center;gap:8px;height:32px;padding:0 14px;border-radius:999px;background:color-mix(in srgb,var(--p) 11%,transparent);color:var(--p);font-size:13px;font-weight:600;margin-bottom:18px}.eyebrow i{width:7px;height:7px;border-radius:50%;background:var(--p);box-shadow:0 0 0 4px color-mix(in srgb,var(--p) 25%,transparent)}',
    '.kick{font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--mt);margin-bottom:18px}',
    '.shead{margin-bottom:calc(48px*var(--sp))}.shead h2{margin-bottom:12px}',
    '.btns{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}.btns.jc{justify-content:center}',
    '.grid2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:56px;align-items:center}',
    '.g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.g4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}',
    '.ticks{list-style:none;padding:0;margin:18px 0 0;display:grid;gap:10px}.ticks li{display:flex;gap:10px;align-items:flex-start;color:var(--mt)}.ticks .i{color:var(--p);margin-top:3px}',
    '.logo{display:inline-flex;align-items:center;gap:10px;font-size:20px;font-weight:700}.mark{width:32px;height:32px;flex:none}',
    '.av{display:inline-grid;place-items:center;width:36px;height:36px;border-radius:50%;color:#fff;font:700 13px var(--fb);border:2px solid var(--bg);flex:none}',
    '.lnk{display:inline-flex;align-items:center;gap:6px;font-weight:600;color:var(--p)}',
    /* buttons */
    '.btn{--h:calc(46px*var(--bs));display:inline-flex;align-items:center;justify-content:center;gap:8px;height:var(--h);padding:0 calc(22px*var(--bs));border-radius:var(--br);font:600 calc(15px*var(--bs))/1 var(--fb);border:var(--bw) solid transparent;position:relative;overflow:hidden;white-space:nowrap;isolation:isolate;transition:transform .25s cubic-bezier(.2,.8,.2,1),box-shadow .25s,background .25s,color .25s,filter .25s}',
    '.btn .i{width:17px;height:17px;transition:transform .3s}.btn:hover .i{transform:translateX(3px)}.btn.full{width:100%}',
    '.btn.pri{background:var(--p);color:var(--on)}.btn.sec{background:transparent;color:var(--tx);border-color:var(--ln2)}.btn.sec:hover{background:color-mix(in srgb,var(--tx) 6%,transparent)}',
    '[data-btn=outline] .btn.pri{background:transparent;color:var(--p);border:max(2px,var(--bw)) solid var(--p)}[data-btn=outline] .btn.pri:hover{background:var(--p);color:var(--on)}',
    '[data-btn=soft] .btn.pri{background:color-mix(in srgb,var(--p) 15%,transparent);color:var(--p)}[data-btn=soft] .btn.pri:hover{background:color-mix(in srgb,var(--p) 24%,transparent)}',
    '[data-btn=gradient] .btn.pri{background:linear-gradient(135deg,var(--p),var(--a));color:#fff;background-size:160% 160%;background-position:0 0;transition:background-position .5s,transform .25s,box-shadow .25s}[data-btn=gradient] .btn.pri:hover{background-position:100% 100%}',
    '[data-btn=glass] .btn.pri{background:color-mix(in srgb,var(--p) 20%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid color-mix(in srgb,var(--p) 45%,transparent);color:var(--tx)}[data-btn=glass] .btn.sec{backdrop-filter:blur(12px);background:color-mix(in srgb,var(--bg) 40%,transparent)}',
    '[data-btn=brutal] .btn{border:2px solid var(--tx);box-shadow:4px 4px 0 var(--tx)}[data-btn=brutal] .btn.pri{color:var(--on)}[data-btn=brutal] .btn:hover{transform:translate(2px,2px)!important;box-shadow:2px 2px 0 var(--tx)!important}[data-btn=brutal] .btn:active{transform:translate(4px,4px)!important;box-shadow:0 0 0 var(--tx)!important}',
    '[data-btn="3d"] .btn.pri{box-shadow:0 5px 0 color-mix(in srgb,var(--p) 55%,#000),0 8px 16px -6px color-mix(in srgb,var(--p) 60%,transparent);margin-bottom:5px}[data-btn="3d"] .btn.sec{box-shadow:0 5px 0 var(--ln2);margin-bottom:5px;background:var(--sf)}[data-btn="3d"] .btn:active{transform:translateY(5px)!important;box-shadow:0 0 0 transparent!important}',
    '[data-btn=neon] .btn.pri{background:transparent;color:var(--p);border:2px solid var(--p);box-shadow:0 0 16px color-mix(in srgb,var(--p) 50%,transparent),inset 0 0 12px color-mix(in srgb,var(--p) 30%,transparent);text-shadow:0 0 10px color-mix(in srgb,var(--p) 60%,transparent)}[data-btn=neon] .btn.pri:hover{background:var(--p);color:var(--on);box-shadow:0 0 34px var(--p)}',
    '[data-hover=lift] .btn:hover{transform:translateY(-2px)}[data-hover=lift] .btn.pri:hover{box-shadow:0 12px 26px -10px color-mix(in srgb,var(--p) 70%,transparent)}',
    '[data-hover=glow] .btn.pri:hover{box-shadow:0 0 0 4px color-mix(in srgb,var(--p) 22%,transparent),0 0 32px color-mix(in srgb,var(--p) 55%,transparent)}',
    '[data-hover=shine] .btn::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.45) 50%,transparent 70%);transform:translateX(-120%);transition:transform .75s}[data-hover=shine] .btn:hover::after{transform:translateX(120%)}',
    '[data-hover=press] .btn:hover{filter:brightness(1.08)}[data-hover=press] .btn:active{transform:scale(.94)}',
    /* nav */
    '.nav{position:relative;z-index:10;border-bottom:var(--bw) solid var(--ln)}.nav .bar{display:flex;align-items:center;gap:28px;height:72px}',
    '.nav .links{display:flex;gap:26px;margin-left:12px;font-weight:500;color:var(--mt)}.nav .links a:hover{color:var(--tx)}',
    '.nav .acts{display:flex;align-items:center;gap:18px;margin-left:auto}.nav .acts .lnk{color:var(--tx)}',
    '.burger{display:none;align-items:center;gap:8px;height:42px;padding:0 12px;border-radius:var(--br);border:var(--bw) solid var(--ln2);font-weight:600}.burger.on{display:inline-flex}',
    '.mnav{display:none;flex-direction:column;padding:8px 24px 18px;border-top:1px solid var(--ln)}.mnav a{padding:12px 0;border-bottom:1px solid var(--ln);font-weight:500}.nav.open .mnav{display:flex}',
    '.nav-c .bar{display:grid;grid-template-columns:1fr auto 1fr}.nav-c .links{margin:0}.nav-c .logo{justify-self:center}',
    '.nav-p{border:0;padding-top:16px}.nav-p .bar.pill{height:62px;padding:0 10px 0 20px;border-radius:calc(var(--r) + 8px);background:color-mix(in srgb,var(--sf) 85%,transparent);border:var(--bw) solid var(--ln);box-shadow:var(--sh);backdrop-filter:blur(10px)}',
    '.nav-m{border:0}.nav-m .acts{gap:10px}',
    '.ann{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;padding:10px 16px;background:var(--p);color:var(--on);font-size:14px;text-align:center}.ann b{padding:2px 8px;border-radius:999px;background:color-mix(in srgb,var(--on) 18%,transparent);font-size:12px}.ann a{display:inline-flex;align-items:center;gap:4px;font-weight:600;text-decoration:underline;text-underline-offset:3px}.ann .i{width:14px}',
    /* hero */
    '.hero h1{margin-bottom:20px}.hero-c h1,.hero-g h1,.hero-s h1{max-width:900px;margin-left:auto;margin-right:auto}',
    '.proof{display:flex;align-items:center;gap:14px;margin-top:30px;font-size:14px;color:var(--mt)}.center .proof{justify-content:center}.proof b{display:flex;margin-bottom:2px}.proof span{display:grid}.avs{display:flex}.avs .av{margin-left:-10px}.avs .av:first-child{margin:0}',
    '.mock{position:relative;overflow:visible;padding:0;animation:up 1s cubic-bezier(.2,.8,.2,1) both}.mock-top{display:flex;align-items:center;gap:6px;height:38px;padding:0 14px;border-bottom:1px solid var(--ln)}.mock-top i{width:10px;height:10px;border-radius:50%;background:var(--ln2)}.mock-top span{margin-left:12px;font-size:12px;color:var(--mt)}',
    '.mock-b{display:flex;min-height:300px}.mock-b aside{display:grid;align-content:start;gap:6px;padding:14px 10px;border-right:1px solid var(--ln)}.mock-b aside span{display:grid;place-items:center;width:36px;height:36px;border-radius:10px;color:var(--mt)}.mock-b aside span.on{background:color-mix(in srgb,var(--p) 14%,transparent);color:var(--p)}',
    '.mock-main{flex:1;padding:18px;display:flex;flex-direction:column;gap:16px;min-width:0}.kp{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.kp div{padding:12px;border-radius:calc(var(--r)*.6);background:var(--bg);border:1px solid var(--ln)}.kp small{display:block;font-size:11px;color:var(--mt)}.kp b{font-size:18px}.kp em{display:block;font-style:normal;font-size:11px;font-weight:600;color:#16a34a}.kp em.dn{color:#dc2626}',
    '.bars{flex:1;display:flex;align-items:flex-end;gap:6px;min-height:120px}.bars i{flex:1;border-radius:6px 6px 2px 2px;background:linear-gradient(var(--p),color-mix(in srgb,var(--p) 50%,var(--a)));transform-origin:bottom;animation:grow 1s cubic-bezier(.2,.8,.2,1) both}',
    '@keyframes grow{from{transform:scaleY(0)}}@keyframes up{from{opacity:0;transform:translateY(30px)}}',
    '.float{position:absolute;display:flex;align-items:center;gap:10px;padding:10px 14px;font-size:13px;animation:bob 5s ease-in-out infinite}.float b{display:block}.float small{color:var(--mt)}.float .i{color:var(--p)}.f1{left:-28px;bottom:36px}.f2{right:-18px;top:-18px;animation-delay:-2s;font-weight:600}.dot{width:9px;height:9px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.2)}',
    '@keyframes bob{50%{transform:translateY(-8px)}}',
    '.huge{font-size:clamp(46px,9vw,128px);line-height:.95;max-width:1100px}.ed-row{display:flex;justify-content:space-between;align-items:flex-end;gap:30px;margin:26px 0 40px}.ed-row .btns{margin:0}',
    '.ed-img,.bimg{position:relative;height:360px;border-radius:var(--r);overflow:hidden;background:linear-gradient(135deg,color-mix(in srgb,var(--p) 85%,#000),var(--a))}.ed-art{position:absolute;inset:0}.ed-art i{position:absolute;border-radius:50%;filter:blur(2px)}.ed-art i:nth-child(1){width:320px;height:320px;left:8%;top:18%;background:color-mix(in srgb,var(--a) 70%,#fff);opacity:.55;animation:bob 8s ease-in-out infinite}.ed-art i:nth-child(2){width:200px;height:200px;right:14%;top:-10%;background:#fff;opacity:.18;animation:bob 6s ease-in-out infinite reverse}.ed-art i:nth-child(3){width:140px;height:140px;right:30%;bottom:-20px;background:var(--p);opacity:.6}',
    '.tagc{position:absolute;left:24px;bottom:24px;display:flex;align-items:center;gap:8px;padding:10px 14px;font-weight:600;font-size:14px}.tagc .i{color:var(--p)}',
    '.hero-g{position:relative;overflow:hidden}.mesh{position:absolute;inset:0;background:radial-gradient(50% 60% at 20% 20%,color-mix(in srgb,var(--p) 40%,transparent),transparent 70%),radial-gradient(40% 50% at 85% 30%,color-mix(in srgb,var(--a) 40%,transparent),transparent 70%),radial-gradient(50% 50% at 50% 100%,color-mix(in srgb,var(--p) 25%,transparent),transparent 70%);animation:drift 14s ease-in-out infinite alternate}.hero-g .wrap{position:relative}',
    '@keyframes drift{to{transform:scale(1.15) translate(2%,3%)}}',
    '.stats3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;max-width:720px;margin:44px auto 0}.glass{background:color-mix(in srgb,var(--sf) 55%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}.stats3 .card{padding:18px}.stats3 b{display:block;font:700 28px var(--fh)}.stats3 span{font-size:13px;color:var(--mt)}',
    '.sbar{display:flex;align-items:center;gap:12px;max-width:620px;margin:30px auto 0;padding:8px 8px 8px 18px;border-radius:calc(var(--br) + 4px)}.sbar input{flex:1;min-width:0;border:0;outline:0;background:none;font-size:16px}.sbar .i{color:var(--mt)}',
    '.tags{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:18px;font-size:14px;color:var(--mt);align-items:center}.tags a{padding:5px 12px;border-radius:999px;border:1px solid var(--ln2);color:var(--tx);transition:.2s}.tags a:hover{border-color:var(--p);color:var(--p)}',
    /* logos */
    '.lstrip{display:flex;flex-wrap:wrap;justify-content:center;gap:24px 56px;opacity:.6}.wm{font-family:var(--fh),sans-serif;font-size:24px;letter-spacing:-.02em}.lgrid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px}.lgrid .card{display:grid;place-items:center;height:84px;color:var(--mt)}',
    /* features */
    '.fic{display:inline-grid;place-items:center;width:46px;height:46px;border-radius:calc(var(--r)*.7);background:color-mix(in srgb,var(--p) 12%,transparent);color:var(--p);margin-bottom:16px}.fic .i{width:22px;height:22px}',
    '.fc{padding:26px;transition:transform .35s,box-shadow .35s}.fc:hover{transform:translateY(-4px)}.fc p{margin-top:8px;color:var(--mt)}',
    '.frow{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:56px;align-items:center;margin-bottom:calc(72px*var(--sp))}.frow.rev>div:first-child{order:2}.frow h3{font-size:26px;margin-bottom:10px}.frow p{color:var(--mt)}',
    '.vis{height:300px;padding:26px;overflow:hidden}.vis-in{height:100%;display:grid;gap:10px}.v0{grid-template-columns:repeat(2,1fr)}.v0 b{border-radius:calc(var(--r)*.6);background:color-mix(in srgb,var(--p) 12%,var(--bg))}.v0 b:nth-child(2){background:var(--p)}.v1{align-content:center}.v1 span{height:44px;border-radius:999px;background:var(--bg);border:1px solid var(--ln);position:relative}.v1 span::after{content:"";position:absolute;left:6px;top:6px;bottom:6px;width:60%;border-radius:999px;background:linear-gradient(90deg,var(--p),var(--a))}.v1 span:nth-child(2)::after{width:82%}.v1 span:nth-child(3)::after{width:40%}.v2{grid-template-columns:repeat(3,1fr)}.v2 i{border-radius:50%;aspect-ratio:1;background:color-mix(in srgb,var(--a) 30%,var(--bg));align-self:center}.v2 i:nth-child(odd){background:color-mix(in srgb,var(--p) 30%,var(--bg))}',
    '.bento{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:minmax(200px,auto);gap:16px}.bento .card{padding:26px;position:relative;overflow:hidden}.bento p{color:var(--mt);margin-top:6px}.b1{grid-column:span 2}.b4{grid-column:span 1}.b5{grid-column:span 2}.inv{background:var(--p);color:var(--on)}.inv p{color:inherit;opacity:.85}.inv .fic{background:color-mix(in srgb,var(--on) 18%,transparent);color:inherit}.big{font:800 54px var(--fh)!important;opacity:1!important;margin-top:10px!important}.spark{margin-top:18px;height:70px}.spark svg{width:100%;height:100%}.bento .avs{margin-top:16px}.bento .avs .av{width:42px;height:42px}',
    '.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.chips span{padding:6px 12px;border-radius:999px;background:var(--bg);border:1px solid var(--ln);font-size:13px;font-weight:500}',
    /* stats */
    '.stat{text-align:center}.stat b{display:block;font-size:clamp(34px,4vw,52px);color:var(--p)}.stat span{color:var(--mt)}.band{background:var(--p);color:var(--on)}.band .stat b{color:inherit}.band .stat span{color:inherit;opacity:.8}',
    /* testimonials */
    '.tq{padding:26px;display:flex;flex-direction:column;gap:16px}.stars{display:flex;gap:2px}.center .stars{justify-content:center}.tq blockquote{font-size:16.5px;flex:1}.tq figcaption,.who,.aq figcaption{display:flex;align-items:center;gap:12px}.tq figcaption span,.who span,.aq figcaption span{display:grid;text-align:left}.tq small,.who small,.aq small{color:var(--mt);font-size:13px}',
    '.tbig blockquote{font:600 clamp(24px,3vw,38px)/1.3 var(--fh);letter-spacing:var(--ls);max-width:900px;margin:22px auto 30px}.who{justify-content:center}',
    '.mq{overflow:hidden;mask:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent);-webkit-mask:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)}.mq-in{display:flex;gap:18px;width:max-content;animation:mq 40s linear infinite}.mq-in .tq{width:360px}.mq:hover .mq-in{animation-play-state:paused}@keyframes mq{to{transform:translateX(-50%)}}',
    /* pricing */
    '.tgl{display:inline-flex;gap:4px;padding:4px;border-radius:999px;background:var(--sf);border:1px solid var(--ln);margin-top:22px}.tgl button{height:38px;padding:0 18px;border-radius:999px;font-weight:600;font-size:14px;color:var(--mt);transition:.25s}.tgl button.on{background:var(--tx);color:var(--bg)}.tgl em{font-style:normal;color:var(--p);margin-left:4px}.tgl.sm{margin:0}.tgl.sm button{height:30px;padding:0 12px;font-size:12.5px}',
    '.plans{align-items:stretch}.plan{padding:30px;display:flex;flex-direction:column;position:relative}.plan>p{color:var(--mt);margin:8px 0 18px;min-height:52px}.plan .pr{display:flex;align-items:baseline;gap:6px;margin-bottom:22px}.pr b{font-size:48px}.pr small{color:var(--mt)}.plan .ticks{margin-top:24px}',
    '.plan.pop{border:2px solid var(--p);transform:scale(1.03);box-shadow:0 30px 60px -30px color-mix(in srgb,var(--p) 60%,transparent)}.badge{position:absolute;top:-13px;left:50%;transform:translateX(-50%);padding:4px 14px;border-radius:999px;background:var(--p);color:var(--on);font-size:12px;font-weight:700;white-space:nowrap}',
    '.tblw{overflow-x:auto;padding:0}.cmp{width:100%;border-collapse:collapse;min-width:640px}.cmp th,.cmp td{padding:16px 20px;text-align:left;border-bottom:1px solid var(--ln)}.cmp th{vertical-align:top}.cmp th b{display:block;font-size:18px}.cmp th .pr{display:block;margin:6px 0 12px;font:700 30px var(--fh)}.cmp th .pr small{font:400 14px var(--fb)}.cmp .hl{background:color-mix(in srgb,var(--p) 7%,transparent)}.cmp td:first-child{font-weight:600}.cmp .ok{color:var(--p)}.no{color:var(--mt)}.cmp tr:last-child td{border:0}.cmp .btn{width:100%}',
    /* faq */
    '.acc{padding:0;margin-bottom:12px;overflow:hidden}.acc summary{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:18px 22px;font-weight:600;font-size:17px;cursor:pointer;list-style:none}.acc summary::-webkit-details-marker{display:none}.acc summary .i{transition:transform .3s;color:var(--p)}.acc[open] summary .i{transform:rotate(45deg)}.acc p{padding:0 22px 20px;color:var(--mt)}',
    '.faq2 .grid2{align-items:start}.faq2 .lead{margin:14px 0 22px}.qa{display:grid;gap:26px}.qa h3{margin-bottom:6px}.qa p{color:var(--mt)}',
    /* cta */
    '.banner{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:space-between;gap:30px;padding:clamp(28px,5vw,56px);border-radius:calc(var(--r) + 8px);background:linear-gradient(135deg,var(--p),color-mix(in srgb,var(--p) 60%,var(--a)));color:var(--on)}.banner>div{position:relative;z-index:1}.banner p{opacity:.85;margin-top:10px}.banner .btns{margin:0;flex:none}.banner .btn.pri{background:var(--on);color:var(--p);border-color:transparent;box-shadow:none;text-shadow:none}.banner .btn.sec{color:var(--on);border-color:color-mix(in srgb,var(--on) 40%,transparent)}',
    '.ring{position:absolute;border-radius:50%;border:2px solid color-mix(in srgb,var(--on) 20%,transparent)}.r1{width:300px;height:300px;right:-80px;top:-120px}.r2{width:200px;height:200px;right:120px;bottom:-140px}',
    '.ctab{padding:clamp(24px,4vw,48px);gap:30px}.nl{display:flex;gap:10px}.nl input{flex:1;min-width:0;height:calc(46px*var(--bs));padding:0 16px;border-radius:var(--br);border:var(--bw) solid var(--ln2);background:var(--bg);outline:0}.nl input:focus{border-color:var(--p);box-shadow:0 0 0 3px color-mix(in srgb,var(--p) 20%,transparent)}',
    '.cta3 h2{font-size:clamp(34px,5vw,60px);margin-bottom:12px}',
    /* footer */
    '.foot{border-top:var(--bw) solid var(--ln);padding:56px 0 28px;color:var(--mt)}.foot .bar{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}.foot .bar.small{margin-top:40px;padding-top:22px;border-top:1px solid var(--ln);font-size:14px}.foot .links{display:flex;gap:22px;flex-wrap:wrap}.foot a:hover{color:var(--tx)}.foot .logo{color:var(--tx)}',
    '.f1{padding:28px 0}.fgrid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:30px}.fgrid p{margin:14px 0 18px;max-width:300px}.fgrid h4{font-size:14px;color:var(--tx);margin-bottom:14px;font-family:var(--fb);letter-spacing:0}.fgrid a{display:block;padding:4px 0}',
    '.soc{display:flex;gap:8px}.soc a{display:grid;place-items:center;width:38px;height:38px;border-radius:calc(var(--r)*.6);border:1px solid var(--ln2)}',
    '.giant{font-size:clamp(64px,17vw,240px);line-height:.85;font-weight:800;color:var(--tx);margin:30px 0 0;letter-spacing:-.05em;white-space:nowrap;overflow:hidden}',
    /* auth */
    '.auth{min-height:100vh;display:flex}.auth.ctr{align-items:center;justify-content:center;padding:40px 18px;background:radial-gradient(60% 50% at 50% 0,color-mix(in srgb,var(--p) 12%,transparent),transparent 70%)}',
    '.authc{width:100%;max-width:440px;padding:clamp(24px,4vw,40px)}.authc.wide{max-width:520px}.authf{display:grid;gap:16px}.authf .logo{margin-bottom:10px}.authf h1{font-size:30px}.authf .lead{font-size:15.5px;margin-top:-8px}',
    '.authf label{display:grid;gap:7px;font-size:14px;font-weight:600}.authf input:not([type=checkbox]):not([type=radio]),.authf select,.cf input,.cf select,.cf textarea{width:100%;height:46px;padding:0 14px;border-radius:min(var(--br),14px);border:var(--bw) solid var(--ln2);background:var(--bg);outline:0;font-weight:400;transition:border-color .2s,box-shadow .2s}.cf textarea{height:auto;padding:12px 14px;resize:vertical}',
    '.authf input:focus,.authf select:focus,.cf input:focus,.cf select:focus,.cf textarea:focus{border-color:var(--p);box-shadow:0 0 0 3px color-mix(in srgb,var(--p) 20%,transparent)}',
    '.lr{display:flex;justify-content:space-between}.lr a,.alt a,.chk a{color:var(--p);font-weight:600}.alt{text-align:center;font-size:14px;color:var(--mt)}',
    '.pw{position:relative;display:block}.pw button{position:absolute;right:8px;top:50%;transform:translateY(-50%);display:grid;place-items:center;width:32px;height:32px;color:var(--mt);border-radius:8px}.pw button:hover{color:var(--tx)}',
    '.chk{display:flex!important;flex-direction:row;align-items:center;gap:10px!important;font-weight:400!important;color:var(--mt)}.chk input{width:18px;height:18px;accent-color:var(--p)}',
    '.socb{display:grid;grid-template-columns:1fr 1fr;gap:10px}.gl{display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:conic-gradient(#ea4335 0 25%,#fbbc05 0 50%,#34a853 0 75%,#4285f4 0);color:#fff;font:800 11px var(--fb)}',
    '.or{display:flex;align-items:center;gap:12px;color:var(--mt);font-size:13px}.or::before,.or::after{content:"";flex:1;height:1px;background:var(--ln)}',
    '.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
    '.meter{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:-6px}.meter i{height:5px;border-radius:9px;background:var(--ln);transition:background .3s}.meter span{grid-column:1/-1;font-size:12.5px;color:var(--mt)}.meter[data-l="1"] i:nth-child(-n+1){background:#ef4444}.meter[data-l="2"] i:nth-child(-n+2){background:#f59e0b}.meter[data-l="3"] i:nth-child(-n+3){background:#84cc16}.meter[data-l="4"] i{background:#16a34a}',
    '.split{align-items:stretch}.split>*{flex:1;min-width:0}.split.rev{flex-direction:row-reverse}.authw{display:flex;align-items:center;justify-content:center;padding:40px 24px}.authw .authf{width:100%;max-width:400px}',
    '.art{position:relative;overflow:hidden;background:linear-gradient(160deg,var(--p),color-mix(in srgb,var(--p) 55%,#000));color:#fff;display:flex}.art .logo{color:#fff}.art .mark rect{fill:#fff}.art .mark path{stroke:var(--p)}.art-in{position:relative;z-index:1;display:flex;flex-direction:column;justify-content:space-between;padding:40px;width:100%}',
    '.blob{position:absolute;border-radius:50%;filter:blur(40px);opacity:.7;animation:bob 9s ease-in-out infinite}.blob.b1{width:340px;height:340px;background:var(--a);right:-80px;top:-60px}.blob.b2{width:260px;height:260px;background:color-mix(in srgb,var(--p) 50%,#fff);left:-60px;bottom:10%;animation-delay:-4s}',
    '.aq{padding:24px;color:#fff;background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.22)}.aq blockquote{font-size:18px;margin-bottom:18px}.aq small{color:rgba(255,255,255,.75)!important}',
    '.bleed{position:relative;align-items:center;justify-content:center;padding:40px 18px;overflow:hidden}.bleed .authc{position:relative}',
    '.okmsg{display:none;align-items:center;gap:10px;padding:12px 14px;border-radius:calc(var(--r)*.6);background:color-mix(in srgb,#16a34a 14%,transparent);color:#15803d;font-weight:600;font-size:14px}.okmsg .i{color:#16a34a}.done .okmsg,.done+.okmsg{display:flex}',
    '.prog{height:6px;border-radius:9px;background:var(--ln);overflow:hidden}.prog i{display:block;height:100%;width:33.3%;background:var(--p);border-radius:9px;transition:width .5s cubic-bezier(.2,.8,.2,1)}.stp{display:none;gap:16px}.stp.on{display:grid;animation:up .5s cubic-bezier(.2,.8,.2,1)}.snav{display:flex;justify-content:space-between;gap:10px}.snav [data-back]{visibility:hidden}',
    '.picks{display:grid;grid-template-columns:1fr 1fr;gap:8px}.picks label{display:flex!important;align-items:center;gap:8px;padding:12px;border-radius:min(var(--br),14px);border:var(--bw) solid var(--ln2);font-weight:500!important;cursor:pointer}.picks input{accent-color:var(--p)}',
    '.plans2{display:grid;gap:10px}.plans2 label{display:flex!important;flex-direction:row;align-items:center;gap:12px!important;padding:14px;cursor:pointer}.plans2 span{flex:1;display:grid}.plans2 small{color:var(--mt);font-weight:400}.plans2 em{font-style:normal;font:700 20px var(--fh)}.plans2 input{accent-color:var(--p);width:18px;height:18px}.plans2 label:has(input:checked){border-color:var(--p);box-shadow:0 0 0 3px color-mix(in srgb,var(--p) 18%,transparent)}',
    /* dashboard */
    '.dash{display:grid;grid-template-columns:250px minmax(0,1fr);min-height:100vh;background:var(--bg)}.dside{position:sticky;top:0;height:100vh;display:flex;flex-direction:column;gap:22px;padding:22px 16px;border-right:var(--bw) solid var(--ln);background:var(--sf)}',
    '.dside nav,.dhead nav{display:grid;gap:4px}.dside nav a,.dhead nav a{display:flex;align-items:center;gap:12px;height:42px;padding:0 12px;border-radius:min(var(--br),12px);color:var(--mt);font-weight:500;transition:.2s}.dside nav a:hover,.dhead nav a:hover{color:var(--tx);background:color-mix(in srgb,var(--tx) 5%,transparent)}.dside nav a.on,.dhead nav a.on{background:color-mix(in srgb,var(--p) 13%,transparent);color:var(--p)}',
    '.up{margin-top:auto;padding:16px;display:grid;gap:6px}.up small{color:var(--mt)}.up .btn{margin-top:6px}',
    '.rail{grid-template-columns:76px minmax(0,1fr)}.rail .dside{align-items:center;padding:18px 10px}.rail .logo span,.rail nav a span,.rail .up{display:none}.rail nav a{justify-content:center;width:48px;padding:0}',
    '.dtopbar{display:block}.dhead{border-bottom:var(--bw) solid var(--ln);background:var(--sf)}.dhead .bar{display:flex;align-items:center;gap:24px;height:66px;max-width:none}.dhead nav{display:flex;margin-right:auto}.dtopbar .dmain{max-width:1240px;margin:0 auto}',
    '.dmain{padding:28px;display:grid;gap:18px;align-content:start;min-width:0}.dtop{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}.dtop h1{font-size:26px}.dtop p{color:var(--mt)}.dact{display:flex;gap:10px;align-items:center}',
    '.dsr{display:flex;align-items:center;gap:8px;height:42px;padding:0 12px;border-radius:min(var(--br),12px)}.dsr input{border:0;outline:0;background:none;width:140px}.dsr .i{color:var(--mt)}.ibt{position:relative;display:grid;place-items:center;width:42px;height:42px;border-radius:min(var(--br),12px)}.ibt i{position:absolute;top:10px;right:11px;width:8px;height:8px;border-radius:50%;background:#ef4444}',
    '.kpi{padding:18px}.kpi small{color:var(--mt)}.kpi b{display:block;font:700 26px var(--fh);margin:6px 0 4px}.kpi em{font-style:normal;font-size:12.5px;font-weight:700;padding:2px 8px;border-radius:999px;background:rgba(22,163,74,.12);color:#15803d}.kpi em.dn{background:rgba(220,38,38,.1);color:#dc2626}',
    '.drow{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:18px}.dchart{padding:20px}.dchart svg{width:100%;height:220px;display:block;margin-top:10px}.dh{display:flex;justify-content:space-between;align-items:center;gap:10px}',
    '.dact2{padding:20px}.dact2 h3{margin-bottom:10px}.ai{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--ln)}.ai:last-child{border:0}.ai p{flex:1;font-size:14px;color:var(--mt)}.ai b{color:var(--tx)}.ai small{color:var(--mt);font-size:12px}',
    '.dtbl{padding:20px;overflow-x:auto}.dtbl table{width:100%;border-collapse:collapse;margin-top:12px;min-width:480px}.dtbl th{text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--mt);padding:10px 8px;border-bottom:1px solid var(--ln)}.dtbl td{padding:12px 8px;border-bottom:1px solid var(--ln)}.dtbl tr:last-child td{border:0}',
    '.pill{padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700}.pill.g{background:rgba(22,163,74,.12);color:#15803d}.pill.b{background:rgba(37,99,235,.12);color:#1d4ed8}.pill.r{background:rgba(220,38,38,.1);color:#dc2626}',
    /* blog */
    '.blog h1{font-size:clamp(32px,4.6vw,54px);margin:18px 0 22px}.bc .tags,.bw .tags{justify-content:flex-start}.center-h .tags{justify-content:center}.bmeta{display:inline-flex;align-items:center;gap:12px;text-align:left}.bmeta span{display:grid}.bmeta small{color:var(--mt)}.bimg{margin:36px 0 10px;height:340px}',
    '.prose{margin-top:34px;font-size:calc(var(--fs)*1.08)}.prose>*+*{margin-top:18px}.prose h2{font-size:28px;margin-top:40px}.prose p{color:color-mix(in srgb,var(--tx) 82%,var(--bg))}.prose blockquote{padding:6px 0 6px 22px;border-left:4px solid var(--p);font:600 22px/1.4 var(--fh);letter-spacing:var(--ls)}.prose pre{padding:18px;border-radius:var(--r);background:#0f0f14;color:#e4e4ec;overflow-x:auto;font:13.5px/1.7 ui-monospace,monospace}',
    '.cover{position:relative;overflow:hidden;min-height:420px;display:flex;align-items:flex-end;border-radius:calc(var(--r) + 6px);background:linear-gradient(135deg,var(--p),color-mix(in srgb,var(--p) 50%,#000));color:#fff;margin-bottom:10px}.cv-in{position:relative;padding:clamp(24px,4vw,48px);max-width:860px}.cover .tags a{border-color:rgba(255,255,255,.35);color:#fff}.cover small{color:rgba(255,255,255,.75)!important}.back{margin-bottom:24px}',
    '.nli{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:24px 0;border-top:1px solid var(--ln);border-bottom:1px solid var(--ln)}.nli p{color:var(--mt)}.nli [data-formw]{flex:1;max-width:380px}.nlc{padding:clamp(24px,4vw,44px)}.nlc .nl{max-width:440px;margin:22px auto 0}.nlc .okmsg{max-width:440px;margin:12px auto 0}.nlc .lead{margin-top:8px}',
    /* contact */
    '.contact .grid2{align-items:start}.contact h1{margin-bottom:14px}.pad{padding:clamp(20px,3vw,32px)}.cf{display:grid;gap:16px}.cf label{display:grid;gap:7px;font-size:14px;font-weight:600}.cf .btn{justify-self:start}',
    '.info{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:32px}.info>div{display:flex;gap:12px;align-items:center}.info .fic{margin:0;flex:none}.info span{display:grid}.info small{color:var(--mt)}',
    '.map{position:relative;min-height:420px;overflow:hidden;padding:0}.map svg{position:absolute;inset:0;width:100%;height:100%}.mpin{position:absolute;left:50%;top:45%;display:grid;place-items:center;width:52px;height:52px;border-radius:50% 50% 50% 0;transform:translate(-50%,-50%) rotate(-45deg);background:var(--p);color:var(--on);box-shadow:0 10px 24px -8px var(--p);animation:pin 2s ease-in-out infinite}.mpin .i{transform:rotate(45deg)}@keyframes pin{50%{margin-top:-8px}}.mcard{position:absolute;left:20px;bottom:20px;padding:14px 18px;display:grid}.mcard small{color:var(--mt)}',
    /* 404 */
    '.nf{min-height:70vh;display:flex;align-items:center}.nf h1{margin:10px 0 14px}.n404{font-size:clamp(110px,22vw,220px);font-weight:800;line-height:1;letter-spacing:-.06em;color:var(--tx)}.n404 span{display:inline-block;color:var(--p);animation:spin 6s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.nf .sbar{margin:28px auto 0}.nfart{width:260px;max-width:70%;margin:0 auto 10px;display:block;animation:bob 5s ease-in-out infinite}.nfm h1{font-size:clamp(40px,6vw,72px)}.nfm .lnk{margin-top:24px}',
    /* responsive */
    '@media(max-width:900px){.nav .links,.nav .acts .lnk,.nav-c .links{display:none}.burger{display:inline-flex}.nav-c .bar{display:flex}.nav-c .logo{margin-right:auto}.grid2,.frow,.drow,.fgrid{grid-template-columns:minmax(0,1fr)}.frow.rev>div:first-child{order:0}.g3,.bento{grid-template-columns:minmax(0,1fr)}.b1,.b5{grid-column:auto}.g4{grid-template-columns:repeat(2,minmax(0,1fr))}.lgrid{grid-template-columns:repeat(3,minmax(0,1fr))}.plan.pop{transform:none}.banner,.ed-row,.nli{flex-direction:column;align-items:flex-start}.split .art{display:none}.dash{grid-template-columns:minmax(0,1fr)}.dside{display:none}.dhead nav{display:none}.f1 .links{display:none}.mock .float{display:none}.mock{margin-top:10px}}',
    '@media(max-width:560px){.s{padding:calc(64px*var(--sp)) 0}.wrap{padding:0 18px}.nav .acts .btn{display:none}.nav-m .acts .btn{display:none}.stats3,.info,.two,.socb,.picks{grid-template-columns:minmax(0,1fr)}.nl{flex-direction:column}.dact .btn,.dsr{display:none}.dmain{padding:18px}.kp{grid-template-columns:1fr 1fr}.kp div:last-child{display:none}.ed-img{height:240px}.mq-in .tq{width:280px}.btns .btn{flex:1}.sbar .btn span{display:none}.sbar .btn{padding:0 14px}}',
    '@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}'
  ].join('\n');

  var JS = "(function(){var d=document;" +
    "d.addEventListener('click',function(e){var t=e.target;" +
    "var a=t.closest('a[href=\"#\"]');if(a&&!d.body.classList.contains('xr-edit'))e.preventDefault();" +
    "var b=t.closest('[data-burger]');if(b){var h=b.closest('.nav');if(h)h.classList.toggle('open')}" +
    "var tg=t.closest('[data-tgl] button');if(tg){var g=tg.parentNode;g.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x===tg)});var y=tg.getAttribute('data-per')==='y';var sc=g.closest('section');if(sc&&tg.hasAttribute('data-per'))sc.querySelectorAll('[data-m]').forEach(function(p){p.textContent=p.getAttribute(y?'data-y':'data-m')})}" +
    "var ey=t.closest('[data-eye]');if(ey){var i=ey.parentNode.querySelector('input');i.type=i.type==='password'?'text':'password'}" +
    "var nx=t.closest('[data-next],[data-back]');if(nx){var f=nx.closest('[data-steps]'),s=[].slice.call(f.querySelectorAll('.stp')),c=s.findIndex(function(x){return x.classList.contains('on')});" +
    "if(nx.hasAttribute('data-next')&&c===s.length-1){f.classList.add('done');return}c=Math.max(0,Math.min(s.length-1,c+(nx.hasAttribute('data-next')?1:-1)));s.forEach(function(x,k){x.classList.toggle('on',k===c)});" +
    "f.querySelector('.prog i').style.width=((c+1)/s.length*100)+'%';f.querySelector('[data-stepl]').textContent='Step '+(c+1)+' of '+s.length;f.querySelector('[data-back]').style.visibility=c?'visible':'hidden';f.querySelector('[data-next] span').textContent=c===s.length-1?'Create account':'Continue'}});" +
    "d.addEventListener('submit',function(e){var f=e.target;if(!f.hasAttribute('data-form'))return;e.preventDefault();if(f.hasAttribute('data-steps'))return;f.classList.add('done');var w=f.closest('[data-formw]');if(w)w.classList.add('done')});" +
    "d.addEventListener('input',function(e){var t=e.target;if(!t.hasAttribute('data-pwm'))return;var m=t.closest('form').querySelector('[data-meter]');if(!m)return;var v=t.value,s=0;if(v.length>=8)s++;if(/[A-Z]/.test(v)&&/[a-z]/.test(v))s++;if(/\\d/.test(v))s++;if(/[^A-Za-z0-9]/.test(v)||v.length>=14)s++;if(!v)s=0;" +
    "m.setAttribute('data-l',s);m.querySelector('span').textContent=['Type a password','Weak','Fair','Good','Strong'][s]})})();";

  /* ---------------- build ---------------- */
  function tokens(S) {
    var t = TONES[S.tone] || TONES.neutral, m = S.mode === 'dark' ? t.D : t.L;
    var bg = (S.bgc && S.bgc[S.mode]) || m.bg, tx = (S.txc && S.txc[S.mode]) || m.tx;
    var sf = m.sf, mt = m.mt, dark = S.mode === 'dark';
    var sh = S.shadow;
    var font = FONTS.filter(function (f) { return f.id === S.font; })[0] || FONTS[0];
    return {
      '--p': S.p, '--a': S.a, '--on': onColor(S.p), '--bg': bg, '--sf': sf, '--tx': tx, '--mt': mt,
      '--ln': dark ? 'rgba(255,255,255,.09)' : 'rgba(0,0,0,.08)', '--ln2': dark ? 'rgba(255,255,255,.16)' : 'rgba(0,0,0,.14)',
      '--r': S.r + 'px', '--br': S.btn.shape === 'pill' ? '999px' : S.btn.shape === 'square' ? Math.min(6, S.r) + 'px' : Math.round(S.r * .75) + 'px',
      '--bs': S.btn.size === 'sm' ? '.86' : S.btn.size === 'lg' ? '1.16' : '1', '--bw': S.bw + 'px', '--sp': String(S.space), '--fs': S.fs + 'px',
      '--sh': sh ? '0 1px 2px rgba(0,0,0,' + (sh * .06).toFixed(3) + '),0 ' + Math.round(8 + sh * 16) + 'px ' + Math.round(20 + sh * 30) + 'px -' + Math.round(10 + sh * 8) + 'px rgba(0,0,0,' + ((dark ? .5 : .16) * sh).toFixed(3) + ')' : 'none',
      '--fh': font.h, '--fb': font.b, '--ls': font.ls
    };
  }
  function varsCSS(S) { var t = tokens(S); return ':root{' + Object.keys(t).map(function (k) { return k + ':' + t[k]; }).join(';') + ';color-scheme:' + (S.mode === 'dark' ? 'dark' : 'light') + '}'; }
  function fontLink(S) { var f = FONTS.filter(function (x) { return x.id === S.font; })[0] || FONTS[0]; return 'https://fonts.googleapis.com/css2?family=' + f.q + '&display=swap'; }

  function body(S, page) {
    ctx = { S: S };
    return page.sections.map(function (s, i) {
      if (!s.on || !SEC[s.k]) return '';
      var def = SEC[s.k], o = {};
      (def.o || []).forEach(function (x) { o[x[0]] = s.o && x[0] in s.o ? s.o[x[0]] : x[2]; });
      var html = def.r(Math.min(s.v || 0, def.v.length - 1), o);
      return '<div class="xr-sec" data-sec="' + i + '" data-name="' + esc(def.name) + '">' + html + '</div>';
    }).join('');
  }

  function build(S, page, opts) {
    opts = opts || {};
    return '<!doctype html><html lang="en" data-btn="' + S.btn.style + '" data-hover="' + S.btn.hover + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>' + esc(S.brand) + ' — ' + esc(page.name) + '</title>' +
      '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link id="xr-font" rel="stylesheet" href="' + fontLink(S) + '">' +
      '<style id="xr-vars">' + varsCSS(S) + '</style><style>' + CSS + '</style>' + (opts.editor ? '<style id="xr-ed">' + opts.editor + '</style>' : '') +
      '</head><body>' + body(S, page) + '<script>' + JS + '<\/script>' + (opts.edjs ? '<script id="xr-edjs">' + opts.edjs + '<\/script>' : '') + '</body></html>';
  }

  window.XRPages = { FONTS: FONTS, PALETTES: PALETTES, TONES: TONES, BTN: BTN, SEC: SEC, PAGES: PAGES, LIBRARY: LIBRARY, build: build, varsCSS: varsCSS, fontLink: fontLink, tokens: tokens, onColor: onColor, contrast: contrast };
})();
