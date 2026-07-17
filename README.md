# OpenPanel

A cPanel-style web panel to manage **remote Linux servers over SSH** — system dashboard +
historical metric charts, service/process control, packages & one-click app catalog, cron,
firewall (ufw) & fail2ban, open ports, SSH keys, SSL (certbot), nginx virtual hosts &
reverse proxies, DNS zones, database manager / query console / backups, system users, Docker,
log viewer, power controls, an SFTP file manager, and an interactive web terminal.

Cross-cutting: **per-server RBAC** (capability matrix + read-only role), **API tokens**,
**audit log**, **alerts** (metric/service rules → webhook), **scheduled backups**, and
**bulk actions** across servers — powered by an in-process background scheduler.

See `ROADMAP.md` for the full feature checklist and what's deferred.

## Stack

Bun-workspace **monorepo**: `apps/web` (frontend) + `apps/server` (backend) + `packages/shared`.

| Concern | Choice |
| --- | --- |
| Monorepo | Bun workspaces — `apps/web`, `apps/server`, `packages/shared` |
| Frontend | Next.js 16 (App Router; `proxy.ts` replaces middleware) — `apps/web` |
| Backend | Standalone Elysia server on Bun (`apps/server`), HTTP API + terminal ws under `/api/*` |
| Runtime / pkg mgr | Bun (Node used only for the `tsx` seed script) |
| API docs | `@elysiajs/openapi` → Scalar at **`http://localhost:3001/api/docs`** |
| Auth | Better Auth (email/password + admin plugin) + Bearer **API tokens**; per-server RBAC via `authorize(user, server, action)` |
| Background jobs | In-process scheduler (`apps/server/src/server/scheduler.ts`): metric sampler, alert poller, backup runner |
| Charts | recharts via the shadcn `chart` primitive (`ChartContainer`/`ChartTooltip`) so tooltips and axes follow the theme — historical CPU/mem/disk from the `MetricSample` table |
| Web ⇄ backend | Same-origin: the browser calls `/api/*`; `proxy.ts` forwards to the backend at runtime (`API_BASE_URL`). No CORS, no API URL in the client bundle |
| Database | PostgreSQL via Prisma 7 — `pg` driver adapter, or Accelerate when `DATABASE_URL` is a `prisma+postgres://` URL — backend only |
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
| `DATABASE_URL` | Postgres connection string. `postgresql://…` → direct connection via the `pg` driver adapter; `prisma+postgres://…` → Prisma Accelerate (the client switches automatically) |
| `BETTER_AUTH_SECRET` | Session signing + terminal ticket HMAC (32 bytes base64) |
| `OPENPANEL_ENC_KEY` | AES-256-GCM key for SSH credentials at rest (32 bytes base64) |
| `PORT` | API server HTTP + ws port (default 3001) |
| `WEB_ORIGIN` | The browser-facing **web** origin, e.g. `http://localhost:3000`. Single source of truth for CORS, Better Auth trusted origins, and its public base URL (cookie scope + redirect URLs). It's the web app's URL, not this server's port — auth is reached same-origin at `/api/auth/*` and proxied here |

Frontend (`apps/web/.env.local`):

| Var | Purpose |
| --- | --- |
| `API_BASE_URL` | Backend origin, server-side only (`proxy.ts` + Server Components), e.g. `http://localhost:3001` |
| `TERMINAL_WS_URL` | Terminal ws endpoint the browser connects to, e.g. `ws://localhost:3001/api/terminal`. Read at runtime by the terminal page (a Server Component) and passed down as a prop — **not** `NEXT_PUBLIC_*`, which would bake it into the client bundle and freeze it into the published image |

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
| `bun run test` | **the gate**: typecheck → lint → `bun test` (all workspaces). CI runs this; `release` refuses to publish without it |
| `bun run typecheck` / `lint` | one gate across every workspace |
| `bun run update <version>` | bump the version in every `package.json` **and** the Docker image tags in compose/install/docs, in lockstep |
| `bun run release` | gates → `git tag v<version>` → push the tag, which is what triggers CI to build, publish and deploy. Refuses a dirty tree or an existing tag; no Docker needed locally. `--dry-run` gates without tagging |

### Docker

**One image runs everything.** Point it at a directory and it writes the compose
file and secrets for you:

```bash
docker run --rm -v "$PWD:/output" open-panel:0.1.0 install
docker compose up -d
docker compose run --rm server seed     # first admin user
```

Open http://localhost:3000 (`admin@openpanel.local` / `admin12345` — change it).

`install` generates `docker-compose.yml` + `.env` with freshly generated secrets.
It never runs Docker itself: that would mean baking the Docker CLI into every
container and mounting `/var/run/docker.sock` (root-equivalent on the host). It
also never overwrites an existing `.env` — `OPENPANEL_ENC_KEY` decrypts your
stored SSH credentials, so replacing it would orphan every registered server.

The image bakes **no configuration**; everything comes from `.env` at run time, so
the same published image works on any host. Serving on a real domain? Set
`PUBLIC_URL` and `PUBLIC_WS_URL` in `.env` (e.g. `https://panel.example.com` /
`wss://panel.example.com:3001/api/terminal`) — the browser opens the terminal
websocket directly, so that URL must be reachable from the browser.

One image, four roles (compose runs the same image three times):

| Role | What it does |
| --- | --- |
| `server` | API + terminal ws (:3001). A single `bun build --compile` binary — no `node_modules`, no source tree; Bun reports 2–3× lower memory than running from source |
| `web` | Next.js `output: "standalone"` (:3000) — only the traced modules |
| `migrate` | `prisma migrate deploy`, then exits. `server` waits on `service_completed_successfully`, so the API never races an unmigrated schema |
| `seed` | Creates the first admin user, then exits |

Building it locally (CI publishes — see below):

```bash
docker build -t open-panel:0.1.0 .
```

### Releasing (publish + deploy)

```bash
bun run update 1.0.0                  # bump version + image tags everywhere
git commit -am "chore: release v1.0.0"
bun run release                       # gates -> tag -> push tag
```

**Everything is published from CI, never from a laptop.** `bun run release` only
gates and pushes the tag; the tag is the trigger. `.github/workflows/release.yml`
then re-runs the gates, builds the image, pushes `<user>/open-panel:<version>` +
`:latest` to Docker Hub, and deploys. So the published image always comes from a
clean checkout of a tagged commit, built by the runner — not from whatever was in
one machine's working tree or Docker cache, and it can't be published twice.

Needs `DOCKERHUB_USERNAME` + `DOCKERHUB_TOKEN` (write scope) as secrets. The repo
is created public on first push, per your Docker Hub **Default repository
privacy** setting — public matters, since `open-panel install` on a user's box
pulls anonymously.

Releases are immutable: `release` refuses a tag that already exists. Re-releasing
means `bun run update` to a new version, never moving a tag — a moved tag and a
pushed image would disagree about what `v1.0.0` is.

### Continuous deployment

The `deploy` job runs after `publish`, so only an image that passed the gates and
reached the registry is ever deployed.

The target directory must already be set up with `open-panel install` — CD
deploys, it does not bootstrap. Configure once:

| Name | Kind | Value |
| --- | --- | --- |
| `DEPLOY_HOST` | secret | server IP or hostname |
| `DEPLOY_USER` | secret | SSH user (must be able to run `docker`) |
| `DEPLOY_SSH_KEY` | secret | private key, full PEM including the header/footer lines |
| `DEPLOY_KNOWN_HOSTS` | secret | output of `ssh-keyscan <host>` |
| `DEPLOY_PATH` | **variable** | e.g. `/opt/openpanel` — the dir holding `docker-compose.yml` + `.env` |

The host key comes from a secret rather than an `ssh-keyscan` at deploy time: a
scan trusts whoever answers first, and this connection carries a key with
root-equivalent rights on the panel's own host. OpenPanel pins fingerprints for
the servers it manages; its own deploy holds the same bar. `DEPLOY_PATH` is a
variable, not a secret — a path isn't sensitive, and masking it only makes failed
runs harder to read.

The remote half is `docker/deploy.sh`, piped over stdin and given its arguments
as argv, so nothing is interpolated into a remote shell string. It pins `IMAGE=`
in the host's `.env` (so a later manual `docker compose up` keeps the deployed
version), then pulls and restarts. Migrations need no extra step: `up -d`
recreates `migrate`, and `server`'s `service_completed_successfully` dependency
means a failed migration fails the deploy instead of starting the API against an
unmigrated schema.

Rollback: re-tag an older version, or edit `IMAGE=` in the host's `.env` and run
`docker compose up -d`.

## Tests

**Every feature ships with tests** (backend and frontend) in the same change —
`bun run test` (typecheck → lint → `bun test`) is the gate, and it's what CI and
`bun run release` run. Runner is `bun:test`; files sit next to the code as
`<name>.test.ts`.

The target is pure logic — parsers, allowlists, validators, permission maths,
URL/state helpers — which is where bugs and security boundaries live and which
needs no host, DB, or browser. If a feature's logic is only reachable through a
live SSH call, extract the parsing/validation into `<feature>.constant.ts` and
test that. Anything parsing remote output (`/etc/os-release`, `ss`, `systemctl`)
gets a hostile-input test: spoofed values rejected, lengths capped, control
characters stripped. Locale parity is enforced by a test, not by review.

CI (`.github/workflows/ci.yml`) runs the gate plus a Docker build on every PR;
`release.yml` publishes to Docker Hub on a `v*` tag, gates first, and refuses to
publish if the tag and `package.json` disagree.

## Testing against a real host

```bash
docker run -d --name op-test -p 2222:22 linuxserver/openssh-server
```

Add a server (`localhost:2222`), click **Test connection** — this pins the host-key
fingerprint (TOFU) and detects the distro from `/etc/os-release`, which drives the
per-distro icon. Until a server is tested its host key is *not* verified on connect,
which is what the `untested` badge means. Then browse the dashboard / services /
files / terminal tabs.

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
`components/common/` (`PageShell`, `PageHeader`, `IconButton`, `ActionTooltip`,
`RefreshButton`, `TextInputDialog`, `ServerStatusBadge`). Tooltips use `ActionTooltip`
(shadcn), never the native `title`.

Reach for an existing component before writing markup: check `components/common/` and
`components/ui/` first; add a missing shadcn primitive with
`bunx --bun shadcn@latest add <name>` rather than hand-rolling one; extract shared markup to
`components/common/` once it appears in 3+ places (not before).

**Page layout** — top-level `(dashboard)` pages compose `PageShell` + `PageHeader` and are
full-width by design; don't constrain them with `mx-auto max-w-*`. Server-detail pages are
padded by `servers/[id]/layout.tsx`.

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

**Footprint is a hard requirement**: OpenPanel targets the weakest machine a user
has (1-vCPU/512MB VPS, old laptop, phone). Dependencies are guilty until proven
necessary — stdlib → native platform feature → an already-installed package → a
few lines of our own, before `bun add`. Judge a dep by install size and whether it
ships a barrel that must tree-shake, not just its gzip number: the distro icons
inline the ~13 marks we use (`components/common/os-brands.constant.ts`) instead of
depending on 25MB of `simple-icons`. Lists that reflect host state are paginated
(a systemd box has 150-300 units), and per-server-per-tick scheduler work stays
O(1) commands — `detectOs` runs once and stores its result rather than re-asking.

- **SSH connection pooling** (`apps/server/src/lib/ssh/client.ts` + `pool.ts`): one live connection
  per host is reused across requests (ssh2 multiplexes exec/sftp channels), so the 5s dashboard poll
  doesn't pay a TCP+SSH handshake each time. Idle connections are evicted after 60s. Concurrent
  acquires for the same host dedupe onto one dial, and eviction is identity-checked so a dying
  connection can't drop the one that replaced it. The bookkeeping lives in `pool.ts`, transport-free,
  so it's tested against a fake connect.
- **Bounded command output**: every exec caps at 5 MB (`MAX_OUTPUT_BYTES`) and destroys the stream
  past it, returning `truncated: true` rather than buffering an unbounded remote payload into RAM.
- **Charts load on demand**: recharts (~352K) is behind `next/dynamic` — the default server tab
  doesn't download or parse it before first paint.
- **The dashboard poll pauses when the tab is hidden**: each tick is a real SSH round-trip to the
  managed host, so a backgrounded tab costs nothing and refreshes on return.
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
