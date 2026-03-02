#!/usr/bin/env bash
set -euo pipefail

# Restore Procedure:
#   1. Downloads specified backup (or latest) from S3-compatible storage
#   2. Stops the backend to prevent connections during restore
#   3. Restores the database using pg_restore --clean --if-exists
#   4. Restarts the backend
#
# Usage:
#   ./restore-db.sh              # Restore from latest backup
#   ./restore-db.sh 2026-02-22   # Restore from specific date

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.prod.yml"

if [[ -f "${PROJECT_DIR}/.env" ]]; then
  set -a
  source "${PROJECT_DIR}/.env"
  set +a
fi

S3_BUCKET="${AWS_S3_BUCKET}"
S3_PREFIX="db"
TMP_DIR=$(mktemp -d)
RESTORE_DATE="${1:-}"

ENDPOINT_FLAG=()
if [[ -n "${AWS_ENDPOINT:-}" ]]; then
  ENDPOINT_FLAG=(--endpoint-url "${AWS_ENDPOINT}")
fi

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"; }
cleanup() { rm -rf "${TMP_DIR}"; }
trap cleanup EXIT

if [[ -n "${RESTORE_DATE}" ]]; then
  BACKUP_NAME="ditto-${RESTORE_DATE}.dump"
  log "Restoring from specified backup: ${BACKUP_NAME}"
else
  log "Finding latest backup..."
  BACKUP_NAME=$(docker run --rm \
    -e AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
    -e AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
    -e AWS_DEFAULT_REGION="${AWS_REGION:-us-east-1}" \
    amazon/aws-cli \
    s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" \
    "${ENDPOINT_FLAG[@]}" \
    | awk '{print $NF}' | sort | tail -1)

  if [[ -z "${BACKUP_NAME}" ]]; then
    log "ERROR: No backups found in s3://${S3_BUCKET}/${S3_PREFIX}/"
    exit 1
  fi
  log "Latest backup: ${BACKUP_NAME}"
fi

log "WARNING: This will overwrite the current database with backup ${BACKUP_NAME}"
echo "Press Enter to continue or Ctrl+C to abort..."
read -r

log "Downloading s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_NAME}"
docker run --rm \
  -e AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
  -e AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
  -e AWS_DEFAULT_REGION="${AWS_REGION:-us-east-1}" \
  -v "${TMP_DIR}:/backup" \
  amazon/aws-cli \
  s3 cp "s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_NAME}" "/backup/${BACKUP_NAME}" \
  "${ENDPOINT_FLAG[@]}"

log "Download complete: $(du -h "${TMP_DIR}/${BACKUP_NAME}" | cut -f1)"

log "Stopping backend..."
docker compose -f "${COMPOSE_FILE}" stop backend

log "Restoring database..."
docker compose -f "${COMPOSE_FILE}" exec -T db \
  pg_restore --clean --if-exists -U "${DB_USER}" -d "${DB_NAME}" \
  < "${TMP_DIR}/${BACKUP_NAME}"

log "Restarting backend..."
docker compose -f "${COMPOSE_FILE}" start backend

log "Restore complete — verify by browsing the application"
