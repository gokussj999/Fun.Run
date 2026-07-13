# ── Stage 1: deps ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/logger/package.json ./packages/logger/
COPY packages/config/package.json ./packages/config/
COPY packages/redis/package.json ./packages/redis/
COPY packages/database/package.json ./packages/database/
COPY services/auth/package.json ./services/auth/
COPY apps/api-gateway/package.json ./apps/api-gateway/

RUN pnpm install --frozen-lockfile --prod=false

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM deps AS builder

COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY services/auth/ ./services/auth/
COPY apps/api-gateway/ ./apps/api-gateway/

# Generate Prisma client
RUN pnpm --filter @funrun/database db:generate

# Build packages in dependency order
RUN pnpm --filter @funrun/shared build
RUN pnpm --filter @funrun/logger build
RUN pnpm --filter @funrun/config build
RUN pnpm --filter @funrun/redis build
RUN pnpm --filter @funrun/database build
RUN pnpm --filter @funrun/auth build
RUN pnpm --filter @funrun/api-gateway build

# ── Stage 3: production image ─────────────────────────────────────────────────
FROM node:22-alpine AS production

RUN corepack enable && corepack prepare pnpm@latest --activate

# Non-root user for security
RUN addgroup -S funrun && adduser -S -G funrun funrun

WORKDIR /app

# Install prod deps only
COPY --from=deps /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=deps /app/packages/shared/package.json ./packages/shared/
COPY --from=deps /app/packages/logger/package.json ./packages/logger/
COPY --from=deps /app/packages/config/package.json ./packages/config/
COPY --from=deps /app/packages/redis/package.json ./packages/redis/
COPY --from=deps /app/packages/database/package.json ./packages/database/
COPY --from=deps /app/apps/api-gateway/package.json ./apps/api-gateway/

RUN pnpm install --frozen-lockfile --prod

# Copy built output
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/logger/dist ./packages/logger/dist
COPY --from=builder /app/packages/config/dist ./packages/config/dist
COPY --from=builder /app/packages/redis/dist ./packages/redis/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/services/auth/dist ./services/auth/dist
COPY --from=builder /app/apps/api-gateway/dist ./apps/api-gateway/dist

USER funrun

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000 9090

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/healthz || exit 1

CMD ["node", "apps/api-gateway/dist/index.js"]
