import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import cron, { ScheduledTask } from 'node-cron';
import { GenerationQueueService } from '../../../infra/queue/generation-queue.service';

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private task?: ScheduledTask;

  constructor(
    private readonly configService: ConfigService,
    private readonly generationQueueService: GenerationQueueService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SchedulerService.name);
  }

  onModuleInit(): void {
    const expression = this.configService.get<string>('DAILY_GENERATION_CRON', '0 9 * * *');
    const timezone = this.configService.get<string>('DEFAULT_PROJECT_TIMEZONE', 'UTC');
    if (!cron.validate(expression)) {
      throw new Error(`Invalid DAILY_GENERATION_CRON expression: ${expression}`);
    }

    this.task = cron.schedule(
      expression,
      async () => {
        const projectSlug = this.configService.getOrThrow<string>('DEFAULT_PROJECT_SLUG');

        try {
          this.logger.info({ projectSlug }, 'Scheduling daily generation job');
          await this.generationQueueService.enqueueGeneration({
            projectSlug,
            triggeredBy: 'cron',
          });
        } catch (error) {
          this.logger.error(
            {
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            'Failed to enqueue daily generation job',
          );
        }
      },
      { timezone },
    );

    this.logger.info({ expression, timezone }, 'Daily scheduler registered');
  }

  onModuleDestroy(): void {
    this.task?.stop();
  }
}
