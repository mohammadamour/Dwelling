/**
 * Dwelling — Login Page JavaScript
 * User authentication and form handling
 */

import { loginUser } from './api.js';
import { $ } from './shared.js';

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

// Quick-fill demo credentials for testing and recruiter evaluation
function initDemoCredentials() {
  const agentBtn = $('#fillDemoAgentBtn');
  const seekerBtn = $('#fillDemoSeekerBtn');
  const emailInput = $('#email');
  const passwordInput = $('#password');
  const errorMessage = $('#errorMessage');
  const successMessage = $('#successMessage');

  const populateFields = (email, password, roleLabel) => {
    if (emailInput) {
      emailInput.value = email;
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (passwordInput) {
      passwordInput.value = password;
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (errorMessage) errorMessage.hidden = true;
    if (successMessage) {
      successMessage.textContent = `${roleLabel} credentials filled! Click "Sign In" below.`;
      successMessage.hidden = false;
    }

    // Gentle highlight feedback on inputs
    [emailInput, passwordInput].forEach((el) => {
      if (!el) return;
      el.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
      el.style.borderColor = 'var(--c-primary)';
      el.style.boxShadow = '0 0 0 3px var(--c-primary-soft, rgba(37, 99, 235, 0.15))';
      setTimeout(() => {
        el.style.borderColor = '';
        el.style.boxShadow = '';
      }, 1200);
    });

    if (emailInput) emailInput.focus();
  };

  if (agentBtn) {
    agentBtn.addEventListener('click', () => {
      populateFields('testagent@example.com', 'password123', 'Demo Agent');
    });
  }

  if (seekerBtn) {
    seekerBtn.addEventListener('click', () => {
      populateFields('testuser1@example.com', 'password123', 'Demo Client');
    });
  }
}

// Initialize login page
function initLoginPage() {
  initLoginForm();
  initDemoCredentials();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLoginPage);
} else {
  initLoginPage();
}
