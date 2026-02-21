FROM node:20-alpine3.20

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm && pnpm install

COPY . .

EXPOSE 8080

ENV PORT=8080

CMD ["pnpm", "run", "dev"]
