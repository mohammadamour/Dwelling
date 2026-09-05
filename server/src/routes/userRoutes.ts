import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getUserProfile, updateUserProfile, updateUserRole } from '../controllers/userController';

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

/**
 * PATCH /api/users/:id/role
 * Admin-only role assignment endpoint
 */
router.patch('/:id/role', authenticate, requireRole(['ADMIN']), updateUserRole);

export default router;
