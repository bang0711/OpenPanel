<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may
all differ from your training data. Read the relevant guide in
`node_modules/next/dist/docs/` before writing any code. Heed deprecation
notices.

<!-- END:nextjs-agent-rules -->

# OpenPanel — project rules (always follow)

OpenPanel is a cPanel-style panel that manages remote Linux servers over SSH.
**Bun-workspace monorepo**: `apps/web` (Next.js 16 frontend, App Router,
`proxy.ts` not middleware) · `apps/server` (standalone Elysia backend on Bun;
entry `apps/server/src/index.ts` mounts the Elysia app + Better Auth + CORS) ·
`packages/shared` (cross-boundary code, e.g. catalog data). Stack: Better Auth
(admin plugin, backend-side) · Prisma 7 (multi-file schema, `pg` adapter,
backend-only) · shadcn/ui (base-mira) · Bun. Web ⇄ backend is **same-origin**:
the browser calls `/api/*`, and `apps/web/src/proxy.ts` proxies it to the
backend at runtime (`API_BASE_URL`) — no CORS, no API URL in the client bundle.
The web app has **no DB access**; Server Components read via
`apps/web/src/lib/server-fetch.ts` (attaches the session cookie manually). The
terminal is an in-process Elysia `.ws()` bridge on the API server (port 3001),
not a separate service. See `README.md` (Conventions) and `ROADMAP.md` (what to
build next).

## Tooling

- **Always use Bun.** Install: `bun add` / `bun add -d` (add
  `--filter=@openpanel/<app>` to target a workspace). Add shadcn components with
  `bunx --bun shadcn@latest add <name>` in `apps/web` (never hand-write UI
  primitives).
- The seed script runs under `tsx` (Node): `bun run seed`. Run both processes
  (web :3000 + API/ws :3001) with `bun run dev` from the repo root.
- Before finishing: in each touched app run `bunx tsc --noEmit` and
  `bunx eslint --fix`.

## Backend — feature modules

Put each feature in `apps/server/src/server/modules/<feature>/`, split into:

- `<feature>.controller.ts` — Elysia routes only (HTTP concerns, status codes,
  auth macro).
- `<feature>.service.ts` — business logic as a **class** + exported singleton
  (`export const fooService = new FooService()`). Never put logic in the
  controller.
- `<feature>.schema.ts` — Elysia `t` validation schemas.
- `<feature>.constant.ts` — allowlists / constants / validation helpers. Mount
  the controller in `apps/server/src/server/app.ts`. Guard every route with the
  `auth`/`admin` macro. Server-scoped routes gate through
  **`authorize(serverId, user, action)`** (`src/server/access.ts`) — `action` is
  `"read"` for GETs, `"write"` for mutations, `"admin"` for destructive ops; it
  returns a `{ok,server}|{ok:false,code,error}` gate (owner/global-admin bypass,
  else per-server `ServerPermission`). `loadOwnedServer` remains as the read
  shortcut. Record privileged actions with
  `writeAudit(user.id, "<feature>.<action>", server.id)`. Personal **API
  tokens** authenticate via `Authorization: Bearer` (see `plugins/auth.ts`).
  Background work goes through the in-process scheduler: add a job in
  `src/server/jobs/` and register it in `jobs/index.ts` (runs via `setInterval`,
  single instance). Cross-boundary code (shared by web + server, e.g. catalog
  metadata) lives in `packages/shared` (`@openpanel/shared`).

## Frontend — API client & components

- All backend calls go through `apps/web/src/lib/api` —
  `api.<resource>.<method>()`. **Never** call `fetch` directly in a component
  (Server Components use `serverFetch` instead). The client calls same-origin
  `/api/*` (proxied to the backend by `proxy.ts`). One resource class per
  `resources/<name>.resource.ts`; types in `resources/<name>.type.ts`; endpoint
  paths in `endpoint.constant.ts` (`API_ENDPOINT`, server routes derive from one
  base).
- **One React component per file**, split small. Reusable pieces go in
  `components/common/` (`PageShell`, `PageHeader`, `IconButton`, `ActionTooltip`,
  `RefreshButton`, `TextInputDialog`, `CommandOutputDialog`, `ServerStatusBadge`).
  Feature components in `components/<feature>/`.
- **Always reach for a reusable component first.** Before writing any markup:
  1. Does something in `components/common/` or `components/ui/` already do this?
     Use it — check before you write, re-implementing what already exists is the
     most common failure here.
  2. **Use shadcn/ui for every interactive primitive** — add it if missing
     (`bunx --bun shadcn@latest add <name>`). NEVER hand-roll or use the native
     HTML element for any of: `<select>` → `Select`, `<input type="checkbox">` →
     `Checkbox`, an on/off toggle → `Switch`, `<input type="radio">` →
     `RadioGroup`, `<textarea>` → `Textarea`, `<input>` → `Input`, a dialog →
     `Dialog`, a tooltip → `ActionTooltip`. A styled native control (e.g. a
     `<select>` with border classes) is still a violation — the point is
     consistent behavior and a11y, not just appearance. Radix `Select` forbids an
     empty-string item value: use a sentinel (`"none"`, `"default"`) and map it
     back on submit.
  3. Is the same markup now in **3+ places**? Extract it to `components/common/`
     in that same change. Do not extract on the first or second use — duplication
     is cheaper than the wrong abstraction.
- **Page layout**: top-level `(dashboard)` pages compose `PageShell` +
  `PageHeader` and are **full-width by design**. Never add `mx-auto max-w-*` to a
  page — let tables and grids use the viewport. Server-detail pages get padding
  from `servers/[id]/layout.tsx`.
- **Tooltips: never use the native `title` attribute on any element.** A hover
  hint always wraps the element in `ActionTooltip` (a shared component over the
  shadcn tooltip), or uses `IconButton` (which has a `label` that renders one).
  `title=` on a real DOM element is a violation; `title` as a *prop* of our own
  components (`PageHeader title=`, `CommandOutputDialog title=`) is fine.
- Memoize hot list rows (`memo`) and stabilize their handlers with
  `useCallback`.

## Tests (non-negotiable)

**Every feature ships with tests — backend and frontend, in the same change.**
A feature is not done when it works; it is done when a test fails if it breaks.

- Runner is **`bun test`** (`bun:test`), no extra framework. Test files sit next
  to the code as `<name>.test.ts` — `foo.constant.ts` → `foo.constant.test.ts`.
- `bun run test` (typecheck → lint → `bun test`) must be green before you
  finish. CI runs the same command, and `bun run release` refuses to push
  unless it passes.
- **Test the pure logic, not the SSH round-trip.** Parsers, allowlists,
  validators, permission maths, and URL/state helpers are where the bugs and the
  security boundaries live — and they need no host, no DB, and no browser. If a
  feature's logic is only reachable through a live SSH call, that is a signal to
  extract the parsing/validation into a pure `<feature>.constant.ts` function
  and test that.
- **Every allowlist and every sanitiser gets a hostile-input test.** Remote
  output (`/etc/os-release`, `ss`, `systemctl`) is attacker-controlled if the
  host is: assert that a spoofed value is rejected, that lengths are capped, and
  that control characters are stripped.
- **Regressions get a test naming the bug** (see `server-nav.constant.test.ts`:
  "does not match a segment that is only a prefix of the route").
- Don't test the framework, shadcn primitives, or i18n dictionaries; a locale
  parity check belongs in the dictionary test, not in every component.

## Footprint (non-negotiable)

OpenPanel must run on the weakest box the user has — a 1-vCPU/512MB VPS, an old
laptop, a phone on the dashboard. Small is a feature, not a nice-to-have.

- **Every dependency is guilty until proven necessary.** Before `bun add`, check
  the ladder: stdlib → native platform feature → a package already installed →
  a few lines of our own. Reach for a dep only when it genuinely beats all four.
- **Weigh the real cost, not the gzip number**: install size, whether it ships a
  barrel the bundler must tree-shake, and what happens if that shaking regresses.
  Needing 13 icons out of a 25MB, 5MB-barrel package means inlining what we use
  (see `components/common/os-brands.constant.ts`) — not adding the package.
- **Client bundle**: prefer Server Components; keep `"use client"` at the leaves.
  No animation/date/icon/utility library for what CSS or a helper can do.
- **Backend**: it holds live SSH connections, so memory is the scarce resource.
  Stream or cap anything unbounded; never buffer a whole file/log when a tail or
  a stream will do. Bound every list that grows with host size.
- **Per-host cost is the metric that bites**: work that runs per server per tick
  (the scheduler polls all of them) must stay O(1) commands and sequential. An
  extra command per tick is a real cost at 50 servers — do it once and store the
  result (as `detectOs` does) rather than re-asking.
- **Paginate/virtualize any list that reflects host state** (services, processes,
  packages, files). A systemd box has 150-300 units; rendering them all is a jank
  source on weak clients.
- Measure when it matters: `du -ch .next/static/chunks/*.js` before/after, and
  say what a change cost. Don't guess.

## Security (non-negotiable)

- Never interpolate user input into a shell command. Validate with
  allowlists/regex; prefer SFTP over shell for file ops; feed dynamic content
  via stdin (`runCommandInput`) not the command string. Normalize remote paths
  to reject traversal.
- SSH credentials are encrypted at rest (`apps/server/src/lib/crypto.ts`); never
  return them to the client.
- Keep live infra data uncached (freshness = correctness). Only bundle/​cache
  immutable data.

## Imports

Grouped & ordered (auto-fixed by `eslint-plugin-simple-import-sort`):
side-effect → react/next/ external → `@/lib|@/db|@/server` → `@/components/ui` →
`@/components/*` → relative.

## Docs — keep in sync (required)

Whenever you add or change a feature, in the **same change**:

- Update `ROADMAP.md` — check off the shipped item / move it out of "Planned".
- Update `README.md` — reflect any new stack, script, env var, structure, or
  convention. Do not consider a feature done until both docs are updated.

## i18n — keep all locales in sync (required)

- User-facing text goes through the `useT()` hook with a key in
  `apps/web/src/lib/i18n/messages.ts`. Do not hardcode display strings in client
  components.
- When you add a key, add it to **every** locale (`en` and `vi`) in the same
  change — never leave a locale missing a key. `en` is the fallback source of
  truth.
- Adding a new locale: add it to `LOCALES`, `LOCALE_NAMES`, a full dictionary,
  and an inline SVG flag in `components/common/flag-icon.tsx` (emoji flags don't
  render on Windows).
