/**
 * Dwelling — Property Details Page JavaScript
 * Dynamic property loading, interactive gallery, live favorites,
 * tour booking modal, agent profile display, and review submission.
 */

import {
  fetchPropertyById,
  toggleFavorite,
  bookTour,
  createPropertyReview,
  isAuthenticated,
} from './api.js';
import { $, $$, fmtCurrency } from './shared.js';

// State
let currentImageIndex = 0;
let propertyImages = [];
let currentProperty = null;

const DEFAULT_PROPERTY_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 500%22 width=%22100%25%22 height=%22100%25%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%231E293B%22/%3E%3Cpath d=%22M360 210 L400 170 L440 210 L440 290 L360 290 Z%22 fill=%22none%22 stroke=%22%2364748B%22 stroke-width=%228%22 stroke-linejoin=%22round%22/%3E%3Cpath d=%22M385 290 L385 245 L415 245 L415 290%22 fill=%22none%22 stroke=%22%2364748B%22 stroke-width=%228%22/%3E%3Ctext x=%2250%25%22 y=%22340%22 text-anchor=%22middle%22 fill=%22%2394A3B8%22 font-family=%22sans-serif%22 font-size=%2218%22%3ENo Image Available%3C/text%3E%3C/svg%3E';

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

// Calculate average rating from reviews array
function calculateAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
  return sum / reviews.length;
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
    currentProperty = property;

    if (loadingState) loadingState.hidden = true;

    if (!property || !property.id) {
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

    // Update gallery with normalized images and fallback placeholder
    const rawImages = Array.isArray(property.images) ? property.images : [];
    propertyImages = rawImages
      .map((img, idx) => {
        if (typeof img === 'string' && img.trim()) {
          return { url: img.trim(), altText: `${property.title || 'Property'} - Image ${idx + 1}` };
        }
        if (img && typeof img === 'object' && typeof img.url === 'string' && img.url.trim()) {
          return { url: img.url.trim(), altText: img.altText || `${property.title || 'Property'} - Image ${idx + 1}` };
        }
        return null;
      })
      .filter(Boolean);

    if (propertyImages.length === 0) {
      propertyImages = [{ url: DEFAULT_PROPERTY_IMAGE, altText: property.title || 'Property photo' }];
    }

    currentImageIndex = 0;
    updateGallery();
    renderGalleryThumbs();

    const galleryNav = $('#galleryNav');
    if (galleryNav) {
      galleryNav.hidden = propertyImages.length <= 1;
    }

    // Update specifications
    const specBeds = $('#specBeds');
    const specBaths = $('#specBaths');
    const specSqft = $('#specSqft');
    const specType = $('#specType');
    const specPriceType = $('#specPriceType');
    const specStatus = $('#specStatus');

    if (specBeds) specBeds.textContent = property.beds || 0;
    if (specBaths) specBaths.textContent = property.bathrooms || property.baths || 0;
    if (specSqft) specSqft.textContent = Number(property.sqft || 0).toLocaleString();
    if (specType) specType.textContent = property.type || 'House';
    if (specPriceType) specPriceType.textContent = property.priceType === 'RENT' ? 'For Rent' : 'For Sale';
    if (specStatus) specStatus.textContent = property.status || 'AVAILABLE';

    // Update description
    const propertyDescription = $('#propertyDescription');
    if (propertyDescription) {
      propertyDescription.innerHTML = `<p>${property.description || 'No description provided for this listing.'}</p>`;
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
    if (featureBeds) featureBeds.textContent = property.beds || 0;
    if (featureBaths) featureBaths.textContent = property.bathrooms || property.baths || 0;
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
      const agentAgency = $('#agentAgency');
      const agentPhone = $('#agentPhone');
      const agentEmail = $('#agentEmail');

      if (agentAvatar) {
        agentAvatar.src = agent.avatarUrl || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22/%3E';
        agentAvatar.alt = agent.name || 'Agent';
      }
      if (agentName) agentName.textContent = agent.name || 'Agent';
      if (agentRole) agentRole.textContent = agent.role || 'Property Agent';
      if (agentRatingValue) {
        agentRatingValue.textContent = agent.agentProfile?.rating ? agent.agentProfile.rating.toFixed(1) : '4.9';
      }
      if (agentAgency) {
        agentAgency.textContent = agent.agentProfile?.agencyName || 'Dwelling Verified Agency';
      }
      if (agentPhone) {
        agentPhone.textContent = agent.phone ? `📞 ${agent.phone}` : '📞 Contact agency for inquiries';
      }
      if (agentEmail) {
        agentEmail.textContent = agent.email ? `✉️ ${agent.email}` : '';
      }
    }

    // Update reviews list
    renderReviews(property.reviews || []);

    // Initialize live features
    initFavoriteButton(property);
    initTourBooking(property);
    initReviewForm(property);
    initAgentInquiry(property);

  } catch (error) {
    console.error('Failed to load property details:', error);
    if (loadingState) loadingState.hidden = true;
    if (errorState) errorState.hidden = false;
  }
}

// Neutral user silhouette icon SVG for anonymous or missing-name fallbacks
const USER_ICON_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

// Brand-tailored harmonious avatar color palettes
const REVIEWER_AVATAR_PALETTES = [
  { bg: 'hsl(221 83% 95%)', color: 'hsl(221 83% 40%)', border: 'hsl(221 83% 85%)' }, // Primary blue
  { bg: 'hsl(161 64% 92%)', color: 'hsl(161 72% 30%)', border: 'hsl(161 64% 78%)' }, // Emerald green
  { bg: 'hsl(28 100% 93%)', color: 'hsl(20 95% 42%)', border: 'hsl(28 100% 80%)' },  // Coral accent
  { bg: 'hsl(253 100% 95%)', color: 'hsl(253 82% 50%)', border: 'hsl(253 100% 84%)' }, // Violet
  { bg: 'hsl(199 89% 93%)', color: 'hsl(199 89% 34%)', border: 'hsl(199 89% 80%)' }, // Ocean sky
  { bg: 'hsl(330 81% 94%)', color: 'hsl(330 81% 42%)', border: 'hsl(330 81% 84%)' }, // Berry rose
];

// Simple HTML escaper to sanitize user-generated inputs in reviews
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Generate user initials for avatar fallback (e.g., "Mohammad Alamour" -> "MA", "Sarah" -> "S")
function getReviewerInitials(name) {
  if (!name || typeof name !== 'string') return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Deterministically pick an avatar palette based on author's name
function getReviewerPalette(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % REVIEWER_AVATAR_PALETTES.length;
  return REVIEWER_AVATAR_PALETTES[index];
}

// Validate avatar URL against empty or legacy placeholder data URIs
function isValidAvatarUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  // Guard against legacy blank SVG placeholders
  if (trimmed.startsWith('data:image/svg+xml') && (trimmed.includes('width=%2240%22') || trimmed.includes('width="40"') || trimmed.length < 120)) {
    return false;
  }
  return true;
}

// Format review submission date
function formatReviewDate(dateStr) {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (_e) {
    return 'Recently';
  }
}

// Render reviewer avatar with dynamic initials fallback & error recovery
function renderReviewAvatar(reviewer) {
  const name = reviewer?.name || 'Home Seeker';
  const initials = getReviewerInitials(name);
  const palette = getReviewerPalette(name);
  const avatarUrl = reviewer?.avatarUrl?.trim();
  const hasValidAvatar = isValidAvatarUrl(avatarUrl);
  const fallbackInner = initials || USER_ICON_SVG;

  if (hasValidAvatar) {
    return `
      <div class="review-card__avatar-wrap">
        <img 
          src="${escapeHtml(avatarUrl)}" 
          alt="${escapeHtml(name)}" 
          class="review-card__avatar" 
          loading="lazy"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        />
        <div class="review-card__avatar-fallback" style="display: none; background: ${palette.bg}; color: ${palette.color}; border: 1px solid ${palette.border};" aria-hidden="true">
          ${fallbackInner}
        </div>
      </div>
    `;
  }

  return `
    <div class="review-card__avatar-wrap">
      <div class="review-card__avatar-fallback" style="background: ${palette.bg}; color: ${palette.color}; border: 1px solid ${palette.border};" aria-label="${escapeHtml(name)}">
        ${fallbackInner}
      </div>
    </div>
  `;
}

// Render reviews UI
function renderReviews(reviews) {
  const ratingStars = $('#ratingStars');
  const ratingValue = $('#ratingValue');
  const ratingCount = $('#ratingCount');
  const reviewsList = $('#reviewsList');

  const avg = calculateAverageRating(reviews);
  if (ratingStars) ratingStars.innerHTML = renderStars(avg);
  if (ratingValue) ratingValue.textContent = avg > 0 ? avg.toFixed(1) : '0.0';
  if (ratingCount) ratingCount.textContent = reviews.length;

  if (reviewsList) {
    if (!reviews || reviews.length === 0) {
      reviewsList.innerHTML = '<p class="reviews-list__empty">No reviews yet. Be the first to share your experience!</p>';
    } else {
      reviewsList.innerHTML = reviews.map((review) => {
        const reviewer = review.reviewer || {};
        const authorName = reviewer.name || 'Home Seeker';
        const formattedDate = formatReviewDate(review.createdAt);
        const isoDate = review.createdAt ? new Date(review.createdAt).toISOString() : '';
        const comment = review.comment || '';

        return `
          <article class="review-card">
            <header class="review-card__header">
              <div class="review-card__reviewer">
                ${renderReviewAvatar(reviewer)}
                <div class="review-card__author">
                  <h4 class="review-card__name">${escapeHtml(authorName)}</h4>
                  <time class="review-card__date"${isoDate ? ` datetime="${escapeHtml(isoDate)}"` : ''}>${escapeHtml(formattedDate)}</time>
                </div>
              </div>
              <div class="review-card__rating" aria-label="${review.rating || 5} out of 5 stars">
                ${renderStars(review.rating || 5)}
              </div>
            </header>
            <div class="review-card__body">
              <p class="review-card__text">${escapeHtml(comment)}</p>
            </div>
          </article>
        `;
      }).join('');
    }
  }
}

// Update gallery image display
function updateGallery() {
  const mainImage = $('#mainImage');
  if (mainImage && propertyImages[currentImageIndex]) {
    const currentImg = propertyImages[currentImageIndex];
    mainImage.src = currentImg.url;
    mainImage.alt = currentImg.altText || 'Property photo';
    mainImage.onerror = function () {
      this.onerror = null;
      this.src = DEFAULT_PROPERTY_IMAGE;
    };
  }

  $$('.gallery-thumb').forEach((thumb, index) => {
    if (index === currentImageIndex) {
      thumb.classList.add('gallery-thumb--active');
    } else {
      thumb.classList.remove('gallery-thumb--active');
    }
  });
}

// Render gallery thumbnails
function renderGalleryThumbs() {
  const thumbsContainer = $('#galleryThumbs');
  if (!thumbsContainer) return;
  if (propertyImages.length <= 1) {
    thumbsContainer.innerHTML = '';
    return;
  }

  thumbsContainer.innerHTML = propertyImages.map((img, index) => `
    <div class="gallery-thumb ${index === currentImageIndex ? 'gallery-thumb--active' : ''}" data-index="${index}">
      <img src="${img.url}" alt="${img.altText || 'Thumbnail'}" onerror="this.onerror=null;this.src='${DEFAULT_PROPERTY_IMAGE}'" />
    </div>
  `).join('');

  $$('.gallery-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      currentImageIndex = parseInt(thumb.dataset.index, 10);
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

// Initialize favorite button with real backend persistence
function initFavoriteButton(property) {
  const favoriteBtn = $('#favoriteBtn');
  const favoriteBtnText = $('#favoriteBtnText');
  if (!favoriteBtn) return;

  function updateFavoriteVisual(isFav) {
    favoriteBtn.setAttribute('aria-pressed', String(isFav));
    const svg = favoriteBtn.querySelector('svg path');
    if (svg) {
      if (isFav) {
        svg.setAttribute('fill', 'currentColor');
        favoriteBtn.style.color = 'var(--c-accent)';
        if (favoriteBtnText) favoriteBtnText.textContent = 'Saved';
      } else {
        svg.setAttribute('fill', 'none');
        favoriteBtn.style.color = '';
        if (favoriteBtnText) favoriteBtnText.textContent = 'Save';
      }
    }
  }

  // Set initial state from backend
  updateFavoriteVisual(Boolean(property.isFavorite));

  favoriteBtn.addEventListener('click', async () => {
    if (!isAuthenticated()) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `login.html?redirect=${returnUrl}`;
      return;
    }

    try {
      favoriteBtn.disabled = true;
      const result = await toggleFavorite(property.id);
      const isFav = Boolean(result.isFavorite);
      updateFavoriteVisual(isFav);

      // Micro-animation
      favoriteBtn.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }],
        { duration: 300, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
      );
    } catch (err) {
      console.error('Favorite toggle error:', err);
    } finally {
      favoriteBtn.disabled = false;
    }
  });
}

// Initialize Tour Booking Modal & Submission
function initTourBooking(property) {
  const scheduleTourBtn = $('#scheduleTourBtn');
  const tourModal = $('#tourModal');
  const closeTourModal = $('#closeTourModal');
  const tourModalBackdrop = $('#tourModalBackdrop');
  const tourBookingForm = $('#tourBookingForm');
  const tourDateInput = $('#tourDateInput');
  const tourTimeSelect = $('#tourTimeSelect');
  const tourNotesInput = $('#tourNotesInput');
  const tourFormMessage = $('#tourFormMessage');
  const submitTourBtn = $('#submitTourBtn');
  const tourPropertyTitle = $('#tourPropertyTitle');

  if (!scheduleTourBtn || !tourModal) return;

  if (tourPropertyTitle) {
    tourPropertyTitle.textContent = property.title || 'this property';
  }

  // Set minimum date to tomorrow
  if (tourDateInput) {
    const tomorrow = new Date(Date.now() + 86400000);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    tourDateInput.min = tomorrowStr;
    tourDateInput.value = tomorrowStr;
  }

  function openModal() {
    if (!isAuthenticated()) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `login.html?redirect=${returnUrl}`;
      return;
    }
    tourModal.hidden = false;
    if (tourFormMessage) {
      tourFormMessage.style.display = 'none';
      tourFormMessage.textContent = '';
    }
  }

  function closeModal() {
    tourModal.hidden = true;
  }

  scheduleTourBtn.addEventListener('click', openModal);
  if (closeTourModal) closeTourModal.addEventListener('click', closeModal);
  if (tourModalBackdrop) tourModalBackdrop.addEventListener('click', closeModal);

  if (tourBookingForm) {
    tourBookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const dateVal = tourDateInput?.value;
      const timeVal = tourTimeSelect?.value || '14:00:00';
      const tourTypeRadio = document.querySelector('input[name="tourTypeRadio"]:checked');
      const tourType = tourTypeRadio ? tourTypeRadio.value : 'IN_PERSON';
      const notes = tourNotesInput?.value?.trim();

      if (!dateVal) {
        showTourMessage('Please select a date for your visit.', 'error');
        return;
      }

      const tourDate = `${dateVal}T${timeVal}`;

      try {
        if (submitTourBtn) {
          submitTourBtn.disabled = true;
          submitTourBtn.textContent = 'Scheduling...';
        }

        await bookTour({
          propertyId: property.id,
          tourDate,
          tourType,
          notes,
        });

        showTourMessage('🎉 Tour requested successfully! The agent will confirm your appointment shortly.', 'success');

        setTimeout(() => {
          closeModal();
          if (submitTourBtn) {
            submitTourBtn.disabled = false;
            submitTourBtn.textContent = 'Confirm & Request Tour';
          }
        }, 2000);
      } catch (err) {
        console.error('Tour booking error:', err);
        showTourMessage(err.message || 'Failed to schedule tour. Please try again.', 'error');
        if (submitTourBtn) {
          submitTourBtn.disabled = false;
          submitTourBtn.textContent = 'Confirm & Request Tour';
        }
      }
    });
  }

  function showTourMessage(msg, type) {
    if (!tourFormMessage) return;
    tourFormMessage.style.display = 'block';
    tourFormMessage.textContent = msg;
    if (type === 'success') {
      tourFormMessage.style.background = '#ECFDF5';
      tourFormMessage.style.color = '#065F46';
      tourFormMessage.style.border = '1px solid #A7F3D0';
    } else {
      tourFormMessage.style.background = '#FEF2F2';
      tourFormMessage.style.color = '#991B1B';
      tourFormMessage.style.border = '1px solid #FECACA';
    }
  }
}

// Initialize Review Authoring Form
function initReviewForm(property) {
  const reviewForm = $('#reviewForm');
  const starRatingPicker = $('#starRatingPicker');
  const reviewRatingInput = $('#reviewRatingInput');
  const reviewCommentInput = $('#reviewCommentInput');
  const reviewFormMessage = $('#reviewFormMessage');
  const submitReviewBtn = $('#submitReviewBtn');

  if (!reviewForm || !starRatingPicker) return;

  // Star selector interactivity
  const stars = $$('.star-picker-item', starRatingPicker);
  let currentRating = 5;

  function updateStars(val) {
    currentRating = val;
    if (reviewRatingInput) reviewRatingInput.value = String(val);
    stars.forEach((star) => {
      const starVal = parseInt(star.dataset.star, 10);
      star.style.color = starVal <= val ? '#F59E0B' : '#CBD5E1';
    });
  }

  updateStars(5);

  stars.forEach((star) => {
    star.addEventListener('click', () => {
      const val = parseInt(star.dataset.star, 10);
      updateStars(val);
    });
  });

  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!isAuthenticated()) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `login.html?redirect=${returnUrl}`;
      return;
    }

    const comment = reviewCommentInput?.value?.trim();
    if (!comment) return;

    try {
      if (submitReviewBtn) {
        submitReviewBtn.disabled = true;
        submitReviewBtn.textContent = 'Submitting...';
      }

      const newReview = await createPropertyReview(property.id, {
        rating: currentRating,
        comment,
      });

      // Update local reviews list
      const updatedReviews = [newReview, ...(property.reviews || [])];
      property.reviews = updatedReviews;
      renderReviews(updatedReviews);

      if (reviewCommentInput) reviewCommentInput.value = '';
      if (reviewFormMessage) {
        reviewFormMessage.style.display = 'block';
        reviewFormMessage.style.color = '#065F46';
        reviewFormMessage.textContent = '🎉 Your review has been published!';
        setTimeout(() => {
          reviewFormMessage.style.display = 'none';
        }, 3000);
      }
    } catch (err) {
      console.error('Review submit error:', err);
      if (reviewFormMessage) {
        reviewFormMessage.style.display = 'block';
        reviewFormMessage.style.color = '#991B1B';
        reviewFormMessage.textContent = err.message || 'Failed to submit review.';
      }
    } finally {
      if (submitReviewBtn) {
        submitReviewBtn.disabled = false;
        submitReviewBtn.textContent = 'Publish Review';
      }
    }
  });
}

// Interactive client-side inquiry state for Agent Information Component
function initAgentInquiry(property) {
  const openBtn = $('#openInquiryBtn');
  const cancelBtn = $('#cancelInquiryBtn');
  const sendBtn = $('#sendInquiryBtn');
  const actionsContainer = $('#agentCardActions');
  const inquiryForm = $('#agentInquiryForm');
  const inquiryText = $('#agentInquiryText');
  const charCount = $('#inquiryCharCount');
  const successBox = $('#agentInquirySuccess');
  const successTitle = $('#inquirySuccessTitle');
  const successDesc = $('#inquirySuccessDesc');
  const dismissBtn = $('#dismissSuccessBtn');

  if (!openBtn || !inquiryForm || !actionsContainer) return;

  const agentName = property?.agent?.name || 'Agent';
  const agentFirstName = agentName.split(' ')[0] || 'the agent';

  // Customize dynamic placeholder
  if (inquiryText) {
    inquiryText.placeholder = `Ask ${agentFirstName} about availability, tours, or lease terms...`;
  }

  let resetTimer = null;

  function showDefaultState() {
    if (resetTimer) {
      clearTimeout(resetTimer);
      resetTimer = null;
    }
    inquiryForm.classList.remove('is-active');
    inquiryForm.setAttribute('aria-hidden', 'true');
    successBox?.classList.remove('is-visible');
    actionsContainer.style.display = 'flex';

    if (inquiryText) {
      inquiryText.value = '';
      inquiryText.disabled = false;
      inquiryText.classList.remove('is-invalid');
    }
    if (charCount) charCount.textContent = '0/300';
    if (sendBtn) {
      sendBtn.disabled = false;
      const label = sendBtn.querySelector('.send-label');
      if (label) label.textContent = 'Send';
      const icon = sendBtn.querySelector('.send-icon');
      if (icon) icon.style.display = 'inline-block';
      const spinner = sendBtn.querySelector('.spinner-inline');
      if (spinner) spinner.remove();
    }
    if (cancelBtn) cancelBtn.disabled = false;
  }

  function showInquiryState() {
    if (resetTimer) {
      clearTimeout(resetTimer);
      resetTimer = null;
    }
    successBox?.classList.remove('is-visible');
    actionsContainer.style.display = 'none';
    inquiryForm.classList.add('is-active');
    inquiryForm.setAttribute('aria-hidden', 'false');
    inquiryText?.focus();
  }

  function showSuccessState() {
    inquiryForm.classList.remove('is-active');
    inquiryForm.setAttribute('aria-hidden', 'true');
    actionsContainer.style.display = 'none';

    if (successTitle) successTitle.textContent = `Message sent to ${agentName}!`;
    if (successDesc) successDesc.textContent = `${agentFirstName} will get back to you shortly at your contact details.`;
    if (successBox) successBox.classList.add('is-visible');

    // Auto-reset back to default after 5 seconds
    resetTimer = setTimeout(() => {
      showDefaultState();
    }, 5000);
  }

  openBtn.onclick = () => {
    showInquiryState();
  };

  if (cancelBtn) {
    cancelBtn.onclick = () => {
      showDefaultState();
    };
  }

  if (dismissBtn) {
    dismissBtn.onclick = () => {
      showDefaultState();
    };
  }

  if (inquiryText) {
    inquiryText.oninput = () => {
      inquiryText.classList.remove('is-invalid');
      const len = inquiryText.value.length;
      if (charCount) charCount.textContent = `${len}/300`;
    };
  }

  if (sendBtn) {
    sendBtn.onclick = () => {
      const message = inquiryText?.value?.trim();
      if (!message) {
        inquiryText?.classList.add('is-invalid');
        inquiryText?.focus();
        return;
      }

      // Transition to sending loading state
      sendBtn.disabled = true;
      if (cancelBtn) cancelBtn.disabled = true;
      if (inquiryText) inquiryText.disabled = true;

      const label = sendBtn.querySelector('.send-label');
      if (label) label.textContent = 'Sending...';
      const icon = sendBtn.querySelector('.send-icon');
      if (icon) icon.style.display = 'none';

      let spinner = sendBtn.querySelector('.spinner-inline');
      if (!spinner) {
        spinner = document.createElement('span');
        spinner.className = 'spinner-inline';
        sendBtn.prepend(spinner);
      }

      // Mock network latency (800ms)
      setTimeout(() => {
        showSuccessState();
      }, 800);
    };
  }
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
