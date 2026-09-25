/* XIRAIYA — Motion Wing: 3D point-cloud engine and the live connections globe. */
(function () {
  'use strict';
  var W = window.XRWING, XR = window.XR;
  if (!W || !XR) return;
  var add = W.add, pointer = W.pointer, canvas = W.canvas;
  var RAD = Math.PI / 180;

  /* points are [x, y, z, hue, size] in -1..1; drag rotates with inertia.
     o.after(g, project, T, S) draws on top with the same camera. */
  function cloud(o) {
    return function (k, el) {
      var cv = canvas(k, el), g = cv.g, p = pointer(k, el), P = o.gen(), ay = o.ay || 0, ax = o.tilt == null ? -.35 : o.tilt, spin = o.spin == null ? .35 : o.spin, vy = spin, vx = 0, drag = null, T = 0, bg = o.bg || '#0b0912';
      el.style.background = bg; el.style.cursor = 'grab';
      k.on(el, 'pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY }; vy = vx = 0; });
      k.on(el, 'pointermove', function (e) { if (!drag) return; var dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; ay += dx * .01; ax = Math.max(-1.2, Math.min(1.2, ax + dy * .01)); vy = dx * .7; vx = dy * .7; });
      k.on(window, 'pointerup', function () { drag = null; });
      k.loop(function (dt) {
        T += dt;
        if (!drag) { ay += vy * dt; ax += vx * dt; vy += (spin - vy) * dt * .8; vx *= .94; ax += ((o.tilt == null ? -.35 : o.tilt) - ax) * dt * .5; }
        if (o.anim) o.anim(P, T, dt);
        var Wd = cv.w, H = cv.h, S = Math.min(Wd, H) * (o.scale || .36), cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
        function project(x0, y0, z0) { var x = x0 * cy - z0 * sy, z = x0 * sy + z0 * cy, y = y0 * cx - z * sx; z = y0 * sx + z * cx; var f = 3 / (3 + z); return [Wd / 2 + x * S * f, H / 2 + y * S * f, z, f]; }
        g.fillStyle = bg; g.fillRect(0, 0, Wd, H);
        if (o.before) o.before(g, Wd, H, S);
        var pr = P.map(function (q) { var r = project(q[0], q[1], q[2]); r.push(q); return r; });
        if (!o.noSort) pr.sort(function (a, b) { return b[2] - a[2]; });
        for (var m = 0; m < pr.length; m++) {
          var d = pr[m], q2 = d[4], r = (o.dot || 1.6) * d[3] * (q2[4] || 1);
          g.globalAlpha = Math.max(.1, Math.min(1, 1.05 - d[2] * .55));
          g.fillStyle = o.color ? o.color(q2, d[2], T) : 'hsl(' + q2[3] + ',85%,65%)';
          if (r < 1.4) g.fillRect(d[0] - r, d[1] - r, r * 2, r * 2); else { g.beginPath(); g.arc(d[0], d[1], r, 0, 6.3); g.fill(); }
        }
        g.globalAlpha = 1;
        if (o.after) o.after(g, project, T, S, Wd, H);
      });
    };
  }
  function fib(N) { var out = []; for (var i = 0; i < N; i++) { var y = 1 - (i + .5) / N * 2, rr = Math.sqrt(1 - y * y), a = i * 2.39996; out.push([Math.cos(a) * rr, y, Math.sin(a) * rr]); } return out; }
  function noise(x, y) { return Math.sin(x * 1.7 + Math.sin(y * 1.3)) * .5 + Math.sin(y * 2.3 + x * .7) * .3 + Math.sin((x + y) * 3.1) * .2; }
  function ll(lat, lon) { var la = lat * RAD, lo = -lon * RAD; return [Math.cos(la) * Math.cos(lo), -Math.sin(la), Math.cos(la) * Math.sin(lo)]; }

  /* Live connections globe: land dots, city markers and arcs that fly between customers */
  var CITY = [['Dhaka', 23.8, 90.4], ['Rajshahi', 24.4, 88.6], ['London', 51.5, -.1], ['New York', 40.7, -74], ['Dubai', 25.2, 55.3], ['Tokyo', 35.7, 139.7], ['Singapore', 1.35, 103.8], ['Toronto', 43.7, -79.4], ['Berlin', 52.5, 13.4], ['Sydney', -33.9, 151.2], ['São Paulo', -23.5, -46.6], ['Lagos', 6.5, 3.4]];
  var ARCS = [], feed = [];
  add({ id: 'c-globe', t: 'Live customers globe', jp: '地', tag: '3d', size: 'l', kw: 'globe map world arcs orders', hint: 'Orders fly in from around the world. Drag to spin the planet.',
    run: cloud({
      bg: '#070a14', scale: .42, tilt: -.3, spin: .18, dot: 1.25,
      gen: function () {
        ARCS = []; feed = [];
        return fib(2600).map(function (q) { var lat = Math.asin(-q[1]), lon = Math.atan2(q[2], q[0]), land = noise(lon * 1.6, lat * 2.2) > .12; return [q[0], q[1], q[2], land ? 1 : 0, land ? 1 : .55]; });
      },
      color: function (q, z) { return q[3] ? 'rgba(160,190,255,' + (0.95 - z * .3) + ')' : 'rgba(70,90,140,.55)'; },
      before: function (g, w, h, S) { var r = g.createRadialGradient(w / 2, h / 2, S * .6, w / 2, h / 2, S * 1.25); r.addColorStop(0, 'rgba(90,120,255,.16)'); r.addColorStop(1, 'rgba(90,120,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); },
      after: function (g, project, T, S, w, h) {
        if (!ARCS.length || T - ARCS[ARCS.length - 1].t0 > .9) {
          var a = CITY[Math.random() * CITY.length | 0], b = CITY[0];
          if (a === b) a = CITY[2];
          if (Math.random() < .4) { var tmp = a; a = b; b = CITY[1 + Math.random() * (CITY.length - 1) | 0]; if (a === b) b = CITY[3]; a = tmp; }
          ARCS.push({ a: a, b: b, t0: T, amt: [49, 89, 129, 214, 420, 890][Math.random() * 6 | 0] });
          feed.unshift(a[0] + ' → ' + b[0]); feed.length = Math.min(feed.length, 3);
          if (ARCS.length > 7) ARCS.shift();
        }
        ARCS.forEach(function (arc) {
          var A = ll(arc.a[1], arc.a[2]), B = ll(arc.b[1], arc.b[2]), age = T - arc.t0, head = Math.min(1, age / 1.6), tail = Math.max(0, (age - 1.4) / 1.6);
          if (tail >= 1) return;
          var dot = A[0] * B[0] + A[1] * B[1] + A[2] * B[2], om = Math.acos(Math.max(-1, Math.min(1, dot))), so = Math.sin(om) || 1, N = 40, pts = [];
          for (var i = 0; i <= N; i++) { var t = i / N; if (t < tail || t > head) continue; var s1 = Math.sin((1 - t) * om) / so, s2 = Math.sin(t * om) / so, lift = 1 + Math.sin(t * Math.PI) * (.12 + om * .1); pts.push(project((A[0] * s1 + B[0] * s2) * lift, (A[1] * s1 + B[1] * s2) * lift, (A[2] * s1 + B[2] * s2) * lift)); }
          if (pts.length < 2) return;
          g.lineWidth = 2; g.lineCap = 'round';
          for (var j = 1; j < pts.length; j++) { var hidden = pts[j][2] > .15; g.strokeStyle = hidden ? 'rgba(255,140,90,.12)' : 'rgba(255,' + (120 + j * 3) + ',80,' + (.35 + j / pts.length * .6) + ')'; g.beginPath(); g.moveTo(pts[j - 1][0], pts[j - 1][1]); g.lineTo(pts[j][0], pts[j][1]); g.stroke(); }
          var hp = pts[pts.length - 1]; if (head < 1 && hp[2] < .15) { g.fillStyle = '#fff3e0'; g.beginPath(); g.arc(hp[0], hp[1], 3, 0, 6.3); g.fill(); }
          if (head >= 1 && age < 2.6) { var e = project(B[0], B[1], B[2]); if (e[2] < .1) { var rr = (age - 1.6) * 26; g.strokeStyle = 'rgba(255,160,90,' + Math.max(0, 1 - rr / 26) + ')'; g.lineWidth = 1.5; g.beginPath(); g.arc(e[0], e[1], rr, 0, 6.3); g.stroke(); } }
        });
        CITY.forEach(function (c) { var q = ll(c[1], c[2]), pp = project(q[0], q[1], q[2]); if (pp[2] > .05) return; g.fillStyle = '#ff9a5a'; g.beginPath(); g.arc(pp[0], pp[1], 3, 0, 6.3); g.fill(); g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '600 10px "JetBrains Mono", monospace'; g.fillText(c[0], pp[0] + 6, pp[1] + 3); });
        g.fillStyle = 'rgba(255,255,255,.9)'; g.font = '700 12px "JetBrains Mono", monospace'; g.fillText('● LIVE ORDERS', 16, 24);
        g.font = '500 11px "JetBrains Mono", monospace'; feed.forEach(function (f, i) { g.fillStyle = 'rgba(200,215,255,' + (.8 - i * .22) + ')'; g.fillText(f, 16, 44 + i * 16); });
      }
    }) });
})();
