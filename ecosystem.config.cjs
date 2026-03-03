const nodeInterpreter = process.env.NODE_BINARY || '/root/.nvm/versions/node/v20.19.5/bin/node';

module.exports = {
  apps: [
    {
      name: process.env.PM2_APP_NAME || 'telegram-channel-ai',
      script: 'dist/main.js',
      cwd: process.env.APP_DIR || '/var/www/telegramChannelAI',
      interpreter: nodeInterpreter,
      time: true,
      autorestart: true,
      max_restarts: 10,
      exp_backoff_restart_delay: 200,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
