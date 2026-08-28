import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getUserProfile, updateUserProfile } from '../controllers/userController';

const router = Router();

/**
 * GET /api/users/me
 * Get the currently authenticated user's profile
 */
router.get('/me', authenticate, getUserProfile);

/**
 * PUT /api/users/me
 * Update the currently authenticated user's profile
 */
router.put('/me', authenticate, updateUserProfile);

module.exports = router;
