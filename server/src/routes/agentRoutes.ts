import { Router } from 'express';
import { getAgents, getAgentById } from '../controllers/agentController';

const router = Router();

/**
 * GET /api/agents
 * Retrieve all registered agents
 */
router.get('/', getAgents);

/**
 * GET /api/agents/:id
 * Retrieve a specific agent profile with their listings
 */
router.get('/:id', getAgentById);

module.exports = router;
