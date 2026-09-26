/* Lab stage 04 — Manga Panel Maker: three panels, the village cast, speech
   bubbles and sound effects, saved in the browser and exported as a PNG
   drawn on a canvas (no server). */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;
  if (!XR || !LAB || !window.XRCAST) return;

  var CHARS = window.XRCAST.map(function (c) { return { id: c.id, name: c.name, img: c.img, face: c.face }; }).concat([
    { id: 'ink-oni', name: 'Ink oni', img: 'assets/img/heroines/ink-oni.webp', face: '50% 30%' },
    { id: 'ink-kimono', name: 'Ink miko', img: 'assets/img/heroines/ink-kimono.webp', face: '50% 12%' },
    { id: 'xiraiya', name: 'Xiraiya', img: 'assets/img/characters/xiraiya.webp', face: '50% 12%' }
  ]);
  var BGS = [['speed', 'Speed lines'], ['sunset', 'Sunset'], ['tone', 'Halftone'], ['night', 'Night'], ['sakura', 'Sakura']];
  var SFX = [['', 'None'], ['ドーン', 'DOOON'], ['ザァァ', 'ZAAA'], ['ゴゴゴ', 'GOGOGO'], ['バン', 'BAM'], ['キラッ', 'KIRA']];
  var START = [
    { c: 'yami', bg: 'night', text: 'Who dares to enter the Black Tomb?', sfx: 'ゴゴゴ', flip: false },
    { c: 'homura', bg: 'sunset', text: 'Me. I brought fire.', sfx: 'ドーン', flip: true },
    { c: 'hikari', bg: 'sakura', text: 'Um… tea, anyone?', sfx: 'キラッ', flip: false }
  ];
  var LINES = ['I will not lose today.', 'Is that all you have?', 'Believe it!', 'The deadline is tonight?!', 'Ship it. Now.', 'This page is mine.', 'Nani?!', 'Hmph. Not bad.', 'Your move.', 'Arise!'];
  function byId(id) { return CHARS.filter(function (c) { return c.id === id; })[0] || null; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* page geometry used by both the canvas export and the on-screen page */
  var PW = 1000, PH = 1400, RECTS = [[30, 30, 940, 560], [30, 608, 461, 762], [509, 608, 461, 762]];

  LAB.register('panels', function (stage) {
    var $ = function (s) { return XR.$(s, stage); };
    var pages = XR.store('xr-panels');
    if (!Array.isArray(pages) || pages.length !== 3) pages = clone(START);
    var sel = 0;
    stage.innerHTML =
      '<div class="pm-wrap">' +
        '<div class="km-page pm-page">' + [0, 1, 2].map(function (i) {
          return '<button type="button" class="km-panel pm-p" data-p="' + i + '" aria-label="Edit panel ' + (i + 1) + '"><span class="pm-bg"></span><img class="pm-ch" alt="" decoding="async"><span class="pm-bub"><span></span></span><b class="pm-sfx"></b><span class="pm-n">' + (i + 1) + '</span></button>';
        }).join('') + '</div>' +
        '<div class="pm-tools">' +
          '<p class="pm-h">Editing panel <b class="pm-cur">1</b> of 3 <small>tap a panel to switch</small></p>' +
          '<div class="pm-row"><span class="pm-l" id="pm-l-c">Character</span><div class="pm-chars" role="radiogroup" aria-labelledby="pm-l-c"><button type="button" role="radio" data-c="" aria-label="Nobody"><span>—</span></button>' + CHARS.map(function (c) {
            return '<button type="button" role="radio" data-c="' + c.id + '" aria-label="' + c.name + '"><img src="' + c.img + '" alt="" loading="lazy" decoding="async" style="object-position:' + c.face + '"></button>';
          }).join('') + '</div></div>' +
          '<div class="pm-row"><span class="pm-l" id="pm-l-b">Background</span><div class="pm-bgs" role="radiogroup" aria-labelledby="pm-l-b">' + BGS.map(function (b) {
            return '<button type="button" role="radio" data-b="' + b[0] + '"><i class="pm-sw pm-bg-' + b[0] + '"></i>' + b[1] + '</button>';
          }).join('') + '</div></div>' +
          '<label class="pm-row"><span class="pm-l">Speech bubble</span><input class="pm-text" type="text" maxlength="60" placeholder="What does she say?"></label>' +
          '<div class="pm-row"><span class="pm-l" id="pm-l-s">Sound effect</span><div class="pm-sfxs" role="radiogroup" aria-labelledby="pm-l-s">' + SFX.map(function (s) {
            return '<button type="button" role="radio" data-x="' + s[0] + '">' + (s[0] ? '<b>' + s[0] + '</b>' : '') + '<small>' + s[1] + '</small></button>';
          }).join('') + '</div></div>' +
          '<div class="pm-acts"><button type="button" class="pm-flip" aria-pressed="false">Flip her</button><button type="button" class="pm-rand">Random page</button><button type="button" class="pm-reset">Reset</button>' +
          '<button type="button" class="btn btn-primary btn-sm pm-save">Save as PNG</button></div>' +
          '<p class="pm-msg" aria-live="polite"></p>' +
        '</div>' +
      '</div>';
    var panels = XR.$$('.pm-p', stage), msg = $('.pm-msg'), text = $('.pm-text');

    function save() { XR.store('xr-panels', pages); }
    function paintPanel(i) {
      var p = pages[i], el = panels[i], c = byId(p.c), ch = XR.$('.pm-ch', el), bub = XR.$('.pm-bub', el), fx = XR.$('.pm-sfx', el);
      XR.$('.pm-bg', el).className = 'pm-bg pm-bg-' + p.bg;
      el.classList.toggle('is-flip', !!p.flip);
      el.classList.toggle('is-sel', i === sel);
      if (c) { if (ch.getAttribute('src') !== c.img) ch.src = c.img; ch.hidden = false; } else ch.hidden = true;
      bub.hidden = !p.text; bub.firstChild.textContent = p.text || '';
      fx.textContent = p.sfx || ''; fx.hidden = !p.sfx;
      el.setAttribute('aria-label', 'Panel ' + (i + 1) + ': ' + (c ? c.name : 'empty') + (p.text ? ', says ' + p.text : '') + '. Edit it.');
    }
    function paintTools() {
      var p = pages[sel];
      $('.pm-cur').textContent = sel + 1;
      XR.$$('[data-c]', stage).forEach(function (b) { b.setAttribute('aria-checked', b.getAttribute('data-c') === (p.c || '') ? 'true' : 'false'); });
      XR.$$('[data-b]', stage).forEach(function (b) { b.setAttribute('aria-checked', b.getAttribute('data-b') === p.bg ? 'true' : 'false'); });
      XR.$$('[data-x]', stage).forEach(function (b) { b.setAttribute('aria-checked', b.getAttribute('data-x') === (p.sfx || '') ? 'true' : 'false'); });
      $('.pm-flip').setAttribute('aria-pressed', p.flip ? 'true' : 'false');
      if (document.activeElement !== text) text.value = p.text || '';
    }
    function paint() { panels.forEach(function (_, i) { paintPanel(i); }); paintTools(); }
    function set(k, v) { pages[sel][k] = v; save(); paintPanel(sel); paintTools(); }

    stage.addEventListener('click', function (e) {
      var t = e.target, b;
      if ((b = t.closest('.pm-p'))) { sel = +b.getAttribute('data-p'); paint(); return; }
      if ((b = t.closest('[data-c]'))) return set('c', b.getAttribute('data-c'));
      if ((b = t.closest('[data-b]'))) return set('bg', b.getAttribute('data-b'));
      if ((b = t.closest('[data-x]'))) { set('sfx', b.getAttribute('data-x')); var P = window.XRPOWER; if (P && P.sfx && b.getAttribute('data-x')) P.sfx.hit(); return; }
      if (t.closest('.pm-flip')) return set('flip', !pages[sel].flip);
      if (t.closest('.pm-reset')) { pages = clone(START); sel = 0; save(); paint(); msg.textContent = 'Back to the first page.'; return; }
      if (t.closest('.pm-rand')) {
        pages = pages.map(function () {
          return { c: CHARS[(Math.random() * CHARS.length) | 0].id, bg: BGS[(Math.random() * BGS.length) | 0][0], text: LINES[(Math.random() * LINES.length) | 0], sfx: SFX[1 + ((Math.random() * (SFX.length - 1)) | 0)][0], flip: Math.random() < .4 };
        });
        save(); paint(); msg.textContent = 'A random page. Change anything you like.';
        return;
      }
      if (t.closest('.pm-save')) exportPng();
    });
    text.addEventListener('input', function () { pages[sel].text = text.value.slice(0, 60); save(); paintPanel(sel); });

    /* ---------- the PNG, drawn by hand on a canvas ---------- */
    function load(src) { return new Promise(function (ok) { var im = new Image(); im.onload = function () { ok(im); }; im.onerror = function () { ok(null); }; im.src = src; }); }
    function seeded(n) { var a = n * 9301 + 49297; return function () { a = (a * 9301 + 49297) % 233280; return a / 233280; }; }
    function drawBg(g, bg, x, y, w, h, i) {
      var R = seeded(i + 3), k;
      if (bg === 'sunset') {
        var s = g.createLinearGradient(0, y, 0, y + h); s.addColorStop(0, '#2a1030'); s.addColorStop(.6, '#d9573a'); s.addColorStop(1, '#f6c27a');
        g.fillStyle = s; g.fillRect(x, y, w, h);
        g.fillStyle = 'rgba(255,236,200,.85)'; g.beginPath(); g.arc(x + w * .7, y + h * .62, Math.min(w, h) * .18, 0, 6.283); g.fill();
        g.fillStyle = '#2a1622'; g.beginPath(); g.moveTo(x, y + h); for (k = 0; k <= 12; k++) g.lineTo(x + w * k / 12, y + h * (.78 + Math.sin(k * 1.3) * .05)); g.lineTo(x + w, y + h); g.fill();
      } else if (bg === 'night') {
        g.fillStyle = '#0d0b1e'; g.fillRect(x, y, w, h);
        for (k = 0; k < 90; k++) { g.fillStyle = 'rgba(255,255,255,' + (.3 + R() * .7) + ')'; g.fillRect(x + R() * w, y + R() * h * .8, 2, 2); }
        g.fillStyle = '#f3ecd8'; g.beginPath(); g.arc(x + w * .78, y + h * .22, Math.min(w, h) * .1, 0, 6.283); g.fill();
        g.fillStyle = '#0d0b1e'; g.beginPath(); g.arc(x + w * .78 + Math.min(w, h) * .04, y + h * .2, Math.min(w, h) * .09, 0, 6.283); g.fill();
      } else if (bg === 'sakura') {
        g.fillStyle = '#fde6ec'; g.fillRect(x, y, w, h);
        for (k = 0; k < 40; k++) { g.save(); g.translate(x + R() * w, y + R() * h); g.rotate(R() * 6); g.fillStyle = R() < .5 ? '#f7a8bb' : '#fbc6d3'; g.beginPath(); g.ellipse(0, 0, 10, 5, 0, 0, 6.283); g.fill(); g.restore(); }
      } else if (bg === 'tone') {
        g.fillStyle = '#f7efdf'; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(10,8,6,.28)';
        for (var yy = y; yy < y + h; yy += 12) for (var xx = x + ((yy / 12) % 2) * 6; xx < x + w; xx += 12) { g.beginPath(); g.arc(xx, yy, 1 + (yy - y) / h * 3.2, 0, 6.283); g.fill(); }
      } else {
        g.fillStyle = '#f7efdf'; g.fillRect(x, y, w, h);
        var cx = x + w / 2, cy = y + h * .45, r0 = Math.min(w, h) * .3, r1 = Math.hypot(w, h);
        g.fillStyle = 'rgba(10,8,6,.85)';
        for (k = 0; k < 150; k++) { var a = R() * 6.283, sp = .004 + R() * .012; g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a - sp) * r1, cy + Math.sin(a - sp) * r1); g.lineTo(cx + Math.cos(a + sp) * r1, cy + Math.sin(a + sp) * r1); g.fill(); }
      }
    }
    function wrap(g, t, maxW) {
      var words = t.split(' '), lines = [], line = '';
      words.forEach(function (w) { var test = line ? line + ' ' + w : w; if (g.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; });
      if (line) lines.push(line);
      return lines;
    }
    function exportPng() {
      msg.textContent = 'Inking your page…';
      var srcs = pages.map(function (p) { var c = byId(p.c); return c ? c.img : null; });
      Promise.all(srcs.map(function (s) { return s ? load(s) : Promise.resolve(null); })).then(function (ims) {
        var cv = document.createElement('canvas'); cv.width = PW; cv.height = PH;
        var g = cv.getContext('2d');
        g.fillStyle = '#fffdf8'; g.fillRect(0, 0, PW, PH);
        pages.forEach(function (p, i) {
          var R = RECTS[i], x = R[0], y = R[1], w = R[2], h = R[3], im = ims[i];
          g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
          drawBg(g, p.bg, x, y, w, h, i);
          if (im) {
            var ih = h * .9, iw = im.width * ih / im.height;
            if (iw > w * .8) { iw = w * .8; ih = im.height * iw / im.width; }
            var ix = x + w * (p.flip ? .34 : .66) - iw / 2, iy = y + h - ih;
            g.save();
            if (p.flip) { g.translate(ix + iw / 2, 0); g.scale(-1, 1); g.translate(-(ix + iw / 2), 0); }
            g.drawImage(im, ix, iy, iw, ih);
            g.restore();
          }
          if (p.text) {
            g.font = '700 ' + (i ? 26 : 30) + 'px "Zen Kaku Gothic New", "Hiragino Sans", sans-serif';
            var bw = w * (i ? .62 : .42), lines = wrap(g, p.text, bw - 50), lh = i ? 34 : 38, bh = lines.length * lh + 40;
            var bx = p.flip ? x + w - bw - 22 : x + 22, by = y + 24, tx = p.flip ? bx + bw * .3 : bx + bw * .7;
            g.fillStyle = '#fff'; g.strokeStyle = '#0a0806'; g.lineWidth = 4;
            g.beginPath(); g.ellipse(bx + bw / 2, by + bh / 2, bw / 2, bh / 2 + 8, 0, 0, 6.283); g.fill(); g.stroke();
            g.beginPath(); g.moveTo(tx - 16, by + bh - 2); g.lineTo(tx + (p.flip ? -30 : 30), by + bh + 46); g.lineTo(tx + 14, by + bh - 4); g.fill(); g.stroke();
            g.fillStyle = '#fff'; g.fillRect(tx - 14, by + bh - 12, 26, 10);
            g.fillStyle = '#0a0806'; g.textAlign = 'center'; g.textBaseline = 'middle';
            lines.forEach(function (l, k) { g.fillText(l, bx + bw / 2, by + 20 + lh / 2 + k * lh + 4); });
          }
          if (p.sfx) {
            g.save(); g.translate(p.flip ? x + w * .72 : x + w * .26, y + h * .78); g.rotate(-.14);
            g.font = '800 ' + Math.round(h * (i ? .13 : .2)) + 'px "Shippori Mincho B1", serif';
            g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
            g.lineWidth = 14; g.strokeStyle = '#0a0806'; g.strokeText(p.sfx, 0, 0);
            g.fillStyle = p.bg === 'night' ? '#ffd24a' : '#fff'; g.fillText(p.sfx, 0, 0);
            g.restore();
          }
          g.restore();
          g.lineWidth = 6; g.strokeStyle = '#0a0806'; g.strokeRect(x, y, w, h);
        });
        g.fillStyle = '#6b604f'; g.font = '500 16px "JetBrains Mono", monospace'; g.textAlign = 'right'; g.textBaseline = 'alphabetic';
        g.fillText('made in the Xiraiya Lab · 漫画工房', PW - 30, PH - 10);
        cv.toBlob(function (blob) {
          if (!blob) { msg.textContent = 'This browser could not save the picture.'; return; }
          var url = URL.createObjectURL(blob), a = document.createElement('a');
          a.href = url; a.download = 'xiraiya-manga-page.png';
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
          msg.textContent = 'Saved xiraiya-manga-page.png.';
          XR.toast('Your manga page is saved');
        }, 'image/png');
      });
    }
    paint();
  });
})();
