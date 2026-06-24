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

}());
