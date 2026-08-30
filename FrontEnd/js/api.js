/**
 * Dwelling API Service Layer
 * Modular API client for frontend-backend communication
 */


// random real estate URL image for testing purposes
// https://www.shutterstock.com/image-photo/discussion-real-estate-agent-house-model-2080599556

// Base Configuration
const DEFAULT_API_BASE_URL = 'http://localhost:5001/api';
const API_BASE_URL =
  (typeof window !== 'undefined' && (window.__DWELLING_API_BASE_URL__ || window.DWELLING_API_BASE_URL)) ||
  DEFAULT_API_BASE_URL;

// Token Management
const TOKEN_KEY = 'dwelling_auth_token';

/**
 * Retrieve JWT token from localStorage
 * @returns {string|null} The stored token or null if not found
 */
export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store JWT token in localStorage
 * @param {string} token - The JWT token to store
 */
export function setAuthToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove JWT token from localStorage
 */
export function removeAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if token exists
 */
export function isAuthenticated() {
  return !!getAuthToken();
}

/**
 * Parse the JWT payload to get logged in user details (id, email, role)
 * @returns {Object|null} User details or null if not authenticated
 */
export function getAuthUser() {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
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

  const url = `${API_BASE_URL}${endpoint}`;
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
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'data') && payload.data !== undefined) {
    return payload.data;
  }

  return payload;
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
  return payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'data')
    ? payload
    : { data: payload ?? [], meta: {} };
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

  const data = unwrapPayload(payload);

  // Store token if returned
  if (data.token) {
    setAuthToken(data.token);
  }

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

  const data = unwrapPayload(payload);

  // Store token if returned
  if (data.token) {
    setAuthToken(data.token);
  }

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

// Export all functions as a default object for convenience
const api = {
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
};

export default api;
