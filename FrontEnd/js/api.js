/**
 * Dwelling API Service Layer
 * Modular API client for frontend-backend communication
 */
import {
  resolveApiBaseUrl,
  buildApiUrl,
  isLocalhost,
  DWELLING_CONFIG,
} from './config.js';

// Base Configuration & Environment Resolution
export function getApiBaseUrl() {
  return resolveApiBaseUrl();
}

export const DEFAULT_API_BASE_URL = DWELLING_CONFIG.developmentApiUrl;
export const API_BASE_URL = resolveApiBaseUrl();
export { buildApiUrl, isLocalhost, DWELLING_CONFIG };

// Token Management
const TOKEN_KEY = 'dwelling_auth_token';

function safeStorageGet(key) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch (_error) {
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    window.localStorage.setItem(key, value);
    return true;
  } catch (_error) {
    return false;
  }
}

function safeStorageRemove(key) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(key);
  } catch (_error) {
    // Ignore storage failures gracefully.
  }
}

/**
 * Retrieve JWT token from localStorage
 * @returns {string|null} The stored token or null if not found
 */
export function getAuthToken() {
  return safeStorageGet(TOKEN_KEY);
}

/**
 * Store JWT token in localStorage
 * @param {string} token - The JWT token to store
 */
export function setAuthToken(token) {
  if (!token) {
    removeAuthToken();
    return;
  }

  safeStorageSet(TOKEN_KEY, token);
}

/**
 * Remove JWT token from localStorage
 */
export function removeAuthToken() {
  safeStorageRemove(TOKEN_KEY);
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if token exists
 */
export function isAuthenticated() {
  const token = getAuthToken();
  return !!token && token.split('.').length === 3;
}

/**
 * Normalize API responses that may be wrapped or raw.
 * @param {any} payload
 * @returns {any}
 */
export function normalizeApiPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'data') && payload.data !== undefined) {
    return payload.data;
  }

  // Preserve composite auth session payloads; do not strip token or other session data
  if (
    Object.prototype.hasOwnProperty.call(payload, 'user') &&
    payload.user !== undefined &&
    !Object.prototype.hasOwnProperty.call(payload, 'token')
  ) {
    return payload.user;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'result') && payload.result !== undefined) {
    return payload.result;
  }

  return payload;
}

/**
 * Parse the JWT payload to get logged in user details (id, email, role)
 * @returns {Object|null} User details or null if not authenticated
 */
export function getAuthUser() {
  const token = getAuthToken();
  if (!token || token.split('.').length !== 3) {
    removeAuthToken();
    return null;
  }

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    removeAuthToken();
    return null;
  }
}

// Fetch Wrapper
/**
 * Central fetch wrapper that automatically attaches Authorization header
 * @param {string} endpoint - API endpoint path (e.g., '/properties')
 * @param {RequestInit} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<any>} Parsed JSON response
 */
export async function apiFetch(endpoint, options = {}) {
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    const message = 'The Dwelling frontend must be served over HTTP. Run a local server from the FrontEnd folder, e.g. python -m http.server 5500';
    throw new Error(message);
  }

  const url = buildApiUrl(endpoint);
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Attach Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      removeAuthToken();
    }

    // Handle non-JSON responses (e.g., 204 No Content)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return null;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

function unwrapPayload(payload) {
  return normalizeApiPayload(payload);
}

// Property Services
/**
 * Fetch properties with optional filters
 * @param {Object} filters - Query parameters for filtering
 * @param {string} filters.search - Search keyword
 * @param {string} filters.city - City filter
 * @param {string} filters.type - Property type (house, apt, condo, townhouse)
 * @param {string} filters.priceType - Price type (rent, sale)
 * @param {number} filters.minPrice - Minimum price
 * @param {number} filters.maxPrice - Maximum price
 * @param {number} filters.beds - Minimum bedrooms
 * @param {number} filters.baths - Minimum bathrooms
 * @param {boolean} filters.featured - Featured only
 * @param {string} filters.sortBy - Sort field (price, createdAt, featured)
 * @param {string} filters.order - Sort order (asc, desc)
 * @param {number} filters.page - Page number (default 1)
 * @param {number} filters.limit - Items per page (default 10)
 * @returns {Promise<Object>} Response with data and meta pagination info
 */
export async function fetchProperties(filters = {}, options = {}) {
  const queryParams = new URLSearchParams();

  // Build query string from filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/properties?${queryString}` : '/properties';

  const payload = await apiFetch(endpoint, options);

  if (payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'meta')) {
    return payload;
  }

  return {
    data: normalizeApiPayload(payload) ?? [],
    meta: {},
  };
}

/**
 * Fetch a single property by ID
 * @param {string} id - Property ID
 * @returns {Promise<Object>} Property data with related info
 */
export async function fetchPropertyById(id) {
  const payload = await apiFetch(`/properties/${id}`);
  return unwrapPayload(payload);
}

/**
 * Fetch featured properties
 * @param {number} limit - Maximum number of properties to return (default 6)
 * @returns {Promise<Object>} Featured properties data
 */
export async function fetchFeaturedProperties(limit = 6) {
  const payload = await apiFetch(`/properties/featured?limit=${limit}`);
  return unwrapPayload(payload);
}

/**
 * Fetch property statistics
 * @returns {Promise<Object>} Stats data (totalListings, totalAgents, etc.)
 */
export async function fetchPropertyStats() {
  return apiFetch('/properties/stats');
}

/**
 * Create a new property listing (restricted to AGENT/ADMIN roles)
 * @param {Object} propertyData - The property listing data
 * @returns {Promise<Object>} Created property data
 */
export async function createProperty(propertyData) {
  const payload = await apiFetch('/properties', {
    method: 'POST',
    body: JSON.stringify(propertyData),
  });

  return unwrapPayload(payload);
}

// Auth Services
/**
 * Login user with credentials
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<Object>} Response with user data and token
 */
export async function loginUser(credentials) {
  const payload = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  // Extract and persist token directly from root response or data envelope before unwrapping
  const token = payload?.token || payload?.data?.token;
  if (token) {
    setAuthToken(token);
  }

  const data = unwrapPayload(payload);
  return data;
}

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User name
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @param {string} userData.phone - User phone (optional)
 * @param {string} userData.role - User role (SEEKER, AGENT) (optional)
 * @returns {Promise<Object>} Response with user data and token
 */
export async function registerUser(userData) {
  const payload = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

  // Extract and persist token directly from root response or data envelope before unwrapping
  const token = payload?.token || payload?.data?.token;
  if (token) {
    setAuthToken(token);
  }

  const data = unwrapPayload(payload);
  return data;
}

/**
 * Logout user - remove token and optionally call backend
 * @returns {Promise<void>}
 */
export async function logoutUser() {
  removeAuthToken();
  // Optionally call backend logout endpoint if available
  // await apiFetch('/auth/logout', { method: 'POST' });
}

/**
 * Fetch current authenticated user profile
 * @returns {Promise<Object>} User profile data
 */
export async function fetchCurrentUser() {
  const payload = await apiFetch('/auth/me');
  return unwrapPayload(payload);
}

// User Services
/**
 * Update user profile
 * @param {Object} profileData - Profile update data
 * @param {string} profileData.name - User name
 * @param {string} profileData.email - User email
 * @param {string} profileData.phone - User phone
 * @param {string} profileData.avatarUrl - Avatar URL
 * @param {string} profileData.bio - User bio
 * @returns {Promise<Object>} Updated user profile data
 */
export async function updateUserProfile(profileData) {
  const payload = await apiFetch('/users/me', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });

  return unwrapPayload(payload);
}

// ============================================================================
// Favorites Services
// ============================================================================

/**
 * Toggle favorite status for a property
 * @param {string} propertyId
 * @returns {Promise<{ isFavorite: boolean, favoritesCount: number, message: string }>}
 */
export async function toggleFavorite(propertyId) {
  return apiFetch(`/favorites/${encodeURIComponent(propertyId)}/toggle`, {
    method: 'POST',
  });
}

/**
 * Add a property to favorites
 * @param {string} propertyId
 * @returns {Promise<Object>}
 */
export async function addFavorite(propertyId) {
  return apiFetch(`/favorites/${encodeURIComponent(propertyId)}`, {
    method: 'POST',
  });
}

/**
 * Remove a property from favorites
 * @param {string} propertyId
 * @returns {Promise<Object>}
 */
export async function removeFavorite(propertyId) {
  return apiFetch(`/favorites/${encodeURIComponent(propertyId)}`, {
    method: 'DELETE',
  });
}

/**
 * Fetch all favorited properties for the logged-in user
 * @returns {Promise<Array>} List of favorited properties
 */
export async function fetchMyFavorites() {
  const payload = await apiFetch('/favorites/my');
  return unwrapPayload(payload);
}

// ============================================================================
// Tour Booking Services
// ============================================================================

/**
 * Schedule a new property tour
 * @param {Object} tourData
 * @param {string} tourData.propertyId
 * @param {string} tourData.tourDate - ISO date string
 * @param {'IN_PERSON' | 'VIRTUAL'} [tourData.tourType='IN_PERSON']
 * @param {string} [tourData.notes]
 * @returns {Promise<Object>}
 */
export async function bookTour(tourData) {
  const payload = await apiFetch('/tours', {
    method: 'POST',
    body: JSON.stringify(tourData),
  });
  return unwrapPayload(payload);
}

/**
 * Fetch all tour bookings scheduled by the logged-in user
 * @returns {Promise<Array>} List of scheduled tours
 */
export async function fetchMyTours() {
  const payload = await apiFetch('/tours/my');
  return unwrapPayload(payload);
}

/**
 * Update the status of a tour booking
 * @param {string} tourId
 * @param {'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'} status
 * @returns {Promise<Object>}
 */
export async function updateTourStatus(tourId, status) {
  const payload = await apiFetch(`/tours/${encodeURIComponent(tourId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return unwrapPayload(payload);
}

// ============================================================================
// Reviews Services
// ============================================================================

/**
 * Submit a rating and review for a property
 * @param {string} propertyId
 * @param {Object} reviewData
 * @param {number} reviewData.rating - Integer from 1 to 5
 * @param {string} reviewData.comment - Review text
 * @returns {Promise<Object>}
 */
export async function createPropertyReview(propertyId, reviewData) {
  const payload = await apiFetch(`/properties/${encodeURIComponent(propertyId)}/reviews`, {
    method: 'POST',
    body: JSON.stringify(reviewData),
  });
  return unwrapPayload(payload);
}

/**
 * Fetch reviews for a property
 * @param {string} propertyId
 * @returns {Promise<Array>}
 */
export async function fetchPropertyReviews(propertyId) {
  const payload = await apiFetch(`/properties/${encodeURIComponent(propertyId)}/reviews`);
  return unwrapPayload(payload);
}

// ============================================================================
// Agent Services
// ============================================================================

/**
 * Fetch registered real estate agents
 * @returns {Promise<Array>}
 */
export async function fetchAgents() {
  const payload = await apiFetch('/agents');
  return unwrapPayload(payload);
}

/**
 * Fetch single agent profile by ID
 * @param {string} agentId
 * @returns {Promise<Object>}
 */
export async function fetchAgentById(agentId) {
  const payload = await apiFetch(`/agents/${encodeURIComponent(agentId)}`);
  return unwrapPayload(payload);
}

// Export all functions as a default object for convenience
const api = {
  // Base configuration & URL resolution
  getApiBaseUrl,
  buildApiUrl,
  API_BASE_URL,
  DWELLING_CONFIG,

  // Token management
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  isAuthenticated,
  
  // Fetch wrapper
  apiFetch,
  
  // Property services
  fetchProperties,
  fetchPropertyById,
  fetchFeaturedProperties,
  fetchPropertyStats,
  createProperty,
  
  // Auth services
  loginUser,
  registerUser,
  logoutUser,
  fetchCurrentUser,
  getAuthUser,
  
  // User services
  updateUserProfile,

  // Favorites
  toggleFavorite,
  addFavorite,
  removeFavorite,
  fetchMyFavorites,

  // Tours
  bookTour,
  fetchMyTours,
  updateTourStatus,

  // Reviews
  createPropertyReview,
  fetchPropertyReviews,

  // Agents
  fetchAgents,
  fetchAgentById,
};

export default api;

