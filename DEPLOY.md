# Deploy Guide — Campus Help Desk Assistant

> **Demo Only: Use Fictional Data.** This project is a learning prototype. It must never be connected to real university systems, real student data, or a real payment service.

---

## Prerequisites

| Tool | Minimum version | Notes |
|------|----------------|-------|
| Node.js | 18 LTS | 20 LTS recommended |
| npm | 9+ | comes with Node |
| MongoDB Atlas account | free M0 tier | or any MongoDB 6+ instance |
| Google AI Studio API key | Gemini 1.5 Flash | [aistudio.google.com](https://aistudio.google.com) |
| Vercel account | free Hobby tier | [vercel.com](https://vercel.com) |

---

## Environment Variables

Copy `server/.env.example` to `server/.env` and fill in every value:

```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/helpdesk?retryWrites=true&w=majority
GEMINI_API_KEY=<your Gemini API key — server-side only, never in the browser>
JWT_SECRET=<random 32+ char string>
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<bcrypt hash — see below>
COOKIE_SECURE=true          # set to true in production
CLIENT_ORIGIN=https://your-vercel-domain.vercel.app
NODE_ENV=production
```

### Generating the admin password hash

```bash
node -e "
import('./server/src/services/authService.js')
  .then(m => m.hashPassword('your-strong-password'))
  .then(console.log)
"
```

Copy the output into `ADMIN_PASSWORD_HASH`. **Never commit the plaintext password.**

---

## Local Development

```bash
# 1. Install all workspace dependencies (from repo root)
npm install

# 2. Start the API server (port 3001, with file watching)
npm run dev --workspace=server

# 3. In a second terminal, start the Vite dev server (port 5173)
npm run dev --workspace=client
```

The Vite proxy in `client/vite.config.js` forwards `/api/*` to `http://localhost:3001` so you don't need CORS config locally.

### Seed demo data

```bash
# Insert 70 fictional demo tickets (idempotent — safe to run multiple times)
npm run seed --workspace=server

# Reset (delete all demo tickets) then re-seed
npm run seed:reset --workspace=server
```

> **Note:** The seed script refuses to run in production unless you pass `--force`. Never use `--force` with real data.

---

## MongoDB Atlas — Network Access

1. In Atlas → **Network Access** → **Add IP Address**
2. During development: add your machine's IP.
3. For Vercel: Vercel functions use dynamic IPs. You must allow **`0.0.0.0/0`** (all IPs) for serverless deployments, **or** use Vercel's paid [IP Allowlist](https://vercel.com/docs/security/deployment-protection/methods-to-protect-deployments/vercel-authentication) feature.

---

## Vercel Deployment

### 1. Import the repository

- Go to **vercel.com/new** → import your GitHub repo.

### 2. Configure build settings

Vercel reads `vercel.json` at the root. The config already sets:

| Setting | Value |
|---------|-------|
| Build command | `npm run build --workspace=client` |
| Output directory | `client/dist` |
| Serverless function | `server/api/index.js` |
| API rewrites | `/api/*` → serverless function |
| SPA rewrites | `/*` → `client/dist/index.html` |

### 3. Set environment variables in Vercel

In **Project Settings → Environment Variables**, add every variable from `.env.example`. Mark `GEMINI_API_KEY`, `JWT_SECRET`, and `MONGODB_URI` as **Sensitive (encrypted)**.

Set `NODE_ENV=production` and `COOKIE_SECURE=true`.

Set `CLIENT_ORIGIN` to your Vercel domain (e.g. `https://helpdesk-demo.vercel.app`).

### 4. Deploy

Push to `main` or click **Redeploy** in the Vercel dashboard.

---

## Rate Limiting — Serverless Caveat

`express-rate-limit` uses **in-memory storage** by default. Because Vercel spins up multiple serverless function instances, each instance has its own counter — rate limits are per-instance, not globally enforced.

For a learning prototype this is acceptable. For production use, replace the in-memory store with a Redis store (e.g. `@upstash/redis` + `rate-limit-redis`) and add `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` to your env.

---

## Pre-Deploy Checklist

- [ ] `COOKIE_SECURE=true` in Vercel environment variables
- [ ] `NODE_ENV=production` in Vercel environment variables
- [ ] `GEMINI_API_KEY` is set and **not** exposed to the client bundle (run `grep -r "GEMINI" client/src` — should return nothing)
- [ ] `CLIENT_ORIGIN` matches the exact Vercel domain (no trailing slash)
- [ ] MongoDB Atlas network access allows Vercel IPs (or `0.0.0.0/0`)
- [ ] Admin password hash is a strong bcrypt hash, not `123456`
- [ ] Seed data is loaded: `npm run seed --workspace=server`
- [ ] `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` match what you expect

---

## Smoke Test Checklist (after deploy)

| Test | Expected result |
|------|----------------|
| `GET /api/health` | `{ status: "ok", db: "connected" }` |
| Submit a fictional ticket on `/` | Returns tracking ID, AI triage, no real data sent |
| Track the ticket on `/track` | Shows status, summary, timeline |
| Admin login at `/admin/login` | Redirects to `/admin/dashboard` |
| Admin dashboard charts load | Bar/line charts render with seed data |
| Admin ticket detail shows audit log | AuditLog entries visible after updating a ticket |
| Dark mode toggle | Cycles Light → Dark → System |
| Outage banner | Does NOT appear unless 5+ tickets in the same category were submitted in the last 60 min |
| Rate limiting | Rapid fire 20+ requests to `/api/tickets` returns `429` |

---

## Security Notes

- **Helmet** adds HTTP security headers to all API responses: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `HSTS` (production only), CSP.
- **JWT** is stored in an `httpOnly`, `SameSite=lax` cookie — not accessible from JavaScript.
- **Gemini API key** is server-side only. It never appears in the client bundle.
- **PII masking** runs before any text is sent to Gemini. The raw description is stored admin-only and never returned by public endpoints.
- **CORS** restricts to `CLIENT_ORIGIN` only — the browser cannot call the API from arbitrary origins.

---

*Campus Help Desk Assistant — Demo Only: Use Fictional Data*
