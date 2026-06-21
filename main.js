/* ═══════════════════════════════════════════════
   Reprosia — Shared JavaScript
   reprosia.com
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  const HTML = document.documentElement;
  const THEME_KEY = 'reprosia-theme';

  /* ─── THEME: apply before DOM paint to prevent flash ─── */
  const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
  HTML.setAttribute('data-theme', savedTheme);

  /* ─── INIT AFTER DOM ─── */
  document.addEventListener('DOMContentLoaded', () => {

    /* Theme toggle */
    const toggleBtn = document.querySelector('.theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const next = HTML.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        HTML.setAttribute('data-theme', next);
        localStorage.setItem(THEME_KEY, next);
        // Update canvas particle color after theme change
        if (window._reproParticleColor) window._reproParticleColor();
      });
    }

    /* Nav scroll */
    const nav = document.querySelector('.nav');
    if (nav) {
      const onScroll = () => {
        nav.classList.toggle('scrolled', window.scrollY > 40);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    /* Mobile nav */
    const burger = document.querySelector('.nav-burger');
    const drawer = document.querySelector('.nav-drawer');
    if (burger && drawer) {
      burger.addEventListener('click', () => {
        const open = drawer.classList.toggle('open');
        burger.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', String(open));
      });
      drawer.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          drawer.classList.remove('open');
          burger.classList.remove('open');
          burger.setAttribute('aria-expanded', 'false');
        });
      });
    }

    /* Scroll reveal */
    const revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length && 'IntersectionObserver' in window) {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } });
      }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
      revealEls.forEach(el => obs.observe(el));
    } else {
      revealEls.forEach(el => el.classList.add('in'));
    }

    /* Hero canvas particle network */
    const canvas = document.getElementById('hero-canvas');
    if (canvas) initParticles(canvas);

    /* Tab system */
    const tabBtns = document.querySelectorAll('[data-tab-btn]');
    const tabPanes = document.querySelectorAll('[data-tab-pane]');
    if (tabBtns.length) {
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.getAttribute('data-tab-btn');
          tabBtns.forEach(b => b.classList.toggle('active', b === btn));
          tabPanes.forEach(p => p.classList.toggle('active', p.getAttribute('data-tab-pane') === target));
        });
      });
    }

    /* FAQ accordion */
    document.querySelectorAll('.faq-q').forEach(q => {
      q.addEventListener('click', () => {
        const item = q.closest('.faq-item');
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });

    /* Smooth internal links */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

  }); // end DOMContentLoaded

  /* ─── PARTICLE NETWORK ─── */
  function initParticles(canvas) {
    const ctx = canvas.getContext('2d');
    let W, H, particles, raf;
    const DIST = 165;

    function getParticleColor() {
      const s = getComputedStyle(HTML);
      return [
        parseInt(s.getPropertyValue('--p-r').trim()) || 0,
        parseInt(s.getPropertyValue('--p-g').trim()) || 200,
        parseInt(s.getPropertyValue('--p-b').trim()) || 168,
      ];
    }

    let color = getParticleColor();
    window._reproParticleColor = () => { color = getParticleColor(); };

    function Particle() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.r  = Math.random() * 1.5 + 0.5;
    }
    Particle.prototype.update = function () {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > W) this.vx *= -1;
      if (this.y < 0 || this.y > H) this.vy *= -1;
    };

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      const count = Math.min(Math.floor(W * H / 13000), 110);
      particles = Array.from({ length: count }, () => new Particle());
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const [r, g, b] = color;
      const n = particles.length;
      for (let i = 0; i < n; i++) {
        const p = particles[i];
        p.update();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},0.55)`;
        ctx.fill();
        for (let j = i + 1; j < n; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < DIST * DIST) {
            const a = (1 - Math.sqrt(d2) / DIST) * 0.26;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas.parentElement);
    resize();
    draw();
  }

})();
