import { Module } from '@nestjs/common';
import { LLM_CONTENT_GENERATOR } from '../../core/contracts/injection-tokens';
import { OpenAiLlmService } from './openai-llm.service';

@Module({
  providers: [
    OpenAiLlmService,
    {
      provide: LLM_CONTENT_GENERATOR,
      useExisting: OpenAiLlmService,
    },
  ],
  exports: [LLM_CONTENT_GENERATOR],
})
export class LlmModule {}
