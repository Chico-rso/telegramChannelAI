import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/database/prisma.service';
import { TOPIC_CATALOG } from '../domain/topic-catalog';

@Injectable()
export class TopicSelectionService {
  constructor(private readonly prismaService: PrismaService) {}

  async getRecentTopics(projectId: string, limit = 14): Promise<string[]> {
    const recentTopics = await this.prismaService.generatedContent.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { topic: true },
    });

    return recentTopics.map((item) => item.topic);
  }

  async selectTopic(projectId: string): Promise<string> {
    const recentTopics = await this.getRecentTopics(projectId, 21);
    const usedTopics = new Set(recentTopics);
    const availableTopics = TOPIC_CATALOG.filter((topic) => !usedTopics.has(topic));
    const source = availableTopics.length > 0 ? availableTopics : TOPIC_CATALOG;
    const randomIndex = Math.floor(Math.random() * source.length);

    return source[randomIndex];
  }
}
