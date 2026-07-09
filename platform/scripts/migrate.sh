#!/usr/bin/env bash
# Fun.Run V2 — Database migration runner
# Usage: ./scripts/migrate.sh [--env production]

set -euo pipefail

ENV="${1:-development}"
cd "$(dirname "$0")/.."

echo "[migrate] Environment: $ENV"

if [[ "$ENV" == "production" ]]; then
  echo "[migrate] Running PRODUCTION migration (prisma migrate deploy)..."
  pnpm --filter @funrun/database db:migrate
  echo "[migrate] Production migration complete."
else
  echo "[migrate] Running DEVELOPMENT migration (prisma migrate dev)..."
  pnpm --filter @funrun/database db:migrate:dev
  echo "[migrate] Development migration complete."
fi
