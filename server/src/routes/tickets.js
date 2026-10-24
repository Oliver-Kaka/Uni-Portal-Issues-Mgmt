/**
 * Ticket routes — public endpoints.
 * Demo Only: Use Fictional Data
 */
import { Router } from 'express';
import { submitLimiter, trackLimiter } from '../middleware/rateLimiter.js';
import { sanitizeBody } from '../middleware/sanitize.js';
import { validateSubmit, validateTrackingIdParam } from '../middleware/validate.js';
import { createTicket, getTicket, submitRating, reopenTicket } from '../controllers/ticketController.js';
import { detectOutages } from '../services/outageService.js';

const router = Router();

router.post('/', submitLimiter, sanitizeBody, validateSubmit, createTicket);
router.get('/:trackingId', trackLimiter, validateTrackingIdParam, getTicket);

// Satisfaction rating after resolution
router.post('/:trackingId/rating', trackLimiter, validateTrackingIdParam, submitRating);

// Reopen a resolved ticket within the reopen window
router.post('/:trackingId/reopen', trackLimiter, validateTrackingIdParam, reopenTicket);

// Public outage status — used by the public banner
router.get('/meta/outages', async (req, res, next) => {
  try {
    const outages = await detectOutages();
    return res.json({
      success: true,
      outages,
      _demo: 'Demo Only: Use Fictional Data',
    });
  } catch (err) { next(err); }
});

export default router;
