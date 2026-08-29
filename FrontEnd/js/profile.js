/**
 * Dwelling — Profile Page JavaScript
 * User profile management and updates
 */

import { fetchCurrentUser, updateUserProfile, logoutUser, isAuthenticated } from './api.js';
import { $, $$ } from './shared.js';

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
    
    // Update stats (placeholder values - would come from actual data)
    if (statFavorites) statFavorites.textContent = user._count?.favorites || 0;
    if (statReviews) statReviews.textContent = user._count?.reviews || 0;
    if (statJoined) {
      const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-';
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

  } catch (error) {
    console.error('Failed to load user profile:', error);
    if (loadingState) loadingState.hidden = true;
    if (errorState) errorState.hidden = false;
  }
}

// Initialize profile form
function initProfileForm() {
  const form = $('#profileForm');
  const formMessage = $('#formMessage');
  const cancelBtn = $('#cancelBtn');

  if (!form) return;

  // Store original values for cancel
  const originalValues = {};
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    originalValues[input.name] = input.value;
  });

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous messages
    if (formMessage) formMessage.innerHTML = '';

    // Get form data
    const formData = new FormData(form);
    const profileData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone') || undefined,
      bio: formData.get('bio') || undefined,
      avatarUrl: formData.get('avatarUrl') || undefined
    };

    // Validate
    if (!profileData.name || !profileData.email) {
      if (formMessage) {
        formMessage.innerHTML = '<div class="form-error">Please fill in all required fields</div>';
      }
      return;
    }

    // Show loading state
    form.classList.add('auth-form--loading');

    try {
      const updatedUser = await updateUserProfile(profileData);

      // Remove loading state
      form.classList.remove('auth-form--loading');

      // Show success message
      if (formMessage) {
        formMessage.innerHTML = '<div class="form-success">Profile updated successfully!</div>';
      }

      // Update profile card with new data
      const profileAvatar = $('#profileAvatar');
      const profileName = $('#profileName');
      const profileEmail = $('#profileEmail');

      if (profileAvatar && profileData.avatarUrl) {
        profileAvatar.src = profileData.avatarUrl;
      }
      if (profileName) profileName.textContent = profileData.name;
      if (profileEmail) profileEmail.textContent = profileData.email;

      // Update original values
      inputs.forEach(input => {
        originalValues[input.name] = input.value;
      });

    } catch (error) {
      // Remove loading state
      form.classList.remove('auth-form--loading');

      // Show error message
      if (formMessage) {
        formMessage.innerHTML = `<div class="form-error">${error.message || 'Failed to update profile. Please try again.'}</div>`;
      }
    }
  });

  // Cancel button
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      inputs.forEach(input => {
        if (originalValues[input.name] !== undefined) {
          input.value = originalValues[input.name];
        }
      });
      if (formMessage) formMessage.innerHTML = '';
    });
  }
}

// Initialize logout button
function initLogoutButton() {
  const logoutBtn = $('#logoutBtn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async () => {
    await logoutUser();
    window.location.href = '../index.html';
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

// Initialize change avatar button (placeholder)
function initChangeAvatarButton() {
  const changeAvatarBtn = $('#changeAvatarBtn');
  if (!changeAvatarBtn) return;

  changeAvatarBtn.addEventListener('click', () => {
    // Focus on avatar URL input as a simple implementation
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
