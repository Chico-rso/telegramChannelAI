import { Global, Module } from '@nestjs/common';
import { ContentModule } from '../../modules/content/content.module';
import { ContentGenerationWorker } from './content-generation.worker';
import { GenerationQueueService } from './generation-queue.service';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ContentModule],
  providers: [RedisService, GenerationQueueService, ContentGenerationWorker],
  exports: [RedisService, GenerationQueueService],
})
export class QueueModule {}
