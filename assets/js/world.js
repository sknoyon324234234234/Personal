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
      return '<span class="t-hd">Village commands</span>\n' + [['about', 'who lives here'], ['skills', 'the tech stack'], ['projects', 'things I shipped'], ['services', 'what you can hire me for'], ['contact', 'how to reach me'], ['ls / cat <file>', 'read the files'], ['open <page>', 'lab, shop, demos, pages, hire...'], ['neofetch', 'system info, toad edition'], ['git log', 'my career, in commits'], ['sudo hire-me', 'the fastest way to start'], ['joke / fortune', 'morale boosters'], ['curl <url>', 'call the village API'], ['calc <expr>', 'maths, safely'], ['snake', 'a game, obviously'], ['top', 'live process monitor'], ['toadsay <msg>', 'the toad speaks'], ['tree / uuid / base64', 'utilities'], ['<cmd> | grep <word>', 'filter any output'], ['theme', 'paper or ink mode'], ['quests', 'your quest progress'], ['history / clear', 'the usual']].map(function (x) { return '  <span class="t-grn">' + pad(x[0], 18) + '</span><span class="t-dim">' + x[1] + '</span>'; }).join('\n') + '\n<span class="t-dim">Tip: Tab autocompletes, arrow keys walk through history.</span>';
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
      var map2 = { home: 'index.html', lab: 'showcase.html', shop: 'shop.html', kit: 'components.html', demos: 'demos.html', pages: 'pages.html', hire: 'hire.html', minecraft: 'showcase.html#minecraft' };
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
    curl: function (a) {
      var m = 'GET', url = null, body = '';
      for (var i = 0; i < a.length; i++) { if (a[i] === '-X') m = (a[++i] || 'GET').toUpperCase(); else if (a[i] === '-d') body = a.slice(i + 1).join(' ').replace(/^'|'$/g, ''); else if (!url && !/^-/.test(a[i])) url = a[i]; if (a[i] === '-d') break; }
      if (!url) return 'usage: <span class="t-grn">curl [-X METHOD] api.village.dev/v1/users [-d \'{"json":1}\']</span>';
      var path = url.replace(/^https?:\/\//, '').replace(/^api\.village\.dev/, '') || '/';
      if (!/^\/v1\//.test(path)) return '<span class="t-red">curl: could not resolve host.</span> Try <span class="t-grn">curl api.village.dev/v1/users</span>';
      var r = api(m, path, body), c = r.status < 300 ? 't-grn' : r.status < 500 ? 't-yel' : 't-red';
      stamp('api');
      return '<span class="' + c + '">HTTP/2 ' + r.status + '</span> <span class="t-dim">content-type: application/json</span>\n' + (r.body == null ? '<span class="t-dim">(no content)</span>' : hl(JSON.stringify(r.body, null, 2)));
    },
    calc: function (a) {
      var e = a.join(' ');
      if (!e) return 'usage: <span class="t-grn">calc 2^10 + sqrt(144) * PI</span>';
      var safe = e.replace(/\b(sqrt|sin|cos|tan|log|abs|round|floor|ceil|pow|min|max|PI|E)\b/g, 'Math.$1').replace(/\^/g, '**');
      if (/[^0-9+\-*/().,%\s]/.test(safe.replace(/Math\.(sqrt|sin|cos|tan|log|abs|round|floor|ceil|pow|min|max|PI|E)/g, ''))) return '<span class="t-red">calc: only numbers, + - * / ^ % ( ) and sqrt, sin, cos, tan, log, abs, round, floor, ceil, pow, min, max, PI, E</span>';
      try { var v = Function('"use strict";return (' + safe + ')')(); return esc(e) + ' = <span class="t-grn">' + (typeof v === 'number' ? +v.toFixed(10) : esc(String(v))) + '</span>'; } catch (err) { return '<span class="t-red">calc: ' + esc(err.message) + '</span>'; }
    },
    toadsay: function (a) {
      var msg = a.join(' ') || 'Ship it. Then ship it again.', w = Math.min(38, Math.max(8, msg.length)), lines = [];
      msg.split(' ').forEach(function (wd) { var l = lines[lines.length - 1]; if (!l || (l + ' ' + wd).length > w) lines.push(wd); else lines[lines.length - 1] = l + ' ' + wd; });
      var W = Math.max.apply(0, lines.map(function (l) { return l.length; }));
      var box = ' ' + '_'.repeat(W + 2) + '\n' + lines.map(function (l, i) { var b = lines.length === 1 ? ['<', '>'] : i === 0 ? ['/', '\\'] : i === lines.length - 1 ? ['\\', '/'] : ['|', '|']; return b[0] + ' ' + esc(l) + ' '.repeat(W - l.length) + ' ' + b[1]; }).join('\n') + '\n ' + '-'.repeat(W + 2);
      return box + '\n<span class="t-grn">        \\    (o)____(o)\n         \\  /  .    .  \\\n           (   \\____/   )\n            \\__________/\n            _/  |  |  \\_</span>';
    },
    tree: function () { return '<span class="t-blu">~</span>\n├── <span class="t-blu">village/</span>\n│   ├── terminal-dojo\n│   ├── code-workshop\n│   ├── toolbox-forge <span class="t-dim">(17 tools)</span>\n│   ├── api-shrine\n│   ├── git-tower\n│   ├── algorithm-arena\n│   └── typing-dojo\n├── about.txt\n├── projects.md\n├── services.md\n├── skills.json\n└── todo.txt\n\n<span class="t-dim">2 directories, 12 files, 1 toad</span>'; },
    top: function () {
      var id = 'top' + Date.now(), n = 0;
      var P = [['toad-sage', 'guest'], ['minecraft-srv', 'realm'], ['telegram-bot', 'bots'], ['ai-agent', 'bots'], ['n8n-worker', 'auto'], ['node', 'guest'], ['nginx', 'root']];
      var draw = function () { var el = document.getElementById(id); if (!el) return; el.innerHTML = '<span class="t-hd">top</span> <span class="t-dim">· up ' + YEARS + ' years · load ' + (Math.random() * 2 + .4).toFixed(2) + '</span>\n<span class="t-dim">PID   NAME            USER    CPU</span>\n' + P.map(function (p, i) { var c = Math.round(Math.random() * (i === 1 ? 70 : 35) + (i === 0 ? 20 : 2)); return pad(1200 + i * 37, 6) + pad(p[0], 16) + pad(p[1], 8) + '<span class="t-bar" style="width:' + c * 1.4 + 'px;background:' + (c > 60 ? '#ff7b72' : c > 35 ? '#f2cc60' : '#7ee787') + '"></span> ' + c + '%'; }).join('\n') + (n >= 10 ? '\n<span class="t-dim">(snapshot, top exited)</span>' : ''); };
      setTimeout(function tick() { n++; draw(); if (n < 10) setTimeout(tick, 600); }, 20);
      return '<div id="' + id + '"></div>';
    },
    snake: function () { setTimeout(snake, 30); return '<span class="t-grn">Snake</span>: arrow keys or WASD to move, Q to quit. Eat the bugs.'; },
    weather: function () { var t = 26 + Math.round(Math.random() * 8); return 'Rajshahi: <span class="t-yel">' + t + '°C</span>, humid, light breeze from the Padma.\n<span class="t-dim">Forecast: 100% chance of mangoes in season.</span>'; },
    uuid: function () { return uuid(); },
    base64: function (a) { if (!a.length) return 'usage: <span class="t-grn">base64 hello</span> or <span class="t-grn">base64 -d aGVsbG8=</span>'; try { return a[0] === '-d' ? esc(b64d(a.slice(1).join(' '))) : b64e(a.join(' ')); } catch (e) { return '<span class="t-red">base64: invalid input</span>'; } },
    man: function (a) { var d = { curl: 'call the village API, e.g. curl -X POST api.village.dev/v1/orders -d \'{"items":[{"productId":1}]}\'', calc: 'evaluate maths safely', snake: 'play snake inside the terminal', top: 'watch village processes', toadsay: 'a toad says your message', grep: 'filter any output: help | grep git' }; return a[0] && d[a[0]] ? '<span class="t-grn">' + esc(a[0]) + '</span>: ' + esc(d[a[0]]) : CMDS.help(); },
    clear: function () { out.innerHTML = ''; return null; }
  };
  var ALIASES = { '?': 'help', cls: 'clear', dir: 'ls', 'hire-me': 'hire', cowsay: 'toadsay', htop: 'top' };
  function print(html, cls) { var d = document.createElement('div'); d.className = 'ln' + (cls ? ' ' + cls : ''); d.innerHTML = html; out.appendChild(d); out.scrollTop = out.scrollHeight; }
  function run(line) {
    line = line.trim();
    print('<b>guest</b>@village <em>~</em> $ ' + esc(line), 'cmd');
    if (!line) return;
    hist.push(line); hp = hist.length;
    var pipe = line.split(/\s*\|\s*grep\s+/i), cmdLine = pipe[0], needle = pipe[1] ? pipe[1].trim().toLowerCase() : null;
    var parts = cmdLine.split(/\s+/), c = parts[0].toLowerCase(), args = parts.slice(1);
    c = ALIASES[c] || c;
    var fn = CMDS[c];
    if (!fn) { print('<span class="t-red">command not found: ' + esc(parts[0]) + '</span>. Type <span class="t-grn">help</span> for the list.'); return; }
    var r = fn(args);
    if (r != null && needle) {
      var kept = String(r).split('\n').filter(function (l) { return l.replace(/<[^>]+>/g, '').toLowerCase().indexOf(needle) > -1; });
      r = kept.length ? kept.join('\n') : '<span class="t-dim">(grep: no lines match "' + esc(needle) + '")</span>';
    }
    if (r != null) print(r);
    quest('world-terminal'); stamp('terminal');
  }
  if (form) {
    print('<span class="t-hd">Welcome to the village terminal.</span> <span class="t-dim">VillageOS 26.9 · toadsh 5.0</span>\nType <span class="t-grn">help</span> to see what I can do, or click a chip below.');
    form.addEventListener('submit', function (e) { e.preventDefault(); run(inp.value); inp.value = ''; });
    var ghostEl = $('#termG'), SUGG = ['help', 'about', 'skills', 'projects', 'services', 'contact', 'neofetch', 'git log', 'sudo hire-me', 'cat about.txt', 'cat skills.json', 'cat todo.txt', 'cat projects.md', 'curl api.village.dev/v1/users', 'curl -X POST api.village.dev/v1/orders -d {"userId":1,"items":[{"productId":3,"qty":1}]}', 'calc 2^10 + sqrt(144)', 'toadsay ship it', 'snake', 'top', 'tree', 'uuid', 'weather', 'joke', 'fortune', 'ping xiraiya.dev', 'open pages', 'open demos', 'theme', 'matrix', 'history', 'clear', 'help | grep git'];
    var ghost = function () { var v = inp.value; if (!v) { ghostEl.textContent = ''; return ''; } var m = SUGG.concat(hist.slice().reverse()).filter(function (x) { return x.indexOf(v) === 0 && x !== v; })[0] || ''; ghostEl.innerHTML = m ? '<span style="visibility:hidden">' + esc(v) + '</span>' + esc(m.slice(v.length)) : ''; return m; };
    inp.addEventListener('input', ghost);
    form.addEventListener('submit', function () { ghostEl.textContent = ''; });
    inp.addEventListener('keydown', function (e) {
      if ((e.key === 'Tab' || (e.key === 'ArrowRight' && inp.selectionStart === inp.value.length)) && ghost()) { e.preventDefault(); inp.value = ghost(); ghost(); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); if (hp > 0) { hp--; inp.value = hist[hp]; } }
      else if (e.key === 'ArrowDown') { e.preventDefault(); if (hp < hist.length - 1) { hp++; inp.value = hist[hp]; } else { hp = hist.length; inp.value = ''; } }
      else if (e.key === 'Tab') {
        e.preventDefault();
        var v = inp.value, parts = v.split(' '), last = parts[parts.length - 1], pool = parts.length > 1 ? Object.keys(FILES).concat(['hire-me', 'log', 'lab', 'shop', 'demos', 'pages', 'hire']) : Object.keys(CMDS);
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
    '3D tilt card': {
      html: '<div class="card" id="card">\n  <div class="shine"></div>\n  <small>MEMBER</small>\n  <b>Village Pass</b>\n  <span>Move your mouse over me</span>\n</div>',
      css: 'body{display:grid;place-items:center;min-height:100vh;margin:0;background:#0f0d0b;font-family:system-ui;perspective:900px}\n.card{position:relative;width:300px;height:190px;padding:24px;border-radius:20px;color:#fff;background:linear-gradient(135deg,#c4321d,#5f4f95);box-shadow:0 30px 60px -20px rgba(0,0,0,.7);transform-style:preserve-3d;transition:transform .1s;overflow:hidden;display:grid;align-content:end;gap:4px}\n.card b{font-size:26px;transform:translateZ(40px)}\n.card small{letter-spacing:.2em;opacity:.7}\n.shine{position:absolute;inset:0;background:radial-gradient(circle at var(--x,50%) var(--y,50%),rgba(255,255,255,.35),transparent 50%);pointer-events:none}',
      js: "const card = document.getElementById('card')\ndocument.addEventListener('mousemove', e => {\n  const r = card.getBoundingClientRect()\n  const x = (e.clientX - r.left) / r.width - .5\n  const y = (e.clientY - r.top) / r.height - .5\n  card.style.transform = `rotateY(${x * 24}deg) rotateX(${-y * 24}deg)`\n  card.style.setProperty('--x', (x + .5) * 100 + '%')\n  card.style.setProperty('--y', (y + .5) * 100 + '%')\n})"
    },
    'Particle network': {
      html: '<canvas id="c"></canvas>',
      css: 'body{margin:0;background:#0f0d0b;overflow:hidden}\ncanvas{display:block}',
      js: "const c = document.getElementById('c'), x = c.getContext('2d')\nconst W = c.width = innerWidth, H = c.height = innerHeight\nconst pts = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .8, vy: (Math.random() - .5) * .8 }))\nconst mouse = { x: -999, y: -999 }\naddEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY })\n;(function loop() {\n  x.clearRect(0, 0, W, H)\n  pts.forEach(p => {\n    p.x += p.vx; p.y += p.vy\n    if (p.x < 0 || p.x > W) p.vx *= -1\n    if (p.y < 0 || p.y > H) p.vy *= -1\n    x.fillStyle = '#f06a52'; x.fillRect(p.x - 1.5, p.y - 1.5, 3, 3)\n  })\n  for (const a of pts.concat([mouse])) for (const b of pts) {\n    const d = Math.hypot(a.x - b.x, a.y - b.y)\n    if (d < 110) { x.strokeStyle = `rgba(126,231,135,${1 - d / 110})`; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke() }\n  }\n  requestAnimationFrame(loop)\n})()\nconsole.log('70 particles, move your mouse')"
    },
    'Todo app': {
      html: '<main>\n  <h1>Village tasks</h1>\n  <form id="f"><input id="t" placeholder="Add a task" autocomplete="off"><button>Add</button></form>\n  <ul id="list"></ul>\n  <p id="left"></p>\n</main>',
      css: 'body{font-family:system-ui;background:#f6f1e7;display:grid;place-items:start center;padding:40px 16px;margin:0}\nmain{width:min(420px,100%)}\nh1{font-family:Georgia,serif}\nform{display:flex;gap:8px}\ninput{flex:1;padding:12px;border-radius:12px;border:1px solid #d6cbb8}\nbutton{padding:0 18px;border:0;border-radius:12px;background:#c4321d;color:#fff;font-weight:700}\nul{list-style:none;padding:0}\nli{display:flex;gap:10px;align-items:center;padding:12px;margin:8px 0;border-radius:12px;background:#fff;animation:in .3s}\nli.done span{text-decoration:line-through;opacity:.5}\nli button{margin-left:auto;background:none;color:#999;padding:0}\n@keyframes in{from{opacity:0;transform:translateY(-6px)}}',
      js: "let todos = [{ t: 'Feed the toad', d: true }, { t: 'Ship the website', d: false }]\nconst list = document.getElementById('list')\nfunction render() {\n  list.innerHTML = todos.map((x, i) => `<li class=\"${x.d ? 'done' : ''}\"><input type=\"checkbox\" data-i=\"${i}\" ${x.d ? 'checked' : ''}><span>${x.t}</span><button data-del=\"${i}\">x</button></li>`).join('')\n  document.getElementById('left').textContent = todos.filter(x => !x.d).length + ' left'\n}\ndocument.getElementById('f').onsubmit = e => { e.preventDefault(); const v = t.value.trim(); if (v) { todos.push({ t: v, d: false }); t.value = ''; render(); console.log('Added', v) } }\nlist.onclick = e => {\n  if (e.target.dataset.i) { todos[e.target.dataset.i].d = e.target.checked; render() }\n  if (e.target.dataset.del) { todos.splice(e.target.dataset.del, 1); render() }\n}\nrender()"
    },
    'CSS toad': {
      html: '<div class="toad">\n  <i class="eye l"></i><i class="eye r"></i>\n  <i class="mouth"></i>\n</div>\n<p>Pure CSS. Click the toad.</p>',
      css: 'body{display:grid;place-items:center;align-content:center;gap:10px;min-height:100vh;margin:0;background:#bfe3d0;font-family:system-ui;color:#2c6f65}\n.toad{position:relative;width:200px;height:130px;border-radius:50% 50% 45% 45%;background:radial-gradient(circle at 30% 30%,#6fbf73,#2e7d32);box-shadow:inset -12px -16px 0 rgba(0,0,0,.12);cursor:pointer;animation:hop 2s ease-in-out infinite}\n.eye{position:absolute;top:-22px;width:52px;height:52px;border-radius:50%;background:#6fbf73}\n.eye::after{content:\"\";position:absolute;inset:12px;border-radius:50%;background:#111;box-shadow:inset 6px 6px 0 #fff}\n.eye.l{left:20px}.eye.r{right:20px}\n.mouth{position:absolute;left:50%;top:62px;width:90px;height:34px;margin-left:-45px;border-bottom:6px solid #1b4d1e;border-radius:0 0 50% 50%}\n@keyframes hop{50%{transform:translateY(-14px)}}',
      js: "document.querySelector('.toad').onclick = () => console.log('Ribbit. The toad approves your code.')"
    },
    'Blank': { html: '<h1>Hello, village</h1>', css: 'body{font-family:system-ui;padding:24px}', js: "console.log('Ready')" }
  };
  var pgCode = $('#pgCode');
  if (pgCode) {
    var PGKEY = 'xr-world-pg', lang = 'html', code = XR.store(PGKEY) || JSON.parse(JSON.stringify(PRESETS['Hover button'])), pgHl = $('#pgHl'), pgTouched = false;
    var pm = location.hash.match(/[#&]pg=([^&]+)/);
    if (pm) { try { code = JSON.parse(decodeURIComponent(escape(atob(pm[1])))); setTimeout(function () { XR.toast('Loaded shared code in the workshop'); }, 900); } catch (e) { /* ignore bad links */ } }
    var frameEl = $('#pgFrame'), log = $('#pgLog'), gut = $('#pgGut'), autoRun = $('#pgAuto'), runT;
    $('#pgPreset').innerHTML = '<option value="">Choose...</option>' + Object.keys(PRESETS).map(function (k) { return '<option>' + k + '</option>'; }).join('');
    var HOOK = '<script>(function(){var s=function(t,a){try{parent.postMessage({pg:1,t:t,m:[].map.call(a,function(x){try{return typeof x==="object"?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(" ")},"*")}catch(e){}};["log","info","warn","error"].forEach(function(k){var o=console[k];console[k]=function(){s(k,arguments);o.apply(console,arguments)}});window.onerror=function(m,u,l){s("error",[m+" (line "+l+")"])}})();<\/script>';
    var doc = function (withHook) { return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + (withHook ? HOOK : '') + '<style>' + code.css + '</style></head><body>' + code.html + '<script>' + code.js.replace(/<\/script/gi, '<\\/script') + '<\/script></body></html>'; };
    var gutter = function () { var n = pgCode.value.split('\n').length, s = ''; for (var i = 1; i <= n; i++) s += i + '\n'; gut.textContent = s; pgHl.innerHTML = hlCode(pgCode.value, lang) + '\n'; };
    var show = function () { pgCode.value = code[lang]; gutter(); pgCode.scrollTop = 0; gut.scrollTop = 0; };
    var runPg = function () { log.innerHTML = '<div class="dim">Ran at ' + new Date().toLocaleTimeString() + '</div>'; frameEl.srcdoc = doc(true); XR.store(PGKEY, code); };
    show(); runPg();
    $$('.pg-tabs [data-lang]').forEach(function (b) { b.addEventListener('click', function () { lang = b.getAttribute('data-lang'); $$('.pg-tabs [data-lang]').forEach(function (x) { x.setAttribute('aria-selected', x === b); }); show(); pgCode.focus(); }); });
    pgCode.addEventListener('input', function () { code[lang] = pgCode.value; gutter(); if (!pgTouched) { pgTouched = true; stamp('playground'); } if (autoRun.checked) { clearTimeout(runT); runT = setTimeout(runPg, 600); } });
    pgCode.addEventListener('scroll', function () { gut.scrollTop = pgCode.scrollTop; pgHl.scrollTop = pgCode.scrollTop; pgHl.scrollLeft = pgCode.scrollLeft; });
    $('#pgShare').addEventListener('click', function () { XR.copy(location.href.split('#')[0] + '#pg=' + btoa(unescape(encodeURIComponent(JSON.stringify(code))))); XR.toast('Share link copied. It opens with your code loaded.'); stamp('playground'); });
    pgCode.addEventListener('keydown', function (e) {
      if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); var s = pgCode.selectionStart, en = pgCode.selectionEnd; pgCode.setRangeText('  ', s, en, 'end'); pgCode.dispatchEvent(new Event('input')); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runPg(); }
    });
    $('#pgRun').addEventListener('click', runPg);
    $('#pgPreset').addEventListener('change', function () { var p = PRESETS[this.value]; if (!p) return; code = JSON.parse(JSON.stringify(p)); show(); runPg(); stamp('playground'); XR.toast('Loaded preset: ' + this.value); this.value = ''; });
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
      } },
    { id: 'gradient', name: 'Gradient generator', ic: 'layers', ui: '<h3 class="h4">CSS gradient generator</h3><p>Linear, radial or conic, three colour stops and a live preview.</p><div class="tl-row"><div class="ar-seg" id="gt" style="background:var(--bg-2)"></div><button type="button" class="tl-btn" data-a="r">Random</button><button type="button" class="tl-btn pri" data-a="c">Copy CSS</button></div><div class="tl-prev" id="gp"></div><div class="tl-sl" id="gs"></div><pre class="tl-out" id="go"></pre>',
      init: function (p) {
        var st = { type: 'linear', ang: 135, c: [['#c4321d', 0], ['#e2703a', 50], ['#2c6f65', 100]] };
        var css = function () { var stops = st.c.map(function (x) { return x[0] + ' ' + x[1] + '%'; }).join(', '); return st.type === 'linear' ? 'linear-gradient(' + st.ang + 'deg, ' + stops + ')' : st.type === 'radial' ? 'radial-gradient(circle at 50% 50%, ' + stops + ')' : 'conic-gradient(from ' + st.ang + 'deg, ' + stops + ')'; };
        var ui = function () {
          $('#gt', p).innerHTML = ['linear', 'radial', 'conic'].map(function (t) { return '<button type="button" data-gt="' + t + '" aria-pressed="' + (st.type === t) + '" style="color:inherit">' + t + '</button>'; }).join('');
          $('#gs', p).innerHTML = (st.type !== 'radial' ? '<label>Angle <input type="range" data-g="ang" min="0" max="360" value="' + st.ang + '"><output>' + st.ang + '°</output></label>' : '') + st.c.map(function (x, i) { return '<label><input type="color" data-gc="' + i + '" value="' + x[0] + '" style="width:34px;height:30px;border:0;background:none;padding:0"> Stop ' + (i + 1) + ' <input type="range" data-gp="' + i + '" min="0" max="100" value="' + x[1] + '"><output>' + x[1] + '%</output></label>'; }).join('');
          draw();
        };
        var draw = function () { var v = css(); $('#gp', p).style.background = v; $('#go', p).textContent = 'background: ' + v + ';'; };
        p.addEventListener('input', function (e) { var t = e.target; if (t.dataset.g) { st.ang = +t.value; t.nextSibling.textContent = t.value + '°'; } if (t.dataset.gc) st.c[+t.dataset.gc][0] = t.value; if (t.dataset.gp) { st.c[+t.dataset.gp][1] = +t.value; t.nextSibling.textContent = t.value + '%'; } draw(); });
        p.addEventListener('click', function (e) { var t = e.target.closest('button'); if (!t) return; if (t.dataset.gt) { st.type = t.dataset.gt; ui(); } if (t.dataset.a === 'r') { var h = Math.random() * 360; st.c = [0, 1, 2].map(function (i) { return [rgb2hex(hsl2rgb((h + i * 55) % 360, 70, 55)), i * 50]; }); st.ang = Math.round(Math.random() * 360); ui(); } if (t.dataset.a === 'c') { XR.copy($('#go', p).textContent); XR.toast('CSS copied'); } });
        ui();
      } },
    { id: 'shadow', name: 'Box-shadow builder', ic: 'sliders', ui: '<h3 class="h4">Box-shadow builder</h3><p>Drag the sliders. Two layers make shadows look real.</p><div class="sh-stage"><div class="sh-card" id="sc"></div></div><div class="tl-sl" id="ss"></div><div class="tl-row"><label class="tl-chk"><input type="checkbox" id="si"> Inset</label><label class="tl-chk"><input type="checkbox" id="sl" checked> Soft second layer</label><button type="button" class="tl-btn pri" data-a="c">Copy CSS</button></div><pre class="tl-out" id="so"></pre>',
      init: function (p) {
        var v = { x: 0, y: 18, blur: 40, spread: -12, op: 28 }, L = { x: ['X offset', -60, 60], y: ['Y offset', -60, 60], blur: ['Blur', 0, 120], spread: ['Spread', -40, 40], op: ['Opacity %', 0, 100] };
        $('#ss', p).innerHTML = Object.keys(L).map(function (k) { return '<label>' + L[k][0] + ' <input type="range" data-s="' + k + '" min="' + L[k][1] + '" max="' + L[k][2] + '" value="' + v[k] + '"><output>' + v[k] + '</output></label>'; }).join('');
        var draw = function () { var ins = $('#si', p).checked ? 'inset ' : '', main = ins + v.x + 'px ' + v.y + 'px ' + v.blur + 'px ' + v.spread + 'px rgba(31, 24, 19, ' + (v.op / 100).toFixed(2) + ')', css = $('#sl', p).checked ? ins + '0 1px 2px rgba(31, 24, 19, .08), ' + main : main; $('#sc', p).style.boxShadow = css; $('#so', p).textContent = 'box-shadow: ' + css + ';'; };
        p.addEventListener('input', function (e) { var t = e.target; if (t.dataset.s) { v[t.dataset.s] = +t.value; t.nextSibling.textContent = t.value; } draw(); });
        p.addEventListener('click', function (e) { if (e.target.dataset.a === 'c') { XR.copy($('#so', p).textContent); XR.toast('CSS copied'); } });
        draw();
      } },
    { id: 'md', name: 'Markdown preview', ic: 'book', ui: '<h3 class="h4">Markdown preview</h3><p>Headings, bold, italic, code, lists, quotes and links. Renders as you type.</p><div class="tl-grid"><textarea class="tl-area" id="mi" spellcheck="false" style="min-height:280px"># Village notes\n\nThe **toad** says: ship *small*, ship often.\n\n- Terminal with `snake`\n- 17 dev tools\n- An algorithm arena\n\n> Speed is how little you wait.\n\n1. Write code\n2. Run it\n3. [Hire me](hire.html)</textarea><div class="md-out" id="mo"></div></div>',
      init: function (p) { var go = function () { $('#mo', p).innerHTML = md($('#mi', p).value); }; $('#mi', p).addEventListener('input', go); go(); } },
    { id: 'diff', name: 'Diff checker', ic: 'filter', ui: '<h3 class="h4">Diff checker</h3><p>Paste two versions to see what changed, line by line.</p><div class="tl-grid"><textarea class="tl-area" id="da" spellcheck="false">const price = 100\nconst tax = 0.15\nconsole.log(price * tax)</textarea><textarea class="tl-area" id="db" spellcheck="false">const price = 120\nconst tax = 0.15\nconst total = price * (1 + tax)\nconsole.log(total)</textarea></div><div class="tl-msg" id="dm"></div><div class="diff" id="do"></div>',
      init: function (p) {
        var go = function () { var a = $('#da', p).value.split('\n'), b = $('#db', p).value.split('\n'), n = a.length, m = b.length, L = [], i, j; for (i = 0; i <= n; i++) { L[i] = []; for (j = 0; j <= m; j++) L[i][j] = 0; } for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
          var out = [], add = 0, del = 0; i = 0; j = 0; while (i < n && j < m) { if (a[i] === b[j]) { out.push(['same', '  ' + a[i]]); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) { out.push(['del', '- ' + a[i++]]); del++; } else { out.push(['add', '+ ' + b[j++]]); add++; } } while (i < n) { out.push(['del', '- ' + a[i++]]); del++; } while (j < m) { out.push(['add', '+ ' + b[j++]]); add++; }
          $('#do', p).innerHTML = out.map(function (x) { return '<div class="' + x[0] + '">' + esc(x[1]) + '</div>'; }).join(''); $('#dm', p).textContent = add + ' added, ' + del + ' removed, ' + out.filter(function (x) { return x[0] === 'same'; }).length + ' unchanged'; };
        $$('textarea', p).forEach(function (t) { t.addEventListener('input', go); }); go();
      } },
    { id: 'cron', name: 'Cron explainer', ic: 'calendar', ui: '<h3 class="h4">Cron expression explainer</h3><p>Five fields: minute, hour, day of month, month, day of week. See it in plain words and the next five runs.</p><input class="tl-in" id="ci" value="*/15 9-17 * * 1-5" spellcheck="false" aria-label="Cron expression"><div class="tl-row" id="cp"></div><p class="cron-h" id="ch"></p><div class="tl-grid" id="cn" style="grid-template-columns:minmax(0,1fr)"></div>',
      init: function (p) {
        $('#cp', p).innerHTML = ['*/15 9-17 * * 1-5', '0 9 * * 1', '30 2 1 * *', '0 0 * * 0', '0 */6 * * *'].map(function (c) { return '<button type="button" class="tl-btn" data-c="' + c + '">' + c + '</button>'; }).join('');
        var go = function () { var r = cron($('#ci', p).value); $('#ch', p).textContent = r.text; $('#ch', p).style.color = r.ok ? '' : 'var(--red)'; $('#cn', p).innerHTML = r.next.map(function (d, i) { return '<div class="tl-kv"><small>Run ' + (i + 1) + '</small><b>' + d.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + '</b></div>'; }).join(''); };
        $('#ci', p).addEventListener('input', go); p.addEventListener('click', function (e) { var c = e.target.getAttribute('data-c'); if (c) { $('#ci', p).value = c; go(); } }); go();
      } },
    { id: 'url', name: 'URL parser', ic: 'link', ui: '<h3 class="h4">URL parser</h3><p>Split any URL into parts and query parameters. Encode or decode components.</p><input class="tl-in" id="ui2" value="https://api.village.dev:8443/v1/orders?status=paid&amp;limit=20&amp;q=toad%20sage#results" spellcheck="false" aria-label="URL"><div class="tl-row"><button type="button" class="tl-btn" data-a="e">Encode component</button><button type="button" class="tl-btn" data-a="d">Decode component</button></div><div class="tl-msg" id="um"></div><div class="tl-grid" id="uo"></div>',
      init: function (p) {
        var go = function () { var o = $('#uo', p), m = $('#um', p); try { var u = new URL($('#ui2', p).value); m.className = 'tl-msg ok'; m.textContent = 'Valid URL'; var rows = [['Protocol', u.protocol], ['Host', u.hostname], ['Port', u.port || '(default)'], ['Path', u.pathname], ['Hash', u.hash || '(none)']]; u.searchParams.forEach(function (v, k) { rows.push(['?' + k, v]); }); o.innerHTML = rows.map(function (x) { return '<div class="tl-kv"><small>' + esc(x[0]) + '</small><b>' + esc(x[1]) + '</b></div>'; }).join(''); } catch (e) { m.className = 'tl-msg bad'; m.textContent = 'Not a full URL. Include the protocol, like https://'; o.innerHTML = ''; } };
        $('#ui2', p).addEventListener('input', go);
        p.addEventListener('click', function (e) { var a = e.target.getAttribute('data-a'), i = $('#ui2', p); if (a === 'e') i.value = encodeURIComponent(i.value); if (a === 'd') { try { i.value = decodeURIComponent(i.value); } catch (err) { XR.toast('Nothing to decode', 'warn'); } } if (a) go(); });
        go();
      } },
    { id: 'case', name: 'Case converter', ic: 'type', ui: '<h3 class="h4">Case converter</h3><p>Type anything and get every naming style. Click to copy.</p><input class="tl-in" id="kc" value="village toad sage API client" spellcheck="false" aria-label="Text"><div class="tl-grid" id="ko" style="margin-top:12px"></div>',
      init: function (p) {
        var go = function () { var w = $('#kc', p).value.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(/[^A-Za-z0-9]+/).filter(Boolean).map(function (x) { return x.toLowerCase(); }), cap = function (x) { return x.charAt(0).toUpperCase() + x.slice(1); };
          var rows = [['camelCase', w.map(function (x, i) { return i ? cap(x) : x; }).join('')], ['PascalCase', w.map(cap).join('')], ['snake_case', w.join('_')], ['kebab-case', w.join('-')], ['CONSTANT_CASE', w.join('_').toUpperCase()], ['Title Case', w.map(cap).join(' ')], ['Sentence case', cap(w.join(' '))], ['dot.case', w.join('.')]];
          $('#ko', p).innerHTML = rows.map(function (x) { return '<div class="tl-kv"><small>' + x[0] + '</small><b>' + esc(x[1]) + '</b><button type="button" data-cp="' + esc(x[1]) + '">Copy</button></div>'; }).join(''); };
        $('#kc', p).addEventListener('input', go); p.addEventListener('click', function (e) { var c = e.target.getAttribute('data-cp'); if (c) { XR.copy(c); XR.toast('Copied ' + c); } }); go();
      } },
    { id: 'units', name: 'CSS unit converter', ic: 'move', ui: '<h3 class="h4">CSS unit converter</h3><p>Pixels to rem, em, pt and viewport units, with your own base size and screen.</p><div class="tl-row"><label class="tl-range">Pixels <input class="tl-in" id="upx" type="number" value="24" style="width:110px"></label><label class="tl-range">Root font <input class="tl-in" id="ubase" type="number" value="16" style="width:90px"></label><label class="tl-range">Viewport <input class="tl-in" id="uvw" type="number" value="1440" style="width:100px"> x <input class="tl-in" id="uvh" type="number" value="900" style="width:90px"></label></div><div class="tl-grid" id="uo2"></div>',
      init: function (p) {
        var go = function () { var px = +$('#upx', p).value || 0, b = +$('#ubase', p).value || 16, vw = +$('#uvw', p).value || 1440, vh = +$('#uvh', p).value || 900, r = function (x) { return +x.toFixed(4); };
          $('#uo2', p).innerHTML = [['rem', r(px / b) + 'rem'], ['em (same parent)', r(px / b) + 'em'], ['pt', r(px * .75) + 'pt'], ['vw', r(px / vw * 100) + 'vw'], ['vh', r(px / vh * 100) + 'vh'], ['clamp() idea', 'clamp(' + r(px * .75 / b) + 'rem, ' + r(px / vw * 100) + 'vw, ' + r(px * 1.25 / b) + 'rem)']].map(function (x) { return '<div class="tl-kv"><small>' + x[0] + '</small><b>' + x[1] + '</b><button type="button" data-cp="' + x[1] + '">Copy</button></div>'; }).join(''); };
        $$('input', p).forEach(function (i) { i.addEventListener('input', go); }); p.addEventListener('click', function (e) { var c = e.target.getAttribute('data-cp'); if (c) { XR.copy(c); XR.toast('Copied ' + c); } }); go();
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
    tNav.addEventListener('click', function (e) { var b = e.target.closest('[data-tool]'); if (b) { openTool(b.getAttribute('data-tool')); quest('world-tool'); stamp('toolbox'); } });
    tPanel.addEventListener('input', function () { quest('world-tool'); stamp('toolbox'); });
    $('#tbxQ').addEventListener('input', function () { var q = this.value.trim().toLowerCase(); $$('button', tNav).forEach(function (b) { b.hidden = q && b.textContent.toLowerCase().indexOf(q) < 0 && b.getAttribute('data-tool').indexOf(q) < 0; }); });
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
    var apiHist = [];
    $('#apiHist').addEventListener('click', function (e) { var b = e.target.closest('[data-h]'); if (!b) return; var x = apiHist[+b.getAttribute('data-h')]; $('#apiM').value = x.m; $('#apiU').value = x.u; bodyOn(); genCode(); apiF.requestSubmit ? apiF.requestSubmit() : apiF.dispatchEvent(new Event('submit')); });
    var STXT = { 401: 'Unauthorized', 200: 'OK', 201: 'Created', 204: 'No Content', 400: 'Bad Request', 404: 'Not Found', 405: 'Method Not Allowed', 418: 'I am a teapot', 422: 'Unprocessable Entity' };
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
      var m = $('#apiM').value, u = $('#apiU').value.trim() || '/', r = $('#apiAuth').checked || /^\/v1\/(health|teapot)/.test(u) ? api(m, u, $('#apiB').value) : { status: 401, body: { error: 'unauthorized', message: 'Missing API key. Tick "Send API key" and try again.', docs: 'https://api.village.dev/docs#auth' }, extra: {} }, ms = (r.extra.delay || 0) + 60 + Math.round(Math.random() * 140), b = $('#apiSend');
      b.disabled = true; $('#apiSt').innerHTML = '<span class="spin"></span><span>' + m + ' ' + esc(u) + '</span>';
      setTimeout(function () {
        b.disabled = false;
        var bodyStr = r.body == null ? '' : JSON.stringify(r.body), size = bodyStr.length;
        var h = { 'content-type': 'application/json; charset=utf-8', 'content-length': String(size), 'x-request-id': 'req_' + Math.random().toString(36).slice(2, 12), 'x-ratelimit-remaining': String(99 - Math.floor(Math.random() * 20)), 'cache-control': m === 'GET' ? 'max-age=30' : 'no-store', server: 'toad-edge/5.0' };
        if (r.extra.location) h.location = r.extra.location;
        last = { r: r, h: h };
        $('#apiSt').innerHTML = '<b class="st-' + String(r.status)[0] + '">' + r.status + ' ' + (STXT[r.status] || '') + '</b><span>' + ms + ' ms</span><span>' + (size > 1024 ? (size / 1024).toFixed(1) + ' KB' : size + ' B') + '</span><span>' + m + ' ' + esc(u) + '</span>';
        showRes(); quest('world-tool'); stamp('api');
        apiHist.unshift({ m: m, u: u, s: r.status }); apiHist = apiHist.slice(0, 8);
        $('#apiHist').innerHTML = apiHist.map(function (x, i) { return '<button type="button" data-h="' + i + '"><b class="m-' + x.m + '">' + x.m + '</b> ' + esc(x.u) + '<i class="st-' + String(x.s)[0] + '">' + x.s + '</i></button>'; }).join('');
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
    XR.whenVisible(gitLog, function () { stamp('git'); $$('.gc', gitLog).forEach(function (el, i) { setTimeout(function () { el.classList.add('in'); }, i * 70); }); });
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

  /* ================= passport ================= */
  var STAMPS = [['terminal', '端', 'Terminal'], ['playground', '工', 'Workshop'], ['toolbox', '鍛', 'Forge'], ['api', '社', 'Shrine'], ['git', '塔', 'Tower'], ['arena', '闘', 'Arena'], ['typing', '打', 'Dojo']];
  var PKEY = 'xr-world-passport';
  function ppState() { return XR.store(PKEY) || {}; }
  function ppDraw(fresh) {
    var st = ppState(), n = STAMPS.filter(function (s) { return st[s[0]]; }).length, grid = $('#ppGrid');
    if (!grid) return;
    grid.innerHTML = STAMPS.map(function (s) { return '<div class="pp-st' + (st[s[0]] ? ' on' : '') + '" style="' + (fresh === s[0] ? '' : 'animation:none') + '"><i' + (fresh === s[0] ? '' : ' style="animation:none"') + '>' + s[1] + '</i>' + s[2] + '</div>'; }).join('');
    $('#ppN').textContent = n + '/7';
    $('#ppF').textContent = n === 7 ? 'Village master. Every building visited. The toad bows.' : (7 - n) + ' stamp' + (7 - n === 1 ? '' : 's') + ' to go. Tip: the tower stamps itself when you scroll to it.';
  }
  function stamp(id) {
    var st = ppState();
    if (st[id]) return;
    st[id] = Date.now(); XR.store(PKEY, st);
    var s = STAMPS.filter(function (x) { return x[0] === id; })[0], n = Object.keys(st).length;
    ppDraw(id);
    var pill = $('#ppPill'); if (pill) { pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump'); }
    XR.toast('Stamp collected: ' + s[2] + ' ' + s[1] + ' (' + n + '/7)');
    if (n === 7) { quest('world-passport'); setTimeout(function () { XR.toast('All seven stamps. You are a village master.'); rain(); }, 1400); }
  }
  (function passport() {
    var pp = $('#passport'); if (!pp) return;
    ppDraw();
    $('#ppPill').addEventListener('click', function () { var on = pp.classList.toggle('open'); this.setAttribute('aria-expanded', on); });
    document.addEventListener('click', function (e) { if (!e.target.closest('#passport')) { pp.classList.remove('open'); $('#ppPill').setAttribute('aria-expanded', 'false'); } });
  })();

  /* ================= map decorations (stars, fireflies) ================= */
  (function decor() {
    var st = $('#wdStars'), ff = $('#wdFlies'), R = XR.seeded('stars');
    if (st) { var s = ''; for (var i = 0; i < 46; i++) s += '<circle cx="' + Math.round(R() * 1560) + '" cy="' + Math.round(R() * 210) + '" r="' + (R() * 1.6 + .6).toFixed(1) + '" style="animation-delay:' + (R() * 3).toFixed(2) + 's"/>'; st.innerHTML = s; }
    if (ff) { var f = ''; for (var j = 0; j < 18; j++) f += '<circle cx="' + Math.round(80 + R() * 1400) + '" cy="' + Math.round(380 + R() * 110) + '" r="2.2" style="animation-delay:' + (R() * 5).toFixed(2) + 's;animation-duration:' + (4 + R() * 3).toFixed(1) + 's"/>'; ff.innerHTML = f; }
  })();

  /* ================= snake (terminal game) ================= */
  var snakeOn = false;
  function snake() {
    if (snakeOn) return;
    snakeOn = true;
    var cv = document.createElement('canvas'), C = 18, W = 24, H = 14, ctx = cv.getContext('2d'), dpr = window.devicePixelRatio || 1;
    cv.width = W * C * dpr; cv.height = H * C * dpr; cv.style.width = W * C + 'px'; ctx.scale(dpr, dpr);
    var line = document.createElement('div'); line.className = 'ln'; line.appendChild(cv); var info = document.createElement('div'); info.className = 'ln t-dim'; out.appendChild(line); out.appendChild(info); out.scrollTop = out.scrollHeight;
    var body = [[6, 7], [5, 7], [4, 7]], dir = [1, 0], next = [1, 0], food = null, score = 0, speed = 130, alive = true, tmr;
    var place = function () { do { food = [Math.floor(Math.random() * W), Math.floor(Math.random() * H)]; } while (body.some(function (b) { return b[0] === food[0] && b[1] === food[1]; })); };
    var draw = function () {
      ctx.fillStyle = '#0b0a08'; ctx.fillRect(0, 0, W * C, H * C);
      ctx.fillStyle = 'rgba(255,255,255,.03)'; for (var x = 0; x < W; x++) for (var y = 0; y < H; y++) if ((x + y) % 2) ctx.fillRect(x * C, y * C, C, C);
      ctx.fillStyle = '#ff7b72'; ctx.beginPath(); ctx.arc(food[0] * C + C / 2, food[1] * C + C / 2, C / 3, 0, 7); ctx.fill();
      ctx.fillStyle = '#ff7b72'; ctx.fillRect(food[0] * C + C / 2 - 1, food[1] * C + 3, 2, 4);
      body.forEach(function (b, i) { ctx.fillStyle = i ? '#4d7424' : '#7ee787'; ctx.fillRect(b[0] * C + 1, b[1] * C + 1, C - 2, C - 2); });
      info.innerHTML = 'Score <span class="t-grn">' + score + '</span> · best ' + (XR.store('xr-snake') || 0) + (alive ? ' · Q to quit' : '');
    };
    var end = function (msg) { alive = false; clearTimeout(tmr); snakeOn = false; document.removeEventListener('keydown', key, true); var best = XR.store('xr-snake') || 0; if (score > best) XR.store('xr-snake', score); draw(); print(msg + ' Score: <span class="t-grn">' + score + '</span>' + (score > best ? ' <span class="t-yel">New best!</span>' : '') + ' Type <span class="t-grn">snake</span> to play again.'); inp.focus({ preventScroll: true }); };
    var step = function () {
      dir = next; var h = [body[0][0] + dir[0], body[0][1] + dir[1]];
      if (h[0] < 0 || h[1] < 0 || h[0] >= W || h[1] >= H || body.some(function (b) { return b[0] === h[0] && b[1] === h[1]; })) { end('<span class="t-red">Game over.</span>'); return; }
      body.unshift(h);
      if (h[0] === food[0] && h[1] === food[1]) { score++; speed = Math.max(60, speed - 4); place(); } else body.pop();
      draw(); tmr = setTimeout(step, speed);
    };
    var key = function (e) {
      var k = e.key.toLowerCase(), m = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] }[k];
      if (k === 'q' || k === 'escape') { e.preventDefault(); end('Snake quit.'); return; }
      if (m) { e.preventDefault(); e.stopPropagation(); if (m[0] !== -dir[0] || m[1] !== -dir[1]) next = m; }
    };
    var sx, sy;
    cv.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    cv.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; var m = Math.abs(dx) > Math.abs(dy) ? [dx > 0 ? 1 : -1, 0] : [0, dy > 0 ? 1 : -1]; if (m[0] !== -dir[0] || m[1] !== -dir[1]) next = m; });
    document.addEventListener('keydown', key, true);
    place(); draw(); tmr = setTimeout(step, 400);
  }

  /* ================= helpers: highlighting, markdown, cron, colour ================= */
  function hlCode(src, lang) {
    var e = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (lang === 'html') return e.replace(/(&lt;!--[\s\S]*?--&gt;)|(&lt;\/?)([a-zA-Z0-9-]+)|([a-zA-Z-:@]+)(=)("[^"]*"|'[^']*')/g, function (m, com, lt, tag, at, eq, val) { if (com) return '<span class="c">' + com + '</span>'; if (lt) return lt + '<span class="t">' + tag + '</span>'; return '<span class="a">' + at + '</span>' + eq + '<span class="s">' + val + '</span>'; });
    if (lang === 'css') return e.replace(/(\/\*[\s\S]*?\*\/)|("[^"]*"|'[^']*')|(@[a-z-]+)|([a-z-]+)(\s*:)(?=[^{};]*[;}])|(#[0-9a-fA-F]{3,8}\b|-?\b\d+\.?\d*(?:px|rem|em|%|s|ms|deg|vh|vw|fr|turn)?\b)/g, function (m, com, str, at, prop, colon, num) { if (com) return '<span class="c">' + com + '</span>'; if (str) return '<span class="s">' + str + '</span>'; if (at) return '<span class="k">' + at + '</span>'; if (prop) return '<span class="a">' + prop + '</span>' + colon; return '<span class="n">' + num + '</span>'; });
    return e.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(const|let|var|function|return|if|else|for|while|of|in|new|class|import|from|export|await|async|true|false|null|undefined|this|document|window|console)\b|(\b\d+\.?\d*\b)|([A-Za-z_$][\w$]*)(?=\s*\()/g, function (m, com, str, kw, num, fn) { if (com) return '<span class="c">' + com + '</span>'; if (str) return '<span class="s">' + str + '</span>'; if (kw) return '<span class="k">' + kw + '</span>'; if (num) return '<span class="n">' + num + '</span>'; return '<span class="f">' + fn + '</span>'; });
  }
  function md(src) {
    var inl = function (t) { return t.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\[([^\]]+)\]\(((?:https?:\/\/|[\w./#-])[^)\s]*)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>'); };
    var lines = esc(src).split('\n'), out = [], list = null, code = false, buf = [];
    var flush = function () { if (list) { out.push('</' + list + '>'); list = null; } };
    lines.forEach(function (l) {
      if (/^```/.test(l)) { if (code) { out.push('<pre class="tl-out"><code>' + buf.join('\n') + '</code></pre>'); buf = []; } flush(); code = !code; return; }
      if (code) { buf.push(l); return; }
      var h = l.match(/^(#{1,3})\s+(.*)/), ul = l.match(/^\s*[-*]\s+(.*)/), ol = l.match(/^\s*\d+\.\s+(.*)/), q = l.match(/^&gt;\s?(.*)/);
      if (h) { flush(); out.push('<h' + h[1].length + '>' + inl(h[2]) + '</h' + h[1].length + '>'); }
      else if (ul || ol) { var t = ul ? 'ul' : 'ol'; if (list !== t) { flush(); out.push('<' + t + '>'); list = t; } out.push('<li>' + inl((ul || ol)[1]) + '</li>'); }
      else if (q) { flush(); out.push('<blockquote>' + inl(q[1]) + '</blockquote>'); }
      else if (l.trim()) { flush(); out.push('<p>' + inl(l) + '</p>'); }
      else flush();
    });
    flush();
    return out.join('');
  }
  function cron(expr) {
    var f = expr.trim().split(/\s+/), R = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 6]], NAMES = [null, null, null, ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']];
    if (f.length !== 5) return { ok: false, text: 'A cron expression needs exactly 5 fields.', next: [] };
    var sets = [];
    try {
      f.forEach(function (fld, i) {
        var set = {}, lo = R[i][0], hi = R[i][1];
        fld.split(',').forEach(function (part) {
          var m = part.match(/^(\*|\d+)(?:-(\d+))?(?:\/(\d+))?$/); if (!m) throw 0;
          var a = m[1] === '*' ? lo : +m[1], b = m[2] ? +m[2] : m[1] === '*' || m[3] ? hi : a, st = m[3] ? +m[3] : 1;
          if (i === 4) { a = a % 7; b = b === 7 ? 6 : b; }
          if (a < lo || b > hi || a > b || st < 1) throw 0;
          for (var v = a; v <= b; v += st) set[v] = 1;
        });
        sets.push(set);
      });
    } catch (e) { return { ok: false, text: 'That does not look like a valid cron expression.', next: [] }; }
    var two = function (n) { return ('0' + n).slice(-2); }, desc = [], mf = f[0], hf = f[1];
    if (/^\d+$/.test(mf) && /^\d+$/.test(hf)) desc.push('At ' + two(hf) + ':' + two(mf));
    else {
      desc.push(mf === '*' ? 'Every minute' : /^\*\/\d+$/.test(mf) ? 'Every ' + mf.slice(2) + ' minutes' : 'At minute ' + mf);
      if (hf !== '*') desc.push(/^\*\/\d+$/.test(hf) ? 'every ' + hf.slice(2) + ' hours' : /-/.test(hf) ? 'between ' + two(hf.split('-')[0]) + ':00 and ' + two(hf.split('-')[1]) + ':59' : 'during hour ' + hf);
    }
    if (f[2] !== '*') desc.push('on day ' + f[2] + ' of the month');
    if (f[3] !== '*') desc.push('in ' + Object.keys(sets[3]).map(function (m) { return NAMES[3][m]; }).join(', '));
    if (f[4] !== '*') desc.push('on ' + (f[4] === '1-5' ? 'weekdays' : Object.keys(sets[4]).map(function (d) { return NAMES[4][d]; }).join(', ')));
    var next = [], d = new Date(); d.setSeconds(0, 0); d.setMinutes(d.getMinutes() + 1);
    var domR = f[2] !== '*', dowR = f[4] !== '*';
    for (var n = 0; n < 527040 && next.length < 5; n++) {
      if (sets[3][d.getMonth() + 1] && sets[1][d.getHours()] && sets[0][d.getMinutes()]) {
        var dm = sets[2][d.getDate()], dw = sets[4][d.getDay()];
        if (domR && dowR ? dm || dw : dm && dw) next.push(new Date(d));
      }
      d.setMinutes(d.getMinutes() + 1);
    }
    return { ok: true, text: desc.join(', ') + '.', next: next };
  }
  function hsl2rgb(h, s, l) { s /= 100; l /= 100; var k = function (n) { return (n + h / 30) % 12; }, a = s * Math.min(l, 1 - l), f = function (n) { return 255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))); }; return [f(0), f(8), f(4)]; }


  /* ================= algorithm arena ================= */
  var BIGO = { bubble: 'Bubble · O(n²) time · O(1) space · stable', insertion: 'Insertion · O(n²), O(n) when nearly sorted · stable', selection: 'Selection · O(n²) always · few swaps', merge: 'Merge · O(n log n) · O(n) extra space · stable', quick: 'Quick · O(n log n) average, O(n²) worst · in place', heap: 'Heap · O(n log n) guaranteed · in place' };
  var ANAMES = { bubble: 'Bubble', insertion: 'Insertion', selection: 'Selection', merge: 'Merge', quick: 'Quick', heap: 'Heap' };
  function recordSort(name, arr) {
    var a = arr.slice(), ops = [], n = a.length;
    var cmp = function (i, j) { ops.push(['c', i, j]); return a[i] > a[j]; };
    var swap = function (i, j) { ops.push(['s', i, j]); var t = a[i]; a[i] = a[j]; a[j] = t; };
    var write = function (i, v) { ops.push(['w', i, v]); a[i] = v; };
    var done = function (i) { ops.push(['d', i]); };
    var i, j;
    if (name === 'bubble') { for (i = 0; i < n; i++) { var sw = false; for (j = 0; j < n - i - 1; j++) if (cmp(j, j + 1)) { swap(j, j + 1); sw = true; } done(n - i - 1); if (!sw) { for (j = 0; j < n - i - 1; j++) done(j); break; } } }
    else if (name === 'insertion') { for (i = 1; i < n; i++) { j = i; while (j > 0 && cmp(j - 1, j)) { swap(j - 1, j); j--; } } for (i = 0; i < n; i++) done(i); }
    else if (name === 'selection') { for (i = 0; i < n; i++) { var m = i; for (j = i + 1; j < n; j++) if (cmp(m, j)) m = j; if (m !== i) swap(i, m); done(i); } }
    else if (name === 'merge') {
      var ms = function (lo, hi) { if (hi - lo < 1) return; var mid = (lo + hi) >> 1; ms(lo, mid); ms(mid + 1, hi); var L = a.slice(lo, mid + 1), Rr = a.slice(mid + 1, hi + 1), x = 0, y = 0, k = lo; while (x < L.length && y < Rr.length) { ops.push(['c', lo + x, mid + 1 + y]); if (L[x] <= Rr[y]) write(k++, L[x++]); else write(k++, Rr[y++]); } while (x < L.length) write(k++, L[x++]); while (y < Rr.length) write(k++, Rr[y++]); };
      ms(0, n - 1); for (i = 0; i < n; i++) done(i);
    }
    else if (name === 'quick') {
      var qs = function (lo, hi) { if (lo >= hi) { if (lo === hi) done(lo); return; } var p = lo; for (var k = lo; k < hi; k++) if (!cmp(k, hi)) { swap(p, k); p++; } swap(p, hi); done(p); qs(lo, p - 1); qs(p + 1, hi); };
      qs(0, n - 1);
    }
    else if (name === 'heap') {
      var sift = function (s, e) { var r = s; while (2 * r + 1 <= e) { var c = 2 * r + 1, sw2 = r; if (cmp(c, sw2)) sw2 = c; if (c + 1 <= e && cmp(c + 1, sw2)) sw2 = c + 1; if (sw2 === r) return; swap(r, sw2); r = sw2; } };
      for (i = (n >> 1) - 1; i >= 0; i--) sift(i, n - 1);
      for (i = n - 1; i > 0; i--) { swap(0, i); done(i); sift(0, i - 1); } done(0);
    }
    return ops;
  }
  function shuffled(n) { var a = []; for (var i = 1; i <= n; i++) a.push(i); for (var k = n - 1; k > 0; k--) { var r = Math.floor(Math.random() * (k + 1)), t = a[k]; a[k] = a[r]; a[r] = t; } return a; }
  var audioCtx = null;
  function beep(v, max) { try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); var o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.frequency.value = 180 + v / max * 900; o.type = 'triangle'; g.gain.value = .04; g.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + .08); o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + .09); } catch (e) { /* audio blocked */ } }
  function Board(el, arr) {
    this.el = el; this.arr = arr.slice(); this.max = arr.length;
    el.innerHTML = arr.map(function (v) { return '<i style="height:' + (v / arr.length * 100).toFixed(2) + '%"></i>'; }).join('');
    this.bars = [].slice.call(el.children); this.hot = [];
  }
  Board.prototype.apply = function (op) {
    var b = this.bars, a = this.arr, max = this.max;
    if (op[0] === 'c') { b[op[1]].classList.add('c'); b[op[2]].classList.add('c'); this.hot.push(op[1], op[2]); }
    else if (op[0] === 's') { var t = a[op[1]]; a[op[1]] = a[op[2]]; a[op[2]] = t; b[op[1]].style.height = (a[op[1]] / max * 100) + '%'; b[op[2]].style.height = (a[op[2]] / max * 100) + '%'; b[op[1]].classList.add('w'); b[op[2]].classList.add('w'); this.hot.push(op[1], op[2]); }
    else if (op[0] === 'w') { a[op[1]] = op[2]; b[op[1]].style.height = (op[2] / max * 100) + '%'; b[op[1]].classList.add('w'); this.hot.push(op[1]); }
    else if (op[0] === 'd') b[op[1]].classList.add('d');
  };
  Board.prototype.cool = function () { var b = this.bars; this.hot.forEach(function (i) { b[i].classList.remove('c', 'w'); }); this.hot = []; };
  (function arena() {
    var bars = $('#bars');
    if (!bars) return;
    $$('.ar-tabs [data-ar]').forEach(function (t) { t.addEventListener('click', function () { $$('.ar-tabs [data-ar]').forEach(function (x) { x.setAttribute('aria-selected', x === t); }); $$('.ar-pane').forEach(function (p) { p.classList.toggle('on', p.getAttribute('data-arp') === t.getAttribute('data-ar')); }); if (t.getAttribute('data-ar') === 'path') pfResize(); if (t.getAttribute('data-ar') === 'race' && !raceBoards.length) raceSetup(); }); });
    /* sorting */
    var arr = shuffled(60), board = new Board(bars, arr), ops = [], oi = 0, running = false, raf, acc = 0, cC = 0, cW = 0, sound = false;
    var speed = function (el) { return .05 * Math.pow(1.075, +(el || $('#srtS')).value); };
    var stats = function () { $('#stC').textContent = cC.toLocaleString(); $('#stW').textContent = cW.toLocaleString(); $('#stT').textContent = oi.toLocaleString() + (ops.length ? ' / ' + ops.length.toLocaleString() : ''); };
    var reset = function (n) { cancelAnimationFrame(raf); running = false; arr = shuffled(n || arr.length); board = new Board(bars, arr); ops = []; oi = 0; cC = cW = 0; stats(); runBtn(); };
    var runBtn = function () { $('#srtRun').innerHTML = '<svg class="ic"><use href="#i-' + (running ? 'pause' : 'play') + '"/></svg>' + (running ? 'Pause' : oi && oi < ops.length ? 'Resume' : 'Run'); };
    var frame = function () {
      board.cool(); acc += speed();
      var k = Math.floor(acc); acc -= k; var last = null;
      while (k-- > 0 && oi < ops.length) { var op = ops[oi++]; board.apply(op); if (op[0] === 'c') cC++; else if (op[0] !== 'd') cW++; last = op; }
      if (sound && last && last[0] !== 'd') beep(board.arr[last[1]] || 1, board.max);
      stats();
      if (oi < ops.length) raf = requestAnimationFrame(frame); else { running = false; board.cool(); runBtn(); XR.toast(ANAMES[$('#srtA').value] + ' sort: ' + cC.toLocaleString() + ' comparisons, ' + cW.toLocaleString() + ' writes'); }
    };
    $('#stO').textContent = BIGO[$('#srtA').value];
    $('#srtA').addEventListener('change', function () { $('#stO').textContent = BIGO[this.value]; if (oi) reset(); });
    $('#srtN').addEventListener('input', function () { $('#srtNv').textContent = this.value; reset(+this.value); });
    $('#srtShuf').addEventListener('click', function () { reset(); });
    $('#srtSnd').addEventListener('click', function () { sound = !sound; this.setAttribute('aria-pressed', sound); });
    $('#srtRun').addEventListener('click', function () {
      if (running) { running = false; cancelAnimationFrame(raf); runBtn(); return; }
      if (!ops.length || oi >= ops.length) { if (oi >= ops.length && ops.length) { arr = shuffled(arr.length); board = new Board(bars, arr); } ops = recordSort($('#srtA').value, board.arr); oi = 0; cC = cW = 0; }
      running = true; runBtn(); stamp('arena'); raf = requestAnimationFrame(frame);
    });
    stats();

    /* race */
    var raceBoards = [], raceArr = shuffled(40), raceRaf = null;
    function raceSetup() {
      cancelAnimationFrame(raceRaf);
      $('#race').innerHTML = Object.keys(ANAMES).map(function (k) { return '<div class="rc" data-k="' + k + '"><div class="rc-h"><span><span class="rc-place">·</span>' + ANAMES[k] + '</span><em>0 steps</em></div><div class="bars"></div></div>'; }).join('');
      raceBoards = $$('.rc', $('#race')).map(function (el) { var k = el.getAttribute('data-k'); return { k: k, el: el, b: new Board($('.bars', el), raceArr), ops: recordSort(k, raceArr), i: 0, done: false }; });
    }
    $('#rcShuf').addEventListener('click', function () { raceArr = shuffled(40); raceSetup(); });
    $('#rcRun').addEventListener('click', function () {
      raceSetup(); stamp('arena'); var place = 0, acc2 = 0;
      (function rf() {
        acc2 += 2.2; var k = Math.floor(acc2); acc2 -= k;
        raceBoards.forEach(function (r) {
          if (r.done) return; r.b.cool();
          for (var s = 0; s < k && r.i < r.ops.length; s++) r.b.apply(r.ops[r.i++]);
          $('em', r.el).textContent = r.i.toLocaleString() + ' steps';
          if (r.i >= r.ops.length) { r.done = true; r.b.cool(); place++; $('.rc-place', r.el).textContent = place; if (place === 1) { r.el.classList.add('p1'); $('em', r.el).classList.add('win'); } }
        });
        if (raceBoards.some(function (r) { return !r.done; })) raceRaf = requestAnimationFrame(rf);
        else { var w = raceBoards.slice().sort(function (a, b) { return a.ops.length - b.ops.length; })[0]; XR.toast(ANAMES[w.k] + ' sort wins with ' + w.ops.length.toLocaleString() + ' steps'); }
      })();
    });

    /* pathfinding */
    var cvs = $('#pfC'), g = cvs.getContext('2d'), COLS = 44, ROWS = 20, CS = 20, grid = [], S0 = [4, 10], E0 = [39, 10], vis = [], path = [], anim = null, tool = 'wall', drag = null;
    function idx(x, y) { return y * COLS + x; }
    function pfResize() {
      var w = cvs.parentNode.clientWidth - 24, phone = w < 600;
      if (w < 100) return;
      var cols = phone ? 22 : 44, rows = phone ? 18 : 20, cs = Math.floor(w / cols);
      if (cols !== COLS || rows !== ROWS || !grid.length) { COLS = cols; ROWS = rows; grid = new Array(COLS * ROWS).fill(0); S0 = [Math.floor(COLS * .12), Math.floor(ROWS / 2)]; E0 = [Math.floor(COLS * .86), Math.floor(ROWS / 2)]; vis = []; path = []; }
      CS = cs; var dpr = window.devicePixelRatio || 1;
      cvs.width = COLS * CS * dpr; cvs.height = ROWS * CS * dpr; cvs.style.height = ROWS * CS + 'px'; cvs.style.width = COLS * CS + 'px'; g.setTransform(dpr, 0, 0, dpr, 0, 0);
      pfDraw(vis.length, path.length);
    }
    function pfDraw(nv, np) {
      g.fillStyle = '#12100d'; g.fillRect(0, 0, COLS * CS, ROWS * CS);
      for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) { var c = grid[idx(x, y)]; g.fillStyle = c === 1 ? '#efe4cc' : c === 2 ? '#6b4f2a' : (x + y) % 2 ? '#171411' : '#1b1814'; g.fillRect(x * CS + .5, y * CS + .5, CS - 1, CS - 1); }
      for (var i = 0; i < nv && i < vis.length; i++) { var v = vis[i], t = i / Math.max(1, vis.length); g.fillStyle = 'hsla(' + (170 - t * 60) + ',55%,' + (38 + t * 10) + '%,' + (i > nv - 12 ? .95 : .55) + ')'; g.fillRect(v[0] * CS + 1.5, v[1] * CS + 1.5, CS - 3, CS - 3); }
      if (np) { g.strokeStyle = '#f2cc60'; g.lineWidth = Math.max(3, CS / 4); g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); for (var k = 0; k < np && k < path.length; k++) { var px = path[k][0] * CS + CS / 2, py = path[k][1] * CS + CS / 2; if (k) g.lineTo(px, py); else g.moveTo(px, py); } g.stroke(); }
      var dot = function (p, col) { g.fillStyle = col; g.beginPath(); g.arc(p[0] * CS + CS / 2, p[1] * CS + CS / 2, CS * .38, 0, 7); g.fill(); g.strokeStyle = '#0f0d0b'; g.lineWidth = 2; g.stroke(); };
      dot(S0, '#f06a52'); dot(E0, '#7ee787');
    }
    function cellAt(e) { var r = cvs.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) / (r.width / COLS)), Math.floor((e.clientY - r.top) / (r.height / ROWS))]; }
    function paint(c) { if (c[0] < 0 || c[1] < 0 || c[0] >= COLS || c[1] >= ROWS) return; if ((c[0] === S0[0] && c[1] === S0[1]) || (c[0] === E0[0] && c[1] === E0[1])) return; grid[idx(c[0], c[1])] = tool === 'wall' ? 1 : tool === 'weight' ? 2 : 0; }
    cvs.addEventListener('pointerdown', function (e) { e.preventDefault(); cvs.setPointerCapture(e.pointerId); cancelAnimationFrame(anim); vis = []; path = []; var c = cellAt(e); drag = c[0] === S0[0] && c[1] === S0[1] ? 'S' : c[0] === E0[0] && c[1] === E0[1] ? 'E' : 'P'; if (drag === 'P') paint(c); pfDraw(0, 0); });
    cvs.addEventListener('pointermove', function (e) { if (!drag) return; var c = cellAt(e); if (c[0] < 0 || c[1] < 0 || c[0] >= COLS || c[1] >= ROWS) return; if (drag === 'S' && grid[idx(c[0], c[1])] !== 1) S0 = c; else if (drag === 'E' && grid[idx(c[0], c[1])] !== 1) E0 = c; else if (drag === 'P') paint(c); pfDraw(0, 0); });
    cvs.addEventListener('pointerup', function () { drag = null; });
    $('#pfTool').addEventListener('click', function (e) { var b = e.target.closest('[data-t]'); if (!b) return; tool = b.getAttribute('data-t'); $$('#pfTool button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); });
    $('#pfClear').addEventListener('click', function () { cancelAnimationFrame(anim); grid.fill(0); vis = []; path = []; pfDraw(0, 0); ['#pfV', '#pfL', '#pfCost'].forEach(function (s) { $(s).textContent = '0'; }); });
    $('#pfMaze').addEventListener('click', function () {
      cancelAnimationFrame(anim); vis = []; path = [];
      grid.fill(1); var st = [[1, 1]], seen = {}; grid[idx(1, 1)] = 0; seen['1,1'] = 1;
      while (st.length) { var c = st[st.length - 1], nb = [[2, 0], [-2, 0], [0, 2], [0, -2]].map(function (d) { return [c[0] + d[0], c[1] + d[1], d]; }).filter(function (n) { return n[0] > 0 && n[1] > 0 && n[0] < COLS - 1 && n[1] < ROWS - 1 && !seen[n[0] + ',' + n[1]]; });
        if (!nb.length) { st.pop(); continue; } var nx = nb[Math.floor(Math.random() * nb.length)]; seen[nx[0] + ',' + nx[1]] = 1; grid[idx(c[0] + nx[2][0] / 2, c[1] + nx[2][1] / 2)] = 0; grid[idx(nx[0], nx[1])] = 0; st.push([nx[0], nx[1]]); }
      for (var k = 0; k < COLS * ROWS * .04; k++) { var rx = 1 + Math.floor(Math.random() * (COLS - 2)), ry = 1 + Math.floor(Math.random() * (ROWS - 2)); grid[idx(rx, ry)] = 0; }
      var free = function (p) { p[0] = Math.max(1, Math.min(COLS - 2, p[0] | 1)); p[1] = Math.max(1, Math.min(ROWS - 2, p[1] | 1)); grid[idx(p[0], p[1])] = 0; };
      free(S0); free(E0); pfDraw(0, 0);
    });
    function solve(alg) {
      var N = COLS * ROWS, start = idx(S0[0], S0[1]), goal = idx(E0[0], E0[1]), prev = new Int32Array(N).fill(-1), dist = new Float64Array(N).fill(Infinity), seen = new Uint8Array(N), order = [];
      var h = function (i) { return Math.abs(i % COLS - E0[0]) + Math.abs(Math.floor(i / COLS) - E0[1]); };
      var nbs = function (i) { var x = i % COLS, y = Math.floor(i / COLS), r = []; if (x > 0) r.push(i - 1); if (x < COLS - 1) r.push(i + 1); if (y > 0) r.push(i - COLS); if (y < ROWS - 1) r.push(i + COLS); return r.filter(function (j) { return grid[j] !== 1; }); };
      var cost = function (j) { return grid[j] === 2 ? 5 : 1; };
      dist[start] = 0;
      if (alg === 'bfs' || alg === 'dfs') {
        var q = [start]; seen[start] = 1;
        while (q.length) { var cur = alg === 'bfs' ? q.shift() : q.pop(); order.push(cur); if (cur === goal) break; nbs(cur).forEach(function (j) { if (!seen[j]) { seen[j] = 1; prev[j] = cur; dist[j] = dist[cur] + cost(j); q.push(j); } }); }
      } else {
        var open = [start], inO = new Uint8Array(N); inO[start] = 1;
        while (open.length) {
          var bi = 0; for (var k = 1; k < open.length; k++) { var fa = dist[open[k]] + (alg === 'astar' ? h(open[k]) : 0), fb = dist[open[bi]] + (alg === 'astar' ? h(open[bi]) : 0); if (fa < fb) bi = k; }
          var u = open.splice(bi, 1)[0]; inO[u] = 0; if (seen[u]) continue; seen[u] = 1; order.push(u); if (u === goal) break;
          nbs(u).forEach(function (j) { var nd = dist[u] + cost(j); if (nd < dist[j]) { dist[j] = nd; prev[j] = u; if (!inO[j]) { open.push(j); inO[j] = 1; } } });
        }
      }
      var p = []; if (prev[goal] !== -1 || goal === start) { for (var c2 = goal; c2 !== -1; c2 = prev[c2]) p.unshift(c2); }
      return { order: order.map(function (i) { return [i % COLS, Math.floor(i / COLS)]; }), path: p.map(function (i) { return [i % COLS, Math.floor(i / COLS)]; }), cost: dist[goal] };
    }
    $('#pfRun').addEventListener('click', function () {
      cancelAnimationFrame(anim); stamp('arena');
      var alg = $('#pfA').value, r = solve(alg); vis = r.order; path = r.path;
      var nv = 0, np = 0, per = Math.max(2, Math.ceil(vis.length / 90));
      (function step() {
        if (nv < vis.length) nv = Math.min(vis.length, nv + per); else np++;
        pfDraw(nv, np); $('#pfV').textContent = nv;
        if (nv < vis.length || np < path.length) anim = requestAnimationFrame(step);
        else { $('#pfL').textContent = path.length ? path.length - 1 : 0; $('#pfCost').textContent = path.length ? r.cost : 0; $('#pfInfo').textContent = path.length ? { astar: 'A* uses a distance guess to aim at the goal. Shortest path, few visits.', dijkstra: 'Dijkstra explores by total cost. Always shortest, respects mud.', bfs: 'BFS explores in rings. Shortest by steps, ignores mud cost.', dfs: 'DFS dives deep first. Finds a path, rarely the shortest.' }[alg] : 'No path. The goal is walled in.'; }
      })();
    });
    window.addEventListener('resize', function () { if ($('.ar-pane[data-arp="path"]').classList.contains('on')) pfResize(); });
    pfResize();
  })();

  /* ================= typing dojo ================= */
  var SNIPS = {
    JavaScript: ["const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);\nconsole.log(`Total: $${total.toFixed(2)}`);", "async function getUser(id) {\n  const res = await fetch(`/api/users/${id}`);\n  if (!res.ok) throw new Error('Not found');\n  return res.json();\n}", "bot.on('message', (msg) => {\n  if (msg.text === '/start') {\n    bot.sendMessage(msg.chat.id, 'Welcome to the village!');\n  }\n});"],
    Python: ["def fizzbuzz(n):\n    for i in range(1, n + 1):\n        print('Fizz' * (i % 3 == 0) + 'Buzz' * (i % 5 == 0) or i)", "import requests\n\nres = requests.get('https://api.village.dev/v1/users')\nfor user in res.json()['data']:\n    print(user['name'], user['city'])", "prices = {'tea': 4, 'mango': 2, 'toad': 99}\ncheap = {k: v for k, v in prices.items() if v < 10}\nprint(sorted(cheap))"],
    Java: ["@EventHandler\npublic void onJoin(PlayerJoinEvent event) {\n    Player player = event.getPlayer();\n    player.sendMessage(\"Welcome to BlockRealm!\");\n}", "public int binarySearch(int[] a, int target) {\n    int lo = 0, hi = a.length - 1;\n    while (lo <= hi) {\n        int mid = (lo + hi) >>> 1;\n        if (a[mid] == target) return mid;\n        if (a[mid] < target) lo = mid + 1; else hi = mid - 1;\n    }\n    return -1;\n}"],
    HTML: ["<button class=\"btn\" type=\"submit\" aria-label=\"Send\">\n  <svg class=\"icon\"><use href=\"#send\"/></svg>\n  Send message\n</button>", "<nav class=\"nav\">\n  <a href=\"/\" class=\"logo\">Village</a>\n  <ul>\n    <li><a href=\"/tools\">Tools</a></li>\n    <li><a href=\"/hire\">Hire me</a></li>\n  </ul>\n</nav>"]
  };
  (function dojo() {
    var box = $('#tyC'), inpT = $('#tyI');
    if (!box) return;
    var lang = 'JavaScript', text = '', pos = 0, marks = [], errors = 0, keys = 0, t0 = 0, timer = null, samples = [], finished = false, lastSnip = -1;
    $('#tyL').innerHTML = Object.keys(SNIPS).map(function (l, i) { return '<button type="button" data-l="' + l + '" aria-pressed="' + (i === 0) + '">' + l + '</button>'; }).join('');
    function pick() { var list = SNIPS[lang], i; do { i = Math.floor(Math.random() * list.length); } while (list.length > 1 && i === lastSnip); lastSnip = i; return list[i]; }
    function render() {
      box.innerHTML = text.split('').map(function (c, i) { var cls = 'ch' + (c === '\n' ? ' nl' : '') + (marks[i] === 1 ? ' ok' : marks[i] === 2 ? ' bad' : '') + (i === pos ? ' cur' : ''); return c === '\n' ? '<span class="' + cls + '"></span>\n' : '<span class="' + cls + '">' + esc(c) + '</span>'; }).join('') + (pos >= text.length ? '<span class="ch cur"></span>' : '') + (t0 ? '' : '<div class="hint">Click here and start typing</div>');
    }
    function load() { text = pick(); pos = 0; marks = []; errors = 0; skipped = 0; keys = 0; t0 = 0; samples = []; finished = false; clearInterval(timer); $('#tyR').hidden = true; box.classList.remove('act'); upd(); render(); }
    function upd() {
      var sec = t0 ? (Date.now() - t0) / 1000 : 0, ok = marks.filter(function (m) { return m === 1; }).length;
      var wpm = sec > 0 ? Math.round(ok / 5 / (sec / 60)) : 0, acc = keys ? Math.round((keys - errors) / keys * 100) : 100;
      $('#tyW').textContent = wpm; $('#tyA').textContent = acc + '%'; $('#tyT').textContent = sec.toFixed(1) + 's'; $('#tyE').textContent = errors; $('#tyP').style.width = (pos / text.length * 100) + '%';
      return { wpm: wpm, acc: acc, sec: sec };
    }
    var skipped = 0;
    function skipIndent() { if (pos < text.length && text[pos - 1] === '\n' && text[pos] === ' ') { var n0 = pos; while (text[pos] === ' ') { marks[pos] = 1; pos++; } skipped = pos - n0; } }
    function type(ch) {
      if (finished) return;
      if (!t0) { t0 = Date.now(); box.classList.add('act'); timer = setInterval(function () { var s = upd(); samples.push(s.wpm); }, 1000); }
      if (ch === ' ' && skipped > 0 && text[pos] !== ' ') { skipped--; return; }
      skipped = 0; keys++;
      if (ch === text[pos]) marks[pos] = 1; else { marks[pos] = 2; errors++; }
      pos++; skipIndent();
      if (pos >= text.length) finish(); else { upd(); render(); }
    }
    function back() { if (finished || pos === 0) return; pos--; while (pos > 0 && text[pos] === ' ' && text[pos - 1] === ' ' && marks[pos - 1] === 1 && /\n\s*$/.test(text.slice(0, pos))) pos--; marks[pos] = 0; upd(); render(); }
    function rank(w) { return w >= 80 ? 'Toad Sage' : w >= 60 ? 'Kage' : w >= 40 ? 'Jonin' : w >= 25 ? 'Chunin' : 'Genin'; }
    function board() { var b = XR.store('xr-typing') || []; $('#tyB').innerHTML = b.length ? b.map(function (x) { return '<li><b>' + x.w + ' WPM</b><span>' + x.a + '% · ' + esc(x.l) + '</span></li>'; }).join('') : '<li class="empty">No runs yet. Your first one will land here.</li>'; }
    function finish() {
      finished = true; clearInterval(timer); var s = upd(); render(); samples.push(s.wpm);
      var b = XR.store('xr-typing') || [], best = b.length ? b[0].w : 0;
      b.push({ w: s.wpm, a: s.acc, l: lang, t: Date.now() }); b.sort(function (x, y) { return y.w - x.w; }); XR.store('xr-typing', b.slice(0, 5)); board();
      var mx = Math.max.apply(0, samples.concat([10])), pts = samples.map(function (v, i) { return (samples.length > 1 ? i / (samples.length - 1) * 300 : 150) + ',' + (56 - v / mx * 50).toFixed(1); }).join(' ');
      $('#tyR').innerHTML = '<div class="ty-card"><span class="rank">' + rank(s.wpm) + '</span><h3>' + s.wpm + '<small>WPM</small></h3>' + (s.wpm > best ? '<p class="pb">New personal best</p>' : '') + '<div class="row"><span><b>' + s.acc + '%</b>accuracy</span><span><b>' + s.sec.toFixed(1) + 's</b>time</span><span><b>' + errors + '</b>errors</span><span><b>' + text.length + '</b>characters</span></div><svg viewBox="0 0 300 60" preserveAspectRatio="none"><polyline points="' + pts + '" fill="none" stroke="#f06a52" stroke-width="2.5" vector-effect="non-scaling-stroke"/></svg><button type="button" class="btn btn-primary btn-sm" id="tyAgain">Next snippet</button></div>';
      $('#tyR').hidden = false; stamp('typing');
      $('#tyAgain').addEventListener('click', function () { load(); focus(); });
    }
    function focus() { inpT.focus({ preventScroll: true }); }
    box.addEventListener('click', focus);
    box.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); focus(); } });
    inpT.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Backspace') { e.preventDefault(); back(); }
      else if (e.key === 'Enter') { e.preventDefault(); type('\n'); }
      else if (e.key === 'Tab') { e.preventDefault(); type(' '); }
      else if (e.key.length === 1) { e.preventDefault(); type(e.key); }
    });
    inpT.addEventListener('input', function () { var v = inpT.value; inpT.value = ''; for (var i = 0; i < v.length; i++) type(v[i]); });
    inpT.addEventListener('focus', function () { box.classList.add('focus'); });
    inpT.addEventListener('blur', function () { box.classList.remove('focus'); });
    $('#tyL').addEventListener('click', function (e) { var b = e.target.closest('[data-l]'); if (!b) return; lang = b.getAttribute('data-l'); $$('#tyL button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); lastSnip = -1; load(); focus(); });
    $('#tyNew').addEventListener('click', function () { load(); focus(); });
    load(); board();
  })();

})();
