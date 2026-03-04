import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/database/prisma.service';
import { getTopicCategory, TOPIC_CATALOG, TopicCategory } from '../domain/topic-catalog';

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
    const availableTopics = TOPIC_CATALOG.filter((item) => !usedTopics.has(item.topic));
    const source = availableTopics.length > 0 ? availableTopics : TOPIC_CATALOG;
    const preferredCategory = this.getPreferredCategory(recentTopics);
    const categoryPool = source.filter((item) => item.category === preferredCategory);
    const pool = categoryPool.length > 0 ? categoryPool : source;
    const randomIndex = Math.floor(Math.random() * pool.length);

    return pool[randomIndex].topic;
  }

  getTopicCategory(topic: string): TopicCategory {
    return getTopicCategory(topic);
  }

  private getPreferredCategory(recentTopics: string[]): TopicCategory {
    const latestTopic = recentTopics[0];
    if (!latestTopic) {
      return Math.random() > 0.5 ? 'office' : 'home';
    }

    return getTopicCategory(latestTopic) === 'office' ? 'home' : 'office';
  }
}
