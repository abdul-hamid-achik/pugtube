FROM jrottenberg/ffmpeg:5.1-alpine AS ffmpeg
FROM node:16-alpine AS worker

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY . .
COPY --from=ffmpeg /usr/local/bin/ffmpeg /usr/local/bin/

RUN npm install -g npm@latest
RUN CYPRESS_INSTALL_BINARY=0 HUSKY=0 npm ci --omit=dev

ARG DOTENV_KEY
ARG NODE_ENV

ENV REDIS_URL=${REDIS_URL}
ENV NODE_ENV=${NODE_ENV}
ENV DOTENV_KEY=${DOTENV_KEY}

CMD ["npm", "run", "worker"]
