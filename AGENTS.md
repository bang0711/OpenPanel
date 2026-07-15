<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# OpenPanel — project rules (always follow)

OpenPanel is a cPanel-style panel that manages remote Linux servers over SSH. Stack: Next.js 16
(App Router, `proxy.ts` not middleware) · Elysia mounted in `app/api/[[...slugs]]/route.ts` ·
Better Auth (admin plugin) · Prisma 7 (multi-file schema, better-sqlite3 adapter) · shadcn/ui
(base-mira) · Bun. See `README.md` (Conventions) and `ROADMAP.md` (what to build next).

## Tooling
- **Always use Bun.** Install: `bun add` / `bun add -d`. Add shadcn components with
  `bunx --bun shadcn@latest add <name>` (never hand-write UI primitives).
- Standalone TS scripts run under `tsx` (Bun can't load `better-sqlite3`): `bun run seed`,
  `bun run terminal`. Run both servers with `bun run dev:all`.
- Before finishing: `bunx tsc --noEmit` and `bunx eslint --fix` must pass.

## Backend — feature modules
Put each feature in `src/server/modules/<feature>/`, split into:
- `<feature>.controller.ts` — Elysia routes only (HTTP concerns, status codes, auth macro).
- `<feature>.service.ts` — business logic as a **class** + exported singleton
  (`export const fooService = new FooService()`). Never put logic in the controller.
- `<feature>.schema.ts` — Elysia `t` validation schemas.
- `<feature>.constant.ts` — allowlists / constants / validation helpers.
Mount the controller in `src/server/app.ts`. Guard every route with the `auth`/`admin` macro
and `loadOwnedServer` for server-scoped routes.

## Frontend — API client & components
- All backend calls go through `src/lib/api` — `api.<resource>.<method>()`. **Never** call
  `fetch` directly in a component. One resource class per `resources/<name>.resource.ts`;
  types in `resources/<name>.type.ts`; endpoint paths in `endpoint.constant.ts`
  (`API_ENDPOINT`, server routes derive from one base).
- **One React component per file**, split small. Reusable pieces go in `components/common/`
  (`IconButton`, `ActionTooltip`, `RefreshButton`, `TextInputDialog`, `CommandOutputDialog`,
  `ServerStatusBadge`). Feature components in `components/<feature>/`.
- Tooltips: use `ActionTooltip` / `IconButton` (shadcn) — never the native `title` attribute.
- Memoize hot list rows (`memo`) and stabilize their handlers with `useCallback`.

## Security (non-negotiable)
- Never interpolate user input into a shell command. Validate with allowlists/regex; prefer
  SFTP over shell for file ops; feed dynamic content via stdin (`runCommandInput`) not the
  command string. Normalize remote paths to reject traversal.
- SSH credentials are encrypted at rest (`src/lib/crypto.ts`); never return them to the client.
- Keep live infra data uncached (freshness = correctness). Only bundle/​cache immutable data.

## Imports
Grouped & ordered (auto-fixed by `eslint-plugin-simple-import-sort`): side-effect → react/next/
external → `@/lib|@/db|@/server` → `@/components/ui` → `@/components/*` → relative.

## Docs — keep in sync (required)
Whenever you add or change a feature, in the **same change**:
- Update `ROADMAP.md` — check off the shipped item / move it out of "Planned".
- Update `README.md` — reflect any new stack, script, env var, structure, or convention.
Do not consider a feature done until both docs are updated.

## i18n — keep all locales in sync (required)
- User-facing text goes through the `useT()` hook with a key in `src/lib/i18n/messages.ts`.
  Do not hardcode display strings in client components.
- When you add a key, add it to **every** locale (`en` and `vi`) in the same change — never
  leave a locale missing a key. `en` is the fallback source of truth.
- Adding a new locale: add it to `LOCALES`, `LOCALE_NAMES`, a full dictionary, and an inline
  SVG flag in `components/common/flag-icon.tsx` (emoji flags don't render on Windows).
