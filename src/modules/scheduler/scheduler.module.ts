import { Module } from '@nestjs/common';
import { SchedulerService } from './application/scheduler.service';
import { QueueModule } from '../../infra/queue/queue.module';

@Module({
  imports: [QueueModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
