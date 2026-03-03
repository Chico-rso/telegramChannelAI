export interface PublishPostInput {
  channelId: string;
  message: string;
}

export interface PublishPostResult {
  provider: string;
  externalMessageId: string;
  rawResponse: unknown;
}

export interface ContentPublisherPort {
  publish(input: PublishPostInput): Promise<PublishPostResult>;
}
