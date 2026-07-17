#!/bin/sh
# Remote half of the CD deploy. Piped to the target host over stdin by
# .github/workflows/release.yml:
#
#   ssh host 'sh -s' -- <image> <dir> [database-url] < docker/deploy.sh
#
# Nothing is interpolated into a remote shell string — the arguments arrive as
# argv, the same rule the panel follows for the hosts it manages.
#
# The directory must already hold docker-compose.yml + .env from
# `open-panel install`. This script deploys; it does not bootstrap.
set -eu

image=${1:?usage: deploy.sh <image> <dir> [database-url]}
dir=${2:?usage: deploy.sh <image> <dir> [database-url]}
# Optional: when CI holds the connection string for a managed database, it wins
# over whatever .env says. Empty/absent leaves .env untouched, which is what a
# bundled-Postgres install wants — its DATABASE_URL is generated on the host and
# must keep matching POSTGRES_PASSWORD there.
database_url=${3:-}

cd "$dir"

if [ ! -f .env ] || [ ! -f docker-compose.yml ]; then
  echo "error: $dir has no .env / docker-compose.yml." >&2
  echo "  run \`open-panel install\` there first:" >&2
  echo "  docker run --rm -v \"$dir:/output\" $image install" >&2
  exit 1
fi

# Replace a KEY=value line in .env.
#
# Written *through* the existing file — never `mv` a temp over it — so the
# installer's chmod 600 survives. .env holds OPENPANEL_ENC_KEY, which decrypts
# every stored SSH credential; a mode of 644 on it is a real incident.
set_env() {
  key=$1
  value=$2
  tmp=$(mktemp)
  # `|| true`: grep exits 1 when it filters out every line, which set -e would
  # treat as failure.
  grep -v "^$key=" .env > "$tmp" || true
  printf '%s=%s\n' "$key" "$value" >> "$tmp"
  cat "$tmp" > .env
  rm -f "$tmp"
}

# Pin the tag in .env rather than only exporting IMAGE for this one compose
# call: a later manual `docker compose up` on the host must keep the deployed
# version instead of silently reverting to whatever .env still said.
set_env IMAGE "$image"

if [ -n "$database_url" ]; then
  set_env DATABASE_URL "$database_url"
  echo "==> DATABASE_URL updated from CI"
fi

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
