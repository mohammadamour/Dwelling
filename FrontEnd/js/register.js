/**
 * Dwelling — Register Page JavaScript
 * User registration and form handling
 */

import { registerUser } from './api.js';
import { $ } from './shared.js';

// Form handling
function initRegisterForm() {
  const form = $('#registerForm');
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
    const userData = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      phone: formData.get('phone') || undefined,
      role: formData.get('role') === 'AGENT' ? 'AGENT' : 'SEEKER'
    };

    const confirmPassword = formData.get('confirmPassword');

    // Validate
    if (!userData.name || !userData.email || !userData.password) {
      if (errorMessage) {
        errorMessage.textContent = 'Please fill in all required fields';
        errorMessage.hidden = false;
      }
      return;
    }

    if (userData.password !== confirmPassword) {
      if (errorMessage) {
        errorMessage.textContent = 'Passwords do not match';
        errorMessage.hidden = false;
      }
      return;
    }

    if (userData.password.length < 6) {
      if (errorMessage) {
        errorMessage.textContent = 'Password must be at least 6 characters';
        errorMessage.hidden = false;
      }
      return;
    }

    // Show loading state
    form.classList.add('auth-form--loading');

    try {
      const response = await registerUser(userData);

      // Remove loading state
      form.classList.remove('auth-form--loading');

      // Show success message
      if (successMessage) {
        successMessage.textContent = 'Account created successfully! Redirecting...';
        successMessage.hidden = false;
      }

      // Redirect to home or properties page after short delay
      setTimeout(() => {
        const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '../index.html';
        window.location.href = redirectUrl;
      }, 1500);

    } catch (error) {
      // Remove loading state
      form.classList.remove('auth-form--loading');

      // Show error message
      if (errorMessage) {
        errorMessage.textContent = error.message || 'Registration failed. Please try again.';
        errorMessage.hidden = false;
      }
    }
  });
}

// Initialize register page
function initRegisterPage() {
  initRegisterForm();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRegisterPage);
} else {
  initRegisterPage();
}
