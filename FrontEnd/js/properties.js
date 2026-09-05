/**
 * Dwelling — Properties Page JavaScript
 * Property search, filtering, and pagination
 */

import { fetchProperties, toggleFavorite, isAuthenticated } from './api.js';
import { $, $$, fmtCurrency, renderPropertyCard } from './shared.js';

// State
let currentPage = 1;
let totalPages = 1;
let currentFilters = {};
let debounceTimer = null;
let activeLoadController = null;
let activeRequestToken = 0;

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

  if (activeLoadController) {
    activeLoadController.abort();
  }

  activeRequestToken += 1;
  const requestToken = activeRequestToken;
  activeLoadController = new AbortController();

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

    const response = await fetchProperties(params, { signal: activeLoadController.signal });

    if (requestToken !== activeRequestToken) {
      return;
    }

    if (loadingState) loadingState.hidden = true;

    const properties = Array.isArray(response) ? response : (response && response.data) || [];
    const meta = response && response.meta ? response.meta : {};
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
    if (error?.name === 'AbortError') {
      return;
    }

    console.error('Failed to load properties:', error);
    if (requestToken === activeRequestToken && loadingState) loadingState.hidden = true;
    if (emptyState) {
      const emptyTitle = emptyState.querySelector('.properties-page__empty-title');
      const emptyText = emptyState.querySelector('.properties-page__empty-text');
      if (emptyTitle) emptyTitle.textContent = 'Failed to load properties';
      if (emptyText) {
        emptyText.textContent = error instanceof Error && error.message
          ? error.message
          : 'Please try again later.';
      }
      emptyState.hidden = false;
    }
  } finally {
    if (activeLoadController && requestToken === activeRequestToken) {
      activeLoadController = null;
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
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isAuthenticated()) {
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
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
