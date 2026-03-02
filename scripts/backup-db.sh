#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.prod.yml"

if [[ -f "${PROJECT_DIR}/.env" ]]; then
  set -a
  source "${PROJECT_DIR}/.env"
  set +a
fi

BACKUP_DATE=$(date -u +%Y-%m-%d)
BACKUP_NAME="ditto-${BACKUP_DATE}.dump"
S3_BUCKET="${AWS_S3_BUCKET}"
S3_PREFIX="db"
RETENTION_DAYS=7
TMP_DIR=$(mktemp -d)

ENDPOINT_FLAG=()
if [[ -n "${AWS_ENDPOINT:-}" ]]; then
  ENDPOINT_FLAG=(--endpoint-url "${AWS_ENDPOINT}")
fi

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"; }
cleanup() { rm -rf "${TMP_DIR}"; }
trap cleanup EXIT

log "Starting database backup: ${BACKUP_NAME}"

docker compose -f "${COMPOSE_FILE}" exec -T db \
  pg_dump --format=custom --compress=9 -U "${DB_USER}" "${DB_NAME}" \
  > "${TMP_DIR}/${BACKUP_NAME}"

log "Backup created: $(du -h "${TMP_DIR}/${BACKUP_NAME}" | cut -f1)"

log "Uploading to s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_NAME}"
docker run --rm \
  -e AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
  -e AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
  -e AWS_DEFAULT_REGION="${AWS_REGION:-us-east-1}" \
  -v "${TMP_DIR}/${BACKUP_NAME}:/backup/${BACKUP_NAME}:ro" \
  amazon/aws-cli \
  s3 cp "/backup/${BACKUP_NAME}" \
  "s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_NAME}" \
  "${ENDPOINT_FLAG[@]}"

log "Upload complete"

# 7-day retention: delete old backups (best-effort)
CUTOFF_DATE=$(date -u -d "${RETENTION_DAYS} days ago" +%Y-%m-%d)
log "Cleaning up backups older than ${CUTOFF_DATE}"

ENDPOINT_ARG=""
if [[ -n "${AWS_ENDPOINT:-}" ]]; then
  ENDPOINT_ARG="--endpoint-url '${AWS_ENDPOINT}'"
fi

docker run --rm \
  -e AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
  -e AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
  -e AWS_DEFAULT_REGION="${AWS_REGION:-us-east-1}" \
  --entrypoint sh \
  amazon/aws-cli \
  -c "
    aws s3 ls 's3://${S3_BUCKET}/${S3_PREFIX}/' ${ENDPOINT_ARG} | while read -r line; do
      filename=\$(echo \"\$line\" | awk '{print \$NF}')
      file_date=\$(echo \"\$filename\" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}' || true)
      if [ -n \"\$file_date\" ] && [ \"\$file_date\" \< '${CUTOFF_DATE}' ]; then
        echo \"Deleting old backup: \$filename\"
        aws s3 rm \"s3://${S3_BUCKET}/${S3_PREFIX}/\$filename\" ${ENDPOINT_ARG}
      fi
    done
  " || log "WARNING: Cleanup of old backups failed (backup was uploaded successfully)"

log "Backup complete"
