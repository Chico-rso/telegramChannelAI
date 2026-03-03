import { Injectable } from '@nestjs/common';
import { GeneratePostInput } from '../../../core/contracts/llm-content-generator.port';

@Injectable()
export class ContentPromptFactory {
  build(input: {
    projectName: string;
    targetAudience: string;
    tone: string;
    language: string;
    topic: string;
  }): GeneratePostInput {
    return {
      systemPrompt: [
        'You create Telegram posts in Russian for the project "ИИ без сложных слов".',
        'Audience: ordinary people using AI at work and at home.',
        'Write clearly, practically, and without jargon.',
        'Each post must be useful immediately and feel safe for non-technical readers.',
        'Return JSON only.',
      ].join(' '),
      userPrompt: [
        `Project: ${input.projectName}.`,
        `Audience: ${input.targetAudience}.`,
        `Tone: ${input.tone}.`,
        `Language: ${input.language}.`,
        `Topic: ${input.topic}.`,
        'Create a short Telegram post with these sections:',
        '1. title: a concrete pain/problem headline.',
        '2. explanation: 2-3 short sentences.',
        '3. copyBlock: a prompt that readers can copy and paste directly.',
        '4. exampleResult: a realistic result example.',
        '5. cta: a short next-step call to action.',
        'Keep it practical, simple, and usable by office workers and people at home.',
      ].join(' '),
    };
  }
}
