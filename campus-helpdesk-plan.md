# Campus Help Desk Assistant — Technical Plan

> **Demo Only: Use Fictional Data**
> This is a learning prototype. No real university systems, databases, portals, or payment services are connected.
> All data is fictional. Every screen must display the banner: "Demo Only: Use Fictional Data".

---

## Top-Level Overview

**Goal:** Build a web app where university students and staff describe an issue and receive an AI-assisted triage result plus a unique tracking ID. A second page lets them check the status of their ticket.

**Scope:** MVP features only — Issue Submission, AI Triage via Gemini, Ticket Persistence in MongoDB, and Issue Tracking. Admin review (Nice-to-Have) is out of scope for this plan iteration.

**Approach:**
- React (Vite) frontend — mobile-first, no auth required.
- Node.js + Express backend — handles all Gemini API calls and DB writes. Structured for Vercel serverless deployment.
- MongoDB Atlas (Mongoose) — all ticket data persists between restarts.
- Gemini API key lives only in `.env` on the server; it is never sent to the browser.
- One shared `validation.config.js` file (imported by both client and server) holds all regex patterns and validation constants.

---

## Folder Structure

```
campus-helpdesk/
├── client/                         # React + Vite frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── assets/                 # Logos, icons
│   │   ├── components/
│   │   │   ├── DemoBanner.jsx      # "Demo Only" sticky banner
│   │   │   ├── IssueForm.jsx       # Submit Issue form
│   │   │   ├── TrackingResult.jsx  # Ticket status display
│   │   │   ├── StatusTimeline.jsx  # Status history list
│   │   │   └── PriorityBadge.jsx   # Colour-coded priority chip
│   │   ├── pages/
│   │   │   ├── SubmitPage.jsx      # Page 1: Submit Issue
│   │   │   └── TrackPage.jsx       # Page 2: Track Issue
│   │   ├── hooks/
│   │   │   └── useSubmitIssue.js   # Encapsulates POST /api/tickets
│   │   ├── utils/
│   │   │   └── validators.js       # Client-side validation using shared config
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env                        # VITE_API_BASE_URL only — no secrets
│   ├── vite.config.js
│   └── package.json
│
├── server/                         # Node.js + Express backend
│   ├── api/                        # Vercel serverless entry points
│   │   └── index.js                # Mounts the Express app (Vercel handler)
│   ├── src/
│   │   ├── routes/
│   │   │   └── tickets.js          # All /api/tickets routes
│   │   ├── controllers/
│   │   │   └── ticketController.js # Route handler logic
│   │   ├── services/
│   │   │   ├── geminiService.js    # Gemini API call + response validation
│   │   │   └── trackingIdService.js# Tracking ID generation + collision check
│   │   ├── models/
│   │   │   └── Ticket.js           # Mongoose schema
│   │   ├── middleware/
│   │   │   ├── validate.js         # Express request validation middleware
│   │   │   ├── rateLimiter.js      # express-rate-limit configuration
│   │   │   └── sanitize.js         # Input sanitisation middleware
│   │   ├── config/
│   │   │   └── db.js               # MongoDB Atlas connection
│   │   └── app.js                  # Express app setup (no listen call — Vercel-compatible)
│   ├── .env                        # MONGODB_URI, GEMINI_API_KEY, PORT
│   └── package.json
│
├── shared/
│   └── validation.config.js        # Single source of truth for all regex + rules
│
├── vercel.json                     # Routing: /api/* → server, /* → client
└── README.md
```

---

## Shared Validation Config

**File:** [`shared/validation.config.js`](shared/validation.config.js)

This file is imported by both `client/src/utils/validators.js` and `server/src/middleware/validate.js`. Changing a rule here propagates to both layers automatically.

```js
// shared/validation.config.js
// Demo Only: Use Fictional Data

export const VALIDATION = {
  REG_NUMBER: {
    regex: /^[A-Z]{3}\d{3}-\d{4}\/20[0-9]{2}$/,
    message: 'Format: 3 uppercase letters + 3 digits + hyphen + 4 digits + slash + 4-digit year (2000–2099). E.g. SCT221-0119/2024',
  },
  PHONE: {
    regex: /^(\+2547\d{8}|07\d{8}|01\d{8})$/,
    message: 'Enter a Kenyan mobile number: +2547XXXXXXXX, 07XXXXXXXX, or 01XXXXXXXX',
    optional: true,
  },
  TRACKING_ID: {
    regex: /^HD-[A-Z0-9]{4}-[A-Z0-9]{4}$/,
    message: 'Format: HD-XXXX-XXXX (uppercase letters and digits)',
  },
  DESCRIPTION: {
    minLength: 20,
    maxLength: 1000,
  },
  ISSUE_DATE: {
    canBeFuture: false,
  },
};
```

---

## Regex Specifications

### 1 — Registration / Staff Number

**Pattern:** `/^[A-Z]{3}\d{3}-\d{4}\/20[0-9]{2}$/`

| Part | Meaning |
|------|---------|
| `^` | Start of string |
| `[A-Z]{3}` | Exactly 3 uppercase ASCII letters (department/faculty code) |
| `\d{3}` | Exactly 3 digits |
| `-` | Literal hyphen separator |
| `\d{4}` | Exactly 4 digits (sequential enrolment number) |
| `\/` | Literal forward slash |
| `20` | Year must start with "20" (covers 2000–2099) |
| `[0-9]{2}` | Last two digits of the year (00–99) |
| `$` | End of string |

**10 valid strings:**
1. `SCT221-0119/2024`
2. `HRD776-0987/2026`
3. `AAA000-0000/2000`
4. `ZZZ999-9999/2099`
5. `ENG101-1234/2023`
6. `LAW456-5678/2025`
7. `MED302-9001/2018`
8. `NUR111-0001/2030`
9. `BUS890-4321/2021`
10. `ICT555-7890/2019`

**10 invalid strings:**
| String | Reason invalid |
|--------|---------------|
| `sct221-0119/2024` | Lowercase letters |
| `SC221-0119/2024` | Only 2 letters before digits |
| `SCTT221-0119/2024` | 4 letters instead of 3 |
| `SCT22-0119/2024` | Only 2 digits in first group |
| `SCT221_0119/2024` | Underscore instead of hyphen |
| `SCT221-011/2024` | Only 3 digits in second group |
| `SCT221-0119-2024` | Hyphen instead of slash |
| `SCT221-0119/1999` | Year before 2000 |
| `SCT221-0119/2100` | Year after 2099 |
| `SCT221-0119/202` | Incomplete year |

---

### 2 — Kenyan Phone Number (Optional)

**Pattern:** `/^(\+2547\d{8}|07\d{8}|01\d{8})$/`

| Part | Meaning |
|------|---------|
| `\+2547\d{8}` | International format: +254 followed by 7, then 8 digits (Safaricom/Airtel 07xx) |
| `07\d{8}` | Local format starting with 07, then 8 digits |
| `01\d{8}` | Local format starting with 01 (Telkom Kenya), then 8 digits |

Field is optional — validation only fires when a value is present.

---

### 3 — Tracking ID

**Pattern:** `/^HD-[A-Z0-9]{4}-[A-Z0-9]{4}$/`

| Part | Meaning |
|------|---------|
| `HD-` | Fixed prefix — Help Desk |
| `[A-Z0-9]{4}` | 4 alphanumeric characters (uppercase, no ambiguous chars) |
| `-` | Separator |
| `[A-Z0-9]{4}` | 4 more alphanumeric characters |

Total entropy: 36^8 ≈ 2.8 trillion combinations — practically unguessable for a demo. Ambiguous characters (0/O, 1/I/L) are excluded from the generation alphabet to improve readability.

**Generation alphabet:** `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (32 characters, no ambiguous chars)

**Entropy with restricted alphabet:** 32^8 ≈ 1.1 trillion combinations — still unguessable.

---

## MongoDB Schema — Ticket

**File:** [`server/src/models/Ticket.js`](server/src/models/Ticket.js)

```js
// Demo Only: Use Fictional Data
{
  trackingId:     { type: String, required: true, unique: true, index: true },
  regNo:          { type: String, required: true },        // validated against REG_NUMBER regex
  issueDate:      { type: Date,   required: true },        // must not be in the future
  description:    { type: String, required: true },        // 20–1000 chars, sanitised
  phone:          { type: String, default: null },         // optional, sanitised

  // AI Triage fields (populated after Gemini call)
  category:       {
    type: String,
    enum: [
      'Portal Login Failure',
      'Fee Discrepancy',
      'Unit Registration',
      'Graduation / Email Transfer',
      'Student ID Replacement',
      'Needs Human Review',          // fallback when AI output is invalid
    ],
    required: true,
  },
  priority:       { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], required: true },
  routeTo:        { type: String, required: true },        // e.g. "IT Help Desk"
  canAutoResolve: { type: Boolean, required: true },       // false = needs escalation
  etaHours:       { type: Number, required: true },        // estimated resolution hours
  summary:        { type: String, required: true },        // plain-language summary

  // Lifecycle
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Escalated', 'Resolved', 'Closed'],
    default: 'Open',
  },
  statusHistory: [
    {
      status:    { type: String, required: true },
      note:      { type: String, default: '' },
      changedAt: { type: Date,   default: Date.now },
    },
  ],

  createdAt:  { type: Date, default: Date.now },
  updatedAt:  { type: Date, default: Date.now },
}
```

**Indexes:**
- `trackingId` — unique, used for fast lookup on the Track page.
- `createdAt` — descending, for admin list pagination (future use).

---

## REST API Endpoints

> **Demo Only: Use Fictional Data** — all examples below use fictional identifiers.

### POST `/api/tickets` — Submit a new issue

**Request body:**
```json
{
  "regNo": "SCT221-0119/2024",
  "issueDate": "2024-05-15",
  "description": "I cannot log into the student portal since the password reset yesterday. The error message says my account is locked.",
  "phone": "0712345678",
  "consentGiven": true
}
```

**Success response `201`:**
```json
{
  "success": true,
  "trackingId": "HD-7K3Q-9XPM",
  "category": "Portal Login Failure",
  "priority": "Medium",
  "routeTo": "IT Help Desk",
  "canAutoResolve": true,
  "etaHours": 24,
  "summary": "Your portal login issue has been logged. The IT Help Desk will reset your account lock within 24 hours.",
  "status": "Open",
  "createdAt": "2024-05-15T10:34:00.000Z",
  "_demo": "Demo Only: Use Fictional Data"
}
```

**Error responses:**
| HTTP Code | Scenario |
|-----------|---------|
| `400` | Validation failure — body contains `errors` array with field-level messages |
| `429` | Rate limit exceeded |
| `500` | Gemini call failed and fallback also failed; ticket saved with category "Needs Human Review" |
| `503` | MongoDB unavailable |

---

### GET `/api/tickets/:trackingId` — Retrieve a ticket by tracking ID

**URL example:** `GET /api/tickets/HD-7K3Q-9XPM`

**Success response `200`:**
```json
{
  "success": true,
  "ticket": {
    "trackingId": "HD-7K3Q-9XPM",
    "regNo": "SCT221-0119/2024",
    "issueDate": "2024-05-15T00:00:00.000Z",
    "category": "Portal Login Failure",
    "priority": "Medium",
    "routeTo": "IT Help Desk",
    "canAutoResolve": true,
    "etaHours": 24,
    "summary": "Your portal login issue has been logged. The IT Help Desk will reset your account lock within 24 hours.",
    "status": "Open",
    "statusHistory": [
      { "status": "Open", "note": "Ticket created", "changedAt": "2024-05-15T10:34:00.000Z" }
    ],
    "createdAt": "2024-05-15T10:34:00.000Z",
    "updatedAt": "2024-05-15T10:34:00.000Z"
  },
  "_demo": "Demo Only: Use Fictional Data"
}
```

**Error responses:**
| HTTP Code | Scenario |
|-----------|---------|
| `400` | Tracking ID does not match the expected regex pattern |
| `404` | No ticket found for this tracking ID |
| `429` | Rate limit exceeded |

---

### GET `/api/health` — Health check (no auth required)

**Response `200`:**
```json
{ "status": "ok", "db": "connected", "timestamp": "2024-05-15T10:34:00.000Z" }
```

---

## Gemini Prompt Design

### System Instruction

```
You are a university help desk triage assistant for a DEMO system that uses FICTIONAL DATA only.

You will receive a free-text issue description from a student or staff member. Your job is to classify it and return a structured JSON object. Do not include any markdown, code fences, or extra text — return ONLY the raw JSON object.

You must use ONLY the following categories (choose the best match):
- "Portal Login Failure"
- "Fee Discrepancy"
- "Unit Registration"
- "Graduation / Email Transfer"
- "Student ID Replacement"

Priority levels: "Low" | "Medium" | "High" | "Urgent"

Rules:
- "Urgent" is reserved for issues that completely block academic progress (e.g. cannot register during registration week, locked out during exams).
- "High" is for issues with a financial or graduation impact.
- "Medium" is for issues that can wait 1–3 days without academic harm.
- "Low" is for informational or cosmetic issues.

canAutoResolve: true if the IT Help Desk can resolve this without escalation to another department.

etaHours: your best estimate in hours (integer). Use: 2, 4, 8, 24, 48, 72, or 168.

summary: one or two plain-language sentences addressed to the submitter, confirming what was understood and what happens next.

confidence: a number between 0 and 1 indicating how certain you are of the classification.
```

### Required JSON Response Schema

```json
{
  "category":       "Portal Login Failure",
  "priority":       "Medium",
  "routeTo":        "IT Help Desk",
  "canAutoResolve": true,
  "etaHours":       24,
  "summary":        "Your account lock has been logged. IT Help Desk will resolve it within 24 hours.",
  "confidence":     0.92
}
```

### Backend Validation & Fallback Rules

The `geminiService.js` module must:

1. **Parse the response as JSON.** If `JSON.parse` throws, go to fallback.
2. **Validate all required fields** are present and have the correct types/enum values.
3. **Check `confidence >= 0.70`.** If below threshold, go to fallback.
4. **Fallback values** when any rule above fails:
   ```json
   {
     "category":       "Needs Human Review",
     "priority":       "Medium",
     "routeTo":        "Help Desk — Manual Review",
     "canAutoResolve": false,
     "etaHours":       48,
     "summary":        "We received your issue but could not automatically classify it. A help desk agent will review it within 48 hours.",
     "confidence":     0
   }
   ```
5. **Log the raw Gemini response** (server-side only) whenever a fallback is triggered, for debugging.

---

## Tracking ID Generation

**File:** [`server/src/services/trackingIdService.js`](server/src/services/trackingIdService.js)

**Algorithm:**
1. Use alphabet `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (32 chars, no ambiguous characters).
2. Generate 8 random characters using `crypto.randomBytes` (cryptographically random, not `Math.random`).
3. Format as `HD-XXXX-XXXX`.
4. Query MongoDB: `Ticket.exists({ trackingId })`.
5. If collision found, repeat from step 2 (maximum 5 retries before throwing a `500`).
6. Return the unique ID.

**Why not sequential?** Sequential IDs (TKT-0001) are guessable — a user could enumerate other people's tickets. Random IDs prevent accidental disclosure.

---

## Input Sanitisation

**File:** [`server/src/middleware/sanitize.js`](server/src/middleware/sanitize.js)

Applied to all `POST` and `PATCH` body fields before validation runs.

| Rule | Detail |
|------|--------|
| Strip HTML tags | Use `sanitize-html` or `striptags` — remove all HTML from `description` and `phone` |
| Trim whitespace | `String.trim()` on all string fields |
| Normalise line breaks | Replace `\r\n` with `\n` in `description` |
| No-op on dates/booleans | Only string fields are sanitised |
| Length cap before DB write | Truncate `description` to 1000 chars server-side even if frontend validation passes |

---

## Validation Rules Summary

All rules enforced on **both** client (before submit) and server (in `validate.js` middleware). The regex source of truth is `shared/validation.config.js`.

| Field | Rule | Client | Server |
|-------|------|--------|--------|
| `regNo` | Must match `REG_NUMBER` regex | Yes | Yes |
| `issueDate` | Valid date, not in the future, not before 2000-01-01 | Yes | Yes |
| `description` | 20–1000 characters after trim, string | Yes | Yes |
| `phone` | Optional; if present, must match `PHONE` regex | Yes | Yes |
| `consentGiven` | Must be `true` (boolean) | Yes | Yes |
| `trackingId` (GET) | Must match `TRACKING_ID` regex | Yes | Yes |

**Server validation middleware** returns a structured `400` response:
```json
{
  "success": false,
  "errors": [
    { "field": "regNo", "message": "Format: 3 uppercase letters + 3 digits + hyphen + 4 digits + slash + 4-digit year (2000–2099)." },
    { "field": "description", "message": "Description must be at least 20 characters." }
  ]
}
```

---

## Error Handling Rules

| Layer | Rule |
|-------|------|
| Validation errors | Return `400` with `errors[]` array — never expose stack traces |
| Not found | Return `404` with `{ success: false, message: "..." }` |
| Gemini failure | Log server-side, apply fallback values, still save and return the ticket as `201` |
| MongoDB failure | Return `503` with a generic message; log the real error server-side only |
| Unexpected errors | Global Express error handler returns `500` with `{ success: false, message: "An unexpected error occurred." }` — no stack trace in production |
| `consentGiven: false` | Return `400` — do not call Gemini or write to DB |

---

## Rate Limiting Plan

**Package:** `express-rate-limit`
**File:** [`server/src/middleware/rateLimiter.js`](server/src/middleware/rateLimiter.js)

| Limiter | Route | Window | Max Requests | Response |
|---------|-------|--------|-------------|---------|
| `submitLimiter` | `POST /api/tickets` | 15 minutes | 5 per IP | `429` — "Too many submissions. Please wait before trying again." |
| `trackLimiter` | `GET /api/tickets/:id` | 15 minutes | 30 per IP | `429` — "Too many lookup requests. Please wait." |
| `globalLimiter` | All `/api/*` routes | 15 minutes | 100 per IP | `429` — "Rate limit exceeded." |

**Headers:** Return `Retry-After` header on all `429` responses so the client can show a countdown.

**Why low limits?** This is a demo prototype — low limits protect the Gemini API quota and MongoDB Atlas free tier from accidental abuse.

---

## Frontend Pages

> Every page must render the `<DemoBanner />` component at the top: **"Demo Only: Use Fictional Data"**

### Page 1 — Submit Issue (`/`)

| Field | Component | Validation |
|-------|-----------|-----------|
| Reg/Staff Number | Text input | REG_NUMBER regex, required |
| Issue Date | Date picker (`<input type="date">`) | Required, not in future |
| Issue Description | Textarea | 20–1000 chars; live character counter |
| Phone Number | Text input | Optional; PHONE regex if entered |
| Consent Checkbox | Checkbox | Must be checked to enable submit |
| Submit button | Button | Disabled until all required fields valid |

**On success:** Replace form with a confirmation card showing:
- Tracking ID (prominently, with a "Copy" button)
- Category, Priority badge, Department, Estimated resolution
- AI-generated summary
- Link to Track page

**On error:** Show inline field errors (from `errors[]` array) or a toast for network/server errors.

---

### Page 2 — Track Issue (`/track`)

| Element | Detail |
|---------|--------|
| Tracking ID input | Text input; validates TRACKING_ID regex before calling API |
| Search button | Calls `GET /api/tickets/:trackingId` |
| Result card | Shows category, priority badge, department, ETA, current status, summary |
| Status timeline | `<StatusTimeline />` — renders `statusHistory[]` as a vertical timeline |

**States to handle:** Loading spinner, not found (clear message), network error.

---

## Vercel Deployment Config

**File:** [`vercel.json`](vercel.json)

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/server/api/index.js" },
    { "source": "/(.*)",     "destination": "/client/index.html" }
  ]
}
```

The Express app in `server/src/app.js` **must not call `app.listen()`** — instead, `server/api/index.js` exports the Express app as the default export, which Vercel wraps as a serverless function.

---

## Fictional Seed Tickets (Demo Data)

> **Demo Only: Use Fictional Data**

To pre-populate the DB for demonstration, a seed script (`server/src/seed.js`) inserts the following five tickets, covering all categories, priorities, and escalation outcomes:

| Tracking ID | Reg No | Category | Priority | Escalate? | Route To | ETA |
|-------------|--------|----------|----------|-----------|----------|-----|
| HD-DEMO-0001 | SCT221-0119/2024 | Portal Login Failure | Medium | No | IT Help Desk | 24 hrs |
| HD-DEMO-0002 | SCT221-0456/2023 | Fee Discrepancy | High | Yes | Finance & Bursary | 72 hrs |
| HD-DEMO-0003 | SCT221-0789/2025 | Unit Registration | Urgent | Yes | Registrar's Office | 8 hrs |
| HD-DEMO-0004 | HRD776-0987/2026 | Graduation / Email Transfer | Low | No | Alumni & IT | 168 hrs |
| HD-DEMO-0005 | SCT221-0321/2024 | Student ID Replacement | Medium | No | Student Services | 48 hrs |

Seed tracking IDs use the `HD-DEMO-XXXX` format to make them visually distinct from real generated IDs.

---

## Sub-Tasks for Implementation

### Sub-Task 1 — Project Scaffolding
**Intent:** Create the folder structure, initialise both packages, install dependencies, and set up environment variable templates.
**Expected Outcomes:** `client/` and `server/` both run locally; `npm run dev` starts Vite; `npm start` starts Express on port 3001.
**Todo List:**
- [ ] Scaffold `client/` with `npm create vite@latest`
- [ ] Scaffold `server/` with `npm init`
- [ ] Install server deps: `express`, `mongoose`, `@google/generative-ai`, `express-rate-limit`, `sanitize-html`, `dotenv`, `cors`
- [ ] Install client deps: `react-router-dom`, `axios` (or fetch wrapper)
- [ ] Create `.env.example` for both `client/` and `server/`
- [ ] Create `shared/validation.config.js` with all regex and constants
- [ ] Add `vercel.json`
**Status:** `[ ] pending`

---

### Sub-Task 2 — MongoDB Connection & Ticket Schema
**Intent:** Connect to MongoDB Atlas and define the Mongoose schema with all fields, enums, and indexes.
**Expected Outcomes:** `server/src/config/db.js` connects successfully; `server/src/models/Ticket.js` exports the Mongoose model; a test insert and find work correctly.
**Todo List:**
- [ ] Implement `server/src/config/db.js` — connect with retry logic
- [ ] Implement `server/src/models/Ticket.js` — full schema as specified above
- [ ] Add `updatedAt` auto-update via Mongoose `pre('save')` hook
- [ ] Verify indexes (`trackingId` unique, `createdAt` descending)
**Status:** `[ ] pending`

---

### Sub-Task 3 — Shared Validation & Middleware
**Intent:** Implement the shared validation config, server-side validation middleware, and sanitisation middleware.
**Expected Outcomes:** Invalid requests to `POST /api/tickets` return `400` with structured `errors[]`; HTML tags are stripped from all string fields.
**Todo List:**
- [ ] Write `shared/validation.config.js` (regex, lengths, rules)
- [ ] Write `server/src/middleware/sanitize.js`
- [ ] Write `server/src/middleware/validate.js` for `POST /api/tickets` body
- [ ] Write `server/src/middleware/validate.js` for `GET /api/tickets/:id` param
- [ ] Write `server/src/middleware/rateLimiter.js` (submit, track, global limiters)
**Status:** `[ ] pending`

---

### Sub-Task 4 — Tracking ID Service
**Intent:** Implement cryptographically random, unguessable tracking ID generation with collision handling.
**Expected Outcomes:** `trackingIdService.generateId()` returns a unique `HD-XXXX-XXXX` ID; collisions are retried up to 5 times.
**Todo List:**
- [ ] Implement `server/src/services/trackingIdService.js`
- [ ] Use `crypto.randomBytes` with restricted alphabet
- [ ] Add collision check against MongoDB
- [ ] Add max-retry guard (5 attempts, then throw)
**Status:** `[ ] pending`

---

### Sub-Task 5 — Gemini Service
**Intent:** Implement the Gemini API call, response validation, and fallback logic entirely on the server.
**Expected Outcomes:** `geminiService.triage(description)` returns a valid triage object; invalid/low-confidence responses fall back to "Needs Human Review"; raw Gemini output is logged on fallback.
**Todo List:**
- [ ] Implement `server/src/services/geminiService.js`
- [ ] Add system instruction and JSON schema prompt
- [ ] Parse and validate all response fields
- [ ] Implement confidence threshold check (≥ 0.70)
- [ ] Implement fallback object
- [ ] Never log or return the Gemini API key
**Status:** `[ ] pending`

---

### Sub-Task 6 — Ticket Routes & Controller
**Intent:** Wire up `POST /api/tickets` and `GET /api/tickets/:trackingId` with all middleware and services.
**Expected Outcomes:** Full end-to-end ticket submission and retrieval work; all middleware fires in correct order; `_demo` field present in every response.
**Todo List:**
- [ ] Implement `server/src/controllers/ticketController.js` — `createTicket` and `getTicket`
- [ ] Implement `server/src/routes/tickets.js`
- [ ] Add global error handler in `server/src/app.js`
- [ ] Implement `GET /api/health`
- [ ] Export Express app from `server/api/index.js` for Vercel compatibility
**Status:** `[ ] pending`

---

### Sub-Task 7 — React Frontend: Submit Page
**Intent:** Build the Submit Issue form with client-side validation, Gemini triage display, and tracking ID confirmation.
**Expected Outcomes:** Form validates on blur and submit; on success shows confirmation card with tracking ID copy button; inline field errors shown on failure.
**Todo List:**
- [ ] Implement `DemoBanner.jsx`
- [ ] Implement `IssueForm.jsx` with all fields and validation using shared config
- [ ] Implement `useSubmitIssue.js` hook
- [ ] Implement `PriorityBadge.jsx`
- [ ] Implement `SubmitPage.jsx` — form + confirmation card states
- [ ] Mobile-first CSS (use CSS Modules or Tailwind)
**Status:** `[ ] pending`

---

### Sub-Task 8 — React Frontend: Track Page
**Intent:** Build the Track Issue page with tracking ID lookup, status display, and timeline.
**Expected Outcomes:** User can enter a tracking ID, see full ticket details, and see status history in a timeline; handles not-found and error states.
**Todo List:**
- [ ] Implement `TrackingResult.jsx`
- [ ] Implement `StatusTimeline.jsx`
- [ ] Implement `TrackPage.jsx` — input, loading, result, error states
- [ ] Add React Router routes in `App.jsx`
**Status:** `[ ] pending`

---

### Sub-Task 9 — Seed Data Script
**Intent:** Create a seed script that inserts the five demo tickets so the demo can be shown without submitting real tickets.
**Expected Outcomes:** Running `node server/src/seed.js` inserts the five seed tickets (idempotent — won't duplicate on re-run).
**Todo List:**
- [ ] Implement `server/src/seed.js`
- [ ] Use `updateOne` with `upsert: true` keyed on `trackingId`
- [ ] Include all five fictional tickets from the seed table above
**Status:** `[ ] pending`

---

## Open Questions (Carry Forward)

| # | Question | Decision Needed From |
|---|---------|---------------------|
| 1 | Should the client and server share the `shared/` folder via a monorepo tool (e.g. npm workspaces) or a simple relative `../../shared` import? | Developer preference |
| 2 | Tailwind CSS or plain CSS Modules for the frontend? | Developer preference |
| 3 | Should `GET /api/tickets/:id` return the `regNo` field? (Privacy consideration even in demo) | Stakeholder |
| 4 | Should seed data be inserted automatically on server start if the collection is empty, or only via a manual script? | Developer preference |
