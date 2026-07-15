# OpenPanel

A cPanel-style web panel to manage **remote Linux servers over SSH** — system dashboard,
service/process control, packages & one-click app catalog, cron, firewall (ufw), an SFTP
file manager, and an interactive web terminal.

See `ROADMAP.md` for the full feature checklist and what's planned next.

## Stack

Bun-workspace **monorepo**: `apps/web` (frontend) + `apps/server` (backend) + `packages/shared`.

| Concern | Choice |
| --- | --- |
| Monorepo | Bun workspaces — `apps/web`, `apps/server`, `packages/shared` |
| Frontend | Next.js 16 (App Router; `proxy.ts` replaces middleware) — `apps/web` |
| Backend | Standalone Elysia server on Bun (`apps/server`), HTTP API + terminal ws under `/api/*` |
| Runtime / pkg mgr | Bun (Node used only for the `tsx` seed script) |
| API docs | `@elysiajs/openapi` → Scalar at **`http://localhost:3001/api/docs`** |
| Auth | Better Auth (email/password + admin plugin), on the backend |
| Web ⇄ backend | Same-origin: the browser calls `/api/*`; `proxy.ts` forwards to the backend at runtime (`API_BASE_URL`). No CORS, no API URL in the client bundle |
| Database | PostgreSQL via Prisma 7 (`pg` driver adapter) — backend only |
| UI | shadcn/ui (base-mira), Tailwind 4, Remix Icon |
| SSH/SFTP | `ssh2` |
| Terminal | `xterm` (web) ⇄ Elysia `.ws()` SSH bridge, in-process on the API server |

Ports: web **:3000**, API + terminal ws **:3001**.

## Getting started

```bash
bun install                   # installs all workspaces
cp apps/server/.env.example apps/server/.env   # fill in secrets
cp apps/web/.env.example apps/web/.env.local
bun run db:migrate            # apply Prisma migrations (in apps/server)
bun run seed                  # create admin@openpanel.local / admin12345
bun run dev                   # web :3000 + API/ws :3001
```

Open http://localhost:3000, sign in, and add a server. API reference: http://localhost:3001/api/docs

### Environment

Backend (`apps/server/.env`):

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://postgres:postgres@localhost:5432/open_panel` |
| `BETTER_AUTH_SECRET` | Session signing + terminal ticket HMAC (32 bytes base64) |
| `BETTER_AUTH_URL` | Public base URL auth is reached at (the web origin), e.g. `http://localhost:3000` |
| `OPENPANEL_ENC_KEY` | AES-256-GCM key for SSH credentials at rest (32 bytes base64) |
| `PORT` | API server HTTP + ws port (default 3001) |
| `WEB_ORIGIN` | Allowed browser origin for Better Auth trusted origins, e.g. `http://localhost:3000` |

Frontend (`apps/web/.env.local`):

| Var | Purpose |
| --- | --- |
| `API_BASE_URL` | Backend origin, server-side only (`proxy.ts` + Server Components), e.g. `http://localhost:3001` |
| `NEXT_PUBLIC_WS_URL` | Terminal ws endpoint the browser connects to, e.g. `ws://localhost:3001/api/terminal` |

Generate secrets: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

### Scripts (run from repo root)

| Script | Action |
| --- | --- |
| `bun run dev` | web + API/ws (both) |
| `bun run dev:web` / `dev:server` | one process only |
| `bun run build` | production build of the web app |
| `bun run start` | production web + API/ws |
| `bun run seed` | seed the admin user |
| `bun run db:migrate` / `db:generate` | Prisma migrate / generate (in `apps/server`) |

### Docker

Runs the whole stack (Postgres + API + web) from a single root `Dockerfile` (two
targets) via `docker-compose.yml`, which uses **prebuilt images** (repo `open-panel`,
tags `:server` / `:web`).

```bash
# build both images
docker build --target server -t open-panel:server .
docker build --target web    -t open-panel:web \
  --build-arg NEXT_PUBLIC_WS_URL=ws://localhost:3001/api/terminal .

docker compose up -d          # db + server + web
docker compose exec server sh -c "cd apps/server && bun scripts/seed-admin.ts"
```

Open http://localhost:3000. To publish: retag under your Docker Hub repo and push,
then set `IMAGE=youruser/open-panel` before `docker compose up -d`. Override
`BETTER_AUTH_SECRET` / `OPENPANEL_ENC_KEY` (root `.env` or shell) for real use.

## Testing against a real host

```bash
docker run -d --name op-test -p 2222:22 linuxserver/openssh-server
```

Add a server (`localhost:2222`), click **Test connection** (pins the host-key fingerprint),
then browse the dashboard / services / files / terminal tabs.

## Project structure

```
packages/shared/src/catalog.ts   # app-catalog metadata shared by web + server
apps/server/                     # backend (Elysia on Bun)
  src/
    index.ts                     # entry: listens :3001, mounts Elysia app + Better Auth (/api/auth/*)
    lib/
      auth.ts, crypto.ts, terminal-ticket.ts
      ssh/                       # ssh2 transport (client.ts, sftp.ts)
    db/prisma.ts                 # Prisma client (pg adapter)
    server/
      app.ts                     # Elysia app: mounts controllers + openapi
      access.ts                  # loadOwnedServer (ownership guard)
      plugins/auth.ts            # Elysia auth/admin macros
      modules/<feature>/         # feature modules (see conventions)
      modules/terminal/terminal.ws.ts  # in-process ws <-> ssh2 shell bridge (Elysia .ws)
  prisma/schema/                 # multi-file Prisma schema (config, auth, server)
  scripts/seed-admin.ts
apps/web/                        # frontend (Next.js)
  src/
    proxy.ts                     # runtime same-origin proxy: /api/* -> backend; page cookie gate
    app/(dashboard)/             # authed pages (sidebar layout); RSC fetch the API server
    lib/
      api/                       # frontend API client — same-origin /api/* (client components)
      server-fetch.ts            # RSC fetch to the backend (attaches the session cookie manually)
      auth-client.ts, session.ts, i18n/, utils.ts, ...
    components/
      ui/                        # shadcn primitives
      common/                    # reusable app components
      <feature>/                 # feature components (one component per file)
```

The web app has **no direct DB access** — every read (including Server Components) goes
through the API server over HTTP. The browser only ever calls the web origin: `proxy.ts`
gates pages by session cookie and proxies `/api/*` (incl. `/api/auth/*`) to the backend.

## Conventions

**Backend feature modules** — `apps/server/src/server/modules/<feature>/` split into:
- `<feature>.controller.ts` — Elysia routes (HTTP concerns only)
- `<feature>.service.ts` — business logic, as a **class** with an exported singleton
  (`export const serversService = new ServersService()`)
- `<feature>.schema.ts` — Elysia `t` validation schemas
- `<feature>.constant.ts` — allowlists / constants

**Frontend API client** — `apps/web/src/lib/api/`:
- `api.<resource>.<method>()` (e.g. `api.server.create()`); never raw `fetch` in components
- one resource class per file in `resources/<name>.resource.ts`
- types split into `resources/<name>.type.ts`
- endpoint paths centralized in `endpoint.constant.ts` as `API_ENDPOINT`

**Components** — one React component per file, split small; reusable pieces live in
`components/common/` (`IconButton`, `ActionTooltip`, `RefreshButton`, `TextInputDialog`,
`ServerStatusBadge`). Tooltips use `ActionTooltip` (shadcn), never the native `title`.

**i18n** — user-facing text goes through `useT()` with a key in `apps/web/src/lib/i18n/messages.ts`;
add every key to all locales (`en`, `vi`). Language switcher (SVG flags) is in the header.

**Imports** — grouped and ordered (enforced by `eslint-plugin-simple-import-sort`):
1. side-effect imports (CSS)
2. react / next / external packages
3. internal non-UI (`@/lib`, `@/db`, `@/server`)
4. shadcn UI (`@/components/ui`)
5. app components (`@/components/*`)
6. relative (`./`, `../`)

Run `bunx eslint . --fix` inside `apps/web` or `apps/server` to auto-sort.

## Performance & caching

- **SSH connection pooling** (`apps/server/src/lib/ssh/client.ts`): one live connection per host is
  reused across requests (ssh2 multiplexes exec/sftp channels), so the 5s dashboard poll
  doesn't pay a TCP+SSH handshake each time. Idle connections are evicted after 60s.
- **Memoized list rows** (`ServiceRow`, `ProcessRow`, `FileRow`, `CatalogAppCard`) with
  `useCallback`-stabilized handlers, so large tables don't re-render on every poll/keystroke.
- **Build-time immutable data**: the app-catalog metadata is a bundled constant
  (`packages/shared/src/catalog.ts`), so the catalog grid renders instantly with no round-trip — only
  live install-status is fetched.
- **Live infra data is intentionally uncached.** Metrics, services, files, and package state
  must reflect the server right now, so those responses are always fresh. Next.js Cache
  Components (`use cache`) is deliberately not enabled — every read here is request-specific
  (session + live SSH), so caching would show stale state. Static assets and fonts are cached
  automatically; client navigations use the Next.js router prefetch/cache.

## Security notes

- SSH credentials encrypted at rest (AES-256-GCM); never returned to the client.
- Every API route authenticates via the Elysia `auth`/`admin` macro; server-scoped routes
  also check ownership.
- Command inputs are allowlisted (service actions, signals, chmod modes, unit names);
  file paths are normalized to reject traversal.
- SSH host keys are pinned on first connect (TOFU) and enforced thereafter.
- The web terminal authorizes via a short-lived (<=60s) HMAC ticket, re-checked against the DB.
