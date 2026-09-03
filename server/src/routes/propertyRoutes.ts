import { Router } from 'express';
import {
  getProperties,
  getPropertyById,
  getPropertyStats,
  getFeaturedProperties,
  createProperty,
  bookPropertyTour,
  togglePropertyFavorite,
  createPropertyReview,
} from '../controllers/propertyController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

/**
 * POST /api/properties
 * Create a new property listing (restricted to AGENTS and ADMINS)
 */
router.post('/', authenticate, requireRole(['AGENT', 'ADMIN']), createProperty);

/**
 * GET /api/properties
 * Fetch properties with dynamic query filtering and pagination
 * Query params: search/q, city, type/propertyType, priceType, minPrice, maxPrice, beds, bathrooms/baths, featured, sortBy, order, page, limit
 */
router.get('/', getProperties);

/**
 * GET /api/properties/stats
 * Return overall property counts and stats for the home page
 */
router.get('/stats', getPropertyStats);

/**
 * GET /api/properties/featured
 * Return featured listings for the home page
 * Query params: limit (default 6, max 20)
 */
router.get('/featured', getFeaturedProperties);

/**
 * GET /api/properties/:id
 * Fetch a single property by its ID with related data (agent, images, reviews)
 */
router.get('/:id', getPropertyById);

/**
 * TODO: [Tour Booking System] - Planned endpoint for booking in-person/virtual property tours
 * POST /api/properties/:id/tours
 */
router.post('/:id/tours', authenticate, bookPropertyTour);

/**
 * TODO: [Favorites System] - Planned endpoint for toggling property bookmarks
 * POST /api/properties/:id/favorite
 */
router.post('/:id/favorite', authenticate, togglePropertyFavorite);

/**
 * TODO: [Reviews System] - Planned endpoint for submitting property reviews
 * POST /api/properties/:id/reviews
 */
router.post('/:id/reviews', authenticate, createPropertyReview);

module.exports = router;
