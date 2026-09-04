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
        const rawRedirect = new URLSearchParams(window.location.search).get('redirect') || '';
        // Security: Only allow safe relative paths to prevent open redirect attacks.
        // Reject absolute URLs, protocol-relative URLs (//evil.com), and scheme-prefixed strings.
        const isSafeRedirect = rawRedirect &&
          !rawRedirect.startsWith('http://') &&
          !rawRedirect.startsWith('https://') &&
          !rawRedirect.startsWith('//') &&
          !rawRedirect.includes('://');
        const redirectUrl = isSafeRedirect ? rawRedirect : '../index.html';
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

// Ensures demo quick access UI is present even if browser cached an older HTML document
function ensureDemoCredentialsCard() {
  let card = document.getElementById('authDemoCard');
  const form = document.getElementById('loginForm');
  if (!card && form) {
    card = document.createElement('div');
    card.className = 'auth-demo';
    card.id = 'authDemoCard';
    card.innerHTML = `
      <div class="auth-demo__header">
        <span class="auth-demo__title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          Demo Quick Access
        </span>
        <span class="auth-demo__hint">1-click test fill</span>
      </div>
      <p class="auth-demo__subtitle">Instant login credentials to test all platform features without creating an account:</p>
      <div class="auth-demo__actions">
        <button type="button" class="auth-demo__btn" id="fillDemoAgentBtn" title="Fill credentials for verified Agent account (can list properties)">
          <span class="auth-demo__badge auth-demo__badge--agent">Agent</span>
          <span>Demo Agent</span>
        </button>
        <button type="button" class="auth-demo__btn" id="fillDemoSeekerBtn" title="Fill credentials for Client account (can book tours & save favorites)">
          <span class="auth-demo__badge auth-demo__badge--seeker">Client</span>
          <span>Demo Client</span>
        </button>
      </div>
    `;
    form.parentNode.insertBefore(card, form);
  }
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
  ensureDemoCredentialsCard();
  initLoginForm();
  initDemoCredentials();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLoginPage);
} else {
  initLoginPage();
}
