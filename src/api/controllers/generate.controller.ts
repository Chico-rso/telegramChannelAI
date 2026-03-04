import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateContentDto } from '../dto/generate-content.dto';
import { GenerateApiKeyGuard } from '../guards/generate-api-key.guard';
import { GenerationQueueService } from '../../infra/queue/generation-queue.service';

@Controller()
export class GenerateController {
  constructor(
    private readonly generationQueueService: GenerationQueueService,
    private readonly configService: ConfigService,
  ) {}

  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(GenerateApiKeyGuard)
  async generate(@Body() dto: GenerateContentDto): Promise<{ jobId: string; status: string }> {
    const projectSlug =
      dto.projectSlug ?? this.configService.getOrThrow<string>('DEFAULT_PROJECT_SLUG');
    const job = await this.generationQueueService.enqueueGeneration({
      projectSlug,
      triggeredBy: 'manual',
      variant: dto.variant,
    });

    return {
      jobId: job.id ?? 'unknown',
      status: 'queued',
    };
  }
}
