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
- AI: OpenAI via Replit AI Integrations proxy (`AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`)
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

- **Dashboard**: Live stats (products, suppliers, campaigns, avg. profit margin), recent products and campaigns
- **Products**: Full product tracker with status (researching/active/paused/discontinued), profit margin calculator
- **AI Research**: One-click AI product research — returns trending product ideas with demand scores and sourcing tips
- **Suppliers**: Supplier directory with platform, shipping time, rating, and MOQ
- **Campaigns**: Marketing content library with status workflow (draft → ready → posted)
- **AI Generator**: Generate TikTok captions, scripts, and hook lines, or full product listings; save to Campaigns

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- AI routes parse JSON from LLM text output — if OpenAI changes format, parsing may break
- `pnpm --filter @workspace/api-spec run codegen` must be re-run after any OpenAPI spec changes
- Do NOT run `pnpm dev` at workspace root — use workflow restart instead

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
