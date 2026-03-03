import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from './prisma.service';

@Injectable()
export class ProjectBootstrapService implements OnModuleInit {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProjectBootstrapService.name);
  }

  async onModuleInit(): Promise<void> {
    const owner = await this.prismaService.user.upsert({
      where: {
        email: this.configService.getOrThrow<string>('DEFAULT_USER_EMAIL'),
      },
      update: {
        name: this.configService.get<string>('DEFAULT_USER_NAME'),
      },
      create: {
        email: this.configService.getOrThrow<string>('DEFAULT_USER_EMAIL'),
        name: this.configService.get<string>('DEFAULT_USER_NAME'),
      },
    });

    await this.prismaService.project.upsert({
      where: {
        slug: this.configService.getOrThrow<string>('DEFAULT_PROJECT_SLUG'),
      },
      update: {
        ownerId: owner.id,
        name: this.configService.getOrThrow<string>('DEFAULT_PROJECT_NAME'),
        timezone: this.configService.get<string>('DEFAULT_PROJECT_TIMEZONE', 'UTC'),
        language: this.configService.get<string>('DEFAULT_PROJECT_LANGUAGE', 'ru'),
        telegramChannelId: this.configService.getOrThrow<string>('TELEGRAM_CHANNEL_ID'),
        contentTone: this.configService.get<string>('CONTENT_TONE'),
        targetAudience: this.configService.get<string>('CONTENT_AUDIENCE'),
        isActive: true,
      },
      create: {
        ownerId: owner.id,
        slug: this.configService.getOrThrow<string>('DEFAULT_PROJECT_SLUG'),
        name: this.configService.getOrThrow<string>('DEFAULT_PROJECT_NAME'),
        timezone: this.configService.get<string>('DEFAULT_PROJECT_TIMEZONE', 'UTC'),
        language: this.configService.get<string>('DEFAULT_PROJECT_LANGUAGE', 'ru'),
        telegramChannelId: this.configService.getOrThrow<string>('TELEGRAM_CHANNEL_ID'),
        contentTone: this.configService.get<string>('CONTENT_TONE'),
        targetAudience: this.configService.get<string>('CONTENT_AUDIENCE'),
      },
    });

    this.logger.info('Default owner and project are ready');
  }
}
