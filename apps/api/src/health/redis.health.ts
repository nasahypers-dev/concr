import { Inject, Injectable } from '@nestjs/common';
import { type HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { Redis } from 'ioredis';
import { REDIS } from '../redis/redis.module';

const PING_TIMEOUT_MS = 1500;

/** ioredis statuses in which a connection attempt is in flight and may succeed shortly. */
const CONNECTING_STATUSES: ReadonlySet<string> = new Set(['connecting', 'connect', 'reconnecting']);

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    try {
      // The client connects in the background (lazyConnect + no offline queue), so a probe
      // right after boot would fail although Redis is fine. Give an in-flight connect a moment.
      const reply: string = await withTimeout(this.pingWhenReady(), PING_TIMEOUT_MS);
      return reply === 'PONG'
        ? indicator.up()
        : indicator.down({ message: `unexpected reply: ${reply}` });
    } catch (error) {
      return indicator.down({ message: error instanceof Error ? error.message : String(error) });
    }
  }

  private async pingWhenReady(): Promise<string> {
    if (CONNECTING_STATUSES.has(this.redis.status)) {
      await new Promise<void>((resolve, reject) => {
        const onReady = () => {
          cleanup();
          resolve();
        };
        const onError = (error: Error) => {
          cleanup();
          reject(error);
        };
        const cleanup = () => {
          this.redis.off('ready', onReady);
          this.redis.off('error', onError);
        };
        this.redis.once('ready', onReady);
        this.redis.once('error', onError);
      });
    }
    return this.redis.ping();
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out after ${ms} ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}
