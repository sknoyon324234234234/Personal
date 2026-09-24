/* XIRAIYA — Dev World: terminal, playground, toolbox, API console, git tower */
(function () {
  'use strict';
  var XR = window.XR;
  if (!XR) return;
  var $ = XR.$, $$ = XR.$$, esc = XR.esc, icon = XR.icon, C = XR.config || {};
  var quest = function (id) { if (XR.quest) XR.quest(id); };
  var YEARS = (C.experienceYears || 5), AGE = C.age || 21, CITY = (C.city || 'Rajshahi') + ', ' + (C.country || 'Bangladesh');

  /* ================= map ================= */
  $$('.bld').forEach(function (b) {
    var go = function () { var t = document.getElementById(b.getAttribute('data-go')); if (t) t.scrollIntoView({ behavior: XR.reduce ? 'auto' : 'smooth', block: 'start' }); };
    b.addEventListener('click', go);
    b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  var map = $('.wd-map');
  if (map && (!XR.fine || XR.phone)) map.classList.add('hint');

  /* ================= terminal ================= */
  var out = $('#termOut'), inp = $('#termI'), form = $('#termF');
  var hist = [], hp = 0;
  var FILES = {
    'about.txt': function () { return 'Hi, I am ' + esc(C.name || 'Xiraiya') + '. ' + AGE + ' years old, ' + YEARS + ' years of shipping code, based in ' + esc(CITY) + '.\nI build websites, automations, Telegram bots, Chrome extensions,\nMinecraft plugins, desktop and Android apps, and AI agents.\nFavourite bug: the one that only happens on Fridays.'; },
    'skills.json': function () { return json({ frontend: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js'], backend: ['Node.js', 'Python', 'FastAPI', 'PostgreSQL', 'Redis'], bots: ['Telegram Bot API', 'Discord.js', 'n8n', 'Puppeteer'], games: ['Java', 'Paper/Spigot', 'Kotlin'], apps: ['Electron', 'Tauri', 'Android (Kotlin)', 'Flutter'], ai: ['OpenAI', 'Claude', 'LangChain', 'RAG', 'tool calling'] }); },
    'projects.md': function () { return '<span class="t-hd"># Selected projects</span>\n- Nova AI            SaaS landing page        <a href="demos.html#preview=nova-saas">open</a>\n- Ledger             banking dashboard        <a href="demos.html#preview=ledger">open</a>\n- BlockRealm         playable Minecraft demo  <a href="showcase.html#minecraft">open</a>\n- Pages Studio       live page builder        <a href="pages.html">open</a>\n- 40+ bots and automations running for real clients'; },
    'services.md': function () { return '<span class="t-hd"># What I build</span>\n' + (XR.services || []).map(function (s) { return '- ' + pad(s.name, 26) + '<span class="t-dim">from</span> <span class="t-grn">' + esc(XR.fmtPrice(s.priceFrom)) + '</span>'; }).join('\n'); },
    'contact.txt': function () { var c = C.contact || {}; return 'email     ' + esc(c.email || 'see the Hire page') + '\ntelegram  ' + (c.telegram ? '@' + esc(c.telegram) : 'see the Hire page') + '\nform      <a href="hire.html">hire.html</a>'; },
    '.secrets': function () { return '<span class="t-yel">up up down down left right left right b a</span>\n<span class="t-dim">(you did not hear it from me)</span>'; },
    'todo.txt': function () { return '[x] learn to code\n[x] ship 120 projects\n[x] make a toad the company mascot\n[ ] sleep\n[ ] build your project  <span class="t-dim">&lt;- this one is up to you</span>'; }
  };
  function pad(s, n) { s = String(s); while (s.length < n) s += ' '; return esc(s); }
  function json(o) { return hl(JSON.stringify(o, null, 2)); }
  var JOKES = ['Why do programmers prefer dark mode? Because light attracts bugs.', 'I would tell you a UDP joke, but you might not get it.', 'There are 10 kinds of people: those who read binary and those who do not.', 'A SQL query walks into a bar, walks up to two tables and asks: may I join you?', 'It works on my machine. Then we will ship your machine.', 'The toad asked for a code review. Now it is a frog. Refactoring is powerful.'];
  var CMDS = {
    help: function () {
      return '<span class="t-hd">Village commands</span>\n' + [['about', 'who lives here'], ['skills', 'the tech stack'], ['projects', 'things I shipped'], ['services', 'what you can hire me for'], ['contact', 'how to reach me'], ['ls / cat <file>', 'read the files'], ['open <page>', 'lab, shop, demos, pages, hire...'], ['neofetch', 'system info, toad edition'], ['git log', 'my career, in commits'], ['sudo hire-me', 'the fastest way to start'], ['joke / fortune', 'morale boosters'], ['theme', 'paper or ink mode'], ['quests', 'your quest progress'], ['history / clear', 'the usual']].map(function (x) { return '  <span class="t-grn">' + pad(x[0], 18) + '</span><span class="t-dim">' + x[1] + '</span>'; }).join('\n') + '\n<span class="t-dim">Tip: Tab autocompletes, arrow keys walk through history.</span>';
    },
    about: function () { return FILES['about.txt'](); },
    whoami: function () { return 'guest <span class="t-dim">(but you could be a client)</span>'; },
    skills: function () { return FILES['skills.json'](); },
    stack: function () { return FILES['skills.json'](); },
    projects: function () { return FILES['projects.md'](); },
    services: function () { return FILES['services.md'](); },
    contact: function () { return FILES['contact.txt'](); },
    hire: function () { setTimeout(function () { location.href = 'hire.html'; }, 900); return '<span class="t-grn">Opening the Hire page...</span>'; },
    ls: function (a) { var all = a[0] === '-a' || a[0] === '-la'; return Object.keys(FILES).filter(function (f) { return all || f[0] !== '.'; }).map(function (f) { return /\.(json)$/.test(f) ? '<span class="t-yel">' + f + '</span>' : f[0] === '.' ? '<span class="t-dim">' + f + '</span>' : '<span class="t-blu">' + f + '</span>'; }).join('  '); },
    cat: function (a) { if (!a[0]) return '<span class="t-red">cat: missing file name.</span> Try <span class="t-grn">cat about.txt</span>'; var f = FILES[a[0]]; return f ? f() : '<span class="t-red">cat: ' + esc(a[0]) + ': No such file.</span> Run <span class="t-grn">ls</span> to see what is here.'; },
    open: function (a) {
      var map2 = { home: 'index.html', lab: 'showcase.html', shop: 'shop.html', kit: 'components.html', demos: 'demos.html', pages: 'pages.html', academy: 'tutorials.html', hire: 'hire.html', minecraft: 'showcase.html#minecraft' };
      var t = map2[(a[0] || '').toLowerCase()];
      if (!t) return 'open what? Try: ' + Object.keys(map2).map(function (k) { return '<span class="t-grn">' + k + '</span>'; }).join(', ');
      setTimeout(function () { location.href = t; }, 700); return 'Opening <a href="' + t + '">' + t + '</a>...';
    },
    neofetch: function () {
      var art = ['<span class="t-grn">     (o)____(o)   </span>', '<span class="t-grn">    /  .    .  \\  </span>', '<span class="t-grn">   (   \\____/   ) </span>', '<span class="t-grn">    \\__________/  </span>', '<span class="t-grn">    _/  |  |  \\_  </span>', '<span class="t-grn">   (___/    \\___) </span>', '', ''];
      var info = ['<span class="t-hd">guest@xiraiya-village</span>', '<span class="t-dim">---------------------</span>', '<span class="t-blu">OS</span>: VillageOS 26.9 (ukiyo-e)', '<span class="t-blu">Host</span>: ' + esc(CITY), '<span class="t-blu">Uptime</span>: ' + YEARS + ' years, 0 regrets', '<span class="t-blu">Shell</span>: toadsh 5.0', '<span class="t-blu">Projects</span>: ' + ((C.stats && C.stats.projects) || 120) + ' shipped', '<span class="t-blu">Theme</span>: ' + (document.documentElement.getAttribute('data-mode') === 'ink' ? 'Ink' : 'Paper')];
      return art.map(function (l, i) { return l + '  ' + (info[i] || ''); }).join('\n') + '\n                    <span style="background:#c4321d">   </span><span style="background:#2c6f65">   </span><span style="background:#7f5a17">   </span><span style="background:#5f4f95">   </span><span style="background:#efe4cc">   </span>';
    },
    git: function (a) {
      if (a[0] !== 'log') return 'usage: <span class="t-grn">git log</span> <span class="t-dim">(the rest of git is on my laptop)</span>';
      return COMMITS.slice().reverse().slice(0, 8).map(function (c) { return '<span class="t-yel">' + c.h + '</span> ' + (c.tag ? '<span class="t-mag">(' + c.tag + ')</span> ' : '') + esc(c.m) + ' <span class="t-dim">' + c.y + '</span>'; }).join('\n') + '\n<span class="t-dim">...and more in the Git Tower below.</span>';
    },
    sudo: function (a) {
      if (a.join(' ') === 'hire-me' || a.join(' ') === 'hire me') { setTimeout(function () { location.href = 'hire.html#configure'; }, 1600); return '[sudo] password for guest: ********\n<span class="t-grn">Access granted.</span> Summoning the toad sage...\nOpening the price configurator.'; }
      if (/^rm/.test(a[0] || '')) return '<span class="t-red">Nice try.</span> The toad has disabled self-destruct.';
      return '[sudo] password for guest: ********\n<span class="t-red">guest is not in the sudoers file.</span> This incident will be reported to the toad.';
    },
    rm: function (a) { return a.join(' ').indexOf('-rf') > -1 ? '<span class="t-red">Absolutely not.</span> The village has backups and a very angry toad.' : 'rm: this is a read-only village.'; },
    date: function () { return new Date().toString(); },
    echo: function (a) { return esc(a.join(' ')); },
    joke: function () { return JOKES[Math.floor(Math.random() * JOKES.length)]; },
    fortune: function () { return ['You will fix the bug in the last place you look. Obviously.', 'A great client is about to message you.', 'Your next deploy will be green on the first try.', 'Beware of any function named handleStuff.'][Math.floor(Math.random() * 4)]; },
    history: function () { return hist.map(function (h, i) { return '<span class="t-dim">' + pad(i + 1, 4) + '</span>' + esc(h); }).join('\n') || 'No history yet.'; },
    theme: function () { var b = $('[data-mode-toggle]'); if (b) b.click(); return 'Theme switched. <span class="t-dim">(the terminal stays dark, it has standards)</span>'; },
    quests: function () {
      var st = XR.store('xr-quests') || {}, n = Object.keys(st).length;
      return 'Quests completed: <span class="t-grn">' + n + '</span>. Open the Command Center with <span class="t-yel">Ctrl K</span> to see them all.';
    },
    ping: function (a) { var h = a[0] || 'xiraiya.dev'; return [0, 1, 2].map(function (i) { return '64 bytes from ' + esc(h) + ': icmp_seq=' + i + ' time=' + (12 + Math.round(Math.random() * 20)) + ' ms'; }).join('\n') + '\n<span class="t-grn">3 packets, 0% loss.</span> The village is online.'; },
    exit: function () { return 'You cannot leave the village. It is too comfy here.'; },
    npm: function (a) { return a[0] === 'install' || a[0] === 'i' ? 'added 1,337 packages in 0.4s\n<span class="t-yel">found 0 vulnerabilities</span> <span class="t-dim">(the toad audited them)</span>' : 'npm ' + esc(a.join(' ')) + ': try <span class="t-grn">npm install</span>'; },
    coffee: function () { return 'The village runs on tea. Brewing a cup of sencha... <span class="t-grn">done</span>. Energy +20.'; },
    tea: function () { return CMDS.coffee(); },
    matrix: function () { rain(); return 'Wake up, developer...'; },
    clear: function () { out.innerHTML = ''; return null; }
  };
  var ALIASES = { '?': 'help', man: 'help', cls: 'clear', dir: 'ls', 'hire-me': 'hire' };
  function print(html, cls) { var d = document.createElement('div'); d.className = 'ln' + (cls ? ' ' + cls : ''); d.innerHTML = html; out.appendChild(d); out.scrollTop = out.scrollHeight; }
  function run(line) {
    line = line.trim();
    print('<b>guest</b>@village <em>~</em> $ ' + esc(line), 'cmd');
    if (!line) return;
    hist.push(line); hp = hist.length;
    var parts = line.split(/\s+/), c = parts[0].toLowerCase(), args = parts.slice(1);
    c = ALIASES[c] || c;
    var fn = CMDS[c];
    if (!fn) { print('<span class="t-red">command not found: ' + esc(parts[0]) + '</span>. Type <span class="t-grn">help</span> for the list.'); return; }
    var r = fn(args);
    if (r != null) print(r);
    quest('world-terminal');
  }
  if (form) {
    print('<span class="t-hd">Welcome to the village terminal.</span> <span class="t-dim">VillageOS 26.9 · toadsh 5.0</span>\nType <span class="t-grn">help</span> to see what I can do, or click a chip below.');
    form.addEventListener('submit', function (e) { e.preventDefault(); run(inp.value); inp.value = ''; });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowUp') { e.preventDefault(); if (hp > 0) { hp--; inp.value = hist[hp]; } }
      else if (e.key === 'ArrowDown') { e.preventDefault(); if (hp < hist.length - 1) { hp++; inp.value = hist[hp]; } else { hp = hist.length; inp.value = ''; } }
      else if (e.key === 'Tab') {
        e.preventDefault();
        var v = inp.value, parts = v.split(' '), last = parts[parts.length - 1], pool = parts.length > 1 ? Object.keys(FILES).concat(['hire-me', 'log', 'lab', 'shop', 'demos', 'pages', 'hire', 'academy']) : Object.keys(CMDS);
        var m = pool.filter(function (x) { return x.indexOf(last) === 0; });
        if (m.length === 1) { parts[parts.length - 1] = m[0]; inp.value = parts.join(' ') + ' '; }
        else if (m.length > 1) print(m.join('  '), 't-dim');
      } else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); out.innerHTML = ''; }
    });
    $('.term').addEventListener('click', function (e) { if (!e.target.closest('a,button') && !window.getSelection().toString()) inp.focus({ preventScroll: true }); });
    $('.term-x').addEventListener('click', function () { out.innerHTML = ''; inp.focus(); });
    $('#termChips').innerHTML = ['help', 'about', 'neofetch', 'ls', 'cat todo.txt', 'git log', 'joke', 'sudo hire-me'].map(function (c) { return '<button type="button" data-run="' + c + '">' + c + '</button>'; }).join('');
    $('#termChips').addEventListener('click', function (e) { var b = e.target.closest('[data-run]'); if (b) { run(b.getAttribute('data-run')); inp.focus({ preventScroll: true }); } });
  }
  function rain() {
    if (XR.reduce) return;
    var cv = document.createElement('canvas'); cv.className = 't-rain'; document.body.appendChild(cv);
    var W = cv.width = innerWidth, H = cv.height = innerHeight, x = cv.getContext('2d'), cols = Math.floor(W / 18), ys = [], t0 = performance.now();
    for (var i = 0; i < cols; i++) ys[i] = Math.random() * -H;
    var chars = '児雷也開発忍術里蛙01<>{}=/;';
    (function f(t) {
      x.fillStyle = 'rgba(15,13,11,.14)'; x.fillRect(0, 0, W, H);
      x.font = '16px JetBrains Mono, monospace';
      for (var i = 0; i < cols; i++) { x.fillStyle = Math.random() > .9 ? '#f06a52' : '#7ee787'; x.fillText(chars[Math.floor(Math.random() * chars.length)], i * 18, ys[i]); ys[i] = ys[i] > H + Math.random() * 400 ? 0 : ys[i] + 18; }
      if (t - t0 < 3200) requestAnimationFrame(f); else { cv.style.transition = 'opacity .6s'; cv.style.opacity = 0; setTimeout(function () { cv.remove(); }, 700); }
    })(t0);
  }

  /* ================= playground ================= */
  var PRESETS = {
    'Hover button': {
      html: '<button class="btn">Hover me</button>\n<p>Move your mouse over the button.</p>',
      css: 'body{display:grid;place-items:center;min-height:100vh;margin:0;font-family:system-ui;background:#f6f1e7;color:#1f1813}\n.btn{position:relative;overflow:hidden;padding:16px 34px;border:0;border-radius:999px;background:#1f1813;color:#fff;font-size:16px;font-weight:600;cursor:pointer;isolation:isolate}\n.btn::before{content:"";position:absolute;inset:0;z-index:-1;background:#c4321d;border-radius:inherit;transform:scale(0);transition:transform .5s cubic-bezier(.2,.8,.2,1)}\n.btn:hover::before{transform:scale(1)}\np{color:#6b604f}',
      js: "document.querySelector('.btn').addEventListener('click', () => {\n  console.log('Clicked at', new Date().toLocaleTimeString())\n})"
    },
    'Typing effect': {
      html: '<h1><span id="t"></span><i>|</i></h1>',
      css: 'body{display:grid;place-items:center;min-height:100vh;margin:0;background:#0f0d0b;color:#efe4cc;font-family:Georgia,serif}\nh1{font-size:42px;font-weight:400}\ni{color:#f06a52;animation:b 1s steps(1) infinite;font-style:normal}\n@keyframes b{50%{opacity:0}}',
      js: "const words = ['websites.', 'Telegram bots.', 'AI agents.', 'Minecraft plugins.']\nconst el = document.getElementById('t')\nlet w = 0, i = 0, del = false\nfunction tick() {\n  const word = 'I build ' + words[w]\n  el.textContent = word.slice(0, i)\n  if (!del && i === word.length) { del = true; setTimeout(tick, 1200); return }\n  if (del && i === 8) { del = false; w = (w + 1) % words.length }\n  i += del ? -1 : 1\n  setTimeout(tick, del ? 40 : 80)\n}\ntick()\nconsole.log('Typing', words.length, 'words')"
    },
    'Glass card': {
      html: '<div class="card">\n  <small>Balance</small>\n  <b>$48,259</b>\n  <span>+12.4% this month</span>\n</div>',
      css: 'body{display:grid;place-items:center;min-height:100vh;margin:0;font-family:system-ui;background:radial-gradient(circle at 20% 20%,#c4321d,transparent 40%),radial-gradient(circle at 80% 80%,#2c6f65,transparent 45%),#1f1813}\n.card{display:grid;gap:6px;width:260px;padding:26px;border-radius:24px;color:#fff;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);backdrop-filter:blur(16px);box-shadow:0 30px 60px -20px rgba(0,0,0,.5);transition:transform .4s}\n.card:hover{transform:translateY(-6px) rotate(-1deg)}\nb{font-size:36px}\nspan{color:#a9e4b0}',
      js: "console.log('Hover the card')"
    },
    'Confetti': {
      html: '<button id="go">Celebrate</button>\n<canvas id="c"></canvas>',
      css: 'body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f6f1e7;font-family:system-ui;overflow:hidden}\ncanvas{position:fixed;inset:0;pointer-events:none}\nbutton{padding:16px 30px;border:0;border-radius:14px;background:#c4321d;color:#fff;font-size:17px;font-weight:700;cursor:pointer;box-shadow:0 6px 0 #8a2213}\nbutton:active{transform:translateY(6px);box-shadow:none}',
      js: "const c = document.getElementById('c'), x = c.getContext('2d')\nc.width = innerWidth; c.height = innerHeight\nlet bits = []\ndocument.getElementById('go').onclick = () => {\n  for (let i = 0; i < 160; i++) bits.push({ x: innerWidth / 2, y: innerHeight / 2, vx: (Math.random() - .5) * 14, vy: Math.random() * -16 - 4, c: ['#c4321d','#2c6f65','#f2b441','#5f4f95'][i % 4], r: Math.random() * 6 + 3 })\n  console.log('Launched', bits.length, 'pieces')\n}\n;(function loop() {\n  x.clearRect(0, 0, c.width, c.height)\n  bits.forEach(b => { b.vy += .45; b.x += b.vx; b.y += b.vy; x.fillStyle = b.c; x.fillRect(b.x, b.y, b.r, b.r * 1.6) })\n  bits = bits.filter(b => b.y < innerHeight + 20)\n  requestAnimationFrame(loop)\n})()"
    },
    'Loader': {
      html: '<div class="enso"></div>\n<p>Loading the village...</p>',
      css: 'body{display:grid;place-items:center;align-content:center;gap:18px;min-height:100vh;margin:0;background:#f6f1e7;font-family:system-ui;color:#6b604f}\n.enso{width:90px;height:90px;border-radius:50%;border:7px solid #1f1813;border-right-color:transparent;border-top-color:rgba(31,24,19,.5);animation:s 1.1s cubic-bezier(.6,.2,.4,.8) infinite}\n@keyframes s{to{transform:rotate(1turn)}}',
      js: "let n = 0\nconst id = setInterval(() => { n += 25; console.log('Loaded', n + '%'); if (n >= 100) clearInterval(id) }, 500)"
    },
    'Blank': { html: '<h1>Hello, village</h1>', css: 'body{font-family:system-ui;padding:24px}', js: "console.log('Ready')" }
  };
  var pgCode = $('#pgCode');
  if (pgCode) {
    var PGKEY = 'xr-world-pg', lang = 'html', code = XR.store(PGKEY) || JSON.parse(JSON.stringify(PRESETS['Hover button']));
    var frameEl = $('#pgFrame'), log = $('#pgLog'), gut = $('#pgGut'), autoRun = $('#pgAuto'), runT;
    $('#pgPreset').innerHTML = '<option value="">Choose...</option>' + Object.keys(PRESETS).map(function (k) { return '<option>' + k + '</option>'; }).join('');
    var HOOK = '<script>(function(){var s=function(t,a){try{parent.postMessage({pg:1,t:t,m:[].map.call(a,function(x){try{return typeof x==="object"?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(" ")},"*")}catch(e){}};["log","info","warn","error"].forEach(function(k){var o=console[k];console[k]=function(){s(k,arguments);o.apply(console,arguments)}});window.onerror=function(m,u,l){s("error",[m+" (line "+l+")"])}})();<\/script>';
    var doc = function (withHook) { return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + (withHook ? HOOK : '') + '<style>' + code.css + '</style></head><body>' + code.html + '<script>' + code.js.replace(/<\/script/gi, '<\\/script') + '<\/script></body></html>'; };
    var gutter = function () { var n = pgCode.value.split('\n').length, s = ''; for (var i = 1; i <= n; i++) s += i + '\n'; gut.textContent = s; };
    var show = function () { pgCode.value = code[lang]; gutter(); pgCode.scrollTop = 0; gut.scrollTop = 0; };
    var runPg = function () { log.innerHTML = '<div class="dim">Ran at ' + new Date().toLocaleTimeString() + '</div>'; frameEl.srcdoc = doc(true); XR.store(PGKEY, code); };
    show(); runPg();
    $$('.pg-tabs [data-lang]').forEach(function (b) { b.addEventListener('click', function () { lang = b.getAttribute('data-lang'); $$('.pg-tabs [data-lang]').forEach(function (x) { x.setAttribute('aria-selected', x === b); }); show(); pgCode.focus(); }); });
    pgCode.addEventListener('input', function () { code[lang] = pgCode.value; gutter(); if (autoRun.checked) { clearTimeout(runT); runT = setTimeout(runPg, 600); } });
    pgCode.addEventListener('scroll', function () { gut.scrollTop = pgCode.scrollTop; });
    pgCode.addEventListener('keydown', function (e) {
      if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); var s = pgCode.selectionStart, en = pgCode.selectionEnd; pgCode.setRangeText('  ', s, en, 'end'); pgCode.dispatchEvent(new Event('input')); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runPg(); }
    });
    $('#pgRun').addEventListener('click', runPg);
    $('#pgPreset').addEventListener('change', function () { var p = PRESETS[this.value]; if (!p) return; code = JSON.parse(JSON.stringify(p)); show(); runPg(); XR.toast('Loaded preset: ' + this.value); this.value = ''; });
    $('#pgClr').addEventListener('click', function () { log.innerHTML = ''; });
    $('#pgOpen').addEventListener('click', function () { var w = window.open('', '_blank'); if (w) { w.document.open(); w.document.write(doc(false)); w.document.close(); } });
    $('#pgCopy').addEventListener('click', function () { XR.copy(doc(false)); XR.toast('Copied as one HTML file.'); });
    window.addEventListener('message', function (e) {
      if (!e.data || !e.data.pg || e.source !== frameEl.contentWindow) return;
      var d = document.createElement('div'); d.className = e.data.t === 'error' ? 'err' : e.data.t === 'warn' ? 'warn' : '';
      d.textContent = (e.data.t === 'error' ? 'Error: ' : '') + e.data.m; log.appendChild(d); log.scrollTop = log.scrollHeight;
      while (log.children.length > 200) log.removeChild(log.firstChild);
    });
  }

  /* ================= toolbox ================= */
  function hl(s) { return esc(s).replace(/(&quot;(?:[^&]|&(?!quot;))*?&quot;)(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/gi, function (m, str, colon, lit, num) { if (str) return colon ? '<span class="k">' + str + '</span>' + colon : '<span class="s">' + str + '</span>'; if (lit) return '<span class="b">' + lit + '</span>'; return '<span class="n">' + num + '</span>'; }); }
  function b64e(s) { return btoa(unescape(encodeURIComponent(s))); }
  function b64d(s) { return decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '')))); }
  function rnd(n) { var a = new Uint32Array(n); (window.crypto || window.msCrypto).getRandomValues(a); return a; }
  function uuid() { if (crypto.randomUUID) return crypto.randomUUID(); var b = new Uint8Array(16); crypto.getRandomValues(b); b[6] = b[6] & 15 | 64; b[8] = b[8] & 63 | 128; var h = [].map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20); }
  function hex2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); var n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function rgb2hex(r) { return '#' + r.map(function (v) { return ('0' + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2); }).join(''); }
  function rgb2hsl(r) { var R = r[0] / 255, G = r[1] / 255, B = r[2] / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), h = 0, s = 0, l = (mx + mn) / 2, d = mx - mn; if (d) { s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === R ? (G - B) / d + (G < B ? 6 : 0) : mx === G ? (B - R) / d + 2 : (R - G) / d + 4; h *= 60; } return [Math.round(h), Math.round(s * 100), Math.round(l * 100)]; }
  function lum(r) { var c = r.map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
  function cr(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  function mix(a, b, t) { return a.map(function (v, i) { return v + (b[i] - v) * t; }); }
  var SAMPLE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + b64e(JSON.stringify({ sub: '42', name: 'Village Guest', role: 'client', iat: 1758700800, exp: 1893456000 })).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_') + '.dG9hZC1zYWdlLXNpZ25hdHVyZQ';

  var TOOLS = [
    { id: 'json', name: 'JSON formatter', ic: 'code', ui: '<h3 class="h4">JSON formatter</h3><p>Paste JSON to format, minify or validate it. Errors point to the exact spot.</p><textarea class="tl-area" id="tj" spellcheck="false">{"name":"Xiraiya","skills":["bots","web","ai"],"available":true,"projects":120}</textarea><div class="tl-row"><button type="button" class="tl-btn pri" data-a="fmt">Format</button><button type="button" class="tl-btn" data-a="min">Minify</button><button type="button" class="tl-btn" data-a="copy">Copy result</button></div><div class="tl-msg" id="tjm"></div><pre class="tl-out" id="tjo"></pre>',
      init: function (p) {
        var go = function (mode) { var v = $('#tj', p).value, m = $('#tjm', p); try { var o = JSON.parse(v), s = mode === 'min' ? JSON.stringify(o) : JSON.stringify(o, null, 2); $('#tjo', p).innerHTML = hl(s); $('#tjo', p).dataset.raw = s; m.className = 'tl-msg ok'; m.textContent = 'Valid JSON · ' + s.length + ' characters · ' + (Array.isArray(o) ? 'array of ' + o.length : typeof o === 'object' && o ? Object.keys(o).length + ' keys' : typeof o); } catch (e) { m.className = 'tl-msg bad'; m.textContent = e.message; $('#tjo', p).textContent = ''; } };
        p.addEventListener('click', function (e) { var a = e.target.getAttribute('data-a'); if (a === 'copy') { XR.copy($('#tjo', p).dataset.raw || ''); XR.toast('Copied'); } else if (a) go(a); });
        $('#tj', p).addEventListener('input', function () { go('fmt'); }); go('fmt');
      } },
    { id: 'regex', name: 'Regex tester', ic: 'search', ui: '<h3 class="h4">Regex tester</h3><p>Matches highlight live. Groups are listed below.</p><div class="tl-row"><input class="tl-in" id="rp" value="(\\w+)@(\\w+)\\.com" spellcheck="false" aria-label="Pattern" style="flex:3"><input class="tl-in" id="rf" value="g" spellcheck="false" aria-label="Flags" style="flex:1;min-width:70px"></div><textarea class="tl-area" id="rt" spellcheck="false">Write to hello@lumen.com or sales@kitefin.com.\nNot an email: toad@pond</textarea><div class="tl-msg" id="rm"></div><pre class="tl-out" id="ro"></pre>',
      init: function (p) {
        var go = function () { var m = $('#rm', p), o = $('#ro', p), txt = $('#rt', p).value; try { var f = $('#rf', p).value.replace(/[^gimsuy]/g, ''); if (f.indexOf('g') < 0) f += 'g'; var re = new RegExp($('#rp', p).value, f), n = 0, groups = [], last = 0, h = ''; txt.replace(re, function () { var a = arguments, i = a[a.length - 2]; if (typeof a[a.length - 1] === 'object') i = a[a.length - 3]; h += esc(txt.slice(last, i)) + '<mark>' + esc(a[0]) + '</mark>'; last = i + a[0].length; n++; var g = [].slice.call(a, 1, typeof a[a.length - 1] === 'object' ? -3 : -2); if (g.length) groups.push(g); return a[0]; }); h += esc(txt.slice(last)); o.innerHTML = h + (groups.length ? '\n\n' + groups.map(function (g, i) { return '<span class="k">match ' + (i + 1) + '</span>  ' + g.map(function (x, j) { return '$' + (j + 1) + '=<span class="s">' + esc(x == null ? '' : x) + '</span>'; }).join('  '); }).join('\n') : ''); m.className = 'tl-msg ' + (n ? 'ok' : ''); m.textContent = n + ' match' + (n === 1 ? '' : 'es'); } catch (e) { m.className = 'tl-msg bad'; m.textContent = e.message; o.textContent = txt; } };
        ['#rp', '#rf', '#rt'].forEach(function (s) { $(s, p).addEventListener('input', go); }); go();
      } },
    { id: 'b64', name: 'Base64', ic: 'box', ui: '<h3 class="h4">Base64 encode and decode</h3><p>UTF-8 safe, so emoji-free Bangla text works too: আমি কোড লিখি.</p><textarea class="tl-area" id="bi" spellcheck="false">Hello from Rajshahi</textarea><div class="tl-row"><button type="button" class="tl-btn pri" data-a="e">Encode</button><button type="button" class="tl-btn" data-a="d">Decode</button><button type="button" class="tl-btn" data-a="s">Swap</button><button type="button" class="tl-btn" data-a="c">Copy result</button></div><div class="tl-msg" id="bm"></div><pre class="tl-out" id="bo"></pre>',
      init: function (p) { p.addEventListener('click', function (e) { var a = e.target.getAttribute('data-a'), o = $('#bo', p), m = $('#bm', p); if (!a) return; if (a === 'c') { XR.copy(o.textContent); XR.toast('Copied'); return; } if (a === 's') { $('#bi', p).value = o.textContent; return; } try { o.textContent = a === 'e' ? b64e($('#bi', p).value) : b64d($('#bi', p).value); m.className = 'tl-msg ok'; m.textContent = (a === 'e' ? 'Encoded' : 'Decoded') + ' · ' + o.textContent.length + ' characters'; } catch (err) { m.className = 'tl-msg bad'; m.textContent = 'That is not valid Base64.'; } }); $('[data-a="e"]', p).click(); } },
    { id: 'uuid', name: 'UUID generator', ic: 'hash', ui: '<h3 class="h4">UUID v4 generator</h3><p>Cryptographically random IDs from your browser.</p><div class="tl-row"><label class="tl-range">How many <input type="range" id="un" min="1" max="20" value="5"><b id="unv">5</b></label><button type="button" class="tl-btn pri" data-a="g">Generate</button><button type="button" class="tl-btn" data-a="c">Copy all</button></div><pre class="tl-out" id="uo"></pre>',
      init: function (p) { var g = function () { var n = +$('#un', p).value, a = []; for (var i = 0; i < n; i++) a.push(uuid()); $('#uo', p).textContent = a.join('\n'); }; $('#un', p).addEventListener('input', function () { $('#unv', p).textContent = this.value; g(); }); p.addEventListener('click', function (e) { var a = e.target.getAttribute('data-a'); if (a === 'g') g(); if (a === 'c') { XR.copy($('#uo', p).textContent); XR.toast('Copied ' + $('#un', p).value + ' UUIDs'); } }); g(); } },
    { id: 'pw', name: 'Password generator', ic: 'key', ui: '<h3 class="h4">Password generator</h3><p>Strong, random and never sent anywhere.</p><div class="tl-row"><label class="tl-range">Length <input type="range" id="pl" min="8" max="64" value="20"><b id="plv">20</b></label></div><div class="tl-row"><label class="tl-chk"><input type="checkbox" id="pu" checked>A-Z</label><label class="tl-chk"><input type="checkbox" id="pd" checked>a-z</label><label class="tl-chk"><input type="checkbox" id="pn" checked>0-9</label><label class="tl-chk"><input type="checkbox" id="ps" checked>!@#$</label><label class="tl-chk"><input type="checkbox" id="pa">No look-alikes</label></div><pre class="tl-out" id="po" style="font-size:17px;letter-spacing:.04em"></pre><div class="pw-meter"><i id="pm"></i></div><div class="tl-row"><span class="tl-msg" id="pmt" style="margin:0;flex:1"></span><button type="button" class="tl-btn" data-a="g">New password</button><button type="button" class="tl-btn pri" data-a="c">Copy</button></div>',
      init: function (p) {
        var g = function () { var sets = ''; if ($('#pu', p).checked) sets += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; if ($('#pd', p).checked) sets += 'abcdefghijklmnopqrstuvwxyz'; if ($('#pn', p).checked) sets += '0123456789'; if ($('#ps', p).checked) sets += '!@#$%^&*()-_=+[]{};:,.?'; if ($('#pa', p).checked) sets = sets.replace(/[Il1O0o]/g, ''); if (!sets) sets = 'abcdefghijklmnopqrstuvwxyz'; var n = +$('#pl', p).value, r = rnd(n), s = ''; for (var i = 0; i < n; i++) s += sets[r[i] % sets.length]; $('#po', p).textContent = s; var bits = Math.round(n * Math.log2(sets.length)), lvl = bits < 50 ? 0 : bits < 80 ? 1 : bits < 110 ? 2 : 3; $('#pm', p).style.width = Math.min(100, bits / 1.3) + '%'; $('#pm', p).style.background = ['#dc2626', '#f59e0b', '#84cc16', '#16a34a'][lvl]; $('#pmt', p).textContent = ['Weak', 'Okay', 'Strong', 'Very strong'][lvl] + ' · ' + bits + ' bits of entropy · ' + (bits > 100 ? 'longer than the universe to crack' : bits > 70 ? 'centuries to crack' : 'crackable, add length'); };
        $('#pl', p).addEventListener('input', function () { $('#plv', p).textContent = this.value; g(); }); $$('input[type=checkbox]', p).forEach(function (c) { c.addEventListener('change', g); });
        p.addEventListener('click', function (e) { var a = e.target.getAttribute('data-a'); if (a === 'g') g(); if (a === 'c') { XR.copy($('#po', p).textContent); XR.toast('Password copied'); } }); g();
      } },
    { id: 'color', name: 'Colour converter', ic: 'palette', ui: '<h3 class="h4">Colour converter</h3><p>HEX, RGB and HSL, contrast checks and a ten-step scale. Click a swatch to copy it.</p><div class="tl-row"><input type="color" id="cc" value="#c4321d" aria-label="Pick a colour" style="width:52px;height:42px;border:0;background:none;padding:0;cursor:pointer"><input class="tl-in" id="ch" value="#c4321d" spellcheck="false" aria-label="HEX value" style="flex:1"></div><div class="tl-grid" id="cg"></div><div class="shades" id="cs"></div>',
      init: function (p) {
        var go = function (h) { var r = hex2rgb(h), l = rgb2hsl(r), w = cr(r, [255, 255, 255]), b = cr(r, [0, 0, 0]); $('#cg', p).innerHTML = [['HEX', h], ['RGB', 'rgb(' + r.join(', ') + ')'], ['HSL', 'hsl(' + l[0] + ', ' + l[1] + '%, ' + l[2] + '%)'], ['Contrast', 'white ' + w.toFixed(2) + ' · black ' + b.toFixed(2) + (Math.max(w, b) >= 4.5 ? '  AA' : '')]].map(function (x) { return '<div class="tl-kv"><small>' + x[0] + '</small><b>' + esc(x[1]) + '</b><button type="button" data-cp="' + esc(x[1]) + '">Copy</button></div>'; }).join(''); $('#cs', p).innerHTML = [.9, .75, .6, .4, .2, 0, .2, .4, .6, .75].map(function (t, i) { var c = rgb2hex(i < 5 ? mix(r, [255, 255, 255], t) : mix(r, [0, 0, 0], t)); return '<button type="button" style="background:' + c + '" data-cp="' + c + '" title="' + c + '" aria-label="' + c + '"></button>'; }).join(''); };
        $('#cc', p).addEventListener('input', function () { $('#ch', p).value = this.value; go(this.value); });
        $('#ch', p).addEventListener('input', function () { var v = this.value.trim(); if (v[0] !== '#') v = '#' + v; if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) { var full = rgb2hex(hex2rgb(v)); $('#cc', p).value = full; go(full); } });
        p.addEventListener('click', function (e) { var c = e.target.getAttribute('data-cp'); if (c) { XR.copy(c); XR.toast('Copied ' + c); } }); go('#c4321d');
      } },
    { id: 'hash', name: 'SHA-256 hash', ic: 'shield', ui: '<h3 class="h4">SHA hashes</h3><p>SHA-256, SHA-1 and SHA-512 using the Web Crypto API. Updates as you type.</p><textarea class="tl-area" id="hi" spellcheck="false">the toad sage approves</textarea><div class="tl-grid" id="ho" style="grid-template-columns:minmax(0,1fr)"></div>',
      init: function (p) {
        var go = function () { var t = $('#hi', p).value, o = $('#ho', p); if (!(window.crypto && crypto.subtle)) { o.innerHTML = '<div class="tl-kv"><small>Note</small><b>Hashing needs a secure (https) page.</b></div>'; return; } var data = new TextEncoder().encode(t); Promise.all(['SHA-256', 'SHA-1', 'SHA-512'].map(function (a) { return crypto.subtle.digest(a, data).then(function (b) { return [a, [].map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('')]; }); })).then(function (r) { o.innerHTML = r.map(function (x) { return '<div class="tl-kv"><small>' + x[0] + '</small><b>' + x[1] + '</b><button type="button" data-cp="' + x[1] + '">Copy</button></div>'; }).join(''); }); };
        $('#hi', p).addEventListener('input', go); p.addEventListener('click', function (e) { var c = e.target.getAttribute('data-cp'); if (c) { XR.copy(c); XR.toast('Hash copied'); } }); go();
      } },
    { id: 'jwt', name: 'JWT decoder', ic: 'lock', ui: '<h3 class="h4">JWT decoder</h3><p>Decodes the header and payload, and tells you if the token has expired. It does not verify signatures.</p><textarea class="tl-area" id="jt" spellcheck="false" style="min-height:110px"></textarea><div class="tl-row"><button type="button" class="tl-btn" data-a="s">Load a sample token</button></div><div class="tl-msg" id="jm"></div><div class="tl-grid"><div><small class="tl-msg">Header</small><pre class="tl-out" id="jh"></pre></div><div><small class="tl-msg">Payload</small><pre class="tl-out" id="jp"></pre></div></div>',
      init: function (p) {
        var go = function () { var t = $('#jt', p).value.trim(), m = $('#jm', p); if (!t) { m.textContent = 'Paste a token.'; return; } var parts = t.split('.'); try { if (parts.length < 2) throw 0; var h = JSON.parse(b64d(parts[0])), pl = JSON.parse(b64d(parts[1])); $('#jh', p).innerHTML = hl(JSON.stringify(h, null, 2)); $('#jp', p).innerHTML = hl(JSON.stringify(pl, null, 2)); if (pl.exp) { var d = new Date(pl.exp * 1000), ok = d > new Date(); m.className = 'tl-msg ' + (ok ? 'ok' : 'bad'); m.textContent = (ok ? 'Valid until ' : 'Expired on ') + d.toLocaleString() + ' · algorithm ' + (h.alg || '?'); } else { m.className = 'tl-msg'; m.textContent = 'No expiry claim · algorithm ' + (h.alg || '?'); } } catch (e) { m.className = 'tl-msg bad'; m.textContent = 'That does not look like a JWT (three Base64URL parts separated by dots).'; $('#jh', p).textContent = ''; $('#jp', p).textContent = ''; } };
        $('#jt', p).addEventListener('input', go); p.addEventListener('click', function (e) { if (e.target.getAttribute('data-a') === 's') { $('#jt', p).value = SAMPLE_JWT; go(); } }); $('#jt', p).value = SAMPLE_JWT; go();
      } },
    { id: 'time', name: 'Timestamp converter', ic: 'clock', ui: '<h3 class="h4">Unix timestamp converter</h3><p>Seconds or milliseconds, both ways. Shown in UTC, your time and Dhaka time.</p><div class="tl-row"><input class="tl-in" id="ti" spellcheck="false" aria-label="Timestamp or date" style="flex:1"><button type="button" class="tl-btn pri" data-a="n">Now</button></div><div class="tl-grid" id="to"></div>',
      init: function (p) {
        var go = function () { var v = $('#ti', p).value.trim(), d; if (/^-?\d+$/.test(v)) d = new Date(v.length > 11 ? +v : +v * 1000); else d = new Date(v); var o = $('#to', p); if (isNaN(d)) { o.innerHTML = '<div class="tl-kv"><small>Error</small><b>Not a date or timestamp</b></div>'; return; } var rel = Math.round((d - Date.now()) / 1000), ar = Math.abs(rel), rs = ar < 60 ? ar + ' seconds' : ar < 3600 ? Math.round(ar / 60) + ' minutes' : ar < 86400 ? Math.round(ar / 3600) + ' hours' : Math.round(ar / 86400) + ' days';
          o.innerHTML = [['Unix seconds', Math.floor(d / 1000)], ['Milliseconds', d.getTime()], ['ISO 8601 (UTC)', d.toISOString()], ['Your time', d.toLocaleString()], ['Dhaka', d.toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })], ['Relative', rel >= 0 ? 'in ' + rs : rs + ' ago']].map(function (x) { return '<div class="tl-kv"><small>' + x[0] + '</small><b>' + esc(x[1]) + '</b><button type="button" data-cp="' + esc(x[1]) + '">Copy</button></div>'; }).join(''); };
        $('#ti', p).addEventListener('input', go); p.addEventListener('click', function (e) { if (e.target.getAttribute('data-a') === 'n') { $('#ti', p).value = Math.floor(Date.now() / 1000); go(); } var c = e.target.getAttribute('data-cp'); if (c) { XR.copy(c); XR.toast('Copied'); } }); $('#ti', p).value = Math.floor(Date.now() / 1000); go();
      } }
  ];
  var tNav = $('#tbxNav'), tPanel = $('#tbxPanel');
  if (tNav) {
    tNav.innerHTML = TOOLS.map(function (t, i) { return '<button type="button" role="tab" aria-selected="' + (i === 0) + '" data-tool="' + t.id + '">' + icon(t.ic) + t.name + '</button>'; }).join('');
    var openTool = function (id) {
      var t = TOOLS.filter(function (x) { return x.id === id; })[0];
      $$('button', tNav).forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-tool') === id); });
      tPanel.innerHTML = '<div class="tl-p">' + t.ui + '</div>';
      t.init(tPanel.firstChild);
    };
    tNav.addEventListener('click', function (e) { var b = e.target.closest('[data-tool]'); if (b) { openTool(b.getAttribute('data-tool')); quest('world-tool'); } });
    tPanel.addEventListener('input', function () { quest('world-tool'); }, { once: true });
    openTool('json');
  }

  /* ================= API shrine ================= */
  var DB = {
    users: [{ id: 1, name: 'Amina Rahman', email: 'amina@lumen.dev', role: 'admin', city: 'Rajshahi' }, { id: 2, name: 'Samir Hossain', email: 'samir@halcyon.dev', role: 'editor', city: 'Dhaka' }, { id: 3, name: 'Maya Chen', email: 'maya@kitefin.dev', role: 'viewer', city: 'Singapore' }, { id: 4, name: 'Rafi Ahmed', email: 'rafi@ledger.dev', role: 'editor', city: 'Sylhet' }],
    products: [{ id: 1, name: 'Telegram bot', price: 149, currency: 'USD', stock: 'unlimited' }, { id: 2, name: 'Landing page', price: 299, currency: 'USD', stock: 'unlimited' }, { id: 3, name: 'AI agent', price: 699, currency: 'USD', stock: 3 }, { id: 4, name: 'Minecraft plugin', price: 199, currency: 'USD', stock: 'unlimited' }],
    orders: [{ id: 1001, userId: 1, items: [{ productId: 3, qty: 1 }], total: 699, pay: 'USDT', status: 'paid' }]
  };
  function api(method, path, body) {
    var p = path.replace(/\?.*$/, '').replace(/\/+$/, '') || '/', m = p.match(/^\/v1\/(\w+)(?:\/(\d+))?$/), res = function (s, b, extra) { return { status: s, body: b, extra: extra || {} }; };
    if (p === '/v1/health') return res(200, { status: 'ok', region: 'ap-south-1', uptime: '99.99%', toad: 'awake' });
    if (p === '/v1/teapot') return res(418, { error: 'I am a teapot', hint: 'The village prefers tea anyway.' });
    if (p === '/v1/slow') return res(200, { message: 'Sorry for the wait. This endpoint naps.' }, { delay: 2200 });
    if (!m || !DB[m[1]]) return res(404, { error: 'not_found', message: 'No route for ' + method + ' ' + p, routes: ['/v1/users', '/v1/products', '/v1/orders', '/v1/health'] });
    var col = DB[m[1]], id = m[2] ? +m[2] : null, item = id != null ? col.filter(function (x) { return x.id === id; })[0] : null;
    if (method === 'GET') { if (id == null) return res(200, { data: col, total: col.length }); return item ? res(200, { data: item }) : res(404, { error: 'not_found', message: m[1].slice(0, -1) + ' ' + id + ' does not exist' }); }
    if (method === 'DELETE') { if (id == null) return res(405, { error: 'method_not_allowed', message: 'Delete needs an id, like /v1/' + m[1] + '/1' }); if (!item) return res(404, { error: 'not_found' }); col.splice(col.indexOf(item), 1); return res(204, null); }
    var data;
    try { data = body && body.trim() ? JSON.parse(body) : {}; } catch (e) { return res(400, { error: 'invalid_json', message: e.message }); }
    if (method === 'POST') {
      if (id != null) return res(405, { error: 'method_not_allowed' });
      var n = Object.assign({ id: m[1] === 'orders' ? 1000 + col.length + 1 : col.length ? col[col.length - 1].id + 1 : 1 }, data);
      if (m[1] === 'orders') { if (!Array.isArray(data.items) || !data.items.length) return res(422, { error: 'validation_failed', fields: { items: 'At least one item is required' } }); n.total = data.items.reduce(function (a, it) { var pr = DB.products.filter(function (x) { return x.id === it.productId; })[0]; return a + (pr ? pr.price * (it.qty || 1) : 0); }, 0); n.status = 'pending'; }
      col.push(n); return res(201, { data: n }, { location: '/v1/' + m[1] + '/' + n.id });
    }
    if (method === 'PATCH') { if (!item) return res(id == null ? 405 : 404, { error: id == null ? 'method_not_allowed' : 'not_found' }); Object.assign(item, data, { id: item.id }); return res(200, { data: item }); }
    return res(405, { error: 'method_not_allowed' });
  }
  var apiF = $('#apiF');
  if (apiF) {
    var BASE = 'https://api.village.dev', last = null, rt = 'body', ct = 'fetch';
    var STXT = { 200: 'OK', 201: 'Created', 204: 'No Content', 400: 'Bad Request', 404: 'Not Found', 405: 'Method Not Allowed', 418: 'I am a teapot', 422: 'Unprocessable Entity' };
    var QUICK = [['GET', '/v1/users'], ['GET', '/v1/users/2'], ['POST', '/v1/orders'], ['PATCH', '/v1/users/3'], ['DELETE', '/v1/users/4'], ['GET', '/v1/users/99'], ['GET', '/v1/teapot'], ['GET', '/v1/slow']];
    $('#apiQuick').innerHTML = QUICK.map(function (q) { return '<button type="button" data-m="' + q[0] + '" data-u="' + q[1] + '"><b class="m-' + q[0] + '">' + q[0] + '</b>' + q[1] + '</button>'; }).join('');
    var bodyOn = function () { var m = $('#apiM').value, on = m === 'POST' || m === 'PATCH'; $('#apiB').disabled = !on; $('#apiM').className = 'm-' + m; };
    var genCode = function () {
      var m = $('#apiM').value, u = BASE + $('#apiU').value.trim(), b = $('#apiB').value.trim(), hasB = (m === 'POST' || m === 'PATCH') && b, s;
      var bodyOne = hasB ? JSON.stringify((function () { try { return JSON.parse(b); } catch (e) { return b; } })()) : '';
      if (ct === 'curl') s = 'curl -X ' + m + " '" + u + "' \\\n  -H 'Authorization: Bearer $VILLAGE_KEY'" + (hasB ? " \\\n  -H 'Content-Type: application/json' \\\n  -d '" + bodyOne + "'" : '');
      else if (ct === 'py') s = 'import requests\n\nres = requests.' + m.toLowerCase() + '(\n    "' + u + '",\n    headers={"Authorization": "Bearer VILLAGE_KEY"},' + (hasB ? '\n    json=' + bodyOne.replace(/true/g, 'True').replace(/false/g, 'False').replace(/null/g, 'None') + ',' : '') + '\n)\nprint(res.status_code, res.json())';
      else s = "const res = await fetch('" + u + "', {\n  method: '" + m + "',\n  headers: {\n    'Authorization': 'Bearer ' + VILLAGE_KEY" + (hasB ? ",\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify(" + bodyOne + ')' : '\n  }') + '\n})\nconst data = await res.json()';
      $('#apiCode').textContent = s;
    };
    var showRes = function () {
      if (!last) return;
      if (rt === 'headers') $('#apiRes').innerHTML = Object.keys(last.h).map(function (k) { return '<span class="k">' + esc(k) + '</span>: <span class="s">' + esc(last.h[k]) + '</span>'; }).join('\n');
      else $('#apiRes').innerHTML = last.r.body == null ? '<span class="c">// 204 No Content: the server said yes, and nothing else</span>' : hl(JSON.stringify(last.r.body, null, 2));
    };
    apiF.addEventListener('submit', function (e) {
      e.preventDefault();
      var m = $('#apiM').value, u = $('#apiU').value.trim() || '/', r = api(m, u, $('#apiB').value), ms = (r.extra.delay || 0) + 60 + Math.round(Math.random() * 140), b = $('#apiSend');
      b.disabled = true; $('#apiSt').innerHTML = '<span class="spin"></span><span>' + m + ' ' + esc(u) + '</span>';
      setTimeout(function () {
        b.disabled = false;
        var bodyStr = r.body == null ? '' : JSON.stringify(r.body), size = bodyStr.length;
        var h = { 'content-type': 'application/json; charset=utf-8', 'content-length': String(size), 'x-request-id': 'req_' + Math.random().toString(36).slice(2, 12), 'x-ratelimit-remaining': String(99 - Math.floor(Math.random() * 20)), 'cache-control': m === 'GET' ? 'max-age=30' : 'no-store', server: 'toad-edge/5.0' };
        if (r.extra.location) h.location = r.extra.location;
        last = { r: r, h: h };
        $('#apiSt').innerHTML = '<b class="st-' + String(r.status)[0] + '">' + r.status + ' ' + (STXT[r.status] || '') + '</b><span>' + ms + ' ms</span><span>' + (size > 1024 ? (size / 1024).toFixed(1) + ' KB' : size + ' B') + '</span><span>' + m + ' ' + esc(u) + '</span>';
        showRes(); quest('world-tool');
      }, ms);
    });
    $('#apiQuick').addEventListener('click', function (e) { var q = e.target.closest('[data-m]'); if (!q) return; $('#apiM').value = q.getAttribute('data-m'); $('#apiU').value = q.getAttribute('data-u'); if (q.getAttribute('data-m') === 'PATCH') $('#apiB').value = '{\n  "role": "admin"\n}'; else if (q.getAttribute('data-m') === 'POST') $('#apiB').value = '{\n  "userId": 1,\n  "items": [{ "productId": 2, "qty": 1 }],\n  "pay": "USDT"\n}'; bodyOn(); genCode(); apiF.requestSubmit ? apiF.requestSubmit() : apiF.dispatchEvent(new Event('submit')); });
    ['#apiM', '#apiU', '#apiB'].forEach(function (s) { $(s).addEventListener('input', function () { bodyOn(); genCode(); }); });
    $('#apiCT').addEventListener('click', function (e) { var b = e.target.closest('[data-ct]'); if (!b) return; ct = b.getAttribute('data-ct'); $$('#apiCT button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); genCode(); });
    $('#apiRT').addEventListener('click', function (e) { var b = e.target.closest('[data-rt]'); if (!b) return; rt = b.getAttribute('data-rt'); $$('#apiRT button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); showRes(); });
    $('#apiCopy').addEventListener('click', function () { XR.copy($('#apiRes').textContent); XR.toast('Response copied'); });
    bodyOn(); genCode();
  }

  /* ================= git tower ================= */
  var COMMITS = [
    { y: 2021, l: 0, m: 'init: first website. HTML, CSS and a lot of Stack Overflow', h: 'a1f3c09' },
    { y: 2021, l: 1, m: 'feat(bots): first Telegram bot, it posted memes on a timer', h: 'b7e21d4', br: 'bots' },
    { y: 2021, l: 1, m: 'feat(bots): 20 group-management bots for local communities', h: 'c0d9e11' },
    { y: 2022, l: 0, m: 'feat(web): first paid client, a Rajshahi restaurant site', h: 'd44a8f2' },
    { y: 2022, l: 0, m: 'merge: bots now pay rent', h: 'e19b7a3', merge: 1 },
    { y: 2022, l: 2, m: 'feat(minecraft): first Paper plugin with custom enchants', h: 'f2c6b88', br: 'minecraft' },
    { y: 2023, l: 1, m: 'feat(extensions): Chrome extension passes 10k users', h: '0a7d3e5', br: 'apps' },
    { y: 2023, l: 2, m: 'feat(minecraft): economy and ranks for a 500-player server', h: '1b8e4f6' },
    { y: 2023, l: 0, m: 'merge: minecraft plugins go commercial', h: '2c9f507', merge: 2 },
    { y: 2024, l: 1, m: 'feat(apps): Windows EXE and Android APK builds', h: '3da0618' },
    { y: 2024, l: 0, m: 'feat(automation): n8n and Python pipelines save clients 30h a week', h: '4eb1729' },
    { y: 2025, l: 2, m: 'feat(ai): agents with tools, memory and guardrails', h: '5fc283a', br: 'ai' },
    { y: 2025, l: 0, m: 'merge: AI everything, responsibly', h: '60d394b', merge: 2 },
    { y: 2025, l: 0, m: 'merge: apps ship to real users every week', h: '71e4a5c', merge: 1 },
    { y: 2026, l: 0, m: 'feat(shop): e-commerce with an AI agent and crypto checkout', h: '82f5b6d', tag: 'v5.0' },
    { y: 2026, l: 0, m: 'chore: available for your project', h: '9306c7e', tag: 'HEAD', head: 1 }
  ];
  var gitLog = $('#gitLog');
  if (gitLog) {
    var LC = ['var(--red)', 'var(--cyan)', 'var(--violet)'], LX = [30, 58, 86];
    var rows = COMMITS.slice().reverse();
    gitLog.innerHTML = rows.map(function (c) {
      return '<div class="gc" style="--gw:110px"><span></span><p><code>' + c.h + '</code>' + esc(c.m) + '</p><span class="gm">' + (c.tag ? '<span class="tag' + (c.head ? '' : ' cy') + '">' + c.tag + '</span>' : '') + '<span>' + c.y + '</span></span></div>';
    }).join('');
    var draw = function () {
      var old = $('svg.gg', gitLog); if (old) old.remove();
      var els = $$('.gc', gitLog), top0 = gitLog.getBoundingClientRect().top, ys = els.map(function (el) { var r = el.getBoundingClientRect(); return r.top - top0 + r.height / 2; });
      var H = gitLog.scrollHeight, svg = '<svg class="gg" width="110" height="' + H + '" aria-hidden="true">';
      // one segment per branch: fork from the main commit below its first commit, merge back at the next merge row above
      var segs = [];
      for (var i = rows.length - 1; i >= 0; i--) {
        var c = rows[i];
        if (c.l && c.br) {
          var fork = i + 1; while (fork < rows.length && rows[fork].l !== 0) fork++;
          var end = i - 1; while (end >= 0 && rows[end].merge !== c.l) end--;
          segs.push({ l: c.l, fork: Math.min(fork, rows.length - 1), top: i, merge: end });
        }
      }
      segs.forEach(function (g) {
        var x0 = LX[0], x1 = LX[g.l], yf = ys[g.fork], yt = g.merge >= 0 ? ys[g.merge] : ys[g.top];
        var d = 'M' + x0 + ' ' + yf + ' C' + x0 + ' ' + (yf - 22) + ' ' + x1 + ' ' + (yf - 12) + ' ' + x1 + ' ' + (yf - 30) + ' L' + x1 + ' ' + (g.merge >= 0 ? yt + 30 : yt);
        if (g.merge >= 0) d += ' C' + x1 + ' ' + (yt + 12) + ' ' + x0 + ' ' + (yt + 22) + ' ' + x0 + ' ' + yt;
        svg += '<path class="lane" style="stroke:' + LC[g.l] + '" d="' + d + '"/>';
      });
      svg += '<path class="lane" style="stroke:var(--ink)" d="M' + LX[0] + ' ' + ys[0] + ' V' + ys[ys.length - 1] + '"/>';
      rows.forEach(function (c, i) { svg += '<circle class="dot' + (c.head ? ' head' : '') + '" cx="' + LX[c.l] + '" cy="' + ys[i] + '" r="' + (c.head ? 8 : c.merge ? 6.5 : 6) + '" style="fill:' + (c.merge || c.head ? LC[c.l === 0 && c.merge ? c.merge : c.l] : 'var(--surface)') + ';stroke:' + (c.l === 0 ? 'var(--ink)' : LC[c.l]) + '"/>'; if (c.br) svg += '<text x="' + (LX[c.l] + 10) + '" y="' + (ys[i] - 12) + '" style="font:600 10px var(--font-mono);fill:' + LC[c.l] + '">' + c.br + '</text>'; });
      gitLog.insertAdjacentHTML('afterbegin', svg + '</svg>');
    };
    draw();
    window.addEventListener('resize', function () { clearTimeout(draw._t); draw._t = setTimeout(draw, 150); });
    XR.whenVisible(gitLog, function () { $$('.gc', gitLog).forEach(function (el, i) { setTimeout(function () { el.classList.add('in'); }, i * 70); }); });
  }

  /* heatmap */
  var heat = $('#heat');
  if (heat) {
    var R = XR.seeded('xiraiya-village-2026'), days = 364, end = new Date(), total = 0, cells = '', best = 0, streak = 0, cur = 0;
    end.setHours(0, 0, 0, 0);
    var start = new Date(end); start.setDate(end.getDate() - days + 1); start.setDate(start.getDate() - start.getDay());
    for (var d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      var wk = d.getDay() === 0 || d.getDay() === 6, r = R(), n = r < (wk ? .35 : .12) ? 0 : Math.round(Math.pow(r, 2.2) * (wk ? 10 : 18) + (wk ? 0 : 1));
      total += n; if (n) { cur++; best = Math.max(best, cur); } else cur = 0;
      var lv = n === 0 ? 0 : n < 4 ? 1 : n < 8 ? 2 : n < 13 ? 3 : 4;
      cells += '<i class="l' + lv + '" data-t="' + n + ' contribution' + (n === 1 ? '' : 's') + ' on ' + d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + '"></i>';
    }
    streak = cur;
    heat.innerHTML = cells;
    var tot = $('#heatTot');
    XR.whenVisible(heat, function () { var t0 = performance.now(); (function f(t) { var k = Math.min(1, (t - t0) / 1200); tot.textContent = Math.round(total * (1 - Math.pow(1 - k, 3))).toLocaleString(); if (k < 1) requestAnimationFrame(f); })(t0); });
    $('#heatTip').textContent = 'Longest streak ' + best + ' days · current ' + streak;
    heat.addEventListener('mouseover', function (e) { var c = e.target.closest('i'); if (c) $('#heatTip').textContent = c.getAttribute('data-t'); });
    heat.addEventListener('mouseleave', function () { $('#heatTip').textContent = 'Longest streak ' + best + ' days · current ' + streak; });
    var sc = $('.heat-scroll'); if (sc) sc.scrollLeft = sc.scrollWidth;
  }
  var LANGS = [['JavaScript', 31, '#f1c40f'], ['Python', 22, '#3572a5'], ['TypeScript', 14, '#2f74c0'], ['Java', 12, '#b07219'], ['Kotlin', 8, '#a97bff'], ['HTML/CSS', 8, '#e34c26'], ['Other', 5, '#8b8070']];
  var lb = $('#langBar');
  if (lb) {
    lb.innerHTML = LANGS.map(function (l) { return '<i style="background:' + l[2] + '" data-w="' + l[1] + '" title="' + l[0] + ' ' + l[1] + '%"></i>'; }).join('');
    $('#langList').innerHTML = LANGS.map(function (l) { return '<li><i style="background:' + l[2] + '"></i>' + l[0] + '<span>' + l[1] + '%</span></li>'; }).join('');
    XR.whenVisible(lb, function () { $$('i', lb).forEach(function (i) { i.style.width = i.getAttribute('data-w') + '%'; }); });
  }
})();
