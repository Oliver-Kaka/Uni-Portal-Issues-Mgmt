/**
 * Seed script — inserts 20 fictional demo tickets.
 * Usage:
 *   npm run seed              → upsert all 20 demo tickets
 *   npm run seed -- --reset   → delete all isDemoSeed documents then re-insert
 *
 * Safety: refuses to run in production unless --force is passed.
 * Demo Only: Use Fictional Data — all names, reg numbers, and descriptions are fictional.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import Ticket from './models/Ticket.js';

// ---------------------------------------------------------------------------
// Production guard
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const isReset = args.includes('--reset');
const isForce = args.includes('--force');

if (process.env.NODE_ENV === 'production' && !isForce) {
  console.error('[Seed] Refusing to run in production. Pass --force to override.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Fictional seed data — 20 tickets across all categories, priorities, statuses
// ---------------------------------------------------------------------------
const SEEDS = [
  // --- Portal Login Failure ---
  {
    trackingId: 'HD-DEMO-AA01',
    regNo: 'SCT221-0119/2024',
    issueDate: new Date('2024-05-10'),
    description: 'I cannot log into the student portal since the password reset yesterday. The error message says my account is locked and I have an assignment due today.',
    category: 'Portal Login Failure',
    priority: 'High',
    routeTo: 'IT Help Desk',
    canAutoResolve: true,
    etaHours: 8,
    summary: 'Your account lock has been logged. IT Help Desk will restore access within 8 hours.',
    aiConfidenceLow: false,
    status: 'In Progress',
    statusHistory: [
      { status: 'Open',        publicNote: 'Ticket received and logged.',         changedAt: new Date('2024-05-10T08:00:00Z') },
      { status: 'In Progress', publicNote: 'IT Help Desk is investigating.',       changedAt: new Date('2024-05-10T09:30:00Z') },
    ],
  },
  {
    trackingId: 'HD-DEMO-AA02',
    regNo: 'ICT555-7890/2019',
    issueDate: new Date('2024-04-22'),
    description: 'My password was reset but the new one does not work on any device. I have tried three different browsers with no success at all.',
    category: 'Portal Login Failure',
    priority: 'Medium',
    routeTo: 'IT Help Desk',
    canAutoResolve: true,
    etaHours: 24,
    summary: 'Your login issue has been received. IT Help Desk will contact you within 24 hours.',
    aiConfidenceLow: false,
    status: 'Resolved',
    statusHistory: [
      { status: 'Open',     publicNote: 'Ticket received.',                changedAt: new Date('2024-04-22T10:00:00Z') },
      { status: 'Resolved', publicNote: 'Password reset link was resent.', changedAt: new Date('2024-04-23T11:00:00Z') },
    ],
  },
  {
    trackingId: 'HD-DEMO-AA03',
    regNo: 'NUR111-0001/2030',
    issueDate: new Date('2024-06-01'),
    description: 'My two-factor authentication code is not arriving on my phone. I have checked spam and tried multiple times.',
    category: 'Portal Login Failure',
    priority: 'Medium',
    routeTo: 'IT Help Desk',
    canAutoResolve: true,
    etaHours: 24,
    summary: 'Your 2FA issue has been logged. IT Help Desk will investigate the SMS delivery issue.',
    aiConfidenceLow: false,
    status: 'Open',
    statusHistory: [
      { status: 'Open', publicNote: 'Ticket received.', changedAt: new Date('2024-06-01T07:00:00Z') },
    ],
  },
  // --- Fee Discrepancy ---
  {
    trackingId: 'HD-DEMO-BB01',
    regNo: 'SCT221-0456/2023',
    issueDate: new Date('2024-05-15'),
    description: 'My fee statement shows an unexplained charge of KES 8,000 for a service I did not request. This is affecting my ability to register for next semester.',
    category: 'Fee Discrepancy',
    priority: 'High',
    routeTo: 'Finance & Bursary',
    canAutoResolve: false,
    etaHours: 72,
    summary: 'Your fee discrepancy has been escalated to Finance & Bursary for review within 72 hours.',
    aiConfidenceLow: false,
    status: 'Escalated',
    statusHistory: [
      { status: 'Open',      publicNote: 'Ticket received.',                              changedAt: new Date('2024-05-15T08:00:00Z') },
      { status: 'Escalated', publicNote: 'Forwarded to Finance & Bursary for review.',    changedAt: new Date('2024-05-15T09:00:00Z') },
    ],
  },
  {
    trackingId: 'HD-DEMO-BB02',
    regNo: 'BUS890-4321/2021',
    issueDate: new Date('2024-03-10'),
    description: 'I paid my tuition fee on 5 March but the portal still shows an outstanding balance. My bank confirms the payment went through successfully.',
    category: 'Fee Discrepancy',
    priority: 'High',
    routeTo: 'Finance & Bursary',
    canAutoResolve: false,
    etaHours: 48,
    summary: 'Your payment allocation issue has been escalated. Please attach your bank receipt when responding.',
    aiConfidenceLow: false,
    status: 'Resolved',
    statusHistory: [
      { status: 'Open',      publicNote: 'Ticket received.',           changedAt: new Date('2024-03-10T07:00:00Z') },
      { status: 'Escalated', publicNote: 'Sent to Finance for check.', changedAt: new Date('2024-03-10T10:00:00Z') },
      { status: 'Resolved',  publicNote: 'Payment matched and posted.', changedAt: new Date('2024-03-12T14:00:00Z') },
    ],
  },
  {
    trackingId: 'HD-DEMO-BB03',
    regNo: 'ENG101-1234/2023',
    issueDate: new Date('2024-06-03'),
    description: 'I was charged a late fee even though I submitted my fee payment before the deadline according to my receipt.',
    category: 'Fee Discrepancy',
    priority: 'Medium',
    routeTo: 'Finance & Bursary',
    canAutoResolve: false,
    etaHours: 72,
    summary: 'Your late-fee dispute has been logged. Finance will review your receipt within 72 hours.',
    aiConfidenceLow: false,
    status: 'Open',
    statusHistory: [
      { status: 'Open', publicNote: 'Ticket received.', changedAt: new Date('2024-06-03T08:30:00Z') },
    ],
  },
  // --- Unit Registration ---
  {
    trackingId: 'HD-DEMO-CC01',
    regNo: 'SCT221-0789/2025',
    issueDate: new Date('2024-05-20'),
    description: 'The system will not let me register for COMP3020. It says I have an academic hold but I have cleared all my fees and met the prerequisites. Registration closes tomorrow.',
    category: 'Unit Registration',
    priority: 'Urgent',
    routeTo: "Registrar's Office",
    canAutoResolve: false,
    etaHours: 4,
    summary: 'Your urgent registration issue has been escalated. The Registrar will respond within 4 hours.',
    aiConfidenceLow: false,
    status: 'In Progress',
    statusHistory: [
      { status: 'Open',        publicNote: 'Ticket received.',                       changedAt: new Date('2024-05-20T07:00:00Z') },
      { status: 'In Progress', publicNote: "Escalated to Registrar's Office urgently.", changedAt: new Date('2024-05-20T07:45:00Z') },
    ],
  },
  {
    trackingId: 'HD-DEMO-CC02',
    regNo: 'LAW456-5678/2025',
    issueDate: new Date('2024-05-18'),
    description: 'I am trying to add an elective unit LAW4010 but the system says the unit is full even though I can see open slots when I check the timetable.',
    category: 'Unit Registration',
    priority: 'High',
    routeTo: "Registrar's Office",
    canAutoResolve: false,
    etaHours: 24,
    summary: 'Your unit enrolment conflict has been logged. The Registrar will investigate the capacity discrepancy.',
    aiConfidenceLow: false,
    status: 'Open',
    statusHistory: [
      { status: 'Open', publicNote: 'Ticket received.', changedAt: new Date('2024-05-18T11:00:00Z') },
    ],
  },
  {
    trackingId: 'HD-DEMO-CC03',
    regNo: 'MED302-9001/2018',
    issueDate: new Date('2024-04-05'),
    description: 'I completed a course last year but it does not appear in my registered units list. I have a transcript showing I passed it.',
    category: 'Unit Registration',
    priority: 'Medium',
    routeTo: "Registrar's Office",
    canAutoResolve: false,
    etaHours: 48,
    summary: 'Your missing unit record has been logged and will be reviewed by the Registrar.',
    aiConfidenceLow: false,
    status: 'Closed',
    statusHistory: [
      { status: 'Open',     publicNote: 'Ticket received.',                  changedAt: new Date('2024-04-05T08:00:00Z') },
      { status: 'Resolved', publicNote: 'Unit record updated in the system.', changedAt: new Date('2024-04-08T15:00:00Z') },
      { status: 'Closed',   publicNote: 'Confirmed resolved by student.',      changedAt: new Date('2024-04-09T09:00:00Z') },
    ],
  },
  {
    trackingId: 'HD-DEMO-CC04',
    regNo: 'AAA000-0000/2000',
    issueDate: new Date('2024-05-22'),
    description: 'Cannot register for two units simultaneously. The system keeps timing out when I try to submit the registration form after selecting both units.',
    category: 'Unit Registration',
    priority: 'Urgent',
    routeTo: 'IT Help Desk',
    canAutoResolve: true,
    etaHours: 2,
    summary: 'Your registration timeout issue has been escalated urgently. IT will investigate immediately.',
    aiConfidenceLow: false,
    status: 'Resolved',
    statusHistory: [
      { status: 'Open',     publicNote: 'Ticket received.',             changedAt: new Date('2024-05-22T06:00:00Z') },
      { status: 'Resolved', publicNote: 'System cache cleared by IT.',  changedAt: new Date('2024-05-22T08:00:00Z') },
    ],
  },
  // --- Graduation / Email Transfer ---
  {
    trackingId: 'HD-DEMO-DD01',
    regNo: 'HRD776-0987/2026',
    issueDate: new Date('2024-05-01'),
    description: 'I graduated in May 2024 and my university email was never migrated to the alumni account as stated in the graduation letter I received.',
    category: 'Graduation / Email Transfer',
    priority: 'Low',
    routeTo: 'Alumni & IT Services',
    canAutoResolve: false,
    etaHours: 168,
    summary: 'Your email migration request has been logged and will be processed within 7 days.',
    aiConfidenceLow: false,
    status: 'In Progress',
    statusHistory: [
      { status: 'Open',        publicNote: 'Ticket received.',                   changedAt: new Date('2024-05-01T09:00:00Z') },
      { status: 'In Progress', publicNote: 'Alumni Services are processing migration.', changedAt: new Date('2024-05-03T10:00:00Z') },
    ],
  },
  {
    trackingId: 'HD-DEMO-DD02',
    regNo: 'ZZZ999-9999/2099',
    issueDate: new Date('2024-04-15'),
    description: 'My graduation certificate shows the wrong date of completion. It says December 2023 but I graduated in May 2024 after completing a supplementary exam.',
    category: 'Graduation / Email Transfer',
    priority: 'High',
    routeTo: "Registrar's Office",
    canAutoResolve: false,
    etaHours: 72,
    summary: 'Your certificate error has been escalated to the Registrar for correction. Please retain original documents.',
    aiConfidenceLow: false,
    status: 'Escalated',
    statusHistory: [
      { status: 'Open',      publicNote: 'Ticket received.',                            changedAt: new Date('2024-04-15T08:00:00Z') },
      { status: 'Escalated', publicNote: 'Forwarded to Registrar for document review.', changedAt: new Date('2024-04-15T11:00:00Z') },
    ],
  },
  {
    trackingId: 'HD-DEMO-DD03',
    regNo: 'ICT555-7890/2019',
    issueDate: new Date('2024-03-20'),
    description: 'My alumni email account was created but I cannot log into it. The password reset link sends to my old university address which no longer exists.',
    category: 'Graduation / Email Transfer',
    priority: 'Medium',
    routeTo: 'Alumni & IT Services',
    canAutoResolve: true,
    etaHours: 24,
    summary: 'Your alumni account access issue has been logged. IT will update your recovery email within 24 hours.',
    aiConfidenceLow: false,
    status: 'Resolved',
    statusHistory: [
      { status: 'Open',     publicNote: 'Ticket received.',                  changedAt: new Date('2024-03-20T08:00:00Z') },
      { status: 'Resolved', publicNote: 'Recovery email updated by IT team.', changedAt: new Date('2024-03-21T14:00:00Z') },
    ],
  },
  // --- Student ID Replacement ---
  {
    trackingId: 'HD-DEMO-EE01',
    regNo: 'SCT221-0321/2024',
    issueDate: new Date('2024-05-25'),
    description: 'My student card was stolen from my bag during a lecture last week. I need a replacement urgently because I cannot access the library or exam halls without it.',
    category: 'Student ID Replacement',
    priority: 'High',
    routeTo: 'Student Services',
    canAutoResolve: true,
    etaHours: 48,
    summary: 'Your ID replacement request has been logged. Student Services will issue a temporary pass within 24 hours and a permanent card within 48 hours.',
    aiConfidenceLow: false,
    status: 'In Progress',
    statusHistory: [
      { status: 'Open',        publicNote: 'Ticket received.',                   changedAt: new Date('2024-05-25T09:00:00Z') },
      { status: 'In Progress', publicNote: 'Temporary access pass being issued.', changedAt: new Date('2024-05-25T11:30:00Z') },
    ],
  },
  {
    trackingId: 'HD-DEMO-EE02',
    regNo: 'ENG101-1234/2023',
    issueDate: new Date('2024-04-10'),
    description: 'My student ID card was damaged in water and the chip no longer works. The card is physically intact but does not scan at any access point.',
    category: 'Student ID Replacement',
    priority: 'Medium',
    routeTo: 'Student Services',
    canAutoResolve: true,
    etaHours: 48,
    summary: 'Your damaged ID card replacement has been logged. Please visit Student Services with your card for a replacement.',
    aiConfidenceLow: false,
    status: 'Closed',
    statusHistory: [
      { status: 'Open',   publicNote: 'Ticket received.',                changedAt: new Date('2024-04-10T08:00:00Z') },
      { status: 'Resolved', publicNote: 'New card issued at front desk.', changedAt: new Date('2024-04-12T10:00:00Z') },
      { status: 'Closed', publicNote: 'Confirmed by student.',            changedAt: new Date('2024-04-12T15:00:00Z') },
    ],
  },
  {
    trackingId: 'HD-DEMO-EE03',
    regNo: 'BUS890-4321/2021',
    issueDate: new Date('2024-05-28'),
    description: 'My student ID card expired but the portal shows I am still enrolled. I need a renewed card to access the gym and library facilities.',
    category: 'Student ID Replacement',
    priority: 'Low',
    routeTo: 'Student Services',
    canAutoResolve: true,
    etaHours: 72,
    summary: 'Your card renewal request has been received. Visit Student Services with your enrolment confirmation for same-day service.',
    aiConfidenceLow: false,
    status: 'Open',
    statusHistory: [
      { status: 'Open', publicNote: 'Ticket received.', changedAt: new Date('2024-05-28T07:00:00Z') },
    ],
  },
  // --- Needs Human Review (AI fallback demonstration) ---
  {
    trackingId: 'HD-DEMO-FF01',
    regNo: 'LAW456-5678/2025',
    issueDate: new Date('2024-05-30'),
    description: 'There is a problem with my account but I am not sure exactly what it is. Something seems wrong with my registration and maybe my fees too, it is all quite confusing.',
    category: 'Needs Human Review',
    priority: 'Medium',
    routeTo: 'Help Desk — Manual Review',
    canAutoResolve: false,
    etaHours: 48,
    summary: 'We received your issue but could not automatically classify it. A help desk agent will review it within 48 hours.',
    aiConfidenceLow: true,
    status: 'Open',
    statusHistory: [
      { status: 'Open', publicNote: 'Ticket received. Awaiting manual review.', changedAt: new Date('2024-05-30T10:00:00Z') },
    ],
  },
  {
    trackingId: 'HD-DEMO-FF02',
    regNo: 'NUR111-0001/2030',
    issueDate: new Date('2024-04-28'),
    description: 'Everything is broken on my account since last Tuesday. Nothing works correctly and I need help immediately with multiple things at the same time please.',
    category: 'Needs Human Review',
    priority: 'High',
    routeTo: 'Help Desk — Manual Review',
    canAutoResolve: false,
    etaHours: 24,
    summary: 'We received your issue but could not automatically classify it. A help desk agent will prioritise your review.',
    aiConfidenceLow: true,
    status: 'In Progress',
    statusHistory: [
      { status: 'Open',        publicNote: 'Ticket received.',                          changedAt: new Date('2024-04-28T08:00:00Z') },
      { status: 'In Progress', publicNote: 'Agent assigned for manual investigation.',  changedAt: new Date('2024-04-28T09:15:00Z') },
    ],
  },
  // --- Additional variety tickets ---
  {
    trackingId: 'HD-DEMO-GG01',
    regNo: 'MED302-9001/2018',
    issueDate: new Date('2024-05-08'),
    description: 'I completed my attachment last semester but the system still shows a fail for that unit. My supervisor confirmed I passed and submitted the form.',
    category: 'Unit Registration',
    priority: 'High',
    routeTo: "Registrar's Office",
    canAutoResolve: false,
    etaHours: 48,
    summary: 'Your attachment grade dispute has been escalated to the Registrar for verification.',
    aiConfidenceLow: false,
    status: 'Escalated',
    statusHistory: [
      { status: 'Open',      publicNote: 'Ticket received.',                         changedAt: new Date('2024-05-08T08:00:00Z') },
      { status: 'Escalated', publicNote: 'Forwarded to Registrar for grade review.', changedAt: new Date('2024-05-08T10:00:00Z') },
    ],
  },
  {
    trackingId: 'HD-DEMO-GG02',
    regNo: 'AAA000-0000/2000',
    issueDate: new Date('2024-06-02'),
    description: 'The student portal is extremely slow during peak hours, taking over two minutes to load any page. This is making it impossible to complete my online coursework.',
    category: 'Portal Login Failure',
    priority: 'Low',
    routeTo: 'IT Help Desk',
    canAutoResolve: true,
    etaHours: 72,
    summary: 'Your portal performance report has been logged. IT will investigate server load during peak hours.',
    aiConfidenceLow: false,
    status: 'Open',
    statusHistory: [
      { status: 'Open', publicNote: 'Ticket received.', changedAt: new Date('2024-06-02T13:00:00Z') },
    ],
  },
];

// ---------------------------------------------------------------------------
// Chart seed data — 50 fictional resolved tickets over the last 30-60 days
// These give the analytics charts meaningful data to display.
// Demo Only: Use Fictional Data
// ---------------------------------------------------------------------------

/** Returns a Date that is `daysAgo` days before now, at the given hour. */
function daysBack(daysAgo, hour = 9) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d;
}

const CHART_CATEGORIES = [
  'Portal Login Failure',
  'Fee Discrepancy',
  'Unit Registration',
  'Graduation / Email Transfer',
  'Student ID Replacement',
];

const CHART_PRIORITIES   = ['Low', 'Medium', 'High', 'Urgent'];
const CHART_ROUTES       = ['IT Help Desk', 'Finance & Bursary', "Registrar's Office", 'Student Services', 'Alumni & IT Services'];
const CHART_ETA_HOURS    = [4, 8, 24, 48, 72];
const CHART_ACTUAL_HOURS = [3, 6, 20, 44, 70, 100];

const CHART_REG_NOS = [
  'SCT221-1001/2023', 'SCT221-1002/2023', 'BUS890-1003/2022',
  'ENG101-1004/2024', 'LAW456-1005/2023', 'ICT555-1006/2022',
  'MED302-1007/2021', 'NUR111-1008/2024', 'HRD776-1009/2025',
  'AAA000-1010/2020',
];

function pick(arr, i) { return arr[i % arr.length]; }

const CHART_SEEDS = Array.from({ length: 50 }, (_, i) => {
  const daysAgo  = 3 + Math.floor((i / 50) * 57); // spread from 3 to 60 days ago
  const cat      = pick(CHART_CATEGORIES, i * 3);
  const pri      = pick(CHART_PRIORITIES, i * 2);
  const eta      = pick(CHART_ETA_HOURS, i);
  const actual   = pick(CHART_ACTUAL_HOURS, i);
  const route    = pick(CHART_ROUTES, i);
  const regNo    = pick(CHART_REG_NOS, i);
  const created  = daysBack(daysAgo, 8 + (i % 10));
  const resolved = new Date(created.getTime() + actual * 60 * 60 * 1000);

  return {
    trackingId:            `HD-CHART-${String(i + 1).padStart(3, '0')}`,
    regNo,
    issueDate:             new Date(created),
    description:           `Fictional resolved ticket #${i + 1} for chart data. Category: ${cat}.`,
    maskedDescription:     `Fictional resolved ticket #${i + 1} for chart data. Category: ${cat}.`,
    hadPII:                false,
    category:              cat,
    priority:              pri,
    routeTo:               route,
    canAutoResolve:        i % 3 !== 0,
    etaHours:              eta,
    actualResolutionHours: actual,
    summary:               `Fictional ticket #${i + 1} resolved for demo purposes.`,
    summaryEn:             `Fictional ticket #${i + 1} resolved for demo purposes.`,
    detectedLanguage:      i % 5 === 0 ? 'sw' : 'en',
    suggestedSteps:        [],
    aiConfidenceLow:       i % 7 === 0,
    adminCategory:         i % 10 === 0 ? pick(CHART_CATEGORIES, i + 1) : null,
    status:                'Resolved',
    statusHistory: [
      { status: 'Open',     publicNote: 'Ticket received.',  changedAt: created },
      { status: 'Resolved', publicNote: 'Issue resolved.',   changedAt: resolved },
    ],
    createdAt: created,
    updatedAt: resolved,
  };
});

const ALL_SEEDS = [...SEEDS, ...CHART_SEEDS];

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
async function run() {
  await connectDB();

  if (isReset) {
    const deleted = await Ticket.deleteMany({ isDemoSeed: true });
    console.log(`[Seed] Deleted ${deleted.deletedCount} existing demo tickets.`);
  }

  let inserted = 0;
  let skipped = 0;

  for (const seed of ALL_SEEDS) {
    const doc = { ...seed, isDemoSeed: true };
    const result = await Ticket.updateOne(
      { trackingId: doc.trackingId },
      { $setOnInsert: doc },
      { upsert: true },
    );
    if (result.upsertedCount > 0) {
      inserted++;
    } else {
      skipped++;
    }
  }

  console.log(`[Seed] Done. Inserted: ${inserted}, Skipped (already exist): ${skipped} (total attempted: ${ALL_SEEDS.length})`);
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('[Seed] Error:', err.message);
  process.exit(1);
});
