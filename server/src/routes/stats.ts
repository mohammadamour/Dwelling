import { Router } from 'express';
import { getPropertyStats } from '../controllers/propertyController';

const router = Router();

/**
 * GET /api/stats
 * Canonical alias for /api/properties/stats preserving backward compatibility.
 * Reuses the single getPropertyStats controller to ensure zero duplicate query logic.
 */
router.get('/stats', getPropertyStats);

module.exports = router;
