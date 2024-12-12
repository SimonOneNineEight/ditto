FROM node:20-alpine3.20

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm && pnpm install

COPY . .

ARG DATABASE_URL
ENV PORT=${DATABASE_URL}

RUN pnpm prisma generate

EXPOSE 8081

ENV PORT=8081

CMD ["pnpm", "dev:migrate"]
