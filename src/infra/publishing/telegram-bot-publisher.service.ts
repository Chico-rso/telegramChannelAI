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
    chat?: {
      username?: string;
    };
    sender_chat?: {
      username?: string;
    };
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

        try {
          await this.attachShareButtonIfPossible(input.channelId, payload.result);
        } catch (error) {
          this.logger.warn(
            {
              error: error instanceof Error ? error.message : 'Unknown error',
              channelId: input.channelId,
              messageId: payload.result.message_id,
            },
            'Telegram post was published, but share button was not attached',
          );
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

  private async attachShareButtonIfPossible(
    channelId: string,
    result: NonNullable<TelegramResponse['result']>,
  ): Promise<void> {
    const publicUsername = this.resolvePublicUsername(channelId, result);
    if (!publicUsername) {
      return;
    }

    const messageUrl = `https://t.me/${publicUsername}/${result.message_id}`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(messageUrl)}&text=${encodeURIComponent('Если было полезно — перешлите другу 👍')}`;

    const response = await fetch(
      `https://api.telegram.org/bot${this.botToken}/editMessageReplyMarkup`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: channelId,
          message_id: result.message_id,
          reply_markup: {
            inline_keyboard: [[{ text: 'Переслать другу ↗', url: shareUrl }]],
          },
        }),
      },
    );

    const payload = (await response.json()) as TelegramResponse;
    if (!response.ok || !payload.ok) {
      throw new Error(payload.description ?? 'Telegram editMessageReplyMarkup request failed');
    }
  }

  private resolvePublicUsername(
    channelId: string,
    result: NonNullable<TelegramResponse['result']>,
  ): string | null {
    if (channelId.startsWith('@')) {
      return channelId.slice(1);
    }

    return result.chat?.username ?? result.sender_chat?.username ?? null;
  }
}
