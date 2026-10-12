/**
 * requireAdmin middleware.
 * Reads the JWT from the httpOnly cookie named 'adminToken'.
 * Rejects with 401 if missing, expired, or invalid.
 * Demo Only: Fictional accounts only.
 */
import { verifyToken } from '../services/authService.js';

export function requireAdmin(req, res, next) {
  const token = req.cookies?.adminToken;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  try {
    req.admin = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Session expired or invalid. Please log in again.' });
  }
}
