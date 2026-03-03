#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/telegramChannelAI}"
PM2_APP_NAME="${PM2_APP_NAME:-telegram-channel-ai}"
NODE_BINARY="${NODE_BINARY:-/root/.nvm/versions/node/v20.19.5/bin/node}"
NPM_BINARY="${NPM_BINARY:-/root/.nvm/versions/node/v20.19.5/bin/npm}"

if [ ! -x "$NODE_BINARY" ]; then
  echo "Node binary not found at $NODE_BINARY" >&2
  exit 1
fi

if [ ! -f "$APP_DIR/package.json" ]; then
  echo "package.json not found in $APP_DIR" >&2
  exit 1
fi

cd "$APP_DIR"

"$NODE_BINARY" -v
"$NPM_BINARY" -v

"$NPM_BINARY" exec prisma migrate deploy
PM2_APP_NAME="$PM2_APP_NAME" APP_DIR="$APP_DIR" NODE_BINARY="$NODE_BINARY" pm2 startOrRestart ecosystem.config.cjs
pm2 save
