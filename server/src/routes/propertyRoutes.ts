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
  getPropertyReviews,
} from '../controllers/propertyController';
import { authenticate, requireRole, optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * POST /api/properties
 * Create a new property listing (restricted to AGENTS and ADMINS)
 */
router.post('/', authenticate, requireRole(['AGENT', 'ADMIN']), createProperty);

/**
 * GET /api/properties
 * Fetch properties with dynamic query filtering and pagination.
 * optionalAuth attaches user context so isFavorite is flagged for authenticated users.
 */
router.get('/', optionalAuth, getProperties);

/**
 * GET /api/properties/stats
 * Return overall property counts and stats for the home page
 */
router.get('/stats', getPropertyStats);

/**
 * GET /api/properties/featured
 * Return featured listings for the home page
 */
router.get('/featured', getFeaturedProperties);

/**
 * GET /api/properties/:id
 * Fetch a single property by its ID with related data (agent, images, reviews).
 * optionalAuth attaches user context so isFavorite is flagged for authenticated users.
 */
router.get('/:id', optionalAuth, getPropertyById);

/**
 * POST /api/properties/:id/tours
 * Schedule a visit/tour for a property
 */
router.post('/:id/tours', authenticate, bookPropertyTour);

/**
 * POST /api/properties/:id/favorite
 * Toggle favorite status for a property
 */
router.post('/:id/favorite', authenticate, togglePropertyFavorite);

/**
 * GET /api/properties/:id/reviews
 * Fetch reviews for a specific property
 */
router.get('/:id/reviews', getPropertyReviews);

/**
 * POST /api/properties/:id/reviews
 * Submit a review for a property
 */
router.post('/:id/reviews', authenticate, createPropertyReview);

export default router;
