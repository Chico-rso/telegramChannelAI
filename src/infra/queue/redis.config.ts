import { ConfigService } from '@nestjs/config';

export function buildRedisOptions(configService: ConfigService) {
  const redisUrl = configService.get<string>('REDIS_URL');
  if (redisUrl) {
    const parsedUrl = new URL(redisUrl);

    return {
      host: parsedUrl.hostname,
      port: parsedUrl.port ? Number(parsedUrl.port) : 6379,
      username: parsedUrl.username || undefined,
      password: parsedUrl.password || undefined,
      db: parsedUrl.pathname ? Number(parsedUrl.pathname.replace('/', '') || '0') : 0,
      tls: parsedUrl.protocol === 'rediss:' ? {} : undefined,
      maxRetriesPerRequest: null,
    };
  }

  return {
    host: configService.get<string>('REDIS_HOST', 'localhost'),
    port: configService.get<number>('REDIS_PORT', 6379),
    password: configService.get<string>('REDIS_PASSWORD') || undefined,
    db: configService.get<number>('REDIS_DB', 0),
    maxRetriesPerRequest: null,
  };
}
