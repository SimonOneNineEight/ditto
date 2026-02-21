# Dependencies stage
FROM node:20-alpine3.20 AS deps

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build stage
FROM node:20-alpine3.20 AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

# Runtime stage
FROM node:20-alpine3.20

WORKDIR /app

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

USER node

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
