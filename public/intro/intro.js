/*!
 * Yusif & Fatma — kinematik giriş v2 (fotolarla)
 * Web Animations API + SVG + Canvas (kitabxana yoxdur, video deyil).
 * <head>-də sinxron yüklənməlidir:  <script src="intro/intro.js"></script>
 * Fotolar saytın öz "photos/2/..." qovluğundan götürülür (yollar səhifəyə nisbətən).
 */
(function () {
  'use strict';

  var CFG = {
    once: true,    // ilk nümayişdən sonra bu brauzerdə yenidən göstərmə
    fontUrl: 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap',
    fontTimeout: 1800,
    photoTimeout: 2600,
    /* Ürəyin içində açılan 3 foto (fy = üzlərin şəkildəki şaquli mövqeyi, 0–1) */
    hero: [
      { s: 'photos/2/(1) 9O9A8181.webp', fy: 0.30 },
      { s: 'photos/2/(1) 9O9A8338.webp', fy: 0.30 },
      { s: 'photos/2/(1) 9O9A8392.webp', fy: 0.33 }
    ],
    /* Fonda süzülən "xatirə" kadrları */
    floats: [
      'photos/2/(1) 9O9A8132.webp', 'photos/2/(1) 9O9A8164.webp', 'photos/2/(1) 9O9A8138.webp',
      'photos/2/(1) 9O9A8205.webp', 'photos/2/(1) 9O9A8228.webp', 'photos/2/(1) 9O9A8030.webp',
      'photos/2/(1) 9O9A8297.webp', 'photos/2/(1) 9O9A8373.webp', 'photos/2/(1) 9O9A8288.webp'
    ]
  };

  var root = document.documentElement;
  var introWasSeen = false;
  try { introWasSeen = localStorage.getItem('yf-cinematic-intro-v2-seen') === '1'; } catch (e) {
    try { introWasSeen = sessionStorage.getItem('yf-intro') === '1'; } catch (_) {}
  }
  if (CFG.once && introWasSeen) return;

  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  root.classList.add('yf-intro-on');

  /* ── Vaxt cədvəli (ms) ── */
  var T = {
    names: 400, namesDur: 1900,
    spark: 2200,
    swash: 2250, swashDur: 600,
    heart: 2700, heartDur: 1500,
    photo: 4150, photoDur: 1000,
    namesLight: 4300,
    glow: 4150,
    beat: 4600,
    ring: 4750,
    petals: 4850,
    photoB: 5300, photoBDur: 800,
    portal: 5800, portalDur: 1300,
    photoC: 6000, photoCDur: 700,
    portalGlow: 6000,
    full: 6300, fullDur: 700,
    reveal: 6600, revealDur: 1500,
    fade: 6700, fadeDur: 1000
  };
  var EASE_OUT = 'cubic-bezier(.16,.84,.3,1)';
  var EASE_IO  = 'cubic-bezier(.45,.02,.2,1)';
  var EASE_IN  = 'cubic-bezier(.55,.05,.7,.3)';

  var HEART_L = 'M500,600 C340,486 118,372 118,236 C118,132 198,72 288,72 C384,72 458,128 500,206';
  var HEART_R = 'M500,600 C660,486 882,372 882,236 C882,132 802,72 712,72 C616,72 542,128 500,206';
  var HEART_FULL = 'M500,600 C340,486 118,372 118,236 C118,132 198,72 288,72 C384,72 458,128 500,206 C542,128 616,72 712,72 C802,72 882,132 882,236 C882,372 660,486 500,600Z';
  var CX = 500, CY = 336;

  /* ── Fotoların öncədən yüklənməsi (skript işə düşən kimi başlayır) ── */
  var store = {};
  function loadImg(src) {
    return new Promise(function (res) {
      var im = new Image();
      im.decoding = 'async';
      im.onload = function () {
        (im.decode ? im.decode() : Promise.resolve()).catch(function () {}).then(function () {
          store[src] = { ok: true, img: im }; res(true);
        });
      };
      im.onerror = function () { store[src] = { ok: false }; res(false); };
      im.src = encodeURI(src);
    });
  }
  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  var photosReady = Promise.resolve();
  {
    var first = loadImg(CFG.hero[0].s);
    var rest = CFG.hero.slice(1).map(function (h) { return loadImg(h.s); });
    var fl = CFG.floats.map(loadImg);
    photosReady = Promise.race([
      Promise.all([first, Promise.race([Promise.all(fl.concat(rest)), delay(1700)])]),
      delay(CFG.photoTimeout)
    ]);
  }
  function loaded(s) { return store[s] && store[s].ok; }

  var overlay, svg, canvas, ctx, anims = [], rafId = 0, t0 = 0;
  var revealed = false, ending = false, failsafe;
  var swashNodes = [], heartNodes = [], headL, headR, pathHL, pathHR, pathSL, pathSR;
  var particles = [], bokeh = [], W = 0, H = 0, dpr = 1, lastTs = 0;
  var heroImgs = [], heroUsed = [];

  /* ── Yardımçılar ── */
  var NS = 'http://www.w3.org/2000/svg', XL = 'http://www.w3.org/1999/xlink';
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function A(node, frames, opts) {
    opts.fill = opts.fill || 'both';
    var a = node.animate(frames, opts);
    anims.push(a);
    return a;
  }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function easeSine(p) { return -(Math.cos(Math.PI * p) - 1) / 2; }
  function now() { return document.timeline ? document.timeline.currentTime : performance.now(); }
  function rand(seed) { var s = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

  /* ── Sayta keçid ── */
  function reveal(fast) {
    if (revealed) return;
    revealed = true;
    var main = document.querySelector('main') || document.body;
    main.removeAttribute('inert');
    root.classList.remove('yf-intro-on');
    if (main.animate) {
      main.animate(
        reduce ? [{ opacity: 0 }, { opacity: 1 }]
               : [{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }],
        { duration: reduce ? 700 : (fast ? 900 : T.revealDur), easing: 'cubic-bezier(.22,.7,.2,1)', fill: 'backwards' }
      );
    }
  }

  function cleanup() {
    cancelAnimationFrame(rafId);
    anims.forEach(function (a) { try { a.cancel(); } catch (e) {} });
    anims = [];
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    window.removeEventListener('resize', resize);
    document.removeEventListener('keydown', onKey);
    root.classList.remove('yf-intro-on');
    clearTimeout(failsafe);
    if (CFG.once) {
      try { localStorage.setItem('yf-cinematic-intro-v2-seen', '1'); } catch (e) {
        try { sessionStorage.setItem('yf-intro', '1'); } catch (_) {}
      }
    }
  }

  function skip() {
    if (ending) return;
    ending = true;
    var o = overlay ? parseFloat(getComputedStyle(overlay).opacity) : 1;
    anims.forEach(function (a) { try { a.cancel(); } catch (e) {} });
    anims = [];
    cancelAnimationFrame(rafId);
    reveal(true);
    if (!overlay || !overlay.animate) { cleanup(); return; }
    overlay.style.pointerEvents = 'none';
    overlay.animate([{ opacity: isNaN(o) ? 1 : o }, { opacity: 0 }], { duration: 650, easing: 'ease', fill: 'forwards' })
      .finished.then(cleanup, cleanup);
  }
  function onKey(e) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      if (e.target && e.target.id === 'yf-skip' && e.key !== 'Escape') return;
      skip();
    }
  }

  /* ── Şrift ── */
  function loadFont() {
    if (!CFG.fontUrl) return Promise.resolve();
    var sheet = new Promise(function (res) {
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = CFG.fontUrl;
      l.onload = res; l.onerror = res;
      document.head.appendChild(l);
    }).then(function () {
      return document.fonts && document.fonts.load ? document.fonts.load('128px "Great Vibes"', 'Yusif Fatma') : null;
    }).catch(function () {});
    return Promise.race([sheet, delay(CFG.fontTimeout)]);
  }

  /* ── Səhnənin qurulması (animasiya yoxdur) ── */
  function build() {
    overlay = document.createElement('div');
    overlay.id = 'yf-intro';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Yusif və Fatmanın giriş animasiyası');
    overlay.innerHTML =
      '<div class="yf-bg"></div><i class="yf-glow"></i><i class="yf-light"></i>' +
      '<div class="yf-floats" aria-hidden="true"></div>' +
      '<canvas class="yf-dust" aria-hidden="true"></canvas>' +
      '<svg class="yf-scene" viewBox="80 40 840 600" aria-hidden="true" focusable="false">' +
      '<defs>' +
        '<clipPath id="yf-clip"><path d="' + HEART_FULL + '"/></clipPath>' +
        '<linearGradient id="yf-g-stroke" gradientUnits="userSpaceOnUse" x1="0" y1="72" x2="0" y2="600">' +
          '<stop offset="0" stop-color="#eba9a8"/><stop offset=".48" stop-color="#e7c488"/><stop offset="1" stop-color="#c8964f"/></linearGradient>' +
        '<linearGradient id="yf-g-name" gradientUnits="userSpaceOnUse" x1="180" y1="0" x2="820" y2="0">' +
          '<stop offset="0" stop-color="#9a6c3a"/><stop offset=".5" stop-color="#c99d5d"/><stop offset="1" stop-color="#9a6c3a"/></linearGradient>' +
        '<linearGradient id="yf-g-trl"><stop offset="0" stop-color="#d9b56e" stop-opacity="0"/><stop offset="1" stop-color="#e3b97a" stop-opacity=".95"/></linearGradient>' +
        '<linearGradient id="yf-g-trr"><stop offset="0" stop-color="#e3b97a" stop-opacity=".95"/><stop offset="1" stop-color="#d9b56e" stop-opacity="0"/></linearGradient>' +
        '<radialGradient id="yf-g-bloom"><stop offset="0" stop-color="#fff6dc" stop-opacity=".95"/><stop offset=".4" stop-color="#f6cfa0" stop-opacity=".45"/><stop offset="1" stop-color="#f6cfa0" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="yf-g-halo"><stop offset="0" stop-color="#ffd9d4" stop-opacity=".8"/><stop offset=".6" stop-color="#f7c3bd" stop-opacity=".3"/><stop offset="1" stop-color="#f7c3bd" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="yf-g-scrim"><stop offset="0" stop-color="#2a1a10" stop-opacity=".5"/><stop offset=".65" stop-color="#2a1a10" stop-opacity=".2"/><stop offset="1" stop-color="#2a1a10" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="yf-g-petal" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#ffe9e6"/><stop offset=".6" stop-color="#f1b0b3"/><stop offset="1" stop-color="#df8e98"/></radialGradient>' +
      '</defs>' +
      '<circle class="yf-halo" cx="' + CX + '" cy="' + CY + '" r="330" fill="url(#yf-g-halo)" opacity="0"/>' +
      '<g class="yf-rings"></g>' +
      '<g class="yf-hw">' +
        '<g class="yf-photos" clip-path="url(#yf-clip)"><g class="yf-imgs"></g>' +
        '<ellipse class="yf-scrim" cx="500" cy="352" rx="400" ry="170" fill="url(#yf-g-scrim)" opacity="0"/></g>' +
        '<g class="yf-heart"></g>' +
      '</g>' +
      '<g class="yf-swash"></g>' +
      '<g class="yf-names"></g>' +
      '<text class="yf-tag" x="500" y="426" text-anchor="middle" fill="#fff8ea" opacity="0">BİR ÖMÜR BİRLİKDƏ</text>' +
      '<g class="yf-petals"></g>' +
      '<g class="yf-spark"><circle class="yf-bloom" cx="500" cy="338" r="80" fill="url(#yf-g-bloom)" opacity="0"/></g>' +
      '<g class="yf-heads" opacity="0">' +
        '<circle class="yf-hl" r="16" fill="url(#yf-g-bloom)"/><circle class="yf-hr" r="16" fill="url(#yf-g-bloom)"/>' +
        '<circle class="yf-hl2" r="3" fill="#fff8e6"/><circle class="yf-hr2" r="3" fill="#fff8e6"/>' +
      '</g></svg>' +
      '<div class="yf-full" aria-hidden="true"><img alt="" draggable="false"></div>' +
      '<i class="yf-portal"></i>' +
      '<button class="yf-skip" id="yf-skip" type="button" aria-label="Girişi keç">Keç</button>';

    document.body.insertBefore(overlay, document.body.firstChild);
    svg = overlay.querySelector('.yf-scene');
    var main = document.querySelector('main');
    if (main) main.setAttribute('inert', '');
    var skipButton = overlay.querySelector('#yf-skip');
    skipButton.addEventListener('click', skip);
    skipButton.focus();
    document.addEventListener('keydown', onKey);

    /* Ürək qatları: parıltı (enli, şəffaf) → nüvə */
    var heart = svg.querySelector('.yf-heart');
    var layers = [[22, .06], [11, .13], [5, .26], [2.6, 1]];
    [HEART_L, HEART_R].forEach(function (d, side) {
      layers.forEach(function (ly, i) {
        var p = el('path', {
          d: d, fill: 'none', stroke: 'url(#yf-g-stroke)', 'stroke-width': ly[0], 'stroke-opacity': ly[1],
          'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1,
          'stroke-dasharray': '1 1', 'stroke-dashoffset': 1, 'class': 'yf-draw'
        }, heart);
        heartNodes.push(p);
        if (i === layers.length - 1) { if (side === 0) pathHL = p; else pathHR = p; }
      });
    });

    /* Hərflərdən süzülən işıq izi */
    var sw = svg.querySelector('.yf-swash');
    var SL = 'M478,358 C480,420 496,510 500,598', SR = 'M522,358 C520,420 504,510 500,598';
    [SL, SR].forEach(function (d, side) {
      var p = el('path', {
        d: d, fill: 'none', stroke: 'url(#yf-g-stroke)', 'stroke-width': 1.8, 'stroke-linecap': 'round',
        pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1, 'class': 'yf-draw'
      }, sw);
      swashNodes.push(p);
      if (side === 0) pathSL = p; else pathSR = p;
    });

    headL = [svg.querySelector('.yf-hl'), svg.querySelector('.yf-hl2')];
    headR = [svg.querySelector('.yf-hr'), svg.querySelector('.yf-hr2')];

    buildDust();
  }

  /* ── Adlar ── */
  function buildNames() {
    var g = svg.querySelector('.yf-names');
    g.innerHTML = '';
    var probe = el('text', { 'class': 'yf-name', 'font-size': 128, x: 0, y: 0, visibility: 'hidden' }, svg);
    probe.textContent = 'Yusif'; var w1 = probe.getBBox().width;
    probe.textContent = 'Fatma'; var w2 = probe.getBBox().width;
    svg.removeChild(probe);

    var gap = 46, fs = 128 * Math.min(1, 560 / (w1 + w2 + gap)), k = fs / 128;
    w1 *= k; w2 *= k;
    var base = 338, lx = CX - gap / 2, rx = CX + gap / 2;
    var streakY = base - fs * 0.26;

    function mkName(text, x, anchor, extra) {
      var a = { 'class': 'yf-name', x: x, y: base, 'font-size': fs, 'text-anchor': anchor };
      for (var q in extra) a[q] = extra[q];
      var t = el('text', a);
      t.textContent = text;
      return t;
    }
    var defs = [
      { text: 'Yusif', x: lx, anchor: 'end',   dir: -1, trail: 'yf-g-trl', tx: lx - w1 - 330 },
      { text: 'Fatma', x: rx, anchor: 'start', dir:  1, trail: 'yf-g-trr', tx: rx + w2 + 12 }
    ];
    defs.forEach(function (d) {
      var tr = el('g', {}, g);
      el('rect', { x: d.tx, y: streakY, width: 318, height: 1.6, rx: .8, fill: 'url(#' + d.trail + ')' }, tr);
      var ghost2 = el('g', { opacity: 0 }, g); ghost2.appendChild(mkName(d.text, d.x, d.anchor, { fill: 'url(#yf-g-name)' }));
      var ghost1 = el('g', { opacity: 0 }, g); ghost1.appendChild(mkName(d.text, d.x, d.anchor, { fill: 'url(#yf-g-name)' }));
      var main = el('g', { opacity: 0 }, g);
      /* qatlar: yumşaq kölgə → qızılı (əsas) → fil sümüyü (foto üzərində) */
      var shade = mkName(d.text, d.x, d.anchor, { fill: 'none', stroke: 'rgba(30,18,10,.42)', 'stroke-width': 7, 'stroke-linejoin': 'round', opacity: 0 });
      var gold  = mkName(d.text, d.x, d.anchor, { fill: 'url(#yf-g-name)' });
      var ivory = mkName(d.text, d.x, d.anchor, { fill: '#fffaf1', opacity: 0 });
      main.appendChild(shade); main.appendChild(gold); main.appendChild(ivory);
      var from = d.dir * 640;

      if (reduce) {
        main.setAttribute('opacity', 1); gold.setAttribute('opacity', 0);
        ivory.setAttribute('opacity', 1); shade.setAttribute('opacity', 1); tr.setAttribute('opacity', 0);
        return;
      }

      var mv = function (n, dl, peak, blur) {
        var frames = [
          { transform: 'translateX(' + from + 'px)', opacity: 0, filter: blur ? 'blur(9px)' : 'none' },
          { opacity: peak, offset: .32 },
          { transform: 'translateX(0px)', opacity: peak === 1 ? 1 : 0, filter: 'blur(0px)' }
        ];
        A(n, frames, { delay: T.names + dl, duration: T.namesDur, easing: EASE_OUT });
      };
      mv(main, 0, 1, true);
      mv(ghost1, 70, .26, false);
      mv(ghost2, 150, .13, false);
      A(tr, [
        { transform: 'translateX(' + from + 'px)', opacity: 0 },
        { opacity: .85, offset: .4 },
        { transform: 'translateX(0px)', opacity: 0 }
      ], { delay: T.names, duration: T.namesDur + 200, easing: EASE_OUT });

      /* foto açılanda adlar qızılıdan fil sümüyünə keçir */
      if (heroUsed.length) {
        A(gold,  [{ opacity: 1 }, { opacity: 0 }], { delay: T.namesLight, duration: 700, easing: 'ease-in-out', fill: 'forwards' });
        A(ivory, [{ opacity: 0 }, { opacity: 1 }], { delay: T.namesLight, duration: 700, easing: 'ease-in-out', fill: 'forwards' });
        A(shade, [{ opacity: 0 }, { opacity: 1 }], { delay: T.namesLight, duration: 700, easing: 'ease-in-out', fill: 'forwards' });
      }
    });

    if (!reduce) {
      A(g, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.07)' }],
        { delay: T.portal, duration: 900, easing: 'ease-in', fill: 'forwards' });
      g.style.transformOrigin = CX + 'px ' + CY + 'px';
    }

    /* şüar (posterdəki yazı) */
    var tag = svg.querySelector('.yf-tag');
    tag.style.fontFamily = 'Georgia, "Times New Roman", serif';
    tag.style.fontSize = '22px';
    tag.style.letterSpacing = '.42em';
    tag.style.paintOrder = 'stroke';
    tag.style.stroke = 'rgba(28,16,8,.6)';
    tag.style.strokeWidth = '5px';
    tag.style.strokeLinejoin = 'round';
    if (reduce) { if (heroUsed.length) tag.setAttribute('opacity', .9); }
    else if (heroUsed.length) {
      A(tag, [{ opacity: 0 }, { opacity: .92, offset: .4 }, { opacity: .92 }], { delay: T.photo + 450, duration: 1500, easing: 'ease-out', fill: 'forwards' });
      A(tag, [{ opacity: .92 }, { opacity: 0 }], { delay: T.portal, duration: 600, easing: 'ease-in', fill: 'forwards' });
    }
  }

  /* ── Ürəyin içindəki fotolar ── */
  function buildHero() {
    var box = svg.querySelector('.yf-imgs');
    box.innerHTML = '';
    heroImgs = []; heroUsed = [];
    CFG.hero.forEach(function (h) {
      if (!loaded(h.s)) return;
      var im0 = store[h.s].img, a = im0.naturalWidth / im0.naturalHeight;
      var w = Math.max(764 * 1.1, 528 * 1.1 * a), hh = w / a;
      var x = 500 - w / 2;
      var y = Math.min(72, Math.max(600 - hh, CY - h.fy * hh));
      var im = el('image', { x: x, y: y, width: w, height: hh, preserveAspectRatio: 'none', opacity: 0 }, box);
      var u = encodeURI(h.s);
      im.setAttribute('href', u); im.setAttributeNS(XL, 'xlink:href', u);
      im.style.transformOrigin = CX + 'px ' + CY + 'px';
      heroImgs.push(im); heroUsed.push(h);
    });
    var full = overlay.querySelector('.yf-full img');
    var last = heroUsed[heroUsed.length - 1];
    if (last) { full.src = encodeURI(last.s); full.style.objectPosition = '50% ' + Math.round(last.fy * 100) + '%'; }
  }

  /* ── Süzülən xatirə kadrları ── */
  function buildFloats() {
    var wrap = overlay.querySelector('.yf-floats');
    var list = CFG.floats.filter(loaded);
    var xs = [4, 83, 14, 91, 24, 72, 8, 96, 19];
    var sizes = ['clamp(84px,11.5vw,170px)', 'clamp(66px,8.8vw,130px)', 'clamp(52px,6.8vw,100px)'];
    list.forEach(function (s, i) {
      var depth = i % 3;
      var card = document.createElement('div');
      card.className = 'yf-polaroid';
      card.style.left = xs[i % xs.length] + '%';
      card.style.width = sizes[depth];
      if (depth) card.style.filter = 'blur(' + (depth * 1.3) + 'px)';
      var im = document.createElement('img');
      im.alt = ''; im.draggable = false; im.src = encodeURI(s);
      card.appendChild(im);
      wrap.appendChild(card);
      if (reduce) { card.style.display = 'none'; return; }
      var r0 = (rand(i + 90) - .5) * 24, r1 = r0 + (rand(i + 95) - .5) * 18;
      var peak = depth === 0 ? .62 : depth === 1 ? .5 : .38;
      A(card, [
        { transform: 'translateY(112vh) rotate(' + r0 + 'deg)', opacity: 0 },
        { opacity: peak, offset: .18 },
        { opacity: peak, offset: .78 },
        { transform: 'translateY(-48vh) rotate(' + r1 + 'deg)', opacity: 0 }
      ], { delay: 250 + i * 270, duration: 4300 + depth * 500, easing: 'cubic-bezier(.3,.1,.5,.95)' });
    });
    if (!reduce) A(wrap, [{ opacity: 1 }, { opacity: 0 }], { delay: T.portal - 200, duration: 900, easing: 'ease-in', fill: 'forwards' });
  }

  /* ── Gül ləçəkləri ── */
  function buildPetals() {
    var g = svg.querySelector('.yf-petals');
    var N = 12;
    for (var i = 0; i < N; i++) {
      var side = i % 2 ? 1 : -1;
      var x0 = CX + side * (130 + rand(i + 1) * 250);
      var y0 = 92 + rand(i + 11) * 190;
      var dx = side * (50 + rand(i + 21) * 160);
      var dy = 150 + rand(i + 31) * 260;
      var rot = (rand(i + 41) > .5 ? 1 : -1) * (130 + rand(i + 51) * 170);
      var sc = .75 + rand(i + 61) * .6;
      var holder = el('g', { transform: 'translate(' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ')' }, g);
      var p = el('path', { d: 'M0,-17 C13,-13 15,5 2,19 C-13,7 -12,-11 0,-17Z', fill: 'url(#yf-g-petal)', opacity: 0 }, holder);
      p.style.transformBox = 'fill-box';
      p.style.transformOrigin = 'center';
      if (reduce) continue;
      A(p, [
        { transform: 'translate(0px,0px) rotate(0deg) scale(' + (sc * .4) + ')', opacity: 0 },
        { transform: 'translate(' + (dx * .12) + 'px,' + (dy * .12) + 'px) rotate(' + (rot * .15) + 'deg) scale(' + sc + ')', opacity: .92, offset: .16 },
        { transform: 'translate(' + (dx * .62 + side * 14) + 'px,' + (dy * .55) + 'px) rotate(' + (rot * .6) + 'deg) scale(' + sc + ')', opacity: .85, offset: .6 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + rot + 'deg) scale(' + (sc * .9) + ')', opacity: 0 }
      ], { delay: T.petals + i * 105, duration: 2400 + rand(i + 71) * 600, easing: 'cubic-bezier(.3,.1,.4,1)' });
    }
  }

  /* ── Şampan tozu + boke (canvas) ── */
  function buildDust() {
    if (reduce) { canvas = null; return; }
    canvas = overlay.querySelector('.yf-dust');
    ctx = canvas.getContext('2d');
    if (!ctx) { canvas = null; return; }
    var N = Math.min(52, Math.max(26, Math.round(window.innerWidth / 28)));
    for (var i = 0; i < N; i++) {
      particles.push({
        x: rand(i + 3), y: rand(i + 5), r: .6 + rand(i + 7) * 1.7,
        vy: 5 + rand(i + 9) * 13, sway: 6 + rand(i + 13) * 18, ph: rand(i + 15) * 6.28,
        tw: .6 + rand(i + 17) * 1.6, warm: rand(i + 19) > .28
      });
    }
    for (var b = 0; b < 7; b++) {
      bokeh.push({ x: rand(b + 31), y: rand(b + 37), r: 18 + rand(b + 41) * 36, vy: 3 + rand(b + 43) * 6, ph: rand(b + 47) * 6.28, warm: rand(b + 53) > .4 });
    }
    resize();
    window.addEventListener('resize', resize);
  }
  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ── Kadr dövrü ── */
  function setDraw(nodes, p) {
    var v = 1 - p;
    for (var i = 0; i < nodes.length; i++) nodes[i].style.strokeDashoffset = v;
  }
  function showOnce(nodes) {
    for (var i = 0; i < nodes.length; i++) if (nodes[i].style.visibility !== 'visible') nodes[i].style.visibility = 'visible';
  }
  function place(head, path, p) {
    var len = path.getTotalLength();
    var pt = path.getPointAtLength(len * p);
    head[0].setAttribute('cx', pt.x); head[0].setAttribute('cy', pt.y);
    head[1].setAttribute('cx', pt.x); head[1].setAttribute('cy', pt.y);
  }

  var headsG, headsVisible = false;
  function tick(ts) {
    rafId = requestAnimationFrame(tick);
    var e = now() - t0;

    var pS = easeSine(clamp01((e - T.swash) / T.swashDur));
    var pH = easeSine(clamp01((e - T.heart) / T.heartDur));
    if (pS > 0) { showOnce(swashNodes); setDraw(swashNodes, pS); }
    if (pH > 0) { showOnce(heartNodes); setDraw(heartNodes, pH); }

    var active = e > T.swash && e < T.heart + T.heartDur + 120;
    if (active !== headsVisible) { headsG.setAttribute('opacity', active ? 1 : 0); headsVisible = active; }
    if (active) {
      if (pH > 0) { place(headL, pathHL, pH); place(headR, pathHR, pH); }
      else        { place(headL, pathSL, pS); place(headR, pathSR, pS); }
      var fade = pH >= .94 ? clamp01(1 - (pH - .94) / .06) : 1;
      headsG.setAttribute('opacity', fade);
    }

    if (canvas) {
      var dt = Math.min(.05, (ts - lastTs) / 1000 || .016); lastTs = ts;
      ctx.clearRect(0, 0, W, H);
      var inA = clamp01(e / 1400);
      var outA = 1 - clamp01((e - T.fade) / T.fadeDur);
      var lift = 1 + clamp01((e - T.beat) / 1200) * .5;
      var i, p, x, y, a, rgb;
      for (i = 0; i < bokeh.length; i++) {
        p = bokeh[i];
        p.y -= (p.vy * dt) / H; if (p.y < -.1) p.y = 1.1;
        x = p.x * W + Math.sin(e / 1000 * .3 + p.ph) * 26; y = p.y * H;
        a = (.5 + .5 * Math.sin(e / 1000 * .7 + p.ph)) * inA * outA;
        rgb = p.warm ? '236,196,128' : '244,176,176';
        ctx.fillStyle = 'rgba(' + rgb + ',' + (a * .07).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(x, y, p.r, 0, 6.2832); ctx.fill();
        ctx.fillStyle = 'rgba(' + rgb + ',' + (a * .06).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(x, y, p.r * .62, 0, 6.2832); ctx.fill();
      }
      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        p.y -= (p.vy * lift * dt) / H;
        if (p.y < -0.04) p.y = 1.04;
        x = p.x * W + Math.sin(e / 1000 * .6 + p.ph) * p.sway;
        y = p.y * H;
        var tw = .45 + .55 * (.5 + .5 * Math.sin(e / 1000 * p.tw * 2 + p.ph));
        a = tw * inA * outA;
        if (a < .01) continue;
        rgb = p.warm ? '214,176,108' : '240,188,182';
        ctx.fillStyle = 'rgba(' + rgb + ',' + (a * .16).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(x, y, p.r * 3.4, 0, 6.2832); ctx.fill();
        ctx.fillStyle = 'rgba(' + rgb + ',' + (a * .85).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(x, y, p.r, 0, 6.2832); ctx.fill();
      }
    }
  }

  /* ── Xoreoqrafiya ── */
  function portalScale() {
    var k = svg.getBoundingClientRect().width / 840;
    var halfH = window.innerHeight / 2 / k, halfW = window.innerWidth / 2 / k;
    return Math.max(halfH / 118, halfW / 330, 2.2) * 1.14;
  }

  function play() {
    var q = function (s) { return svg.querySelector(s); };
    headsG = q('.yf-heads');
    var glow = overlay.querySelector('.yf-glow'), light = overlay.querySelector('.yf-light'),
        portal = overlay.querySelector('.yf-portal'), full = overlay.querySelector('.yf-full');
    var hw = q('.yf-hw'), heart = q('.yf-heart'), halo = q('.yf-halo'), rings = q('.yf-rings'),
        bloom = q('.yf-bloom'), sw = q('.yf-swash'), scrim = q('.yf-scrim');

    t0 = now();
    lastTs = performance.now();

    /* 1: fon işığı */
    A(glow, [{ opacity: 0, transform: 'scale(.82)' }, { opacity: .72, transform: 'scale(1)' }], { duration: 1600, easing: 'ease-out' });
    A(glow, [{ opacity: .72 }, { opacity: 1 }], { delay: T.glow, duration: 900, easing: 'ease-in-out', fill: 'forwards' });
    A(light, [
      { opacity: 0, transform: 'translateX(-18%)' }, { opacity: .8, offset: .3 }, { opacity: .6, offset: .7 }, { opacity: 0, transform: 'translateX(14%)' }
    ], { delay: 200, duration: 6000, easing: 'ease-in-out' });
    buildFloats();

    /* 3: birləşmə qığılcımı → iz → ürək */
    A(bloom, [{ opacity: 0, transform: 'scale(.15)' }, { opacity: .95, transform: 'scale(1)', offset: .45 }, { opacity: 0, transform: 'scale(1.5)' }],
      { delay: T.spark, duration: 1000, easing: 'ease-out' });
    bloom.style.transformOrigin = '500px 338px';
    A(sw, [{ opacity: 1 }, { opacity: 0 }], { delay: T.heart + 250, duration: 1100, easing: 'ease-in-out' });

    /* 4: foto "açılır" (polaroid kimi), parıltı, ürək döyüntüsü, halqa */
    if (heroImgs.length) {
      var kb = function (im, at) {
        A(im, [{ transform: 'scale(1)' }, { transform: 'scale(1.09)' }], { delay: at, duration: 3600, easing: 'linear', fill: 'forwards' });
      };
      A(heroImgs[0], [
        { opacity: 0, filter: 'blur(14px) saturate(.25) brightness(1.35)' },
        { opacity: 1, filter: 'blur(0px) saturate(1) brightness(1)' }
      ], { delay: T.photo, duration: T.photoDur, easing: 'ease-out', fill: 'forwards' });
      kb(heroImgs[0], T.photo);
      A(scrim, [{ opacity: 0 }, { opacity: 1 }], { delay: T.photo + 100, duration: 900, easing: 'ease-out', fill: 'forwards' });
      [[1, T.photoB, T.photoBDur], [2, T.photoC, T.photoCDur]].forEach(function (c) {
        var im = heroImgs[c[0]]; if (!im) return;
        A(im, [{ opacity: 0 }, { opacity: 1 }], { delay: c[1], duration: c[2], easing: 'ease-in-out', fill: 'forwards' });
        kb(im, c[1]);
      });
    }
    A(halo, [{ opacity: 0, transform: 'scale(.7)' }, { opacity: .85, transform: 'scale(1)' }], { delay: T.glow, duration: 1000, easing: 'ease-out' });
    halo.style.transformOrigin = CX + 'px ' + CY + 'px';
    hw.style.transformOrigin = CX + 'px ' + CY + 'px';
    A(hw, [
      { transform: 'scale(1)' },
      { transform: 'scale(1.05)', offset: .2 },
      { transform: 'scale(.995)', offset: .38 },
      { transform: 'scale(1.028)', offset: .54 },
      { transform: 'scale(1)', offset: .85 },
      { transform: 'scale(1)' }
    ], { delay: T.beat, duration: 950, easing: 'ease-in-out' });

    [[0, 1.8, .75, 1700], [260, 3.4, .35, 2000]].forEach(function (r) {
      var c = el('circle', { cx: CX, cy: CY, r: 300, fill: 'none', stroke: 'url(#yf-g-stroke)', 'stroke-width': r[1], opacity: 0 }, rings);
      c.style.transformOrigin = CX + 'px ' + CY + 'px';
      A(c, [{ transform: 'scale(.9)', opacity: 0 }, { opacity: r[2], offset: .18 }, { transform: 'scale(2.1)', opacity: 0 }],
        { delay: T.ring + r[0], duration: r[3], easing: 'cubic-bezier(.2,.6,.3,1)' });
    });

    /* 5: foto dolu ürək portala çevrilir → tam ekran foto → sayt */
    var s = portalScale();
    A(hw, [{ transform: 'scale(1)' }, { transform: 'scale(' + (s * .55).toFixed(2) + ')', offset: .6 }, { transform: 'scale(' + s.toFixed(2) + ')' }],
      { delay: T.portal, duration: T.portalDur, easing: EASE_IN, fill: 'forwards' });
    A(heart, [{ opacity: 1 }, { opacity: 0 }], { delay: T.portal, duration: T.portalDur * .75, easing: 'ease-in', fill: 'forwards' });
    A(halo, [{ opacity: .85 }, { opacity: 0 }], { delay: T.portal, duration: 700, easing: 'ease-in', fill: 'forwards' });
    A(full, [{ opacity: 0, transform: 'scale(1.07)' }, { opacity: 1, transform: 'scale(1)' }],
      { delay: T.full, duration: T.fullDur + 400, easing: 'ease-out', fill: 'forwards' });
    A(portal, [{ scale: .05, opacity: 0 }, { opacity: .7, offset: .55 }, { scale: 1.7, opacity: .55 }],
      { delay: T.portalGlow, duration: 1200, easing: EASE_IO, fill: 'forwards' });

    var fade = A(overlay, [{ opacity: 1 }, { opacity: 0 }], { delay: T.fade, duration: T.fadeDur, easing: 'ease-in-out' });
    fade.finished.then(function () { if (!ending) { ending = true; cleanup(); } }, function () {});
    setTimeout(function () { if (!ending) reveal(false); }, T.reveal);

    rafId = requestAnimationFrame(tick);
  }

  function playReduced() {
    var q = function (s) { return svg.querySelector(s); };
    heartNodes.forEach(function (n) { n.style.visibility = 'visible'; n.style.strokeDashoffset = 0; });
    q('.yf-halo').setAttribute('opacity', .8);
    if (heroImgs[0]) { heroImgs[0].setAttribute('opacity', 1); q('.yf-scrim').setAttribute('opacity', 1); }
    overlay.querySelector('.yf-glow').style.opacity = 1;
    anims.push(overlay.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, fill: 'both' }));
    var out = overlay.animate([{ opacity: 1 }, { opacity: 0 }], { delay: 2100, duration: 700, fill: 'both' });
    anims.push(out);
    out.finished.then(function () { if (!ending) { ending = true; cleanup(); } }, function () {});
    setTimeout(function () { if (!ending) reveal(false); }, 2300);
  }

  /* ── Başlanğıc ── */
  function start() {
    try {
      build();
      failsafe = setTimeout(function () { if (!ending) { ending = true; reveal(true); cleanup(); } }, 18000);
      if (!overlay.animate) { ending = true; reveal(true); cleanup(); return; }
      Promise.all([loadFont(), photosReady]).then(function () {
        if (ending) return;
        buildHero();       /* fotolar, adlar və ləçəklər hazır olandan sonra qurulur — animasiya saatı indi başlayır */
        buildNames();
        buildPetals();
        reduce ? (buildFloats(), playReduced()) : play();
      });
    } catch (err) {
      ending = true; reveal(true); cleanup();
      if (window.console) console.error('[intro]', err);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
