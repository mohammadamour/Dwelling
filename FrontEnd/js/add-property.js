/**
 * Dwelling — Add / Edit Property Page JavaScript
 * Handles both creating new listings and editing existing ones.
 * Edit mode is activated via the `?edit=<propertyId>` query param.
 */

import { createProperty, updateProperty, deleteProperty, fetchPropertyById, getAuthUser, isAuthenticated } from './api.js';
import { $ } from './shared.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EDIT_ID = new URLSearchParams(window.location.search).get('edit');
const IS_EDIT  = Boolean(EDIT_ID);

// Check authentication and agent role
function checkAccess() {
  if (!isAuthenticated()) {
    window.location.href = 'login.html?redirect=add-property.html';
    return false;
  }
  const user = getAuthUser();
  if (!user || (user.role !== 'AGENT' && user.role !== 'ADMIN')) {
    alert('Access Denied: Only registered Agents can manage property listings.');
    window.location.href = '../index.html';
    return false;
  }
  return true;
}

function showError(msg) {
  const el = $('#errorMessage');
  if (el) { el.textContent = msg; el.hidden = false; window.scrollTo({ top: 0, behavior: 'smooth' }); }
}

function showSuccess(msg) {
  const el = $('#successMessage');
  if (el) { el.textContent = msg; el.hidden = false; window.scrollTo({ top: 0, behavior: 'smooth' }); }
}

function hideMessages() {
  const em = $('#errorMessage');
  const sm = $('#successMessage');
  if (em) em.hidden = true;
  if (sm) sm.hidden = true;
}

// ─── Edit mode: pre-populate form with existing property data ─────────────────

async function populateFormForEdit(propertyId) {
  try {
    const property = await fetchPropertyById(propertyId);
    if (!property) {
      showError('Property not found. Redirecting back…');
      setTimeout(() => window.location.href = 'profile.html', 2000);
      return;
    }

    // Ownership guard (client-side fast-fail before server returns 403)
    const user = getAuthUser();
    if (user && user.role !== 'ADMIN' && property.agentId !== user.id) {
      alert('You are not authorized to edit this listing.');
      window.location.href = 'profile.html';
      return;
    }

    // Populate all form fields
    const setVal = (id, val) => { const el = $(`#${id}`); if (el) el.value = val ?? ''; };

    setVal('title', property.title);
    setVal('price', property.price);
    setVal('priceType', property.priceType);
    setVal('type', property.type);
    setVal('sqft', property.sqft);
    setVal('beds', property.beds);
    setVal('baths', property.baths);
    setVal('address', property.address);
    setVal('city', property.city);
    setVal('state', property.state);
    setVal('zip', property.zip);
    setVal('description', property.description);

    // Images
    const imgs = property.images || [];
    setVal('imageUrl1', imgs[0]?.url || '');
    setVal('imageUrl2', imgs[1]?.url || '');
    setVal('imageUrl3', imgs[2]?.url || '');

    // Status field (only in edit mode)
    const statusEl = $('#status');
    if (statusEl) statusEl.value = property.status || 'ACTIVE';

  } catch (err) {
    console.error('Failed to load property for editing:', err);
    showError('Failed to load property data. ' + (err.message || ''));
  }
}

// ─── Build page for edit mode ─────────────────────────────────────────────────

function adaptUIForEditMode() {
  // Header
  const titleEl = document.querySelector('.auth-header__title');
  const subtitleEl = document.querySelector('.auth-header__subtitle');
  if (titleEl) titleEl.textContent = 'Edit Listing';
  if (subtitleEl) subtitleEl.textContent = 'Update your property details and save changes';

  // Page & browser title
  document.title = 'Edit Listing — Dwelling';

  // Back link
  const backLink = document.querySelector('.auth-back-link');
  if (backLink) {
    backLink.href = 'profile.html';
    const span = backLink.querySelector('span');
    if (span) span.textContent = 'Back to My Profile';
  }

  // Submit button label
  const submitBtn = document.querySelector('#addPropertyForm button[type="submit"] span');
  if (submitBtn) submitBtn.textContent = 'Save Changes';

  // Insert status select (only meaningful when editing)
  const descGroup = $('#description')?.closest('.form-group');
  if (descGroup && !$('#status')) {
    const statusGroup = document.createElement('div');
    statusGroup.className = 'form-group';
    statusGroup.innerHTML = `
      <label for="status" class="form-label">Listing Status</label>
      <select id="status" name="status" class="form-input" style="appearance: auto;">
        <option value="ACTIVE">Active — Accepting inquiries</option>
        <option value="PENDING">Pending — Under review</option>
        <option value="SOLD">Sold</option>
        <option value="RENTED">Rented</option>
        <option value="INACTIVE">Inactive — Unlisted</option>
      </select>`;
    descGroup.parentElement.insertBefore(statusGroup, descGroup);
  }

  // Delete button
  const actionsDiv = document.querySelector('.auth-form__actions');
  if (actionsDiv && !$('#deletePropertyBtn')) {
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.id = 'deletePropertyBtn';
    deleteBtn.className = 'btn btn--outline btn--full';
    deleteBtn.style.cssText = 'color: #EF4444; border-color: #FECACA; margin-top: 0.5rem;';
    deleteBtn.innerHTML = '<span>🗑 Delete This Listing</span>';
    actionsDiv.appendChild(deleteBtn);

    deleteBtn.addEventListener('click', () => handleDelete());
  }
}

// ─── Delete handler ───────────────────────────────────────────────────────────

async function handleDelete() {
  if (!confirm('Are you sure you want to permanently delete this listing? This action cannot be undone.')) return;

  const deleteBtn = $('#deletePropertyBtn');
  if (deleteBtn) { deleteBtn.disabled = true; deleteBtn.querySelector('span').textContent = 'Deleting…'; }

  try {
    await deleteProperty(EDIT_ID);
    showSuccess('Listing deleted successfully. Redirecting to your profile…');
    setTimeout(() => window.location.href = 'profile.html', 1800);
  } catch (err) {
    showError(err.message || 'Failed to delete the listing. Please try again.');
    if (deleteBtn) { deleteBtn.disabled = false; deleteBtn.querySelector('span').textContent = '🗑 Delete This Listing'; }
  }
}

// ─── Form submission ──────────────────────────────────────────────────────────

function initPropertyForm() {
  const form = $('#addPropertyForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();

    const formData = new FormData(form);

    // Images
    const imageList = [];
    const img1 = $('#imageUrl1')?.value?.trim();
    const img2 = $('#imageUrl2')?.value?.trim();
    const img3 = $('#imageUrl3')?.value?.trim();
    if (img1) imageList.push(img1);
    if (img2) imageList.push(img2);
    if (img3) imageList.push(img3);

    const propertyData = {
      title:       formData.get('title'),
      price:       parseFloat(formData.get('price')),
      priceType:   formData.get('priceType'),
      type:        formData.get('type'),
      sqft:        parseInt(formData.get('sqft'), 10),
      beds:        parseInt(formData.get('beds'), 10),
      baths:       parseInt(formData.get('baths'), 10),
      address:     formData.get('address'),
      city:        formData.get('city'),
      state:       formData.get('state'),
      zip:         formData.get('zip'),
      description: formData.get('description'),
      images:      imageList,
    };

    // Status only on edit
    if (IS_EDIT && formData.get('status')) {
      propertyData.status = formData.get('status');
    }

    // Client-side validations
    if (isNaN(propertyData.price) || propertyData.price <= 0) { showError('Please enter a valid positive price.'); return; }
    if (isNaN(propertyData.sqft)  || propertyData.sqft  <= 0) { showError('Please enter a valid positive square footage.'); return; }
    if (isNaN(propertyData.beds)  || propertyData.beds  <  0) { showError('Please enter a valid number of bedrooms.'); return; }
    if (isNaN(propertyData.baths) || propertyData.baths <  0) { showError('Please enter a valid number of bathrooms.'); return; }
    if (!IS_EDIT && imageList.length === 0) { showError('Please provide at least one valid image URL.'); return; }

    form.classList.add('auth-form--loading');
    const submitBtn = form.querySelector('button[type="submit"]');
    const submitSpan = submitBtn?.querySelector('span');
    const originalLabel = submitSpan?.textContent || (IS_EDIT ? 'Save Changes' : 'Publish Property');
    if (submitSpan) submitSpan.textContent = IS_EDIT ? 'Saving…' : 'Publishing…';
    if (submitBtn) submitBtn.disabled = true;

    try {
      let result;

      if (IS_EDIT) {
        // Remove images array if empty (keep existing images)
        if (imageList.length === 0) delete propertyData.images;
        result = await updateProperty(EDIT_ID, propertyData);
        form.classList.remove('auth-form--loading');
        showSuccess('Listing updated successfully! Redirecting…');
        setTimeout(() => {
          const id = result?.id || EDIT_ID;
          window.location.href = `property-details.html?id=${id}`;
        }, 1500);
      } else {
        result = await createProperty(propertyData);
        form.classList.remove('auth-form--loading');
        showSuccess('Property listed successfully! Redirecting…');
        const propertyId = result?.id || null;
        setTimeout(() => {
          window.location.href = propertyId ? `property-details.html?id=${propertyId}` : '../index.html';
        }, 1500);
      }

    } catch (error) {
      form.classList.remove('auth-form--loading');
      const msg = error.message || 'Failed to save listing. Please check your inputs and try again.';
      showError(msg);
      if (msg.toLowerCase().includes('log in') || msg.toLowerCase().includes('authenticated')) {
        setTimeout(() => window.location.href = 'login.html?redirect=add-property.html', 2000);
      }
    } finally {
      if (submitSpan) submitSpan.textContent = originalLabel;
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

// ─── Initializer ─────────────────────────────────────────────────────────────

async function init() {
  if (!checkAccess()) return;

  if (IS_EDIT) {
    adaptUIForEditMode();
    await populateFormForEdit(EDIT_ID);
  }

  initPropertyForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
