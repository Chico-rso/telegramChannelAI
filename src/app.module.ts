import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiModule } from './api/api.module';
import { validateEnv } from './core/config/env.validation';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ContentModule } from './modules/content/content.module';
import { PublishingModule } from './modules/publishing/publishing.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { DatabaseModule } from './infra/database/database.module';
import { LlmModule } from './infra/llm/llm.module';
import { LoggerModule } from './infra/logger/logger.module';
import { QueueModule } from './infra/queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      validate: validateEnv,
    }),
    LoggerModule,
    DatabaseModule,
    QueueModule,
    LlmModule,
    ContentModule,
    PublishingModule,
    AnalyticsModule,
    SchedulerModule,
    ApiModule,
  ],
})
export class AppModule {}
