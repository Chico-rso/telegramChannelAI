import { IsIn, IsOptional, IsString } from 'class-validator';
import { StructuredTelegramPostVariant } from '../../core/domain/content.types';

export class GenerateContentDto {
  @IsOptional()
  @IsString()
  projectSlug?: string;

  @IsOptional()
  @IsIn(['single', 'list'])
  variant?: StructuredTelegramPostVariant;
}
