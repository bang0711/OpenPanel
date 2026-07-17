#!/bin/sh
# Remote half of the CD deploy. Piped to the target host over stdin by
# .github/workflows/release.yml:
#
#   ssh host 'sh -s' -- <image> <dir> < docker/deploy.sh
#
# Nothing is interpolated into a remote shell string — the arguments arrive as
# argv, the same rule the panel follows for the hosts it manages.
#
# The directory must already hold docker-compose.yml + .env from
# `open-panel install`. This script deploys; it does not bootstrap.
set -eu

image=${1:?usage: deploy.sh <image> <dir>}
dir=${2:?usage: deploy.sh <image> <dir>}

cd "$dir"

if [ ! -f .env ] || [ ! -f docker-compose.yml ]; then
  echo "error: $dir has no .env / docker-compose.yml." >&2
  echo "  run \`open-panel install\` there first:" >&2
  echo "  docker run --rm -v \"$dir:/output\" $image install" >&2
  exit 1
fi

# Pin the tag in .env rather than only exporting IMAGE for this one compose
# call: a later manual `docker compose up` on the host must keep the deployed
# version instead of silently reverting to whatever .env still said.
#
# Written *through* the existing file — never `mv` a temp over it — so the
# installer's chmod 600 survives. .env holds OPENPANEL_ENC_KEY.
tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
# `|| true`: grep exits 1 when it filters out every line, which set -e would
# treat as failure.
grep -v '^IMAGE=' .env > "$tmp" || true
printf 'IMAGE=%s\n' "$image" >> "$tmp"
cat "$tmp" > .env

echo "==> deploying $image"
docker compose pull
# Recreates `migrate` too (its image changed). `server` depends on it with
# service_completed_successfully, so a failed migration fails this command
# rather than starting the API against an unmigrated schema.
docker compose up -d --remove-orphans
docker compose ps

# The box this runs on is the panel's own host; untagged layers from previous
# deploys pile up otherwise. Dangling only — never touches tagged images.
docker image prune -f
