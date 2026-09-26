  function legion(cine) {
    var w = vw(), h = vh(), n = phone ? 4 : 8, list = [], ranks = [], kneelT = 0, fade = 1, lyr, i, j;
    for (i = 0; i < n; i++) {
      var slot = (i + .5) / n, off = Math.abs(slot - .5);
      list.push({ x: slot * w + rand(-24, 24), size: rand(.88, 1.1) * (phone ? 96 : 138) * (1.15 - off * .5), base: h + 6, dim: 1, o: 1, ph: rand(0, 6), sword: i % 2 === 1, t0: 0, eye: 1, off: off, lod: 0, rig: rig(KP.rise), pose: KP.rise, dn: -1 });
    }
    list.sort(function (a, b) { return a.off - b.off; });   /* the middle rises first */
    [[phone ? 5 : 10, .62, h - (phone ? 40 : 62), .72], [phone ? 6 : 13, .44, h - (phone ? 72 : 112), .5]].forEach(function (rk, ri) {
      for (j = 0; j < rk[0]; j++) ranks.push({ x: (j + .5) / rk[0] * w + rand(-20, 20), size: rand(.9, 1.08) * (phone ? 96 : 138) * rk[1], base: rk[2], dim: rk[3], o: 0, ph: rand(0, 6), sword: Math.random() < .3, t0: 0, eye: 1, rank: ri, lod: phone ? 2 : 1, rig: rig(KP.rise), pose: KP.rise, dn: -1 });
    });
    var spk = sparkField('150,100,255'), mist = sprite('34,18,64');
    var order = ranks.filter(function (s) { return s.rank === 1; }).concat(ranks.filter(function (s) { return s.rank === 0; }), list);
    function eyeY(s) { return s.eyeY || s.base - s.size * 2.06; }
    /* layer time now: the cel clocks and the pose rigs run on it, so a hit-stop holds them too */
    function lnow() { return Math.max(1, performance.now() - lyr.t0); }
    function up(s, t) { return s.t0 && t >= s.t0; }
    /* the erupt: smear drawings up out of the ground, a squash as it lands
       (the brace), then the snap upright; a knight that rises after the
       kneel was called goes down on one knee as soon as it stands */
    function erupt(s, at) {
      s.t0 = at; s.eye = Math.max(s.eye, 1.8);
      s.rig.to(KP.brace, at + CEL * 2, 1); s.rig.to(KP.stand, at + CEL * 4, 250, EASE.back);
      if (kneelT) { s.rig.to(KP.kneelAnt, at + CEL * 10, 170, EASE.inq); s.rig.to(KP.kneel, at + CEL * 12, 300, EASE.land); }
    }
    lyr = layer(function (c, t, now) {
      if (cine.ending) fade = Math.max(0, fade - .025);
      spk.draw(c); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      var b = celBuffer(), vis = [];
      order.forEach(function (s) {
        if (!up(s, t)) return;
        /* on twos and threes: the pose, the smear and the sway only change with the drawing, never between */
        var d = cel(t - s.t0), p = pose(KNIGHT, d);
        s.o = fade; s.eye = 1 + (s.eye - 1) * .9;
        if (s.dn !== d.n) {
          s.dn = d.n; s.sx = p[0]; s.sy = p[1]; s.sink = (1 - p[2]) * s.size * 2.6;
          s.pose = s.rig.step(s.t0 + d.at); s.parts = knightParts(s, s.t0 + idle(KNIGHT, d), s.pose);
        }
        vis.push(s);
        /* the ground: a hard shadow thrown away from the seal */
        b.save(); if (s.rank != null) { b.beginPath(); b.rect(0, 0, w, s.base + 2); b.clip(); }
        castShadow(b, s, s.parts, w); b.restore();
      });
      composite(c, .5 * fade);
      /* back to front: the far rank, the near rank, then the front line; each
         rank stands in its own mist so its feet vanish into the fog */
      var tgt = fade < 1 ? celBuffer() : c, rk = null;
      vis.forEach(function (s) {
        if (s.rank !== rk) { if (rk != null) rankMist(rk); rk = s.rank; }
        if (s.dn < 2) streaks(tgt, s, s.dn);
        tgt.save(); if (s.rank != null) { tgt.beginPath(); tgt.rect(0, 0, w, s.base + 2); tgt.clip(); }
        soldier(tgt, s, s.parts); tgt.restore();
      });
      if (rk != null) rankMist(rk);
      if (tgt !== c) composite(c, fade);
      vis.forEach(function (s) { knightEyes(c, s, t); });
      function rankMist(ri) {
        var t2 = tgt; t2.save(); t2.globalCompositeOperation = 'source-over';
        ranks.forEach(function (s) { if (s.rank === ri && up(s, t)) { blob(t2, mist, s.x - s.size * .3, s.base + 2, s.size * .55, .55); blob(t2, mist, s.x + s.size * .35, s.base + 6, s.size * .5, .5); } });
        t2.restore();
      }
      if (cine.ending && fade <= 0) return false;
    });
    return {
      spawn: function (wave, waves) {
        var per = Math.ceil(n / waves), now = lnow();
        list.slice(wave * per, wave * per + per).forEach(function (s) {
          erupt(s, now); s.eye = 2.2;
          shockwave(s.x, h, '#9a6bff', s.size * 2.4, 700);
          spk.burst(s.x, h - 4, phone ? 10 : 22, 13, -Math.PI / 2, .9, 3);
          later(480, function () { if (!cine.dead) lensFlare(s.x, eyeY(s), '120,220,255', 800, .4); });
        });
      },
      /* a whole rank rises out of the fog, rippling outward from the middle;
         the ripple is snapped to the cel grid, so the rank changes drawings together */
      rank: function (ri) {
        var now = lnow();
        ranks.forEach(function (s) { if (s.rank === ri) erupt(s, now + Math.round((Math.abs(s.x - w / 2) / w * 700 + rand(0, 120)) / (CEL * 2)) * CEL * 2); });
      },
      pulse: function (k) { list.concat(ranks).forEach(function (s) { s.eye = Math.max(s.eye, k || 1.5); }); },
      /* the salute: a dip, then the right fist snaps to the chest, the middle first */
      salute: function () {
        var now = lnow(); cine.saluteT = performance.now();
        list.forEach(function (s, i) {
          if (!s.t0) return;
          s.eye = 2.8;
          var at = Math.max(now + CEL * 4 + i * CEL * 2, s.t0 + CEL * 8);
          s.rig.to(KP.saluteAnt, at - CEL * 2, 170, EASE.inq); s.rig.to(KP.salute, at, 200, EASE.back);
          later(at - now, function () { if (!cine.dead) lensFlare(s.x, eyeY(s), '140,210,255', 1000, .55); });
        });
        ranks.forEach(function (s) {
          s.eye = 2.4;
          if (!up(s, now)) return;
          var at = Math.max(now + CEL * 6 + Math.round(Math.abs(s.x - w / 2) / w * 5) * CEL * 2 + s.rank * CEL * 3, s.t0 + CEL * 10);
          s.rig.to(KP.saluteAnt, at - CEL * 2, 170, EASE.inq); s.rig.to(KP.salute, at, 200, EASE.back);
        });
      },
      /* the kneel: a breath up, then down hard on one knee, sparks off the ground */
      kneel: function () {
        var now = lnow(); kneelT = now; cine.kneelT = performance.now();
        list.concat(ranks).forEach(function (s) {
          if (!s.t0) return;
          var at = now + CEL * 4 + Math.round(Math.abs(s.x - w / 2) / w * 6) * CEL * 2 + (s.rank == null ? 0 : (s.rank + 1) * CEL * 4);
          if (now < s.t0 + CEL * 10) at = Math.max(at, s.t0 + CEL * 12);   /* still landing: kneel once it stands */
          s.rig.to(KP.kneelAnt, at - CEL * 2, 170, EASE.inq); s.rig.to(KP.kneel, at, 300, EASE.land);
          if (s.rank == null) later(at - now + 180, function () { if (!cine.dead) spk.burst(s.x - s.size * .22, s.base - 6, phone ? 4 : 8, 6, -Math.PI / 2, 1.3, 2); });
        });
      }
    };
  }

  /* ---------- the Shadow Monarch: pose keyframes ----------
     The same joints as a knight, in units of his size; hand = the right hand
     open (1) or a fist (0), spread and flare shape the coat. */
  var MP = {
    stand: { hx: 0, hy: 1.28, klx: .13, kly: .64, flx: .16, fly: 0, krx: -.13, kry: .64, frx: -.18, fry: 0, cx: 0, cy: 1.92, nx: 0, ny: 2.24, hdx: 0, hdy: 2.45, bow: 0, slx: .38, sly: 2.16, srx: -.38, sry: 2.16, shrug: 0, elx: .46, ely: 1.66, hlx: .44, hly: 1.2, erx: -.46, ery: 1.66, hrx: -.44, hry: 1.2, hand: 0, spread: 1, flare: 0 },
    rise: { hx: 0, hy: 1.12, klx: .16, kly: .56, flx: .18, fly: 0, krx: -.16, kry: .56, frx: -.2, fry: 0, cx: 0, cy: 1.72, nx: 0, ny: 2.02, hdx: 0, hdy: 2.22, bow: .55, slx: .37, sly: 1.95, srx: -.37, sry: 1.95, shrug: .3, elx: .5, ely: 1.46, hlx: .52, hly: 1.02, erx: -.5, ery: 1.46, hrx: -.52, hry: 1.02, hand: 0, spread: 1.45, flare: 1 },
    cmdAnt: { hx: 0, hy: 1.27, klx: .13, kly: .64, flx: .16, fly: 0, krx: -.13, kry: .64, frx: -.18, fry: 0, cx: 0, cy: 1.9, nx: 0, ny: 2.22, hdx: 0, hdy: 2.43, bow: .08, slx: .38, sly: 2.15, srx: -.38, sry: 2.15, shrug: .1, elx: .46, ely: 1.66, hlx: .44, hly: 1.2, erx: -.5, ery: 1.9, hrx: -.14, hry: 2.02, hand: 0, spread: 1.05, flare: .2 },
    command: { hx: 0, hy: 1.28, klx: .15, kly: .64, flx: .2, fly: 0, krx: -.17, kry: .64, frx: -.24, fry: 0, cx: .02, cy: 1.93, nx: .01, ny: 2.25, hdx: .02, hdy: 2.47, bow: -.06, slx: .38, sly: 2.15, srx: -.4, sry: 2.18, shrug: 0, elx: .46, ely: 1.66, hlx: .44, hly: 1.2, erx: -.86, ery: 2.16, hrx: -1.3, hry: 1.96, hand: 1, spread: 1.15, flare: .55 },
    salute: { hx: 0, hy: 1.29, klx: .14, kly: .64, flx: .18, fly: 0, krx: -.15, kry: .64, frx: -.21, fry: 0, cx: 0, cy: 1.95, nx: 0, ny: 2.27, hdx: 0, hdy: 2.5, bow: -.18, slx: .38, sly: 2.17, srx: -.4, sry: 2.2, shrug: 0, elx: .46, ely: 1.66, hlx: .44, hly: 1.2, erx: -.7, ery: 2.5, hrx: -.62, hry: 2.95, hand: 1, spread: 1.1, flare: .7 },
    rest: { hx: 0, hy: 1.28, klx: .13, kly: .64, flx: .16, fly: 0, krx: -.13, kry: .64, frx: -.18, fry: 0, cx: 0, cy: 1.92, nx: 0, ny: 2.24, hdx: 0, hdy: 2.45, bow: -.08, slx: .38, sly: 2.16, srx: -.38, sry: 2.16, shrug: 0, elx: .46, ely: 1.66, hlx: .44, hly: 1.2, erx: -.46, ery: 1.66, hrx: -.42, hry: 1.18, hand: 0, spread: .95, flare: 0 }
  };
  function monarchParts(s, t, p, push) {
    var S = s.size, parts = [], k, hl = [p.hlx, p.hly], hr = [p.hrx - push * .1 * p.hand, p.hry - push * .02], el = [p.elx, p.ely], er = [p.erx, p.ery];
    function add(fn, kind, bs) { parts.push([fn, kind, bs || 1]); }
    /* the coat behind him: long, its tails streaming */
    var co = [[p.slx + .02, p.sly + .05], [p.slx + .16 * p.spread + .1 * p.flare, p.sly - .45], [p.hx + .6 * p.spread + .2 * p.flare, .55 + .1 * p.flare]];
    for (k = 0; k <= 8; k++) co.push([p.hx + (.72 - k / 8 * 1.44) * p.spread + Math.sin(t / 240 + k * .9) * .06 * (1 + p.flare), (k % 2 ? .01 : .08) + Math.abs(k - 4) / 4 * .22 * p.flare]);
    co.push([p.hx - .6 * p.spread - .2 * p.flare, .55 + .1 * p.flare], [p.srx - .16 * p.spread - .1 * p.flare, p.sry - .45], [p.srx - .02, p.sry + .05]);
    add(polyPath(co, S), 'cel', 1.4);
    /* legs and boots, seen between the coat's front panels */
    var hipL = [p.hx + .11, p.hy - .02], hipR = [p.hx - .11, p.hy - .02], kl = [p.klx, p.kly], kr = [p.krx, p.kry], fl = [p.flx, p.fly], fr = [p.frx, p.fry];
    add(polyPath(capsule(hipR, kr, .2, .16), S), 'cel', .5); add(polyPath(capsule(kr, fr, .16, .13), S), 'cel', .45);
    add(polyPath([[fr[0] + .13, fr[1]], [fr[0] - .17, fr[1]], [fr[0] - .15, fr[1] + .2], [fr[0] + .11, fr[1] + .24]], S), 'ink');
    add(polyPath(capsule(hipL, kl, .2, .16), S), 'cel', .5); add(polyPath(capsule(kl, fl, .16, .13), S), 'cel', .45);
    add(polyPath([[fl[0] - .13, fl[1]], [fl[0] + .17, fl[1]], [fl[0] + .15, fl[1] + .2], [fl[0] - .11, fl[1] + .24]], S), 'ink');
    add(polyPath([[p.hx - .3, p.hy + .06], [p.hx - .04, p.hy + .06], [p.hx - .14 - .04 * p.flare, .02], [p.hx - .5 * p.spread - .12 * p.flare, .02 + .1 * p.flare]], S), 'cel', 1.1);
    add(polyPath([[p.hx + .3, p.hy + .06], [p.hx + .04, p.hy + .06], [p.hx + .14 + .04 * p.flare, .02], [p.hx + .5 * p.spread + .12 * p.flare, .02 + .1 * p.flare]], S), 'cel', 1.1);
    /* the torso: the coat buttoned to the waist, broad at the shoulders */
    add(polyPath([[p.hx - .27, p.hy - .04], [p.hx + .27, p.hy - .04], [p.cx + .31, p.cy], [p.slx + .02, p.sly + .04], [p.srx - .02, p.sry + .04], [p.cx - .31, p.cy]], S), 'cel');
    add(function (c) { c.moveTo(p.cx * S, -(p.cy + .12) * S); c.lineTo(p.hx * S, -(p.hy + .02) * S); }, 'line');
    /* arms; the right one gives the command */
    add(polyPath(capsule([p.slx, p.sly - .05], el, .15, .12), S), 'cel', .5); add(polyPath(capsule(el, hl, .12, .1), S), 'cel', .4); add(discPath(hl[0], hl[1], .085, S), 'cel', .45);
    add(polyPath(capsule([p.srx, p.sry - .05], er, .15, .12), S), 'cel', .5); add(polyPath(capsule(er, hr, .12, .1), S), 'cel', .4);
    if (p.hand > .5) {
      /* the open hand, fingers spread, palm down over the seal */
      var dx = hr[0] - er[0], dy = hr[1] - er[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, nx = -uy, ny = ux, o = (p.hand - .5) * 2;
      add(polyPath([[hr[0] - nx * .1, hr[1] - ny * .1], [hr[0] + nx * .1, hr[1] + ny * .1], [hr[0] + ux * .22 * o + nx * .14, hr[1] + uy * .22 * o + ny * .14], [hr[0] + ux * .3 * o + nx * .03, hr[1] + uy * .3 * o + ny * .03], [hr[0] + ux * .27 * o - nx * .08, hr[1] + uy * .27 * o - ny * .08], [hr[0] + ux * .17 * o - nx * .13, hr[1] + uy * .17 * o - ny * .13]], S), 'cel', .55);
      add(function (c) {
        c.moveTo((hr[0] + ux * .08) * S, -(hr[1] + uy * .08) * S); c.lineTo((hr[0] + ux * .26 * o + nx * .01) * S, -(hr[1] + uy * .26 * o + ny * .01) * S);
        c.moveTo((hr[0] + ux * .1 + nx * .06) * S, -(hr[1] + uy * .1 + ny * .06) * S); c.lineTo((hr[0] + ux * .21 * o + nx * .08) * S, -(hr[1] + uy * .21 * o + ny * .08) * S);
      }, 'line');
    } else add(discPath(hr[0], hr[1], .085, S), 'cel', .45);
    /* the high collar */
    add(polyPath([[p.nx - .26, p.ny - .14], [p.nx + .26, p.ny - .14], [p.nx + .3, p.ny + .2], [p.nx + .13, p.ny + .08], [p.nx, p.ny], [p.nx - .13, p.ny + .08], [p.nx - .3, p.ny + .2]], S), 'cel', .8);
    /* the hood, and the face in shadow under it */
    var hx = p.hdx + p.bow * .05, hy = p.hdy - p.bow * .06;
    add(function (c) {
      c.moveTo((hx - .34) * S, -(hy - .3) * S);
      c.quadraticCurveTo((hx - .3) * S, -(hy + .1) * S, (hx - .14) * S, -(hy + .28) * S);
      c.quadraticCurveTo((hx - .02) * S, -(hy + .4) * S, (hx + .03) * S, -(hy + .5) * S);
      c.quadraticCurveTo((hx + .1) * S, -(hy + .36) * S, (hx + .18) * S, -(hy + .26) * S);
      c.quadraticCurveTo((hx + .3) * S, -(hy + .1) * S, (hx + .34) * S, -(hy - .3) * S);
      c.lineTo((hx + .12) * S, -(hy - .34) * S); c.lineTo((hx - .12) * S, -(hy - .34) * S); c.closePath();
    }, 'cel');
    add(polyPath([[hx - .16, hy - .26], [hx + .16, hy - .26], [hx + .13, hy + .06], [hx + .02, hy + .18], [hx - .11, hy + .08]], S), 'hole');
    add(function (c) { c.moveTo((hx - .12) * S, -(hy - .02) * S); c.lineTo((hx - .16) * S, -(hy - .26) * S); c.lineTo((hx + .16) * S, -(hy - .26) * S); c.lineTo((hx + .13) * S, -(hy + .02) * S); }, 'edge');
    s.eyeX = s.x + hx * S * (s.sx || 1); s.eyeY = s.base + (s.sink || 0) - (hy - .01 - p.bow * .03) * S * (s.sy || 1);
    return parts;
  }

  /* the Shadow Monarch: a tall hooded figure who rises from the seal on the
     command, coat streaming, eyes burning, wrapped in a violet-black aura;
     purple lightning crackles around him when the music surges. His poses:
     he straightens as he rises, throws his hand out over the army as the
     drop hits (the cue sheet says when), raises it to the sky for the
     salute, and lowers it to receive the kneel. The army's salute and kneel
     reach him through cine.saluteT / cine.kneelT, which legion() sets. */
  function monarch(cine) {
    var w = vw(), h = vh(), S = phone ? 118 : 172, x0 = w / 2, t0 = 0, rose = 0, fade = 1, fx = [], zap = null, zapT = 0, surge = 0, push = 0, cued = 0, dn = -1, parts = null, lyr;
    var sprV = sprite('140,80,255'), sprD = sprite('6,2,14'), sprE = sprite('175,232,255', true);
    var fig = { x: x0, base: h + 6, size: S, dim: 1, ph: 0, o: 1, lod: 0, pose: MP.rise }, R = rig(MP.rise);
    /* the command lands on the first hit of the drop: by the cue sheet, that long after the word */
    var DROP0 = (mark('arise-voice', 'end', 1.85) - mark('arise-voice', 'word', 1.3) + mark('arise-theme', 'drop', [3.96])[0]) * 1000;
    lyr = layer(function (c, t, now) {
      if (cine.ending) fade = Math.max(0, fade - .025);
      if (cine.ending && fade <= 0) return false;
      if (!t0) return;
      surge *= .94; push *= .88;
      /* the cues, in layer time so a drawing never skips: the command is timed from the word by the
         clock on the wall (a hit-stop between the two must not delay it), the army's salute and
         kneel reach him through cine; the hand goes up to the sky, then down to receive the kneel */
      if (!cued && now >= rose + DROP0 - 260) { cued = 1; R.to(MP.cmdAnt, t, 240, EASE.inq); R.to(MP.command, t + 240, 200, EASE.back); }
      if (cine.saluteT && cued < 2) { cued = 2; R.to(MP.cmdAnt, t, 170, EASE.inq); R.to(MP.salute, t + 170, 220, EASE.back); }
      if (cine.kneelT && cued < 3) { cued = 3; R.to(MP.rest, t + 200, 700); }
      /* on twos and threes from the beat he rose on: smear drawings, a squash, then a hard hold before the coat streams */
      var d = cel(t - t0), p = pose(LORD, d), rise = p[2];
      var H = S * 2.7, top = fig.base - rise * H, x = x0 + Math.sin(t / 1300) * 2;
      fig.o = fade;
      if (dn !== d.n) {
        dn = d.n; fig.x = x; fig.sx = p[0]; fig.sy = p[1]; fig.sink = (1 - rise) * S * 2.9;
        fig.pose = R.step(t0 + d.at); parts = monarchParts(fig, t0 + idle(LORD, d), fig.pose, push);
      }
      /* the aura: violet flames and black smoke boiling up off him */
      for (var k = 0; k < (phone ? 3 : 6); k++) {
        var a = rand(-1, 1);
        fx.push({ x: x + a * S * .45, y: top + H * rand(.1, 1), vx: a * .3, vy: -rand(1.2, 3), s: rand(12, 30), l: 1, dark: Math.random() < .45 });
      }
      fx = fx.filter(function (f) {
        f.x += f.vx + Math.sin(t / 200 + f.s) * .3; f.y += f.vy; f.l -= .022;
        if (f.l <= 0) return false;
        c.globalCompositeOperation = f.dark ? 'source-over' : 'lighter';
        c.save(); c.translate(f.x, f.y); c.scale(.7, 1.5);
        blob(c, f.dark ? sprD : sprV, 0, 0, f.s, (f.dark ? .5 : .35 + surge * .3) * f.l * fade * rise);
        c.restore();
        return true;
      });
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      /* his shadow on the seal, then the figure */
      if (dn < 2) streaks(c, fig, dn);
      castShadow(celBuffer(), fig, parts, w); composite(c, .5 * fade);
      var L = sealLight(fig, fig.pose.cy);
      if (fade < 1) { drawFigure(celBuffer(), fig, parts, L[0], L[1], tones(1), 0); composite(c, fade); }
      else drawFigure(c, fig, parts, L[0], L[1], tones(1), 0);
      /* the eyes */
      c.globalCompositeOperation = 'lighter';
      var hw = S * .11, ey = fig.eyeY, eb = (.8 + Math.sin(t / 110) * .2 + surge) * fade * rise;
      blob(c, sprE, fig.eyeX - hw * .9, ey, hw * .55 * (1 + surge), eb); blob(c, sprE, fig.eyeX + hw * .9, ey, hw * .55 * (1 + surge), eb);
      c.fillStyle = '#e6f6ff'; c.globalAlpha = Math.min(1, eb);
      c.fillRect(fig.eyeX - hw * 1.08, ey - 1, hw * .36, 2); c.fillRect(fig.eyeX + hw * .72, ey - 1, hw * .36, 2);
      /* purple lightning when the music surges: at 60, never held */
      if (surge > .3 && now > zapT) {
        zapT = now + rand(40, 90);
        var za = rand(0, TAU), zy = top + H * rand(.15, .7);
        zap = makeBolt(x + rand(-12, 12), zy, x + Math.cos(za) * S * rand(.6, 1.1), zy + Math.sin(za) * S * .6, 1, 1, .2);
        ion(zap, .7);
      }
      if (zap && surge > .3) drawBolt(c, zap, '#a86bff', Math.min(1, surge));
      c.globalAlpha = 1;
    });
    return {
      rise: function () {
        rose = performance.now(); t0 = Math.max(1, rose - lyr.t0); surge = 1.3;
        R.to(MP.stand, t0 + CEL * 5, 600);
      },
      surge: function (k) { surge = Math.max(surge, k); if (k >= 1.05) { push = 1; dn = -1; } }
    };
  }

  /* the air: shadow tendrils creeping in from the edges, dark ground fog,
     drifting ash and bokeh, beat ripples out from the seal, god rays, embers,
     and soul light flowing up into each piece of the page as it rises */
  function atmosphere(cine) {
    var w = vw(), h = vh(), ash = [], fog = [], flow = [], rings = [], tend = [], fade = 0, i, rayT = 0, retractT = 0;
    for (i = 0; i < (phone ? 50 : 120); i++) ash.push({ x: rand(0, w), y: rand(0, h), v: rand(.2, .9), s: rand(1, 2.6), ph: rand(0, 6), big: Math.random() < .08 });
    for (i = 0; i < (phone ? 6 : 12); i++) fog.push({ x: rand(-100, w + 100), y: h - rand(0, h * .16), r: rand(130, 280), v: rand(-.35, .35) });
    for (i = 0; i < (phone ? 6 : 11); i++) {
      var e = Math.random(), sx0 = e < .5 ? rand(0, w) : (e < .75 ? -10 : w + 10), sy0 = e < .5 ? (Math.random() < .5 ? -10 : h + 10) : rand(0, h);
      var ang = Math.atan2(h * .55 - sy0, w / 2 - sx0) + rand(-.5, .5), pts = [[sx0, sy0]], L = Math.max(w, h) * rand(.28, .42);
      for (var k = 1; k <= 22; k++) { ang += rand(-.28, .28); pts.push([pts[k - 1][0] + Math.cos(ang) * L / 22, pts[k - 1][1] + Math.sin(ang) * L / 22]); }
      tend.push({ p: pts, w: rand(16, 30), ph: rand(0, 6) });
    }
    var sprV = sprite('120,60,255'), sprD = sprite('8,3,18'), sprS = sprite('205,175,255', true), emb = sparkField('180,130,255');
    layer(function (c, t, now) {
      fade = cine.ending ? Math.max(0, fade - .02) : Math.min(1, fade + .02);
      if (cine.ending && fade <= 0) return false;
      /* shadow tendrils: they grow in as the dark falls and pull back when the knights rise */
      var grow = Math.min(1, t / 2600) * (retractT ? Math.max(0, 1 - (now - retractT) / 1400) : 1);
      if (grow > 0) {
        c.globalCompositeOperation = 'source-over'; c.lineCap = 'round'; c.lineJoin = 'round';
        tend.forEach(function (td) {
          var m = Math.max(1, Math.floor(td.p.length * .8 * grow));
          for (var s = 1; s < m; s++) {
            var a0 = td.p[s - 1], a1 = td.p[s], wob = Math.sin(t / 320 + s * .6 + td.ph) * 4;
            c.strokeStyle = 'rgba(4,2,10,.85)'; c.globalAlpha = fade; c.lineWidth = td.w * (1 - s / td.p.length) + 2;
            c.beginPath(); c.moveTo(a0[0], a0[1] + wob); c.lineTo(a1[0], a1[1] + wob); c.stroke();
          }
          c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(150,90,255,.4)'; c.lineWidth = 1.4; c.beginPath();
          for (var s2 = 0; s2 < m; s2++) { var pp = td.p[s2]; c[s2 ? 'lineTo' : 'moveTo'](pp[0], pp[1] + Math.sin(t / 320 + s2 * .6 + td.ph) * 4); }
          c.stroke(); c.globalCompositeOperation = 'source-over';
        });
      }
      c.globalCompositeOperation = 'source-over';
      fog.forEach(function (f) { f.x += f.v; if (f.x < -320) f.x = w + 320; if (f.x > w + 320) f.x = -320; blob(c, sprD, f.x, f.y, f.r, .6 * fade); });
      c.globalCompositeOperation = 'lighter';
      fog.forEach(function (f) { blob(c, sprV, f.x, f.y + 24, f.r * .8, .1 * fade); });
      /* ripples out across the ground from the seal, on the beat */
      rings = rings.filter(function (rg) {
        /* a ring pushed on a beat timer can be newer than this frame's timestamp: clamp, since
           a negative radius throws in ellipse() and an exception here stops the whole loop */
        var k2 = Math.max(0, (now - rg.t) / 1400);
        if (k2 >= 1) return false;
        var e2 = 1 - Math.pow(1 - k2, 3), rx = e2 * w * .6 + 20;
        c.strokeStyle = 'rgba(170,120,255,1)'; c.globalAlpha = (1 - k2) * .55 * rg.k * fade; c.lineWidth = 2;
        c.beginPath(); c.ellipse(w / 2, h * .985, rx, rx * .16, 0, 0, TAU); c.stroke();
        return true;
      });
      /* god rays when the page wakes */
      if (rayT) {
        var rk = (now - rayT) / 2200;
        if (rk < 1) {
          var env = Math.sin(Math.PI * rk), ox = w / 2, oy = -h * .25;
          for (var ri = 0; ri < 14; ri++) {
            var ra = Math.PI / 2 + (ri / 13 - .5) * 1.3 + Math.sin(now / 1400 + ri) * .03, rw = .018 + (ri % 3) * .01, R = Math.hypot(w, h) * 1.3;
            var gr = c.createLinearGradient(ox, oy, ox + Math.cos(ra) * R, oy + Math.sin(ra) * R);
            gr.addColorStop(0, 'rgba(235,225,255,' + (.34 * env) + ')'); gr.addColorStop(.6, 'rgba(150,100,255,' + (.12 * env) + ')'); gr.addColorStop(1, 'rgba(150,100,255,0)');
            c.globalAlpha = fade; c.fillStyle = gr; c.beginPath(); c.moveTo(ox, oy);
            c.lineTo(ox + Math.cos(ra - rw) * R, oy + Math.sin(ra - rw) * R); c.lineTo(ox + Math.cos(ra + rw) * R, oy + Math.sin(ra + rw) * R); c.closePath(); c.fill();
          }
        } else rayT = 0;
      }
      ash.forEach(function (a) {
        a.y -= a.v; a.x += Math.sin(t / 900 + a.ph) * .3;
        if (a.y < -20) { a.y = h + 10; a.x = rand(0, w); }
        if (a.big) blob(c, sprV, a.x, a.y, 14 + a.s * 6, .12 * fade);
        else { c.globalAlpha = (.35 + .25 * Math.sin(t / 300 + a.ph)) * fade; c.fillStyle = '#b9a2ff'; c.fillRect(a.x, a.y, a.s, a.s); }
      });
      c.lineCap = 'round';
      flow = flow.filter(function (p) {
        var k3 = (now - p.t0) / p.d;
        if (k3 < 0) return true;
        if (k3 >= 1) return false;
        var e3 = k3 * k3 * (3 - 2 * k3), x = p.x0 + (p.x1 - p.x0) * e3 + Math.sin(k3 * 6 + p.ph) * p.sw * (1 - k3), y = p.y0 + (p.y1 - p.y0) * e3;
        if (p.px != null) { c.strokeStyle = '#a07bff'; c.globalAlpha = .7 * fade; c.lineWidth = 2; c.beginPath(); c.moveTo(p.px, p.py); c.lineTo(x, y); c.stroke(); }
        p.px = x; p.py = y;
        blob(c, sprS, x, y, 7, .9 * fade);
        return true;
      });
      c.globalAlpha = 1;
      emb.draw(c);
    });
    return {
      flow: function (x0, y0, x1, y1, delay) { flow.push({ x0: x0, y0: y0, x1: x1, y1: y1, t0: performance.now() + (delay || 0), d: rand(650, 1050), ph: rand(0, 6), sw: rand(10, 40), px: null, py: null }); },
      ripple: function (k) { rings.push({ t: performance.now(), k: k || 1 }); },
      retract: function () { if (!retractT) retractT = performance.now(); },
      rays: function () { rayT = performance.now(); },
      embers: function (x, y, n2) { emb.burst(x, y, n2, 9, -Math.PI / 2, 1.4, 4); }
    };
  }
