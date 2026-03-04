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
    contentFocus: 'office' | 'home';
    postVariant: 'single' | 'list';
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
        'No hashtags or buzzwords.',
        'You may use 1-3 simple emojis in section labels or CTA, but never overload the post with emojis.',
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
        `Content focus: ${input.contentFocus}.`,
        `Post variant: ${input.postVariant}.`,
        recentTopicsBlock,
        'Create a short Telegram post with these sections:',
        '1. title: a concrete pain/problem headline with a human, everyday feel.',
        '2. explanation: 2 short sentences that explain why the problem happens and how AI helps.',
        '3. copyBlock: one concrete prompt a reader can paste directly without editing, or with 1-2 obvious placeholders.',
        '4. exampleResult: a concise, realistic fragment of the result in 3-5 lines.',
        '5. cta: a short low-pressure invitation to try the prompt.',
        'Keep it practical, simple, and usable by office workers and people at home.',
        'Prefer specific situations: messages, shopping, planning, family chores, meetings, reminders, comparison, rewriting.',
        'If contentFocus is office, use work situations: clients, meetings, tasks, messages, documents, deadlines.',
        'If contentFocus is home, use family, shopping, budget, planning, travel, home chores, everyday decisions.',
        'Keep the whole post compact enough for Telegram reading on a phone screen.',
        'copyBlock should usually be 6-10 lines, not a wall of text.',
        'exampleResult should usually be under 450 characters.',
        'cta should sound natural, like a human recommendation, not a promo slogan.',
        'If postVariant is single, create one strong copyable prompt.',
        'If postVariant is list, create a compact useful list post with 3-5 short prompts or ideas inside copyBlock, each clearly separated and easy to scan.',
        'For list posts, the title should feel like a useful saved collection, for example 3 ideas or 5 prompts, not just one scenario.',
        'Do not repeat the same angle as recent topics.',
      ].join(' '),
    };
  }
}
