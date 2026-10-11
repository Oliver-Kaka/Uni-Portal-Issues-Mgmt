/**
 * Ticket routes.
 * Demo Only: Use Fictional Data
 */
import { Router } from 'express';
import { submitLimiter, trackLimiter } from '../middleware/rateLimiter.js';
import { sanitizeBody } from '../middleware/sanitize.js';
import { validateSubmit, validateTrackingIdParam } from '../middleware/validate.js';
import { createTicket, getTicket } from '../controllers/ticketController.js';

const router = Router();

router.post('/', submitLimiter, sanitizeBody, validateSubmit, createTicket);
router.get('/:trackingId', trackLimiter, validateTrackingIdParam, getTicket);

export default router;
