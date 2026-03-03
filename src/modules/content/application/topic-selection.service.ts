import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/database/prisma.service';
import { TOPIC_CATALOG } from '../domain/topic-catalog';

@Injectable()
export class TopicSelectionService {
  constructor(private readonly prismaService: PrismaService) {}

  async selectTopic(projectId: string): Promise<string> {
    const recentTopics = await this.prismaService.generatedContent.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { topic: true },
    });

    const usedTopics = new Set(recentTopics.map((item) => item.topic));
    const availableTopics = TOPIC_CATALOG.filter((topic) => !usedTopics.has(topic));
    const source = availableTopics.length > 0 ? availableTopics : TOPIC_CATALOG;
    const randomIndex = Math.floor(Math.random() * source.length);

    return source[randomIndex];
  }
}
