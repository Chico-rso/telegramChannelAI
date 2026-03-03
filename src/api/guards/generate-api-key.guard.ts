import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GenerateApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const configuredApiKey = this.configService.get<string>('GENERATE_API_KEY');

    if (!configuredApiKey) {
      if (this.configService.get<string>('NODE_ENV') === 'production') {
        throw new ForbiddenException('GENERATE_API_KEY is not configured.');
      }

      return true;
    }

    const providedApiKey = request.headers['x-api-key'];
    if (providedApiKey !== configuredApiKey) {
      throw new UnauthorizedException('Invalid x-api-key header.');
    }

    return true;
  }
}
