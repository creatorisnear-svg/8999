# TikTok Drop — AI Dropshipping Assistant

An AI-powered TikTok Shop dropshipping assistant. Research trending products, find suppliers, generate viral TikTok marketing content, and manage your product pipeline from a single dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifact: `tiktok-dropship` at `/`)
- API: Express 5 (artifact: `api-server` at `/api`)
- DB: PostgreSQL + Drizzle ORM
- AI: **OpenAI GPT-4o-mini** — via Replit AI Integrations proxy on Replit, or standard `OPENAI_API_KEY` env var elsewhere
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — Drizzle ORM table definitions (products, suppliers, campaigns)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/` — Generated React Query hooks
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/tiktok-dropship/src/pages/` — React page components
- `artifacts/tiktok-dropship/src/components/Layout.tsx` — Sidebar nav layout

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed React Query hooks
- All AI calls are server-side (Express routes call OpenAI via Replit AI proxy)
- AI responses ask for JSON output and are parsed from the LLM's text response
- TikTok-inspired red/cyan design with dark-mode-ready CSS variables
- Products, suppliers, and campaigns are all stored in PostgreSQL for persistence

## Product

- **Dashboard**: Live stats, quick-action cards, getting-started guide, recent products & campaigns
- **Products**: Full product tracker with status (researching/active/paused/discontinued), profit margin calculator
- **AI Research**: Trending niches panel + product research with viral hooks, revenue estimates, competition levels; per-product Deep Dive analysis (BUY/PASS/RISKY verdict + 3-week launch plan) and Autopilot (suppliers + content + checklist in one shot)
- **Suppliers**: Supplier directory with platform, shipping time, rating, and MOQ
- **Campaigns**: Marketing content library with status workflow (draft → ready → posted)
- **AI Generator**: Generate TikTok captions, scripts, and hook lines, or full product listings; save to Campaigns
- **Settings**: TikTok Shop connection, logout

## What AI model is used?

**GPT-4o-mini** via OpenAI. On Replit, it routes through Replit's AI Integrations proxy automatically (no key needed). On Koyeb or any other host, set `OPENAI_API_KEY` in environment variables.

---

## Koyeb Deployment Guide

### What you need

1. A [Koyeb account](https://app.koyeb.com)
2. Your code in a **GitHub repository** (push this project to GitHub)
3. A **PostgreSQL database** — free options: [Neon](https://neon.tech), [Supabase](https://supabase.com), [Railway](https://railway.app)
4. An **OpenAI API key** — from [platform.openai.com](https://platform.openai.com/api-keys)

### Step-by-step

**Step 1 — Push to GitHub**
Push this project to a GitHub repo (public or private).

**Step 2 — Create a Koyeb service**
1. Go to [app.koyeb.com](https://app.koyeb.com) → **Create Service**
2. Choose **GitHub** as the source
3. Select your repository

**Step 3 — Configure build & run**

| Setting | Value |
|---|---|
| **Build command** | `bash scripts/build-prod.sh` |
| **Run command** | `node artifacts/api-server/dist/index.mjs` |
| **Port** | `8000` (Koyeb default — it injects `PORT` automatically) |

> Koyeb will auto-detect Node.js and install pnpm. If it doesn't, set the install command to `npm install -g pnpm`.

**Step 4 — Set environment variables**

In Koyeb → Service → Environment, add these:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your PostgreSQL connection string (e.g. from Neon) |
| `SESSION_SECRET` | A random 32+ character string (generate at [randomkeygen.com](https://randomkeygen.com)) |
| `APP_PASSWORD` | Your chosen login password |
| `OPENAI_API_KEY` | Your OpenAI API key (starts with `sk-...`) |

**Step 5 — Run database migrations**

After the first deploy, run the schema push **once** from your local machine pointing at the production DB:

```bash
DATABASE_URL="your-prod-database-url" pnpm --filter @workspace/db run push
```

**Step 6 — Deploy!**

Click **Deploy** on Koyeb. It will:
1. Clone your repo
2. Run `bash scripts/build-prod.sh` (builds frontend + API server)
3. Start `node artifacts/api-server/dist/index.mjs`
4. Give you a `*.koyeb.app` public URL

The single Express server serves both the API (`/api/*`) and the React frontend (everything else) — no separate frontend hosting needed.

### Troubleshooting

| Issue | Fix |
|---|---|
| App crashes immediately | Check `NODE_ENV=production` and all env vars are set |
| Can't log in | Verify `APP_PASSWORD` env var is set |
| AI features return errors | Verify `OPENAI_API_KEY` is valid and has credits |
| Database errors | Check `DATABASE_URL` format and that migrations were run |
| Blank page | Check build completed; check `SESSION_SECRET` is set |

---

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- AI routes parse JSON from LLM text output — `parseJson()` strips markdown code fences
- `pnpm --filter @workspace/api-spec run codegen` must be re-run after any OpenAPI spec changes
- Do NOT run `pnpm dev` at workspace root — use workflow restart instead
- In production, Express serves `dist/public/` (the Vite build) — run `scripts/build-prod.sh` to populate it

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
