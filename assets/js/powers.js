  function arise() {
    if (busy) return;
    var restoring = !!ruin;
    setBusy(true); closeDock();
    if (restoring) { ruin.rising = true; if (ruin.cta) { drop(ruin.cta, 600); ruin.cta = null; } }
    var w = vw(), h = vh(), count = restoring ? ruin.anims.length : 0;
    var SHADOW = phone ? 'brightness(0)' : 'brightness(0) drop-shadow(0 0 5px rgba(140,80,255,.9))';

    /* reduced motion: the word, and the page simply comes back */
    if (reduce) {
      clip('arise-voice', 0);
      setTimeout(function () {
        if (restoring) {
          ruin.anims.forEach(function (p) { [p.a, p.dark, p.rise, p.wake].forEach(function (a) { if (a) a.cancel(); }); });
          ruinParts.forEach(function (p) { p.remove(); }); ruinParts = [];
          root.classList.remove('pw-destroyed'); lock(false); ruin = null;
          sysWindow('SYSTEM', ['Shadow extraction <em>successful</em>.', 'The page lives again.']).close(2600);
        }
        setBusy(false); paint();
      }, 600);
      return;
    }

    /* ---- the cue sheet ---- */
    var V = 500;                                                        /* the voice starts */
    var WORD = V + mark('arise-voice', 'word', 1.3) * 1000;             /* the command lands */
    var M0 = V + mark('arise-voice', 'end', 1.85) * 1000;               /* the theme starts as the word ends */
    function tm(s) { return M0 + s * 1000; }
    var DROP = mark('arise-theme', 'drop', [3.96, 4.16, 4.28, 4.4]);
    var BEAT = mark('arise-theme', 'beat', .38), BEAT0 = mark('arise-theme', 'beat0', 4.12);
    var ACC = mark('arise-theme', 'accents', [6.9, 8.26, 9.94, 12.14, 13.26, 16.32, 17.44, 18.94, 19.32, 21.76, 22.96]);
    var SALUTE = mark('arise-theme', 'salute', 16.32), AWAKE = mark('arise-theme', 'awake', 19.32);
    var TITLE = mark('arise-theme', 'title', 21.76), END = mark('arise-theme', 'end', 25.8);
    var LOUD = mark('arise-theme', 'loud', 1.6), lastDrop = DROP[DROP.length - 1];
    if (!restoring) { SALUTE = lastDrop + 2.6; TITLE = lastDrop + 4.6; END = lastDrop + 8; }

    var cine = { dead: false, ending: false, timers: [] };
    function at(ms, fn) { cine.timers.push(setTimeout(function () { if (!cine.dead) fn(); }, ms)); }

    /* ---- sound ---- */
    clip('arise', 0, false, .7);
    clip('arise-voice', V);
    clip('arise-theme', M0, false, 1, true);

    /* ---- 1. darkness falls ---- */
    var sh = overlay('pw-shadow'); on(sh);
    letterbox(true);
    var lit = pageLight('140,80,255'), boost = 0;
    layer(function (c, t) {
      if (lit.dead) return false;
      boost *= .9;
      var k = Math.min(1, t / 900);
      lit.at(w / 2, h * 1.05, h * (.75 + .12 * Math.sin(t / 480) + boost * .3), (.38 + .12 * Math.sin(t / 90) * Math.random() + boost) * k);
    });
    function flare(k) { boost = Math.max(boost, k); }
    var seal = overlay('pw-seal');
    seal.innerHTML = '<svg viewBox="-100 -100 200 200"><g fill="none" stroke="#b28cff"><circle r="96" stroke-width="2"/><circle r="84" stroke-width="1" stroke-dasharray="3 6"/><circle r="52" stroke-width="2"/>' +
      '<path d="M0-84 73 42H-73Z M0 84-73-42H73Z" stroke-width="1.6"/><path d="M0-52V52M-45-26 45 26M45-26-45 26" stroke-width=".8" opacity=".6"/></g>' +
      '<g fill="#d9c6ff" font-size="11" font-family="serif" text-anchor="middle"><text y="-88">影</text><text y="96">王</text><text x="-90" y="4">起</text><text x="90" y="4">兵</text></g></svg>';
    on(seal);
    function sealPulse(k) { seal.animate([{ filter: 'brightness(' + (1 + k) + ') saturate(1.4)' }, { filter: 'brightness(1)' }], { duration: 420, easing: 'ease-out' }); }

    /* ---- the camera: the command, shot as one deliberate cut ----
       darkness    a barely-there creep toward the seal, ending as the word lands
       the word    the hit-stop holds the frame; then a low, slow push-in on the seal that leans in harder toward the drop
       the drop    the first hit freezes as a black-and-white negative under a longer hit-stop; the second hit releases it
                   with a sudden dolly-out past neutral; the last hit settles the camera, so the god rays and the rebuild
                   play on a still frame. Every move starts and ends on a mark, so the picture stays locked to the sound */
    var SX = w / 2, SY = h * .76;                                                    /* the seal, low in frame (measured once it is up) */
    var STOP1 = 140, STOP2 = DROP.length > 1 ? Math.round((DROP[1] - DROP[0]) * 1000) : 0;   /* hit-stops: the word; the drop, held until its second hit */
    var PUSH = tm(DROP[0]) - WORD - STOP1;                                           /* the push-in: from the end of the word's hit-stop to the drop */
    function sealY() { var r = seal.getBoundingClientRect(); return r.height > 0 ? r.top + r.height / 2 : h * .76; }
    camera(SX, SY, 1.03, WORD, 'cubic-bezier(.4,0,.6,1)');
    /* the freeze frame: the world stops (canvas, shakes and all) and holds one black-and-white negative */
    function freeze(ms) {
      hitStop(ms);
      root.classList.add('pw-neg', 'pw-mono');
      setTimeout(function () { root.classList.remove('pw-neg', 'pw-mono'); }, ms);
    }
    /* the release: a sudden dolly-out past neutral (the last hit settles it); the speed lines burst outward */
    function release() { camera(SX, SY, .965, 180, 'cubic-bezier(.1,.9,.2,1)'); burstT = performance.now(); }
    /* speed lines on twos, like anime cels: they converge on the seal through the push-in, tighten toward the drop, hold
       through the freeze and flip into one outward burst on the release; drawn under the fog and the army */
    var linesOn = false, linesT = 0, linesSeed = 0, lineT0 = -1, burstT = 0;
    layer(function (c, t, now) {
      if (cine.dead) return false;
      if (!linesOn) return;
      if (lineT0 < 0) lineT0 = t;
      var age = t - lineT0, p = Math.min(1, age / PUSH), inner = (phone ? 90 : 170) - p * (phone ? 30 : 60);
      if (!burstT && now - linesT > 83) { linesT = now; linesSeed = (Math.random() * 1e9) | 0; }
      if (!burstT) {
        var k = age < 500 ? 1 - age / 500 * .5 : .5 + Math.pow(Math.max(0, (p - .55) / .45), 2) * .5;   /* a flash on the word, a simmer, then the build to the drop */
        focusLines(c, SX, SY, inner, 'rgba(214,196,255,1)', phone ? 34 : 68, .2 * k, seeded(linesSeed));
        return;
      }
      var q = Math.max(0, (now - burstT) / 200);
      if (q >= 1) return false;
      focusLines(c, SX, SY, inner + q * q * Math.hypot(w, h) * .5, '#ffffff', phone ? 44 : 90, .4 * (1 - q), seeded(linesSeed));
    });

    var air = atmosphere(cine), army = legion(cine), lord = monarch(cine);
    if (restoring) ruin.anims.forEach(function (p) {
      p.dark = p.el.animate([{ transform: p.end, filter: phone ? 'none' : 'brightness(.5) saturate(.4)' }, { transform: p.end, filter: SHADOW }],
        { duration: 900, delay: rand(0, 400), fill: 'forwards' });
    });
    /* the System speaks only once it is over (see finish) */

    /* skip: a button and Esc jump straight to the end */
    var skip = el('button', 'pw-skip', 'Skip <span aria-hidden="true">&#9656;</span>');
    skip.type = 'button';
    document.body.appendChild(skip);
    at(1200, function () { on(skip); });
    skip.addEventListener('click', function () { finish(true); });
    function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); finish(true); } }
    document.addEventListener('keydown', onKey, true);

    /* ---- 2. the command ---- */
    at(WORD, function () {
      SY = sealY();
      camera(SX, SY, 1.15, PUSH, 'cubic-bezier(.55,0,.8,.5)');   /* made before the hit-stop, so it holds on its first frame and ends on the drop */
      linesOn = true;
      hitStop(STOP1);
      chroma(600);
      lensFlare(w / 2, h * .3, '150,90,255', 1600, 1.8);
      smokeRing(w / 2, h, '40,15,80', phone ? 10 : 18);
      impact(['neg', 'black', 'neg'], 'violet');
      shockwave(w / 2, h, '#9a6bff', Math.max(w, h), 1200);
      shake(12, 900); flare(.9); sealPulse(1.6);
      lord.rise(); air.ripple(1.6); air.embers(w / 2, h, phone ? 30 : 60);
      sfx('ARISE', w / 2, h * .3, { cls: 'xl pw-arise-word', en: '起きろ', life: 2200, rot: 0 });
    });

    /* ---- 3. souls torn out of the fallen, as the choir comes in ---- */
    if (restoring) {
      at(tm(.9), function () {
        extractSouls(ruin.anims.map(function (p) { return p.el.getBoundingClientRect(); }), (DROP[0] - .9) * 1000);
      });
      at(tm(LOUD), function () { flare(.5); sealPulse(1); });
    }

    /* ---- 4. the drop: a wave of knights erupts on each hit ----
       the first hit is the freeze frame (its wave erupts into the release), the second hit releases it */
    DROP.forEach(function (d, i) {
      at(tm(d), function () {
        var held = !!STOP2 && i === 0;
        /* camera moves first, so this hit's shake rides on top of them instead of being replaced by them */
        if (STOP2 && i === 1) { release(); army.spawn(0, DROP.length); }
        if (i === DROP.length - 1) cameraReset(900);
        if (!held) army.spawn(i, DROP.length);
        lord.surge(1.1); air.ripple(1.2);
        shake(7 + i * 3, 360); flare(.6 + i * .15); sealPulse(1.2);
        if (i === 0) air.retract();
        if (held) freeze(STOP2);                                           /* after the shake and the pulse, so they hold on their first frame too */
        if (i === DROP.length - 1) { impact(['neg', 'black'], 'violet'); chroma(300); sh.classList.add('thin'); }
      });
    });
    if (restoring) at(tm(DROP[0]), function () { ruinParts.forEach(function (p) { p.style.transition = 'opacity 1.4s'; p.style.opacity = '0'; }); });

    /* the music breathes through everything: light, seal and eyes on the beat */
    for (var b = BEAT0, n = 0; b < END; b += BEAT, n++) {
      (function (bt, even) { at(tm(bt), function () { flare(even ? .28 : .14); army.pulse(even ? 1.6 : 1.25); if (even) { sealPulse(.5); air.ripple(.7); } }); })(b, n % 2 === 0);
    }
    ACC.forEach(function (a) { if (a < END) at(tm(a), function () { flare(.55); sealPulse(1); shake(4, 260); lord.surge(.8); air.ripple(1.2); }); });
    /* the ranks behind rise out of the fog on the first accents after the drop */
    ACC.filter(function (a) { return a > lastDrop; }).slice(0, 2).forEach(function (a, ri) { at(tm(a), function () { army.rank(ri); sealPulse(1.4); }); });

    /* ---- 5. the page rebuilds on the beat, bottom to top ---- */
    var rebuilt = 0;
    if (restoring) {
      var beats = [];
      for (var gb = BEAT0; gb < AWAKE - 2; gb += BEAT * 2) if (gb > lastDrop + BEAT) beats.push(gb);
      var order = ruin.anims.slice().sort(function (a, c) { return (c.r ? c.r.bottom : c.top) - (a.r ? a.r.bottom : a.top); });
      var G = Math.max(1, Math.min(beats.length, order.length)), per = Math.ceil(order.length / G);
      beats.slice(0, G).forEach(function (bt, gi) {
        at(tm(bt), function () {
          order.slice(gi * per, gi * per + per).forEach(function (p) {
            var v = p.v, mid = { x: v.x * .35, y: v.y * .35 - rand(30, 90), z: rand(80, 200), rx: v.rx * .2, ry: v.ry * .2, rz: v.rz * .25 };
            var kf = [
              { transform: tf(v), filter: phone ? SHADOW : SHADOW + ' blur(0px)', easing: 'cubic-bezier(.5,0,.3,1)' },
              { transform: tf(mid, 1.04), filter: phone ? SHADOW : SHADOW + ' blur(1.4px)', offset: .55, easing: 'cubic-bezier(.2,.7,.2,1)' },
              { transform: tf({ x: 0, y: -10, z: 40, rx: -8, ry: 0, rz: 0 }, 1.02), filter: phone ? SHADOW : SHADOW + ' blur(0px)', offset: .82, easing: 'cubic-bezier(.3,0,.3,1)' },
              { transform: tf({ x: 0, y: 5, z: -10, rx: 6, ry: 0, rz: 0 }, .99), filter: phone ? SHADOW : SHADOW + ' blur(0px)', offset: .92 },
              { transform: tf(Z0), filter: phone ? SHADOW : SHADOW + ' blur(0px)' }
            ];
            var dl = rand(0, 160);
            p.rise = p.el.animate(kf, { duration: rand(1100, 1450), delay: dl, fill: 'forwards' });
            if (p.r && Math.random() < (phone ? .35 : .7)) {
              var cx = p.r.left + p.r.width / 2, cy = p.r.top + p.r.height / 2;
              air.flow(cx + rand(-60, 60), h + 10, cx, cy, dl);
            }
          });
          rebuilt = Math.min(1, (gi + 1) / G);
        });
      });
    }

    /* ---- 6. the knights salute, the page wakes, they kneel ---- */
    at(tm(SALUTE), function () {
      army.salute(); lord.surge(1.4); flare(1); sealPulse(2); air.embers(w / 2, h * .6, phone ? 30 : 60);
      shockwave(w / 2, h, '#b28cff', Math.max(w, h) * .8, 1000); shake(9, 500);
    });
    if (restoring) at(tm(AWAKE), function () {
      var SWEEP = 1500;
      awakenSweep(SWEEP);
      flash('#efe6ff', 500, .35);
      air.rays(); air.embers(w / 2, h * .15, phone ? 40 : 90);
      ruin.anims.forEach(function (p) {
        var top = p.el.getBoundingClientRect().top, d = Math.max(0, Math.min(1, (top + 60) / (h + 120))) * SWEEP;
        p.wake = p.el.animate([
          { filter: SHADOW },
          { filter: phone ? 'brightness(1.6)' : 'brightness(1.8) drop-shadow(0 0 8px rgba(170,120,255,.9))', offset: .35 },
          { filter: 'none' }
        ], { duration: 560, delay: d, fill: 'forwards' });
      });
    });
    at(tm(restoring ? AWAKE + .4 : SALUTE + 1.2), function () { army.kneel(); lord.surge(1); });

    /* ---- 7. the title card, then everything fades with the music ---- */
    var card = null;
    at(tm(TITLE), function () {
      card = overlay('pw-title');
      card.innerHTML = '<u class="pw-title-k" aria-hidden="true">影</u><small>影の君主 · Shadow Monarch</small><b>SHADOW ARMY</b><i></i><span>' +
        (restoring ? '<em>' + count + '</em> shadows have risen · the page lives again' : 'your shadows stand ready') + '</span>';
      on(card);
      flare(.7); air.embers(w / 2, h * .45, phone ? 40 : 80);
    });
    at(tm(END), function () { finish(false); });

    function finish(skipped) {
      if (cine.ending) return;
      cine.ending = true; cine.dead = true;
      cine.timers.forEach(clearTimeout);
      document.removeEventListener('keydown', onKey, true);
      stopClip('arise-theme', skipped ? 700 : 2400);
      if (restoring && ruin) {
        ruin.anims.forEach(function (p) { [p.a, p.dark, p.rise, p.wake].forEach(function (a) { if (a) a.cancel(); }); });
        ruinParts.forEach(function (p) { p.remove(); }); ruinParts = [];
        root.classList.remove('pw-destroyed');
        lock(false); ruin = null;
      }
      if (skipped) flash('#efe6ff', 400, .3);
      later(skipped ? 300 : 900, function () {
        sysWindow('SYSTEM', restoring ? ['Shadow extraction <em>successful</em>.', '<em>' + count + '</em> shadows have joined your army.', 'The page lives again.']
          : ['No fallen enemies found.', 'Your shadow army stands ready.']).close(3600);
      });
      drop(skip, 300); drop(sh, 900); drop(seal, 900); if (card) drop(card, 1200);
      letterbox(false); cameraReset(700);
      lit.dead = true; lit.off(1100);
      setBusy(false); paint();
      if (!restoring) toast('Use Chidori first, then Arise will extract the fallen page.');
    }
  }

  /* ==================================================================
     風 WIND — a gale: streaks, spiral vortices, leaves; the page sways
     ================================================================== */
  var windStop = 0;
  function wind() {
    if (windOn) { windOn = false; root.classList.remove('pw-windy'); paint(); return; }
    if (busy || ruin) return;
    windOn = true; paint(); closeDock();
    if (!reduce) root.classList.add('pw-windy');
    Array.prototype.forEach.call(document.querySelectorAll('main h1, main h2, main h3, main img, main .btn, main .card, main p, .hero-mascot'), function (e, i) {
      if (i < 300) e.style.setProperty('--pw-d', (-(i % 7) * .13).toFixed(2));
    });
    clip('wind', 0, true);
    var dark = root.getAttribute('data-mode') === 'ink';
    var streak = dark ? 'rgba(230,240,255,1)' : 'rgba(40,70,90,1)';
    var LEAF = ['#e8a1b0', '#f3c3cc', '#7fae5a', '#a9c96e', '#d9a441'];
    var lines = [], leaves = [], vort = [], NL = phone ? 26 : 60, NV = phone ? 18 : 42;
    var motes = [], NM = phone ? 120 : 300;
    for (var m0 = 0; m0 < NM; m0++) motes.push({ x: rand(0, vw()), y: rand(0, vh()), s: rand(.6, 1.4) });
    function newLine(any) { return { x: any ? rand(-vw(), vw()) : rand(-400, -60), y: rand(0, vh()), len: rand(80, 300), v: rand(16, 34), a: rand(.12, .45), wob: rand(0, 6) }; }
    function newLeaf(any) { return { x: any ? rand(0, vw()) : rand(-80, -10), y: rand(-20, vh()), v: rand(4, 11), s: rand(4, 9), r: rand(0, 6), vr: rand(-.25, .25), c: pick(LEAF), wob: rand(0, 6) }; }
    function newVortex() { return { x: rand(-200, -50), y: rand(.15, .85) * vh(), r: rand(40, phone ? 80 : 130), v: rand(8, 14), spin: rand(0, TAU) }; }
    for (var i = 0; i < NL; i++) lines.push(newLine(true));
    for (var j = 0; j < NV; j++) leaves.push(newLeaf(true));
    for (var k = 0; k < (phone ? 2 : 4); k++) { var v0 = newVortex(); v0.x = rand(0, vw()); vort.push(v0); }
    var kanji = sfx('風', vw() * .5, vh() * .4, { cls: 'xl', en: 'WIND RELEASE', color: '#2fa876', life: 1400, rot: -4 });
    later(500, function () { sfx('ヒュウウウ', vw() * .7, vh() * .62, { cls: 'sm', color: '#2fa876', life: 1100 }); });
    var end = performance.now() + 9000; windStop = end;
    layer(function (c, t, now) {
      var fade = windOn ? Math.min(1, t / 400) : 0;
      if (windOn && now > end && windStop === end) { windOn = false; root.classList.remove('pw-windy'); paint(); }
      if (!windOn) { stopClip('wind'); return false; }
      var Wd = vw(), Hd = vh();
      c.lineCap = 'round'; c.strokeStyle = streak;
      /* dust motes riding a turbulent flow field */
      c.globalAlpha = .45 * fade; c.lineWidth = 1; c.beginPath();
      motes.forEach(function (m) {
        var an = (noise2(m.x * .003, m.y * .004 + t * .0004) - .5) * 1.6, sp = (9 + noise1(m.y * .01 + t * .001) * 14) * m.s;
        var mx = m.x + Math.cos(an) * sp, my = m.y + Math.sin(an) * sp;
        c.moveTo(m.x, m.y); c.lineTo(mx, my); m.x = mx; m.y = my;
        if (m.x > Wd + 20 || m.y < -20 || m.y > Hd + 20) { m.x = rand(-40, 0); m.y = rand(0, Hd); }
      });
      c.stroke();
      lines.forEach(function (l, i) {
        l.x += l.v; if (l.x > Wd + 40) lines[i] = newLine(false);
        var y = l.y + Math.sin(t / 400 + l.wob) * 12;
        c.globalAlpha = l.a * fade; c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(l.x, y); c.quadraticCurveTo(l.x + l.len * .5, y - 10, l.x + l.len, y); c.stroke();
      });
      /* spiral vortices rolling across */
      vort.forEach(function (v, i) {
        v.x += v.v; v.spin += .12; if (v.x > Wd + 200) vort[i] = newVortex();
        c.globalAlpha = .35 * fade; c.lineWidth = 1.6;
        for (var r = 0; r < 3; r++) {
          c.beginPath();
          for (var a = 0; a < 5.5; a += .15) {
            var rr = v.r * (a / 5.5) * (1 - r * .2), px = v.x + Math.cos(a + v.spin + r * 2) * rr, py = v.y + Math.sin(a + v.spin + r * 2) * rr * .45;
            if (a === 0) c.moveTo(px, py); else c.lineTo(px, py);
          }
          c.stroke();
        }
      });
      leaves.forEach(function (f, i) {
        f.x += f.v; f.y += Math.sin(t / 300 + f.wob) * 1.8 + .6 + (noise2(f.x * .003, t * .0004) - .5) * 3; f.r += f.vr;
        if (f.x > Wd + 30 || f.y > Hd + 30) leaves[i] = newLeaf(false);
        /* leaves tumble in 3D: they turn edge-on and show their darker back */
        var flip = Math.cos(t / 240 + f.wob), sq = Math.sin(t / 170 + f.wob * 2);
        c.save(); c.translate(f.x, f.y); c.rotate(f.r); c.scale(Math.max(.12, Math.abs(flip)), .55 + Math.abs(sq) * .45);
        c.globalAlpha = .92 * fade; c.fillStyle = f.c;
        c.beginPath(); c.moveTo(-f.s, 0); c.quadraticCurveTo(0, -f.s * .75, f.s, 0); c.quadraticCurveTo(0, f.s * .75, -f.s, 0); c.fill();
        if (flip < 0) { c.fillStyle = 'rgba(0,0,0,.28)'; c.fill(); }
        c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = .8; c.beginPath(); c.moveTo(-f.s, 0); c.lineTo(f.s, 0); c.stroke();
        c.restore();
      });
    });
    return kanji;
  }
