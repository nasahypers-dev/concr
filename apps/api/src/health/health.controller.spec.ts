import { HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './redis.health';

describe('HealthController', () => {
  let controller: HealthController;
  const healthCheck = { check: jest.fn() };
  const prismaHealth = { pingCheck: jest.fn() };
  const redisHealth = { isHealthy: jest.fn() };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: healthCheck },
        { provide: PrismaHealthIndicator, useValue: prismaHealth },
        { provide: PrismaService, useValue: {} },
        { provide: RedisHealthIndicator, useValue: redisHealth },
      ],
    }).compile();
    controller = moduleRef.get(HealthController);
    jest.clearAllMocks();
  });

  it('liveness answers without touching any dependency', () => {
    const body = controller.liveness();
    expect(body.status).toBe('ok');
    expect(typeof body.version).toBe('string');
    expect(body.uptimeSec).toBeGreaterThanOrEqual(0);
    expect(() => new Date(body.timestamp).toISOString()).not.toThrow();
    expect(healthCheck.check).not.toHaveBeenCalled();
  });

  it('readiness runs the database and redis indicators', async () => {
    healthCheck.check.mockImplementation(async (checks: Array<() => Promise<unknown>>) => {
      for (const check of checks) await check();
      return { status: 'ok' };
    });
    await expect(controller.readiness()).resolves.toEqual({ status: 'ok' });
    expect(prismaHealth.pingCheck).toHaveBeenCalledWith('database', {}, { timeout: 2000 });
    expect(redisHealth.isHealthy).toHaveBeenCalledWith('redis');
  });
});
