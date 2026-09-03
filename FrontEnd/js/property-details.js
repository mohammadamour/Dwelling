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
    if (reviews.length === 0) {
      reviewsList.innerHTML = '<p style="color: var(--c-muted); padding: var(--s-3) 0;">No reviews yet. Be the first to share your experience!</p>';
    } else {
      reviewsList.innerHTML = reviews.map((review) => `
        <div class="review-card" style="padding: var(--s-4) 0; border-bottom: 1px solid var(--c-border);">
          <div class="review-card__header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--s-2);">
            <div style="display: flex; align-items: center; gap: var(--s-3);">
              <img src="${review.reviewer?.avatarUrl || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22/%3E'}" alt="${review.reviewer?.name || 'User'}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />
              <div>
                <p style="font-weight: 600; margin: 0;">${review.reviewer?.name || 'Home Seeker'}</p>
                <p style="font-size: var(--text-xs); color: var(--c-muted); margin: 0;">${new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div style="color: #F59E0B; display: flex; align-items: center; gap: 2px;">
              ${renderStars(review.rating)}
            </div>
          </div>
          <p style="margin: 0; color: var(--c-text); font-size: var(--text-sm); line-height: 1.6;">${review.comment || ''}</p>
        </div>
      `).join('');
    }
  }
}

// Update gallery image display
function updateGallery() {
  const mainImage = $('#mainImage');
  if (mainImage && propertyImages[currentImageIndex]) {
    mainImage.src = propertyImages[currentImageIndex].url;
    mainImage.alt = propertyImages[currentImageIndex].altText || 'Property photo';
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
  if (!thumbsContainer || propertyImages.length <= 1) return;

  thumbsContainer.innerHTML = propertyImages.map((img, index) => `
    <div class="gallery-thumb ${index === currentImageIndex ? 'gallery-thumb--active' : ''}" data-index="${index}">
      <img src="${img.url}" alt="${img.altText || 'Thumbnail'}" />
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
