import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createTourBooking,
  getMyTours,
  updateTourStatus,
} from '../controllers/tourController';

const router = Router();

/**
 * GET /api/tours/my
 * Fetch all tour bookings for authenticated user
 */
router.get('/my', authenticate, getMyTours);

/**
 * POST /api/tours
 * Schedule a new property tour
 */
router.post('/', authenticate, createTourBooking);

/**
 * PATCH /api/tours/:id/status
 * Update status of a tour booking
 */
router.patch('/:id/status', authenticate, updateTourStatus);

module.exports = router;
