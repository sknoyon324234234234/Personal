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
