FROM node:22-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm@9
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY packages/database/package.json packages/database/
COPY packages/logger/package.json packages/logger/
COPY packages/redis/package.json packages/redis/
COPY packages/config/package.json packages/config/
COPY services/trading/package.json services/trading/
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY . .
RUN pnpm --filter @funrun/database db:generate
RUN pnpm --filter @funrun/shared build
RUN pnpm --filter @funrun/logger build
RUN pnpm --filter @funrun/config build
RUN pnpm --filter @funrun/redis build
RUN pnpm --filter @funrun/database build
RUN pnpm --filter @funrun/trading build

FROM node:22-alpine AS production
WORKDIR /app

RUN addgroup -S funrun && adduser -S funrun -G funrun

COPY --from=builder --chown=funrun:funrun /app/services/trading/dist ./dist
COPY --from=builder --chown=funrun:funrun /app/node_modules ./node_modules
COPY --from=builder --chown=funrun:funrun /app/packages ./packages

USER funrun

EXPOSE 3003 9090

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3003/healthz || exit 1

ENV NODE_ENV=production
ENV PORT=3003
CMD ["node", "dist/index.js"]
