#!/usr/bin/env bash
# Production build script — runs on Koyeb (or any CI/CD)
# Usage: bash scripts/build-prod.sh
set -euo pipefail

echo "==> Installing dependencies..."
pnpm install --frozen-lockfile

echo "==> Building shared libraries..."
pnpm run typecheck:libs

echo "==> Building frontend..."
pnpm --filter @workspace/tiktok-dropship run build
# Vite outputs to: artifacts/tiktok-dropship/dist/public/

echo "==> Building API server..."
pnpm --filter @workspace/api-server run build
# esbuild outputs to: artifacts/api-server/dist/

echo "==> Copying frontend into API server dist..."
cp -r artifacts/tiktok-dropship/dist/public artifacts/api-server/dist/public

echo "==> Build complete!"
echo ""
echo "    Start command: node artifacts/api-server/dist/index.mjs"
echo "    Required env vars:"
echo "      PORT          — assigned by Koyeb automatically"
echo "      DATABASE_URL  — PostgreSQL connection string"
echo "      SESSION_SECRET — random 32+ char secret"
echo "      APP_PASSWORD  — your login password"
echo "      OPENAI_API_KEY — from platform.openai.com"
