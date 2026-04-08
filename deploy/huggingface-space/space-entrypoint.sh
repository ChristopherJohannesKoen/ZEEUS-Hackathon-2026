#!/usr/bin/env bash
set -euo pipefail

log() {
  printf '[hf-space] %s\n' "$*"
}

PERSIST_ROOT="/tmp/zeeus-space"
if mkdir -p /data/zeeus-space 2>/dev/null; then
  PERSIST_ROOT="/data/zeeus-space"
fi

RUNTIME_ROOT="/tmp/zeeus-space-runtime"
PG_ROOT="$RUNTIME_ROOT/postgres"
PGDATA="$PG_ROOT/data"
REDIS_ROOT="$RUNTIME_ROOT/redis"
ARTIFACTS_ROOT="${ARTIFACTS_DIR:-$PERSIST_ROOT/artifacts}"
SECRETS_ROOT="$PERSIST_ROOT/secrets"

mkdir -p "$RUNTIME_ROOT" "$PG_ROOT" "$REDIS_ROOT" "$ARTIFACTS_ROOT" "$SECRETS_ROOT"

ensure_hex_secret() {
  local target_file="$1"
  local bytes="$2"

  if [[ ! -s "$target_file" ]]; then
    openssl rand -hex "$bytes" >"$target_file"
    chmod 600 "$target_file"
  fi
}

ensure_hex_secret "$SECRETS_ROOT/session_cookie_encryption_key" 32
ensure_hex_secret "$SECRETS_ROOT/sso_state_encryption_key" 32
ensure_hex_secret "$SECRETS_ROOT/internal_service_token" 32

export SESSION_COOKIE_ENCRYPTION_KEY="${SESSION_COOKIE_ENCRYPTION_KEY:-$(cat "$SECRETS_ROOT/session_cookie_encryption_key")}"
export SSO_STATE_ENCRYPTION_KEY="${SSO_STATE_ENCRYPTION_KEY:-$(cat "$SECRETS_ROOT/sso_state_encryption_key")}"
export INTERNAL_SERVICE_TOKEN="${INTERNAL_SERVICE_TOKEN:-$(cat "$SECRETS_ROOT/internal_service_token")}"

export PORT="${PORT:-7860}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export NODE_ENV="${NODE_ENV:-production}"
export APP_ENV="${APP_ENV:-production}"
export API_ORIGIN="${API_ORIGIN:-http://127.0.0.1:4000}"
export WEB_INTERNAL_ORIGIN="${WEB_INTERNAL_ORIGIN:-http://127.0.0.1:${PORT}}"
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres@127.0.0.1:5432/zeeus_assessment?schema=public}"
export REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6379}"
export FEATURE_EMAIL="${FEATURE_EMAIL:-false}"
export FEATURE_STORAGE="${FEATURE_STORAGE:-false}"
export FEATURE_CACHE="${FEATURE_CACHE:-true}"
export FEATURE_OBSERVABILITY="${FEATURE_OBSERVABILITY:-false}"
export ARTIFACTS_DIR="$ARTIFACTS_ROOT"
export ENABLE_INTERNAL_SURFACES="${ENABLE_INTERNAL_SURFACES:-true}"
export ENTERPRISE_IDENTITY_ENABLED="${ENTERPRISE_IDENTITY_ENABLED:-false}"
export BREAK_GLASS_LOCAL_LOGIN_ENABLED="${BREAK_GLASS_LOCAL_LOGIN_ENABLED:-false}"
export SEED_OWNER_EMAIL="${SEED_OWNER_EMAIL:-owner@example.com}"
export SEED_OWNER_PASSWORD="${SEED_OWNER_PASSWORD:-ChangeMe123!}"

SPACE_ORIGIN="${NEXT_PUBLIC_SITE_ORIGIN:-}"
if [[ -z "$SPACE_ORIGIN" ]]; then
  if [[ -n "${SPACE_HOST:-}" ]]; then
    SPACE_ORIGIN="https://${SPACE_HOST}"
  else
    SPACE_ORIGIN="http://127.0.0.1:${PORT}"
  fi
fi

export APP_URL="${APP_URL:-$SPACE_ORIGIN}"
export NEXT_PUBLIC_SITE_ORIGIN="$APP_URL"

PG_BIN="$(dirname "$(find /usr/lib/postgresql -path '*/bin/initdb' | head -n 1)")"
if [[ -z "$PG_BIN" ]]; then
  log "PostgreSQL binaries were not found."
  exit 1
fi

mkdir -p "$PGDATA"
chown -R postgres:postgres "$PG_ROOT"

if [[ ! -s "$PGDATA/PG_VERSION" ]]; then
  log "Initializing PostgreSQL data directory in $PGDATA"
  runuser -u postgres -- "$PG_BIN/initdb" \
    -D "$PGDATA" \
    --auth-local=trust \
    --auth-host=trust \
    --username=postgres >/dev/null
fi

cleanup() {
  local exit_code=$?
  set +e

  if [[ -n "${WORKER_PID:-}" ]]; then
    kill "$WORKER_PID" 2>/dev/null || true
  fi

  if [[ -n "${WEB_PID:-}" ]]; then
    kill "$WEB_PID" 2>/dev/null || true
  fi

  if [[ -n "${API_PID:-}" ]]; then
    kill "$API_PID" 2>/dev/null || true
  fi

  if [[ -f "$REDIS_ROOT/redis.pid" ]]; then
    redis-cli -u "$REDIS_URL" shutdown nosave >/dev/null 2>&1 || true
  fi

  if [[ -s "$PGDATA/postmaster.pid" ]]; then
    runuser -u postgres -- "$PG_BIN/pg_ctl" -D "$PGDATA" -m fast stop >/dev/null 2>&1 || true
  fi

  exit "$exit_code"
}

trap cleanup EXIT INT TERM

log "Starting PostgreSQL"
runuser -u postgres -- "$PG_BIN/pg_ctl" \
  -D "$PGDATA" \
  -l "$PG_ROOT/server.log" \
  -o "-c listen_addresses=127.0.0.1 -p 5432" \
  -w start

runuser -u postgres -- "$PG_BIN/createdb" -h 127.0.0.1 -p 5432 zeeus_assessment >/dev/null 2>&1 || true

log "Starting Redis"
redis-server \
  --bind 127.0.0.1 \
  --port 6379 \
  --dir "$REDIS_ROOT" \
  --dbfilename dump.rdb \
  --save 60 1 \
  --appendonly no \
  --logfile "$REDIS_ROOT/redis.log" \
  --pidfile "$REDIS_ROOT/redis.pid" \
  --daemonize yes

until redis-cli -u "$REDIS_URL" ping >/dev/null 2>&1; do
  sleep 1
done

log "Applying migrations"
attempts=0
until npm run prisma:migrate:deploy --workspace=@packages/db; do
  attempts=$((attempts + 1))
  if [[ "$attempts" -ge 20 ]]; then
    log "Prisma migrations failed after $attempts attempts"
    exit 1
  fi
  sleep 2
done

log "Seeding demo data"
npm run seed --workspace=@packages/db

log "Starting API"
node apps/api/dist/main.js &
API_PID=$!

until curl -fsS http://127.0.0.1:4000/api/health >/dev/null 2>&1; do
  if ! kill -0 "$API_PID" 2>/dev/null; then
    log "API exited during startup"
    exit 1
  fi
  sleep 1
done

log "Starting web app"
npm run start --workspace=@apps/web -- -H 0.0.0.0 -p "$PORT" &
WEB_PID=$!

until curl -fsS "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; do
  if ! kill -0 "$WEB_PID" 2>/dev/null; then
    log "Web app exited during startup"
    exit 1
  fi
  sleep 1
done

log "Starting worker"
node apps/worker/dist/main.js &
WORKER_PID=$!

log "ZEEUS full-stack Space is ready"
wait -n "$API_PID" "$WEB_PID" "$WORKER_PID"
