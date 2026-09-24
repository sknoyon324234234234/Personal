/* Lab stage 05 — Minecraft-style server with a working plugin (commands, GUI shop, economy) */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;
  var CW = 320, CH = 180, B = 8;

  // tiny pixel-art sprites for the shop GUI (8x8)
  var SPRITES = {
    sword: { p: ['......cc', '.....ccc', '....ccc.', '.b.ccc..', '..bcc...', '..wb....', '.w..b...', 'w.......'], c: { c: '#5fe0f0', b: '#6b4a2b', w: '#6b4a2b' } },
    apple: { p: ['....g...', '...g....', '.yyyyyy.', 'yyyyyyyy', 'yyyywyyy', 'yyyyyyyy', '.yyyyyy.', '..yyyy..'], c: { g: '#3f8a2e', y: '#ffcc33', w: '#fff6b0' } },
    pearl: { p: ['..tttt..', '.tTTTTt.', 'tTTwTTTt', 'tTTTTTTt', 'tTTTTTTt', 'tTTTTTTt', '.tTTTTt.', '..tttt..'], c: { t: '#0f5c55', T: '#2bb3a6', w: '#bff' } },
    elytra: { p: ['gg....gg', 'ggg..ggg', 'gggggggg', 'gGgggggg', 'gGGggGGg', 'gGG..GGg', '.G....G.', '........'], c: { g: '#9aa0b8', G: '#6b7090' } },
    book: { p: ['.pppppp.', 'pPPPPPPp', 'pPwPPPPp', 'pPPPPPPp', 'pPPPwPPp', 'pPPPPPPp', 'pppppppp', '.wwwwww.'], c: { p: '#4a2a7a', P: '#8b5cf6', w: '#e9d5ff' } },
    crown: { p: ['........', 'y..y..y.', 'yy.yy.yy', 'yyyyyyyy', 'yryyyryy', 'yyyyyyyy', '.yyyyyy.', '........'], c: { y: '#ffcc33', r: '#ff2e4d' } },
    chest: { p: ['bbbbbbbb', 'bBBBBBBb', 'bBBBBBBb', 'bbbyybbb', 'bBBBBBBb', 'bBBBBBBb', 'bBBBBBBb', 'bbbbbbbb'], c: { b: '#5a3a1a', B: '#a0692e', y: '#ffcc33' } },
    rocket: { p: ['...rr...', '..rrrr..', '..wwww..', '..wbbw..', '..wwww..', '.rwwwwr.', 'r.y..y.r', '..y..y..'], c: { r: '#ff2e4d', w: '#f4f0e8', b: '#27e1d6', y: '#ffc24b' } }
  };
  var SHOP = [
    { id: 'sword', name: 'Diamond Sword', price: 250 },
    { id: 'apple', name: 'Golden Apple', price: 80, n: 4 },
    { id: 'pearl', name: 'Ender Pearl', price: 120, n: 16 },
    { id: 'elytra', name: 'Elytra', price: 900 },
    { id: 'book', name: 'Mending Book', price: 150 },
    { id: 'rocket', name: 'Firework Rocket', price: 60, n: 32 },
    { id: 'chest', name: 'Legend Crate Key', price: 400 },
    { id: 'crown', name: 'Rank [VIP]', price: 1500 }
  ];

  function spriteSVG(name) {
    var s = SPRITES[name], d = '';
    s.p.forEach(function (row, y) {
      row.split('').forEach(function (ch, x) { if (s.c[ch]) d += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + s.c[ch] + '"/>'; });
    });
    return '<svg class="mc-item" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true">' + d + '</svg>';
  }

  function mc(text) {
    // "&a" color codes → spans
    var out = '', open = false;
    XR.esc(text).replace(/&amp;[lnmo]/g, '').split(/&amp;([0-9a-f])/).forEach(function (part, i) {
      if (i % 2 === 1) { if (open) out += '</span>'; out += '<span class="c-' + part + '">'; open = true; }
      else out += part;
    });
    return out + (open ? '</span>' : '');
  }

  LAB.register('minecraft', function (stage) {
    var canvas = XR.$('.mc-canvas', stage), ctx = canvas.getContext('2d');
    var chat = XR.$('.mc-chat', stage), form = XR.$('.mc-input', stage), input = XR.$('input', form);
    var gui = XR.$('.mc-gui', stage), slots = XR.$('.mc-slots', stage);
    var coinsEl = XR.$('.mc-coins', stage), rankEl = XR.$('.mc-rank', stage);
    var coins = 1250, rank = 'MEMBER', night = false, rain = false, fly = false, daily = false;
    var rand = LAB.rng('blockrealm');
    ctx.imageSmoothingEnabled = false;

    /* ---------- world ---------- */
    var cols = CW / B, heights = [];
    for (var x = 0; x < cols; x++) {
      heights[x] = Math.round(6 + Math.sin(x * .32) * 1.6 + Math.sin(x * .11 + 1) * 2.2 + Math.sin(x * .7) * .5);
    }
    var WATER = 5;
    var terrain = document.createElement('canvas');
    terrain.width = CW; terrain.height = CH;
    (function paint() {
      var t = terrain.getContext('2d');
      function block(bx, by, base, dark, top) {
        t.fillStyle = base; t.fillRect(bx, by, B, B);
        for (var i = 0; i < 5; i++) { t.fillStyle = dark; t.fillRect(bx + ((rand() * B) | 0), by + ((rand() * B) | 0), 1, 1); }
        if (top) { t.fillStyle = top; t.fillRect(bx, by, B, 3); t.fillStyle = dark; t.fillRect(bx + ((rand() * B) | 0), by + 3, 1, 1); }
      }
      for (var cx = 0; cx < cols; cx++) {
        var h = heights[cx], topY = CH - h * B;
        for (var r = 0; r < h; r++) {
          var by = topY + r * B;
          if (r === 0) block(cx * B, by, '#7a5230', '#5d3c20', h < WATER ? '#d9c77b' : '#5fbf3b');
          else if (r < 3) block(cx * B, by, '#7a5230', '#5d3c20');
          else block(cx * B, by, '#7d7d86', '#5f5f68');
        }
        if (h < WATER) {
          t.fillStyle = 'rgba(40,110,255,.72)';
          t.fillRect(cx * B, CH - WATER * B + 2, B, (WATER - h) * B - 2);
        }
      }
      [7, 26, 35].forEach(function (tx) {
        var h = heights[tx]; if (h < WATER) return;
        var base = CH - h * B;
        for (var i = 1; i <= 4; i++) block(tx * B, base - i * B, '#6b4a2b', '#4f361e');
        for (var lx = -1; lx <= 1; lx++) for (var ly = 0; ly < 3; ly++) {
          if (ly === 0 && lx !== 0) continue;
          block((tx + lx) * B, base - (6 - ly) * B + B, '#2f7a24', '#235c1b');
        }
        block((tx - 1) * B, base - 4 * B, '#2f7a24', '#235c1b'); block((tx + 1) * B, base - 4 * B, '#2f7a24', '#235c1b');
      });
    })();

    var stars = []; for (var s = 0; s < 40; s++) stars.push([(rand() * CW) | 0, (rand() * CH * .5) | 0]);
    var clouds = [[20, 18, 40], [140, 30, 56], [240, 14, 32]];
    var drops = [], parts = [];
    var px = 13, t = 0, visible = true;

    function drawPlayer() {
      var gy = CH - heights[px] * B - 2 * B + (fly ? -10 + Math.sin(t / 8) * 3 : 0), gx = px * B;
      ctx.fillStyle = '#3b2716'; ctx.fillRect(gx, gy, 8, 3);            // hair
      ctx.fillStyle = '#c99574'; ctx.fillRect(gx, gy + 3, 8, 5);         // face
      ctx.fillStyle = '#fff'; ctx.fillRect(gx + 1, gy + 4, 2, 1); ctx.fillRect(gx + 5, gy + 4, 2, 1);
      ctx.fillStyle = '#3b3bd0'; ctx.fillRect(gx + 2, gy + 4, 1, 1); ctx.fillRect(gx + 5, gy + 4, 1, 1);
      ctx.fillStyle = '#ff2e4d'; ctx.fillRect(gx, gy + 8, 8, 5);         // shirt
      ctx.fillStyle = '#c99574'; ctx.fillRect(gx - 2, gy + 8, 2, 5); ctx.fillRect(gx + 8, gy + 8, 2, 5);
      ctx.fillStyle = '#2d2d80'; ctx.fillRect(gx, gy + 13, 8, 3);        // legs
      ctx.fillStyle = '#fff'; ctx.font = '6px monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(gx - 8, gy - 9, 24, 7);
      ctx.fillStyle = rank === 'VIP' ? '#55ff55' : '#fff'; ctx.fillText(rank === 'VIP' ? '[VIP] You' : 'You', gx + 4, gy - 3);
    }

    function frame() {
      requestAnimationFrame(frame);
      if (!visible || document.hidden) return;
      t++;
      if (t % 2) return; // ~30fps
      var g = ctx.createLinearGradient(0, 0, 0, CH);
      if (night) { g.addColorStop(0, '#03041a'); g.addColorStop(1, '#1b2452'); }
      else { g.addColorStop(0, rain ? '#5f7390' : '#5d93ff'); g.addColorStop(1, rain ? '#9aa8bd' : '#b8d6ff'); }
      ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
      if (night) {
        ctx.fillStyle = '#fff';
        stars.forEach(function (st, i) { if ((t + i * 7) % 60 < 50) ctx.fillRect(st[0], st[1], 1, 1); });
        ctx.fillStyle = '#e8ecff'; ctx.fillRect(250, 20, 14, 14); ctx.fillStyle = '#c3c9e8'; ctx.fillRect(253, 24, 3, 3); ctx.fillRect(258, 29, 2, 2);
      } else if (!rain) {
        ctx.fillStyle = '#fff3a6'; ctx.fillRect(252, 18, 18, 18); ctx.fillStyle = '#ffe14d'; ctx.fillRect(255, 21, 12, 12);
      }
      ctx.fillStyle = night ? 'rgba(200,210,255,.18)' : rain ? 'rgba(90,100,120,.9)' : 'rgba(255,255,255,.92)';
      clouds.forEach(function (c) {
        c[0] -= .15; if (c[0] < -c[2] - 10) c[0] = CW + 10;
        ctx.fillRect(c[0] | 0, c[1], c[2], 6); ctx.fillRect((c[0] | 0) + 6, c[1] - 4, c[2] - 16, 4);
      });
      ctx.drawImage(terrain, 0, 0);
      drawPlayer();
      if (night) { ctx.fillStyle = 'rgba(5,8,40,.42)'; ctx.fillRect(0, 0, CW, CH); }
      if (rain) {
        if (drops.length < 90) for (var i = 0; i < 4; i++) drops.push([Math.random() * CW, -5]);
        ctx.fillStyle = 'rgba(160,190,255,.75)';
        drops = drops.filter(function (d) { d[1] += 5; d[0] -= 1; ctx.fillRect(d[0] | 0, d[1] | 0, 1, 4); return d[1] < CH; });
      } else drops = [];
      parts = parts.filter(function (p) {
        p.x += p.vx; p.y += p.vy; p.vy += .12; p.l--;
        ctx.fillStyle = p.c; ctx.fillRect(p.x | 0, p.y | 0, 2, 2);
        return p.l > 0;
      });
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(canvas);
    requestAnimationFrame(frame);

    function burst(colors) {
      var gx = px * B + 4, gy = CH - heights[px] * B - 2 * B;
      for (var i = 0; i < 50; i++) parts.push({ x: gx, y: gy, vx: (Math.random() - .5) * 3, vy: -Math.random() * 3.5 - 1, l: 40 + Math.random() * 30, c: colors[i % colors.length] });
    }

    /* ---------- chat + commands ---------- */
    function say(text) {
      var p = document.createElement('p');
      p.innerHTML = mc(text);
      chat.appendChild(p);
      while (chat.children.length > 12) chat.removeChild(chat.firstChild);
    }
    function setCoins(v) { coins = v; coinsEl.textContent = coins.toLocaleString('en-US'); }

    function openShop() {
      slots.innerHTML = '';
      for (var i = 0; i < 18; i++) {
        var it = SHOP[i];
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'mc-slot';
        if (it) {
          b.innerHTML = spriteSVG(it.id) + (it.n ? '<small>' + it.n + '</small>' : '');
          b.title = it.name + ' — ' + it.price + ' coins';
          b.setAttribute('aria-label', it.name + ', ' + it.price + ' coins');
          b.addEventListener('click', buy.bind(null, it));
        } else { b.disabled = true; b.setAttribute('aria-hidden', 'true'); b.tabIndex = -1; }
        slots.appendChild(b);
      }
      gui.hidden = false;
      var first = XR.$('.mc-slot', slots); if (first) first.focus({ preventScroll: true });
    }
    function closeShop() { gui.hidden = true; input.focus({ preventScroll: true }); }
    function buy(it) {
      if (coins < it.price) { say('&cNot enough coins! &7You need &e' + (it.price - coins) + ' &7more.'); return; }
      setCoins(coins - it.price);
      if (it.id === 'crown') { rank = 'VIP'; rankEl.textContent = '[VIP]'; say('&a&lRANK UP! &fYou are now &a[VIP]'); burst(['#55ff55', '#ffff55', '#ffffff']); }
      else say('&aPurchased &f' + it.name + (it.n ? ' x' + it.n : '') + ' &afor &e' + it.price + ' coins');
    }
    XR.$('.mc-gui-close', stage).addEventListener('click', closeShop);
    gui.addEventListener('click', function (e) { if (e.target === gui) closeShop(); });
    stage.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !gui.hidden) closeShop(); });

    var CMDS = {
      help: function () {
        say('&6--- &eRealmCore Help &6---');
        say('&e/shop &7- open the Realm Shop');
        say('&e/daily &7- claim 250 coins &8| &e/balance');
        say('&e/time day|night &8| &e/weather clear|rain');
        say('&e/rankup &8| &e/fly &8| &e/spawn &8| &e/plugins');
      },
      shop: function () { say('&7Opening &6Realm Shop&7...'); openShop(); },
      balance: function () { say('&6Balance: &e' + coins.toLocaleString('en-US') + ' coins'); },
      bal: function () { CMDS.balance(); },
      daily: function () {
        if (daily) { say('&cAlready claimed! &7Come back in &e23h 59m'); return; }
        daily = true; setCoins(coins + 250); burst(['#ffcc33', '#fff6b0', '#ff8800']);
        say('&a+250 coins &7— daily reward claimed! Streak: &e6 days');
      },
      time: function (a) {
        if (a === 'night') { night = true; say('&7Set the time to &913000 &7(night)'); }
        else if (a === 'day') { night = false; say('&7Set the time to &e1000 &7(day)'); }
        else say('&cUsage: /time <day|night>');
      },
      weather: function (a) {
        if (a === 'rain') { rain = true; say('&7Changing to &9rainy &7weather'); }
        else if (a === 'clear') { rain = false; say('&7Changing to &eclear &7weather'); }
        else say('&cUsage: /weather <clear|rain>');
      },
      fly: function () { fly = !fly; say(fly ? '&aFlight enabled.' : '&cFlight disabled.'); },
      rankup: function () {
        if (rank === 'VIP') { say('&7You are already &a[VIP]&7. Next rank &d[LEGEND] &7costs &e5,000'); return; }
        if (coins < 1000) { say('&cYou need &e1,000 coins &cto rank up. &7You have &e' + coins); return; }
        setCoins(coins - 1000); rank = 'VIP'; rankEl.textContent = '[VIP]';
        say('&a&lRANK UP! &fYou are now &a[VIP]'); burst(['#55ff55', '#ffff55', '#ffffff']);
      },
      spawn: function () { say('&7Teleporting to &bspawn&7 in 3 seconds...'); setTimeout(function () { say('&aTeleported!'); }, 1500); },
      plugins: function () { say('&fPlugins (5): &aRealmCore&f, &aVault&f, &aLuckPerms&f, &aPlaceholderAPI&f, &aWorldGuard'); },
      gamemode: function () { say('&cYou don\'t have permission to do that.'); },
      gm: function () { CMDS.gamemode(); }
    };

    function run(text) {
      text = text.trim();
      if (!text) return;
      if (text.charAt(0) === '/') {
        var parts = text.slice(1).toLowerCase().split(/\s+/);
        var fn = CMDS[parts[0]];
        if (fn) fn(parts[1]); else say('&cUnknown command. Type "/help" for help.');
      } else {
        say((rank === 'VIP' ? '&a[VIP] ' : '&7') + 'You&f: ' + text.replace(/&/g, ''));
        if (Math.random() < .6) setTimeout(function () {
          var r = ['gg', 'welcome to the server!', 'try /shop, the elytra is worth it', 'anyone want to trade diamonds?', 'this plugin is smooth'];
          say('&b[MVP] Kaito&f: ' + r[(Math.random() * r.length) | 0]);
        }, 900);
      }
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); var v = input.value; input.value = ''; run(v); });
    XR.$$('.mc-cmds button', stage).forEach(function (b) {
      b.addEventListener('click', function () { run(b.getAttribute('data-cmd')); });
    });

    say('&eWelcome to &6&lBlockRealm&e!');
    say('&7RealmCore v3.2 loaded. Type &f/help &7for commands.');
    setInterval(function () {
      if (document.hidden || !visible) return;
      var b = ['&d[Realm] &fDouble XP weekend is live!', '&d[Realm] &fVote daily with &e/vote &ffor free crate keys', '&d[Realm] &fNew minigame: &bSky Wars &fis open!'];
      say(b[(Math.random() * b.length) | 0]);
    }, 22000);
  });
})();
