/* Lab stage 04 — the block garden: a paper-craft isometric island, plugin banners and server commands */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;
  var N = 9, MAXZ = 7, A = 28, HH = 14, ZH = 25;
  var TYPES = {
    grass: { k: '草', name: 'Grass', c: ['#9bb865', '#8a6a44', '#6f5334'] },
    stone: { k: '石', name: 'Stone', c: ['#c7c1b5', '#a59e92', '#857e73'] },
    wood: { k: '木', name: 'Wood', c: ['#cf9f60', '#9c6b3a', '#7e542b'] },
    sakura: { k: '桜', name: 'Sakura', c: ['#f5c3ce', '#e3a5b3', '#c98796'] },
    sand: { k: '砂', name: 'Sand', c: ['#eedcab', '#d7c08a', '#bda671'] },
    water: { k: '水', name: 'Water', c: ['#93c3d2', '#79abbc', '#6192a3'] },
    lantern: { k: '灯', name: 'Lantern', c: ['#f6e7c4', '#d9443a', '#b03026'] },
    roof: { k: '瓦', name: 'Roof', c: ['#5d626e', '#484c56', '#383b43'] },
    erase: { k: '消', name: 'Erase', c: ['#fbf6ea', '#e2d6bd', '#cbbd9f'] }
  };
  var PAL = ['grass', 'stone', 'wood', 'sakura', 'sand', 'water', 'lantern', 'erase'];
  var FLAGS = [['eco', '経', 'Economy'], ['shop', '店', 'Market'], ['rank', '位', 'Ranks'], ['claim', '守', 'Land claim']];
  var RANKS = [[0, 'Ashigaru'], [8, 'Samurai'], [20, 'Hatamoto'], [40, 'Daimyo'], [70, 'Shogun']];
  var SPAWN = { x: 3, y: 5 }, CLAIM = [2, 4, 4, 6];
  var STALL = [[6, 2, 'wood'], [7, 2, 'wood'], [6, 3, 'wood'], [7, 3, 'wood']];

  function key(x, y, z) { return x + '|' + y + '|' + z; }
  function mini(t) {
    var c = TYPES[t].c;
    return '<svg viewBox="0 0 28 28" aria-hidden="true"><polygon points="14,3 25,9 14,15 3,9" fill="' + c[0] + '"/><polygon points="3,9 14,15 14,26 3,20" fill="' + c[1] + '"/><polygon points="25,9 14,15 14,26 25,20" fill="' + c[2] + '"/>' +
      (t === 'erase' ? '<path d="M9 12l10 8M19 12l-10 8" stroke="#c4321d" stroke-width="2.4" stroke-linecap="round"/>' : '') + '<g fill="none" stroke="rgba(31,24,19,.5)" stroke-width=".8"><polygon points="14,3 25,9 14,15 3,9"/><polygon points="3,9 14,15 14,26 3,20"/><polygon points="25,9 14,15 14,26 25,20"/></g></svg>';
  }

  LAB.register('minecraft', function (stage) {
    var svg = XR.$('.bg-iso', stage), chat = XR.$('.bg-chat', stage), form = XR.$('.bg-cmd', stage), input = XR.$('input', form);
    var coinsEl = XR.$('.bg-coins', stage), rankEl = XR.$('.bg-rank', stage), placedEl = XR.$('.bg-placed b', stage);
    var W = {}, tool = 'grass', flags = {}, coins = 0, placed = 0, rank = 0, home = { x: SPAWN.x, y: SPAWN.y }, cur = { x: 4, y: 4 }, last = null;

    /* ---- the island ---- */
    function build() {
      W = {};
      var r = LAB.rng('garden');
      for (var x = 0; x < N; x++) for (var y = 0; y < N; y++) {
        var d = Math.hypot(x - 4, y - 4) + (r() - .5) * .5, h = d < 1.7 ? 3 : d < 2.9 ? 2 : d < 3.9 ? 1 : 0;
        if (!h) { W[key(x, y, 0)] = 'water'; continue; }
        for (var z = 0; z < h; z++) W[key(x, y, z)] = z < h - 1 ? 'stone' : h === 1 ? 'sand' : 'grass';
      }
      var tx = 5, ty = 5, tz = top(tx, ty) + 1;
      W[key(tx, ty, tz)] = 'wood'; W[key(tx, ty, tz + 1)] = 'wood';
      [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (o) { W[key(tx + o[0], ty + o[1], tz + 2)] = 'sakura'; });
      W[key(tx, ty, tz + 3)] = 'sakura';
      if (flags.shop) stall(true);
    }
    function top(x, y) { for (var z = MAXZ; z >= 0; z--) if (W[key(x, y, z)]) return z; return -1; }
    function stall(on) {
      STALL.forEach(function (s) {
        var z = top(s[0], s[1]);
        if (on) { W[key(s[0], s[1], z + 1)] = s[2]; W[key(s[0], s[1], z + 2)] = 'roof'; }
        else { [z, z - 1].forEach(function (k) { var t = W[key(s[0], s[1], k)]; if (t === 'roof' || t === 'wood') delete W[key(s[0], s[1], k)]; }); }
      });
    }

    /* ---- drawing: painter's order, hidden faces skipped ---- */
    function P(x, y, z) { return ((x - y) * A).toFixed(1) + ',' + ((x + y) * HH - z * ZH).toFixed(1); }
    function draw() {
      var list = Object.keys(W).map(function (k) { var p = k.split('|'); return [+p[0], +p[1], +p[2], W[k]]; });
      list.sort(function (a, b) { return (a[0] + a[1]) - (b[0] + b[1]) || a[2] - b[2]; });
      var out = '';
      list.forEach(function (b) {
        var x = b[0], y = b[1], z = b[2], c = TYPES[b[3]].c, op = b[3] === 'water' ? ' fill-opacity=".9"' : '', f = '';
        if (!W[key(x, y, z + 1)]) f += '<polygon class="t" fill="' + c[0] + '"' + op + ' points="' + P(x, y, z + 1) + ' ' + P(x + 1, y, z + 1) + ' ' + P(x + 1, y + 1, z + 1) + ' ' + P(x, y + 1, z + 1) + '"/>';
        if (!W[key(x, y + 1, z)]) f += '<polygon fill="' + c[1] + '"' + op + ' points="' + P(x, y + 1, z + 1) + ' ' + P(x + 1, y + 1, z + 1) + ' ' + P(x + 1, y + 1, z) + ' ' + P(x, y + 1, z) + '"/>';
        if (!W[key(x + 1, y, z)]) f += '<polygon fill="' + c[2] + '"' + op + ' points="' + P(x + 1, y, z + 1) + ' ' + P(x + 1, y + 1, z + 1) + ' ' + P(x + 1, y + 1, z) + ' ' + P(x + 1, y, z) + '"/>';
        if (f) out += '<g class="b' + (last === key(x, y, z) ? ' pop' : '') + '" data-x="' + x + '" data-y="' + y + '">' + f + '</g>';
      });
      if (flags.claim) {
        var z0 = top(SPAWN.x, SPAWN.y) + 1.02;
        out += '<polygon class="cur" style="stroke:#2c6f65" points="' + P(CLAIM[0], CLAIM[1], z0) + ' ' + P(CLAIM[2] + 1, CLAIM[1], z0) + ' ' + P(CLAIM[2] + 1, CLAIM[3] + 1, z0) + ' ' + P(CLAIM[0], CLAIM[3] + 1, z0) + '"/>';
      }
      if (flags.eco) out += banner(1, 3, '経');
      if (flags.rank) out += banner(6, 5, '位');
      /* the player token and the keyboard cursor */
      var hz = top(home.x, home.y) + 1, hp = P(home.x + .5, home.y + .5, hz).split(',');
      out += '<g class="me"><circle cx="' + hp[0] + '" cy="' + (hp[1] - 22) + '" r="15" fill="#1f1813"/><image href="assets/img/characters/xiraiya-avatar.webp" x="' + (hp[0] - 14) + '" y="' + (hp[1] - 36) + '" width="28" height="28" clip-path="url(#bgClip)"/><path d="M' + (hp[0] - 5) + ' ' + (hp[1] - 8) + 'l5 7 5-7z" fill="#1f1813"/></g>';
      var cz = top(cur.x, cur.y) + 1;
      if (svg === document.activeElement) out += '<polygon class="cur" points="' + P(cur.x, cur.y, cz) + ' ' + P(cur.x + 1, cur.y, cz) + ' ' + P(cur.x + 1, cur.y + 1, cz) + ' ' + P(cur.x, cur.y + 1, cz) + '"/>';
      svg.innerHTML = '<defs><clipPath id="bgClip" clipPathUnits="userSpaceOnUse"><circle cx="' + hp[0] + '" cy="' + (hp[1] - 22) + '" r="13"/></clipPath></defs>' + out;
      last = null;
    }
    function banner(x, y, k) {
      var z = top(x, y) + 1, p = P(x + .5, y + .5, z).split(','), px = +p[0], py = +p[1];
      return '<g class="flag"><path d="M' + px + ' ' + py + 'V' + (py - 58) + '" stroke="#5e3a1c" stroke-width="2.2"/><rect x="' + (px + 1) + '" y="' + (py - 56) + '" width="16" height="36" rx="1"/><text x="' + (px + 9) + '" y="' + (py - 34) + '" text-anchor="middle">' + k + '</text></g>';
    }
    var vbW = N * A * 2 + 60, vbTop = -(MAXZ + 2) * ZH;
    svg.setAttribute('viewBox', (-N * A - 30) + ' ' + vbTop + ' ' + vbW + ' ' + (N * 2 * HH + ZH * 2 - vbTop));

    /* ---- chat ---- */
    function say(text, cls) {
      var p = document.createElement('p');
      if (cls) p.className = cls;
      p.textContent = text;
      chat.appendChild(p);
      while (chat.children.length > 40) chat.removeChild(chat.firstChild);
      chat.scrollTop = chat.scrollHeight;
    }
    function bump(el) { el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump'); }
    function hud() {
      coinsEl.hidden = !flags.eco; rankEl.hidden = !flags.rank;
      XR.$('b', coinsEl).textContent = coins;
      placedEl.textContent = placed;
      var r = 0; RANKS.forEach(function (x, i) { if (placed >= x[0]) r = i; });
      if (r > rank && flags.rank) { say('[Ranks] You are now ' + RANKS[r][1] + '. The village bows.', 'rank'); bump(rankEl); }
      rank = r;
      XR.$('b', rankEl).textContent = RANKS[rank][1];
      XR.$('[data-t="lantern"]', stage).disabled = !flags.shop;
    }
    function claimed(x, y) { return flags.claim && x >= CLAIM[0] && x <= CLAIM[2] && y >= CLAIM[1] && y <= CLAIM[3]; }

    /* ---- building ---- */
    function act(x, y) {
      var z = top(x, y);
      if (claimed(x, y)) { say('[LandClaim] This land is protected. Build outside the green line.', 'shop'); return; }
      if (tool === 'erase') {
        if (z <= 0) { say('You cannot dig through the island floor.', 'sys'); return; }
        delete W[key(x, y, z)];
        draw(); return;
      }
      if (z + 1 > MAXZ) { say('That column is at the height limit.', 'sys'); return; }
      if (tool === 'lantern') {
        if (!flags.shop) return;
        if (flags.eco && coins < 5) { say('[Market] A lantern costs 5 coins. Build or /kit to earn some.', 'shop'); return; }
        if (flags.eco) { coins -= 5; say('[Market] Bought a lantern for 5 coins.', 'shop'); }
      }
      W[key(x, y, z + 1)] = tool;
      last = key(x, y, z + 1);
      placed++;
      if (flags.eco && tool !== 'lantern') { coins += 2; if (placed % 5 === 0) say('[Economy] +2 coins per block. Balance: ' + coins + '.', 'eco'); bump(coinsEl); }
      hud(); draw();
    }
    svg.addEventListener('click', function (e) {
      var g = e.target.closest && e.target.closest('g.b');
      if (!g) return;
      cur = { x: +g.getAttribute('data-x'), y: +g.getAttribute('data-y') };
      act(cur.x, cur.y);
    });
    svg.addEventListener('contextmenu', function (e) {
      var g = e.target.closest && e.target.closest('g.b');
      if (!g) return;
      e.preventDefault();
      var keep = tool; tool = 'erase'; act(+g.getAttribute('data-x'), +g.getAttribute('data-y')); tool = keep;
    });
    svg.addEventListener('keydown', function (e) {
      var m = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
      if (m) { e.preventDefault(); cur.x = XR.clamp(cur.x + m[0], 0, N - 1); cur.y = XR.clamp(cur.y + m[1], 0, N - 1); draw(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(cur.x, cur.y); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); var keep = tool; tool = 'erase'; act(cur.x, cur.y); tool = keep; }
    });
    svg.addEventListener('focus', draw);
    svg.addEventListener('blur', draw);

    /* ---- palette + plugin banners ---- */
    var pal = XR.$('.bg-pal', stage);
    pal.innerHTML = PAL.map(function (t) {
      return '<button type="button" role="radio" aria-checked="' + (t === tool) + '" data-t="' + t + '" title="' + TYPES[t].name + (t === 'lantern' ? ' (needs the Market plugin)' : '') + '">' + mini(t) + '<span>' + TYPES[t].name + '</span></button>';
    }).join('');
    pal.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b || b.disabled) return;
      tool = b.getAttribute('data-t');
      XR.$$('button', pal).forEach(function (x) { x.setAttribute('aria-checked', x === b); });
    });
    var fl = XR.$('.bg-flags', stage);
    fl.innerHTML = FLAGS.map(function (f) { return '<button type="button" class="bg-flag" aria-pressed="false" data-f="' + f[0] + '"><span class="nb jp">' + f[1] + '</span>' + f[2] + '</button>'; }).join('');
    var MSG = {
      eco: ['[Economy] Enabled. Every block you place pays 2 coins.', '[Economy] Disabled.'],
      shop: ['[Market] A stall opened by the sakura tree. Lanterns now cost 5 coins.', '[Market] The stall packed up.'],
      rank: ['[Ranks] Enabled. Build to climb from Ashigaru to Shogun.', '[Ranks] Disabled.'],
      claim: ['[LandClaim] Spawn is protected. Nobody can grief it now.', '[LandClaim] Protection lifted.']
    };
    fl.addEventListener('click', function (e) {
      var b = e.target.closest('.bg-flag');
      if (!b) return;
      var f = b.getAttribute('data-f'), on = !flags[f];
      flags[f] = on;
      b.setAttribute('aria-pressed', on);
      if (f === 'shop') stall(on);
      if (f === 'shop' && !on && tool === 'lantern') XR.$('[data-t="grass"]', pal).click();
      say(MSG[f][on ? 0 : 1], f === 'eco' ? 'eco' : f === 'rank' ? 'rank' : 'shop');
      hud(); draw();
    });

    /* ---- commands ---- */
    function cmd(raw) {
      var c = raw.trim().replace(/^\//, '').toLowerCase().split(/\s+/)[0];
      if (!c) return;
      say('> /' + c, 'me');
      switch (c) {
        case 'help': say('Commands: /kit, /shop, /rank, /bal, /sethome, /home, /reset', 'sys'); break;
        case 'kit':
          if (flags.eco) { coins += 10; bump(coinsEl); say('[Kit] Starter kit claimed: 16 wood, 8 stone and 10 coins.', 'eco'); }
          else say('[Kit] Starter kit claimed: 16 wood and 8 stone.', 'eco');
          hud(); break;
        case 'shop': say(flags.shop ? '[Market] Lantern 5 coins. Pick 灯 Lantern and click where it should hang.' : '[Market] The market plugin is off. Raise the 店 banner.', 'shop'); break;
        case 'rank': say(flags.rank ? '[Ranks] ' + RANKS[rank][1] + ' · ' + placed + ' blocks placed' + (RANKS[rank + 1] ? ' · next: ' + RANKS[rank + 1][1] + ' at ' + RANKS[rank + 1][0] : ' · top rank') : '[Ranks] The rank plugin is off. Raise the 位 banner.', 'rank'); break;
        case 'bal': case 'balance': case 'coins': say(flags.eco ? '[Economy] Balance: ' + coins + ' coins.' : '[Economy] The economy plugin is off. Raise the 経 banner.', 'eco'); break;
        case 'sethome': home = { x: cur.x, y: cur.y }; say('Home set at ' + cur.x + ', ' + cur.y + '.', 'sys'); draw(); break;
        case 'home': say('Teleporting home… whoosh.', 'sys'); cur = { x: home.x, y: home.y }; draw(); break;
        case 'reset': build(); placed = 0; coins = 0; rank = 0; home = { x: SPAWN.x, y: SPAWN.y }; hud(); draw(); say('The island was rebuilt.', 'sys'); break;
        default: say('Unknown command. Try /help', 'sys');
      }
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); cmd(input.value); input.value = ''; });

    build(); hud(); draw();
    say('Welcome to the block garden. Click the island to build.', 'sys');
    say('Raise a banner to switch a plugin on, or type /help.', 'sys');
  });
})();
