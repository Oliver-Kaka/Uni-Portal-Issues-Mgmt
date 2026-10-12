/**
 * Report export controller — CSV and PDF.
 * Both endpoints accept ?from= and ?to= date range params.
 * PDF uses jsPDF + jspdf-autotable (server-side, no browser).
 * Demo Only: Use Fictional Data
 */
import Ticket from '../models/Ticket.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Shared query builder — reused by both exporters
async function buildReportPayload(from, to) {
  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(from);
  if (to)   dateFilter.$lte = new Date(to);
  const match = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

  const [tickets, byStatus, byCategory, slaData, escalated, corrections, total] = await Promise.all([
    Ticket.find(match).sort({ createdAt: -1 }).lean(),
    Ticket.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Ticket.aggregate([{ $match: match }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Ticket.aggregate([
      { $match: { ...match, actualResolutionHours: { $ne: null } } },
      { $group: { _id: '$category', avgEta: { $avg: '$etaHours' }, avgActual: { $avg: '$actualResolutionHours' }, count: { $sum: 1 } } },
    ]),
    Ticket.countDocuments({ ...match, status: 'Escalated' }),
    Ticket.countDocuments({ ...match, adminCategory: { $ne: null } }),
    Ticket.countDocuments(match),
  ]);

  return { tickets, byStatus, byCategory, slaData, escalated, corrections, total, from, to };
}

// ---------------------------------------------------------------------------
// GET /api/admin/report/csv
// ---------------------------------------------------------------------------
export async function exportCSV(req, res, next) {
  try {
    const { from, to } = req.query;
    const { tickets, total, escalated, corrections } = await buildReportPayload(from, to);

    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

    const lines = [
      // Summary header
      ['# Campus Help Desk — Export Report', '', '', '', '', '', '', '', ''],
      [`# Period: ${from || 'all time'} to ${to || 'now'}`, '', '', '', '', '', '', '', ''],
      [`# Total: ${total} | Escalated: ${escalated} | AI corrections: ${corrections}`, '', '', '', '', '', '', '', ''],
      [''],
      // Column headers
      ['Tracking ID', 'Reg No', 'Issue Date', 'Category', 'Priority', 'Status', 'Route To',
        'ETA (h)', 'Actual (h)', 'AI Confidence Low', 'Detected Language', 'Created At'],
    ];

    for (const t of tickets) {
      lines.push([
        esc(t.trackingId),
        esc(t.regNo),
        esc(t.issueDate?.toISOString().split('T')[0] ?? ''),
        esc(t.category),
        esc(t.priority),
        esc(t.status),
        esc(t.routeTo),
        esc(t.etaHours),
        esc(t.actualResolutionHours ?? ''),
        esc(t.aiConfidenceLow),
        esc(t.detectedLanguage),
        esc(t.createdAt?.toISOString() ?? ''),
      ]);
    }

    const csv = lines.map(row => row.join(',')).join('\r\n');
    const filename = `helpdesk-report-${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send('\uFEFF' + csv); // BOM for Excel compatibility
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// GET /api/admin/report/pdf
// ---------------------------------------------------------------------------
export async function exportPDF(req, res, next) {
  try {
    const { from, to } = req.query;
    const { tickets, total, byStatus, byCategory, slaData, escalated, corrections } = await buildReportPayload(from, to);

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Title
    doc.setFontSize(16);
    doc.text('Campus Help Desk — Report', 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Demo Only: Use Fictional Data`, 14, 22);
    doc.text(`Period: ${from || 'all time'} → ${to || 'now'}   |   Total tickets: ${total}   |   Escalated: ${escalated}   |   AI corrections: ${corrections}`, 14, 28);

    // KPI summary table
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text('Status Summary', 14, 36);
    autoTable(doc, {
      startY: 39,
      head: [['Status', 'Count']],
      body: byStatus.map(s => [s._id, s.count]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [29, 78, 216] },
      margin: { left: 14 },
      tableWidth: 60,
    });

    // Category breakdown
    const afterKpi = doc.lastAutoTable.finalY + 8;
    doc.text('Top Categories', 14, afterKpi);
    autoTable(doc, {
      startY: afterKpi + 3,
      head: [['Category', 'Count']],
      body: byCategory.map(c => [c._id, c.count]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [29, 78, 216] },
      margin: { left: 14 },
      tableWidth: 100,
    });

    // SLA table
    if (slaData.length) {
      const afterCat = doc.lastAutoTable.finalY + 8;
      doc.text('SLA Performance', 14, afterCat);
      autoTable(doc, {
        startY: afterCat + 3,
        head: [['Category', 'Avg ETA (h)', 'Avg Actual (h)', 'Count']],
        body: slaData.map(s => [s._id, s.avgEta?.toFixed(1), s.avgActual?.toFixed(1), s.count]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [29, 78, 216] },
        margin: { left: 14 },
      });
    }

    // Ticket detail table (new page)
    doc.addPage();
    doc.setFontSize(11);
    doc.text('Ticket List', 14, 14);
    autoTable(doc, {
      startY: 18,
      head: [['Tracking ID', 'Reg No', 'Category', 'Priority', 'Status', 'ETA(h)', 'Actual(h)', 'Created']],
      body: tickets.map(t => [
        t.trackingId,
        t.regNo,
        t.category,
        t.priority,
        t.status,
        t.etaHours,
        t.actualResolutionHours ?? '—',
        t.createdAt?.toISOString().split('T')[0] ?? '',
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [29, 78, 216] },
      margin: { left: 14 },
    });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const filename = `helpdesk-report-${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(pdfBuffer);
  } catch (err) { next(err); }
}
