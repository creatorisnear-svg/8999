#!/bin/sh
set -e

echo "==> Running database migrations..."
yes "" | pnpm --filter @workspace/db run push-force || true

echo "==> Starting server..."
exec node --enable-source-maps artifacts/api-server/dist/index.mjs
