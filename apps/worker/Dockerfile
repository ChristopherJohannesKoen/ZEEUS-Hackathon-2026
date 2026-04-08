FROM node:22-bookworm AS base
ENV npm_config_fetch_retries=5
ENV npm_config_fetch_retry_mintimeout=20000
ENV npm_config_fetch_retry_maxtimeout=120000
ENV npm_config_fetch_timeout=300000

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/worker/package.json ./apps/worker/package.json
COPY vendor/nestjs-config-4.0.3.tgz ./vendor/nestjs-config-4.0.3.tgz
COPY vendor/nestjs-swagger-11.2.6.tgz ./vendor/nestjs-swagger-11.2.6.tgz
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/scoring/package.json ./packages/scoring/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/db/package.json ./packages/db/package.json
RUN npm ci --ignore-scripts

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npx playwright install --with-deps chromium \
  && npm run prisma:generate \
  && npm run build:runtime-packages \
  && npm run build --workspace=@apps/worker

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /root/.cache/ms-playwright /root/.cache/ms-playwright
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/worker/package.json ./apps/worker/package.json
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/package.json ./package.json
EXPOSE 4100
CMD ["node", "apps/worker/dist/main.js"]
