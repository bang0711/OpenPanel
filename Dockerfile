# Single Dockerfile, two build targets: `server` and `web`.
# docker-compose selects the target per service. Build context is the repo root.

# ---- shared base: install workspace deps + copy source ----
FROM oven/bun:1 AS base
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile
COPY . .

# ---- backend: Elysia API + terminal WebSocket (one port) ----
FROM base AS server
RUN cd apps/server && bunx prisma generate
EXPOSE 3001
CMD ["sh", "-c", "cd apps/server && bunx prisma migrate deploy && bun src/index.ts"]

# ---- frontend: Next.js. Only the terminal ws URL is baked (NEXT_PUBLIC); the
# API origin is resolved at runtime by proxy.ts (API_BASE_URL). ----
FROM base AS web
ARG NEXT_PUBLIC_WS_URL="ws://localhost:3001/api/terminal"
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
RUN cd apps/web && bun run build
EXPOSE 3000
CMD ["sh", "-c", "cd apps/web && bun run start"]
