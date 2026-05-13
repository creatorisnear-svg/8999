# Deploying to Koyeb (two-instance setup)

This app splits into two Koyeb services:
- **API Server** — Express + PostgreSQL + OpenAI
- **Frontend** — Static React/Vite build served by a minimal Node server

---

## 1. API Server

**Build command**
```
npm install -g pnpm && pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server run build
```

**Start command**
```
node artifacts/api-server/dist/index.mjs
```

**Environment variables**

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes (Koyeb sets this) | Port the server listens on |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Yes | Replit AI proxy base URL |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Yes | Replit AI proxy API key |
| `ALLOWED_ORIGINS` | Recommended | Comma-separated list of allowed frontend origins, e.g. `https://myapp.koyeb.app` |

> **Note:** `ALLOWED_ORIGINS` locks CORS to your frontend domain. Leave it unset only for quick testing.

---

## 2. Frontend

**Build command**
```
npm install -g pnpm && pnpm install --frozen-lockfile && BASE_PATH=/ VITE_API_URL=https://YOUR-API-APP.koyeb.app pnpm --filter @workspace/tiktok-dropship run build
```

Replace `https://YOUR-API-APP.koyeb.app` with your actual API server URL.

**Start command**
```
node artifacts/tiktok-dropship/static-server.mjs
```

**Environment variables**

| Variable | Set at | Description |
|---|---|---|
| `PORT` | Runtime | Koyeb injects this automatically |
| `BASE_PATH` | Build time | Set to `/` for standalone deployment |
| `VITE_API_URL` | Build time | Full URL of the API server, e.g. `https://my-api.koyeb.app` |

> `VITE_API_URL` and `BASE_PATH` must be set **during the build step**, not at runtime, because Vite bakes them into the static bundle.

---

## RAM usage notes (500 MB instances)

- **API Server**: esbuild bundles everything into a single ~2.5 MB file. Cold start is fast. Pino logging is lightweight. Should comfortably run under 150 MB.
- **Frontend**: The static server is ~50 lines of Node stdlib — no npm deps at runtime. Will use well under 50 MB. The Vite build step is the heavy part (happens during deploy, not at runtime).

---

## Database

Use a managed Postgres provider (Neon, Supabase, Railway, etc.) and paste the connection string as `DATABASE_URL`.

To push the schema on first deploy, run from your local machine:
```
DATABASE_URL=<your-prod-url> pnpm --filter @workspace/db run push
```
