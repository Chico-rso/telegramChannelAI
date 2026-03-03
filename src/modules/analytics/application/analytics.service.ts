import { Injectable } from '@nestjs/common';
import { PublicationStatus } from '@prisma/client';
import { PrismaService } from '../../../infra/database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prismaService: PrismaService) {}

  async recordSuccess(params: {
    projectId: string;
    generatedContentId: string;
    provider: string;
    externalMessageId: string;
    destination: string;
    responsePayload: unknown;
  }) {
    return this.prismaService.publicationLog.create({
      data: {
        projectId: params.projectId,
        generatedContentId: params.generatedContentId,
        provider: params.provider,
        status: PublicationStatus.SUCCESS,
        externalMessageId: params.externalMessageId,
        destination: params.destination,
        responsePayload: params.responsePayload as never,
        publishedAt: new Date(),
      },
    });
  }

  async recordFailure(params: {
    projectId: string;
    generatedContentId: string;
    provider: string;
    destination: string;
    errorMessage: string;
  }) {
    return this.prismaService.publicationLog.create({
      data: {
        projectId: params.projectId,
        generatedContentId: params.generatedContentId,
        provider: params.provider,
        status: PublicationStatus.FAILED,
        destination: params.destination,
        errorMessage: params.errorMessage,
      },
    });
  }
}
