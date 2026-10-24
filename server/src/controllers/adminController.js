/**
 * Admin controllers — login, logout, ticket list, detail, update, analytics.
 * All admin routes return the FULL ticket record (including sensitive fields).
 * Public endpoints remain restricted — this file does NOT affect them.
 * Demo Only: Fictional data only.
 */
import Ticket from '../models/Ticket.js';
import AuditLog from '../models/AuditLog.js';
import { verifyPassword, signToken } from '../services/authService.js';
import { sendStatusSMS, getNotificationsForTicket } from '../services/smsService.js';
import { CATEGORIES, PRIORITIES, STATUSES, DEPARTMENTS } from '@helpdesk/shared';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.COOKIE_SECURE === 'true',
  maxAge: 8 * 60 * 60 * 1000, // 8 hours in ms
};

// ---------------------------------------------------------------------------
// POST /api/admin/login
// ---------------------------------------------------------------------------
export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const storedUser = process.env.ADMIN_USERNAME;
    const storedHash = process.env.ADMIN_PASSWORD_HASH;

    if (!storedUser || !storedHash) {
      console.error('[Admin] ADMIN_USERNAME or ADMIN_PASSWORD_HASH not set in .env');
      return res.status(500).json({ success: false, message: 'Server configuration error.' });
    }

    const usernameMatch = username === storedUser;
    const passwordMatch = await verifyPassword(password, storedHash);

    // Constant-time-ish: always run bcrypt even on wrong username to prevent timing attacks
    if (!usernameMatch || !passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = signToken({ username, role: 'admin' });
    res.cookie('adminToken', token, COOKIE_OPTIONS);
    return res.json({ success: true, message: 'Logged in.' });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/logout
// ---------------------------------------------------------------------------
export function logout(req, res) {
  res.clearCookie('adminToken', { httpOnly: true, sameSite: 'lax' });
  return res.json({ success: true, message: 'Logged out.' });
}

// ---------------------------------------------------------------------------
// GET /api/admin/me
// ---------------------------------------------------------------------------
export function me(req, res) {
  return res.json({ success: true, username: req.admin.username, role: req.admin.role });
}

// ---------------------------------------------------------------------------
// GET /api/admin/tickets — paginated list with filters and sort
// ---------------------------------------------------------------------------
export async function listTickets(req, res, next) {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      priority,
      status,
      language,
      search,
      dateFrom,
      dateTo,
      sort = '-createdAt',
    } = req.query;

    const filter = {};
    if (category && CATEGORIES.includes(category)) filter.category = category;
    if (priority && PRIORITIES.includes(priority)) filter.priority = priority;
    if (status  && STATUSES.includes(status))      filter.status   = status;
    if (language) filter.detectedLanguage = language;

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo)   filter.createdAt.$lte = new Date(dateTo);
    }

    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { trackingId: re },
        { regNo: re },
        { category: re },
        { routeTo: re },
        { summaryEn: re },
      ];
    }

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [tickets, total] = await Promise.all([
      Ticket.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
      Ticket.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      _demo: 'Demo Only: Use Fictional Data',
      data: tickets,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/tickets/:trackingId
// ---------------------------------------------------------------------------
export async function getTicketAdmin(req, res, next) {
  try {
    const { trackingId } = req.params;
    const [ticket, notifications, auditLogs] = await Promise.all([
      Ticket.findOne({ trackingId }).lean(),
      getNotificationsForTicket(trackingId),
      AuditLog.find({ trackingId }).sort({ createdAt: -1 }).limit(50).lean(),
    ]);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    return res.json({ success: true, _demo: 'Demo Only: Use Fictional Data', ticket, notifications, auditLogs });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/tickets/:trackingId — update status, route, notes, resolution
// ---------------------------------------------------------------------------
export async function updateTicket(req, res, next) {
  try {
    const { trackingId } = req.params;
    const { status, routeTo, publicNote, internalNote, adminCategory, actualResolutionHours } = req.body;

    const ticket = await Ticket.findOne({ trackingId });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    const prevStatus = ticket.status;
    const updates = {};
    if (status && STATUSES.includes(status))                 updates.status = status;
    if (routeTo && DEPARTMENTS.includes(routeTo))            updates.routeTo = routeTo;
    if (adminCategory && CATEGORIES.includes(adminCategory)) updates.adminCategory = adminCategory;
    if (typeof actualResolutionHours === 'number')           updates.actualResolutionHours = actualResolutionHours;

    if (status || publicNote || internalNote) {
      ticket.statusHistory.push({
        status: updates.status || ticket.status,
        publicNote:   publicNote   || '',
        internalNote: internalNote || '',
        changedAt: new Date(),
      });
    }

    Object.assign(ticket, updates);
    await ticket.save();

    // Audit log
    await AuditLog.create({
      adminUsername: req.admin?.username || 'system',
      action: 'update_ticket',
      trackingId,
      details: { prevStatus, updates: { status, routeTo, adminCategory, actualResolutionHours, hasPublicNote: !!publicNote, hasInternalNote: !!internalNote } },
    });

    // Mock SMS when status changed and phone exists
    if (updates.status && updates.status !== prevStatus && ticket.phone) {
      const smsMsg = `Help Desk update for ${trackingId}: your ticket status is now "${updates.status}". Demo Only.`;
      sendStatusSMS(ticket, smsMsg).catch(e => console.error('[SMS] failed:', e.message));
    }

    return res.json({ success: true, _demo: 'Demo Only: Use Fictional Data', ticket });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/notifications/:trackingId
// ---------------------------------------------------------------------------
export async function getNotifications(req, res, next) {
  try {
    const notifications = await getNotificationsForTicket(req.params.trackingId);
    return res.json({ success: true, notifications });
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// GET /api/admin/analytics/kpis
// ---------------------------------------------------------------------------
export async function kpis(req, res, next) {
  try {
    const [counts, avgResolution] = await Promise.all([
      Ticket.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Ticket.aggregate([
        { $match: { actualResolutionHours: { $ne: null } } },
        { $group: { _id: null, avg: { $avg: '$actualResolutionHours' } } },
      ]),
    ]);

    const byStatus = Object.fromEntries(counts.map(c => [c._id, c.count]));
    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

    return res.json({
      success: true,
      kpis: {
        total,
        open:       byStatus['Open']        || 0,
        inProgress: byStatus['In Progress'] || 0,
        escalated:  byStatus['Escalated']   || 0,
        resolved:   byStatus['Resolved']    || 0,
        closed:     byStatus['Closed']      || 0,
        avgResolutionHours: avgResolution[0]?.avg ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/analytics/categories
// ---------------------------------------------------------------------------
export async function categoryBreakdown(req, res, next) {
  try {
    const data = await Ticket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return res.json({ success: true, data: data.map(d => ({ category: d._id, count: d.count })) });
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// GET /api/admin/analytics/priorities
// ---------------------------------------------------------------------------
export async function priorityBreakdown(req, res, next) {
  try {
    const data = await Ticket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return res.json({ success: true, data: data.map(d => ({ priority: d._id, count: d.count })) });
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// GET /api/admin/analytics/daily?days=30
// ---------------------------------------------------------------------------
export async function dailyVolume(req, res, next) {
  try {
    const days = Math.min(90, Math.max(1, parseInt(req.query.days || 30)));
    const since = new Date();
    since.setDate(since.getDate() - days);

    const data = await Ticket.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return res.json({ success: true, data: data.map(d => ({ date: d._id, count: d.count })) });
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// GET /api/admin/analytics/resolution
// ---------------------------------------------------------------------------
export async function resolutionByCategory(req, res, next) {
  try {
    const [byCategory, byDept] = await Promise.all([
      Ticket.aggregate([
        { $match: { actualResolutionHours: { $ne: null } } },
        { $group: { _id: '$category', avgActual: { $avg: '$actualResolutionHours' }, avgEta: { $avg: '$etaHours' } } },
        { $sort: { avgActual: -1 } },
      ]),
      Ticket.aggregate([
        { $match: { actualResolutionHours: { $ne: null } } },
        { $group: { _id: '$routeTo',   avgActual: { $avg: '$actualResolutionHours' }, avgEta: { $avg: '$etaHours' } } },
        { $sort: { avgActual: -1 } },
      ]),
    ]);
    return res.json({ success: true, byCategory, byDept });
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// GET /api/admin/analytics/report?from=&to=
// Returns raw data for the report page and export endpoints
// ---------------------------------------------------------------------------
export async function reportData(req, res, next) {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to)   dateFilter.$lte = new Date(to);
    const match = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    const [total, byStatus, byCategory, byPriority, slaData, escalated, corrections] = await Promise.all([
      Ticket.countDocuments(match),
      Ticket.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $match: match }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Ticket.aggregate([{ $match: match }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Ticket.aggregate([
        { $match: { ...match, actualResolutionHours: { $ne: null } } },
        { $group: { _id: '$category', avgEta: { $avg: '$etaHours' }, avgActual: { $avg: '$actualResolutionHours' }, count: { $sum: 1 } } },
      ]),
      Ticket.countDocuments({ ...match, status: 'Escalated' }),
      Ticket.countDocuments({ ...match, adminCategory: { $ne: null } }),
    ]);

    const escalationRate = total > 0 ? ((escalated / total) * 100).toFixed(1) : 0;
    const correctionRate = total > 0 ? ((corrections / total) * 100).toFixed(1) : 0;

    return res.json({
      success: true,
      _demo: 'Demo Only: Use Fictional Data',
      report: {
        period: { from: from || 'all time', to: to || 'now' },
        total,
        byStatus: Object.fromEntries(byStatus.map(s => [s._id, s.count])),
        topCategories: byCategory.slice(0, 5),
        byPriority: Object.fromEntries(byPriority.map(p => [p._id, p.count])),
        sla: slaData,
        escalationRate: parseFloat(escalationRate),
        aiCorrectionRate: parseFloat(correctionRate),
      },
    });
  } catch (err) { next(err); }
}
