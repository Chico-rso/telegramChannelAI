#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/telegram-channel-ai}"
DB_NAME="${DB_NAME:-telegram_ai}"
DB_USER="${DB_USER:-postgres}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
APP_ENV_FILE="${APP_ENV_FILE:-/var/www/telegramChannelAI/.env}"
DATABASE_URL_FROM_ENV=""

if [ -f "$APP_ENV_FILE" ]; then
  DATABASE_URL_FROM_ENV="$(awk -F= '/^DATABASE_URL=/{sub(/^[^=]*=/, "", $0); print $0; exit}' "$APP_ENV_FILE")"
fi

DATABASE_URL_FOR_DUMP="${DATABASE_URL_FROM_ENV%%\?*}"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

if [ -n "$DATABASE_URL_FOR_DUMP" ]; then
  pg_dump "$DATABASE_URL_FOR_DUMP" | gzip > "$BACKUP_DIR/postgres-${DB_NAME}-${TIMESTAMP}.sql.gz"
else
  pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_DIR/postgres-${DB_NAME}-${TIMESTAMP}.sql.gz"
fi

if [ -f "/var/www/telegramChannelAI/.env" ]; then
  install -m 600 /var/www/telegramChannelAI/.env "$BACKUP_DIR/env-${TIMESTAMP}.backup"
fi

find "$BACKUP_DIR" -type f -name '*.sql.gz' -mtime +14 -delete
find "$BACKUP_DIR" -type f -name 'env-*.backup' -mtime +14 -delete
