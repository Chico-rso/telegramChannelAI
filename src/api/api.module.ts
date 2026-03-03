import { Module } from '@nestjs/common';
import { GenerateController } from './controllers/generate.controller';
import { HealthController } from './controllers/health.controller';
import { DatabaseModule } from '../infra/database/database.module';
import { QueueModule } from '../infra/queue/queue.module';

@Module({
  imports: [DatabaseModule, QueueModule],
  controllers: [GenerateController, HealthController],
})
export class ApiModule {}
