# OpenPanel — one image, four roles (server | web | migrate | seed) plus an
# `install` command that generates docker-compose.yml + .env.
#
#   docker build -t open-panel:latest .
#   docker run --rm -v "$PWD:/output" open-panel:latest install
#   docker compose up -d
#
# No ENV/ARG for app config on purpose: everything is supplied at RUN time by
# docker-compose. Baking a NEXT_PUBLIC_* var would inline it into the client
# bundle at build time and freeze it into the published image, so the terminal
# ws URL is read server-side (TERMINAL_WS_URL) and passed down as a prop.

# ---- build stage: full deps + toolchain. Never shipped. ----
FROM oven/bun:1 AS build
WORKDIR /src
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile
COPY . .

# Generate the Prisma client before compiling: the driver-adapter setup
# (prisma-client generator + @prisma/adapter-pg) emits pure JS/WASM with no
# native query engine, so it embeds into the binary and needs no node_modules
# at runtime.
# prisma.config.ts eagerly resolves DATABASE_URL via env(), but `generate` only
# reads the schema — it never connects. Give it a placeholder so config load
# doesn't throw; the real URL is supplied at migrate time from .env.
RUN cd apps/server && DATABASE_URL="postgresql://placeholder" bunx prisma generate

# Compile the API to one binary, reusing the app's own build script so the
# flags live in one place (--external cpu-features etc.). Bun reports 2-3x
# lower memory than running from source, and the runtime needs no node_modules
# or source tree.
#
# The extra --target overrides the script's host default: it must match the
# Alpine runtime below, since a glibc build would not run there.
RUN cd apps/server && bun run build --target=bun-linux-x64-musl

# Next.js standalone: traces only the modules the server actually needs.
RUN cd apps/web && bun run build

# ---- runtime: one image, every role ----
FROM oven/bun:1-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Next's standalone server binds 127.0.0.1 by default, unreachable from outside.
ENV HOSTNAME=0.0.0.0

# Prisma CLI for the `migrate` role. Installed HERE, not copied from the build
# stage: the CLI's schema-engine is platform-specific, and the build stage is
# glibc while this is musl.
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile --production --filter=@openpanel/server \
  && rm -rf /root/.bun/install/cache ~/.cache

# migrate role: schema + migration history + prisma config.
RUN mkdir -p /app/server
COPY apps/server/prisma /app/server/prisma
COPY apps/server/prisma.config.ts /app/server/

# server + seed roles: the compiled binary is the whole payload.
COPY --from=build /src/apps/server/dist/op-server /app/op-server

# web role: standalone output + assets it does not trace (static/public).
COPY --from=build /src/apps/web/.next/standalone /app/web/
COPY --from=build /src/apps/web/.next/static /app/web/apps/web/.next/static
COPY --from=build /src/apps/web/public /app/web/apps/web/public

COPY docker/entrypoint.sh /app/entrypoint.sh
COPY docker/install.sh /app/install.sh
COPY docker/docker-compose.yml /app/install/docker-compose.yml
RUN chmod +x /app/entrypoint.sh /app/install.sh /app/op-server

EXPOSE 3000 3001
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["server"]
