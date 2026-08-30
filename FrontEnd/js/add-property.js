/**
 * Dwelling — Add Property Page JavaScript
 * Creation of new listings by Agents
 */

import { createProperty, getAuthUser, isAuthenticated } from './api.js';

// DOM Helper
const $ = (sel) => document.querySelector(sel);

// Check authentication and roles
function checkAccess() {
  if (!isAuthenticated()) {
    window.location.href = 'login.html?redirect=add-property.html';
    return false;
  }

  const user = getAuthUser();
  if (!user || user.role !== 'AGENT') {
    // Non-agents are not allowed to add properties
    alert('Access Denied: Only registered Agents can list properties.');
    window.location.href = '../index.html';
    return false;
  }

  return true;
}

// Handle Form Submission
function initAddPropertyForm() {
  const form = $('#addPropertyForm');
  const errorMessage = $('#errorMessage');
  const successMessage = $('#successMessage');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Hide previous messages
    if (errorMessage) errorMessage.hidden = true;
    if (successMessage) successMessage.hidden = true;

    // Get Form Data
    const formData = new FormData(form);
    
    // Extract Image URLs
    const imageList = [];
    const img1 = $('#imageUrl1')?.value;
    const img2 = $('#imageUrl2')?.value;
    const img3 = $('#imageUrl3')?.value;
    
    if (img1 && img1.trim()) imageList.push(img1.trim());
    if (img2 && img2.trim()) imageList.push(img2.trim());
    if (img3 && img3.trim()) imageList.push(img3.trim());

    const propertyData = {
      title: formData.get('title'),
      price: parseFloat(formData.get('price')),
      priceType: formData.get('priceType'),
      type: formData.get('type'),
      sqft: parseInt(formData.get('sqft'), 10),
      beds: parseInt(formData.get('beds'), 10),
      baths: parseInt(formData.get('baths'), 10),
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state'),
      zip: formData.get('zip'),
      description: formData.get('description'),
      images: imageList,
    };

    // Client-side validations
    if (isNaN(propertyData.price) || propertyData.price <= 0) {
      showError('Please enter a valid positive price.');
      return;
    }
    if (isNaN(propertyData.sqft) || propertyData.sqft <= 0) {
      showError('Please enter a valid positive square footage.');
      return;
    }
    if (isNaN(propertyData.beds) || propertyData.beds < 0) {
      showError('Please enter a valid number of bedrooms.');
      return;
    }
    if (isNaN(propertyData.baths) || propertyData.baths < 0) {
      showError('Please enter a valid number of bathrooms.');
      return;
    }
    if (imageList.length === 0) {
      showError('Please provide at least one valid image URL.');
      return;
    }

    // Set loading state
    form.classList.add('auth-form--loading');

    try {
      const createdProperty = await createProperty(propertyData);

      // Remove loading state
      form.classList.remove('auth-form--loading');

      if (successMessage) {
        successMessage.textContent = 'Property listed successfully! Redirecting...';
        successMessage.hidden = false;
      }

      const propertyId = createdProperty && createdProperty.id ? createdProperty.id : null;

      // Redirect to details page only after the created record is actually available
      setTimeout(() => {
        if (propertyId) {
          window.location.href = `property-details.html?id=${propertyId}`;
        } else {
          window.location.href = '../index.html';
        }
      }, 1500);

    } catch (error) {
      form.classList.remove('auth-form--loading');
      showError(error.message || 'Failed to list property. Please check inputs and try again.');
    }
  });

  function showError(msg) {
    if (errorMessage) {
      errorMessage.textContent = msg;
      errorMessage.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

// Initializer
function init() {
  if (checkAccess()) {
    initAddPropertyForm();
  }
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
