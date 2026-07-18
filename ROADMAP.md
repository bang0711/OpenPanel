# OpenPanel Roadmap

Feature checklist for contributors. See `README.md` → **Conventions** for how to add a
feature (backend `apps/server/src/server/modules/<feature>/` with controller/service/schema/constant,
frontend `apps/web/src/lib/api/resources/<name>.resource.ts` + `endpoint.constant.ts`, components in
`apps/web/src/components/<feature>/`, a page under `apps/web/src/app/(dashboard)/servers/[id]/<feature>/`,
and a tab in `components/servers/server-nav.tsx`).

## Shipped

- [x] Monorepo split — `apps/web` (Next) + `apps/server` (Elysia on Bun) + `packages/shared`;
      same-origin proxy (`proxy.ts`) forwards `/api/*` to the backend, auth + Prisma backend-only
- [x] Docker — one image, four roles (`server`/`web`/`migrate`/`seed`); `open-panel install` writes
      the compose file + generated secrets; no config baked into the image
- [x] CI/CD — `bun run test` gate + image build & Trivy scan on every PR; a `v*` tag gates →
      publishes to Docker Hub → deploys over SSH (`docker/deploy.sh`, host key pinned from
      `DEPLOY_KNOWN_HOSTS`), reclaiming disk before pull and waiting on the `/api/health`
      container healthcheck before reporting success (a crash-looping release fails the deploy)
- [x] Auth — multi-user, roles (Better Auth admin plugin), `proxy.ts` gate + per-route check
- [x] Server registry — add / edit / delete, SSH creds encrypted at rest, TOFU host-key pinning
      (re-pinned when host/port changes), password/key upload, distro detection
      (`/etc/os-release` → allowlisted `osId`) with per-distro brand icons
- [x] Privilege escalation — every root-needing command runs through `runPrivileged`, which adapts
      to the host's detected sudo mode (root / passwordless sudo / sudo password fed on stdin);
      works for a root user, a NOPASSWD key-user, or a sudo-password user with no per-module change
- [x] System dashboard — CPU / RAM / disk / load / uptime (5s poll)
- [x] Services & processes — systemctl start/stop/restart/enable/disable, journal logs, ps/kill
- [x] File manager (SFTP) — browse, edit, upload, download, chmod, rename, mkdir, delete
- [x] Web terminal — xterm ⇄ in-process Elysia `.ws()` ssh bridge + short-TTL ticket
- [x] Packages — apt/dnf/apk list, search, install, remove, update index
- [x] App catalog — curated one-click installs (nginx, docker, postgres, redis, node, …)
- [x] Dark mode + theme toggle
- [x] OpenAPI / Scalar docs at `/api/docs`
- [x] Perf — SSH connection pool, memoized rows, build-time bundled catalog metadata;
      lazy-loaded charts + visibility-gated polling; scheduler sweeps run bounded-concurrent
      with per-host failure backoff and batched writes (a down host can't stall the sweep)
- [x] Cron editor — list/add/remove crontab jobs (write via `crontab -` stdin, no injection)
- [x] Firewall (ufw) — status, enable/disable, allow/deny port, delete rule

### Foundations (RBAC / scheduler / observability)
- [x] Panel RBAC — per-server capability matrix (`authorize(user, server, action)`), `readonly` role,
      grants managed per server (Access tab)
- [x] API tokens — Bearer auth alongside session cookies (hashed at rest, shown once)
- [x] Audit log — privileged actions recorded via `writeAudit`, admin-only viewer
- [x] In-process scheduler (`scheduler.ts`) — metric sampler, alert poller, backup runner
- [x] Historical metric charts — recharts (CPU/mem/disk) over 1h/24h/7d, backed by `MetricSample`

### Networking / security
- [x] Log viewer — journalctl + curated file tails (static)
- [x] SSL / Let's Encrypt — certbot list / issue (`--nginx`) / renew
- [x] SSH key manager — authorized_keys add/remove (stdin write, no injection)
- [x] fail2ban — status, unban
- [x] Open ports view (`ss`/`netstat`)

### Web / domains
- [x] Virtual host manager — nginx sites list/enable/disable, config edit over SFTP + `nginx -t`
- [x] DNS zone editor — edit local BIND zone files (SFTP) + `named-checkzone` + reload
- [x] Reverse-proxy UI — templated nginx `proxy_pass` sites

### Databases
- [x] DB manager — MySQL/Postgres create db/user, grants, list
- [x] Query console — run SQL (stdin) and render rows
- [x] DB backup — manual `mysqldump`/`pg_dump` + list dumps

### Users / access
- [x] System user manager — create/delete, sudo toggle, shell
- [x] Bulk actions across multiple servers (allowlisted action fan-out)

### Ops
- [x] Docker manager — containers/images, start/stop/restart/rm, logs
- [x] Power controls — reboot / shutdown (confirm, admin-only)
- [x] Backup scheduler — files (tar) + db (dump) jobs on an interval, run-now
- [x] Alerts — metric/service rules evaluated by the poller → webhook notification
- [x] Notification channels — webhook delivery (CRUD)

### Quality-of-life
- [x] i18n — `useT()` + per-feature dictionaries (en, vi), language switcher with SVG flags
- [x] Server tags + global search (sidebar)

## Deferred / partial

- Cron `@reboot` / one-off `at` jobs — only crontab is implemented.
- DB backup **restore** and an S3/off-box target — dumps are local-only.
- Email notifications — only webhook channels ship; SMTP deferred (no mail dep).
- Apache vhosts / DNS per-record (A/CNAME/MX) form / Docker Compose UI / log follow-mode —
  the config-file + command layer is there; richer UIs deferred.
- Mobile-responsive polish — tables/nav scroll on small screens; a dedicated audit is pending.

## Notes / known limitations

- Background jobs run in-process via `setInterval` (`scheduler.ts`); fine for a single instance,
  move to a worker/queue for multi-instance deployments.
- The metric sampler polls every registered host every 60s, sequentially — watch SSH load with many
  servers. At ~50 hosts a tick can exceed the 60s interval, and the scheduler's overlap guard then
  *skips* the next tick, so sampling silently degrades. Add concurrency + a skip log if that bites.
- Command output is capped at 5 MB per exec (`MAX_OUTPUT_BYTES`, `lib/ssh/client.ts`); past that the
  stream is destroyed and the result is flagged `truncated`. The query console surfaces this. Anything
  needing more must stream rather than buffer.
- File upload buffers the whole file in memory before SFTP write and has no `maxSize`; download
  buffers up to 100 MB and copies it once more (~200 MB peak). Switch to streaming for large files.
- `alert-poller` runs one query + one SSH exec per rule per tick (N+1); batch per server if rule
  counts grow.
- `AuditLog` grows unbounded — no retention pruning yet (reads are capped at 500).
- Live SSH features are unverified against a real host in CI; test with
  `docker run -d -p 2222:22 linuxserver/openssh-server`.
- systemctl / ufw / package / db / power actions assume the SSH user is root or has passwordless sudo.
- The CD `deploy` job is untested end-to-end — no tag has been pushed to a real host
  (`docker/deploy.sh`'s own logic is verified against a stubbed `docker`). It has no `bun test`
  coverage either: the unit is a shell script plus workflow YAML, neither reachable from the runner.
  First real tag is the proof; deploy a throwaway version before a real one.
- The image itself is verified: it builds (243MB — API bundled onto the shared bun, not a
  --compile binary), and against a throwaway Postgres the `migrate`
  (bundle-embedded SQL applier, Prisma-checksum-compatible), `seed`, and `server` roles all run
  correctly. Still unverified: a full `compose up` of the whole stack, browser sign-in, the terminal
  websocket, and registering a real host (`detectOs` / fingerprint pin) — those need the web + a
  live sshd.
- CD keeps no `.env` on the server: config is injected over the ssh channel at deploy time, and CI
  copies the compose file into `DEPLOY_PATH` itself. The box needs only Docker + an SSH user. A bare
  `docker compose up` on the host (after a manual `down`) has nothing to interpolate and fails —
  redeploy through CI. Deploy is single-host (no rolling restart — brief downtime while compose
  recreates the containers).
