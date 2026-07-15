# OpenPanel

A cPanel-style web panel to manage **remote Linux servers over SSH** — system dashboard,
service/process control, packages & one-click app catalog, cron, firewall (ufw), an SFTP
file manager, and an interactive web terminal.

See `ROADMAP.md` for the full feature checklist and what's planned next.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router; `proxy.ts` replaces middleware) |
| Runtime / pkg mgr | Bun (Node used for scripts via `tsx`) |
| API layer | Elysia, mounted in a Next catch-all route (`/api/*`) |
| API docs | `@elysiajs/openapi` → Scalar at **`/api/docs`** |
| Auth | Better Auth (email/password + admin plugin) |
| Database | SQLite via Prisma 7 (`better-sqlite3` driver adapter) |
| UI | shadcn/ui (base-mira), Tailwind 4, Remix Icon |
| SSH/SFTP | `ssh2` |
| Terminal | `xterm` + standalone `ws` bridge |

## Getting started

```bash
bun install
cp .env .env.local            # or edit .env directly (both are git-ignored)
bun run db:migrate            # apply Prisma migrations
bun run seed                  # create admin@openpanel.local / admin12345
bun run dev:all               # Next :3000 + terminal ws :3001
```

Open http://localhost:3000, sign in, and add a server. API reference: http://localhost:3000/api/docs

### Environment (`.env`)

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite file, e.g. `file:./dev.db` |
| `BETTER_AUTH_SECRET` | Session signing + terminal ticket HMAC (32 bytes base64) |
| `BETTER_AUTH_URL` | Base URL, e.g. `http://localhost:3000` |
| `OPENPANEL_ENC_KEY` | AES-256-GCM key for SSH credentials at rest (32 bytes base64) |
| `OPENPANEL_WS_PORT` | Terminal ws bridge port (default 3001) |
| `NEXT_PUBLIC_WS_URL` | Browser ws URL, e.g. `ws://localhost:3001` |

Generate secrets: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

### Scripts

| Script | Action |
| --- | --- |
| `bun run dev:all` | Next dev + terminal ws bridge |
| `bun run dev` | Next dev only |
| `bun run terminal` | Terminal ws bridge only |
| `bun run build` / `start` | Production build / serve |
| `bun run seed` | Seed the admin user |
| `bun run db:migrate` / `db:generate` | Prisma migrate / generate |
| `bun run lint` | ESLint |

## Testing against a real host

```bash
docker run -d --name op-test -p 2222:22 linuxserver/openssh-server
```

Add a server (`localhost:2222`), click **Test connection** (pins the host-key fingerprint),
then browse the dashboard / services / files / terminal tabs.

## Project structure

```
prisma/schema/                 # multi-file Prisma schema (config, auth, server)
terminal-server/index.ts       # standalone ws <-> ssh2 shell bridge
src/
  app/
    (dashboard)/                # authed pages (sidebar layout)
    api/[[...slugs]]/route.ts   # mounts the Elysia app
    api/auth/[...all]/route.ts  # Better Auth handler
  server/
    app.ts                      # Elysia app: mounts controllers + openapi
    access.ts                   # loadOwnedServer (ownership guard)
    plugins/auth.ts             # Elysia auth/admin macros
    modules/<feature>/          # feature modules (see conventions)
  lib/
    api/                        # frontend API client (see conventions)
    ssh/                        # ssh2 transport (client.ts, sftp.ts)
    auth.ts, crypto.ts, ...     # cross-cutting helpers
  components/
    ui/                         # shadcn primitives
    common/                     # reusable app components
    <feature>/                  # feature components (one component per file)
```

## Conventions

**Backend feature modules** — `src/server/modules/<feature>/` split into:
- `<feature>.controller.ts` — Elysia routes (HTTP concerns only)
- `<feature>.service.ts` — business logic, as a **class** with an exported singleton
  (`export const serversService = new ServersService()`)
- `<feature>.schema.ts` — Elysia `t` validation schemas
- `<feature>.constant.ts` — allowlists / constants

**Frontend API client** — `src/lib/api/`:
- `api.<resource>.<method>()` (e.g. `api.server.create()`); never raw `fetch` in components
- one resource class per file in `resources/<name>.resource.ts`
- types split into `resources/<name>.type.ts`
- endpoint paths centralized in `endpoint.constant.ts` as `API_ENDPOINT`

**Components** — one React component per file, split small; reusable pieces live in
`components/common/` (`IconButton`, `ActionTooltip`, `RefreshButton`, `TextInputDialog`,
`ServerStatusBadge`). Tooltips use `ActionTooltip` (shadcn), never the native `title`.

**Imports** — grouped and ordered (enforced by `eslint-plugin-simple-import-sort`):
1. side-effect imports (CSS)
2. react / next / external packages
3. internal non-UI (`@/lib`, `@/db`, `@/server`)
4. shadcn UI (`@/components/ui`)
5. app components (`@/components/*`)
6. relative (`./`, `../`)

Run `bun run lint -- --fix` to auto-sort.

## Performance & caching

- **SSH connection pooling** (`src/lib/ssh/client.ts`): one live connection per host is
  reused across requests (ssh2 multiplexes exec/sftp channels), so the 5s dashboard poll
  doesn't pay a TCP+SSH handshake each time. Idle connections are evicted after 60s.
- **Memoized list rows** (`ServiceRow`, `ProcessRow`, `FileRow`, `CatalogAppCard`) with
  `useCallback`-stabilized handlers, so large tables don't re-render on every poll/keystroke.
- **Build-time immutable data**: the app-catalog metadata is a bundled constant
  (`src/lib/catalog.ts`), so the catalog grid renders instantly with no round-trip — only
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
