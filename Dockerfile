##### DEPENDENCIES

FROM --platform=linux/amd64 node:16-alpine3.17 AS deps
RUN apk add --no-cache libc6-compat openssl1.1-compat
WORKDIR /app

# Install Prisma Client - remove if not using Prisma

COPY prisma ./

# Install dependencies based on the preferred package manager

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml\* ./

ENV CYPRESS_INSTALL_BINARY 0
RUN yarn global add pnpm && pnpm i

##### BUILDER

FROM --platform=linux/amd64 node:16-alpine3.17 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VERCEL_TOKEN
ARG VERCEL_ORG_ID
ARG VERCEL_PROJECT_ID
ENV VERCEL_TOKEN=$VERCEL_TOKEN
ENV VERCEL_ORG_ID=$VERCEL_ORG_ID
ENV VERCEL_PROJECT_ID=$VERCEL_PROJECT_ID
ENV SKIP_ENV_VALIDATION 1 
RUN yarn global add pnpm vercel
RUN pnpx vercel pull --yes --environment=production --token=$VERCEL_TOKEN && cp .vercel/.env.production.local .env
RUN pnpm run build

##### RUNNER

FROM --platform=linux/amd64 node:16-alpine3.17 AS runner
WORKDIR /app

ENV NODE_ENV production

# ENV NEXT_TELEMETRY_DISABLED 1

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
