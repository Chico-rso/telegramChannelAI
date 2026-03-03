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
    recentTopics: string[];
  }): GeneratePostInput {
    const recentTopicsBlock =
      input.recentTopics.length > 0
        ? `Recently used topics and angles to avoid repeating too closely: ${input.recentTopics.join(' | ')}.`
        : 'There are no recently used topics yet.';

    return {
      systemPrompt: [
        'You create Telegram posts in Russian for the project "ИИ без сложных слов".',
        'Audience: ordinary people using AI at work and at home, not technical specialists.',
        'Write clearly, practically, warmly, and without jargon.',
        'Each post must solve one everyday problem and feel immediately useful.',
        'Do not write like a marketing brochure or a generic AI tutorial.',
        'Avoid clichés such as "за пару минут", "сделает всю работу за вас", "прямо сейчас", unless absolutely necessary.',
        'No hashtags, no emojis, no buzzwords, no warnings unless the topic truly requires one.',
        'The title must describe a pain, awkward situation, or messy routine. Do not start the title with "Как".',
        'The explanation must be 2 short sentences in plain Russian.',
        'The copy block must be a ready-to-use prompt in Russian that a reader can paste into ChatGPT or another AI tool.',
        'The example result must look like a believable fragment of the AI output, not a theory or explanation of what AI will do.',
        'The CTA must be one short, calm sentence without hype.',
        'Vary rhythm and wording between posts so they do not feel templated.',
        'Return JSON only.',
      ].join(' '),
      userPrompt: [
        `Project: ${input.projectName}.`,
        `Audience: ${input.targetAudience}.`,
        `Tone: ${input.tone}.`,
        `Language: ${input.language}.`,
        `Topic: ${input.topic}.`,
        recentTopicsBlock,
        'Create a short Telegram post with these sections:',
        '1. title: a concrete pain/problem headline with a human, everyday feel.',
        '2. explanation: 2 short sentences that explain why the problem happens and how AI helps.',
        '3. copyBlock: one concrete prompt a reader can paste directly without editing, or with 1-2 obvious placeholders.',
        '4. exampleResult: a concise, realistic fragment of the result in 3-6 lines.',
        '5. cta: a short low-pressure invitation to try the prompt.',
        'Keep it practical, simple, and usable by office workers and people at home.',
        'Prefer specific situations: messages, shopping, planning, family chores, meetings, reminders, comparison, rewriting.',
        'Do not repeat the same angle as recent topics.',
      ].join(' '),
    };
  }
}
