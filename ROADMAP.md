# OpenPanel Roadmap

Feature checklist for contributors. See `README.md` → **Conventions** for how to add a
feature (backend `server/modules/<feature>/` with controller/service/schema/constant,
frontend `lib/api/resources/<name>.resource.ts` + `endpoint.constant.ts`, components in
`components/<feature>/`, a page under `app/(dashboard)/servers/[id]/<feature>/`, and a tab
in `components/servers/server-nav.tsx`).

## Shipped

- [x] Auth — multi-user, roles (Better Auth admin plugin), `proxy.ts` gate + per-route check
- [x] Server registry — SSH creds encrypted at rest, TOFU host-key pinning, password/key upload
- [x] System dashboard — CPU / RAM / disk / load / uptime (5s poll)
- [x] Services & processes — systemctl start/stop/restart/enable/disable, journal logs, ps/kill
- [x] File manager (SFTP) — browse, edit, upload, download, chmod, rename, mkdir, delete
- [x] Web terminal — xterm ⇄ standalone ws bridge + short-TTL ticket
- [x] Packages — apt/dnf/apk list, search, install, remove, update index
- [x] App catalog — curated one-click installs (nginx, docker, postgres, redis, node, …)
- [x] Dark mode + theme toggle
- [x] OpenAPI / Scalar docs at `/api/docs`
- [x] Perf — SSH connection pool, memoized rows, build-time bundled catalog metadata
- [x] Cron editor — list/add/remove crontab jobs (write via `crontab -` stdin, no injection)
- [x] Firewall (ufw) — status, enable/disable, allow/deny port, delete rule

## Planned

### Networking / security
- [ ] Log viewer — journalctl + arbitrary file tail, curated sources, follow mode
- [ ] SSL / Let's Encrypt — certbot issue / list / renew, auto-renew status
- [ ] SSH key manager — authorized_keys add/remove
- [ ] fail2ban — status, unban
- [ ] Open ports view (`ss`/`netstat`)

### Web / domains
- [ ] Virtual host manager — nginx/apache sites, enable/disable, config edit
- [ ] DNS zone editor — A / CNAME / MX / TXT
- [ ] Reverse-proxy / port-forward UI

### Databases
- [ ] DB manager — MySQL/Postgres create db/user, grants, list
- [ ] Query console (adminer-style)
- [ ] DB backup / restore dumps

### Users / access
- [ ] System user manager — create/delete, sudo, shell
- [ ] Panel RBAC — per-server permissions, read-only role
- [ ] Audit log — who did what (DB table + action middleware)
- [ ] API tokens for automation

### Ops
- [ ] Docker manager — containers/images, start/stop/rm, logs, compose
- [ ] Power controls — reboot / shutdown (confirm)
- [ ] Backup scheduler — files + db → local/S3
- [ ] Cron `@reboot` / one-off `at` jobs
- [ ] Bulk actions across multiple servers
- [ ] Historical metric charts (needs metric storage/agent)
- [ ] Alerts — disk full / service down → email/webhook

### Quality-of-life
- [x] i18n — `useT()` + per-feature dictionaries (en, vi) covering all components,
      language switcher with SVG flags
- [ ] Server groups / tags, global search
- [ ] Mobile-responsive polish
- [ ] Email/webhook notifications

## Notes / known limitations

- File upload buffers the whole file in memory before SFTP write — switch to a streaming
  SFTP upload for large files.
- Live SSH features are unverified against a real host in CI; test with
  `docker run -d -p 2222:22 linuxserver/openssh-server`.
- systemctl / ufw / package actions assume the SSH user is root or has passwordless sudo.
