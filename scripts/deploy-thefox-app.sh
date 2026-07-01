#!/usr/bin/env bash
set -Eeuo pipefail

SSH_TARGET="${SSH_TARGET:-root@187.77.158.181}"
REMOTE_HOST_LABEL="${REMOTE_HOST_LABEL:-srv1771159.hstgr.cloud}"
REPO_URL="${REPO_URL:-https://github.com/ultramanx88/thefox.git}"
BRANCH="${BRANCH:-main}"
DEPLOY_SOURCE="${DEPLOY_SOURCE:-local}"
REMOTE_ROOT="${REMOTE_ROOT:-/opt/thefox}"
REMOTE_APP_DIR="${REMOTE_APP_DIR:-${REMOTE_ROOT}/app}"
REMOTE_ENV_FILE="${REMOTE_ENV_FILE:-${REMOTE_ROOT}/.env.thefox.app}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.kvm-shared.yml}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-thefox-app}"
WEB_PORT="${THEFOX_WEB_PORT:-3120}"
API_PORT="${THEFOX_API_PORT:-4120}"
WEB_ORIGIN="${WEB_ORIGIN:-https://thefox.app,https://www.thefox.app}"
NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://api.thefox.app}"

log() {
  printf '[deploy:thefox] %s\n' "$*"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "Missing required local command: $1"
    exit 1
  fi
}

require_command ssh
require_command tar

log "Deploying theFOX to ${REMOTE_HOST_LABEL} via ${SSH_TARGET}"
log "Remote app path: ${REMOTE_APP_DIR}"
log "Public domains: thefox.app, www.thefox.app, api.thefox.app"
log "Local VPS ports: web=${WEB_PORT}, api=${API_PORT}"
log "Deploy source: ${DEPLOY_SOURCE}"

if [[ "${DEPLOY_SOURCE}" == "local" ]]; then
  log "Syncing local checkout to ${REMOTE_APP_DIR}."
  COPYFILE_DISABLE=1 tar \
    --exclude='./.git' \
    --exclude='./node_modules' \
    --exclude='./apps/web/.next' \
    --exclude='./apps/mobile/.expo' \
    --exclude='./apps/mobile/ios' \
    --exclude='./apps/mobile/android' \
    --exclude='./dist' \
    --exclude='./build' \
    --exclude='./coverage' \
    --exclude='./.env' \
    --exclude='./.env.local' \
    --exclude='./*.log' \
    -cf - . | ssh "${SSH_TARGET}" "mkdir -p '${REMOTE_APP_DIR}' && LC_ALL=C tar -xf - -C '${REMOTE_APP_DIR}'"
elif [[ "${DEPLOY_SOURCE}" != "git" ]]; then
  log "DEPLOY_SOURCE must be either 'local' or 'git'."
  exit 1
fi

ssh "${SSH_TARGET}" \
  "DEPLOY_SOURCE='${DEPLOY_SOURCE}' REMOTE_ROOT='${REMOTE_ROOT}' REMOTE_APP_DIR='${REMOTE_APP_DIR}' REMOTE_ENV_FILE='${REMOTE_ENV_FILE}' REPO_URL='${REPO_URL}' BRANCH='${BRANCH}' COMPOSE_FILE='${COMPOSE_FILE}' COMPOSE_PROJECT_NAME='${COMPOSE_PROJECT_NAME}' THEFOX_WEB_PORT='${WEB_PORT}' THEFOX_API_PORT='${API_PORT}' WEB_ORIGIN='${WEB_ORIGIN}' NEXT_PUBLIC_API_URL='${NEXT_PUBLIC_API_URL}' bash -s" <<'REMOTE_SCRIPT'
set -Eeuo pipefail

log() {
  printf '[deploy:thefox:remote] %s\n' "$*"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "Missing required server command: $1"
    exit 1
  fi
}

compose() {
  docker compose \
    --project-name "${COMPOSE_PROJECT_NAME}" \
    --env-file "${REMOTE_ENV_FILE}" \
    -f "${COMPOSE_FILE}" \
    "$@"
}

require_command docker
require_command curl

if ! docker compose version >/dev/null 2>&1; then
  log "Docker Compose plugin is not available."
  exit 1
fi

mkdir -p "${REMOTE_ROOT}" "${REMOTE_APP_DIR}"

if [[ "${DEPLOY_SOURCE}" == "git" ]]; then
  require_command git
  if [[ -d "${REMOTE_APP_DIR}/.git" ]]; then
    log "Updating existing checkout."
    cd "${REMOTE_APP_DIR}"
    if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
      log "Tracked files are modified on the server. Resolve them before deploy."
      git status --short --untracked-files=no
      exit 1
    fi
    git fetch origin "${BRANCH}"
    git checkout "${BRANCH}"
    git merge --ff-only "origin/${BRANCH}"
  else
    log "Cloning repository."
    git clone --branch "${BRANCH}" "${REPO_URL}" "${REMOTE_APP_DIR}"
    cd "${REMOTE_APP_DIR}"
  fi
else
  log "Using synced local checkout."
  cd "${REMOTE_APP_DIR}"
fi

if [[ ! -f "${REMOTE_ENV_FILE}" ]]; then
  log "Creating ${REMOTE_ENV_FILE} with a generated database password."
  if command -v openssl >/dev/null 2>&1; then
    db_password="$(openssl rand -hex 32 | tr -d '\n')"
  else
    db_password="$(date +%s%N)-change-this-password"
  fi
  umask 077
  cat >"${REMOTE_ENV_FILE}" <<ENV_FILE
COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME}

THEFOX_POSTGRES_DB=thefox_app
THEFOX_POSTGRES_USER=thefox
THEFOX_POSTGRES_PASSWORD=${db_password}

THEFOX_WEB_BIND=127.0.0.1
THEFOX_WEB_PORT=${THEFOX_WEB_PORT}
THEFOX_API_BIND=127.0.0.1
THEFOX_API_PORT=${THEFOX_API_PORT}

WEB_ORIGIN=${WEB_ORIGIN}
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
LOG_LEVEL=info
ENV_FILE
else
  log "Using existing ${REMOTE_ENV_FILE}."
fi

set -a
# shellcheck disable=SC1090
. "${REMOTE_ENV_FILE}"
set +a

if [[ ! "${THEFOX_POSTGRES_PASSWORD}" =~ ^[A-Za-z0-9._~-]+$ ]]; then
  log "Existing database password is not URL-safe. Rotating it to a URL-safe value."
  if command -v openssl >/dev/null 2>&1; then
    new_db_password="$(openssl rand -hex 32 | tr -d '\n')"
  else
    new_db_password="$(date +%s%N)$(date +%s)"
  fi

  postgres_container="${COMPOSE_PROJECT_NAME}-postgres-1"
  if docker ps --format '{{.Names}}' | grep -Fx "${postgres_container}" >/dev/null 2>&1; then
    docker exec "${postgres_container}" \
      psql -U "${THEFOX_POSTGRES_USER}" -d "${THEFOX_POSTGRES_DB}" -v ON_ERROR_STOP=1 \
      -c "ALTER USER \"${THEFOX_POSTGRES_USER}\" WITH PASSWORD '${new_db_password}';" >/dev/null
  fi

  tmp_env="${REMOTE_ENV_FILE}.tmp"
  awk -v password="${new_db_password}" '
    BEGIN { replaced = 0 }
    /^THEFOX_POSTGRES_PASSWORD=/ {
      print "THEFOX_POSTGRES_PASSWORD=" password
      replaced = 1
      next
    }
    { print }
    END {
      if (!replaced) {
        print "THEFOX_POSTGRES_PASSWORD=" password
      }
    }
  ' "${REMOTE_ENV_FILE}" >"${tmp_env}"
  chmod 600 "${tmp_env}"
  mv "${tmp_env}" "${REMOTE_ENV_FILE}"

  set -a
  # shellcheck disable=SC1090
  . "${REMOTE_ENV_FILE}"
  set +a
fi

for port in "${THEFOX_WEB_PORT}" "${THEFOX_API_PORT}"; do
  if ss -ltn "( sport = :${port} )" | tail -n +2 | grep -q .; then
    if ! docker ps --format '{{.Names}} {{.Ports}}' | grep -E "${COMPOSE_PROJECT_NAME}.*127.0.0.1:${port}->" >/dev/null 2>&1; then
      log "Port ${port} is already in use by another process/container."
      ss -ltnp "( sport = :${port} )" || true
      exit 1
    fi
  fi
done

log "Building and starting Docker stack."
compose up -d --build

log "Running Prisma migrations."
compose run --rm api npm run db:migrate --workspace @thefox/api

log "Checking services."
compose ps
curl -fsS "http://127.0.0.1:${THEFOX_API_PORT}/health" >/dev/null
curl -fsSI "http://127.0.0.1:${THEFOX_WEB_PORT}" >/dev/null

log "Deploy complete."
log "Remember to route thefox.app/www.thefox.app -> 127.0.0.1:${THEFOX_WEB_PORT}"
log "Remember to route api.thefox.app -> 127.0.0.1:${THEFOX_API_PORT}"
REMOTE_SCRIPT
