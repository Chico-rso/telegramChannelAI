import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/database/prisma.service';
import { getTopicCategory, LIST_TOPIC_CATALOG, TOPIC_CATALOG, TopicCategory } from '../domain/topic-catalog';
import { StructuredTelegramPostVariant } from '../../../core/domain/content.types';

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

  async selectTopic(projectId: string, postVariant: StructuredTelegramPostVariant): Promise<string> {
    const recentTopics = await this.getRecentTopics(projectId, 21);
    const usedTopics = new Set(recentTopics);
    const catalog = postVariant === 'list' ? LIST_TOPIC_CATALOG : TOPIC_CATALOG;
    const availableTopics = catalog.filter((item) => !usedTopics.has(item.topic));
    const source = availableTopics.length > 0 ? availableTopics : catalog;
    const preferredCategory = this.getPreferredCategory(recentTopics);
    const categoryPool = source.filter((item) => item.category === preferredCategory);
    const pool = categoryPool.length > 0 ? categoryPool : source;
    const randomIndex = Math.floor(Math.random() * pool.length);

    return pool[randomIndex].topic;
  }

  getTopicCategory(topic: string): TopicCategory {
    return getTopicCategory(topic);
  }

  async getPostVariant(projectId: string): Promise<StructuredTelegramPostVariant> {
    const lastListPost = await this.prismaService.generatedContent.findFirst({
      where: {
        projectId,
        topic: {
          in: LIST_TOPIC_CATALOG.map((item) => item.topic),
        },
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    if (!lastListPost) {
      return 'list';
    }

    const hoursSinceLastList = (Date.now() - lastListPost.createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastList >= 48 ? 'list' : 'single';
  }

  async getSinglePostStyle(projectId: string): Promise<'standard' | 'ultra-short'> {
    const singlePostCount = await this.prismaService.generatedContent.count({
      where: {
        projectId,
        topic: {
          notIn: LIST_TOPIC_CATALOG.map((item) => item.topic),
        },
      },
    });

    const nextSinglePostNumber = singlePostCount + 1;
    return nextSinglePostNumber % 5 === 0 ? 'ultra-short' : 'standard';
  }

  private getPreferredCategory(recentTopics: string[]): TopicCategory {
    const latestTopic = recentTopics[0];
    if (!latestTopic) {
      return Math.random() > 0.5 ? 'office' : 'home';
    }

    return getTopicCategory(latestTopic) === 'office' ? 'home' : 'office';
  }
}
