#!/bin/sh
# Remote half of the CD deploy, run on the target host by
# .github/workflows/release.yml. The workflow scps this file plus
# docker-compose.yml into <dir>, then runs:
#
#   printf '%s\n' KEY=val ... | ssh host "sh <dir>/deploy.sh <dir>"
#
# The deployed server keeps NO .env file. Config (image tag, DATABASE_URL, the
# secrets) arrives as KEY=value lines on stdin — over the ssh channel, never on
# disk, never in argv (so not in the remote `ps`). compose interpolates them
# from this process's environment.
set -eu

dir=${1:?usage: deploy.sh <dir>}

# Read KEY=value lines from stdin into the environment. Values may contain '='
# (DATABASE_URL query strings) and spaces; only the first '=' splits.
while IFS= read -r line; do
  case "$line" in
    *=*) export "$line" ;;
  esac
done

# Fail early and clearly if the pipe delivered nothing (e.g. a broken ssh env).
: "${IMAGE:?deploy: IMAGE not provided over stdin}"
: "${DATABASE_URL:?deploy: DATABASE_URL not provided over stdin}"
: "${BETTER_AUTH_SECRET:?deploy: BETTER_AUTH_SECRET not provided over stdin}"
: "${OPENPANEL_ENC_KEY:?deploy: OPENPANEL_ENC_KEY not provided over stdin}"

cd "$dir"

# Reclaim disk. On a small-disk host, old open-panel:<ver> tags (~243MB each),
# stopped containers, dangling layers and build cache pile up until the disk
# fills and the next `pull` (or the scp before this ran) fails. Scoped by
# "${IMAGE%:*}" to the open-panel repo, so other apps' images are never touched.
# A tag still used by a running container can't be removed (rmi fails, ignored),
# so this is safe to run before the new image is up — it clears everything that
# ISN'T in use, then runs again after the swap to drop the old running image.
reclaim() {
  docker container prune -f >/dev/null 2>&1 || true
  docker image prune -f >/dev/null 2>&1 || true
  docker builder prune -f >/dev/null 2>&1 || true
  docker images "${IMAGE%:*}" --format '{{.Repository}}:{{.Tag}}' 2>/dev/null \
    | grep -vxF "$IMAGE" \
    | xargs -r docker rmi >/dev/null 2>&1 || true
}

# Free space BEFORE pulling — a full disk fails the pull before any post-deploy
# cleanup could run.
echo "==> reclaiming disk before pull"
reclaim
df -h "$dir" 2>/dev/null | tail -1 || true

echo "==> deploying $IMAGE"
docker compose pull
# Recreates `migrate` too (its image changed). `server` depends on it with
# service_completed_successfully, so a failed migration fails this command
# rather than starting the API against an unmigrated schema.
#
# On failure, dump the migrate log before exiting — otherwise CI only sees
# "service migrate didn't complete successfully" with no reason (a bad
# DATABASE_URL, a TLS/sslmode mismatch, an unreachable database).
if ! docker compose up -d --remove-orphans; then
  echo "==> deploy failed — migrate log:" >&2
  docker compose logs --no-color --tail 40 migrate >&2 || true
  exit 1
fi
docker compose ps

# `up -d` returning 0 only means the containers STARTED — a server that
# crash-loops or can't reach its DB still "succeeds". Wait for the server's
# healthcheck to report healthy (it pings /api/health → SELECT 1). If it never
# does, fail the deploy loudly with logs rather than reporting a green deploy of
# a down app. ~2 min budget covers a cold start + migrate-gated boot.
echo "==> waiting for server health"
cid=$(docker compose ps -q server)
healthy=0
if [ -n "$cid" ]; then
  i=0
  while [ "$i" -lt 40 ]; do
    status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$cid" 2>/dev/null || echo gone)
    case "$status" in
      healthy) healthy=1; break ;;
      none) healthy=1; break ;; # no healthcheck defined — don't block the deploy
      unhealthy | gone) break ;;
    esac
    i=$((i + 1))
    sleep 3
  done
fi
if [ "$healthy" != 1 ]; then
  echo "==> server did not become healthy — logs:" >&2
  docker compose logs --no-color --tail 50 server >&2 || true
  exit 1
fi
echo "==> server healthy"

# Now the old image is no longer in use (containers were recreated on $IMAGE),
# so this pass actually removes it — the pre-pull pass could not.
echo "==> reclaiming disk after deploy"
reclaim
