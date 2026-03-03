import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';
import { PinoLogger } from 'nestjs-pino';
import { GenerationJobPayload } from '../../core/domain/content.types';
import { ContentOrchestrationService } from '../../modules/content/application/content-orchestration.service';
import { buildRedisOptions } from './redis.config';
import { GENERATION_JOB, GENERATION_QUEUE } from './queue.constants';

@Injectable()
export class ContentGenerationWorker implements OnModuleInit, OnModuleDestroy {
  private worker?: Worker<GenerationJobPayload>;

  constructor(
    private readonly configService: ConfigService,
    private readonly contentOrchestrationService: ContentOrchestrationService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ContentGenerationWorker.name);
  }

  onModuleInit(): void {
    this.worker = new Worker<GenerationJobPayload>(
      this.configService.get<string>('QUEUE_NAME', GENERATION_QUEUE),
      async (job: Job<GenerationJobPayload>) => {
        this.logger.info({ jobId: job.id, payload: job.data }, 'Started generation job');
        const result = await this.contentOrchestrationService.handleGeneration(job.data);
        this.logger.info({ jobId: job.id, result }, 'Finished generation job');
        return result;
      },
      {
        connection: buildRedisOptions(this.configService),
        concurrency: 2,
      },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error(
        {
          jobId: job?.id,
          payload: job?.data,
          error: error.message,
        },
        'Generation job failed',
      );
    });

    this.worker.on('completed', (job) => {
      this.logger.info({ jobId: job.id }, 'Generation job completed');
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
