/**
 * Admin routes.
 * Login and logout are public. Everything else requires requireAdmin.
 * Demo Only: Use Fictional Data
 */
import { Router } from 'express';
import { loginLimiter } from '../middleware/rateLimiter.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  login, logout, me,
  listTickets, getTicketAdmin, updateTicket,
  kpis, categoryBreakdown, priorityBreakdown, dailyVolume, resolutionByCategory,
  reportData,
} from '../controllers/adminController.js';
import { exportCSV, exportPDF } from '../controllers/reportController.js';

const router = Router();

// Auth
router.post('/login',  loginLimiter, login);
router.post('/logout', requireAdmin, logout);
router.get('/me',      requireAdmin, me);

// Tickets
router.get('/tickets',              requireAdmin, listTickets);
router.get('/tickets/:trackingId',  requireAdmin, getTicketAdmin);
router.patch('/tickets/:trackingId',requireAdmin, updateTicket);

// Analytics
router.get('/analytics/kpis',        requireAdmin, kpis);
router.get('/analytics/categories',  requireAdmin, categoryBreakdown);
router.get('/analytics/priorities',  requireAdmin, priorityBreakdown);
router.get('/analytics/daily',       requireAdmin, dailyVolume);
router.get('/analytics/resolution',  requireAdmin, resolutionByCategory);

// Reports
router.get('/report',      requireAdmin, reportData);
router.get('/report/csv',  requireAdmin, exportCSV);
router.get('/report/pdf',  requireAdmin, exportPDF);

export default router;
