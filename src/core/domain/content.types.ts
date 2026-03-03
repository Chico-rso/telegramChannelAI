export interface StructuredTelegramPost {
  topic: string;
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
