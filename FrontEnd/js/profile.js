/**
 * Dwelling — Profile Page JavaScript
 * User profile management, scheduled tour appointments, saved favorites,
 * and (for agents) managed property listings with edit/delete controls.
 */

import {
  fetchCurrentUser,
  updateUserProfile,
  logoutUser,
  isAuthenticated,
  getAuthUser,
  fetchMyTours,
  fetchMyFavorites,
  fetchMyListings,
  deleteProperty,
  updateTourStatus,
  toggleFavorite,
} from './api.js';
import { $, $$, fmtCurrency, optimizeImageUrl } from './shared.js';

// ─── Profile loader ───────────────────────────────────────────────────────────

async function loadUserProfile() {
  const loadingState = $('#loadingState');
  const notAuthState = $('#notAuthState');
  const errorState   = $('#errorState');
  const profileContent = $('#profileContent');

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

    document.title = `My Profile — Dwelling`;

    const profileAvatar  = $('#profileAvatar');
    const profileName    = $('#profileName');
    const profileEmail   = $('#profileEmail');
    const profileRole    = $('#profileRole');
    const statFavorites  = $('#statFavorites');
    const statReviews    = $('#statReviews');
    const statJoined     = $('#statJoined');

    if (profileAvatar) {
      profileAvatar.src = user.avatarUrl || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22/%3E';
    }
    if (profileName)  profileName.textContent  = user.name  || 'User';
    if (profileEmail) profileEmail.textContent = user.email || '';
    if (profileRole)  profileRole.textContent  = user.role === 'AGENT' ? 'Agent' : (user.role === 'ADMIN' ? 'Admin' : 'Home Seeker');

    if (statFavorites) statFavorites.textContent = user._count?.favorites || 0;
    if (statReviews)   statReviews.textContent   = user._count?.reviews   || 0;
    if (statJoined) {
      const joinedDate = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : '-';
      statJoined.textContent = joinedDate;
    }

    // Populate form
    const setVal = (id, val) => { const el = $(`#${id}`); if (el) el.value = val || ''; };
    setVal('name', user.name);
    setVal('email', user.email);
    setVal('phone', user.phone);
    setVal('bio', user.bio);
    setVal('avatarUrl', user.avatarUrl);
    const roleSelect = $('#role');
    if (roleSelect) roleSelect.value = user.role || 'SEEKER';

    // Load data sections
    loadUserTours();
    loadUserFavorites();

    // Agent-only: show listings section
    if (user.role === 'AGENT' || user.role === 'ADMIN') {
      const listingsSection = $('#myListingsSection');
      if (listingsSection) listingsSection.hidden = false;
      loadUserListings();
    }

  } catch (error) {
    console.error('Failed to load user profile:', error);
    if (loadingState) loadingState.hidden = true;
    if (errorState) errorState.hidden = false;
  }
}

// ─── Scheduled tours ──────────────────────────────────────────────────────────

async function loadUserTours() {
  const toursList  = $('#myToursList');
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
      const tourDate      = new Date(tour.tourDate);
      const formattedDate = tourDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      const formattedTime = tourDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      const statusColors = {
        REQUESTED: { bg: '#FEF3C7', text: '#92400E' },
        CONFIRMED:  { bg: '#D1FAE5', text: '#065F46' },
        COMPLETED:  { bg: '#DBEAFE', text: '#1E40AF' },
        CANCELLED:  { bg: '#F3F4F6', text: '#6B7280' },
      };
      const badge  = statusColors[tour.status] || { bg: '#E2E8F0', text: '#334155' };
      const images = tour.property?.images || [];
      const imageUrls = images.map(i => i.url).filter(Boolean).map(url => optimizeImageUrl(url, 200));
      const imgUrl = imageUrls.length > 0 ? imageUrls[0] : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%2270%22/%3E';
      const fallbacksStr = imageUrls.length > 1 ? JSON.stringify(imageUrls.slice(1)).replace(/"/g, '&quot;') : '[]';
      const canCancel = tour.status === 'REQUESTED' || tour.status === 'CONFIRMED';

      return `
        <div class="tour-card" data-tour-id="${tour.id}" style="display: flex; justify-content: space-between; align-items: center; padding: var(--s-3); background: var(--c-bg); border-radius: var(--radius-lg); border: 1px solid var(--c-border); flex-wrap: wrap; gap: var(--s-3);">
          <div style="display: flex; align-items: center; gap: var(--s-3);">
            <img src="${imgUrl}" alt="${tour.property?.title || 'Property'}" data-fallbacks="${fallbacksStr}" onerror="window.handleImageFallback(this)" style="width: 72px; height: 54px; object-fit: cover; border-radius: var(--radius-md);" />
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

// ─── Saved favorites ──────────────────────────────────────────────────────────

async function loadUserFavorites() {
  const favList       = $('#myFavoritesList');
  const countBadge    = $('#favoritesCountBadge');
  const statFavorites = $('#statFavorites');
  if (!favList) return;

  try {
    const favorites = await fetchMyFavorites();
    const count = Array.isArray(favorites) ? favorites.length : 0;
    if (countBadge)    countBadge.textContent    = `${count} Saved`;
    if (statFavorites) statFavorites.textContent = count;

    if (!Array.isArray(favorites) || favorites.length === 0) {
      favList.innerHTML = '<p style="grid-column: 1 / -1; color: var(--c-muted); font-size: var(--text-sm); padding: var(--s-2) 0;">No saved properties yet. Click the heart icon on any property to save it here!</p>';
      return;
    }

    favList.innerHTML = favorites.map((p) => {
      const images = p.images || [];
      const imageUrls = images.map(i => i.url).filter(Boolean).map(url => optimizeImageUrl(url, 400));
      const imgUrl = imageUrls.length > 0 ? imageUrls[0] : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22240%22 height=%22160%22/%3E';
      const fallbacksStr = imageUrls.length > 1 ? JSON.stringify(imageUrls.slice(1)).replace(/"/g, '&quot;') : '[]';
      const formattedPrice = fmtCurrency(p.price) + (p.priceType === 'RENT' ? '/mo' : '');

      return `
        <div class="fav-card" style="background: var(--c-bg); border-radius: var(--radius-lg); border: 1px solid var(--c-border); overflow: hidden; display: flex; flex-direction: column;">
          <a href="property-details.html?id=${p.id}" style="display: block; position: relative;">
            <img src="${imgUrl}" alt="${p.title}" data-fallbacks="${fallbacksStr}" onerror="window.handleImageFallback(this)" style="width: 100%; height: 140px; object-fit: cover;" />
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

// ─── Agent listings ───────────────────────────────────────────────────────────

const STATUS_BADGE = {
  ACTIVE:   { bg: '#D1FAE5', text: '#065F46', label: 'Active'   },
  PENDING:  { bg: '#FEF3C7', text: '#92400E', label: 'Pending'  },
  SOLD:     { bg: '#DBEAFE', text: '#1E40AF', label: 'Sold'     },
  RENTED:   { bg: '#EDE9FE', text: '#5B21B6', label: 'Rented'   },
  INACTIVE: { bg: '#F3F4F6', text: '#6B7280', label: 'Inactive' },
};

async function loadUserListings() {
  const list       = $('#myListingsList');
  const countBadge = $('#listingsCountBadge');
  if (!list) return;

  try {
    const response = await fetchMyListings();
    const listings = response?.data ?? [];
    const count    = listings.length;

    if (countBadge) countBadge.textContent = `${count} Listing${count === 1 ? '' : 's'}`;

    if (count === 0) {
      list.innerHTML = `
        <div style="text-align: center; padding: var(--s-8) 0; color: var(--c-muted);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto var(--s-3); display: block; opacity: 0.4;">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          <p style="font-size: var(--text-sm); margin-bottom: var(--s-4);">You haven't listed any properties yet.</p>
          <a href="add-property.html" class="btn btn--primary btn--sm">+ Create Your First Listing</a>
        </div>`;
      return;
    }

    list.innerHTML = listings.map((p) => {
      const images = p.images || [];
      const imageUrls = images.map(i => i.url).filter(Boolean).map(url => optimizeImageUrl(url, 200));
      const imgUrl = imageUrls.length > 0 ? imageUrls[0] : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%2270%22/%3E';
      const fallbacksStr = imageUrls.length > 1 ? JSON.stringify(imageUrls.slice(1)).replace(/"/g, '&quot;') : '[]';
      const formattedPrice = fmtCurrency(p.price) + (p.priceType === 'RENT' ? '/mo' : '');
      const statusKey      = p.status || 'ACTIVE';
      const badge          = STATUS_BADGE[statusKey] || STATUS_BADGE.ACTIVE;
      const createdAt      = new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      return `
        <div class="listing-mgmt-card" data-listing-id="${p.id}"
             style="display: flex; align-items: flex-start; gap: var(--s-4); padding: var(--s-4);
                    background: var(--c-bg); border-radius: var(--radius-lg);
                    border: 1px solid var(--c-border); flex-wrap: wrap;">

          <!-- Thumbnail -->
          <a href="property-details.html?id=${p.id}" style="flex-shrink: 0;">
            <img src="${imgUrl}" alt="${p.title}" data-fallbacks="${fallbacksStr}" onerror="window.handleImageFallback(this)" style="width: 100px; height: 72px; object-fit: cover; border-radius: var(--radius-md);" />
          </a>

          <!-- Info -->
          <div style="flex: 1; min-width: 200px;">
            <div style="display: flex; align-items: center; gap: var(--s-2); flex-wrap: wrap; margin-bottom: 4px;">
              <a href="property-details.html?id=${p.id}"
                 style="font-weight: 700; font-size: var(--text-base); color: var(--c-text); text-decoration: none;">${p.title}</a>
              <span style="font-size: var(--text-xs); font-weight: 700; padding: 2px 8px; border-radius: 9999px;
                           background: ${badge.bg}; color: ${badge.text};">${badge.label}</span>
            </div>
            <p style="font-size: var(--text-sm); font-weight: 700; color: var(--c-primary); margin: 0 0 2px;">${formattedPrice}</p>
            <p style="font-size: var(--text-xs); color: var(--c-muted); margin: 0;">
              📍 ${p.city || 'Unknown'}, ${p.state || ''} &nbsp;·&nbsp;
              🛏 ${p.beds} bed &nbsp;·&nbsp; 🚿 ${p.baths} bath &nbsp;·&nbsp;
              Listed ${createdAt}
            </p>
          </div>

          <!-- Actions -->
          <div style="display: flex; gap: var(--s-2); align-items: center; flex-shrink: 0; flex-wrap: wrap;">
            <a href="add-property.html?edit=${p.id}"
               class="btn btn--outline btn--sm"
               style="font-size: var(--text-xs); padding: 5px 12px; display: inline-flex; align-items: center; gap: 4px;">
              ✏️ Edit
            </a>
            <button type="button"
                    class="btn btn--sm delete-listing-btn"
                    data-id="${p.id}"
                    data-title="${p.title.replace(/"/g, '&quot;')}"
                    style="font-size: var(--text-xs); padding: 5px 12px; background: transparent;
                           color: #EF4444; border: 1px solid #FECACA; border-radius: var(--radius-md);
                           cursor: pointer;">
              🗑 Delete
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Wire delete buttons
    $$('.delete-listing-btn', list).forEach((btn) => {
      btn.addEventListener('click', async () => {
        const propId    = btn.getAttribute('data-id');
        const propTitle = btn.getAttribute('data-title') || 'this listing';
        if (!confirm(`Are you sure you want to permanently delete "${propTitle}"?\n\nThis will remove all associated tours, favorites, and reviews. This action cannot be undone.`)) return;

        const card = btn.closest('.listing-mgmt-card');
        try {
          btn.disabled = true;
          btn.textContent = 'Deleting…';

          // Optimistic removal with fade
          if (card) { card.style.transition = 'opacity 0.3s'; card.style.opacity = '0.4'; }

          await deleteProperty(propId);
          loadUserListings(); // re-render
        } catch (err) {
          console.error('Delete failed:', err);
          if (card) card.style.opacity = '1';
          alert('Failed to delete listing: ' + (err.message || 'Unknown error'));
          btn.disabled = false;
          btn.textContent = '🗑 Delete';
        }
      });
    });

  } catch (error) {
    console.error('Failed to load listings:', error);
    list.innerHTML = '<p style="color: var(--c-muted); font-size: var(--text-sm);">Failed to load your listings. Please try again.</p>';
  }
}

// ─── Profile form ─────────────────────────────────────────────────────────────

function initProfileForm() {
  const form        = $('#profileForm');
  const formMessage = $('#formMessage');
  const cancelBtn   = $('#cancelBtn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn   = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : 'Save Changes';

    try {
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Saving...'; }
      if (formMessage) { formMessage.hidden = true; formMessage.className = 'profile-form__message'; }

      const profileData = {
        name:      $('#name')?.value?.trim(),
        email:     $('#email')?.value?.trim(),
        phone:     $('#phone')?.value?.trim(),
        bio:       $('#bio')?.value?.trim(),
        avatarUrl: $('#avatarUrl')?.value?.trim(),
      };

      const updatedUser = await updateUserProfile(profileData);

      const profileAvatar = $('#profileAvatar');
      const profileName   = $('#profileName');
      const profileEmail  = $('#profileEmail');

      if (profileAvatar && profileData.avatarUrl) profileAvatar.src = profileData.avatarUrl;
      if (profileName)  profileName.textContent  = profileData.name;
      if (profileEmail) profileEmail.textContent = profileData.email;

      if (formMessage) {
        formMessage.hidden    = false;
        formMessage.className = 'profile-form__message profile-form__message--success';
        formMessage.textContent = 'Profile updated successfully!';
      }

    } catch (error) {
      console.error('Failed to update profile:', error);
      if (formMessage) {
        formMessage.hidden    = false;
        formMessage.className = 'profile-form__message profile-form__message--error';
        formMessage.textContent = error.message || 'Failed to update profile. Please try again.';
      }
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
    }
  });

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => loadUserProfile());
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

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

// ─── Retry button ─────────────────────────────────────────────────────────────

function initRetryButton() {
  const retryBtn = $('#retryBtn');
  if (!retryBtn) return;

  retryBtn.addEventListener('click', () => {
    const errorState   = $('#errorState');
    const loadingState = $('#loadingState');
    if (errorState)   errorState.hidden   = true;
    if (loadingState) loadingState.hidden = false;
    loadUserProfile();
  });
}

// ─── Change avatar ────────────────────────────────────────────────────────────

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

// ─── Bootstrap ───────────────────────────────────────────────────────────────

function initProfilePage() {
  loadUserProfile();
  initProfileForm();
  initLogoutButton();
  initRetryButton();
  initChangeAvatarButton();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProfilePage);
} else {
  initProfilePage();
}
