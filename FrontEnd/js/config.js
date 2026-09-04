/**
 * Dwelling Frontend Runtime Configuration
 *
 * Provides centralized, environment-aware API URL resolution.
 * Prevents production loopback failures (calling localhost:5001 from public domains)
 * while preserving seamless local development.
 *
 * Resolution Hierarchy:
 * 1. window.__DWELLING_API_BASE_URL__ or window.DWELLING_API_BASE_URL (runtime global override)
 * 2. <meta name="dwelling-api-url" content="..."> or <meta name="api-base-url" content="...">
 * 3. localStorage.getItem('dwelling_api_base_url') (developer/QA console testing override)
 * 4. DWELLING_CONFIG.productionApiUrl (explicit production domain parameter below)
 * 5. Intelligent Environment Detection:
 *    - On localhost / 127.0.0.1 / [::1] -> 'http://localhost:5001/api'
 *    - On public/remote domains -> '/api' (relative endpoint for reverse proxies, rewrites, or same-origin)
 */

export const DWELLING_CONFIG = {
  /**
   * Explicit production API base URL.
   * If your backend is deployed to a standalone external domain (e.g. 'https://api.dwelling.com/api'
   * or 'https://dwelling-api.onrender.com/api'), set it here or provide it via HTML meta tag / window global.
   * If left empty, public environments automatically default to relative '/api'.
   */
  productionApiUrl: '',

  /**
   * Local development API base URL fallback.
   */
  developmentApiUrl: 'http://localhost:5001/api',
};

/**
 * Determine if current execution context is on a local development host.
 * @returns {boolean}
 */
export function isLocalhost() {
  if (typeof window === 'undefined' || !window.location) {
    return true;
  }

  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local')
  );
}

/**
 * Resolve the active API base URL according to the resolution hierarchy.
 * @returns {string} Fully resolved API base URL
 */
export function resolveApiBaseUrl() {
  if (typeof window === 'undefined') {
    return DWELLING_CONFIG.developmentApiUrl;
  }

  // 1. Explicit window runtime global
  if (typeof window.__DWELLING_API_BASE_URL__ === 'string' && window.__DWELLING_API_BASE_URL__.trim()) {
    return window.__DWELLING_API_BASE_URL__.trim();
  }
  if (typeof window.DWELLING_API_BASE_URL === 'string' && window.DWELLING_API_BASE_URL.trim()) {
    return window.DWELLING_API_BASE_URL.trim();
  }

  // 2. HTML <meta> tag declaration
  if (typeof document !== 'undefined' && document.querySelector) {
    const metaTag =
      document.querySelector('meta[name="dwelling-api-url"]') ||
      document.querySelector('meta[name="api-base-url"]');
    if (metaTag && metaTag.content && metaTag.content.trim()) {
      return metaTag.content.trim();
    }
  }

  // 3. LocalStorage override (convenient for QA / staging diagnostics)
  try {
    const storageOverride = window.localStorage?.getItem('dwelling_api_base_url');
    if (storageOverride && typeof storageOverride === 'string' && storageOverride.trim()) {
      return storageOverride.trim();
    }
  } catch (_err) {
    // Storage access might be restricted by browser sandbox
  }

  // 4. Explicit production URL from config object
  if (typeof DWELLING_CONFIG.productionApiUrl === 'string' && DWELLING_CONFIG.productionApiUrl.trim()) {
    return DWELLING_CONFIG.productionApiUrl.trim();
  }

  // 5. Intelligent Environment Auto-Detection
  if (isLocalhost()) {
    return DWELLING_CONFIG.developmentApiUrl;
  }

  // Remote production host fallback: use relative '/api'
  // Avoids contacting the visitor's local machine and works seamlessly with reverse proxies/rewrites
  return '/api';
}

/**
 * Safely construct an absolute or relative endpoint URL without duplicate slashes.
 * @param {string} endpoint - API path (e.g. '/properties' or 'properties')
 * @returns {string}
 */
export function buildApiUrl(endpoint = '') {
  if (typeof endpoint === 'string' && (endpoint.startsWith('http://') || endpoint.startsWith('https://'))) {
    return endpoint;
  }

  const base = resolveApiBaseUrl().replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
}

// Expose on window object for console inspection & testing
if (typeof window !== 'undefined') {
  window.DWELLING_CONFIG = DWELLING_CONFIG;
  window.resolveDwellingApiUrl = resolveApiBaseUrl;
}

export default DWELLING_CONFIG;
