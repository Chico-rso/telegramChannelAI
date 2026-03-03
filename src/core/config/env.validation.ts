type EnvShape = Record<string, string | number | undefined>;

function requireString(env: EnvShape, key: string): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is required.`);
  }

  return String(value);
}

function toNumber(env: EnvShape, key: string, fallback: number): number {
  const raw = env[key];
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number.`);
  }

  return parsed;
}

export function validateEnv(config: EnvShape): EnvShape {
  return {
    ...config,
    DATABASE_URL: requireString(config, 'DATABASE_URL'),
    OPENAI_API_KEY: requireString(config, 'OPENAI_API_KEY'),
    TELEGRAM_BOT_TOKEN: requireString(config, 'TELEGRAM_BOT_TOKEN'),
    TELEGRAM_CHANNEL_ID: requireString(config, 'TELEGRAM_CHANNEL_ID'),
    DEFAULT_USER_EMAIL: requireString(config, 'DEFAULT_USER_EMAIL'),
    DEFAULT_PROJECT_NAME: requireString(config, 'DEFAULT_PROJECT_NAME'),
    DEFAULT_PROJECT_SLUG: requireString(config, 'DEFAULT_PROJECT_SLUG'),
    HOST: String(config.HOST ?? '0.0.0.0'),
    PORT: toNumber(config, 'PORT', 3000),
    REDIS_URL: config.REDIS_URL ? String(config.REDIS_URL) : undefined,
    GENERATE_API_KEY: config.GENERATE_API_KEY ? String(config.GENERATE_API_KEY) : undefined,
    REDIS_PORT: toNumber(config, 'REDIS_PORT', 6379),
    REDIS_DB: toNumber(config, 'REDIS_DB', 0),
    JOB_ATTEMPTS: toNumber(config, 'JOB_ATTEMPTS', 5),
    JOB_BACKOFF_MS: toNumber(config, 'JOB_BACKOFF_MS', 15000),
  };
}
