#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/telegramChannelAI}"
PM2_APP_NAME="${PM2_APP_NAME:-telegram-channel-ai}"
NODE_BINARY="${NODE_BINARY:-/root/.nvm/versions/node/v20.19.5/bin/node}"
NPM_CLI="${NPM_CLI:-/root/.nvm/versions/node/v20.19.5/lib/node_modules/npm/bin/npm-cli.js}"

if [ ! -x "$NODE_BINARY" ]; then
  echo "Node binary not found at $NODE_BINARY" >&2
  exit 1
fi

if [ ! -f "$NPM_CLI" ]; then
  echo "npm cli not found at $NPM_CLI" >&2
  exit 1
fi

if [ ! -f "$APP_DIR/package.json" ]; then
  echo "package.json not found in $APP_DIR" >&2
  exit 1
fi

cd "$APP_DIR"

export PATH="$(dirname "$NODE_BINARY"):$PATH"

"$NODE_BINARY" -v
"$NODE_BINARY" "$NPM_CLI" -v

rm -rf node_modules
"$NODE_BINARY" "$NPM_CLI" ci --omit=dev
"$NODE_BINARY" "$NPM_CLI" exec prisma generate
"$NODE_BINARY" "$NPM_CLI" exec prisma migrate deploy
PM2_APP_NAME="$PM2_APP_NAME" APP_DIR="$APP_DIR" NODE_BINARY="$NODE_BINARY" pm2 startOrRestart ecosystem.config.cjs
pm2 save
