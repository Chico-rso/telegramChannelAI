import { ConfigService } from '@nestjs/config';

export function buildRedisOptions(configService: ConfigService) {
  return {
    host: configService.get<string>('REDIS_HOST', 'localhost'),
    port: configService.get<number>('REDIS_PORT', 6379),
    password: configService.get<string>('REDIS_PASSWORD') || undefined,
    db: configService.get<number>('REDIS_DB', 0),
    maxRetriesPerRequest: null,
  };
}
