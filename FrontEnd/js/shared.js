/**
 * Dwelling Shared JavaScript Utilities
 * Common functions for all pages
 */

// API Service (imported from api.js)
import { 
  getAuthToken, 
  setAuthToken, 
  removeAuthToken, 
  isAuthenticated,
  fetchCurrentUser,
  logoutUser,
  getAuthUser
} from './api.js';

// DOM Helpers
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

// Format helpers
const fmtCurrency = (n) => '$' + Math.round(Number(n || 0)).toLocaleString('en-US');

/**
 * Render dynamic navbar based on authentication state
 */
function renderNavbar() {
  const navCta = $('.nav-cta');
  if (!navCta) return;

  const isSubPage = window.location.pathname.includes('/pages/');
  const basePath = isSubPage ? '../' : '';

  if (isAuthenticated()) {
    const user = getAuthUser();
    const isAgent = user && user.role === 'AGENT';
    
    const listPropertyBtn = isAgent 
      ? `<a href="${basePath}pages/add-property.html" class="btn btn--primary btn--sm">
           <span>List Property</span>
         </a>`
      : '';

    // Show User Profile / Logout / List Property when authenticated
    navCta.innerHTML = `
      <div class="nav-auth" style="display: flex; gap: 0.75rem; align-items: center;">
        ${listPropertyBtn}
        <a href="${basePath}pages/profile.html" class="btn btn--outline btn--sm">
          <span>Profile</span>
        </a>
        <button id="logoutBtn" class="btn btn--outline btn--sm">
          <span>Logout</span>
        </button>
      </div>
    `;
    
    // Add logout handler
    $('#logoutBtn').addEventListener('click', async () => {
      await logoutUser();
      window.location.href = isSubPage ? '../index.html' : 'index.html';
    });
  } else {
    // Show Login/Register when unauthenticated
    navCta.innerHTML = `
      <a href="${basePath}pages/login.html" class="btn btn--outline btn--sm">
        <span>Login</span>
      </a>
      <a href="${basePath}pages/register.html" class="btn btn--primary btn--sm">
        <span>Register</span>
      </a>
    `;
  }
}

/**
 * Mobile drawer functionality
 */
function initMobileDrawer() {
  const navToggle = $('.nav-toggle:not(.nav-toggle--close)');
  const drawer = $('#mobile-drawer');
  const drawerPanel = $('.mobile-drawer__panel');
  const body = document.body;
  
  if (!navToggle || !drawer) return;

  let lastFocusedBeforeDrawer = null;

  function openDrawer() {
    lastFocusedBeforeDrawer = document.activeElement;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    body.classList.add('drawer-open');
    navToggle.setAttribute('aria-expanded', 'true');

    const firstFocusable = drawer.querySelector(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (firstFocusable && typeof firstFocusable.focus === 'function') {
      firstFocusable.focus({ preventScroll: true });
    }
  }

  function closeDrawer() {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    body.classList.remove('drawer-open');
    navToggle.setAttribute('aria-expanded', 'false');
    if (lastFocusedBeforeDrawer && typeof lastFocusedBeforeDrawer.focus === 'function') {
      lastFocusedBeforeDrawer.focus({ preventScroll: true });
    }
  }

  navToggle.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('is-open');
    isOpen ? closeDrawer() : openDrawer();
  });

  $$('[data-close-drawer]').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (el.tagName === 'A' && (el.getAttribute('href') || '').startsWith('#')) {
        e.preventDefault();
        const target = el.getAttribute('href');
        closeDrawer();
        setTimeout(() => {
          if (!target) return;
          const tgt = document.querySelector(target);
          if (tgt) {
            tgt.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 200);
      } else {
        closeDrawer();
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      closeDrawer();
    }
  });

  // Focus trap
  drawer.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !drawerPanel) return;
    const focusables = $$(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      drawerPanel
    ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

/**
 * Sticky nav scroll state
 */
function initScrollState() {
  const nav = $('.nav');
  const toTop = $('.to-top');
  const navScrollThreshold = 20;

  function updateScrollState() {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle('is-scrolled', y > navScrollThreshold);
    if (toTop) toTop.classList.toggle('is-visible', y > 500);
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateScrollState();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
  updateScrollState();
}

/**
 * Smooth anchor scrolling
 */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      if (a.closest('.mobile-drawer__links') || a.hasAttribute('data-close-drawer')) return;
      const tgt = document.querySelector(href);
      if (!tgt) return;
      e.preventDefault();
      tgt.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/**
 * Scroll reveal animation
 */
function initScrollReveal() {
  const reveals = $$('.reveal');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if ('IntersectionObserver' in window && reveals.length && !prefersReducedMotion) {
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
}

/**
 * Year auto-update
 */
function initYearUpdate() {
  const yearEl = $('#year');
  if (yearEl) {
    const y = new Date().getFullYear();
    if (!Number.isNaN(y)) yearEl.textContent = String(y);
  }
}

/**
 * Resolves badge tag metadata for a property card.
 * @param {Object} p - Property object
 * @param {number} [idx] - Optional index in grid
 * @returns {{ cls: string, text: string } | null}
 */
function tagForProperty(p, idx) {
  if (p.featured) return { cls: '', text: 'Featured' };
  if (idx === 1) return { cls: 'property-card__tag--alt', text: 'New' };
  if (idx === 2) return { cls: 'property-card__tag--dark', text: 'Hot deal' };
  return null;
}

/**
 * Creates and returns an interactive property card DOM element.
 * Shared across landing and catalog pages to eliminate duplicated markup.
 * @param {Object} p - Property entity
 * @param {number} [idx] - Optional index in grid
 * @param {Object} [options] - Configuration options
 * @returns {HTMLLIElement}
 */
function renderPropertyCard(p, idx, options = {}) {
  const primaryImg =
    (p.images && p.images.find((i) => i.isPrimary)) ||
    (p.images && p.images[0]);
  const rawUrl = typeof primaryImg === 'string' ? primaryImg : primaryImg?.url;
  const imgUrl =
    rawUrl && rawUrl.trim()
      ? rawUrl.trim()
      : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22260%22/%3E';
  const imgAlt = (typeof primaryImg === 'object' && primaryImg?.altText) || p.title || 'Property image';
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
    ' · ' +
    bedsLabel +
    ' · ' +
    p.baths +
    ' Bath' +
    bathsSuffix +
    ' · ' +
    sqftNum.toLocaleString() +
    ' sqft';
  const tag = tagForProperty(p, idx);

  const isSubPage = typeof window !== 'undefined' && window.location.pathname.includes('/pages/');
  const detailsUrlPrefix = options.detailsUrlPrefix ?? (isSubPage ? '' : 'pages/');
  const detailsHref = `${detailsUrlPrefix}property-details.html?id=${encodeURIComponent(p.id)}`;

  const li = document.createElement('li');
  li.className = 'property-card reveal';
  if (p && p.id) li.setAttribute('data-property-id', String(p.id));

  const tagHtml = tag
    ? '<span class="property-card__tag ' + tag.cls + '">' + tag.text + '</span>'
    : '';
  const priceInner = priceLabel.replace(/^\$/, '');
  const safeTitle = p.title || 'Property';

  li.innerHTML =
    '<div class="property-card__media">' +
    '<a href="' + detailsHref + '">' +
    '<img src="' +
    imgUrl +
    '" alt="' +
    imgAlt +
    '" loading="lazy" decoding="async" onerror="this.style.opacity=0.15;this.style.background=\'linear-gradient(135deg,#e2e8f0,#cbd5e1)\'" />' +
    '</a>' +
    tagHtml +
    '<button type="button" class="property-card__fav" data-id="' +
    p.id +
    '" aria-label="Save ' +
    safeTitle +
    ' to favorites" aria-pressed="' +
    (p.isFavorite ? 'true' : 'false') +
    '"' +
    (p.isFavorite ? ' style="color: var(--c-accent);"' : '') +
    '>' +
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="' +
    (p.isFavorite ? 'currentColor' : 'none') +
    '" aria-hidden="true">' +
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
    '</svg>' +
    '</button>' +
    '</div>' +
    '<div class="property-card__body">' +
    '<div class="property-card__row">' +
    '<p class="property-card__price"><span class="dollar">$</span>' +
    priceInner +
    '</p>' +
    '<a href="' + detailsHref + '" class="property-card__arrow" aria-label="View ' +
    safeTitle +
    '">' +
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>' +
    '</a>' +
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

/**
 * Initialize all shared functionality
 */
function initShared() {
  renderNavbar();
  initMobileDrawer();
  initScrollState();
  initSmoothScroll();
  initScrollReveal();
  initYearUpdate();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShared);
} else {
  initShared();
}

// Export functions for use in other modules
export {
  $,
  $$,
  fmtCurrency,
  tagForProperty,
  renderPropertyCard,
  renderNavbar,
  initMobileDrawer,
  initScrollState,
  initSmoothScroll,
  initScrollReveal,
  initYearUpdate,
  initShared
};

