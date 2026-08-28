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
  logoutUser
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

  if (isAuthenticated()) {
    // Show User Profile / Logout when authenticated
    navCta.innerHTML = `
      <div class="nav-auth">
        <a href="pages/profile.html" class="btn btn--outline btn--sm">
          <span>Profile</span>
        </a>
        <button id="logoutBtn" class="btn btn--primary btn--sm">
          <span>Logout</span>
        </button>
      </div>
    `;
    
    // Add logout handler
    $('#logoutBtn').addEventListener('click', async () => {
      await logoutUser();
      window.location.href = '../index.html';
    });
  } else {
    // Show Login/Register when unauthenticated
    navCta.innerHTML = `
      <a href="pages/login.html" class="btn btn--outline btn--sm">
        <span>Login</span>
      </a>
      <a href="pages/register.html" class="btn btn--primary btn--sm">
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
  renderNavbar,
  initMobileDrawer,
  initScrollState,
  initSmoothScroll,
  initScrollReveal,
  initYearUpdate,
  initShared
};
