import { Global, Inject, Logger, Module, type OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import type { Env } from '../config/env';

/** Injection token for the shared ioredis client: `@Inject(REDIS) private readonly redis: Redis`. */
export const REDIS = Symbol('REDIS');

/**
 * Creates a client that never blocks boot: it connects lazily, fails commands fast while
 * disconnected (so /health/ready reports "down" instead of hanging) and keeps retrying in
 * the background.
 */
export function createRedisClient(url: string, logger: Logger = new Logger('Redis')): Redis {
  const client = new Redis(url, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 3000,
    retryStrategy: (attempt) => Math.min(attempt * 500, 5000),
  });

  let lastError = '';
  client.on('error', (error: Error) => {
    // ioredis emits one error per failed reconnect; log the first loudly, repeats quietly.
    if (error.message === lastError) {
      logger.debug(`Redis still unavailable: ${error.message}`);
      return;
    }
    lastError = error.message;
    logger.warn(`Redis error: ${error.message}`);
  });
  client.on('ready', () => {
    lastError = '';
    logger.log('Redis connected');
  });

  client.connect().catch((error: Error) => {
    logger.warn(`Redis unavailable at boot (will retry): ${error.message}`);
  });

  return client;
}

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        createRedisClient(config.get('REDIS_URL', { infer: true })),
    },
  ],
  exports: [REDIS],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    if (this.redis.status === 'ready') {
      try {
        await this.redis.quit();
        return;
      } catch {
        // fall through to a hard disconnect
      }
    }
    // Not connected (or quit failed): stop reconnect timers immediately.
    this.redis.disconnect(false);
  }
}
