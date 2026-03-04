import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { CONTENT_PUBLISHER, LLM_CONTENT_GENERATOR } from '../../../core/contracts/injection-tokens';
import {
  ContentPublisherPort,
  PublishPostResult,
} from '../../../core/contracts/content-publisher.port';
import {
  LlmContentGeneratorPort,
} from '../../../core/contracts/llm-content-generator.port';
import { GenerationJobPayload } from '../../../core/domain/content.types';
import { AnalyticsService } from '../../analytics/application/analytics.service';
import { PublishingFormatterService } from '../../publishing/application/publishing-formatter.service';
import { PrismaService } from '../../../infra/database/prisma.service';
import { ContentPersistenceService } from './content-persistence.service';
import { ContentPromptFactory } from './content-prompt.factory';
import { TopicSelectionService } from './topic-selection.service';

@Injectable()
export class ContentOrchestrationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly topicSelectionService: TopicSelectionService,
    private readonly contentPromptFactory: ContentPromptFactory,
    private readonly contentPersistenceService: ContentPersistenceService,
    private readonly publishingFormatterService: PublishingFormatterService,
    private readonly analyticsService: AnalyticsService,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
    @Inject(LLM_CONTENT_GENERATOR)
    private readonly llmContentGenerator: LlmContentGeneratorPort,
    @Inject(CONTENT_PUBLISHER)
    private readonly publisher: ContentPublisherPort,
  ) {
    this.logger.setContext(ContentOrchestrationService.name);
  }

  async handleGeneration(payload: GenerationJobPayload): Promise<{
    contentId: string;
    publication: PublishPostResult;
  }> {
    const project = await this.prismaService.project.findUnique({
      where: { slug: payload.projectSlug },
    });

    if (!project || !project.isActive) {
      throw new NotFoundException(`Active project not found for slug ${payload.projectSlug}`);
    }

    const recentTopics = await this.topicSelectionService.getRecentTopics(project.id);
    const topic = await this.topicSelectionService.selectTopic(project.id);
    const contentFocus = this.topicSelectionService.getTopicCategory(topic);
    const prompt = this.contentPromptFactory.build({
      projectName: project.name,
      targetAudience:
        project.targetAudience ??
        this.configService.get<string>('CONTENT_AUDIENCE', 'ordinary people'),
      tone: project.contentTone ?? this.configService.get<string>('CONTENT_TONE', 'clear and practical'),
      language: project.language,
      topic,
      contentFocus,
      recentTopics,
    });
    const post = await this.llmContentGenerator.generateStructuredPost(prompt);
    const message = this.publishingFormatterService.toTelegramMessage(post);

    const generatedContent = await this.contentPersistenceService.createDraft({
      projectId: project.id,
      topic,
      model: this.configService.get<string>('OPENAI_MODEL', 'gpt-4.1-mini'),
      post,
      body: message,
    });

    try {
      const publication = await this.publisher.publish({
        channelId: project.telegramChannelId,
        message,
      });

      await this.contentPersistenceService.markPublished(generatedContent.id);
      await this.analyticsService.recordSuccess({
        projectId: project.id,
        generatedContentId: generatedContent.id,
        destination: project.telegramChannelId,
        provider: publication.provider,
        externalMessageId: publication.externalMessageId,
        responsePayload: publication.rawResponse,
      });

      return {
        contentId: generatedContent.id,
        publication,
      };
    } catch (error) {
      await this.contentPersistenceService.markFailed(generatedContent.id);
      await this.analyticsService.recordFailure({
        projectId: project.id,
        generatedContentId: generatedContent.id,
        destination: project.telegramChannelId,
        provider: 'telegram',
        errorMessage: error instanceof Error ? error.message : 'Unknown publishing error',
      });
      throw error;
    }
  }
}
