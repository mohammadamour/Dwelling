/* =========================================================
   Dwelling — main.js
   Full-stack landing page with dynamic API data
   ========================================================= */

(function () {
  'use strict';

  const doc = document;
  const body = doc.body;
  const win = window;
  const prefersReducedMotion = win.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- CONFIG ---------- */
  const API_BASE = win.DWELLING_API || 'http://localhost:5000';

  /* ---------- HELPERS ---------- */
  const $ = (sel, ctx = doc) => ctx.querySelector(sel);
  const $$ = (sel, ctx = doc) => Array.from(ctx.querySelectorAll(sel));

  const fmtCurrency = (n) =>
    '$' + Math.round(Number(n || 0)).toLocaleString('en-US');

  /* ==========================================================
     0. API FETCH LAYER
     ========================================================== */
  async function apiFetch(path, params = {}) {
    const url = new URL(API_BASE + path);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
    try {
      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('API ' + res.status);
      return await res.json();
    } catch (err) {
      console.warn('API fetch failed:', path, err);
      return null;
    }
  }

  const fetchStats = () => apiFetch('/api/properties/stats');
  const fetchProperties = (filters) => apiFetch('/api/properties', filters || {});

  /* ==========================================================
     0b. RENDER PROPERTY CARDS
     ========================================================== */
  function tagForProperty(p, idx) {
    if (p.featured) return { cls: '', text: 'Featured' };
    if (idx === 1) return { cls: 'property-card__tag--alt', text: 'New' };
    if (idx === 2) return { cls: 'property-card__tag--dark', text: 'Hot deal' };
    return null;
  }

  function renderPropertyCard(p, idx) {
    const primaryImg =
      (p.images && p.images.find((i) => i.isPrimary)) ||
      (p.images && p.images[0]);
    const imgUrl =
      primaryImg && primaryImg.url
        ? primaryImg.url
        : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22260%22/%3E';
    const imgAlt = (primaryImg && primaryImg.altText) || p.title || 'Property image';
    const priceLabel =
      p.priceType === 'RENT'
        ? fmtCurrency(p.price) + '/mo'
        : fmtCurrency(p.price);
    const bedsLabel = p.beds === 0 ? 'Studio' : p.beds + ' Beds';
    const firstAddr = p.address ? (p.address.split(',')[0] || p.city) : p.city;
    const bathsSuffix = p.baths !== 1 ? 's' : '';
    const sqftNum = Number(p.sqft) || 0;
    const addressLine =
      firstAddr +
      ', ' +
      p.city +
      ' \u00B7 ' +
      bedsLabel +
      ' \u00B7 ' +
      p.baths +
      ' Bath' +
      bathsSuffix +
      ' \u00B7 ' +
      sqftNum.toLocaleString() +
      ' sqft';
    const tag = tagForProperty(p, idx);

    const li = doc.createElement('li');
    li.className = 'property-card reveal';
    if (p && p.id) li.setAttribute('data-property-id', String(p.id));

    const tagHtml = tag
      ? '<span class="property-card__tag ' + tag.cls + '">' + tag.text + '</span>'
      : '';
    const priceInner = priceLabel.replace(/^\$/, '');
    const safeTitle = p.title || 'Property';

    li.innerHTML =
      '<div class="property-card__media">' +
      '<img src="' +
      imgUrl +
      '" alt="' +
      imgAlt +
      '" loading="lazy" decoding="async" onerror="this.style.opacity=0.15;this.style.background=\'linear-gradient(135deg,#e2e8f0,#cbd5e1)\'" />' +
      tagHtml +
      '<button type="button" class="property-card__fav" aria-label="Save ' +
      safeTitle +
      ' to favorites" aria-pressed="false">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
      '</svg>' +
      '</button>' +
      '</div>' +
      '<div class="property-card__body">' +
      '<div class="property-card__row">' +
      '<p class="property-card__price"><span class="dollar">$</span>' +
      priceInner +
      '</p>' +
      '<button type="button" class="property-card__arrow" aria-label="View ' +
      safeTitle +
      '">' +
      '<img src="images/icons/top right arrow.png" alt="" aria-hidden="true" />' +
      '</button>' +
      '</div>' +
      '<h3>' +
      safeTitle +
      '</h3>' +
      '<p class="property-card__address">' +
      addressLine +
      '</p>' +
      '</div>';
    return li;
  }

  async function loadAndRenderProperties(filters) {
    const grid = $('#propertyGrid');
    const emptyEl = $('#propertyEmpty');
    if (!grid) return;

    // Clear previously rendered (non-skeleton) items; make skeletons visible
    $$(':scope > li:not(.property-card--skeleton)', grid).forEach((n) => n.remove());
    const skeletons = $$(':scope > li.property-card--skeleton', grid);
    skeletons.forEach((s) => {
      s.hidden = false;
    });
    if (emptyEl) emptyEl.hidden = true;

    const json = await fetchProperties(Object.assign({ limit: 9 }, filters || {}));
    skeletons.forEach((s) => s.remove());

    const list = (json && json.data) || [];
    if (list.length === 0) {
      if (emptyEl) emptyEl.hidden = false;
      return;
    }

    const frag = doc.createDocumentFragment();
    list.forEach((p, i) => frag.appendChild(renderPropertyCard(p, i)));
    grid.appendChild(frag);

    // Scroll-reveal for newly added cards
    if ('IntersectionObserver' in win && !prefersReducedMotion) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              io.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      );
      $$('.property-card.reveal:not(.is-visible)', grid).forEach((el) => io.observe(el));
    }

    wirePropertyCardButtons();
  }

  function wirePropertyCardButtons() {
    // Favorite toggles
    $$('.property-card__fav:not([data-wired])').forEach((btn) => {
      btn.setAttribute('data-wired', '1');
      btn.addEventListener('click', () => {
        const isSaved = btn.getAttribute('aria-pressed') === 'true';
        btn.setAttribute('aria-pressed', String(!isSaved));
        const svg = btn.querySelector('svg path');
        if (svg) {
          if (!isSaved) {
            svg.setAttribute('fill', 'currentColor');
            btn.style.color = 'var(--c-accent)';
          } else {
            svg.setAttribute('fill', 'none');
            btn.style.color = '';
          }
        }
        btn.animate(
          [{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }],
          { duration: 300, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
        );
      });
    });

    // Property card arrow buttons (placeholder — would navigate to detail page)
    $$('.property-card__arrow:not([data-wired])').forEach((btn) => {
      btn.setAttribute('data-wired', '1');
      btn.addEventListener('click', () => {
        const card = btn.closest('.property-card');
        const id = card && card.getAttribute('data-property-id');
        console.info('[Dwelling] View property \u2192', id, '(detail page integration TBD)');
        btn.animate(
          [
            { transform: 'translate(0,0)' },
            { transform: 'translate(3px,-3px)' },
            { transform: 'translate(0,0)' },
          ],
          { duration: 260, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
        );
      });
    });
  }

  /* ==========================================================
     0c. RENDER STATS
     ========================================================== */
  function formatNumber(n, useFloat) {
    const num = Number(n);
    if (useFloat) return num.toFixed(1);
    if (num >= 10000) {
      return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + 'K';
    }
    return Math.round(num).toLocaleString('en-US');
  }

  function animateCounter(el, target, opts) {
    const duration = (opts && opts.duration) || 1600;
    const useFloat = !!(opts && opts.useFloat);
    if (prefersReducedMotion) {
      el.textContent = formatNumber(target, useFloat);
      return;
    }
    const start = performance.now();
    const from = 0;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const val = from + (target - from) * easeOutCubic(t);
      el.textContent = formatNumber(val, useFloat);
      if (t < 1) win.requestAnimationFrame(tick);
      else el.textContent = formatNumber(target, useFloat);
    }
    win.requestAnimationFrame(tick);
  }

  function animateAllCounters() {
    // Hero mini counters (re-read data-target)
    $$('.hero__stats .counter').forEach((el) => {
      const target = Number(el.getAttribute('data-target') || 0);
      const isFloat = el.getAttribute('data-float') === 'true';
      const run = () => animateCounter(el, target, { duration: 1400, useFloat: isFloat });
      if ('IntersectionObserver' in win && !prefersReducedMotion) {
        const io = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              run();
              io.disconnect();
            }
          },
          { threshold: 0.4 }
        );
        io.observe(el);
      } else {
        run();
      }
    });

    // Stats section counters (parse data-count attribute)
    $$('.stat__num').forEach((row) => {
      const counterEl = row.querySelector('.counter');
      const suffixEl = row.querySelector('.counter-suffix');
      const raw = row.getAttribute('data-count') || '0';
      const suffix = row.getAttribute('data-suffix') || '';
      const clean = raw.replace(/^[+]/, '');
      const isFloat = clean.includes('.');
      const target = Number(clean);
      if (suffixEl) suffixEl.textContent = suffix;

      const run = () => {
        const hasPlusPrefix = raw.startsWith('+');
        const origRender = (val) => (hasPlusPrefix ? '+' : '') + val;
        if (prefersReducedMotion) {
          if (counterEl) counterEl.textContent = origRender(formatNumber(target, isFloat));
          return;
        }
        if (!counterEl) return;
        const start = performance.now();
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
        function tick(now) {
          const t = Math.min(1, (now - start) / 1800);
          const v = target * easeOutCubic(t);
          counterEl.textContent = origRender(formatNumber(v, isFloat));
          if (t < 1) win.requestAnimationFrame(tick);
          else counterEl.textContent = origRender(formatNumber(target, isFloat));
        }
        win.requestAnimationFrame(tick);
      };

      if ('IntersectionObserver' in win && !prefersReducedMotion) {
        const io = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              run();
              io.disconnect();
            }
          },
          { threshold: 0.35 }
        );
        io.observe(row);
      } else {
        run();
      }
    });
  }

  async function loadAndRenderStats() {
    const data = await fetchStats();
    if (!data) return;

    // Hero counters
    $$('.hero__stats .counter[data-stat]').forEach((el) => {
      const key = el.getAttribute('data-stat');
      const val = key ? data[key] : undefined;
      if (val === undefined) return;
      const isFloat = el.getAttribute('data-float') === 'true';
      const suffix = el.getAttribute('data-suffix') || '';
      el.setAttribute('data-target', String(isFloat ? val : Math.round(Number(val))));
      el.removeAttribute('data-count');
      const suffixEl = doc.querySelector('[data-stat-suffix="' + key + '"]');
      if (suffixEl) suffixEl.textContent = suffix;
    });

    // Stats section
    $$('.stat__num[data-stat]').forEach((row) => {
      const key = row.getAttribute('data-stat');
      const val = key ? data[key] : undefined;
      if (val === undefined) return;
      const prefix = row.getAttribute('data-prefix') || '';
      const suffix = row.getAttribute('data-suffix') || '';
      const isFloat = typeof val === 'number' && !Number.isInteger(val);
      row.setAttribute(
        'data-count',
        prefix + (isFloat ? Number(val).toFixed(1) : String(val))
      );
      row.setAttribute('data-suffix', suffix);
      const suffixEl = row.querySelector('.counter-suffix');
      if (suffixEl) suffixEl.textContent = suffix;
    });

    animateAllCounters();
  }

  /* ==========================================================
     1. MOBILE DRAWER
     ========================================================== */
  const navToggle = $('.nav-toggle:not(.nav-toggle--close)');
  const drawer = $('#mobile-drawer');
  const drawerPanel = $('.mobile-drawer__panel');

  let lastFocusedBeforeDrawer = null;

  function openDrawer() {
    if (!drawer) return;
    lastFocusedBeforeDrawer = doc.activeElement;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    body.classList.add('drawer-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'true');

    const firstFocusable = drawer.querySelector(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (firstFocusable && typeof firstFocusable.focus === 'function') {
      firstFocusable.focus({ preventScroll: true });
    }
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    body.classList.remove('drawer-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    if (
      lastFocusedBeforeDrawer &&
      typeof lastFocusedBeforeDrawer.focus === 'function'
    ) {
      lastFocusedBeforeDrawer.focus({ preventScroll: true });
    }
  }

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const isOpen = drawer && drawer.classList.contains('is-open');
      isOpen ? closeDrawer() : openDrawer();
    });
  }

  // All elements that should close the drawer when clicked
  $$('[data-close-drawer]').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (el.tagName === 'A' && (el.getAttribute('href') || '').startsWith('#')) {
        e.preventDefault();
        const target = el.getAttribute('href');
        closeDrawer();
        setTimeout(() => {
          if (!target) return;
          const tgt = doc.querySelector(target);
          if (tgt)
            tgt.scrollIntoView({
              behavior: prefersReducedMotion ? 'auto' : 'smooth',
              block: 'start',
            });
        }, 200);
      } else {
        closeDrawer();
      }
    });
  });

  // ESC closes drawer
  doc.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('is-open')) {
      closeDrawer();
    }
  });

  // Focus trap
  if (drawer) {
    drawer.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !drawerPanel) return;
      const focusables = $$(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        drawerPanel
      ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && doc.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && doc.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* ==========================================================
     2. STICKY NAV SCROLLED STATE
     ========================================================== */
  const nav = $('.nav');
  const toTop = $('.to-top');
  const navScrollThreshold = 20;

  function updateScrollState() {
    const y = win.scrollY || doc.documentElement.scrollTop;
    if (nav) nav.classList.toggle('is-scrolled', y > navScrollThreshold);
    if (toTop) toTop.classList.toggle('is-visible', y > 500);
  }

  let ticking = false;
  win.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        win.requestAnimationFrame(() => {
          updateScrollState();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );
  updateScrollState();

  /* ==========================================================
     3. ACTIVE NAV LINK ON SCROLL
     ========================================================== */
  const sections = $$('section[id]');
  const navLinks = $$('.nav-links .nav-link, .mobile-drawer__links .nav-link');

  function setActiveNav() {
    if (sections.length === 0) return;
    const offset = 140;
    const y = win.scrollY || doc.documentElement.scrollTop;
    let currentId = sections[0].id;
    for (const sec of sections) {
      if (sec.offsetTop - offset <= y) currentId = sec.id;
    }
    if (y < 300) currentId = 'top';

    navLinks.forEach((link) => {
      const href = link.getAttribute('href') || '';
      const matches = href === '#' + currentId || (currentId === 'top' && href === '#top');
      if (matches) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  win.addEventListener('scroll', setActiveNav, { passive: true });
  setActiveNav();

  /* ==========================================================
     4. SCROLL REVEAL (IntersectionObserver)
     ========================================================== */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in win && reveals.length && !prefersReducedMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ==========================================================
     5. HERO SEARCH FORM — wired to API
     ========================================================== */
  const searchForm = $('.search-card');
  if (searchForm) {
    let searchTimer = null;
    const submitSearch = () => {
      const locEl = $('#location', searchForm);
      const htEl = $('#hometype', searchForm);
      const location = (locEl && locEl.value && locEl.value.trim()) || '';
      const hometype = (htEl && htEl.value && htEl.value.trim()) || '';
      const filters = {};
      if (location) filters.search = location;
      if (hometype) filters.type = hometype;
      loadAndRenderProperties(filters);
      const propsSection = $('#properties');
      if (propsSection) {
        propsSection.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start',
        });
      }
    };

    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      submitSearch();
    });

    const liveSearchHandler = () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(submitSearch, 500);
    };
    const locInput = $('#location', searchForm);
    const htInput = $('#hometype', searchForm);
    if (locInput) locInput.addEventListener('input', liveSearchHandler);
    if (htInput) htInput.addEventListener('input', liveSearchHandler);
  }

  /* ==========================================================
     5b. NEWSLETTER FORM — POST to API (best-effort)
     ========================================================== */
  const newsletterForm = $('.newsletter');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = $('#newsletter-email', newsletterForm);
      const email = input && input.value && input.value.trim();
      if (!email) return;
      try {
        await fetch(API_BASE + '/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, sourcePage: 'home' }),
        });
      } catch (_) {
        /* swallow */
      }
      if (input) {
        input.value = '';
        input.placeholder = '\uD83C\uDF89 Thanks! Check your inbox.';
        setTimeout(() => {
          input.placeholder = 'you@example.com';
        }, 3500);
      }
    });
  }

  /* ==========================================================
     6. YEAR AUTO-UPDATE
     ========================================================== */
  const yearEl = $('#year');
  if (yearEl) {
    const y = new Date().getFullYear();
    if (!Number.isNaN(y)) yearEl.textContent = String(y);
  }

  /* ==========================================================
     7. SMOOTH ANCHOR SCROLL
     ========================================================== */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      if (a.closest('.mobile-drawer__links') || a.hasAttribute('data-close-drawer')) return;
      const tgt = doc.querySelector(href);
      if (!tgt) return;
      e.preventDefault();
      tgt.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  });

  /* ==========================================================
     8. VIDEO PLAY BUTTON FEEDBACK
     ========================================================== */
  const videoPlayBtn = $('.video-block__play');
  if (videoPlayBtn) {
    videoPlayBtn.addEventListener('click', () => {
      videoPlayBtn.animate(
        [
          { transform: 'translate(-50%, -50%) scale(1)' },
          { transform: 'translate(-50%, -50%) scale(0.92)' },
          { transform: 'translate(-50%, -50%) scale(1)' },
        ],
        { duration: 280, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
      );
    });
  }

  /* ==========================================================
     9. INIT: KICK OFF DATA LOAD
     ========================================================== */
  loadAndRenderStats();
  loadAndRenderProperties({ featured: undefined, limit: 9 });
  wirePropertyCardButtons();

  void doc.title;
})();
