/* ================================================================
   cursor-effects.js  —  Cursor gold glow + scroll-reveal + page header animations
   Applied to all portfolio pages via a single <script> include.
   ================================================================ */
(function () {
  'use strict';

  /* ── 1. Cursor gold glow ───────────────────────────────────────
     A fixed div with mix-blend-mode:screen draws a warm gold radial
     gradient that follows the cursor with smooth lerping (lerp 0.1).
     Screen blend-mode makes it additive on the dark navy background
     and invisible on white areas (iframes, etc.).
  ─────────────────────────────────────────────────────────────── */
  var glow = document.createElement('div');
  glow.setAttribute('aria-hidden', 'true');
  glow.style.cssText =
    'position:fixed;top:0;left:0;right:0;bottom:0;' +
    'pointer-events:none;z-index:200;' +
    'mix-blend-mode:screen;will-change:background;';
  document.body.appendChild(glow);

  var mouse  = { x: window.innerWidth  / 2, y: window.innerHeight / 2 };
  var smooth = { x: mouse.x,                y: mouse.y };

  document.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  function glowLoop() {
    smooth.x += (mouse.x - smooth.x) * 0.1;
    smooth.y += (mouse.y - smooth.y) * 0.1;
    glow.style.background =
      'radial-gradient(320px circle at ' + (smooth.x | 0) + 'px ' + (smooth.y | 0) + 'px,' +
      'rgba(201,168,76,.18) 0%,' +
      'rgba(201,168,76,.10) 30%,' +
      'rgba(201,168,76,.04) 60%,' +
      'transparent 100%)';
    requestAnimationFrame(glowLoop);
  }
  glowLoop();

  /* ── 2. Scroll-reveal for content cards ────────────────────────
     IntersectionObserver watches .card / .practice / .tl-card /
     .autoevaluation.  The CSS class fade-in-card (in shared-effects.css)
     starts them at opacity:0, translateY(22px).  When they enter the
     viewport, is-visible is added to trigger the transition.
  ─────────────────────────────────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.07, rootMargin: '0px 0px -20px 0px' });

    var cards = document.querySelectorAll('.card, .practice, .tl-card, .autoevaluation');
    cards.forEach(function (el, i) {
      el.classList.add('fade-in-card');
      el.style.transitionDelay = (Math.min(i, 4) * 0.08) + 's';
      io.observe(el);
    });
  }

  /* ── 3. Page header entrance animations ────────────────────────
     Targets .page-tag, .page-title, .page-line, .page-desc which are
     present on every interior page.  index.html uses different classes
     (.hero-badge, .hero-name) so this block is harmless there.
  ─────────────────────────────────────────────────────────────── */
  var pageTag   = document.querySelector('.page-tag');
  var pageTitle = document.querySelector('.page-title');
  var pageLine  = document.querySelector('.page-line');
  var pageDesc  = document.querySelector('.page-desc');

  if (pageTag) {
    pageTag.classList.add('hero-anim', 'hero-fade');
    pageTag.style.animationDelay = '0.05s';
  }
  if (pageTitle) {
    pageTitle.classList.add('hero-anim', 'hero-reveal');
    pageTitle.style.animationDelay = '0.18s';
  }
  if (pageLine) {
    pageLine.classList.add('hero-anim', 'hero-fade');
    pageLine.style.animationDelay = '0.32s';
  }
  if (pageDesc) {
    pageDesc.classList.add('hero-anim', 'hero-fade');
    pageDesc.style.animationDelay = '0.42s';
  }

  /* ── 4. FadingVideo crossfade ──────────────────────────────────
     Smooth rAF-based fade-in/fade-out loop for <video class="fading-vid">.
     No loop attribute — looping is handled manually via the ended event.
  ─────────────────────────────────────────────────────────────── */
  var FADE_MS       = 500;
  var FADE_OUT_LEAD = 0.55;
  var fadingVids    = document.querySelectorAll('video.fading-vid');
  fadingVids.forEach(function (video) {
    var rafId     = null;
    var fadingOut = false;
    video.style.opacity = 0;
    function fadeTo(target) {
      var start = parseFloat(video.style.opacity) || 0;
      var t0    = null;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(function tick(now) {
        if (!t0) t0 = now;
        var p = Math.min((now - t0) / FADE_MS, 1);
        video.style.opacity = (start + (target - start) * p).toFixed(3);
        if (p < 1) rafId = requestAnimationFrame(tick);
      });
    }
    video.addEventListener('loadeddata', function () {
      video.style.opacity = 0;
      video.play().catch(function () {});
      fadeTo(1);
    });
    video.addEventListener('timeupdate', function () {
      if (!fadingOut && video.duration &&
          (video.duration - video.currentTime) <= FADE_OUT_LEAD &&
          (video.duration - video.currentTime) > 0) {
        fadingOut = true;
        fadeTo(0);
      }
    });
    video.addEventListener('ended', function () {
      video.style.opacity = 0;
      fadingOut = false;
      setTimeout(function () {
        video.currentTime = 0;
        video.play().catch(function () {});
        fadeTo(1);
      }, 100);
    });
  });

  /* ── 5. Liquid-glass nav ───────────────────────────────────────
     Applies .liquid-glass (defined in shared-effects.css) to every
     page nav. nav.liquid-glass in shared-effects.css keeps position:fixed
     and sets the correct dark background.
  ─────────────────────────────────────────────────────────────── */
  var navEl = document.querySelector('nav');
  if (navEl && !navEl.classList.contains('liquid-glass')) {
    navEl.classList.add('liquid-glass');
  }

}());
