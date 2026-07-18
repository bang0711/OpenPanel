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
# `generate` only reads the schema — it never connects. prisma.config.ts reads
# DATABASE_URL directly (not env()), so a missing var no longer throws here.
RUN cd apps/server && bunx prisma generate

# Bundle the API to one ~7MB JS file (bun build --target=bun), reusing the app's
# own build script so the flags live in one place (--external cpu-features etc.).
# It runs on the base bun already present below for the web role — so the image
# ships bun ONCE, not a second copy embedded in a --compile binary. Measured:
# 371MB -> 243MB, with no RAM cost (bundled-on-bun ~= the old binary at runtime).
# The bundle is platform-agnostic JS, so no --target override is needed here.
RUN cd apps/server && bun run build

# Next.js standalone: traces only the modules the server actually needs.
RUN cd apps/web && bun run build

# ---- runtime: one image, every role ----
FROM oven/bun:1-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Next's standalone server binds 127.0.0.1 by default, unreachable from outside.
ENV HOSTNAME=0.0.0.0

# The `migrate` role runs `server.js migrate`, a SQL applier bundled into the JS
# — no prisma CLI, no schema-engine, no node_modules in the image (that was
# ~235MB). It needs only the migration .sql files, which it reads from here;
# `prisma migrate dev` on a dev machine still authors them. See src/db/migrate.ts.
COPY apps/server/prisma/migrations /app/server/prisma/migrations

# server / migrate / seed roles: the bundled JS is the whole payload; the base
# image's bun runs it (no embedded runtime, no node_modules).
COPY --from=build /src/apps/server/dist/server.js /app/server.js

# web role: standalone output + assets it does not trace (static/public).
COPY --from=build /src/apps/web/.next/standalone /app/web/
COPY --from=build /src/apps/web/.next/static /app/web/apps/web/.next/static
COPY --from=build /src/apps/web/public /app/web/apps/web/public

COPY docker/entrypoint.sh /app/entrypoint.sh
COPY docker/install.sh /app/install.sh
COPY docker/docker-compose.yml /app/install/docker-compose.yml
RUN chmod +x /app/entrypoint.sh /app/install.sh

EXPOSE 3000 3001
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["server"]
