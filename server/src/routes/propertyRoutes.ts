import { Router } from 'express';
import {
  getProperties,
  getPropertyById,
  getPropertyStats,
  getFeaturedProperties,
} from '../controllers/propertyController';

const router = Router();

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

module.exports = router;
