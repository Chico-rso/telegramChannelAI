export type StructuredTelegramPostVariant = 'single' | 'list';

export interface StructuredTelegramPost {
  topic: string;
  variant: StructuredTelegramPostVariant;
  title: string;
  explanation: string;
  copyBlock: string;
  exampleResult: string;
  cta: string;
}

export interface GenerationJobPayload {
  projectSlug: string;
  triggeredBy: 'cron' | 'manual';
}
