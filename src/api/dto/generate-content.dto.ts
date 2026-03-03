import { IsOptional, IsString } from 'class-validator';

export class GenerateContentDto {
  @IsOptional()
  @IsString()
  projectSlug?: string;
}
