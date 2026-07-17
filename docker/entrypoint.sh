#!/bin/sh
# Role dispatcher for the single open-panel image. docker-compose runs the same
# image three times with a different role; `install` generates the compose file.
set -e

case "${1:-}" in
  server)
    exec /app/op-server serve
    ;;
  seed)
    exec /app/op-server seed
    ;;
  migrate)
    # Applies pending migrations via the compiled binary (no prisma CLI in the
    # image). cd so the runner finds ./prisma/migrations.
    cd /app/server
    exec /app/op-server migrate
    ;;
  web)
    # Next standalone server. HOSTNAME=0.0.0.0 so it's reachable outside the
    # container; PORT defaults to 3000.
    exec bun /app/web/apps/web/server.js
    ;;
  install)
    shift
    exec /app/install.sh "$@"
    ;;
  *)
    echo "open-panel — usage: <server|web|migrate|seed|install>" >&2
    echo >&2
    echo "  install   write docker-compose.yml + .env into /output" >&2
    echo "  migrate   apply database migrations, then exit" >&2
    echo "  seed      create the first admin user, then exit" >&2
    echo "  server    API + terminal websocket (:3001)" >&2
    echo "  web       Next.js frontend (:3000)" >&2
    exit 1
    ;;
esac
