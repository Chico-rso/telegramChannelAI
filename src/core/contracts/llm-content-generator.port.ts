import { StructuredTelegramPost } from '../domain/content.types';

export interface GeneratePostInput {
  systemPrompt: string;
  userPrompt: string;
}

export interface LlmContentGeneratorPort {
  generateStructuredPost(input: GeneratePostInput): Promise<StructuredTelegramPost>;
}
