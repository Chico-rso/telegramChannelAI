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
  private readonly provider: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OpenAiLlmService.name);
    this.provider = this.configService.get<string>('LLM_PROVIDER', 'openai-compatible');
    this.client = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('LLM_API_KEY'),
      baseURL: this.configService.get<string>('LLM_BASE_URL') || undefined,
    });
    this.model = this.configService.get<string>('LLM_MODEL', 'gpt-4.1-mini');
  }

  async generateStructuredPost(input: GeneratePostInput): Promise<StructuredTelegramPost> {
    return withRetry(
      async () => {
        const completionRequest: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
          model: this.model,
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
          response_format: this.getResponseFormat(),
        };

        if (!this.isGpt5FamilyModel(this.model)) {
          completionRequest.temperature = 0.8;
        }

        const completion = await this.client.chat.completions.create(completionRequest);

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
              provider: this.provider,
              model: this.model,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            'Retrying LLM generation',
          );
        },
      },
    );
  }

  private isGpt5FamilyModel(model: string): boolean {
    return /^gpt-5([.-]|$)/i.test(model);
  }

  private isGlmFamilyModel(model: string): boolean {
    return /^glm([.-]|$)/i.test(model);
  }

  private getResponseFormat(): OpenAI.Chat.Completions.ChatCompletionCreateParams['response_format'] {
    if (this.isGlmFamilyModel(this.model)) {
      return { type: 'json_object' } as never;
    }

    return {
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
    } as never;
  }
}
