/**
 * Dwelling — Properties Page JavaScript
 * Property search, filtering, and pagination
 */

import { fetchProperties } from './api.js';
import { $, $$, fmtCurrency } from './shared.js';

// State
let currentPage = 1;
let totalPages = 1;
let currentFilters = {};
let debounceTimer = null;

// Property card rendering (same as landing page)
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
    '<a href="property-details.html?id=' + p.id + '">' +
    '<img src="' +
    imgUrl +
    '" alt="' +
    imgAlt +
    '" loading="lazy" decoding="async" onerror="this.style.opacity=0.15;this.style.background=\'linear-gradient(135deg,#e2e8f0,#cbd5e1)\'" />' +
    '</a>' +
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
    '<a href="property-details.html?id=' + p.id + '" class="property-card__arrow" aria-label="View ' +
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

// Get filters from form
function getFiltersFromForm() {
  const form = $('#filtersForm');
  if (!form) return {};

  const formData = new FormData(form);
  const filters = {};

  for (const [key, value] of formData.entries()) {
    if (value && value !== '' && value !== 'All' && value !== 'Any') {
      filters[key] = value;
    }
  }

  // Handle featured boolean
  if (filters.featured === 'true') {
    filters.featured = true;
  } else {
    delete filters.featured;
  }

  // Handle sort
  const sortBy = $('#sortBy')?.value;
  if (sortBy) {
    const [sortField, sortOrder] = sortBy.split('-');
    filters.sortBy = sortField;
    filters.order = sortOrder;
  }

  return filters;
}

// Load properties with filters
async function loadProperties(page = 1, filters = {}) {
  const grid = $('#propertyGrid');
  const loadingState = $('#loadingState');
  const emptyState = $('#emptyState');
  const resultsStart = $('#resultsStart');
  const resultsEnd = $('#resultsEnd');
  const resultsTotal = $('#resultsTotal');

  if (!grid) return;

  // Show loading, hide results
  if (loadingState) loadingState.hidden = false;
  if (emptyState) emptyState.hidden = true;
  grid.innerHTML = '';

  try {
    const params = {
      ...filters,
      page,
      limit: 9
    };

    const response = await fetchProperties(params);
    
    if (loadingState) loadingState.hidden = true;

    const properties = (response && response.data) || [];
    const meta = response?.meta || {};
    const total = meta.total || 0;
    const pageSize = meta.limit || 9;
    
    currentPage = meta.page || 1;
    totalPages = Math.ceil(total / pageSize);

    // Update results count
    const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, total);
    
    if (resultsStart) resultsStart.textContent = start;
    if (resultsEnd) resultsEnd.textContent = end;
    if (resultsTotal) resultsTotal.textContent = total;

    // Handle empty state
    if (properties.length === 0) {
      if (emptyState) emptyState.hidden = false;
      updatePagination();
      return;
    }

    // Render properties
    const frag = document.createDocumentFragment();
    properties.forEach((p, i) => frag.appendChild(renderPropertyCard(p, i)));
    grid.appendChild(frag);

    // Scroll reveal
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
    updatePagination();

  } catch (error) {
    console.error('Failed to load properties:', error);
    if (loadingState) loadingState.hidden = true;
    if (emptyState) {
      emptyState.querySelector('.properties-page__empty-title').textContent = 'Failed to load properties';
      emptyState.querySelector('.properties-page__empty-text').textContent = 'Please try again later.';
      emptyState.hidden = false;
    }
  }
}

// Update pagination controls
function updatePagination() {
  const prevBtn = $('#prevPage');
  const nextBtn = $('#nextPage');
  const currentPageEl = $('#currentPage');
  const totalPagesEl = $('#totalPages');

  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
  if (currentPageEl) currentPageEl.textContent = currentPage;
  if (totalPagesEl) totalPagesEl.textContent = totalPages;
}

// Wire property card buttons
function wirePropertyCardButtons() {
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
}

// Initialize filters from URL
function initFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);
  const form = $('#filtersForm');
  if (!form) return;

  // Set form values from URL params
  for (const [key, value] of params.entries()) {
    const input = form.querySelector(`[name="${key}"]`);
    if (input) {
      if (input.type === 'checkbox') {
        input.checked = value === 'true';
      } else {
        input.value = value;
      }
    }
  }

  // Set sort if in URL
  const sortBy = params.get('sortBy');
  const order = params.get('order');
  if (sortBy && order) {
    const sortSelect = $('#sortBy');
    if (sortSelect) {
      sortSelect.value = `${sortBy}-${order}`;
    }
  }

  // Store current filters
  currentFilters = getFiltersFromForm();
}

// Initialize filter form
function initFilterForm() {
  const form = $('#filtersForm');
  const resetBtn = $('#resetFilters');
  const resetFromEmptyBtn = $('#resetFromEmpty');
  const sortBySelect = $('#sortBy');

  if (!form) return;

  // Form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    currentFilters = getFiltersFromForm();
    currentPage = 1;
    loadProperties(currentPage, currentFilters);
    
    // Update URL without page reload
    const url = new URL(window.location);
    for (const key in currentFilters) {
      url.searchParams.set(key, currentFilters[key]);
    }
    window.history.pushState({}, '', url);
  });

  // Live search with debounce
  const searchInput = $('#search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentFilters = getFiltersFromForm();
        currentPage = 1;
        loadProperties(currentPage, currentFilters);
      }, 500);
    });
  }

  // Reset filters
  const resetHandler = () => {
    form.reset();
    if (sortBySelect) sortBySelect.value = 'createdAt-desc';
    currentFilters = {};
    currentPage = 1;
    loadProperties(currentPage, currentFilters);
    
    // Clear URL
    const url = new URL(window.location);
    url.search = '';
    window.history.pushState({}, '', url);
  };

  if (resetBtn) {
    resetBtn.addEventListener('click', resetHandler);
  }

  if (resetFromEmptyBtn) {
    resetFromEmptyBtn.addEventListener('click', resetHandler);
  }

  // Sort change
  if (sortBySelect) {
    sortBySelect.addEventListener('change', () => {
      currentFilters = getFiltersFromForm();
      currentPage = 1;
      loadProperties(currentPage, currentFilters);
    });
  }
}

// Initialize pagination
function initPagination() {
  const prevBtn = $('#prevPage');
  const nextBtn = $('#nextPage');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        loadProperties(currentPage, currentFilters);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        loadProperties(currentPage, currentFilters);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}

// Initialize properties page
function initPropertiesPage() {
  initFiltersFromURL();
  initFilterForm();
  initPagination();
  loadProperties(currentPage, currentFilters);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPropertiesPage);
} else {
  initPropertiesPage();
}
