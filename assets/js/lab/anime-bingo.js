/* Lab stage 10 -- The Bingo Book: wanted posters that flip over to a stat chart, plus one for you. */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;
  if (!XR || !LAB) return;

  var STATS = ['Ninjutsu', 'Taijutsu', 'Genjutsu', 'Intellect', 'Strength', 'Speed'];
  var FILES = [
    { id: 'sage', name: 'Xiraiya', alias: 'The Toad Sage', rank: 'S', bounty: 88000000, img: 'assets/img/characters/xiraiya.webp', w: 514, h: 1069,
      s: [9, 7, 6, 8, 7, 7], moves: ['Rasengan', 'Sage Mode', 'Toad summoning'], weak: 'Deadlines and a pretty face', col: '#c4321d' },
    { id: 'xiri', name: 'Xiri', alias: 'The Slug Princess', rank: 'S', bounty: 76000000, img: 'assets/img/characters/tsunade.webp', w: 656, h: 1073,
      s: [8, 10, 5, 9, 10, 6], moves: ['Hundred Healings', 'Cherry Blossom Impact', 'Code review'], weak: 'Gambling (always loses)', col: '#2c6f65' },
    { id: 'gama', name: 'Gama', alias: 'Chief of the Toads', rank: 'A', bounty: 41000000, img: 'assets/img/characters/gama.webp', w: 703, h: 462,
      s: [7, 8, 2, 5, 10, 4], moves: ['Water Gun', 'Toad Oil', 'Sword slash'], weak: 'Being summoned for small jobs', col: '#b7862a' },
    { id: 'katsuyu', name: 'Katsuyu', alias: 'The Great Slug', rank: 'A', bounty: 39000000, img: 'assets/img/characters/katsuyu.webp', w: 733, h: 925,
      s: [8, 3, 4, 8, 6, 2], moves: ['Tongue acid', 'Split into thousands', 'Mass healing'], weak: 'Salt', col: '#5f4f95' }
  ];
  var VILLAGES = [['leaf', '木ノ葉', 'Hidden Leaf'], ['sand', '砂', 'Hidden Sand'], ['mist', '霧', 'Hidden Mist'], ['cloud', '雲', 'Hidden Cloud'], ['stone', '岩', 'Hidden Stone']];
  var MOVES = ['Shadow Clone', 'Chidori', 'Rasengan', 'Fireball', 'Water Dragon', 'Sand Coffin', 'Lightning Blade', 'Summoning', 'Eight Gates', 'Mind Transfer', 'Wind Scythe', 'Earth Wall'];
  var WEAK = ['Ramen', 'Mornings', 'Stairs', 'Cats', 'Tax forms', 'Spoilers', 'Slow Wi-Fi', 'Karaoke'];

  function radar(s, col) {
    var cx = 90, cy = 90, R = 64, pts = [], grid = '', axes = '', labels = '';
    for (var g = 1; g <= 4; g++) {
      var ring = [];
      for (var k = 0; k < 6; k++) { var a0 = -Math.PI / 2 + k * Math.PI / 3; ring.push((cx + Math.cos(a0) * R * g / 4).toFixed(1) + ',' + (cy + Math.sin(a0) * R * g / 4).toFixed(1)); }
      grid += '<polygon points="' + ring.join(' ') + '"/>';
    }
    s.forEach(function (v, i) {
      var a = -Math.PI / 2 + i * Math.PI / 3;
      pts.push((cx + Math.cos(a) * R * v / 10).toFixed(1) + ',' + (cy + Math.sin(a) * R * v / 10).toFixed(1));
      axes += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + Math.cos(a) * R).toFixed(1) + '" y2="' + (cy + Math.sin(a) * R).toFixed(1) + '"/>';
      labels += '<text x="' + (cx + Math.cos(a) * (R + 16)).toFixed(1) + '" y="' + (cy + Math.sin(a) * (R + 14) + 3).toFixed(1) + '">' + STATS[i].slice(0, 3) + ' ' + v + '</text>';
    });
    return '<svg class="bb-radar" viewBox="0 0 180 180" role="img" aria-label="' + STATS.map(function (n, i) { return n + ' ' + s[i]; }).join(', ') + '"><g class="bb-grid">' + grid + axes + '</g>' +
      '<polygon class="bb-shape" style="--c:' + col + '" points="' + pts.join(' ') + '"/>' + '<g class="bb-lab">' + labels + '</g></svg>';
  }
  function ryo(n) { return n.toLocaleString('en-US') + ' ryō'; }
  function poster(f) {
    var face = f.img ? '<img src="' + f.img + '" alt="" width="' + f.w + '" height="' + f.h + '" loading="lazy" decoding="async">' : '<b class="bb-sil jp">' + XR.esc(f.name.charAt(0)) + '</b>';
    return '<li class="bb-item' + (f.you ? ' is-you km-in' : '') + '"><button type="button" class="bb-card" aria-pressed="false" aria-label="' + XR.esc(f.name) + ', ' + XR.esc(f.alias) + '. Turn the poster over.">' +
      '<span class="bb-front"><span class="bb-wanted">WANTED<em class="jp">手配書</em></span><span class="bb-pic">' + face + '<i class="bb-rank">' + f.rank + '</i></span>' +
        '<span class="bb-name">' + XR.esc(f.name) + '</span><span class="bb-alias">' + XR.esc(f.alias) + '</span><span class="bb-bounty">' + ryo(f.bounty) + '</span></span>' +
      '<span class="bb-back">' + radar(f.s, f.col) +
        '<span class="bb-moves"><b>Known jutsu</b>' + f.moves.map(XR.esc).join(' · ') + '</span>' +
        '<span class="bb-weak"><b>Weakness</b>' + XR.esc(f.weak) + '</span></span>' +
    '</button></li>';
  }

  LAB.register('bingo', function (el) {
    el.innerHTML = '<div class="km-page bb-page">' +
      '<div class="km-panel km-tone-2 bb-board"><span class="km-cap">Bingo Book · ビンゴブック</span><ul class="bb-grid-list"></ul></div>' +
      '<form class="km-panel bb-add" autocomplete="off">' +
        '<span class="km-tag is-red">Add yourself</span>' +
        '<label><span>Your name</span><input class="bb-in" type="text" maxlength="20" required placeholder="e.g. Rafi"></label>' +
        '<label><span>Village</span><select class="bb-vil">' + VILLAGES.map(function (v) { return '<option value="' + v[0] + '">' + v[2] + ' ' + v[1] + '</option>'; }).join('') + '</select></label>' +
        '<button type="submit" class="km-btn is-red"><span class="jp">印</span>Print my poster</button>' +
      '</form></div>';
    var list = el.querySelector('.bb-grid-list');
    list.innerHTML = FILES.map(poster).join('');

    list.addEventListener('click', function (e) {
      var b = e.target.closest('.bb-card');
      if (!b) return;
      var on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('is-flip', on);
    });
    el.querySelector('.bb-add').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = el.querySelector('.bb-in').value.trim();
      if (!name) return;
      var vil = VILLAGES.filter(function (v) { return v[0] === el.querySelector('.bb-vil').value; })[0];
      var r = LAB.rng(name.toLowerCase() + vil[0]);
      var s = STATS.map(function () { return 3 + Math.floor(r() * 8); });
      var tot = s.reduce(function (a, b) { return a + b; }, 0);
      var m = MOVES.slice().sort(function () { return r() - .5; }).slice(0, 3);
      var f = { name: name, alias: 'Rogue ninja of the ' + vil[2] + ' ' + vil[1], rank: tot > 44 ? 'S' : tot > 36 ? 'A' : tot > 28 ? 'B' : 'C', bounty: Math.round(tot * (600000 + r() * 900000) / 1000) * 1000,
        s: s, moves: m, weak: WEAK[(r() * WEAK.length) | 0], col: '#c4321d', you: true };
      var old = list.querySelector('.is-you');
      if (old) old.remove();
      list.insertAdjacentHTML('afterbegin', poster(f));
      XR.toast(name + ' is now in the Bingo Book. Bounty: ' + ryo(f.bounty));
    });
  });
})();
