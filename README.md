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

## How it works

OpenPanel is a **control plane** — it installs **no agent** on managed hosts.
Every feature is a validated command run over a pooled SSH connection (or an
SFTP transfer), and the panel's own Postgres holds the registry, permissions,
API tokens, alert rules, backup jobs, and audit log. Understand the shared
substrate below and each feature is a thin, predictable layer on top.

### The SSH substrate (every feature rides this)

`apps/server/src/lib/ssh/client.ts` is the one door to a managed host:

- **Pooled connections** — one live `ssh2` client per `user@host:port`, reused
  across requests (ssh2 multiplexes exec/SFTP channels over it), idle-evicted
  after 60s. So the 5s dashboard poll never re-pays a TCP+SSH handshake.
- **Two run primitives** — `runCommand(server, cmd)` for one exec round-trip;
  `runCommandInput(server, cmd, stdin)` pipes dynamic content to the command's
  **stdin** so it never touches the command string (`argv`).
- **Bounded output** — every exec caps at 5 MB and sets `truncated: true` rather
  than buffering an unbounded remote payload (a `SELECT *` can't OOM the panel).
- **TOFU host-key pinning** — the first successful connect pins the host's
  SHA-256 fingerprint; every later connect is rejected if the key changes. The
  `untested` badge means "not pinned yet".
- **Credentials at rest** — the SSH password/key is AES-256-GCM encrypted
  (`OPENPANEL_ENC_KEY`) and only decrypted in-memory at connect time; it is never
  returned to the client.

**Two injection defenses, applied per feature:**
1. **Deliver via stdin / SFTP, not the command line.** File contents
   (`files`, `dns`, `vhost`, `proxy`), a rebuilt `authorized_keys` (`ssh-keys`),
   a new `crontab` (`cron`), and raw SQL (`query`, `db`) are all piped to stdin
   or written over SFTP — untrusted bytes never become shell tokens.
2. **Allowlist what must be interpolated.** Where a value has to land in a
   command (a port, domain, systemd unit, zone name, nginx site, jail, IP), the
   module's `<feature>.constant.ts` gates it with a strict **char-class allowlist**
   (never a denylist) — e.g. the `ssl` email validator is an allowlist precisely
   so `;`, `|`, `` ` ``, `$(…)` can't reach `certbot`.

**Privilege — two models.** Some commands are prefixed with `sudo` (`db`,
`query`, `db-backup`, `backups`, `packages`/`catalog` installs, `bulk` writes) —
these need the SSH user to have **passwordless sudo**. Others run **bare** and
assume the user already holds the right (`systemctl`, `ufw`, `certbot`,
`useradd`, `nginx`, `shutdown`, `docker`) — i.e. root or a group membership. In
practice: **register hosts as root, or as a NOPASSWD-sudo user.** A missing
privilege surfaces as a permission error (or, for `power`, a silent no-op).

### Servers & connection

Add a host with IP/user + password or private key. **Test connection** opens a
one-off SSH session, pins the host key (TOFU), and reads `/etc/os-release` — the
`ID` is matched against an allowlist to pick the distro brand icon, and
`PRETTY_NAME` is sanitized (control chars stripped, length capped) because it's
attacker-controlled if the host is. Editing the host/port clears the pin so the
next Test re-pins. `OPENPANEL_ENC_KEY` must never change: every stored credential
is sealed under it, so a new key makes GCM decryption fail and orphans every
server.

### Monitoring — dashboard, history, alerts

- **Live dashboard** batches **8 reads into one SSH round-trip** — `hostname`,
  `uname`, `nproc`, `/proc/loadavg`, `/proc/uptime`, `free -b`, `df`,
  `systemctl is-system-running` joined by a `@@OPSEC@@` sentinel, then split
  positionally and parsed in pure functions. Polls every 5s, and **pauses when
  the browser tab is hidden** (each tick is a real SSH trip).
- **History** comes from the scheduler: every 60s it samples all servers
  (bounded to 5 concurrent SSH trips, with per-host exponential backoff so a dead
  host stops taxing the sweep), writes compact `MetricSample` rows in one batch,
  and prunes >7-day rows hourly. Charts lazy-load recharts (`next/dynamic`).
- **Alerts** are rules (`cpu`/`mem`/`disk`/`service`, `<`/`>`, threshold) polled
  every 60s. Metric rules read the latest sample per server in **one** `distinct`
  query; `service` rules run `systemctl is-active` live. Firing is **edge-based**
  — notify once on breach, once on resolve — delivered to a webhook channel
  (best-effort; a dead webhook can't stall the scheduler).

### Services, packages, catalog

- **Services & processes** — `systemctl list-units --output=json` (parsed as
  JSON), actions from a `start/stop/restart/enable/disable` allowlist, logs via
  `journalctl`, `ps` for processes, `kill -<SIGNAL>` with a `TERM/KILL/HUP`
  allowlist and an integer PID > 1. Unit names match a strict regex.
- **Packages** — first `command -v` detects apt/dnf/apk, then acts. Names are
  allowlisted before interpolation. Mutations run under `sudo` (apt via
  `sudo env DEBIAN_FRONTEND=noninteractive apt-get …`, since a default sudoers
  policy rejects `sudo VAR=val`); list/search stay unprivileged.
- **App catalog** — one-click installs from **static, author-defined** scripts
  (no user input interpolated). You supply only an app `id`, resolved with
  `Object.hasOwn` so prototype keys (`__proto__`, `constructor`) can't slip
  through. Package-based apps use the same sudo'd manager commands; Docker uses
  the official `get.docker.com` script.

### Files & terminal

- **File manager** is **pure SFTP — no shell at all** (`readdir`, `stat`,
  `read/writeFile`, `mkdir`, `rename`, `chmod`). Every path passes
  `normalizeRemotePath` (absolute, and rejected if any component is `..` *after*
  normalization). Edits cap at 1 MB, downloads at 100 MB (checked via `stat`
  first), chmod modes match `^[0-7]{3,4}$`. The boundary is the SSH user's own
  filesystem permissions.
- **Web terminal** — the browser first `POST`s for a **ticket** (gated by
  `authorize(write)`): a `{userId, serverId, exp}` payload HMAC-signed with
  `BETTER_AUTH_SECRET`, valid **60s**, stored nowhere. It then opens
  `TERMINAL_WS_URL?ticket=…` to an in-process `.ws()` bridge, which verifies the
  HMAC (`timingSafeEqual` + expiry) **and re-checks server ownership against the
  DB** (the ticket only proves who minted it), then pipes a one-off `ssh2` shell
  both ways. `TERMINAL_WS_URL` is read **server-side** and passed as a prop — not
  `NEXT_PUBLIC_*`, which would bake it into the client bundle at build time.

### Security & network

- **Firewall (ufw)** — `ufw status numbered` (regex-parsed); allow/deny with the
  port and protocol validated as a number and an enum; `--force` to skip ufw's
  interactive prompt.
- **fail2ban** — `fail2ban-client status` then one status call per jail for
  banned IPs; unban validated with Node's `net.isIP` (a prior regex backtracked
  into a ReDoS on ~40 colons).
- **SSH keys** — `authorized_keys` is read, edited in JS, and written back via
  **stdin** (`cat > …` + chmod in one command); public keys are rejected if they
  contain a newline (can't inject extra key lines).
- **SSL (certbot)** — `certbot --nginx -n --agree-tos -m <email> -d <domain>`;
  domain and email are strictly allowlisted (they're interpolated). Needs the
  certbot nginx plugin, a resolving domain, and port 80 for the ACME challenge.
- **DNS (BIND)** — zone files are read/written over **SFTP** (restricted to
  `/etc/bind` and `/var/named`), then `named-checkzone` validates and **only on
  success** does `rndc reload` run — a broken zone never reaches a live server.
- **nginx vhosts & reverse proxy** — configs written over SFTP to
  `sites-available`, validated with `nginx -t`; a plain write **won't reload**
  (a bad config can't take down a live nginx), only enable/disable/create do.
  The proxy module marks its files with a comment so it never clobbers
  hand-written vhosts. Assumes the Debian `sites-available`/`sites-enabled`
  layout.

### System, bulk, ops

- **System users** — `getent passwd` (only uid 0 or ≥1000 shown);
  `useradd`/`userdel`/`usermod` with an allowlisted username and login shell;
  the sudo-group toggle tries `sudo` then `wheel` for Debian/RHEL portability.
- **Bulk actions** — a fixed, allowlisted action (uptime/disk/update/restart)
  run across many servers **sequentially**, and **each server is individually
  authorized** at the action's required level before its command runs.
- **Docker** — `docker ps`/`images` in a tab-delimited Go-template format
  (parsed), container actions from an allowlist, logs via `docker logs`. Needs
  the SSH user in the `docker` group (or root).
- **Power** — `shutdown -r/-h now`; a dropped SSH connection is treated as
  **success**, because the host cuts the link as it powers off.
- **Logs & ports** — logs come from a curated source table (syslog/auth/kernel/
  journal/nginx) plus a dynamic `journalctl -u <unit>` with an allowlisted unit;
  ports use `ss` with a `netstat` fallback and a parser that reads both formats.

### Databases

- **Manager** — `sudo mysql` / `sudo -u postgres psql`; identifiers are
  allowlisted (`^[A-Za-z0-9_]+$`, ≤64) and passwords are delivered as SQL over
  **stdin**, never argv.
- **Query console** — arbitrary SQL piped to the client over **stdin** (only the
  DB name is interpolated, and validated); NUL bytes rejected, SQL capped, and
  the transport's `truncated` flag surfaced to the UI.
- **Backups** — on-demand and scheduled `mysqldump`/`pg_dump`/`tar` on the remote
  host, with the filename timestamp coming from the remote `date` (not user
  input). The scheduled runner and the run-now path have **separate command
  builders that both re-validate every time**, so a tampered DB row can't inject.

### Access control

- **Per-server RBAC** — `authorize(serverId, user, action)` ranks
  `read < write < admin`. Owner and global-admin bypass to `admin`; otherwise a
  per-server `ServerPermission` grants a level; a global `readonly` role clamps
  everything to `read`. A user with **no** access gets **404, not 403**, so
  server existence stays hidden. Reads gate `read`, mutations `write`,
  destructive ops (delete, grant/revoke) `admin`.
- **API tokens** — `op_` + 24 random bytes, shown **once**; only the SHA-256 hash
  is stored. A `Bearer` token authenticates as its owner with that owner's full
  role (unscoped — treat an admin token like an admin password).
- **Audit log** — append-only; `writeAudit` runs fire-and-forget after the gate
  passes and before the privileged op, so logging can never block or break an
  action. The viewer is global-admin only.

### Scheduler

An in-process `setInterval` runs three 60s jobs (metric sampler, alert poller,
backup runner) with an overlap guard (a slow run skips its next tick rather than
stacking). It is **single-instance by design** — running two panel processes
would double-sample and double-fire alerts (no distributed lock). The shared
sweep helper caps concurrency at 5 and applies per-host backoff.

## Getting started

```bash
bun install                   # installs all workspaces
cp apps/server/.env.example apps/server/.env   # fill in secrets
cp apps/web/.env.example apps/web/.env.local
bun run db:migrate            # apply Prisma migrations (in apps/server)
bun run seed                  # create admin@openpanel.local / admin12345
bun run dev                   # web :3000 + API/ws :3001
```

Open http://localhost:3000, sign in, and add a server. API reference (dev):
http://localhost:3001/api/docs.

**Managed hosts need passwordless sudo.** Privileged actions (package install,
service control, user/db management, firewall, backups) run over SSH as the
registered user via `sudo`, non-interactively — so that user must have NOPASSWD
sudo, or be root. Otherwise operations like installing nginx fail with e.g.
`Could not open lock file … Permission denied`. Grant it with a sudoers drop-in
on the managed host, e.g. `echo '<user> ALL=(ALL) NOPASSWD:ALL' | sudo tee
/etc/sudoers.d/openpanel` (scope it down if you prefer).

**The docs are not exposed in production.** Two layers: the Scalar UI is only
mounted when `NODE_ENV !== production` or `ENABLE_API_DOCS=true`, so on a normal
deploy `/api/docs` returns 404 on the frontend proxy *and* the backend port; and
`proxy.ts` never forwards `/api/docs` from the web origin regardless, so even
turning the flag on for a private box keeps the reference off the public site.

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
| `bun run build` | both apps: bundles the API to a single ~7MB JS file (`apps/server/dist/server.js`, no `node_modules` needed to run) then builds the web app |
| `bun run start` | production web + API/ws — the API runs the **bundled JS on bun**, so `build` must come first |
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
docker run --rm -v "$PWD:/output" open-panel:1.1.1 install
# set DATABASE_URL in the generated .env (bring your own Postgres) — or pass it:
#   docker run --rm -e DATABASE_URL=postgresql://… -v "$PWD:/output" open-panel:1.1.1 install
docker compose up -d
docker compose run --rm server seed     # first admin user
```

Open http://localhost:3000 (`admin@openpanel.local` / `admin12345` — change it).

The stack does not run a database — point `DATABASE_URL` at your own Postgres
(managed like Neon/Supabase/RDS, or a container you run separately).

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
| `server` | API + terminal ws (:3001). A single ~7MB `bun build` JS bundle run on the base bun — no `node_modules`, no source tree, no second runtime embedded |
| `web` | Next.js `output: "standalone"` (:3000) — only the traced modules |
| `migrate` | applies pending migrations, then exits. `server` waits on `service_completed_successfully`, so the API never races an unmigrated schema. Uses `bun server.js migrate`, a SQL applier bundled into the JS — **no prisma CLI in the image** |
| `seed` | Creates the first admin user, then exits |

The image is **243MB** (measured): 88MB Bun runtime (shared by the server bundle
and the web role), 64MB Next standalone, 7MB API bundle, ~100KB migration SQL, on
a 9MB Alpine base. No `node_modules`. Bundling the API onto the shared bun
instead of a `--compile` binary — which embeds its own copy of bun — cut the
image from 371MB with no measured RAM cost.

Migrations: `bun server.js migrate` reads the committed `prisma/migrations/*.sql`
and applies the pending ones through the same `pg` driver the app uses (so one
`DATABASE_URL` — SSL and all — behaves identically for both), tracking them in
Prisma's own `_prisma_migrations` table with the same checksums — so an existing
Prisma-migrated database is picked up seamlessly. It exists only to *apply*; you
still author migrations on a dev machine with `prisma migrate dev` (prisma is a
dev dependency, never shipped). Editing an already-applied migration, a prior crashed apply, or a
missing `DATABASE_URL` each fail the role, which blocks the deploy rather than
starting the API against a bad schema. Don't run `prisma migrate deploy` against
a database the runner manages — the runner is the deploy path.

Building it locally (CI publishes — see below):

```bash
docker build -t open-panel:1.1.1 .
```

**Run the whole container stack locally** to verify the image before releasing.
Create a gitignored `docker/.env` with `IMAGE`, your `DATABASE_URL`, and the two
secrets (`BETTER_AUTH_SECRET`, `OPENPANEL_ENC_KEY`), then:

```bash
docker build -t open-panel:1.1.1 .   # build first — the stack won't pull it
cd docker && docker compose up        # reads docker/.env
# open http://localhost:3000, then: docker compose run --rm server seed
```

Point `DATABASE_URL` at any reachable Postgres (managed, Cloud SQL, or a
container you run). Two `.env` gotchas that bite in practice:

- **A literal `$` in the password must be doubled to `$$`** — compose treats a
  single `$` as variable interpolation.
- **SSL for managed databases**: a host whose TLS certificate chains to a public
  CA (Neon, Supabase) works with `?sslmode=require`. One whose CA isn't in the
  container's trust store (Google **Cloud SQL**, RDS) needs `?sslmode=no-verify`
  — encrypt without verifying the certificate. Both the migrations and the app
  go through the same `pg` driver, so this one value covers the whole stack.

Production never reads this file; it injects the same values over ssh (see CD
below), so put the SSL parameter on the `DATABASE_URL` secret there too.

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

**The deployed host keeps no `.env`.** CI copies the compose file into place and
injects every config value at deploy time over the ssh channel — nothing is
written to the server's disk, and the secrets never appear in its `ps`. The only
prerequisite on the box is Docker and an SSH user that can run it. Configure once:

| Name | Kind | Value |
| --- | --- | --- |
| `DEPLOY_HOST` | secret | server IP or hostname |
| `DEPLOY_USER` | secret | SSH user (must be able to run `docker`) |
| `DEPLOY_SSH_KEY` | secret | private key, full PEM including the header/footer lines |
| `DEPLOY_KNOWN_HOSTS` | secret | output of `ssh-keyscan <host>` |
| `DATABASE_URL` | secret | Postgres connection string (bring your own DB) |
| `BETTER_AUTH_SECRET` | secret | 32 bytes base64 — session signing + terminal-ticket HMAC |
| `OPENPANEL_ENC_KEY` | secret | 32 bytes base64 — decrypts SSH creds at rest. **Never change it** |
| `DEPLOY_PATH` | **variable** | dir the compose file is copied to, **writable by `DEPLOY_USER`**. Use a home path like `/home/<user>/openpanel`; `/opt/openpanel` only works if you pre-create it (`sudo mkdir -p … && sudo chown <user> …`) |
| `PUBLIC_URL` | **variable**, optional | e.g. `https://panel.example.com` (default `http://localhost:3000`) |
| `PUBLIC_WS_URL` | **variable**, optional | e.g. `wss://panel.example.com:3001/api/terminal` |

⚠️ **`OPENPANEL_ENC_KEY` must stay constant for the life of the install.** It
decrypts the SSH credentials stored in the database; a new value orphans every
registered server. Generate it once
(`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`),
set the secret, and never rotate it. The same applies to `DATABASE_URL` pointing
at the same database — a fresh DB starts empty.

The host key comes from a secret rather than an `ssh-keyscan` at deploy time: a
scan trusts whoever answers first, and this connection carries a key with
root-equivalent rights on the panel's own host. OpenPanel pins fingerprints for
the servers it manages; its own deploy holds the same bar. Paths and public URLs
are variables, not secrets — masking them only makes failed runs harder to read.

The remote half is `docker/deploy.sh` (scp'd alongside the compose file). Config
arrives as `KEY=value` lines on its stdin, which it reads into the environment;
compose interpolates from there. Migrations need no extra step: `up -d` recreates
`migrate`, and `server`'s `service_completed_successfully` dependency means a
failed migration fails the deploy instead of starting the API against an
unmigrated schema.

After `up -d`, the script **waits for the server's healthcheck** (`GET
/api/health` → `SELECT 1`) to report healthy before it reports success — a
container that starts but crash-loops or can't reach its DB fails the deploy
with logs, instead of a green deploy of a down app. It also **reclaims disk
before pulling** (stopped containers, dangling layers, build cache, and old
`open-panel:<ver>` tags) so a small-disk host doesn't fail the pull, then again
after the swap to drop the now-replaced image. CI additionally builds the image
on every PR and scans it with **Trivy** (fails on a fixable HIGH/CRITICAL CVE).

Because config is injected at `up`, a bare `docker compose up` on the box (after
a manual `down`) has nothing to interpolate and will fail — redeploy through CI
instead. A plain **host reboot is fine**: Docker restarts the existing containers
(`restart: unless-stopped`) with the env baked in at creation. Rollback: re-tag
an older version and let CI redeploy it.

#### Behind an existing Traefik

To serve the panel over HTTPS through a Traefik reverse proxy you already run
(instead of exposing `:3000`/`:3001`), set these repo **variables** — the
`docker-compose.traefik.yml` overlay picks them up:

| Variable | Value |
| --- | --- |
| `COMPOSE_FILE` | `docker-compose.yml:docker-compose.traefik.yml` |
| `PANEL_HOST` | `panel.example.com` — the panel's hostname |
| `TRAEFIK_NETWORK` | the docker network your Traefik is on (`docker inspect <traefik> --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'`) |
| `TRAEFIK_ENTRYPOINT` | optional, default `websecure` |
| `TRAEFIK_CERTRESOLVER` | optional, default `letsencrypt` |
| `PUBLIC_URL` | `https://panel.example.com` |
| `PUBLIC_WS_URL` | `wss://panel.example.com/api/terminal` |

Traefik reaches the containers over its own network, so nothing needs a host
port — leave `:3000`/`:3001` closed at the firewall. Two routers are created on
`PANEL_HOST`: everything → `web:3000`, and the terminal websocket
(`/api/terminal`) → `server:3001`. `PANEL_HOST`'s DNS must point at the box
before the first deploy, or Let's Encrypt can't issue the certificate. Leave
`COMPOSE_FILE` unset to skip Traefik and publish ports directly.

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

Mechanics are in [How it works](#how-it-works); this is the **trust model** — the
boundaries the whole design rests on.

- **The panel is effectively root on every managed host.** Each feature runs a
  command as the stored SSH identity (via `sudo` or an already-privileged user),
  with no per-command remote sandbox. A panel compromise is a compromise of every
  registered server. Treat the panel host, its DB, and `OPENPANEL_ENC_KEY` as
  crown jewels.
- **Injection defense is input allowlists + stdin/SFTP delivery**, not remote
  quoting. Dynamic content is piped to stdin or written over SFTP; anything that
  must be interpolated is gated by a strict char-class allowlist in
  `<feature>.constant.ts` (with a hostile-input test). A wrong or bypassed
  validator means arbitrary shell as the SSH user — so validators are the
  security surface, and they're tested as such.
- **Credentials are AES-256-GCM encrypted at rest and never returned to the
  client.** `OPENPANEL_ENC_KEY` must stay constant and secret for the life of the
  DB: change it and GCM decryption fails, orphaning every server; leak it plus a
  DB dump and every SSH credential is recoverable.
- **Auth on every route** via the Elysia `auth`/`admin` macro; server-scoped
  routes additionally gate through `authorize()` (read/write/admin), and no-access
  returns 404 to hide existence. **API tokens are unscoped** — a token carries its
  owner's full role, so an admin token equals an admin password until revoked.
- **Host keys are TOFU-pinned** on first connect and enforced after — but the
  first connect trusts whoever answers, so a MITM at registration time pins the
  attacker's key.
- **The web terminal** authorizes via a ≤60s HMAC ticket (`timingSafeEqual`),
  then re-checks server ownership against the DB before opening the shell.
- **The scheduler is single-instance** — no distributed lock, so a second panel
  process would double-fire alerts and backups.
