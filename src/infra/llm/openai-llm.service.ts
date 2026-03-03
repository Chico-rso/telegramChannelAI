import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import OpenAI from 'openai';
import {
  GeneratePostInput,
  LlmContentGeneratorPort,
} from '../../core/contracts/llm-content-generator.port';
import { StructuredTelegramPost } from '../../core/domain/content.types';
import { withRetry } from '../../core/utils/retry.util';

type OpenAiJsonResponse = {
  topic: string;
  title: string;
  explanation: string;
  copyBlock: string;
  exampleResult: string;
  cta: string;
};

@Injectable()
export class OpenAiLlmService implements LlmContentGeneratorPort {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OpenAiLlmService.name);
    this.client = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('OPENAI_API_KEY'),
    });
    this.model = this.configService.get<string>('OPENAI_MODEL', 'gpt-4.1-mini');
  }

  async generateStructuredPost(input: GeneratePostInput): Promise<StructuredTelegramPost> {
    return withRetry(
      async () => {
        const completion = await this.client.chat.completions.create({
          model: this.model,
          temperature: 0.8,
          messages: [
            {
              role: 'system',
              content: input.systemPrompt,
            },
            {
              role: 'user',
              content: input.userPrompt,
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'telegram_ai_post',
              strict: true,
              schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  topic: { type: 'string' },
                  title: { type: 'string' },
                  explanation: { type: 'string' },
                  copyBlock: { type: 'string' },
                  exampleResult: { type: 'string' },
                  cta: { type: 'string' },
                },
                required: ['topic', 'title', 'explanation', 'copyBlock', 'exampleResult', 'cta'],
              },
            },
          } as never,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error('OpenAI returned an empty response.');
        }

        const parsed = JSON.parse(content) as OpenAiJsonResponse;
        return {
          topic: parsed.topic,
          title: parsed.title,
          explanation: parsed.explanation,
          copyBlock: parsed.copyBlock,
          exampleResult: parsed.exampleResult,
          cta: parsed.cta,
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
            'Retrying LLM generation',
          );
        },
      },
    );
  }
}
