/**
 * Dwelling — Landing Page JavaScript
 * Dynamic property loading and interactions
 */

import { fetchFeaturedProperties, fetchPropertyStats, apiFetch, toggleFavorite, isAuthenticated } from './api.js';
import { $, $$, fmtCurrency, renderPropertyCard } from './shared.js';

async function loadAndRenderProperties() {
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

  try {
    const json = await fetchFeaturedProperties(6);
    skeletons.forEach((s) => s.remove());

    const list = Array.isArray(json) ? json : (json && json.data) || [];
    if (list.length === 0) {
      if (emptyEl) emptyEl.hidden = false;
      return;
    }

    const frag = document.createDocumentFragment();
    list.forEach((p, i) => frag.appendChild(renderPropertyCard(p, i)));
    grid.appendChild(frag);

    // Scroll-reveal for newly added cards
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if ('IntersectionObserver' in window && !prefersReducedMotion) {
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
  } catch (error) {
    console.error('Failed to load properties:', error);
    skeletons.forEach((s) => s.remove());
    if (emptyEl) {
      emptyEl.textContent = 'Failed to load properties. Please try again later.';
      emptyEl.hidden = false;
    }
  }
}

function wirePropertyCardButtons() {
  // Favorite toggles
  $$('.property-card__fav:not([data-wired])').forEach((btn) => {
    btn.setAttribute('data-wired', '1');
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isAuthenticated()) {
        window.location.href = 'pages/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        return;
      }

      const propertyId = btn.getAttribute('data-id');
      if (!propertyId) return;

      try {
        btn.disabled = true;
        const res = await toggleFavorite(propertyId);
        const isSaved = Boolean(res.isFavorite);
        btn.setAttribute('aria-pressed', String(isSaved));

        const svg = btn.querySelector('svg path');
        if (svg) {
          if (isSaved) {
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
      } catch (err) {
        console.error('Failed to toggle favorite:', err);
      } finally {
        btn.disabled = false;
      }
    });
  });
}

// Stats rendering
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
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
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
    if (t < 1) window.requestAnimationFrame(tick);
    else el.textContent = formatNumber(target, useFloat);
  }
  window.requestAnimationFrame(tick);
}

function animateAllCounters() {
  // Hero mini counters
  $$('.hero__stats .counter').forEach((el) => {
    const target = Number(el.getAttribute('data-target') || 0);
    const isFloat = el.getAttribute('data-float') === 'true';
    const run = () => animateCounter(el, target, { duration: 1400, useFloat: isFloat });
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if ('IntersectionObserver' in window && !prefersReducedMotion) {
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

  // Stats section counters
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
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
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
        if (t < 1) window.requestAnimationFrame(tick);
        else counterEl.textContent = origRender(formatNumber(target, isFloat));
      }
      window.requestAnimationFrame(tick);
    };

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if ('IntersectionObserver' in window && !prefersReducedMotion) {
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
  const data = await fetchPropertyStats();
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
    const suffixEl = document.querySelector('[data-stat-suffix="' + key + '"]');
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

// Hero search form
function initHeroSearch() {
  const searchForm = $('.search-card');
  if (!searchForm) return;

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const locEl = $('#location', searchForm);
    const htEl = $('#hometype', searchForm);
    const location = (locEl && locEl.value && locEl.value.trim()) || '';
    const hometype = (htEl && htEl.value && htEl.value.trim()) || '';
    
    // Navigate to properties page with filters
    const params = new URLSearchParams();
    if (location) params.set('search', location);
    if (hometype) params.set('type', hometype);
    
    window.location.href = 'pages/properties.html?' + params.toString();
  });
}

// Newsletter form
function initNewsletter() {
  const newsletterForm = $('.newsletter');
  if (!newsletterForm) return;

  newsletterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = $('#newsletter-email', newsletterForm);
    const email = input && input.value && input.value.trim();
    if (!email) return;
    
    try {
      await apiFetch('/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email: email, sourcePage: 'home' }),
      });
      if (input) {
        input.value = '';
        input.placeholder = '🎉 Thanks! Check your inbox.';
        setTimeout(() => {
          input.placeholder = 'you@example.com';
        }, 3500);
      }
    } catch (err) {
      console.error('Newsletter subscription failed:', err);
      if (input) {
        input.placeholder = '⚠️ Unable to subscribe. Try again.';
        setTimeout(() => {
          input.placeholder = 'you@example.com';
        }, 3500);
      }
    }
  });
}

// Video play button
function initVideoButton() {
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
}

// Initialize landing page
function initLanding() {
  loadAndRenderStats();
  loadAndRenderProperties();
  initHeroSearch();
  initNewsletter();
  initVideoButton();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLanding);
} else {
  initLanding();
}
