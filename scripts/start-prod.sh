#!/bin/sh
set -e

echo "==> Running database migrations..."
pnpm --filter @workspace/db run migrate

echo "==> Starting server..."
exec node --enable-source-maps artifacts/api-server/dist/index.mjs
