import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import {
  ContentPublisherPort,
  PublishPostInput,
  PublishPostResult,
} from '../../core/contracts/content-publisher.port';
import { withRetry } from '../../core/utils/retry.util';

type TelegramResponse = {
  ok: boolean;
  result?: {
    message_id: number;
  };
  description?: string;
};

@Injectable()
export class TelegramBotPublisherService implements ContentPublisherPort {
  private readonly botToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TelegramBotPublisherService.name);
    this.botToken = this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
  }

  async publish(input: PublishPostInput): Promise<PublishPostResult> {
    return withRetry(
      async () => {
        const response = await fetch(
          `https://api.telegram.org/bot${this.botToken}/sendMessage`,
          {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: input.channelId,
              text: input.message,
              parse_mode: 'HTML',
              disable_web_page_preview: true,
            }),
          },
        );

        const payload = (await response.json()) as TelegramResponse;
        if (!response.ok || !payload.ok || !payload.result?.message_id) {
          throw new Error(payload.description ?? 'Telegram sendMessage request failed');
        }

        return {
          provider: 'telegram',
          externalMessageId: String(payload.result.message_id),
          rawResponse: payload,
        };
      },
      {
        attempts: this.configService.get<number>('JOB_ATTEMPTS', 5),
        delayMs: this.configService.get<number>('JOB_BACKOFF_MS', 15000),
        onRetry: (error, attempt) => {
          this.logger.warn(
            {
              attempt,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            'Retrying Telegram publish',
          );
        },
      },
    );
  }
}
