/**
 * Dwelling — Profile Page JavaScript
 * User profile management, scheduled tour appointments, and saved favorites.
 */

import {
  fetchCurrentUser,
  updateUserProfile,
  logoutUser,
  isAuthenticated,
  fetchMyTours,
  fetchMyFavorites,
  updateTourStatus,
  toggleFavorite,
} from './api.js';
import { $, $$, fmtCurrency } from './shared.js';

// Load user profile
async function loadUserProfile() {
  const loadingState = $('#loadingState');
  const notAuthState = $('#notAuthState');
  const errorState = $('#errorState');
  const profileContent = $('#profileContent');

  // Check authentication
  if (!isAuthenticated()) {
    if (loadingState) loadingState.hidden = true;
    if (notAuthState) notAuthState.hidden = false;
    return;
  }

  try {
    const user = await fetchCurrentUser();

    if (loadingState) loadingState.hidden = true;

    if (!user) {
      if (notAuthState) notAuthState.hidden = false;
      return;
    }

    if (profileContent) profileContent.hidden = false;

    // Update page title
    document.title = `My Profile — Dwelling`;

    // Update profile card
    const profileAvatar = $('#profileAvatar');
    const profileName = $('#profileName');
    const profileEmail = $('#profileEmail');
    const profileRole = $('#profileRole');
    const statFavorites = $('#statFavorites');
    const statReviews = $('#statReviews');
    const statJoined = $('#statJoined');

    if (profileAvatar) {
      profileAvatar.src = user.avatarUrl || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22/%3E';
    }
    if (profileName) profileName.textContent = user.name || 'User';
    if (profileEmail) profileEmail.textContent = user.email || '';
    if (profileRole) profileRole.textContent = user.role === 'AGENT' ? 'Agent' : 'Home Seeker';

    if (statFavorites) statFavorites.textContent = user._count?.favorites || 0;
    if (statReviews) statReviews.textContent = user._count?.reviews || 0;
    if (statJoined) {
      const joinedDate = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : '-';
      statJoined.textContent = joinedDate;
    }

    // Populate form
    const nameInput = $('#name');
    const emailInput = $('#email');
    const phoneInput = $('#phone');
    const roleSelect = $('#role');
    const bioTextarea = $('#bio');
    const avatarUrlInput = $('#avatarUrl');

    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (roleSelect) roleSelect.value = user.role || 'SEEKER';
    if (bioTextarea) bioTextarea.value = user.bio || '';
    if (avatarUrlInput) avatarUrlInput.value = user.avatarUrl || '';

    // Load scheduled tours and saved properties
    loadUserTours();
    loadUserFavorites();

  } catch (error) {
    console.error('Failed to load user profile:', error);
    if (loadingState) loadingState.hidden = true;
    if (errorState) errorState.hidden = false;
  }
}

// Load and render scheduled tours
async function loadUserTours() {
  const toursList = $('#myToursList');
  const countBadge = $('#toursCountBadge');
  if (!toursList) return;

  try {
    const tours = await fetchMyTours();
    const count = Array.isArray(tours) ? tours.length : 0;
    if (countBadge) countBadge.textContent = `${count} Tour${count === 1 ? '' : 's'}`;

    if (!Array.isArray(tours) || tours.length === 0) {
      toursList.innerHTML = '<p style="color: var(--c-muted); font-size: var(--text-sm); margin: var(--s-2) 0;">You have no scheduled tours yet. Browse properties to book a visit!</p>';
      return;
    }

    toursList.innerHTML = tours.map((tour) => {
      const tourDate = new Date(tour.tourDate);
      const formattedDate = tourDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const formattedTime = tourDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const statusColors = {
        REQUESTED: { bg: '#FEF3C7', text: '#92400E' },
        CONFIRMED: { bg: '#D1FAE5', text: '#065F46' },
        COMPLETED: { bg: '#DBEAFE', text: '#1E40AF' },
        CANCELLED: { bg: '#F3F4F6', text: '#6B7280' },
      };
      const badge = statusColors[tour.status] || { bg: '#E2E8F0', text: '#334155' };
      const imgUrl = tour.property?.images?.[0]?.url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%2270%22/%3E';

      const canCancel = tour.status === 'REQUESTED' || tour.status === 'CONFIRMED';

      return `
        <div class="tour-card" data-tour-id="${tour.id}" style="display: flex; justify-content: space-between; align-items: center; padding: var(--s-3); background: var(--c-bg); border-radius: var(--radius-lg); border: 1px solid var(--c-border); flex-wrap: wrap; gap: var(--s-3);">
          <div style="display: flex; align-items: center; gap: var(--s-3);">
            <img src="${imgUrl}" alt="${tour.property?.title || 'Property'}" style="width: 72px; height: 54px; object-fit: cover; border-radius: var(--radius-md);" />
            <div>
              <a href="property-details.html?id=${tour.propertyId}" style="font-weight: 700; color: var(--c-text); text-decoration: none;">${tour.property?.title || 'Property Listing'}</a>
              <p style="font-size: var(--text-xs); color: var(--c-muted); margin: 2px 0 0;">📍 ${tour.property?.city || 'Unknown City'} • ${tour.tourType === 'VIRTUAL' ? '💻 Virtual Video Walkthrough' : '🚶 In-Person Visit'}</p>
              <p style="font-size: var(--text-xs); font-weight: 600; color: var(--c-primary); margin: 2px 0 0;">📅 ${formattedDate} at ${formattedTime}</p>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: var(--s-3);">
            <span style="font-size: var(--text-xs); font-weight: 700; padding: 4px 10px; border-radius: 9999px; background: ${badge.bg}; color: ${badge.text};">${tour.status}</span>
            ${canCancel ? `<button type="button" class="btn btn--outline btn--sm cancel-tour-btn" data-id="${tour.id}" style="font-size: var(--text-xs); padding: 4px 8px;">Cancel</button>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Wire cancel buttons
    $$('.cancel-tour-btn', toursList).forEach((btn) => {
      btn.addEventListener('click', async () => {
        const tourId = btn.getAttribute('data-id');
        if (!confirm('Are you sure you want to cancel this scheduled tour?')) return;
        try {
          btn.disabled = true;
          await updateTourStatus(tourId, 'CANCELLED');
          loadUserTours();
        } catch (err) {
          alert('Failed to cancel tour: ' + err.message);
        } finally {
          btn.disabled = false;
        }
      });
    });

  } catch (error) {
    console.error('Failed to load tours:', error);
    toursList.innerHTML = '<p style="color: var(--c-muted); font-size: var(--text-sm);">Failed to load scheduled tours.</p>';
  }
}

// Load and render user favorites
async function loadUserFavorites() {
  const favList = $('#myFavoritesList');
  const countBadge = $('#favoritesCountBadge');
  const statFavorites = $('#statFavorites');
  if (!favList) return;

  try {
    const favorites = await fetchMyFavorites();
    const count = Array.isArray(favorites) ? favorites.length : 0;
    if (countBadge) countBadge.textContent = `${count} Saved`;
    if (statFavorites) statFavorites.textContent = count;

    if (!Array.isArray(favorites) || favorites.length === 0) {
      favList.innerHTML = '<p style="grid-column: 1 / -1; color: var(--c-muted); font-size: var(--text-sm); padding: var(--s-2) 0;">No saved properties yet. Click the heart icon on any property to save it here!</p>';
      return;
    }

    favList.innerHTML = favorites.map((p) => {
      const imgUrl = p.images?.[0]?.url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22240%22 height=%22160%22/%3E';
      const formattedPrice = fmtCurrency(p.price) + (p.priceType === 'RENT' ? '/mo' : '');

      return `
        <div class="fav-card" style="background: var(--c-bg); border-radius: var(--radius-lg); border: 1px solid var(--c-border); overflow: hidden; display: flex; flex-direction: column;">
          <a href="property-details.html?id=${p.id}" style="display: block; position: relative;">
            <img src="${imgUrl}" alt="${p.title}" style="width: 100%; height: 140px; object-fit: cover;" />
          </a>
          <div style="padding: var(--s-3); flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <p style="font-weight: 700; color: var(--c-primary); margin: 0; font-size: var(--text-base);">${formattedPrice}</p>
              <a href="property-details.html?id=${p.id}" style="font-weight: 600; color: var(--c-text); text-decoration: none; font-size: var(--text-sm); display: block; margin: 2px 0;">${p.title}</a>
              <p style="font-size: var(--text-xs); color: var(--c-muted); margin: 0;">📍 ${p.city || 'Unknown'}</p>
            </div>
            <div style="margin-top: var(--s-3); display: flex; justify-content: space-between; align-items: center;">
              <a href="property-details.html?id=${p.id}" class="btn btn--sm btn--primary" style="font-size: var(--text-xs); padding: 4px 10px;">View</a>
              <button type="button" class="btn btn--sm btn--outline remove-fav-btn" data-id="${p.id}" style="font-size: var(--text-xs); color: #EF4444; border-color: #FECACA; padding: 4px 8px;">Remove</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Wire remove buttons
    $$('.remove-fav-btn', favList).forEach((btn) => {
      btn.addEventListener('click', async () => {
        const propId = btn.getAttribute('data-id');
        try {
          btn.disabled = true;
          await toggleFavorite(propId);
          loadUserFavorites();
        } catch (err) {
          console.error('Failed to remove favorite:', err);
        } finally {
          btn.disabled = false;
        }
      });
    });

  } catch (error) {
    console.error('Failed to load favorites:', error);
    favList.innerHTML = '<p style="color: var(--c-muted); font-size: var(--text-sm);">Failed to load saved properties.</p>';
  }
}

// Initialize profile form
function initProfileForm() {
  const form = $('#profileForm');
  const formMessage = $('#formMessage');
  const cancelBtn = $('#cancelBtn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : 'Save Changes';

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
      }

      if (formMessage) {
        formMessage.hidden = true;
        formMessage.className = 'profile-form__message';
      }

      const name = $('#name')?.value?.trim();
      const email = $('#email')?.value?.trim();
      const phone = $('#phone')?.value?.trim();
      const bio = $('#bio')?.value?.trim();
      const avatarUrl = $('#avatarUrl')?.value?.trim();

      const profileData = {
        name,
        email,
        phone,
        bio,
        avatarUrl,
      };

      const updatedUser = await updateUserProfile(profileData);

      // Update displayed elements
      const profileAvatar = $('#profileAvatar');
      const profileName = $('#profileName');
      const profileEmail = $('#profileEmail');

      if (profileAvatar && profileData.avatarUrl) {
        profileAvatar.src = profileData.avatarUrl;
      }
      if (profileName) profileName.textContent = profileData.name;
      if (profileEmail) profileEmail.textContent = profileData.email;

      if (formMessage) {
        formMessage.hidden = false;
        formMessage.className = 'profile-form__message profile-form__message--success';
        formMessage.textContent = 'Profile updated successfully!';
      }

    } catch (error) {
      console.error('Failed to update profile:', error);
      if (formMessage) {
        formMessage.hidden = false;
        formMessage.className = 'profile-form__message profile-form__message--error';
        formMessage.textContent = error.message || 'Failed to update profile. Please try again.';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  });

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      loadUserProfile();
    });
  }
}

// Initialize logout button
function initLogoutButton() {
  const logoutBtn = $('#logoutBtn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async () => {
    try {
      await logoutUser();
      window.location.href = '../index.html';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  });
}

// Initialize retry button
function initRetryButton() {
  const retryBtn = $('#retryBtn');
  if (!retryBtn) return;

  retryBtn.addEventListener('click', () => {
    const errorState = $('#errorState');
    const loadingState = $('#loadingState');

    if (errorState) errorState.hidden = true;
    if (loadingState) loadingState.hidden = false;

    loadUserProfile();
  });
}

// Initialize change avatar button
function initChangeAvatarButton() {
  const changeAvatarBtn = $('#changeAvatarBtn');
  if (!changeAvatarBtn) return;

  changeAvatarBtn.addEventListener('click', () => {
    const avatarUrlInput = $('#avatarUrl');
    if (avatarUrlInput) {
      avatarUrlInput.focus();
      avatarUrlInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

// Initialize profile page
function initProfilePage() {
  loadUserProfile();
  initProfileForm();
  initLogoutButton();
  initRetryButton();
  initChangeAvatarButton();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProfilePage);
} else {
  initProfilePage();
}
