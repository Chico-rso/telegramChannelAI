import { Injectable } from '@nestjs/common';
import { GeneratedContentStatus } from '@prisma/client';
import { StructuredTelegramPost } from '../../../core/domain/content.types';
import { PrismaService } from '../../../infra/database/prisma.service';

@Injectable()
export class ContentPersistenceService {
  constructor(private readonly prismaService: PrismaService) {}

  async createDraft(params: {
    projectId: string;
    topic: string;
    model: string;
    post: StructuredTelegramPost;
    body: string;
  }) {
    return this.prismaService.generatedContent.create({
      data: {
        projectId: params.projectId,
        topic: params.topic,
        title: params.post.title,
        explanation: params.post.explanation,
        copyBlock: params.post.copyBlock,
        exampleResult: params.post.exampleResult,
        cta: params.post.cta,
        body: params.body,
        llmModel: params.model,
        metadata: params.post,
      },
    });
  }

  async markPublished(id: string) {
    return this.prismaService.generatedContent.update({
      where: { id },
      data: { status: GeneratedContentStatus.PUBLISHED },
    });
  }

  async markFailed(id: string) {
    return this.prismaService.generatedContent.update({
      where: { id },
      data: { status: GeneratedContentStatus.FAILED },
    });
  }
}
