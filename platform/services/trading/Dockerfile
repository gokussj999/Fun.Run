# ── Stage 1: deps ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY platform/packages/shared/package.json    ./platform/packages/shared/
COPY platform/packages/database/package.json  ./platform/packages/database/
COPY platform/packages/logger/package.json    ./platform/packages/logger/
COPY platform/packages/redis/package.json     ./platform/packages/redis/
COPY platform/packages/config/package.json    ./platform/packages/config/
COPY platform/services/trading/package.json   ./platform/services/trading/

RUN npm install -g pnpm && pnpm install --frozen-lockfile

# ── Stage 2: builder ──────────────────────────────────────────────────────────
FROM deps AS builder

COPY platform/packages ./platform/packages
COPY platform/services/trading ./platform/services/trading

RUN cd platform/services/trading && pnpm run build

# ── Stage 3: runtime ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

RUN addgroup -S funrun && adduser -S funrun -G funrun

COPY --from=builder /app/platform/services/trading/dist ./dist
COPY --from=builder /app/platform/packages ./platform/packages
COPY --from=builder /app/node_modules ./node_modules

USER funrun

EXPOSE 3003

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3003/healthz || exit 1

CMD ["node", "dist/index.js"]
