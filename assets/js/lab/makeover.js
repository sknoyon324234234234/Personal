/* Lab stage 08 — site makeovers: drag a brush line between the old site and the rebuild */
(function () {
  'use strict';
  var XR = window.XR, LAB = window.LAB;

  /* m: [before, after] for load (s), weight (MB), Lighthouse, requests */
  var SITES = [
    { url: 'sakurabistro.com', img: 'assets/img/demos/sakura-bistro.jpg', alt: 'The rebuilt Sakura Bistro homepage', href: 'demos/sakura-bistro.html', old: 'a',
      m: [[7.8, 0.9], [6.4, 0.42], [34, 99], [118, 14]] },
    { url: 'moritea.shop', img: 'assets/img/demos/mori-tea.jpg', alt: 'The rebuilt Mori Tea homepage', href: 'demos/mori-tea.html', old: 'b',
      m: [[6.1, 1.1], [4.9, 0.51], [41, 97], [96, 18]] },
    { url: 'nordhem.dk', img: 'assets/img/demos/nordhem.jpg', alt: 'The rebuilt Nordhem homepage', href: 'demos/nordhem.html', old: 'c',
      m: [[9.2, 1.3], [11.2, 0.69], [27, 96], [164, 22]] }
  ];

  function rep(n, html) { return new Array(n + 1).join(html); }
  var OLD = {
    a: '<div class="mk-old ob-a">' +
      '<div class="ob-top"><b class="ob-logo">Sakura Bistro<small>Japanese Restaurant &amp; Take Away</small></b><span class="ob-call">CALL NOW: 01711-000000</span></div>' +
      '<div class="ob-marq"><span>*** GRAND RE-OPENING *** 20% OFF ALL SUSHI THIS WEEK *** FREE HOME DELIVERY (CONDITIONS APPLY) *** NOW ACCEPTING BKASH ***</span></div>' +
      '<div class="ob-body"><ul class="ob-nav"><li class="ob-u">Home</li><li class="ob-u">About Us</li><li class="ob-u">Our Menu</li><li class="ob-u">Photo Gallery</li><li class="ob-u">Special Offers</li><li class="ob-u">Contact Us</li><li class="ob-u">Guestbook</li></ul>' +
      '<div class="ob-main"><h1>Welcome to Our Website!!!</h1><p>Sakura Bistro is the best Japanese restaurant in the town since 2009. We serve Sushi, Ramen, Tempura, Chinese, Thai and Indian food at a reasonable price. Please see our menu below and Like our Facebook page!!</p>' +
      '<div class="ob-imgs"><span>IMG_2231.JPG</span><span>IMG_2232.JPG</span><span>IMG_2240.JPG</span></div><p class="ob-dl">&gt;&gt; Click here to download our Menu (PDF, 14 MB) &lt;&lt;</p></div>' +
      '<div class="ob-side"><b>Opening Hours</b><p>Sat–Thu 12pm–11pm<br>Friday CLOSED</p><b>Visitors</b><p><span class="ob-count">004213</span></p></div></div>' +
      '<div class="ob-foot">© 2016 Sakura Bistro. All Rights Reserved. | Best viewed in Internet Explorer at 1024×768 | Powered by FreeSiteBuilder</div></div>',
    b: '<div class="mk-old ob-b">' +
      '<div class="ob-util"><span>Login</span><span>Register</span><span>My Cart (0)</span><span>Track Order</span></div>' +
      '<div class="ob-top"><b class="ob-logo">Mori Tea</b><div class="ob-menu"><span>Home</span><span>Shop</span><span>Green Tea</span><span>Black Tea</span><span>Offers</span><span>Blog</span><span>About</span><span>FAQ</span><span>Contact</span></div></div>' +
      '<div class="ob-slide"><b>WELCOME TO MORI TEA<br>ONLINE SHOP</b><span class="ob-arr l">&lsaquo;</span><span class="ob-arr r">&rsaquo;</span><span class="ob-dots"><i></i><i></i><i></i><i></i><i></i></span></div>' +
      '<div class="ob-row"><div><i></i>Green Tea 100g<br>Tk 450<br><em>Add to Cart</em></div><div><i></i>Matcha 30g<br>Tk 1,200<br><em>Add to Cart</em></div><div><i></i>Sencha Gift Box<br>Tk 2,300<br><em>Add to Cart</em></div><div><i></i>Hojicha 100g<br>Tk 520<br><em>Add to Cart</em></div></div>' +
      '<div class="ob-pop"><div><i>&times;</i><b>SUBSCRIBE TO OUR NEWSLETTER!!</b><p>Get 5% OFF your first order. Don’t miss our offers!!!</p><span>Enter your email</span> <em>SUBMIT</em></div></div></div>',
    c: '<div class="mk-old ob-c">' +
      '<div class="ob-top"><b class="ob-logo">NORDHEM FURNITURE</b><div class="ob-menu"><span>Home</span><span>Living Room</span><span>Bedroom</span><span>Dining</span><span>Office</span><span>Outdoor</span><span>Sale</span><span>Pages</span><span>Contact</span></div></div>' +
      '<div class="ob-hero"><div class="ob-wm">' + rep(14, '<span>STOCK PHOTO</span>') + '</div><b>Quality Furniture For Your Home</b><em>READ MORE</em><i class="l"></i><i class="r"></i><small>1 / 7</small></div>' +
      '<div class="ob-cols"><div><i></i><b>Quality</b><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do.</p></div><div><i></i><b>Fast Delivery</b><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do.</p></div><div><i></i><b>24/7 Support</b><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do.</p></div></div>' +
      '<div class="ob-chat">Chat with us!</div>' +
      '<div class="ob-cookie">This website uses cookies to ensure you get the best experience on our website. <em>Got it!</em></div></div>'
  };

  function fmt(k, v) {
    if (k === 0) return v.toFixed(1) + ' s';
    if (k === 1) return v < 1 ? Math.round(v * 1000) + ' KB' : v.toFixed(1) + ' MB';
    return String(Math.round(v));
  }

  LAB.register('makeover', function (stage) {
    var view = XR.$('.mk-view', stage), before = XR.$('.mk-before', stage), img = XR.$('.mk-after img', stage), handle = XR.$('.mk-handle', stage);
    var tabs = XR.$$('[role="tab"]', stage), url = XR.$('.mk-url span', stage), open = XR.$('.mk-open', stage), ms = XR.$$('.mk-m', stage);
    var cur = 0, x = 50, drag = false, raf = 0, hint = 0;

    function paint() {
      raf = 0;
      view.style.setProperty('--x', x.toFixed(2));
      var t = 1 - x / 100, m = SITES[cur].m;
      ms.forEach(function (el, k) {
        var a = m[k][0], v = a + (m[k][1] - a) * t;
        el.querySelector('b').textContent = fmt(k, v);
        el.style.setProperty('--c', 'hsl(' + Math.round(6 + 124 * t) + ', 50%, ' + Math.round(40 - 8 * t) + '%)');
        el.style.setProperty('--p', (k === 2 ? v / 100 : v / a).toFixed(3));
      });
      handle.setAttribute('aria-valuenow', Math.round(x));
      handle.setAttribute('aria-valuetext', Math.round(100 - x) + '% of the rebuild showing');
      view.classList.toggle('hide-b', x < 14);
      view.classList.toggle('hide-a', x > 86);
    }
    function set(v) { x = XR.clamp(v, 0, 100); if (!raf) raf = requestAnimationFrame(paint); }

    function pick(i, focus) {
      var s = SITES[i];
      cur = i;
      tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; });
      if (focus) tabs[i].focus();
      before.innerHTML = OLD[s.old];
      img.src = s.img; img.alt = s.alt;
      url.textContent = s.url;
      open.href = s.href;
      view.classList.remove('is-swap'); void view.offsetWidth; view.classList.add('is-swap');
      set(x);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { if (i !== cur) pick(i); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        pick((cur + d + tabs.length) % tabs.length, true);
      });
    });

    /* drag anywhere on the picture; vertical swipes still scroll the page */
    function at(e) { var r = view.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 100; }
    view.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      stopHint();
      drag = true;
      view.classList.add('is-drag');
      try { view.setPointerCapture(e.pointerId); } catch (err) {}
      set(at(e));
    });
    view.addEventListener('pointermove', function (e) { if (drag) set(at(e)); });
    function end() { drag = false; view.classList.remove('is-drag'); }
    view.addEventListener('pointerup', end);
    view.addEventListener('pointercancel', end);
    handle.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 10 : 4, map = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step, PageDown: -20, PageUp: 20 };
      if (e.key !== 'Home' && e.key !== 'End' && !map[e.key]) return;
      e.preventDefault(); stopHint();
      set(e.key === 'Home' ? 0 : e.key === 'End' ? 100 : x + map[e.key]);
    });

    /* one slow sweep the first time the frame is on screen, so it reads as draggable */
    function stopHint() { if (hint) { cancelAnimationFrame(hint); hint = 0; } }
    function sweep() {
      var t0 = 0, keys = [50, 78, 24, 50], dur = 2600;
      hint = requestAnimationFrame(function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur), seg = Math.min(2, Math.floor(p * 3)), f = p * 3 - seg, e = f < .5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
        set(keys[seg] + (keys[seg + 1] - keys[seg]) * e);
        hint = p < 1 ? requestAnimationFrame(step) : 0;
      });
    }
    if (!XR.reduce && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        io.disconnect();
        setTimeout(sweep, 500);
      }, { threshold: .6 });
      io.observe(view);
    }
    /* warm the other two rebuilds once someone starts playing */
    stage.addEventListener('pointerenter', function () { SITES.forEach(function (s) { new Image().src = s.img; }); }, { once: true });

    pick(0);
  });
})();
