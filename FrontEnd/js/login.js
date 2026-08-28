/**
 * Dwelling — Login Page JavaScript
 * User authentication and form handling
 */

import { loginUser } from './api.js';

// Form handling
function initLoginForm() {
  const form = $('#loginForm');
  const errorMessage = $('#errorMessage');
  const successMessage = $('#successMessage');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Hide previous messages
    if (errorMessage) errorMessage.hidden = true;
    if (successMessage) successMessage.hidden = true;

    // Get form data
    const formData = new FormData(form);
    const credentials = {
      email: formData.get('email'),
      password: formData.get('password')
    };

    // Validate
    if (!credentials.email || !credentials.password) {
      if (errorMessage) {
        errorMessage.textContent = 'Please fill in all fields';
        errorMessage.hidden = false;
      }
      return;
    }

    // Show loading state
    form.classList.add('auth-form--loading');

    try {
      const response = await loginUser(credentials);

      // Remove loading state
      form.classList.remove('auth-form--loading');

      // Show success message
      if (successMessage) {
        successMessage.textContent = 'Login successful! Redirecting...';
        successMessage.hidden = false;
      }

      // Redirect to home or properties page after short delay
      setTimeout(() => {
        const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '../index.html';
        window.location.href = redirectUrl;
      }, 1000);

    } catch (error) {
      // Remove loading state
      form.classList.remove('auth-form--loading');

      // Show error message
      if (errorMessage) {
        errorMessage.textContent = error.message || 'Login failed. Please check your credentials and try again.';
        errorMessage.hidden = false;
      }
    }
  });
}

// Initialize login page
function initLoginPage() {
  initLoginForm();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLoginPage);
} else {
  initLoginPage();
}
