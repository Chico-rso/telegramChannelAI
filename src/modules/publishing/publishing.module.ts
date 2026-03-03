import { Module } from '@nestjs/common';
import { CONTENT_PUBLISHER } from '../../core/contracts/injection-tokens';
import { PublishingFormatterService } from './application/publishing-formatter.service';
import { TelegramBotPublisherService } from '../../infra/publishing/telegram-bot-publisher.service';

@Module({
  providers: [
    PublishingFormatterService,
    TelegramBotPublisherService,
    {
      provide: CONTENT_PUBLISHER,
      useExisting: TelegramBotPublisherService,
    },
  ],
  exports: [PublishingFormatterService, CONTENT_PUBLISHER],
})
export class PublishingModule {}
