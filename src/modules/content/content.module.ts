import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { PublishingModule } from '../publishing/publishing.module';
import { ContentOrchestrationService } from './application/content-orchestration.service';
import { ContentPersistenceService } from './application/content-persistence.service';
import { ContentPromptFactory } from './application/content-prompt.factory';
import { TopicSelectionService } from './application/topic-selection.service';
import { DatabaseModule } from '../../infra/database/database.module';
import { LlmModule } from '../../infra/llm/llm.module';

@Module({
  imports: [DatabaseModule, LlmModule, PublishingModule, AnalyticsModule],
  providers: [
    TopicSelectionService,
    ContentPromptFactory,
    ContentPersistenceService,
    ContentOrchestrationService,
  ],
  exports: [ContentOrchestrationService],
})
export class ContentModule {}
