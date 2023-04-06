FROM node:16-alpine

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY .. .

RUN npm install -g npm@latest
RUN CYPRESS_INSTALL_BINARY=0 HUSKY=0 npm ci --omit=dev

ARG DOTENV_KEY
ARG NODE_ENV

ENV DOTENV_KEY=${DOTENV_KEY}
ENV NODE_ENV=${NODE_ENV}
ENV REDIS_URL=${REDIS_URL}
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

EXPOSE 3000

ENV PORT 3000

CMD ["npm", "run", "start"]
