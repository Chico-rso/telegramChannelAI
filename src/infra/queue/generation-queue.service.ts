import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue } from 'bullmq';
import { GenerationJobPayload } from '../../core/domain/content.types';
import { buildRedisOptions } from './redis.config';
import { GENERATION_JOB, GENERATION_QUEUE } from './queue.constants';

@Injectable()
export class GenerationQueueService implements OnModuleDestroy {
  private readonly queue: Queue<GenerationJobPayload>;

  constructor(private readonly configService: ConfigService) {
    this.queue = new Queue<GenerationJobPayload>(
      this.configService.get<string>('QUEUE_NAME', GENERATION_QUEUE),
      {
        connection: buildRedisOptions(this.configService),
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 200,
          attempts: this.configService.get<number>('JOB_ATTEMPTS', 5),
          backoff: {
            type: 'exponential',
            delay: this.configService.get<number>('JOB_BACKOFF_MS', 15000),
          },
        },
      },
    );
  }

  enqueueGeneration(payload: GenerationJobPayload): Promise<Job<GenerationJobPayload>> {
    return this.queue.add(GENERATION_JOB, payload, {
      jobId: `${payload.projectSlug}:${payload.triggeredBy}:${payload.variant ?? 'auto'}:${Date.now()}`,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }
}
