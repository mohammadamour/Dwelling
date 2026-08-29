/**
 * Dwelling — Property Details Page JavaScript
 * Dynamic property loading and gallery functionality
 */

import { fetchPropertyById } from './api.js';
import { $, $$, fmtCurrency } from './shared.js';

// State
let currentImageIndex = 0;
let propertyImages = [];

// Get property ID from URL
function getPropertyId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// Format price
function formatPrice(price, priceType) {
  const formatted = fmtCurrency(price);
  return priceType === 'RENT' ? formatted + '/mo' : formatted;
}

// Render stars
function renderStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  let starsHtml = '';
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      starsHtml += '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>';
    } else if (i === fullStars && hasHalfStar) {
      starsHtml += '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" fill-opacity="0.5"/></svg>';
    } else {
      starsHtml += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>';
    }
  }
  
  return starsHtml;
}

// Load property details
async function loadPropertyDetails() {
  const propertyId = getPropertyId();
  const loadingState = $('#loadingState');
  const errorState = $('#errorState');
  const propertyContent = $('#propertyContent');

  if (!propertyId) {
    if (loadingState) loadingState.hidden = true;
    if (errorState) errorState.hidden = false;
    return;
  }

  try {
    const property = await fetchPropertyById(propertyId);
    
    if (loadingState) loadingState.hidden = true;

    if (!property) {
      if (errorState) errorState.hidden = false;
      return;
    }

    if (propertyContent) propertyContent.hidden = false;

    // Update page title
    document.title = `${property.title || 'Property Details'} — Dwelling`;

    // Update header
    const breadcrumbTitle = $('#breadcrumbTitle');
    const propertyTitle = $('#propertyTitle');
    const propertyCity = $('#propertyCity');
    const propertyType = $('#propertyType');
    const featuredBadge = $('#featuredBadge');

    if (breadcrumbTitle) breadcrumbTitle.textContent = property.title || 'Property';
    if (propertyTitle) propertyTitle.textContent = property.title || 'Property';
    if (propertyCity) propertyCity.textContent = property.city || 'Unknown';
    if (propertyType) propertyType.textContent = property.type || 'House';
    if (featuredBadge) featuredBadge.hidden = !property.featured;

    // Update gallery
    propertyImages = property.images || [];
    if (propertyImages.length > 0) {
      updateGallery();
      renderGalleryThumbs();
      
      const galleryNav = $('#galleryNav');
      if (galleryNav && propertyImages.length > 1) {
        galleryNav.hidden = false;
      }
    }

    // Update specifications
    const specBeds = $('#specBeds');
    const specBaths = $('#specBaths');
    const specSqft = $('#specSqft');
    const specType = $('#specType');
    const specPriceType = $('#specPriceType');
    const specStatus = $('#specStatus');

    if (specBeds) specBeds.textContent = property.beds === 0 ? 'Studio' : property.beds;
    if (specBaths) specBaths.textContent = property.baths;
    if (specSqft) specSqft.textContent = Number(property.sqft || 0).toLocaleString();
    if (specType) specType.textContent = property.type || 'House';
    if (specPriceType) specPriceType.textContent = property.priceType === 'RENT' ? 'For Rent' : 'For Sale';
    if (specStatus) specStatus.textContent = property.status || 'Available';

    // Update description
    const propertyDescription = $('#propertyDescription');
    if (propertyDescription) {
      propertyDescription.innerHTML = `<p>${property.description || 'No description available.'}</p>`;
    }

    // Update price card
    const priceValue = $('#priceValue');
    const priceTypeLabel = $('#priceTypeLabel');
    const featureBeds = $('#featureBeds');
    const featureBaths = $('#featureBaths');
    const featureSqft = $('#featureSqft');
    const featureCity = $('#featureCity');

    if (priceValue) priceValue.textContent = formatPrice(property.price, property.priceType);
    if (priceTypeLabel) priceTypeLabel.textContent = property.priceType === 'RENT' ? 'For Rent' : 'For Sale';
    if (featureBeds) featureBeds.textContent = property.beds === 0 ? 'Studio' : property.beds;
    if (featureBaths) featureBaths.textContent = property.baths;
    if (featureSqft) featureSqft.textContent = Number(property.sqft || 0).toLocaleString();
    if (featureCity) featureCity.textContent = property.city || 'Unknown';

    // Update agent info
    const agent = property.agent;
    const agentCard = $('#agentCard');
    if (agent && agentCard) {
      const agentAvatar = $('#agentAvatar');
      const agentName = $('#agentName');
      const agentRole = $('#agentRole');
      const agentRatingValue = $('#agentRatingValue');

      if (agentAvatar) {
        agentAvatar.src = agent.avatarUrl || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22/%3E';
        agentAvatar.alt = agent.name || 'Agent';
      }
      if (agentName) agentName.textContent = agent.name || 'Agent';
      if (agentRole) agentRole.textContent = agent.role || 'Property Agent';
      if (agentRatingValue) agentRatingValue.textContent = agent.agentProfile?.rating?.toFixed(1) || '0.0';
    }

    // Update reviews
    const reviews = property.reviews || [];
    const ratingStars = $('#ratingStars');
    const ratingValue = $('#ratingValue');
    const ratingCount = $('#ratingCount');
    const reviewsList = $('#reviewsList');

    if (ratingStars) ratingStars.innerHTML = renderStars(calculateAverageRating(reviews));
    if (ratingValue) ratingValue.textContent = calculateAverageRating(reviews).toFixed(1);
    if (ratingCount) ratingCount.textContent = reviews.length;

    if (reviewsList) {
      if (reviews.length === 0) {
        reviewsList.innerHTML = '<p style="color: var(--c-muted);">No reviews yet.</p>';
      } else {
        reviewsList.innerHTML = reviews.map(review => `
          <div class="review-card">
            <div class="review-card__header">
              <img src="${review.reviewer?.avatarUrl || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2244%22 height=%2244%22/%3E'}" alt="${review.reviewer?.name || 'User'}" class="review-card__avatar" />
              <div class="review-card__author">
                <p class="review-card__name">${review.reviewer?.name || 'Anonymous'}</p>
                <p class="review-card__date">${new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
              <div class="review-card__rating">
                ${renderStars(review.rating)}
              </div>
            </div>
            <p class="review-card__text">${review.comment || 'No comment provided.'}</p>
          </div>
        `).join('');
      }
    }

    // Initialize favorite button
    initFavoriteButton();

  } catch (error) {
    console.error('Failed to load property details:', error);
    if (loadingState) loadingState.hidden = true;
    if (errorState) errorState.hidden = false;
  }
}

// Calculate average rating
function calculateAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
  return sum / reviews.length;
}

// Update main gallery image
function updateGallery() {
  const mainImage = $('#mainImage');
  if (!mainImage || propertyImages.length === 0) return;

  const currentImage = propertyImages[currentImageIndex];
  mainImage.src = currentImage.url || '';
  mainImage.alt = currentImage.altText || 'Property image';

  // Update thumbnail active states
  $$('.gallery-thumb').forEach((thumb, index) => {
    thumb.classList.toggle('active', index === currentImageIndex);
  });

  // Update nav buttons
  const prevBtn = $('#prevImage');
  const nextBtn = $('#nextImage');
  if (prevBtn) prevBtn.disabled = currentImageIndex === 0;
  if (nextBtn) nextBtn.disabled = currentImageIndex === propertyImages.length - 1;
}

// Render gallery thumbnails
function renderGalleryThumbs() {
  const galleryThumbs = $('#galleryThumbs');
  if (!galleryThumbs || propertyImages.length === 0) return;

  galleryThumbs.innerHTML = propertyImages.map((image, index) => `
    <div class="gallery-thumb ${index === currentImageIndex ? 'active' : ''}" data-index="${index}">
      <img src="${image.url || ''}" alt="${image.altText || 'Property image'}" loading="lazy" />
    </div>
  `).join('');

  // Add click handlers
  $$('.gallery-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      currentImageIndex = parseInt(thumb.dataset.index);
      updateGallery();
    });
  });
}

// Initialize gallery navigation
function initGalleryNavigation() {
  const prevBtn = $('#prevImage');
  const nextBtn = $('#nextImage');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentImageIndex > 0) {
        currentImageIndex--;
        updateGallery();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentImageIndex < propertyImages.length - 1) {
        currentImageIndex++;
        updateGallery();
      }
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && currentImageIndex > 0) {
      currentImageIndex--;
      updateGallery();
    } else if (e.key === 'ArrowRight' && currentImageIndex < propertyImages.length - 1) {
      currentImageIndex++;
      updateGallery();
    }
  });
}

// Initialize favorite button
function initFavoriteButton() {
  const favoriteBtn = $('#favoriteBtn');
  if (!favoriteBtn) return;

  favoriteBtn.addEventListener('click', () => {
    const isSaved = favoriteBtn.getAttribute('aria-pressed') === 'true';
    favoriteBtn.setAttribute('aria-pressed', String(!isSaved));
    
    const svg = favoriteBtn.querySelector('svg path');
    if (svg) {
      if (!isSaved) {
        svg.setAttribute('fill', 'currentColor');
        favoriteBtn.style.color = 'var(--c-accent)';
      } else {
        svg.setAttribute('fill', 'none');
        favoriteBtn.style.color = '';
      }
    }

    favoriteBtn.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }],
      { duration: 300, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
    );
  });
}

// Initialize property details page
function initPropertyDetails() {
  loadPropertyDetails();
  initGalleryNavigation();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPropertyDetails);
} else {
  initPropertyDetails();
}
