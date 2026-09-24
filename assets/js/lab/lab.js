/* XIRAIYA — The Lab: shared helpers, lazy stage init and scrollspy */
(function () {
  'use strict';
  var XR = window.XR;
  var stages = {};

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var a = typeof seed === 'number' ? seed : hash(String(seed));
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function now() {
    var d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function stamp() {
    var d = new Date();
    return now() + ':' + String(d.getSeconds()).padStart(2, '0');
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  window.LAB = {
    register: function (name, fn) { stages[name] = fn; },
    qr: XR.qr, rng: rng, hash: hash, now: now, stamp: stamp, sleep: sleep
  };

  document.addEventListener('DOMContentLoaded', function () {
    // lazy-init every stage shortly before it scrolls into view
    XR.$$('[data-stage]').forEach(function (el) {
      var name = el.getAttribute('data-stage');
      XR.whenVisible(el, function () {
        if (stages[name]) {
          try { stages[name](el); } catch (e) { console.error('[lab] stage ' + name + ' failed', e); }
        }
      }, '400px');
    });

    // scrollspy for the chapter nav
    var links = XR.$$('.lab-nav-inner a');
    var secs = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
    var bar = document.querySelector('.lab-nav-bar i');
    var navInner = document.querySelector('.lab-nav-inner');
    var current = -1, ticking = false;
    function spy() {
      ticking = false;
      var mid = innerHeight * .35, idx = -1;
      secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= mid) idx = i; });
      if (idx !== current) {
        current = idx;
        links.forEach(function (a, i) { a.classList.toggle('is-on', i === idx); });
        if (idx >= 0 && navInner) {
          var a = links[idx];
          navInner.scrollTo({ left: a.offsetLeft - navInner.clientWidth / 2 + a.offsetWidth / 2, behavior: XR.reduce ? 'auto' : 'smooth' });
        }
      }
      if (bar && secs[0]) {
        var first = secs[0].getBoundingClientRect().top + scrollY;
        var last = secs[secs.length - 1];
        var end = last.getBoundingClientRect().bottom + scrollY - innerHeight;
        var p = XR.clamp((scrollY - first + 120) / Math.max(1, end - first), 0, 1);
        bar.parentElement.style.setProperty('--p', p.toFixed(4));
      }
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
    spy();
  });
})();
