(function () {
  'use strict';

  /* ═════════ Fon musiqisi: ilk toxunuşda avtomatik, görünən heç nə yoxdur ═════════ */
  var music = document.getElementById('bgm');
  var TARGET_VOLUME = 0.4;
  var musicStarted = false;
  var musicBusy = false;
  var unlockEvents = ['pointerup', 'touchend', 'click', 'keydown'];

  function fadeTo(volume, ms) {
    var from = music.volume, t0 = performance.now();
    (function step(now) {
      var k = Math.min(1, (now - t0) / ms);
      music.volume = from + (volume - from) * k;
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  function tryStart() {
    if (musicStarted || musicBusy || !music) return;
    musicBusy = true;
    music.volume = 0;
    var p;
    try { p = music.play(); } catch (e) { musicBusy = false; return; }
    Promise.resolve(p).then(function () {
      musicStarted = true;
      musicBusy = false;
      unlockEvents.forEach(function (n) { document.removeEventListener(n, tryStart, true); });
      fadeTo(TARGET_VOLUME, 2200);
    }).catch(function () { musicBusy = false; /* növbəti toxunuşda yenidən cəhd */ });
  }

  if (music) {
    unlockEvents.forEach(function (n) { document.addEventListener(n, tryStart, true); });
    tryStart(); // brauzer icazə verirsə, dərhal başlasın
    document.addEventListener('visibilitychange', function () {
      if (!musicStarted) return;
      if (document.hidden) music.pause();
      else music.play().catch(function () {});
    });
  }

  /* ═════════ Qalereya ═════════ */
  var photos = window.PHOTOS || [];
  var grid = document.getElementById('grid');
  var errorBox = document.getElementById('gallery-error');
  var url = function (i) { return encodeURI(photos[i].s); };

  document.getElementById('cue').addEventListener('click', function () {
    document.getElementById('photos').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  if (!photos.length) {
    grid.setAttribute('aria-busy', 'false');
    errorBox.hidden = false;
    return;
  }

  var revealer = 'IntersectionObserver' in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); revealer.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -6% 0px' })
    : null;

  var frag = document.createDocumentFragment();
  photos.forEach(function (p, i) {
    var card = document.createElement('figure');
    card.className = 'card';
    card.style.margin = '';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Foto ' + (i + 1) + ' — tam ekranda aç');
    var img = document.createElement('img');
    img.src = url(i);
    img.width = p.w; img.height = p.h;
    img.alt = 'Yusif və Fatmanın fotosu ' + (i + 1);
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('load', function () { img.classList.add('ready'); });
    if (img.complete && img.naturalWidth) img.classList.add('ready');
    var thumb = document.createElement('span');
    thumb.className = 'thumb';
    thumb.appendChild(img);
    btn.appendChild(thumb);
    btn.addEventListener('click', function () { openViewer(i); });
    card.appendChild(btn);
    frag.appendChild(card);
    if (revealer) revealer.observe(card); else card.classList.add('in');
  });
  grid.replaceChildren(frag);
  grid.setAttribute('aria-busy', 'false');

  /* ═════════ Tam ekran baxış + kitab səhifəsi çevirmə ═════════ */
  var viewer = document.getElementById('viewer');
  var stage = document.getElementById('stage');
  var under = document.getElementById('under');
  var underImg = document.getElementById('under-img');
  var leaf = document.getElementById('leaf');
  var leafImg = document.getElementById('leaf-img');
  var leafShade = document.getElementById('leaf-shade');
  var underShade = document.getElementById('under-shade');
  var curEl = document.getElementById('count-cur');
  var totalEl = document.getElementById('count-total');
  totalEl.textContent = photos.length;
  function setCount(i) { curEl.textContent = i + 1; }
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var index = 0;
  var busy = false;
  var DURATION = 1000;
  var EASE = 'cubic-bezier(.65,.02,.3,1)';
  var mod = function (n) { return (n + photos.length) % photos.length; };

  function desktopRevealAvailable() {
    return !reduceMotion && window.matchMedia('(min-width: 900px) and (pointer: fine)').matches &&
      window.CSS && CSS.supports && CSS.supports('clip-path', 'inset(0 100% 0 0)');
  }

  function preload(i) {
    var im = new Image();
    im.decoding = 'async';
    im.src = url(i);
    return im.decode ? im.decode().catch(function () {}) : Promise.resolve();
  }
  function warmNeighbours() { preload(mod(index + 1)); preload(mod(index - 1)); preload(mod(index + 2)); }

  function setStatic(i) {
    underImg.src = url(i);
    leafImg.src = url(i);
    underImg.alt = leafImg.alt = 'Yusif və Fatmanın fotosu ' + (i + 1);
    setCount(i);
  }

  function setPerspective() {
    stage.style.perspective = Math.max(window.innerWidth * 1.7, 1200) + 'px';
    viewer.classList.toggle('desktop-turn', desktopRevealAvailable());
  }

  function openViewer(i) {
    index = i;
    setStatic(index);
    setPerspective();
    document.body.classList.add('lock');
    if (!viewer.open) viewer.showModal();
    showUi();
    warmNeighbours();
  }

  function closeViewer() {
    if (viewer.open) viewer.close();
  }

  viewer.addEventListener('close', function () {
    document.body.classList.remove('lock');
    clearTimeout(uiTimer);
  });

  function turn(dir) {
    if (busy || photos.length < 2) return;
    busy = true;
    var target = mod(index + dir);

    preload(target).then(function () {
      var forward = dir > 0;
      if (reduceMotion) {
        index = target; setStatic(index); busy = false; warmNeighbours(); return;
      }

      var desktopReveal = desktopRevealAvailable();
      if (desktopReveal) {
        underImg.src = url(index);
        leafImg.src = url(target);
      } else if (forward) {
        underImg.src = url(target); leafImg.src = url(index);
      } else {
        leafImg.src = url(target); underImg.src = url(index);
      }

      leaf.style.display = 'block';
      var anims;
      if (desktopReveal) {
        var hiddenClip = forward ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
        var drift = forward ? 24 : -24;
        var desktopOpts = { duration: 1750, easing: 'cubic-bezier(.28,.02,.22,1)', fill: 'both' };
        anims = [
          leaf.animate([
            { clipPath: hiddenClip, transform: 'scale(1.035) translateX(' + drift + 'px)' },
            { clipPath: 'inset(0 0 0 0)', transform: 'scale(1) translateX(0)' }
          ], desktopOpts),
          leafShade.animate([
            { opacity: 0, backgroundPosition: forward ? '-90% 0' : '190% 0' },
            { opacity: .8, backgroundPosition: '50% 0', offset: .55 },
            { opacity: 0, backgroundPosition: forward ? '190% 0' : '-90% 0' }
          ], desktopOpts),
          underShade.animate([{ opacity: 0 }, { opacity: .2, offset: .42 }, { opacity: 0 }], desktopOpts)
        ];
      } else {
        var opts = { duration: DURATION, easing: EASE, fill: 'both', direction: forward ? 'normal' : 'reverse' };
        anims = [
          leaf.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-180deg)' }], opts),
          leafShade.animate([{ opacity: 0 }, { opacity: 1, offset: .55 }, { opacity: 1 }], opts),
          underShade.animate([{ opacity: 1 }, { opacity: .55, offset: .5 }, { opacity: 0 }], opts)
        ];
      }

      return anims[0].finished.then(function () {
        index = target;
        underImg.src = url(index);
        leafImg.src = url(index);
        setCount(index);
        underImg.alt = leafImg.alt = 'Yusif və Fatmanın fotosu ' + (index + 1);
        var ready = underImg.decode ? underImg.decode().catch(function () {}) : Promise.resolve();
        return ready.then(function () {
          leaf.style.display = 'none';
          anims.forEach(function (a) { a.cancel(); });
          warmNeighbours();
        });
      });
    }).catch(function () {
      leaf.style.display = 'none';
    }).then(function () { busy = false; });
  }

  document.getElementById('prev').addEventListener('click', function () { turn(-1); });
  document.getElementById('next').addEventListener('click', function () { turn(1); });
  document.getElementById('close').addEventListener('click', closeViewer);

  window.addEventListener('keydown', function (e) {
    if (!viewer.open) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); turn(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); turn(-1); }
    showUi();
  });

  /* Sürüşdürmə (swipe) */
  var sx = 0, sy = 0, sid = null, moved = false;
  stage.addEventListener('pointerdown', function (e) {
    if (e.target.closest && e.target.closest('.ctrl')) return;
    sid = e.pointerId; sx = e.clientX; sy = e.clientY; moved = false;
  });
  stage.addEventListener('pointermove', function (e) {
    if (e.pointerId !== sid) return;
    if (Math.abs(e.clientX - sx) > 8 || Math.abs(e.clientY - sy) > 8) moved = true;
  });
  stage.addEventListener('pointerup', function (e) {
    if (e.pointerId !== sid) return;
    sid = null;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) turn(dx < 0 ? 1 : -1);
    else if (!moved && e.pointerType !== 'mouse') toggleUi();
  });
  stage.addEventListener('pointercancel', function () { sid = null; });
  stage.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaX) > 40 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) turn(e.deltaX > 0 ? 1 : -1);
  }, { passive: true });

  /* Düymələrin avtomatik gizlənməsi (təmiz mənzərə üçün) */
  var uiTimer = 0;
  function showUi() {
    viewer.classList.remove('ui-hidden');
    clearTimeout(uiTimer);
    uiTimer = setTimeout(function () { viewer.classList.add('ui-hidden'); }, 3600);
  }
  function toggleUi() {
    if (viewer.classList.contains('ui-hidden')) showUi();
    else { clearTimeout(uiTimer); viewer.classList.add('ui-hidden'); }
  }
  viewer.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') showUi(); });

  window.addEventListener('resize', setPerspective);
})();
