/* =====================================================================
   XIRAIYA — UI Kit component library (data)
   Every component is self-contained: HTML + scoped CSS you can copy.
   ===================================================================== */
(function () {
  'use strict';
  var S = function (d) { return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
  var IC = {
    search: S('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>'),
    heart: S('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
    cart: S('<path d="M3 4h2.2l2.3 11h10.8l2-8H6.3"/><circle cx="9" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/>'),
    user: S('<circle cx="12" cy="8" r="4"/><path d="M4 20.5c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
    bell: S('<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0"/>'),
    home: S('<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>'),
    grid: S('<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>'),
    chart: S('<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>'),
    sliders: S('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
    arrow: S('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    check: S('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    close: S('<path d="M6 6l12 12M18 6L6 18"/>'),
    play: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 5.2v13.6a.8.8 0 0 0 1.2.7l10.6-6.8a.8.8 0 0 0 0-1.4L9.2 4.5A.8.8 0 0 0 8 5.2z"/></svg>',
    plus: S('<path d="M12 5v14M5 12h14"/>'),
    share: S('<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>'),
    down: S('<path d="M6 9l6 6 6-6"/>'),
    zap: S('<path d="M13 2.5L4.5 13.5H12l-1 8 8.5-11H12z"/>'),
    mail: S('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>'),
    info: S('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8h.01"/>'),
    alert: S('<path d="M12 4l9 16H3zM12 10v4.5M12 17.2h.01"/>'),
    shield: S('<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6zM9 12l2.2 2.2L15.5 10"/>'),
    star: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/></svg>',
    shuriken: '<svg viewBox="0 0 24 24" width="52" height="52" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2zM12 10.3a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4z"/></svg>'
  };
  var OTP = ''; for (var i = 1; i <= 6; i++) OTP += '<input maxlength="1" inputmode="numeric" aria-label="Digit ' + i + '">';
  var BUTTON_BG = '#15120f';
  var GLASS_BG = 'radial-gradient(circle at 18% 22%, rgba(224,68,46,.9) 0, transparent 38%), radial-gradient(circle at 86% 78%, rgba(148,131,194,.9) 0, transparent 42%), #15120f';

  window.KIT = [
    /* ================================================================= */
    { cat: 'Foundations', jp: '基', icon: 'palette', items: [
      { id: 'tokens-color', name: 'Color tokens', pad: '30px', note: 'Brand palette. Crimson is the action color, cyan and violet support it, gold for money and warnings.',
        html: '<div class="k-fcol">\n  <div class="sw" style="--c:#e0442e"><b>Crimson</b><span>#e0442e</span></div>\n  <div class="sw" style="--c:#6fb3a8"><b>Cyan</b><span>#6fb3a8</span></div>\n  <div class="sw" style="--c:#9483c2"><b>Violet</b><span>#9483c2</span></div>\n  <div class="sw" style="--c:#d9a441"><b>Gold</b><span>#d9a441</span></div>\n  <div class="sw" style="--c:#df7f73"><b>Pink</b><span>#df7f73</span></div>\n  <div class="sw" style="--c:#a9c46a"><b>Lime</b><span>#a9c46a</span></div>\n  <div class="sw dk" style="--c:#efe4cc"><b>Paper</b><span>#efe4cc</span></div>\n  <div class="sw" style="--c:#0f0d0b"><b>Night</b><span>#0f0d0b</span></div>\n</div>',
        css: `.k-fcol { display: grid; grid-template-columns: repeat(4, 140px); gap: 14px; font-family: 'JetBrains Mono', monospace; }
.k-fcol .sw { height: 116px; padding: 12px; border-radius: 14px; background: var(--c); color: #fff;
  display: flex; flex-direction: column; justify-content: flex-end; box-shadow: inset 0 0 0 1px rgba(255,255,255,.12);
  transition: transform .4s cubic-bezier(.16,1,.3,1); }
.k-fcol .sw:hover { transform: translateY(-6px); }
.k-fcol .sw b { font: 700 13px 'Zen Kaku Gothic New', sans-serif; }
.k-fcol .sw span { font-size: 11px; opacity: .8; }
.k-fcol .sw.dk { color: #0f0d0b; }` },
      { id: 'tokens-type', name: 'Type scale', pad: '40px', note: 'Shippori Mincho for display, Zen Kaku Gothic for reading, JetBrains Mono for data and code.',
        html: '<div class="k-type">\n  <div><span>Display · 900</span><b class="d">Xiraiya</b></div>\n  <div><span>H1 · 800</span><b class="h1">Build legendary</b></div>\n  <div><span>H2 · 800</span><b class="h2">Section title</b></div>\n  <div><span>Body · 400</span><p>The quick brown fox ships the product before the deadline.</p></div>\n  <div><span>Mono · 500</span><code>const autopilot = true;</code></div>\n</div>',
        css: `.k-type { width: 600px; display: grid; gap: 16px; font-family: 'Zen Kaku Gothic New', sans-serif; color: #efe4cc; }
.k-type div { display: grid; grid-template-columns: 120px 1fr; align-items: baseline; gap: 16px;
  padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,.08); }
.k-type span { font: 500 11px 'JetBrains Mono', monospace; color: #857a68; text-transform: uppercase; letter-spacing: .1em; }
.k-type .d { font: 900 62px/1 'Shippori Mincho B1', sans-serif; letter-spacing: -.04em; }
.k-type .h1 { font: 800 38px/1.05 'Shippori Mincho B1', sans-serif; letter-spacing: -.03em; }
.k-type .h2 { font: 800 24px/1.1 'Shippori Mincho B1', sans-serif; }
.k-type p { margin: 0; font-size: 16px; line-height: 1.6; color: #bfb29a; }
.k-type code { font: 500 14px 'JetBrains Mono', monospace; color: #6fb3a8; }` }
    ] },

    /* ================================================================= */
    { cat: 'Headers', jp: '頭', icon: 'frame', items: [
      { id: 'hdr-glass', name: 'Glass header', bg: 'linear-gradient(120deg, #3a0a1a, #1a0f3a 60%, #062a2e)', note: 'Frosted glass with backdrop blur. Active link is a soft pill; CTA carries a colored glow.',
        html: '<header class="k-hglass">\n  <a class="logo"><i></i>NOVA</a>\n  <nav>\n    <a class="on">Product</a><a>Features</a><a>Pricing</a><a>Docs</a>\n  </nav>\n  <div class="act"><a class="ghost">Log in</a><a class="cta">Get started</a></div>\n</header>',
        css: `.k-hglass { width: 980px; display: flex; align-items: center; gap: 32px; padding: 12px 14px 12px 22px;
  border-radius: 18px; background: rgba(255,255,255,.07); backdrop-filter: blur(14px);
  border: 1px solid rgba(255,255,255,.14); font-family: 'Zen Kaku Gothic New', sans-serif; color: #efe4cc; }
.k-hglass .logo { display: flex; align-items: center; gap: 10px; font: 800 18px 'Shippori Mincho B1', sans-serif; letter-spacing: .06em; cursor: pointer; }
.k-hglass .logo i { width: 26px; height: 26px; border-radius: 8px; background: linear-gradient(135deg, #e0442e, #9483c2); }
.k-hglass nav { display: flex; gap: 4px; margin: 0 auto; }
.k-hglass nav a { padding: 8px 14px; border-radius: 999px; font-size: 14px; color: #bfb29a; cursor: pointer; transition: .3s; }
.k-hglass nav a:hover, .k-hglass nav a.on { color: #fff; background: rgba(255,255,255,.1); }
.k-hglass .act { display: flex; align-items: center; gap: 6px; }
.k-hglass .ghost { padding: 10px 14px; font-size: 14px; color: #bfb29a; cursor: pointer; }
.k-hglass .cta { padding: 11px 18px; border-radius: 999px; background: #e0442e; color: #fff; font-weight: 600;
  font-size: 14px; box-shadow: 0 8px 24px -8px #e0442e; cursor: pointer; transition: transform .3s; }
.k-hglass .cta:hover { transform: translateY(-2px); }` },
      { id: 'hdr-split', name: 'Split restaurant header', bg: '#efe6d8', note: 'Centered serif logo with links split left and right. Underlines draw in from the left and leave to the right.',
        html: '<header class="k-hsplit">\n  <nav><a>Menu</a><a>Story</a><a>Visit</a></nav>\n  <a class="logo">SAKURA<small>BISTRO · 桜</small></a>\n  <nav class="r"><a>Gallery</a><a>Contact</a><a class="book">Reserve a table</a></nav>\n</header>',
        css: `.k-hsplit { width: 980px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 18px 28px;
  background: #fbf6ee; color: #1b1b22; font-family: 'Zen Kaku Gothic New', sans-serif; border-radius: 4px; }
.k-hsplit nav { display: flex; gap: 26px; font-size: 14px; }
.k-hsplit nav.r { justify-content: flex-end; align-items: center; }
.k-hsplit nav a { position: relative; cursor: pointer; }
.k-hsplit nav a:not(.book)::after { content: ''; position: absolute; left: 0; right: 0; bottom: -4px; height: 1.5px; background: #b8321f;
  transform: scaleX(0); transform-origin: right; transition: transform .45s cubic-bezier(.16,1,.3,1); }
.k-hsplit nav a:hover::after { transform: scaleX(1); transform-origin: left; }
.k-hsplit .logo { display: grid; justify-items: center; font: 700 24px/1 Georgia, serif; letter-spacing: .3em; cursor: pointer; }
.k-hsplit .logo small { margin-top: 6px; font: 600 10px/1 'Zen Kaku Gothic New', sans-serif; letter-spacing: .3em; color: #b8321f; }
.k-hsplit .book { padding: 10px 18px; border-radius: 999px; background: #1b1b22; color: #fbf6ee; font-weight: 600; }` },
      { id: 'hdr-shop', name: 'E-commerce header', note: 'Announcement strip, search with keyboard hint, icon actions with a cart badge, and a category row.',
        html: '<header class="k-hshop">\n  <div class="top">Free delivery over $100 · 7-day returns · bKash, Nagad &amp; crypto accepted</div>\n  <div class="main">\n    <a class="logo">KAGE<span>.</span></a>\n    <label class="s">' + IC.search + '<input placeholder="Search 2,400+ products"><kbd>/</kbd></label>\n    <div class="ic"><a aria-label="Wishlist">' + IC.heart + '</a><a aria-label="Account">' + IC.user + '</a><a class="cart" aria-label="Cart">' + IC.cart + '<em>3</em></a></div>\n  </div>\n  <nav><a class="on">New in</a><a>Tech</a><a>Apparel</a><a>Decor</a><a>Collectibles</a><a class="sale">Sale -40%</a></nav>\n</header>',
        css: `.k-hshop { width: 980px; overflow: hidden; border-radius: 14px; background: #101018; color: #efe4cc;
  font-family: 'Zen Kaku Gothic New', sans-serif; border: 1px solid rgba(255,255,255,.1); }
.k-hshop .top { padding: 8px; text-align: center; font-size: 12px; background: #e0442e; color: #fff; }
.k-hshop .main { display: flex; align-items: center; gap: 24px; padding: 16px 22px; }
.k-hshop .logo { font: 800 22px 'Shippori Mincho B1', sans-serif; cursor: pointer; }
.k-hshop .logo span { color: #e0442e; }
.k-hshop .s { flex: 1; display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 14px; border-radius: 12px;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); color: #857a68; }
.k-hshop .s:focus-within { border-color: #e0442e; }
.k-hshop .s input { flex: 1; background: none; border: 0; outline: none; color: #fff; font: inherit; font-size: 14px; }
.k-hshop kbd { font: 500 11px 'JetBrains Mono', monospace; padding: 3px 7px; border-radius: 5px; border: 1px solid rgba(255,255,255,.2); }
.k-hshop .ic { display: flex; gap: 4px; }
.k-hshop .ic a { position: relative; width: 42px; height: 42px; display: grid; place-items: center; border-radius: 12px; cursor: pointer; transition: .3s; }
.k-hshop .ic a:hover { background: rgba(255,255,255,.08); }
.k-hshop .cart em { position: absolute; top: 4px; right: 3px; width: 17px; height: 17px; border-radius: 50%; display: grid; place-items: center;
  font: 700 10px 'JetBrains Mono', monospace; font-style: normal; background: #e0442e; color: #fff; }
.k-hshop nav { display: flex; gap: 4px; padding: 0 16px 12px; }
.k-hshop nav a { padding: 8px 12px; border-radius: 8px; font-size: 13.5px; color: #bfb29a; cursor: pointer; }
.k-hshop nav a:hover, .k-hshop nav .on { color: #fff; background: rgba(255,255,255,.07); }
.k-hshop nav .sale { margin-left: auto; color: #e0442e; font-weight: 700; }` },
      { id: 'hdr-manga', name: 'Manga header', bg: 'radial-gradient(rgba(0,0,0,.14) 1px, transparent 1.3px) 0 0 / 8px 8px, #efe4cc', note: 'Anime / manga style: ink borders, hard offset shadows, a hanko stamp logo and skewed hover states. The CTA physically presses in.',
        html: '<header class="k-hmanga">\n  <a class="logo"><b>忍</b>SHINOBI</a>\n  <nav><a class="on">Episodes</a><a>Characters</a><a>Manga</a><a>Merch</a></nav>\n  <a class="cta">Watch now</a>\n</header>',
        css: `.k-hmanga { width: 940px; display: flex; align-items: center; gap: 30px; padding: 14px 18px; background: #fff; color: #111;
  border: 3px solid #111; box-shadow: 8px 8px 0 #111; font-family: 'Shippori Mincho B1', sans-serif; }
.k-hmanga .logo { display: flex; align-items: center; gap: 12px; font-weight: 900; font-size: 20px; letter-spacing: .04em; cursor: pointer; }
.k-hmanga .logo b { display: grid; place-items: center; width: 40px; height: 40px; background: #e8112d; color: #fff;
  font-family: 'Shippori Mincho B1', serif; transform: rotate(-8deg); border: 3px solid #111; }
.k-hmanga nav { display: flex; gap: 4px; margin: 0 auto; }
.k-hmanga nav a { padding: 8px 14px; font-weight: 700; font-size: 12.5px; text-transform: uppercase; cursor: pointer; transition: .2s; }
.k-hmanga nav a:hover, .k-hmanga nav .on { background: #111; color: #fff; transform: skewX(-10deg); }
.k-hmanga .cta { padding: 12px 20px; background: #e8112d; color: #fff; font-weight: 900; font-size: 12.5px; text-transform: uppercase;
  border: 3px solid #111; box-shadow: 4px 4px 0 #111; cursor: pointer; transition: .15s; }
.k-hmanga .cta:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 #111; }
.k-hmanga .cta:active { transform: translate(3px, 3px); box-shadow: 1px 1px 0 #111; }` },
      { id: 'hdr-app', name: 'Mobile app bar', bg: '#d9d9e4', note: 'App header for a 390px screen. The burger icon morphs on hover; filter chips switch on tap.',
        html: '<div class="k-hmob">\n  <header><button class="b" aria-label="Menu"><i></i><i></i><i></i></button><b>Pulse</b><span class="av">R</span></header>\n  <div class="t"><small>Tuesday · 24 Sept</small><h4>Good morning, Rafi</h4>\n    <div class="chips" data-k-tabs><button class="on">Today</button><button>Week</button><button>Month</button></div>\n  </div>\n</div>',
        css: `.k-hmob { width: 390px; overflow: hidden; border-radius: 28px; background: #f3f3f7; color: #14141c; font-family: 'Zen Kaku Gothic New', sans-serif; }
.k-hmob header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px 6px; }
.k-hmob header b { font: 800 18px 'Shippori Mincho B1', sans-serif; }
.k-hmob .b { width: 42px; height: 42px; display: grid; align-content: center; gap: 5px; padding: 0 11px; border: 0; border-radius: 14px; background: #fff; cursor: pointer; }
.k-hmob .b i { height: 2px; border-radius: 2px; background: #14141c; transition: transform .35s, width .35s; }
.k-hmob .b i:nth-child(2) { width: 70%; } .k-hmob .b i:nth-child(3) { width: 45%; }
.k-hmob .b:hover i { width: 100%; }
.k-hmob .av { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; font: 800 14px 'Shippori Mincho B1', sans-serif; color: #fff;
  background: linear-gradient(135deg, #e0442e, #9483c2); }
.k-hmob .t { padding: 10px 20px 20px; }
.k-hmob small { color: #8a8a99; font-size: 12.5px; }
.k-hmob h4 { margin: 4px 0 14px; font: 800 24px/1.1 'Shippori Mincho B1', sans-serif; letter-spacing: -.02em; }
.k-hmob .chips { display: flex; gap: 6px; }
.k-hmob .chips button { height: 34px; padding: 0 16px; border: 0; border-radius: 17px; background: #fff; color: #555; font: 600 13px 'Zen Kaku Gothic New', sans-serif; cursor: pointer; transition: .3s; }
.k-hmob .chips button.on { background: #14141c; color: #fff; }` }
    ] },

    /* ================================================================= */
    { cat: 'Bars', jp: '帯', icon: 'menu', items: [
      { id: 'bar-announce', name: 'Announcement bar', note: 'Dismissible banner with a pill tag. Arrow nudges on hover.',
        html: '<div class="k-bann">\n  <span class="tag">New</span>\n  <p>AI agents now ship with long-term memory — <a>see what’s new ' + IC.arrow + '</a></p>\n  <button aria-label="Dismiss">' + IC.close + '</button>\n</div>',
        css: `.k-bann { width: 860px; display: flex; align-items: center; gap: 14px; padding: 12px 12px 12px 14px; border-radius: 14px;
  background: linear-gradient(100deg, #e0442e, #9483c2); color: #fff; font-family: 'Zen Kaku Gothic New', sans-serif; }
.k-bann .tag { padding: 5px 10px; border-radius: 999px; background: #fff; color: #e0442e; font: 800 11px 'Shippori Mincho B1', sans-serif; text-transform: uppercase; }
.k-bann p { flex: 1; margin: 0; font-size: 14px; }
.k-bann a { display: inline-flex; align-items: center; gap: 6px; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.k-bann a svg { transition: transform .3s; } .k-bann a:hover svg { transform: translateX(4px); }
.k-bann button { width: 32px; height: 32px; display: grid; place-items: center; border: 0; border-radius: 8px; background: rgba(0,0,0,.15); color: #fff; cursor: pointer; }` },
      { id: 'bar-tabs', name: 'Underline tabs', note: 'The glowing ink slides to the active tab with an expo ease-out (450ms). Click to try.', js: 'tabs',
        html: '<div class="k-btabs" data-k-tabs>\n  <button class="on">Overview</button><button>Analytics</button><button>Reports</button><button>Settings</button>\n  <span class="ink"></span>\n</div>',
        css: `.k-btabs { position: relative; display: flex; gap: 6px; padding: 0 6px; border-bottom: 1px solid rgba(255,255,255,.12); }
.k-btabs button { padding: 14px 16px; border: 0; background: none; color: #857a68; font: 600 14px 'Zen Kaku Gothic New', sans-serif; cursor: pointer; transition: color .3s; }
.k-btabs button:hover, .k-btabs button.on { color: #fff; }
.k-btabs .ink { position: absolute; bottom: -1px; height: 2px; border-radius: 2px; background: #e0442e; box-shadow: 0 0 12px #e0442e;
  transition: left .45s cubic-bezier(.16,1,.3,1), width .45s cubic-bezier(.16,1,.3,1); }` },
      { id: 'bar-segment', name: 'Segmented control', note: 'A sliding thumb behind the labels — perfect for Monthly / Yearly pricing toggles.', js: 'tabs',
        html: '<div class="k-bseg" data-k-tabs>\n  <button class="on">Monthly</button><button>Yearly <em>-20%</em></button><button>Lifetime</button>\n  <span class="ink"></span>\n</div>',
        css: `.k-bseg { position: relative; display: inline-flex; padding: 5px; border-radius: 14px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); }
.k-bseg button { position: relative; z-index: 1; height: 40px; padding: 0 20px; border: 0; background: none; color: #bfb29a;
  font: 600 14px 'Zen Kaku Gothic New', sans-serif; cursor: pointer; transition: color .3s; }
.k-bseg button.on { color: #0f0d0b; }
.k-bseg em { font-style: normal; font-size: 11px; color: #22c55e; }
.k-bseg .ink { position: absolute; top: 5px; bottom: 5px; border-radius: 10px; background: #efe4cc;
  transition: left .45s cubic-bezier(.16,1,.3,1), width .45s cubic-bezier(.16,1,.3,1); }` },
      { id: 'bar-bottom', name: 'Bottom navigation', bg: '#1a1a24', note: 'Mobile tab bar with a raised floating action button in the middle.', js: 'tabs',
        html: '<nav class="k-bnav" data-k-tabs>\n  <a class="on">' + IC.home + '<span>Home</span></a>\n  <a>' + IC.chart + '<span>Stats</span></a>\n  <a class="fab" aria-label="Create">' + IC.plus + '</a>\n  <a>' + IC.bell + '<span>Alerts</span></a>\n  <a>' + IC.user + '<span>Profile</span></a>\n</nav>',
        css: `.k-bnav { width: 380px; display: flex; justify-content: space-around; align-items: center; height: 74px; padding: 0 8px;
  border-radius: 26px; background: #0e0e15; border: 1px solid rgba(255,255,255,.08); font-family: 'Zen Kaku Gothic New', sans-serif; }
.k-bnav a { display: grid; justify-items: center; gap: 4px; width: 60px; color: #857a68; font-size: 10.5px; font-weight: 600; cursor: pointer; transition: color .3s; }
.k-bnav a svg { transition: transform .4s cubic-bezier(.34,1.56,.64,1); }
.k-bnav a.on { color: #e0442e; } .k-bnav a.on svg { transform: translateY(-3px); }
.k-bnav .fab { width: 58px; height: 58px; margin-top: -34px; place-items: center; border-radius: 20px; color: #fff;
  background: linear-gradient(135deg, #e0442e, #9483c2); box-shadow: 0 12px 26px -8px #e0442e; }
.k-bnav .fab.on { color: #fff; }` },
      { id: 'bar-side', name: 'Dashboard sidebar', note: 'Vertical navigation with an active indicator bar, count badge and an upgrade card.', js: 'tabs',
        html: '<aside class="k-bside" data-k-tabs>\n  <div class="lg"><i></i>Vault</div>\n  <a class="on">' + IC.grid + 'Dashboard</a>\n  <a>' + IC.chart + 'Analytics</a>\n  <a>' + IC.cart + 'Orders<em>12</em></a>\n  <a>' + IC.user + 'Customers</a>\n  <a>' + IC.sliders + 'Settings</a>\n  <div class="up"><b>Pro plan</b><small>Unlimited AI agents</small><span>Upgrade</span></div>\n</aside>',
        css: `.k-bside { width: 240px; display: grid; gap: 2px; padding: 18px 12px; border-radius: 20px; background: #101018; color: #bfb29a;
  font-family: 'Zen Kaku Gothic New', sans-serif; border: 1px solid rgba(255,255,255,.08); }
.k-bside .lg { display: flex; align-items: center; gap: 10px; padding: 4px 10px 16px; font: 800 17px 'Shippori Mincho B1', sans-serif; color: #fff; }
.k-bside .lg i { width: 26px; height: 26px; border-radius: 8px; background: linear-gradient(135deg, #6fb3a8, #9483c2); }
.k-bside a { position: relative; display: flex; align-items: center; gap: 12px; padding: 11px 12px; border-radius: 10px; font-size: 14px; cursor: pointer; transition: .25s; }
.k-bside a:hover { background: rgba(255,255,255,.05); color: #fff; }
.k-bside a.on { background: rgba(224,68,46,.12); color: #fff; }
.k-bside a.on::before { content: ''; position: absolute; left: -12px; top: 10px; bottom: 10px; width: 3px; border-radius: 0 3px 3px 0; background: #e0442e; }
.k-bside em { margin-left: auto; font: 700 11px 'JetBrains Mono', monospace; font-style: normal; padding: 3px 7px; border-radius: 6px; background: #e0442e; color: #fff; }
.k-bside .up { display: grid; gap: 4px; margin-top: 16px; padding: 14px; border-radius: 14px; background: linear-gradient(135deg, rgba(224,68,46,.2), rgba(148,131,194,.2)); }
.k-bside .up b { color: #fff; font-size: 14px; } .k-bside .up small { font-size: 12px; }
.k-bside .up span { margin-top: 8px; padding: 8px; border-radius: 9px; text-align: center; background: #fff; color: #0f0d0b; font-weight: 700; font-size: 13px; cursor: pointer; }` },
      { id: 'bar-steps', name: 'Checkout stepper', note: 'Progress stepper. Completed steps turn green, the current step pulses.',
        html: '<div class="k-bstep">\n  <div class="done"><i>' + IC.check + '</i><span>Cart</span></div>\n  <div class="done"><i>' + IC.check + '</i><span>Shipping</span></div>\n  <div class="on"><i>3</i><span>Payment</span></div>\n  <div><i>4</i><span>Done</span></div>\n</div>',
        css: `.k-bstep { width: 620px; display: flex; font-family: 'Zen Kaku Gothic New', sans-serif; }
.k-bstep div { position: relative; flex: 1; display: grid; justify-items: center; gap: 10px; color: #857a68; font-size: 13px; font-weight: 600; }
.k-bstep div::before { content: ''; position: absolute; top: 19px; right: 50%; width: 100%; height: 2px; background: rgba(255,255,255,.12); z-index: 0; }
.k-bstep div:first-child::before { display: none; }
.k-bstep i { position: relative; z-index: 1; width: 40px; height: 40px; display: grid; place-items: center; border-radius: 50%;
  font: 700 14px 'JetBrains Mono', monospace; font-style: normal; background: #16161f; border: 2px solid rgba(255,255,255,.14); }
.k-bstep .done, .k-bstep .on { color: #fff; }
.k-bstep .done i { background: #22c55e; border-color: #22c55e; color: #04210f; }
.k-bstep .done::before, .k-bstep .on::before { background: #22c55e; }
.k-bstep .on i { background: #e0442e; border-color: #e0442e; animation: k-step 1.6s infinite; }
@keyframes k-step { 0% { box-shadow: 0 0 0 0 rgba(224,68,46,.6); } 100% { box-shadow: 0 0 0 14px rgba(224,68,46,0); } }` }
    ] },

    /* ================================================================= */
    { cat: 'Heroes', jp: '顔', icon: 'image', items: [
      { id: 'hero-center', name: 'Centered SaaS hero', pad: '0', note: 'Gradient headline, announcement badge, dual CTAs and a logo strip. Badge arrow nudges on hover.',
        html: '<section class="k-hero1">\n  <a class="badge"><b>New</b>AI agents v2.0 are live ' + IC.arrow + '</a>\n  <h2>Ship faster with <em>AI agents</em> that never sleep.</h2>\n  <p>Automate support, sales and operations with agents that plan, act and report — built around your tools.</p>\n  <div class="cta"><a class="p">Start free</a><a class="g">' + IC.play + 'Watch demo</a></div>\n  <div class="logos"><span>NOVA</span><span>kage.</span><span>VAULT</span><span>Sakura</span><span>PULSE</span></div>\n</section>',
        css: `.k-hero1 { width: 920px; display: grid; justify-items: center; gap: 22px; padding: 70px 40px 50px; text-align: center; color: #efe4cc;
  font-family: 'Zen Kaku Gothic New', sans-serif; background: radial-gradient(circle at 50% 0%, rgba(224,68,46,.35), transparent 60%), #15120f; }
.k-hero1 .badge { display: inline-flex; align-items: center; gap: 10px; padding: 6px 14px 6px 6px; border-radius: 999px; font-size: 13px;
  border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.04); cursor: pointer; }
.k-hero1 .badge b { padding: 4px 9px; border-radius: 999px; background: #e0442e; font-size: 11px; }
.k-hero1 .badge svg { transition: transform .3s; } .k-hero1 .badge:hover svg { transform: translateX(4px); }
.k-hero1 h2 { margin: 0; max-width: 760px; font: 800 52px/1.02 'Shippori Mincho B1', sans-serif; letter-spacing: -.035em; }
.k-hero1 em { font-style: normal; background: linear-gradient(115deg, #e0442e, #df7f73, #9483c2, #6fb3a8); -webkit-background-clip: text; background-clip: text; color: transparent; }
.k-hero1 p { margin: 0; max-width: 560px; color: #bfb29a; font-size: 17px; line-height: 1.6; }
.k-hero1 .cta { display: flex; gap: 12px; }
.k-hero1 .cta a { display: inline-flex; align-items: center; gap: 8px; height: 50px; padding: 0 24px; border-radius: 999px; font-weight: 600; cursor: pointer; }
.k-hero1 .p { background: #e0442e; color: #fff; box-shadow: 0 10px 30px -10px #e0442e; }
.k-hero1 .g { border: 1px solid rgba(255,255,255,.2); }
.k-hero1 .logos { display: flex; gap: 40px; margin-top: 20px; font: 800 18px 'Shippori Mincho B1', sans-serif; color: rgba(255,255,255,.28); letter-spacing: .04em; }` },
      { id: 'hero-manga', name: 'Manga impact hero', pad: '0', note: 'Speed lines, an impact stamp and a red slash band — an anime title card as a landing hero.',
        html: '<section class="k-hero2">\n  <div class="lines"></div>\n  <span class="stamp">参上</span>\n  <h2>LEVEL UP<br><em>YOUR STORE</em></h2>\n  <p>Chapter 1 — the autopilot awakens.</p>\n  <a>Begin the arc ' + IC.arrow + '</a>\n</section>',
        css: `.k-hero2 { position: relative; overflow: hidden; width: 900px; height: 420px; display: grid; place-content: center; justify-items: center; gap: 16px;
  text-align: center; background: #fff; color: #111; font-family: 'Shippori Mincho B1', sans-serif; }
.k-hero2 .lines { position: absolute; inset: -40%; background: repeating-conic-gradient(from 0deg, rgba(0,0,0,.12) 0 1.4deg, transparent 1.4deg 6deg);
  -webkit-mask: radial-gradient(circle, transparent 20%, #000 65%); mask: radial-gradient(circle, transparent 20%, #000 65%); animation: k-spin 40s linear infinite; }
@keyframes k-spin { to { transform: rotate(1turn); } }
.k-hero2 .stamp { position: absolute; right: 60px; top: 40px; padding: 10px 14px; font: 900 34px 'Shippori Mincho B1', serif; color: #fff; background: #e8112d;
  border: 4px solid #111; transform: rotate(12deg); box-shadow: 6px 6px 0 #111; }
.k-hero2 h2 { position: relative; margin: 0; font-weight: 900; font-size: 72px; line-height: .9; letter-spacing: -.04em; }
.k-hero2 h2 em { position: relative; font-style: normal; color: #fff; padding: 0 14px; }
.k-hero2 h2 em::before { content: ''; position: absolute; inset: 6px -10px; z-index: -1; background: #e8112d; transform: skewX(-14deg); border: 4px solid #111; }
.k-hero2 p { position: relative; margin: 0; font: 600 14px 'JetBrains Mono', monospace; }
.k-hero2 a { position: relative; display: inline-flex; align-items: center; gap: 10px; padding: 14px 24px; font-weight: 900; font-size: 13px; text-transform: uppercase;
  background: #111; color: #fff; box-shadow: 5px 5px 0 #e8112d; cursor: pointer; transition: .15s; }
.k-hero2 a:hover { transform: translate(-2px, -2px); box-shadow: 8px 8px 0 #e8112d; }` },
      { id: 'hero-split', name: 'Split hero with product mock', pad: '0', note: 'Copy and email capture on the left, an animated workflow mock on the right. Connector dashes flow continuously.',
        html: '<section class="k-hero3">\n  <div class="l">\n    <small>Automation platform</small>\n    <h2>Turn busywork into <em>background noise.</em></h2>\n    <p>Connect 400+ apps, add AI steps and run workflows 24/7.</p>\n    <form><input placeholder="you@company.com" aria-label="Email"><button type="button">Get early access</button></form>\n    <span class="note">' + IC.check + ' No credit card · 14-day free trial</span>\n  </div>\n  <div class="r"><div class="win">\n    <div class="bar"><i></i><i></i><i></i></div>\n    <svg viewBox="0 0 300 200"><path d="M70 60 C130 60 120 100 170 100 M70 140 C130 140 120 100 170 100 M230 100 H250"/></svg>\n    <span class="n a">Webhook</span><span class="n b">Sheet</span><span class="n c">AI step</span>\n  </div></div>\n</section>',
        css: `.k-hero3 { width: 980px; display: grid; grid-template-columns: 1.1fr 1fr; gap: 30px; align-items: center; padding: 50px; background: #0e0e16; color: #efe4cc; font-family: 'Zen Kaku Gothic New', sans-serif; }
.k-hero3 .l { display: grid; gap: 16px; }
.k-hero3 small { font: 600 12px 'JetBrains Mono', monospace; color: #6fb3a8; text-transform: uppercase; letter-spacing: .14em; }
.k-hero3 h2 { margin: 0; font: 800 42px/1.05 'Shippori Mincho B1', sans-serif; letter-spacing: -.03em; }
.k-hero3 em { font-style: normal; color: #6fb3a8; }
.k-hero3 p { margin: 0; color: #bfb29a; font-size: 16px; }
.k-hero3 form { display: flex; gap: 8px; padding: 6px; border-radius: 14px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); }
.k-hero3 input { flex: 1; min-width: 0; padding: 0 12px; background: none; border: 0; outline: none; color: #fff; font: inherit; }
.k-hero3 button { height: 44px; padding: 0 18px; border: 0; border-radius: 10px; background: #6fb3a8; color: #062b28; font: 700 14px 'Zen Kaku Gothic New', sans-serif; cursor: pointer; }
.k-hero3 .note { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #857a68; }
.k-hero3 .win { position: relative; height: 260px; border-radius: 16px; background: #15151f; border: 1px solid rgba(255,255,255,.1); overflow: hidden; }
.k-hero3 .bar { display: flex; gap: 6px; padding: 12px; border-bottom: 1px solid rgba(255,255,255,.08); }
.k-hero3 .bar i { width: 9px; height: 9px; border-radius: 50%; background: #34344a; }
.k-hero3 svg { position: absolute; inset: 34px 0 0; width: 100%; height: calc(100% - 34px); }
.k-hero3 path { fill: none; stroke: #6fb3a8; stroke-width: 2; stroke-dasharray: 6 6; animation: k-flow 1s linear infinite; }
@keyframes k-flow { to { stroke-dashoffset: -12; } }
.k-hero3 .n { position: absolute; padding: 9px 12px; border-radius: 10px; font: 600 12px 'JetBrains Mono', monospace; background: #1f1f2e; border: 1px solid rgba(255,255,255,.14); }
.k-hero3 .a { left: 18px; top: 72px; } .k-hero3 .b { left: 18px; top: 172px; }
.k-hero3 .c { right: 18px; top: 122px; border-color: #9483c2; color: #c9bbff; box-shadow: 0 0 24px rgba(148,131,194,.4); }` }
    ] },

    /* ================================================================= */
    { cat: 'Buttons', jp: '釦', icon: 'cursor', items: [
      { id: 'btn-primary', name: 'Primary · shine', bg: BUTTON_BG, note: 'Hover: 2px lift, deeper glow and a light sweep across the surface (800ms expo-out).',
        html: '<button class="k-b1">Get started ' + IC.arrow + '</button>',
        css: `.k-b1 { position: relative; overflow: hidden; display: inline-flex; align-items: center; gap: 10px; height: 52px; padding: 0 26px; border: 0; border-radius: 999px;
  background: #e0442e; color: #fff; font: 600 15px 'Zen Kaku Gothic New', sans-serif; cursor: pointer; box-shadow: 0 10px 30px -10px rgba(224,68,46,.8);
  transition: transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s; }
.k-b1::after { content: ''; position: absolute; inset: 0; background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,.45) 45%, transparent 60%);
  transform: translateX(-120%); transition: transform .8s cubic-bezier(.16,1,.3,1); }
.k-b1:hover { transform: translateY(-2px); box-shadow: 0 16px 40px -10px #e0442e; }
.k-b1:hover::after { transform: translateX(120%); }
.k-b1 svg { transition: transform .4s; } .k-b1:hover svg { transform: translateX(4px); }` },
      { id: 'btn-ghost', name: 'Ghost · liquid fill', bg: BUTTON_BG, note: 'An outlined button that fills from the bottom with a curved liquid edge that flattens as it rises.',
        html: '<button class="k-b2">View projects</button>',
        css: `.k-b2 { position: relative; overflow: hidden; isolation: isolate; height: 52px; padding: 0 28px; border-radius: 999px; border: 1.5px solid #efe4cc;
  background: transparent; color: #efe4cc; font: 600 15px 'Zen Kaku Gothic New', sans-serif; cursor: pointer; transition: color .4s; }
.k-b2::before { content: ''; position: absolute; inset: 0; z-index: -1; background: #efe4cc; border-radius: 50% 50% 0 0;
  transform: translateY(101%); transition: transform .55s cubic-bezier(.16,1,.3,1), border-radius .55s; }
.k-b2:hover { color: #0f0d0b; }
.k-b2:hover::before { transform: none; border-radius: 0; }` },
      { id: 'btn-neon', name: 'Neon pulse', bg: BUTTON_BG, note: 'Breathing neon glow (2.4s loop). Hover floods it with light.',
        html: '<button class="k-b3">Connect wallet</button>',
        css: `.k-b3 { height: 52px; padding: 0 30px; border-radius: 12px; border: 1.5px solid #6fb3a8; background: rgba(111,179,168,.06); color: #6fb3a8;
  font: 700 13px 'JetBrains Mono', monospace; letter-spacing: .14em; text-transform: uppercase; text-shadow: 0 0 10px #6fb3a8;
  box-shadow: 0 0 12px rgba(111,179,168,.4), inset 0 0 12px rgba(111,179,168,.2); cursor: pointer; animation: k-b3 2.4s ease-in-out infinite; transition: background .3s, color .3s; }
.k-b3:hover { background: #6fb3a8; color: #062b28; text-shadow: none; box-shadow: 0 0 40px #6fb3a8; }
@keyframes k-b3 { 50% { box-shadow: 0 0 24px rgba(111,179,168,.75), inset 0 0 16px rgba(111,179,168,.3); } }` },
      { id: 'btn-gradient', name: 'Rotating gradient border', bg: BUTTON_BG, note: 'A conic gradient border that spins forever using an animatable @property angle. Hover adds a soft halo.',
        html: '<button class="k-b4">Launch app</button>',
        css: `@property --k-a { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
.k-b4 { position: relative; isolation: isolate; height: 52px; padding: 0 28px; border: 0; border-radius: 14px; background: #15120f; color: #fff;
  font: 600 15px 'Zen Kaku Gothic New', sans-serif; cursor: pointer; }
.k-b4::before { content: ''; position: absolute; inset: -2px; z-index: -2; border-radius: 16px;
  background: conic-gradient(from var(--k-a), #e0442e, #9483c2, #6fb3a8, #d9a441, #e0442e); animation: k-b4 3s linear infinite; transition: filter .3s; }
.k-b4::after { content: ''; position: absolute; inset: 0; z-index: -1; border-radius: 14px; background: #15120f; }
.k-b4:hover::before { filter: blur(5px); }
@keyframes k-b4 { to { --k-a: 360deg; } }` },
      { id: 'btn-slash', name: 'Anime slash', bg: BUTTON_BG, note: 'A skewed crimson blade wipes across on hover (450ms ease-in-out) — straight out of an anime title card.',
        html: '<button class="k-b5"><span>Slash in</span></button>',
        css: `.k-b5 { position: relative; overflow: hidden; height: 54px; padding: 0 36px; border: 2px solid #efe4cc; background: transparent; color: #efe4cc;
  font: 800 13px 'Shippori Mincho B1', sans-serif; letter-spacing: .08em; text-transform: uppercase; cursor: pointer;
  clip-path: polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%); transition: border-color .3s; }
.k-b5::before { content: ''; position: absolute; top: -20%; bottom: -20%; left: -30%; width: 0; background: #e0442e; transform: skewX(-24deg);
  transition: width .45s cubic-bezier(.77,0,.175,1); }
.k-b5 span { position: relative; }
.k-b5:hover { border-color: #e0442e; }
.k-b5:hover::before { width: 160%; }` },
      { id: 'btn-3d', name: '3D press', bg: BUTTON_BG, note: 'Tactile: raised on hover, sinks fully when pressed (100ms).',
        html: '<button class="k-b6">Claim reward</button>',
        css: `.k-b6 { height: 54px; padding: 0 30px; border: 0; border-radius: 14px; background: #d9a441; color: #2a1a00; font: 800 15px 'Zen Kaku Gothic New', sans-serif;
  cursor: pointer; box-shadow: 0 6px 0 #b8801a, 0 12px 20px -6px rgba(0,0,0,.6); transform: translateY(-3px); transition: transform .1s, box-shadow .1s; }
.k-b6:hover { transform: translateY(-4px); box-shadow: 0 7px 0 #b8801a, 0 14px 24px -6px rgba(0,0,0,.6); }
.k-b6:active { transform: translateY(3px); box-shadow: 0 0 0 #b8801a, 0 4px 10px -4px rgba(0,0,0,.6); }` },
      { id: 'btn-icons', name: 'Icon buttons', bg: BUTTON_BG, note: 'Springy scale + rotate on hover (cubic-bezier .34,1.56,.64,1). The heart toggles on click.', js: 'toggle',
        html: '<div class="k-b7">\n  <button aria-label="Play">' + IC.play + '</button>\n  <button aria-label="Like" class="lk" data-k-toggle>' + IC.heart + '</button>\n  <button aria-label="Share">' + IC.share + '</button>\n</div>',
        css: `.k-b7 { display: flex; gap: 12px; }
.k-b7 button { width: 52px; height: 52px; display: grid; place-items: center; border-radius: 50%; border: 1px solid rgba(255,255,255,.16);
  background: rgba(255,255,255,.04); color: #efe4cc; cursor: pointer; transition: transform .45s cubic-bezier(.34,1.56,.64,1), background .3s, border-color .3s; }
.k-b7 button:hover { transform: scale(1.12) rotate(-8deg); background: #e0442e; border-color: #e0442e; }
.k-b7 .lk.on { background: #e0442e; border-color: #e0442e; }
.k-b7 .lk.on svg { fill: currentColor; }` },
      { id: 'btn-loading', name: 'Loading → success', bg: BUTTON_BG, note: 'Click it: collapses into a spinner, then turns green with a success label, then resets.', js: 'load',
        html: '<button class="k-b8" data-k-load><span class="t">Deploy site</span><i></i></button>',
        css: `.k-b8 { position: relative; height: 52px; min-width: 160px; padding: 0 26px; border: 0; border-radius: 12px; background: #9483c2; color: #fff;
  font: 600 15px 'Zen Kaku Gothic New', sans-serif; cursor: pointer; transition: min-width .4s, border-radius .4s, padding .4s, background .4s; }
.k-b8 .t { transition: opacity .2s; }
.k-b8 i { position: absolute; left: 50%; top: 50%; width: 22px; height: 22px; margin: -11px; border-radius: 50%;
  border: 2.5px solid rgba(255,255,255,.3); border-top-color: #fff; opacity: 0; animation: k-b8 .8s linear infinite; }
.k-b8.is-loading { min-width: 52px; padding: 0; border-radius: 26px; }
.k-b8.is-loading .t { opacity: 0; } .k-b8.is-loading i { opacity: 1; }
.k-b8.is-done { background: #22c55e; }
@keyframes k-b8 { to { transform: rotate(1turn); } }` },
      { id: 'btn-arrow', name: 'Expanding circle', bg: BUTTON_BG, note: 'The circle behind the arrow grows into the full button on hover (550ms).',
        html: '<a class="k-b9"><span class="c">' + IC.arrow + '</span><span class="t">Explore my work</span></a>',
        css: `.k-b9 { position: relative; isolation: isolate; display: inline-flex; align-items: center; height: 56px; padding: 0 26px 0 70px; border-radius: 999px;
  color: #efe4cc; font: 600 15px 'Zen Kaku Gothic New', sans-serif; cursor: pointer; }
.k-b9 .c { position: absolute; left: 0; top: 0; z-index: -1; width: 56px; height: 56px; border-radius: 28px; background: #e0442e;
  display: flex; align-items: center; padding-left: 19px; color: #fff; transition: width .55s cubic-bezier(.16,1,.3,1); }
.k-b9 .c svg { transition: transform .55s cubic-bezier(.16,1,.3,1); }
.k-b9:hover .c { width: 100%; }
.k-b9:hover .c svg { transform: translateX(4px); }` },
      { id: 'btn-split', name: 'Split button + menu', bg: BUTTON_BG, pad: '36px 36px 170px', note: 'Primary action with a caret that opens a menu on hover or keyboard focus (pure CSS :focus-within).',
        html: '<div class="k-b10">\n  <button class="m">' + IC.zap + 'Run workflow</button>\n  <button class="d" aria-label="More options">' + IC.down + '</button>\n  <ul><li>Run once</li><li>Schedule…</li><li>Run with test data</li></ul>\n</div>',
        css: `.k-b10 { position: relative; display: inline-flex; font-family: 'Zen Kaku Gothic New', sans-serif; }
.k-b10 button { display: flex; align-items: center; gap: 8px; height: 48px; border: 0; background: #6fb3a8; color: #062b28; font: 700 14px 'Zen Kaku Gothic New', sans-serif; cursor: pointer; }
.k-b10 .m { padding: 0 18px; border-radius: 12px 0 0 12px; }
.k-b10 .d { padding: 0 12px; border-radius: 0 12px 12px 0; border-left: 1px solid rgba(0,0,0,.2); }
.k-b10 button:hover { filter: brightness(1.08); }
.k-b10 ul { position: absolute; top: calc(100% + 8px); right: 0; min-width: 200px; margin: 0; padding: 6px; list-style: none; border-radius: 12px;
  background: #16161f; border: 1px solid rgba(255,255,255,.12); box-shadow: 0 20px 40px -12px #000; opacity: 0; transform: translateY(-6px);
  pointer-events: none; transition: .25s; }
.k-b10:hover ul, .k-b10:focus-within ul { opacity: 1; transform: none; pointer-events: auto; }
.k-b10 li { padding: 9px 12px; border-radius: 8px; font-size: 13px; color: #bfb29a; cursor: pointer; }
.k-b10 li:hover { background: rgba(255,255,255,.06); color: #fff; }` }
    ] },

    /* ================================================================= */
    { cat: 'Cards', jp: '札', icon: 'grid', items: [
      { id: 'card-product', name: 'Product card', note: 'Floating product orb, discount tag, wishlist toggle and an add button that spins on hover.', js: 'toggle',
        html: '<article class="k-c1">\n  <div class="img"><span class="tag">-19%</span><button class="w" aria-label="Wishlist" data-k-toggle>' + IC.heart + '</button><i></i></div>\n  <div class="in">\n    <small>Tech · Wireless</small>\n    <h4>Ronin ANC Headphones</h4>\n    <div class="row"><b>$129 <s>$159</s></b><button class="add" aria-label="Add to cart">' + IC.plus + '</button></div>\n  </div>\n</article>',
        css: `.k-c1 { width: 270px; overflow: hidden; border-radius: 22px; background: #13131c; border: 1px solid rgba(255,255,255,.08); color: #efe4cc;
  font-family: 'Zen Kaku Gothic New', sans-serif; transition: transform .5s cubic-bezier(.16,1,.3,1); }
.k-c1:hover { transform: translateY(-6px); }
.k-c1 .img { position: relative; height: 220px; display: grid; place-items: center; background: radial-gradient(circle at 50% 45%, rgba(224,68,46,.35), transparent 60%), #0c0c14; }
.k-c1 .img i { width: 110px; height: 110px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #ff9aaa, #e0442e 50%, #6b0a1c);
  box-shadow: 0 30px 40px -10px rgba(0,0,0,.6); animation: k-float 4s ease-in-out infinite; }
@keyframes k-float { 50% { transform: translateY(-10px); } }
.k-c1 .tag { position: absolute; left: 14px; top: 14px; padding: 5px 9px; border-radius: 8px; font: 700 11px 'JetBrains Mono', monospace; background: #e0442e; }
.k-c1 .w { position: absolute; right: 14px; top: 14px; width: 38px; height: 38px; display: grid; place-items: center; border-radius: 50%;
  border: 1px solid rgba(255,255,255,.15); background: rgba(0,0,0,.35); color: #fff; cursor: pointer; }
.k-c1 .w.on { background: #e0442e; border-color: #e0442e; } .k-c1 .w.on svg { fill: currentColor; }
.k-c1 .in { display: grid; gap: 6px; padding: 16px 18px 18px; }
.k-c1 small { font: 500 11px 'JetBrains Mono', monospace; color: #857a68; text-transform: uppercase; letter-spacing: .1em; }
.k-c1 h4 { margin: 0; font-size: 16px; }
.k-c1 .row { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
.k-c1 b { font: 800 20px 'Shippori Mincho B1', sans-serif; } .k-c1 s { font: 500 13px 'Zen Kaku Gothic New', sans-serif; color: #857a68; }
.k-c1 .add { width: 40px; height: 40px; display: grid; place-items: center; border: 0; border-radius: 12px; background: #efe4cc; color: #0f0d0b; cursor: pointer;
  transition: transform .4s cubic-bezier(.34,1.56,.64,1); }
.k-c1 .add:hover { transform: rotate(90deg) scale(1.08); }` },
      { id: 'card-pricing', name: 'Pricing card', note: 'Highlighted tier with a gradient border, ribbon, feature checklist and full-width CTA.',
        html: '<article class="k-c2">\n  <span class="rib">Most popular</span>\n  <small>Blade</small>\n  <h4>$499<span> / project</span></h4>\n  <p>For growing businesses that need automation and AI.</p>\n  <ul>\n    <li>' + IC.check + 'Custom web app</li>\n    <li>' + IC.check + 'Telegram bot + admin</li>\n    <li>' + IC.check + 'AI chat assistant</li>\n    <li>' + IC.check + 'Crypto &amp; bKash payments</li>\n    <li>' + IC.check + '30 days of support</li>\n  </ul>\n  <a>Choose Blade</a>\n</article>',
        css: `.k-c2 { position: relative; width: 300px; display: grid; gap: 14px; padding: 28px 24px 24px; border-radius: 24px; color: #efe4cc; font-family: 'Zen Kaku Gothic New', sans-serif;
  background: linear-gradient(#13131c, #13131c) padding-box, linear-gradient(135deg, #e0442e, #9483c2, #6fb3a8) border-box; border: 1.5px solid transparent; }
.k-c2 .rib { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); padding: 6px 12px; border-radius: 999px; font: 700 11px 'JetBrains Mono', monospace;
  text-transform: uppercase; letter-spacing: .08em; background: #e0442e; box-shadow: 0 8px 20px -6px #e0442e; }
.k-c2 small { font: 600 12px 'JetBrains Mono', monospace; color: #df7f73; text-transform: uppercase; letter-spacing: .14em; }
.k-c2 h4 { margin: 0; font: 800 40px 'Shippori Mincho B1', sans-serif; } .k-c2 h4 span { font: 500 14px 'Zen Kaku Gothic New', sans-serif; color: #857a68; }
.k-c2 p { margin: 0; color: #bfb29a; font-size: 14px; }
.k-c2 ul { display: grid; gap: 10px; margin: 6px 0; padding: 0; list-style: none; font-size: 14px; }
.k-c2 li { display: flex; gap: 10px; align-items: center; } .k-c2 li svg { color: #22c55e; }
.k-c2 a { display: grid; place-items: center; height: 48px; border-radius: 14px; background: #efe4cc; color: #0f0d0b; font-weight: 700; cursor: pointer; transition: .3s; }
.k-c2 a:hover { background: #e0442e; color: #fff; }` },
      { id: 'card-profile', name: 'Profile card', note: 'Cover, overlapping avatar ring, stats row and a follow toggle whose label swaps via CSS.', js: 'toggle',
        html: '<article class="k-c3">\n  <div class="cov"></div>\n  <div class="av">A</div>\n  <h4>Aiko Rahman</h4>\n  <p>Product designer · Dhaka, BD</p>\n  <div class="st"><div><b>84</b><span>Projects</span></div><div><b>12k</b><span>Followers</span></div><div><b>4.9</b><span>Rating</span></div></div>\n  <div class="act"><a class="f" data-k-toggle></a><a>Message</a></div>\n</article>',
        css: `.k-c3 { width: 300px; overflow: hidden; display: grid; justify-items: center; padding-bottom: 20px; border-radius: 24px; background: #13131c;
  border: 1px solid rgba(255,255,255,.08); color: #efe4cc; font-family: 'Zen Kaku Gothic New', sans-serif; text-align: center; }
.k-c3 .cov { width: 100%; height: 90px; background: linear-gradient(120deg, #e0442e, #9483c2 60%, #6fb3a8); }
.k-c3 .av { width: 84px; height: 84px; margin-top: -42px; display: grid; place-items: center; border-radius: 50%; font: 800 28px 'Shippori Mincho B1', sans-serif;
  background: #1f1f2e; border: 4px solid #13131c; box-shadow: 0 0 0 2px #e0442e; }
.k-c3 h4 { margin: 12px 0 2px; font-size: 18px; } .k-c3 p { margin: 0; font-size: 13px; color: #857a68; }
.k-c3 .st { display: grid; grid-template-columns: repeat(3, 1fr); width: 100%; margin: 18px 0; border-block: 1px solid rgba(255,255,255,.08); }
.k-c3 .st div { padding: 12px 0; display: grid; gap: 2px; } .k-c3 .st b { font: 800 16px 'Shippori Mincho B1', sans-serif; } .k-c3 .st span { font-size: 11.5px; color: #857a68; }
.k-c3 .act { display: flex; gap: 8px; }
.k-c3 .act a { height: 40px; padding: 0 18px; display: grid; place-items: center; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; border: 1px solid rgba(255,255,255,.16); transition: .3s; }
.k-c3 .f { background: #e0442e; border-color: #e0442e !important; min-width: 106px; }
.k-c3 .f::after { content: 'Follow'; } .k-c3 .f.on { background: transparent; } .k-c3 .f.on::after { content: 'Following'; }` },
      { id: 'card-stat', name: 'KPI stat card', note: 'Metric with delta badge and a self-drawing sparkline (stroke-dashoffset animation).',
        html: '<article class="k-c4">\n  <div class="h"><span>' + IC.chart + 'Revenue</span><em>+18.4%</em></div>\n  <b>$24,810</b>\n  <small>vs $20,952 last month</small>\n  <svg viewBox="0 0 200 60" preserveAspectRatio="none"><path class="a" d="M0 50 20 44 40 46 60 36 80 40 100 28 120 30 140 18 160 22 180 10 200 12V60H0Z"/><path class="l" d="M0 50 20 44 40 46 60 36 80 40 100 28 120 30 140 18 160 22 180 10 200 12"/></svg>\n</article>',
        css: `.k-c4 { width: 300px; display: grid; gap: 6px; padding: 20px 20px 0; overflow: hidden; border-radius: 22px; background: #13131c; border: 1px solid rgba(255,255,255,.08);
  color: #efe4cc; font-family: 'Zen Kaku Gothic New', sans-serif; }
.k-c4 .h { display: flex; justify-content: space-between; align-items: center; }
.k-c4 .h span { display: flex; gap: 8px; align-items: center; font-size: 13px; color: #bfb29a; } .k-c4 .h svg { color: #e0442e; }
.k-c4 em { padding: 4px 8px; border-radius: 7px; font: 700 11px 'JetBrains Mono', monospace; font-style: normal; color: #22c55e; background: rgba(34,197,94,.12); }
.k-c4 b { font: 800 32px 'Shippori Mincho B1', sans-serif; letter-spacing: -.02em; }
.k-c4 small { font-size: 12.5px; color: #857a68; }
.k-c4 svg { width: calc(100% + 40px); height: 70px; margin: 10px -20px 0; }
.k-c4 .a { fill: rgba(224,68,46,.14); }
.k-c4 .l { fill: none; stroke: #e0442e; stroke-width: 2.5; stroke-dasharray: 400; stroke-dashoffset: 400; animation: k-draw 2s cubic-bezier(.16,1,.3,1) forwards infinite alternate; }
@keyframes k-draw { to { stroke-dashoffset: 0; } }` },
      { id: 'card-glass', name: 'Glass feature card', bg: GLASS_BG, note: 'Frosted card over colorful blobs, with an icon that rotates on hover.',
        html: '<article class="k-c5">\n  <span class="ic">' + IC.zap + '</span>\n  <h4>Instant automations</h4>\n  <p>Connect your tools and let AI handle the repetitive work — 24/7, with logs for every run.</p>\n  <a>Learn more ' + IC.arrow + '</a>\n</article>',
        css: `.k-c5 { width: 320px; display: grid; gap: 12px; padding: 26px; border-radius: 24px; background: rgba(255,255,255,.08); backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid rgba(255,255,255,.2); color: #fff; font-family: 'Zen Kaku Gothic New', sans-serif; box-shadow: 0 30px 60px -30px rgba(0,0,0,.6); }
.k-c5 .ic { width: 50px; height: 50px; display: grid; place-items: center; border-radius: 16px; background: rgba(255,255,255,.16); transition: transform .6s cubic-bezier(.34,1.56,.64,1); }
.k-c5:hover .ic { transform: rotate(-12deg) scale(1.08); }
.k-c5 h4 { margin: 4px 0 0; font: 800 20px 'Shippori Mincho B1', sans-serif; }
.k-c5 p { margin: 0; font-size: 14.5px; line-height: 1.55; color: rgba(255,255,255,.8); }
.k-c5 a { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 14px; cursor: pointer; }
.k-c5 a svg { transition: transform .3s; } .k-c5 a:hover svg { transform: translateX(4px); }` }
    ] },

    /* ================================================================= */
    { cat: 'Forms', jp: '書', icon: 'pen', items: [
      { id: 'form-float', name: 'Floating labels', note: 'Labels float up when the field is focused or filled — pure CSS using :placeholder-shown.',
        html: '<form class="k-f1">\n  <label><input placeholder=" "><span>Full name</span></label>\n  <label><input type="email" placeholder=" "><span>Email address</span></label>\n  <label><textarea placeholder=" " rows="3"></textarea><span>Tell me about your project</span></label>\n  <button type="button">Send message ' + IC.arrow + '</button>\n</form>',
        css: `.k-f1 { width: 380px; display: grid; gap: 14px; font-family: 'Zen Kaku Gothic New', sans-serif; }
.k-f1 label { position: relative; display: block; }
.k-f1 input, .k-f1 textarea { width: 100%; box-sizing: border-box; padding: 24px 16px 8px; border-radius: 12px; border: 1px solid rgba(255,255,255,.15);
  background: rgba(255,255,255,.04); color: #fff; font: inherit; font-size: 15px; outline: none; resize: none; transition: border-color .3s, box-shadow .3s; }
.k-f1 input:focus, .k-f1 textarea:focus { border-color: #e0442e; box-shadow: 0 0 0 4px rgba(224,68,46,.15); }
.k-f1 span { position: absolute; left: 16px; top: 16px; color: #857a68; font-size: 15px; pointer-events: none; transform-origin: left top; transition: transform .25s, color .25s; }
.k-f1 input:focus + span, .k-f1 input:not(:placeholder-shown) + span,
.k-f1 textarea:focus + span, .k-f1 textarea:not(:placeholder-shown) + span { transform: translateY(-10px) scale(.75); color: #e0442e; }
.k-f1 button { display: flex; align-items: center; justify-content: center; gap: 8px; height: 50px; border: 0; border-radius: 12px; background: #e0442e; color: #fff;
  font: 600 15px 'Zen Kaku Gothic New', sans-serif; cursor: pointer; }` },
      { id: 'form-command', name: 'Command palette', note: 'Ctrl + K style search with keyboard hints and a highlighted row. Arrow keys move the selection.', js: 'palette',
        html: '<div class="k-f2" data-k-palette>\n  <label>' + IC.search + '<input placeholder="Search or jump to…" aria-label="Command search"><kbd>Ctrl K</kbd></label>\n  <ul>\n    <li class="on">' + IC.zap + '<span>Run workflow</span><kbd>R</kbd></li>\n    <li>' + IC.cart + '<span>Open orders</span><kbd>O</kbd></li>\n    <li>' + IC.user + '<span>Invite teammate</span><kbd>I</kbd></li>\n    <li>' + IC.sliders + '<span>Settings</span><kbd>,</kbd></li>\n  </ul>\n</div>',
        css: `.k-f2 { width: 460px; overflow: hidden; border-radius: 18px; background: #14141d; border: 1px solid rgba(255,255,255,.12); color: #efe4cc;
  font-family: 'Zen Kaku Gothic New', sans-serif; box-shadow: 0 30px 60px -20px #000; }
.k-f2 label { display: flex; align-items: center; gap: 12px; padding: 16px 18px; border-bottom: 1px solid rgba(255,255,255,.08); color: #857a68; }
.k-f2 input { flex: 1; background: none; border: 0; outline: none; color: #fff; font: inherit; font-size: 16px; }
.k-f2 kbd { font: 500 11px 'JetBrains Mono', monospace; padding: 3px 7px; border-radius: 6px; border: 1px solid rgba(255,255,255,.18); color: #bfb29a; }
.k-f2 ul { margin: 0; padding: 8px; list-style: none; }
.k-f2 li { display: flex; align-items: center; gap: 12px; padding: 11px 12px; border-radius: 10px; font-size: 14px; color: #bfb29a; cursor: pointer; }
.k-f2 li span { flex: 1; }
.k-f2 li.on, .k-f2 li:hover { background: rgba(224,68,46,.14); color: #fff; }
.k-f2 li.on svg { color: #e0442e; }` },
      { id: 'form-toggles', name: 'Switches, checks & radios', note: 'Custom controls built on real inputs, so they stay keyboard- and screen-reader-friendly.',
        html: '<div class="k-f3">\n  <label class="sw"><input type="checkbox" checked><i></i>Email notifications</label>\n  <label class="sw"><input type="checkbox"><i></i>Dark mode</label>\n  <label class="cb"><input type="checkbox" checked><i>' + IC.check + '</i>Remember me</label>\n  <label class="cb"><input type="checkbox"><i>' + IC.check + '</i>Send me updates</label>\n  <div class="rd"><label><input type="radio" name="k-plan" checked><i></i>Monthly</label><label><input type="radio" name="k-plan"><i></i>Yearly</label></div>\n</div>',
        css: `.k-f3 { width: 300px; display: grid; gap: 14px; color: #efe4cc; font: 500 14.5px 'Zen Kaku Gothic New', sans-serif; }
.k-f3 label { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.k-f3 input { position: absolute; opacity: 0; pointer-events: none; }
.k-f3 .sw i { position: relative; width: 46px; height: 26px; border-radius: 13px; background: #2a2a3a; transition: background .3s; }
.k-f3 .sw i::after { content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform .35s cubic-bezier(.34,1.56,.64,1); }
.k-f3 .sw input:checked + i { background: #e0442e; } .k-f3 .sw input:checked + i::after { transform: translateX(20px); }
.k-f3 .cb i { width: 22px; height: 22px; display: grid; place-items: center; border-radius: 7px; border: 1.5px solid rgba(255,255,255,.3); color: transparent; transition: .25s; }
.k-f3 .cb i svg { width: 14px; height: 14px; stroke-width: 3; }
.k-f3 .cb input:checked + i { background: #6fb3a8; border-color: #6fb3a8; color: #062b28; }
.k-f3 .rd { display: flex; gap: 20px; }
.k-f3 .rd i { width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,.3); transition: .25s; }
.k-f3 .rd input:checked + i { border: 7px solid #9483c2; }
.k-f3 input:focus-visible + i { outline: 2px solid #6fb3a8; outline-offset: 3px; }` },
      { id: 'form-otp', name: 'OTP code input', note: 'Six boxes that auto-advance, support backspace and paste. Try typing digits.', js: 'otp',
        html: '<div class="k-f4" data-k-otp>\n  <p>Enter the 6-digit code sent to <b>+880 1•• ••• 421</b></p>\n  <div class="bx">' + OTP + '</div>\n  <button type="button">Verify</button>\n</div>',
        css: `.k-f4 { width: 400px; display: grid; justify-items: center; gap: 18px; text-align: center; color: #efe4cc; font-family: 'Zen Kaku Gothic New', sans-serif; }
.k-f4 p { margin: 0; color: #bfb29a; font-size: 14px; } .k-f4 b { color: #fff; }
.k-f4 .bx { display: flex; gap: 10px; }
.k-f4 input { width: 52px; height: 62px; box-sizing: border-box; border-radius: 14px; border: 1.5px solid rgba(255,255,255,.15); background: rgba(255,255,255,.04);
  color: #fff; text-align: center; font: 800 24px 'Shippori Mincho B1', sans-serif; outline: none; transition: .25s; }
.k-f4 input:focus { border-color: #e0442e; transform: translateY(-3px); box-shadow: 0 10px 20px -10px #e0442e; }
.k-f4 input.full { border-color: #6fb3a8; }
.k-f4 button { width: 100%; height: 50px; border: 0; border-radius: 14px; background: #efe4cc; color: #0f0d0b; font: 700 15px 'Zen Kaku Gothic New', sans-serif; cursor: pointer; }` },
      { id: 'form-news', name: 'Newsletter signup', note: 'Inline email capture with a reassurance line.',
        html: '<form class="k-f5">\n  <h4>Get the build log</h4>\n  <p>One email a month: new projects, tutorials and free templates.</p>\n  <div class="row"><input type="email" placeholder="you@example.com" aria-label="Email"><button type="button">Subscribe</button></div>\n  <small>' + IC.shield + 'No spam. Unsubscribe anytime.</small>\n</form>',
        css: `.k-f5 { width: 460px; display: grid; gap: 12px; padding: 28px; border-radius: 24px; background: linear-gradient(135deg, #1b0f22, #0f1624); border: 1px solid rgba(255,255,255,.1);
  color: #efe4cc; font-family: 'Zen Kaku Gothic New', sans-serif; }
.k-f5 h4 { margin: 0; font: 800 22px 'Shippori Mincho B1', sans-serif; } .k-f5 p { margin: 0; color: #bfb29a; font-size: 14px; }
.k-f5 .row { display: flex; gap: 8px; margin-top: 6px; }
.k-f5 input { flex: 1; min-width: 0; height: 48px; padding: 0 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,.15); background: rgba(0,0,0,.25); color: #fff; font: inherit; outline: none; }
.k-f5 input:focus { border-color: #9483c2; }
.k-f5 button { height: 48px; padding: 0 20px; border: 0; border-radius: 12px; background: #9483c2; color: #fff; font: 700 14px 'Zen Kaku Gothic New', sans-serif; cursor: pointer; }
.k-f5 small { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: #857a68; } .k-f5 small svg { width: 15px; height: 15px; }` }
    ] },

    /* ================================================================= */
    { cat: 'Footers', jp: '足', icon: 'layers', items: [
      { id: 'foot-big', name: 'Multi-column footer', pad: '0', note: 'Brand block with newsletter, three link columns and a bottom bar with social icons.',
        html: '<footer class="k-ft1">\n  <div class="top">\n    <div class="b"><a class="logo"><i></i>NOVA</a><p>AI analytics for teams that ship.</p><form><input placeholder="Email for updates" aria-label="Email"><button type="button" aria-label="Subscribe">' + IC.arrow + '</button></form></div>\n    <div><h5>Product</h5><a>Features</a><a>Pricing</a><a>Changelog</a><a>Docs</a></div>\n    <div><h5>Company</h5><a>About</a><a>Careers</a><a>Blog</a><a>Press</a></div>\n    <div><h5>Legal</h5><a>Privacy</a><a>Terms</a><a>Security</a></div>\n  </div>\n  <div class="bot"><span>© 2026 Nova Labs</span><span class="soc"><a aria-label="Email">' + IC.mail + '</a><a aria-label="Share">' + IC.share + '</a><a aria-label="Profile">' + IC.user + '</a></span></div>\n</footer>',
        css: `.k-ft1 { width: 980px; background: #0a0a10; color: #bfb29a; font-family: 'Zen Kaku Gothic New', sans-serif; border-top: 1px solid rgba(255,255,255,.08); }
.k-ft1 .top { display: grid; grid-template-columns: 1.6fr repeat(3, 1fr); gap: 30px; padding: 44px 40px; }
.k-ft1 .logo { display: flex; align-items: center; gap: 10px; font: 800 18px 'Shippori Mincho B1', sans-serif; color: #fff; }
.k-ft1 .logo i { width: 26px; height: 26px; border-radius: 8px; background: linear-gradient(135deg, #e0442e, #9483c2); }
.k-ft1 p { margin: 12px 0 16px; font-size: 14px; }
.k-ft1 form { display: flex; max-width: 280px; padding: 4px; border-radius: 12px; border: 1px solid rgba(255,255,255,.12); }
.k-ft1 input { flex: 1; min-width: 0; padding: 0 10px; background: none; border: 0; outline: none; color: #fff; font: inherit; font-size: 13.5px; }
.k-ft1 form button { width: 38px; height: 38px; display: grid; place-items: center; border: 0; border-radius: 9px; background: #e0442e; color: #fff; cursor: pointer; }
.k-ft1 h5 { margin: 0 0 14px; font: 600 11px 'JetBrains Mono', monospace; letter-spacing: .14em; text-transform: uppercase; color: #857a68; }
.k-ft1 .top > div:not(.b) { display: grid; gap: 10px; align-content: start; font-size: 14px; }
.k-ft1 .top a { cursor: pointer; transition: color .3s; } .k-ft1 .top a:hover { color: #fff; }
.k-ft1 .bot { display: flex; justify-content: space-between; align-items: center; padding: 18px 40px; border-top: 1px solid rgba(255,255,255,.08); font-size: 13px; }
.k-ft1 .soc { display: flex; gap: 6px; }
.k-ft1 .soc a { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 10px; border: 1px solid rgba(255,255,255,.12); cursor: pointer; transition: .3s; }
.k-ft1 .soc a:hover { background: #fff; color: #0f0d0b; }` },
      { id: 'foot-min', name: 'Minimal footer', bg: '#efe6d8', note: 'Single row for portfolios and agencies — logo, links, location line.',
        html: '<footer class="k-ft2">\n  <a class="logo">studio<b>kami</b></a>\n  <nav><a>Work</a><a>Studio</a><a>Journal</a><a>Contact</a></nav>\n  <span>Made in Rajshahi · 2026</span>\n</footer>',
        css: `.k-ft2 { width: 900px; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 26px 30px; border-radius: 4px;
  background: #fbf6ee; color: #1b1b22; font-family: 'Zen Kaku Gothic New', sans-serif; }
.k-ft2 .logo { font: 400 22px Georgia, serif; } .k-ft2 .logo b { font-weight: 700; color: #b8321f; }
.k-ft2 nav { display: flex; gap: 22px; font-size: 14px; }
.k-ft2 nav a { cursor: pointer; background: linear-gradient(#1b1b22, #1b1b22) 0 100% / 0 1.5px no-repeat; transition: background-size .4s; }
.k-ft2 nav a:hover { background-size: 100% 1.5px; }
.k-ft2 span { font: 500 12px 'JetBrains Mono', monospace; color: #7a7466; }` },
      { id: 'foot-manga', name: 'Manga “to be continued” footer', pad: '0', note: 'Ends the page like an episode: a huge slanted title, a stamp and a next-chapter arrow.',
        html: '<footer class="k-ft3">\n  <div class="big">To be<br>continued</div>\n  <span class="stamp">続</span>\n  <div class="row"><nav><a>Episodes</a><a>Characters</a><a>Merch</a><a>Contact</a></nav><a class="next">Next chapter ' + IC.arrow + '</a></div>\n</footer>',
        css: `.k-ft3 { position: relative; overflow: hidden; width: 900px; padding: 40px; background: #111; color: #fff; font-family: 'Shippori Mincho B1', sans-serif;
  background-image: radial-gradient(rgba(255,255,255,.1) 1px, transparent 1.3px); background-size: 9px 9px; }
.k-ft3 .big { font-weight: 900; font-size: 74px; line-height: .88; text-transform: uppercase; letter-spacing: -.04em; transform: skewX(-8deg); }
.k-ft3 .stamp { position: absolute; right: 50px; top: 40px; width: 90px; height: 90px; display: grid; place-items: center; font: 900 50px 'Shippori Mincho B1', serif;
  background: #e8112d; border: 4px solid #fff; transform: rotate(10deg); }
.k-ft3 .row { display: flex; justify-content: space-between; align-items: center; margin-top: 34px; padding-top: 20px; border-top: 3px solid #fff; }
.k-ft3 nav { display: flex; gap: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
.k-ft3 nav a { cursor: pointer; } .k-ft3 nav a:hover { color: #e8112d; }
.k-ft3 .next { display: inline-flex; align-items: center; gap: 10px; padding: 12px 18px; font-weight: 900; font-size: 12px; text-transform: uppercase;
  background: #fff; color: #111; box-shadow: 5px 5px 0 #e8112d; cursor: pointer; transition: .15s; }
.k-ft3 .next:hover { transform: translate(-2px, -2px); box-shadow: 8px 8px 0 #e8112d; }` }
    ] },

    /* ================================================================= */
    { cat: 'Loaders', jp: '待', icon: 'refresh', items: [
      { id: 'load-ring', name: 'Gradient ring', bg: BUTTON_BG, note: 'Conic gradient masked into a ring. 1s linear rotation.',
        html: '<div class="k-l1" role="status" aria-label="Loading"></div>',
        css: `.k-l1 { width: 56px; height: 56px; border-radius: 50%; background: conic-gradient(from 0deg, transparent, #e0442e);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 5px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 5px)); animation: k-l1 1s linear infinite; }
@keyframes k-l1 { to { transform: rotate(1turn); } }` },
      { id: 'load-dots', name: 'Bouncing dots', bg: BUTTON_BG, note: 'Three dots with staggered 150ms delays.',
        html: '<div class="k-l2" role="status" aria-label="Loading"><i></i><i></i><i></i></div>',
        css: `.k-l2 { display: flex; gap: 8px; }
.k-l2 i { width: 14px; height: 14px; border-radius: 50%; background: #6fb3a8; animation: k-l2 .9s ease-in-out infinite; }
.k-l2 i:nth-child(2) { animation-delay: .15s; background: #9483c2; } .k-l2 i:nth-child(3) { animation-delay: .3s; background: #e0442e; }
@keyframes k-l2 { 0%, 100% { transform: translateY(0); opacity: .5; } 50% { transform: translateY(-14px); opacity: 1; } }` },
      { id: 'load-bar', name: 'Indeterminate bar', bg: BUTTON_BG, note: 'A gradient segment that sweeps across the track forever.',
        html: '<div class="k-l3" role="progressbar" aria-label="Loading"><i></i></div>',
        css: `.k-l3 { position: relative; width: 220px; height: 6px; overflow: hidden; border-radius: 3px; background: rgba(255,255,255,.08); }
.k-l3 i { position: absolute; top: 0; bottom: 0; width: 40%; border-radius: 3px; background: linear-gradient(90deg, #e0442e, #9483c2); animation: k-l3 1.3s cubic-bezier(.65,0,.35,1) infinite; }
@keyframes k-l3 { from { left: -40%; } to { left: 100%; } }` },
      { id: 'load-shuriken', name: 'Shuriken spin', bg: BUTTON_BG, note: 'A throwing star that spins and wobbles — the site’s signature loader.',
        html: '<div class="k-l4" role="status" aria-label="Loading">' + IC.shuriken + '</div>',
        css: `.k-l4 { color: #efe4cc; filter: drop-shadow(0 0 12px rgba(224,68,46,.6)); animation: k-l4 .9s linear infinite; }
.k-l4 svg { display: block; }
@keyframes k-l4 { 0% { transform: rotate(0) scale(1); } 50% { transform: rotate(180deg) scale(.86); color: #e0442e; } 100% { transform: rotate(360deg) scale(1); } }` },
      { id: 'load-pulse', name: 'Radar pulse', bg: BUTTON_BG, note: 'Concentric rings expand and fade — great for “searching” or “listening” states.',
        html: '<div class="k-l5" role="status" aria-label="Searching"><i></i><i></i><b></b></div>',
        css: `.k-l5 { position: relative; width: 70px; height: 70px; display: grid; place-items: center; }
.k-l5 i { position: absolute; inset: 0; border-radius: 50%; border: 2px solid #6fb3a8; animation: k-l5 1.8s ease-out infinite; }
.k-l5 i:nth-child(2) { animation-delay: .9s; }
.k-l5 b { width: 16px; height: 16px; border-radius: 50%; background: #6fb3a8; box-shadow: 0 0 16px #6fb3a8; }
@keyframes k-l5 { from { transform: scale(.2); opacity: 1; } to { transform: scale(1); opacity: 0; } }` },
      { id: 'load-skeleton', name: 'Skeleton card', bg: BUTTON_BG, note: 'Content placeholder with a shimmer sweep, sized like the real card to avoid layout shift.',
        html: '<div class="k-l6" aria-hidden="true"><i class="img"></i><i class="t"></i><i class="t s"></i><div><i class="av"></i><i class="t xs"></i></div></div>',
        css: `.k-l6 { width: 250px; display: grid; gap: 10px; padding: 14px; border-radius: 18px; background: #13131c; border: 1px solid rgba(255,255,255,.06); }
.k-l6 i { display: block; height: 12px; border-radius: 6px; background: linear-gradient(90deg, #1d1d29 25%, #2a2a3a 50%, #1d1d29 75%); background-size: 200% 100%; animation: k-l6 1.4s linear infinite; }
.k-l6 .img { height: 130px; border-radius: 12px; } .k-l6 .s { width: 70%; } .k-l6 .xs { width: 50%; }
.k-l6 div { display: flex; align-items: center; gap: 10px; margin-top: 4px; } .k-l6 .av { width: 28px; height: 28px; border-radius: 50%; flex: none; }
@keyframes k-l6 { from { background-position: 200% 0; } to { background-position: -200% 0; } }` },
      { id: 'load-katana', name: 'Katana slash', bg: BUTTON_BG, note: 'Two blades cross and cut — a 1.2s anime slash loop.',
        html: '<div class="k-l7" role="status" aria-label="Loading"><i></i><i></i></div>',
        css: `.k-l7 { position: relative; width: 80px; height: 80px; }
.k-l7 i { position: absolute; left: 50%; top: 50%; width: 90px; height: 3px; margin: -1.5px 0 0 -45px; border-radius: 2px;
  background: linear-gradient(90deg, transparent, #fff 30%, #e0442e); box-shadow: 0 0 12px #e0442e; transform-origin: center; animation: k-l7 1.2s cubic-bezier(.77,0,.175,1) infinite; }
.k-l7 i:nth-child(2) { --r: -45deg; animation-delay: .3s; }
@keyframes k-l7 { 0% { transform: rotate(var(--r, 45deg)) scaleX(0); opacity: 0; } 40% { transform: rotate(var(--r, 45deg)) scaleX(1); opacity: 1; } 100% { transform: rotate(var(--r, 45deg)) scaleX(1) translateX(60px); opacity: 0; } }` },
      { id: 'load-glitch', name: 'Glitch text', bg: BUTTON_BG, note: 'RGB-split glitch using ::before/::after copies with clip-path slices.',
        html: '<div class="k-l8" data-t="LOADING" role="status">LOADING</div>',
        css: `.k-l8 { position: relative; font: 900 30px 'Shippori Mincho B1', sans-serif; letter-spacing: .08em; color: #efe4cc; }
.k-l8::before, .k-l8::after { content: attr(data-t); position: absolute; inset: 0; }
.k-l8::before { color: #e0442e; animation: k-l8 1.6s infinite steps(2); clip-path: inset(0 0 55% 0); }
.k-l8::after { color: #6fb3a8; animation: k-l8 1.3s infinite steps(2) reverse; clip-path: inset(55% 0 0 0); }
@keyframes k-l8 { 0% { transform: translate(0); } 25% { transform: translate(-3px, 1px); } 50% { transform: translate(3px, -1px); } 75% { transform: translate(-1px, 2px); } 100% { transform: translate(0); } }` }
    ] },

    /* ================================================================= */
    { cat: 'Feedback', jp: '報', icon: 'bell', items: [
      { id: 'fb-toasts', name: 'Toast notifications', note: 'Success and error toasts with a draining timer bar.',
        html: '<div class="k-t">\n  <div class="ok"><span>' + IC.check + '</span><div><b>Payment received</b><small>129.00 USDT · order KG-48211</small></div><i></i></div>\n  <div class="er"><span>' + IC.alert + '</span><div><b>Webhook failed</b><small>Retrying in 30s (attempt 2/5)</small></div><i></i></div>\n</div>',
        css: `.k-t { width: 360px; display: grid; gap: 10px; font-family: 'Zen Kaku Gothic New', sans-serif; color: #efe4cc; }
.k-t > div { position: relative; overflow: hidden; display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 14px;
  background: #16161f; border: 1px solid rgba(255,255,255,.1); box-shadow: 0 20px 40px -20px #000; animation: k-tin .6s cubic-bezier(.16,1,.3,1) both; }
.k-t > div:nth-child(2) { animation-delay: .15s; }
.k-t span { width: 34px; height: 34px; flex: none; display: grid; place-items: center; border-radius: 10px; }
.k-t .ok span { background: rgba(34,197,94,.15); color: #22c55e; } .k-t .er span { background: rgba(224,68,46,.15); color: #e0442e; }
.k-t b { display: block; font-size: 14px; } .k-t small { font-size: 12.5px; color: #857a68; }
.k-t i { position: absolute; left: 0; bottom: 0; height: 3px; width: 100%; transform-origin: left; animation: k-tbar 4s linear infinite; }
.k-t .ok i { background: #22c55e; } .k-t .er i { background: #e0442e; }
@keyframes k-tin { from { opacity: 0; transform: translateX(30px); } }
@keyframes k-tbar { from { transform: scaleX(1); } to { transform: scaleX(0); } }` },
      { id: 'fb-modal', name: 'Confirm dialog', bg: 'rgba(10,8,6,.9)', note: 'Destructive-action modal: icon, clear consequence, and the safe option first.',
        html: '<div class="k-m" role="dialog" aria-label="Delete project">\n  <span class="ic">' + IC.alert + '</span>\n  <h4>Delete this project?</h4>\n  <p>“Kage Store v2” and its 3 automations will be removed. This can’t be undone.</p>\n  <div class="a"><button class="c">Cancel</button><button class="d">Delete project</button></div>\n</div>',
        css: `.k-m { width: 400px; display: grid; justify-items: center; gap: 12px; padding: 30px 28px 24px; border-radius: 24px; background: #15151e;
  border: 1px solid rgba(255,255,255,.12); color: #efe4cc; font-family: 'Zen Kaku Gothic New', sans-serif; text-align: center; box-shadow: 0 40px 80px -30px #000;
  animation: k-min .5s cubic-bezier(.16,1,.3,1); }
@keyframes k-min { from { opacity: 0; transform: translateY(20px) scale(.96); } }
.k-m .ic { width: 56px; height: 56px; display: grid; place-items: center; border-radius: 18px; background: rgba(224,68,46,.15); color: #e0442e; }
.k-m h4 { margin: 6px 0 0; font: 800 20px 'Shippori Mincho B1', sans-serif; } .k-m p { margin: 0; font-size: 14px; color: #bfb29a; line-height: 1.55; }
.k-m .a { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; margin-top: 10px; }
.k-m button { height: 46px; border-radius: 12px; font: 700 14px 'Zen Kaku Gothic New', sans-serif; cursor: pointer; }
.k-m .c { border: 1px solid rgba(255,255,255,.16); background: none; color: #fff; }
.k-m .d { border: 0; background: #e0442e; color: #fff; }` },
      { id: 'fb-alerts', name: 'Inline alerts', note: 'Info, warning and success banners with icons and a left accent bar.',
        html: '<div class="k-al">\n  <div class="i">' + IC.info + '<p><b>Heads up:</b> your domain renews in 7 days.</p></div>\n  <div class="w">' + IC.alert + '<p><b>Low stock:</b> Oni LED Mask has 3 units left.</p></div>\n  <div class="s">' + IC.check + '<p><b>Deployed:</b> v2.4.0 is live on production.</p></div>\n</div>',
        css: `.k-al { width: 440px; display: grid; gap: 10px; font-family: 'Zen Kaku Gothic New', sans-serif; }
.k-al div { display: flex; align-items: center; gap: 12px; padding: 13px 16px; border-radius: 12px; border-left: 4px solid; font-size: 14px; }
.k-al p { margin: 0; color: #e6e3ee; } .k-al b { color: #fff; }
.k-al .i { background: rgba(111,179,168,.08); border-color: #6fb3a8; color: #6fb3a8; }
.k-al .w { background: rgba(217,164,65,.08); border-color: #d9a441; color: #d9a441; }
.k-al .s { background: rgba(34,197,94,.08); border-color: #22c55e; color: #22c55e; }` }
    ] }
  ];
})();
