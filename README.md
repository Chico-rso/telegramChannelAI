# Telegram AI Automation System

Production-ready backend for the project "ИИ без сложных слов". The system generates practical AI posts every day, publishes them to a Telegram channel, logs publication results, and exposes a manual trigger endpoint.

## What is included

- NestJS backend with clean architecture boundaries
- Prisma + PostgreSQL persistence
- Redis + BullMQ job queue
- `node-cron` daily scheduling
- OpenAI abstraction layer for structured content generation
- Telegram Bot API publishing adapter
- Pino logging
- Docker Compose for local infrastructure
- Healthcheck and manual generation endpoint

## Project structure

```text
.
├── Dockerfile
├── docker-compose.yml
├── package.json
├── prisma
│   └── schema.prisma
├── src
│   ├── api
│   │   ├── api.module.ts
│   │   ├── controllers
│   │   │   ├── generate.controller.ts
│   │   │   └── health.controller.ts
│   │   └── dto
│   │       └── generate-content.dto.ts
│   ├── app.module.ts
│   ├── core
│   │   ├── config
│   │   │   └── env.validation.ts
│   │   ├── contracts
│   │   │   ├── content-publisher.port.ts
│   │   │   ├── injection-tokens.ts
│   │   │   └── llm-content-generator.port.ts
│   │   ├── domain
│   │   │   └── content.types.ts
│   │   └── utils
│   │       └── retry.util.ts
│   ├── infra
│   │   ├── database
│   │   │   ├── database.module.ts
│   │   │   ├── prisma.service.ts
│   │   │   └── project-bootstrap.service.ts
│   │   ├── llm
│   │   │   ├── llm.module.ts
│   │   │   └── openai-llm.service.ts
│   │   ├── logger
│   │   │   └── logger.module.ts
│   │   ├── publishing
│   │   │   └── telegram-bot-publisher.service.ts
│   │   └── queue
│   │       ├── content-generation.worker.ts
│   │       ├── generation-queue.service.ts
│   │       ├── queue.constants.ts
│   │       ├── queue.module.ts
│   │       ├── redis.config.ts
│   │       └── redis.service.ts
│   ├── main.ts
│   └── modules
│       ├── analytics
│       │   ├── analytics.module.ts
│       │   └── application
│       │       └── analytics.service.ts
│       ├── content
│       │   ├── application
│       │   │   ├── content-orchestration.service.ts
│       │   │   ├── content-persistence.service.ts
│       │   │   ├── content-prompt.factory.ts
│       │   │   └── topic-selection.service.ts
│       │   ├── content.module.ts
│       │   └── domain
│       │       └── topic-catalog.ts
│       ├── publishing
│       │   ├── application
│       │   │   └── publishing-formatter.service.ts
│       │   └── publishing.module.ts
│       └── scheduler
│           ├── application
│           │   └── scheduler.service.ts
│           └── scheduler.module.ts
├── tsconfig.build.json
└── tsconfig.json
```

## Runtime flow

1. `SchedulerService` creates a job on schedule.
2. `GenerationQueueService` puts the job into BullMQ.
3. `ContentGenerationWorker` processes the job.
4. `TopicSelectionService` selects a topic.
5. `OpenAiLlmService` generates structured content.
6. `PublishingFormatterService` converts it to Telegram-safe HTML.
7. `TelegramBotPublisherService` sends the post to Telegram.
8. `AnalyticsService` stores success or failure in PostgreSQL.

## Prisma schema

Key entities:

- `User`: owner of one or more projects
- `Project`: future multi-tenant container for content settings and Telegram destination
- `GeneratedContent`: generated post payload and publication state
- `PublicationLog`: provider-level delivery result and external message id

See the full schema in [`prisma/schema.prisma`](./prisma/schema.prisma).

## Environment variables

Copy `.env.example` to `.env` and fill in:

```bash
NODE_ENV=development
HOST=0.0.0.0
PORT=3000
APP_NAME=telegram-channel-ai
LOG_LEVEL=info

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/telegram_ai?schema=public
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

LLM_PROVIDER=openai-compatible
LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=gpt-4.1-mini
OPENAI_API_KEY=
OPENAI_MODEL=

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHANNEL_ID=@your_channel_or_-1001234567890
GENERATE_API_KEY=change_me_for_production

DEFAULT_USER_EMAIL=owner@example.com
DEFAULT_USER_NAME=Project Owner
DEFAULT_PROJECT_NAME=ИИ без сложных слов
DEFAULT_PROJECT_SLUG=ai-without-complexity
DEFAULT_PROJECT_TIMEZONE=Europe/Moscow
DEFAULT_PROJECT_LANGUAGE=ru

DAILY_GENERATION_CRON=0 9 * * *
QUEUE_NAME=content-generation
JOB_ATTEMPTS=5
JOB_BACKOFF_MS=15000

CONTENT_TONE=clear, practical, friendly
CONTENT_AUDIENCE=ordinary people using AI at work and at home
```

### LLM providers

Default setup works with any OpenAI-compatible endpoint.

OpenAI example:

```bash
LLM_PROVIDER=openai-compatible
LLM_API_KEY=your_openai_api_key
LLM_BASE_URL=
LLM_MODEL=gpt-5-mini
```

GLM-5 example:

```bash
LLM_PROVIDER=openai-compatible
LLM_API_KEY=your_glm_api_key
LLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4/
LLM_MODEL=glm-5
```

Legacy `OPENAI_API_KEY` / `OPENAI_MODEL` variables are still supported as fallback.

## How to get Telegram bot token

1. Open Telegram and find `@BotFather`.
2. Run `/newbot`.
3. Set bot name and username.
4. Copy the token BotFather returns.
5. Put it into `TELEGRAM_BOT_TOKEN`.

## How to get Telegram channel id

You have two valid options:

1. Use a public channel username directly, for example `@my_channel`.
2. Use a numeric channel id like `-1001234567890`.

To use the bot with a channel:

1. Add the bot to the channel.
2. Give it admin permissions to post messages.
3. Set `TELEGRAM_CHANNEL_ID` to the public `@channelusername` or the numeric channel id.

If the channel is private and you need the numeric id:

1. Add the bot as channel admin.
2. Post a message in the channel.
3. Call `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`.
4. Find the `chat.id` value that starts with `-100`.

## Local запуск

### With Docker for infra only

```bash
cp .env.example .env
docker compose up -d postgres redis
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

### With Docker for the whole stack

```bash
cp .env.example .env
docker compose up --build
```

If you use the full stack container, run migrations once before or during release:

```bash
npx prisma migrate deploy
```

## API endpoints

- `GET /health` checks PostgreSQL and Redis connectivity
- `POST /generate` queues manual content generation and requires `x-api-key` when `GENERATE_API_KEY` is set

Manual trigger example:

```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: change_me_for_production" \
  -d '{"projectSlug":"ai-without-complexity"}'
```

## VPS operations

Recommended production shape on a single VPS:

- NestJS app behind `nginx`
- PostgreSQL for persistent business data
- Redis for BullMQ queues and job coordination
- `pm2` for process supervision

Useful external routes:

- `GET /telegram-ai/health`
- `POST /telegram-ai/generate`

Daily PostgreSQL backup script:

```bash
bash scripts/backup-postgres.sh
```

Suggested cron:

```bash
15 3 * * * /var/www/telegramChannelAI/scripts/backup-postgres.sh >> /var/log/telegram-channel-ai-backup.log 2>&1
```

## Retry policy

- LLM calls retry with exponential backoff
- Telegram publishing retries with exponential backoff
- BullMQ job also retries on worker-level failure

This gives both adapter-level resiliency and queue-level replay behavior.

## Deployment

### Railway

1. Create PostgreSQL and Redis services.
2. Create the app service from this repo.
3. Set all environment variables from `.env.example`.
4. Set the start command to `npm run start:prod`.
5. Add a pre-deploy or release command: `npx prisma migrate deploy && npx prisma generate && npm run build`.
6. Expose port `3000`.

### Render

1. Create a PostgreSQL instance and Redis instance.
2. Create a new Web Service from this repo.
3. Build command: `npm install && npx prisma generate && npm run build`.
4. Start command: `npx prisma migrate deploy && npm run start:prod`.
5. Add all environment variables.
6. Keep the service on an always-on plan because scheduler and worker run in-process.

### VPS

1. Install Docker or install Node.js 22+, PostgreSQL, and Redis manually.
2. Clone the repo and create `.env`.
3. Run `npm install`.
4. Run `npx prisma generate`.
5. Run `npx prisma migrate deploy`.
6. Run `npm run build`.
7. Start with `pm2 start dist/main.js --name telegram-ai`.
8. Put Nginx in front if you need HTTPS and a stable domain.

## GitHub Actions deployment

Recommended for a low-memory VPS:

1. Keep only the NestJS app on the VPS.
2. Use managed PostgreSQL and managed Redis.
3. Build in GitHub Actions.
4. Deploy built artifacts to the server and restart via `pm2`.

Repository secrets expected by the workflow:

- `SERVER_HOST`
- `SERVER_SSH_KEY`
- `DEPLOY_ENV`

`DEPLOY_ENV` should contain the full production `.env` file as multiline text.

## Railway migration

This is the recommended path if OpenAI rejects requests from your current VPS region.

Railway supports config-as-code via `railway.toml`, including pre-deploy commands and healthchecks, and allows changing the deployment region per service. See the official docs:

- [Config as Code](https://docs.railway.com/config-as-code/reference)
- [Healthchecks](https://docs.railway.com/reference/healthchecks)
- [Regions](https://docs.railway.com/deployments/regions)
- [PostgreSQL](https://docs.railway.com/guides/postgresql)
- [Redis](https://docs.railway.com/guides/redis)

Recommended Railway layout:

1. Create a new Railway project.
2. Add the app service from this GitHub repository.
3. Add a PostgreSQL service in the same Railway project.
4. Add a Redis service in the same Railway project.
5. Deploy the app service to a supported region such as EU or US.

Set these app variables in Railway:

- `LLM_PROVIDER`
- `LLM_API_KEY`
- `LLM_BASE_URL`
- `LLM_MODEL`
- `OPENAI_API_KEY` fallback
- `OPENAI_MODEL` fallback
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHANNEL_ID`
- `DEFAULT_USER_EMAIL`
- `DEFAULT_USER_NAME`
- `DEFAULT_PROJECT_NAME`
- `DEFAULT_PROJECT_SLUG`
- `DEFAULT_PROJECT_TIMEZONE`
- `DEFAULT_PROJECT_LANGUAGE`
- `DAILY_GENERATION_CRON`
- `CONTENT_TONE`
- `CONTENT_AUDIENCE`
- `GENERATE_API_KEY`

Use Railway service references for data services:

- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `REDIS_URL=${{Redis.REDIS_URL}}`

For Railway runtime:

- do not set `HOST`
- Railway will inject `PORT`
- the repository now contains a real Prisma migration, so Railway can run `npx prisma migrate deploy` before startup

## SaaS readiness notes

- `Project` is isolated as a tenant boundary.
- Publishing is behind a port and can be extended to WhatsApp, email, or Slack.
- LLM access is behind a port and can be switched per tenant or provider.
- Queue-backed execution allows moving workers into separate processes later.
- `GeneratedContent` and `PublicationLog` are ready for analytics dashboards and billing signals.
