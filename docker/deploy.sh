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

# This host is the panel's own box; untagged layers from previous deploys pile
# up otherwise. Dangling only — never touches tagged images.
docker image prune -f
