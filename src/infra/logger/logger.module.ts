import { Global, Module } from '@nestjs/common';
import { LoggerModule as NestjsPinoLoggerModule } from 'nestjs-pino';

@Global()
@Module({
  imports: [
    NestjsPinoLoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                },
              }
            : undefined,
      },
    }),
  ],
  exports: [NestjsPinoLoggerModule],
})
export class LoggerModule {}
