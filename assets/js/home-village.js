/* =====================================================================
   XIRAIYA — home: the Hidden Village (3D), 
   The village is a small three.js scene loaded only when it scrolls near.
   Characters are cut-out billboards that always turn to face the camera;
   each girl stands in her own corner of the village. Without WebGL (or with reduced
   motion) a layered still of the crew is shown instead.
   ===================================================================== */
(function () {
  'use strict';
  var XR = window.XR;
  if (!XR) return;
  var $ = XR.$, $$ = XR.$$;
  var IMG = 'assets/img/anime/';

  var CREW = [
    { id: 'albedo', name: 'Albedo', role: 'The Overseer', el: 'Shadow', job: 'Project lead', pow: 98, line: 'Keeps every project in order. Nothing ships until she nods.', h: 3.6 },
    { id: 'blaze', name: 'Blaze', role: 'Flame kunoichi', el: 'Fire', job: 'Front-end', pow: 91, line: 'Turns a plain page into something that moves. Fast on every phone.', h: 3.1, pixel: true },
    { id: 'shade', name: 'Shade', role: 'Shadow weaver', el: 'Void', job: 'Automation and bots', pow: 94, line: 'Her shadow clones run your scripts overnight and report at dawn.', h: 3.2 },
    { id: 'aqua', name: 'Aqua', role: 'Tide mage', el: 'Water', job: 'Databases and APIs', pow: 88, line: 'Keeps data flowing where it should and nowhere else.', h: 3.1, pixel: true },
    { id: 'noir', name: 'Noir', role: 'Night scribe', el: 'Ink', job: 'Back-end', pow: 86, line: 'Writes the server code while the village sleeps.', h: 3.0, pixel: true },
    { id: 'maid', name: 'Honey', role: 'Tea house keeper', el: 'Light', job: 'Support and AI chat', pow: 90, line: 'Answers every customer in English and Bangla, with a smile.', h: 3.1, pixel: true }
  ];
  /* ------------------------------------------------------------------
     Character card (shared by the village )
     ------------------------------------------------------------------ */
  var card = $('.vl-card');
  function fillCard(c) {
    if (!card) return;
    var img = $('.vl-card-img', card);
    img.src = IMG + c.id + '.webp';
    img.alt = c.name + ', ' + c.role;
    img.classList.toggle('px', !!c.pixel);
    $('.vl-card-role', card).textContent = c.role;
    $('.vl-card-name', card).textContent = c.name;
    $('.vl-card-line', card).textContent = c.line;
    $('.vl-card-stats', card).innerHTML =
      '<div><dt>Element</dt><dd>' + c.el + '</dd></div><div><dt>Job</dt><dd>' + c.job + '</dd></div>' +
      '<div class="pw"><dt>Power</dt><dd><i style="--p:' + c.pow + '%"></i><b>' + c.pow + '</b></dd></div>';
    card.hidden = false;
    card.classList.remove('in'); void card.offsetWidth; card.classList.add('in');
  }
  if (card) $('.vl-x', card).addEventListener('click', function () { card.hidden = true; });

  /* ------------------------------------------------------------------
     The 3D village
     ------------------------------------------------------------------ */
  var stage = $('[data-village]');
  if (!stage) return;
  var section = stage.closest('.vl');
  var canvas = $('.vl-canvas', stage);
  var gl = (function () { try { var c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
  if (!gl || XR.reduce) { section.classList.add('is-still'); wireStillButtons(); return; }

  function wireStillButtons() {
    var i = 0;
    $$('[data-vl]', section).forEach(function (b) {
      var k = b.getAttribute('data-vl');
      if (k === 'spin') { b.hidden = true; return; }
      b.addEventListener('click', function () {
        if (k === 'time') { var on = section.classList.toggle('is-night'); b.setAttribute('aria-pressed', on); }
        if (k === 'next') { fillCard(CREW[i]); i = (i + 1) % CREW.length; }
      });
    });
  }

  XR.whenVisible(stage, function () {
    var url = new URL('assets/vendor/three.module.min.js', document.baseURI).href;
    import(url).then(build).catch(function (e) {
      console.error('[village] 3D failed, showing the still', e);
      section.classList.add('is-still'); wireStillButtons();
    });
  }, '300px');

  function build(T) {
    var phone = window.matchMedia('(max-width: 760px)').matches;
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: !phone, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, phone ? 1.4 : 1.75));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    var scene = new T.Scene();
    var SKY = { dusk: new T.Color('#3a1f3d'), night: new T.Color('#080a1c') };
    scene.background = SKY.dusk.clone();
    scene.fog = new T.Fog(scene.background.getHex(), 26, 70);

    /* phones are portrait: a wider lens, further back, aimed a little higher so the
       square sits under the copy panel instead of behind it */
    var REST = { y: phone ? 4.2 : 1.6, r: phone ? 26 : 18 };
    var camera = new T.PerspectiveCamera(phone ? 70 : 42, 1, .1, 200);
    var target = new T.Vector3(0, REST.y, 0), goal = target.clone();
    var orbit = { th: .5, ph: 1.2, r: REST.r }, want = { th: .5, ph: 1.2, r: orbit.r };

    /* lights */
    var hemi = new T.HemisphereLight('#ffb38a', '#241632', 1.25);
    scene.add(hemi);
    var sun = new T.DirectionalLight('#ffcf9e', 1.6);
    sun.position.set(-18, 16, -10);
    scene.add(sun);

    function mat(c, o) { return new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .85, flatShading: true }, o || {})); }
    function add(geo, m, x, y, z, ry) { var me = new T.Mesh(geo, m); me.position.set(x, y, z); if (ry) me.rotation.y = ry; scene.add(me); return me; }

    /* sky dome gradient */
    var dome = new T.Mesh(new T.SphereGeometry(90, 32, 16), new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new T.Color('#1b1238') }, bot: { value: new T.Color('#ff7a59') } },
      vertexShader: 'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying float h; void main(){ float t = smoothstep(-0.05, 0.55, h); gl_FragColor = vec4(mix(bot, top, t), 1.0); }'
    }));
    scene.add(dome);

    /* moon + stars */
    var moon = add(new T.SphereGeometry(3.2, 24, 16), new T.MeshBasicMaterial({ color: '#ffe3b0', fog: false }), 22, 26, -60);
    var halo = new T.Sprite(new T.SpriteMaterial({ map: glowTex(T, 'rgba(255,214,150,.55)'), fog: false, depthWrite: false, transparent: true }));
    halo.scale.set(22, 22, 1); halo.position.copy(moon.position); scene.add(halo);
    var sg = new T.BufferGeometry(), sp = [];
    for (var s = 0; s < 700; s++) {
      var a = Math.random() * Math.PI * 2, b = Math.random() * .5 + .12, R = 80;
      sp.push(Math.cos(a) * Math.cos(b) * R, Math.sin(b) * R, Math.sin(a) * Math.cos(b) * R);
    }
    sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3));
    var stars = new T.Points(sg, new T.PointsMaterial({ color: '#fff', size: .35, fog: false, transparent: true, opacity: .25 }));
    scene.add(stars);

    /* ground, path and mountains */
    add(new T.CircleGeometry(60, 48), mat('#2a3a2c'), 0, 0, 0).rotation.x = -Math.PI / 2;
    add(new T.CircleGeometry(9.5, 40), mat('#6b5a48'), 0, .02, 0).rotation.x = -Math.PI / 2;
    add(new T.PlaneGeometry(3, 26), mat('#7d6a55'), 0, .03, 13).rotation.x = -Math.PI / 2;
    for (var m = 0; m < 14; m++) {
      var ang = m / 14 * Math.PI * 2 + .2, d = 44 + (m % 3) * 6, hh = 12 + (m * 37 % 11);
      var mt = add(new T.ConeGeometry(9 + (m % 4) * 2, hh, 5), mat(m % 2 ? '#2b1f3a' : '#221a30'), Math.cos(ang) * d, hh / 2 - .5, Math.sin(ang) * d);
      mt.rotation.y = m;
      if (hh > 18) add(new T.ConeGeometry(3.2, 4, 5), mat('#e9e2f2'), mt.position.x, hh - 2, mt.position.z, m);
    }

    /* houses in a ring */
    var windows = [];
    var wallM = mat('#e8d8bd'), woodM = mat('#4a2e22'), roofM = mat('#8f2a22'), roof2M = mat('#2d2a3a');
    function house(x, z, ry, w, d, tall, red) {
      var g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
      var hb = new T.Mesh(new T.BoxGeometry(w, tall, d), wallM); hb.position.y = tall / 2; g.add(hb);
      var base = new T.Mesh(new T.BoxGeometry(w + .3, .4, d + .3), woodM); base.position.y = .2; g.add(base);
      var roof = new T.Mesh(new T.ConeGeometry(Math.max(w, d) * .82, tall * .75, 4), red ? roofM : roof2M);
      roof.rotation.y = Math.PI / 4; roof.position.y = tall + tall * .37; roof.scale.set(1, 1, d / w); g.add(roof);
      var win = new T.Mesh(new T.PlaneGeometry(w * .5, tall * .35), new T.MeshBasicMaterial({ color: '#ffb35c' }));
      win.position.set(0, tall * .55, d / 2 + .01); g.add(win); windows.push(win);
      var door = new T.Mesh(new T.PlaneGeometry(.8, 1.4), woodM); door.position.set(w * .3, .9, d / 2 + .02); g.add(door);
      return g;
    }
    [[0, 3.2, 2.6, 3], [1, 2.6, 2.2, 2.4], [2, 3, 2.8, 2.6], [3, 2.8, 2.4, 3.2], [4, 3.4, 2.6, 2.6], [5, 2.6, 2.4, 2.8], [6, 3, 2.6, 3]].forEach(function (h, i) {
      var ang = Math.PI * .62 + i / 7 * Math.PI * 1.75, R = 14 + (i % 2) * 2.5;
      house(Math.cos(ang) * R, Math.sin(ang) * R, -ang - Math.PI / 2, h[1], h[2], h[3], i % 2 === 0);
    });

    /* pagoda at the back */
    var pg = new T.Group(); pg.position.set(0, 0, -19); scene.add(pg);
    for (var f = 0; f < 5; f++) {
      var sz = 5 - f * .7, y = f * 2.3;
      var body = new T.Mesh(new T.BoxGeometry(sz * .7, 1.6, sz * .7), wallM); body.position.y = y + .8; pg.add(body);
      var rf = new T.Mesh(new T.ConeGeometry(sz * .78, 1, 4), roofM); rf.rotation.y = Math.PI / 4; rf.position.y = y + 2; pg.add(rf);
      var wl = new T.Mesh(new T.PlaneGeometry(sz * .3, .7), new T.MeshBasicMaterial({ color: '#ffb35c' })); wl.position.set(0, y + .9, sz * .35 + .01); pg.add(wl); windows.push(wl);
    }
    var spire = new T.Mesh(new T.CylinderGeometry(.06, .12, 3, 6), mat('#d9a441', { metalness: .6, roughness: .4 })); spire.position.y = 13; pg.add(spire);

    /* torii gate at the entrance */
    var toriiM = mat('#d23c26', { roughness: .6 });
    var tg = new T.Group(); tg.position.set(0, 0, 11); scene.add(tg);
    [-2.2, 2.2].forEach(function (x) { var p = new T.Mesh(new T.CylinderGeometry(.22, .26, 5.2, 10), toriiM); p.position.set(x, 2.6, 0); tg.add(p); });
    var kasagi = new T.Mesh(new T.BoxGeometry(6.6, .38, .5), mat('#1b1512')); kasagi.position.y = 5.3; tg.add(kasagi);
    var nuki = new T.Mesh(new T.BoxGeometry(5.4, .28, .34), toriiM); nuki.position.y = 4.4; tg.add(nuki);

    /* sakura trees */
    var trunkM = mat('#3b2620'), blossom = [mat('#f7a6c1'), mat('#ffc4d6'), mat('#e98aaa')];
    function tree(x, z, s) {
      var g = new T.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
      var t = new T.Mesh(new T.CylinderGeometry(.18, .32, 2.6, 7), trunkM); t.position.y = 1.3; g.add(t);
      for (var k = 0; k < 5; k++) {
        var bl = new T.Mesh(new T.IcosahedronGeometry(1 + (k % 2) * .35, 0), blossom[k % 3]);
        bl.position.set(Math.cos(k * 1.3) * .9, 2.8 + (k % 3) * .45, Math.sin(k * 1.3) * .9); g.add(bl);
      }
      return g;
    }
    [[-9, 12, .9], [9.5, 11.5, .85], [-11, -6, 1.3], [11, -7, 1.25], [-4, -13, 1], [5, -13, 1.1], [-17, 4, 1.2], [17, 3, 1.3]].forEach(function (t) { tree(t[0], t[2] > 0 ? t[1] : t[1], t[2]); });

    /* lanterns with a few real lights, placed between the girls' spots so none
       stands in front of a face when the camera zooms in on her */
    var lanterns = [];
    var lanM = new T.MeshStandardMaterial({ color: '#ff6a3a', emissive: '#ff5a24', emissiveIntensity: 1.6 });
    [[-2.2, 8.6], [2.2, 8.6], [-7.2, -4.15], [7.2, -4.15], [0, -8.3]].forEach(function (p, i) {
      var post = add(new T.CylinderGeometry(.06, .08, 2.2, 6), woodM, p[0], 1.1, p[1]);
      var l = add(new T.SphereGeometry(.34, 12, 10), lanM, p[0], 2.4, p[1]); l.scale.y = 1.25;
      if (i < (phone ? 2 : 4)) { var pl = new T.PointLight('#ff8a3c', 6, 11, 1.6); pl.position.set(p[0], 2.4, p[1]); scene.add(pl); lanterns.push(pl); }
      void post;
    });

    /* notice boards */
    var loader = new T.TextureLoader();
    function tex(src, pixel, cb) {
      var t = loader.load(src, function (tx) { dirty = true; if (cb) cb(tx.image); });
      t.colorSpace = T.SRGBColorSpace;
      if (pixel) { t.magFilter = T.NearestFilter; t.minFilter = T.LinearMipmapLinearFilter; }
      t.anisotropy = 4;
      return t;
    }
    function board(x, z, ry, list) {
      var g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
      [-1.7, 1.7].forEach(function (px) { var p = new T.Mesh(new T.BoxGeometry(.2, 3.8, .2), woodM); p.position.set(px, 1.9, 0); g.add(p); });
      var back = new T.Mesh(new T.BoxGeometry(3.8, 2.4, .12), mat('#5a3b2b')); back.position.set(0, 2.6, 0); g.add(back);
      var top = new T.Mesh(new T.BoxGeometry(4.4, .2, .7), roof2M); top.position.set(0, 3.9, 0); g.add(top);
      list.forEach(function (sk, k) {
        var w = 1.05, h = 1.55;
        var paper = new T.Mesh(new T.PlaneGeometry(w, h), mat('#efe4cc', { flatShading: false }));
        paper.position.set(-1.2 + k * 1.2, 2.6, .06); paper.rotation.z = (k - 1) * .05; g.add(paper);
      });
    }
    board(-7.2, 4.6, .9, [0, 1, 2]);
    board(7.4, 4.2, -.9, [0, 1, 2]);

    /* the crew as billboards */
    var people = [], shadowM = new T.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .35, depthWrite: false });
    CREW.forEach(function (c, i) {
      // each girl has her own corner of the village, spread all the way round
      var ang = Math.PI * .5 + .52 + i / CREW.length * Math.PI * 2, R = 11.2;
      var g = new T.Group(); g.position.set(Math.cos(ang) * R, 0, Math.sin(ang) * R); scene.add(g);
      var me = null;
      var t = tex(IMG + c.id + '.webp', c.pixel, function (im) { if (im && im.width) me.scale.x = c.h * im.width / im.height; });
      me = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: t, alphaTest: .45, side: T.DoubleSide, transparent: true }));
      me.scale.set(c.h * .55, c.h, 1); me.position.y = c.h / 2; me.userData.i = i; g.add(me);
      var sh = new T.Mesh(new T.CircleGeometry(.8, 20), shadowM); sh.rotation.x = -Math.PI / 2; sh.position.y = .04; sh.scale.set(1, .5, 1); g.add(sh);
      var ring = new T.Mesh(new T.RingGeometry(.9, 1.05, 32), new T.MeshBasicMaterial({ color: '#ffcf6b', transparent: true, opacity: 0, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = .06; g.add(ring);
      people.push({ g: g, me: me, ring: ring, c: c, phase: i * 1.7 });
    });

    /* petals */
    var PN = phone ? 160 : 360, pgeo = new T.BufferGeometry(), pp = new Float32Array(PN * 3), pv = [];
    for (var q = 0; q < PN; q++) { pp[q * 3] = (Math.random() - .5) * 40; pp[q * 3 + 1] = Math.random() * 14; pp[q * 3 + 2] = (Math.random() - .5) * 40; pv.push(Math.random() * .6 + .4); }
    pgeo.setAttribute('position', new T.BufferAttribute(pp, 3));
    var petals = new T.Points(pgeo, new T.PointsMaterial({ map: glowTex(T, 'rgba(255,190,210,1)'), color: '#ffc6d9', size: .32, transparent: true, depthWrite: false }));
    scene.add(petals);

    /* ------- interaction ------- */
    var spin = true, night = false, active = -1, dirty = true;
    var drag = null;
    canvas.addEventListener('pointerdown', function (e) {
      drag = { x: e.clientX, y: e.clientY, th: want.th, ph: want.ph, moved: 0, type: e.pointerType, id: e.pointerId };
      if (e.pointerType === 'mouse') canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!drag) { hover(e); return; }
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
      want.th = drag.th + dx * .006;
      if (drag.type === 'mouse') want.ph = XR.clamp(drag.ph - dy * .004, .75, 1.42);
      if (drag.moved > 6) setSpin(false);
    });
    function end(e) {
      if (drag && drag.moved < 6) pick(e);
      drag = null;
    }
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', function () { drag = null; });

    var ray = new T.Raycaster(), nd = new T.Vector2();
    function hit(e) {
      var r = canvas.getBoundingClientRect();
      nd.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(nd, camera);
      var hs = ray.intersectObjects(people.map(function (p) { return p.me; }));
      return hs.length ? hs[0].object.userData.i : -1;
    }
    function hover(e) { if (e.pointerType !== 'mouse') return; canvas.style.cursor = hit(e) > -1 ? 'pointer' : 'grab'; }
    function pick(e) { var i = hit(e); if (i > -1) focusOn(i); }
    function focusOn(i) {
      active = i;
      var p = people[i];
      // look outward from the square at her, so nothing stands between
      goal.set(p.g.position.x, 1.7, p.g.position.z);
      want.th = Math.atan2(-p.g.position.x, -p.g.position.z);
      want.th += Math.round((orbit.th - want.th) / (Math.PI * 2)) * Math.PI * 2;
      want.ph = 1.38;
      want.r = phone ? 8.5 : 6.2;
      if (phone) goal.y = 1.0;
      section.classList.add('is-focus');
      setSpin(false);
      fillCard(p.c);
    }
    if (card) $('.vl-x', card).addEventListener('click', function () { active = -1; goal.set(0, REST.y, 0); want.r = REST.r; want.ph = 1.2; section.classList.remove('is-focus'); });

    function setSpin(on) {
      spin = on;
      var b = $('[data-vl="spin"]', section);
      if (b) { b.setAttribute('aria-pressed', on); $('span', b).textContent = on ? 'Auto orbit' : 'Orbit paused'; }
    }
    $$('[data-vl]', section).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-vl');
        if (k === 'spin') setSpin(!spin);
        if (k === 'time') { night = !night; b.setAttribute('aria-pressed', night); $('span', b).textContent = night ? 'Dusk' : 'Night'; section.classList.toggle('is-night', night); }
        if (k === 'next') focusOn((active + 1) % people.length);
      });
    });

    /* ------- sizing + visibility ------- */
    function size() {
      var w = stage.clientWidth, h = stage.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    }
    size();
    window.addEventListener('resize', size);
    var visible = true;
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) loop(); }, { rootMargin: '100px' }).observe(stage);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) loop(); });

    /* ------- frame loop ------- */
    var clock = new T.Clock(), running = false, mix = 0;
    var cDusk = { top: new T.Color('#1b1238'), bot: new T.Color('#ff7a59'), hemi: new T.Color('#ffb38a') };
    var cNight = { top: new T.Color('#03040f'), bot: new T.Color('#1a2350'), hemi: new T.Color('#6f86ff') };
    function loop() { if (running) return; running = true; clock.getDelta(); requestAnimationFrame(frame); }
    function frame() {
      if (!visible || document.hidden) { running = false; return; }
      requestAnimationFrame(frame);
      var dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
      if (spin && !drag) want.th += dt * .08;
      var k8 = 1 - Math.pow(.92, dt * 60), k6 = 1 - Math.pow(.94, dt * 60);
      orbit.th += (want.th - orbit.th) * k8;
      orbit.ph += (want.ph - orbit.ph) * k8;
      orbit.r += (want.r - orbit.r) * k6;
      target.lerp(goal, k6);
      camera.position.set(target.x + Math.sin(orbit.th) * Math.sin(orbit.ph) * orbit.r, target.y + Math.cos(orbit.ph) * orbit.r, target.z + Math.cos(orbit.th) * Math.sin(orbit.ph) * orbit.r);
      camera.lookAt(target);

      mix += ((night ? 1 : 0) - mix) * (1 - Math.pow(.95, dt * 60));
      dome.material.uniforms.top.value.copy(cDusk.top).lerp(cNight.top, mix);
      dome.material.uniforms.bot.value.copy(cDusk.bot).lerp(cNight.bot, mix);
      scene.fog.color.copy(dome.material.uniforms.bot.value).lerp(dome.material.uniforms.top.value, .4);
      hemi.color.copy(cDusk.hemi).lerp(cNight.hemi, mix);
      hemi.intensity = 1.25 - mix * .75;
      sun.intensity = 1.6 * (1 - mix) + .25;
      stars.material.opacity = .25 + mix * .75;
      lanterns.forEach(function (l, i) { l.intensity = (6 + mix * 10) * (0.9 + Math.sin(t * 7 + i * 2) * .06 + Math.sin(t * 13 + i) * .04); });
      windows.forEach(function (w, i) { w.material.color.setRGB(1, .55 + mix * .15 + Math.sin(t * 2 + i) * .03, .25); });

      people.forEach(function (p, i) {
        p.me.rotation.y = Math.atan2(camera.position.x - p.g.position.x, camera.position.z - p.g.position.z);
        p.me.position.y = p.c.h / 2 + Math.sin(t * 1.6 + p.phase) * .06;
        p.ring.material.opacity += ((i === active ? .9 : 0) - p.ring.material.opacity) * .1;
        p.ring.scale.setScalar(1 + Math.sin(t * 3) * .05);
        var op = active < 0 || i === active ? 1 : .12;
        p.me.material.opacity += (op - p.me.material.opacity) * k6;
        p.me.material.depthWrite = p.me.material.opacity > .9;
      });

      var a = pgeo.attributes.position.array;
      for (var k = 0; k < PN; k++) {
        a[k * 3 + 1] -= dt * pv[k] * 1.1;
        a[k * 3] += Math.sin(t + k) * dt * .6 + dt * .5;
        if (a[k * 3 + 1] < 0) { a[k * 3 + 1] = 14; a[k * 3] = (Math.random() - .5) * 40; a[k * 3 + 2] = (Math.random() - .5) * 40; }
      }
      pgeo.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
      if (dirty) { dirty = false; section.classList.add('is-live'); }
    }
    loop();
  }

  function glowTex(T, col) {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  }
})();
