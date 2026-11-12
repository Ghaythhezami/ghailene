FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/api/prisma apps/api/prisma
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci
COPY . .
RUN npm run db:generate -w @basmat-fan/api && npm run build -w @basmat-fan/shared && npm run build -w @basmat-fan/api
ENV NODE_ENV=production
EXPOSE 4000
CMD ["npm", "run", "start", "-w", "@basmat-fan/api"]
