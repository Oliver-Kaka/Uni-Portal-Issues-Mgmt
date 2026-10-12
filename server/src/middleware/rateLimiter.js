/**
 * Rate limiting configuration.
 * Three tiers: global → submitLimiter → trackLimiter (strictest).
 * Demo Only: Use Fictional Data
 */
import rateLimit from 'express-rate-limit';

const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please wait and try again.',
    retryAfter: res.getHeader('Retry-After'),
  });
};

/** Applied to all /api/* routes */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/** Applied to POST /api/tickets — protect Gemini quota */
export const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many submissions. Please wait 15 minutes before trying again.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

/** Applied to GET /api/tickets/:id — stricter to prevent enumeration */
export const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many lookup requests. Please wait before trying again.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

/** Applied to POST /api/admin/login — brute-force protection */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please wait 15 minutes.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});
