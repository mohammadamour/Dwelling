import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  toggleFavorite,
  addFavorite,
  removeFavorite,
  getMyFavorites,
} from '../controllers/favoriteController';

const router = Router();

/**
 * GET /api/favorites/my
 * Get all favorited properties for authenticated user
 */
router.get('/my', authenticate, getMyFavorites);

/**
 * POST /api/favorites/:propertyId/toggle
 * Toggle favorite status
 */
router.post('/:propertyId/toggle', authenticate, toggleFavorite);

/**
 * POST /api/favorites/:propertyId
 * Add to favorites
 */
router.post('/:propertyId', authenticate, addFavorite);

/**
 * DELETE /api/favorites/:propertyId
 * Remove from favorites
 */
router.delete('/:propertyId', authenticate, removeFavorite);

export default router;
