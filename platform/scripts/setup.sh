#!/usr/bin/env bash
# Fun.Run V2 Platform — Developer setup script
# Run once after cloning the repo

set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info() { echo -e "${BOLD}[setup]${NC} $*"; }
ok()   { echo -e "${GREEN}[ok]${NC}    $*"; }
warn() { echo -e "${YELLOW}[warn]${NC}  $*"; }
fail() { echo -e "${RED}[fail]${NC}  $*"; exit 1; }

cd "$(dirname "$0")/.."

# ── Node check ────────────────────────────────────────────────────────────────
info "Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [[ "$NODE_VERSION" -lt 22 ]]; then
  fail "Node.js 22+ required. Found: $(node --version)"
fi
ok "Node.js $(node --version)"

# ── pnpm check ────────────────────────────────────────────────────────────────
info "Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
  warn "pnpm not found. Installing via corepack..."
  corepack enable && corepack prepare pnpm@latest --activate
fi
ok "pnpm $(pnpm --version)"

# ── .env ─────────────────────────────────────────────────────────────────────
info "Setting up .env..."
if [[ ! -f .env ]]; then
  cp .env.example .env
  warn ".env created from .env.example — fill in your values before starting."
else
  ok ".env already exists"
fi

# ── Install ───────────────────────────────────────────────────────────────────
info "Installing dependencies..."
pnpm install
ok "Dependencies installed"

# ── Husky ─────────────────────────────────────────────────────────────────────
info "Setting up git hooks..."
pnpm prepare
ok "Git hooks configured"

# ── Docker ────────────────────────────────────────────────────────────────────
info "Starting Docker services..."
if ! command -v docker &> /dev/null; then
  warn "Docker not found — skipping Docker setup. Install Docker Desktop to continue."
else
  docker compose -f docker-compose.dev.yml up -d postgres redis
  ok "PostgreSQL + Redis started"

  # Wait for Postgres
  info "Waiting for PostgreSQL to be ready..."
  for i in {1..30}; do
    if docker exec funrun-postgres pg_isready -U funrun -d funrun_dev &>/dev/null; then
      ok "PostgreSQL ready"
      break
    fi
    sleep 1
  done
fi

# ── Prisma ────────────────────────────────────────────────────────────────────
info "Generating Prisma client..."
pnpm db:generate
ok "Prisma client generated"

info "Running database migrations..."
if docker exec funrun-postgres pg_isready -U funrun -d funrun_dev &>/dev/null 2>&1; then
  pnpm db:migrate:dev
  ok "Migrations applied"
else
  warn "PostgreSQL not running — skipping migrations. Run 'pnpm db:migrate:dev' after Docker is up."
fi

echo ""
echo -e "${GREEN}${BOLD}Setup complete!${NC}"
echo ""
echo "  Start dev server:   pnpm dev"
echo "  Open DB UI:         docker compose -f docker-compose.dev.yml --profile tools up -d adminer"
echo "  Open Redis UI:      docker compose -f docker-compose.dev.yml --profile tools up -d redis-commander"
echo "  Health check:       curl http://localhost:3000/healthz"
echo ""
