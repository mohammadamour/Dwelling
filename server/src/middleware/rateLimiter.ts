import rateLimit from 'express-rate-limit';

/**
 * Dwelling — API Rate Limiting Middleware
 * Protects authentication, public forms, and general API endpoints against
 * brute-force attacks, credential stuffing, and DoS spam.
 */

/**
 * Strict rate limiter for sensitive authentication endpoints (login & registration).
 * Allows up to 15 attempts per 15-minute window per IP address.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts from this IP. Please try again in 15 minutes.'
  },
  statusCode: 429,
  validate: { trustProxy: false } // Managed explicitly via app.set('trust proxy', 1) in index.ts
});

/**
 * Rate limiter for public newsletter subscription endpoint.
 * Allows up to 5 subscription submissions per hour per IP.
 */
export const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many newsletter subscription attempts from this IP. Please try again later.'
  },
  statusCode: 429,
  validate: { trustProxy: false }
});

/**
 * Sensible blanket limiter for general API routes to prevent resource exhaustion.
 * Allows up to 300 requests per 15-minute window per IP address.
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP. Please slow down and try again later.'
  },
  statusCode: 429,
  validate: { trustProxy: false }
});
