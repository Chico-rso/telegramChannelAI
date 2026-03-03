import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';
import { RedisService } from '../../infra/queue/redis.service';

@Controller()
export class HealthController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  @Get('health')
  async health(): Promise<{
    status: 'ok' | 'degraded';
    checks: Record<string, boolean>;
    timestamp: string;
  }> {
    const database = await this.prismaService.isHealthy();
    const redis = await this.redisService.isHealthy();

    return {
      status: database && redis ? 'ok' : 'degraded',
      checks: {
        database,
        redis,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
