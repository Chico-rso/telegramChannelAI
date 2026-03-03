import { Module } from '@nestjs/common';
import { GenerateController } from './controllers/generate.controller';
import { GenerateApiKeyGuard } from './guards/generate-api-key.guard';
import { HealthController } from './controllers/health.controller';
import { DatabaseModule } from '../infra/database/database.module';
import { QueueModule } from '../infra/queue/queue.module';

@Module({
  imports: [DatabaseModule, QueueModule],
  controllers: [GenerateController, HealthController],
  providers: [GenerateApiKeyGuard],
})
export class ApiModule {}
