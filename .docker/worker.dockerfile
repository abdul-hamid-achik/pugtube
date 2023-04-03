FROM jrottenberg/ffmpeg:5.1-alpine AS ffmpeg
FROM node:16-alpine AS worker
RUN apk add --no-cache libc6-compat openssl1.1-compat
WORKDIR /app
COPY ../prisma ./prisma

COPY ../package.json package-lock.json* ./
RUN npm ci

COPY . .

COPY --from=ffmpeg /usr/local/bin/ffmpeg /usr/local/bin/
ARG DOTENV_KEY
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}
ENV DOTENV_KEY=${DOTENV_KEY}

CMD ["npm", "run", "worker"]
