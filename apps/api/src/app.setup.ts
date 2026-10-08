import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { API_PREFIX } from './app.constants';
import type { Env } from './config/env';
import { setupSwagger } from './swagger';

/**
 * Everything main.ts and the e2e tests must apply identically to a created Nest app.
 * Global pipe and filter are registered via APP_PIPE / APP_FILTER in AppModule.
 */
export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService<Env, true>);

  app.useLogger(app.get(Logger));
  app.setGlobalPrefix(API_PREFIX);
  app.enableCors({
    origin: config.get('CORS_ORIGINS', { infer: true }),
    credentials: true,
    exposedHeaders: ['x-request-id'],
  });
  app.enableShutdownHooks();
  setupSwagger(app);
}
