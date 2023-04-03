##### DEPENDENCIES
FROM --platform=linux/amd64 node:16-alpine3.17 AS deps

RUN apk add --no-cache libc6-compat openssl1.1-compat

WORKDIR /app

COPY ../prisma ./prisma
COPY ../package.json package-lock.json* ./

RUN npm ci

##### BUILDER
FROM --platform=linux/amd64 node:16-alpine3.17 AS builder

ARG DOTENV_KEY
ARG NODE_ENV

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY .. .

ENV DOTENV_KEY=${DOTENV_KEY}
ENV NODE_ENV=${NODE_ENV}
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

##### RUNNER
FROM --platform=linux/amd64 node:16-alpine3.17 AS runner

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
