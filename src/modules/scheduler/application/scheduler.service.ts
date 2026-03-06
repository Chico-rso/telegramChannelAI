import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import cron, { ScheduledTask } from 'node-cron';
import { GenerationQueueService } from '../../../infra/queue/generation-queue.service';

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private tasks: ScheduledTask[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly generationQueueService: GenerationQueueService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SchedulerService.name);
  }

  onModuleInit(): void {
    const timezone = this.configService.get<string>('DEFAULT_PROJECT_TIMEZONE', 'UTC');
    const schedules = [
      {
        expression: this.configService.get<string>('STANDARD_GENERATION_CRON', '0 10 * * *'),
        variant: 'single' as const,
        label: 'Standard scheduler registered',
      },
      {
        expression: this.configService.get<string>('LIST_GENERATION_CRON', '0 20 * * *'),
        variant: 'list' as const,
        label: 'List scheduler registered',
      },
    ];

    for (const schedule of schedules) {
      if (!cron.validate(schedule.expression)) {
        throw new Error(`Invalid cron expression: ${schedule.expression}`);
      }

      const task = cron.schedule(
        schedule.expression,
        async () => {
          const projectSlug = this.configService.getOrThrow<string>('DEFAULT_PROJECT_SLUG');

          try {
            this.logger.info({ projectSlug, variant: schedule.variant }, 'Scheduling generation job');
            await this.generationQueueService.enqueueGeneration({
              projectSlug,
              triggeredBy: 'cron',
              variant: schedule.variant,
            });
          } catch (error) {
            this.logger.error(
              {
                variant: schedule.variant,
                error: error instanceof Error ? error.message : 'Unknown error',
              },
              'Failed to enqueue scheduled generation job',
            );
          }
        },
        { timezone },
      );

      this.tasks.push(task);
      this.logger.info(
        { expression: schedule.expression, timezone, variant: schedule.variant },
        schedule.label,
      );
    }
  }

  onModuleDestroy(): void {
    for (const task of this.tasks) {
      task.stop();
    }
  }
}
