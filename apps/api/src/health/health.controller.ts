import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { APP_VERSION } from '../app.constants';
import { PrismaService } from '../prisma/prisma.service';
import { RedisHealthIndicator } from './redis.health';

const DB_PING_TIMEOUT_MS = 2000;

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
    private readonly redisHealth: RedisHealthIndicator,
  ) {}

  /** Liveness: the process is up. No dependencies, always 200 (Phase 0 DoD). */
  @Get()
  @ApiOperation({ summary: 'Liveness probe (no dependencies)' })
  @ApiOkResponse({ description: 'Process is alive' })
  liveness(): { status: 'ok'; version: string; uptimeSec: number; timestamp: string } {
    return {
      status: 'ok',
      version: APP_VERSION,
      uptimeSec: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  /** Readiness: PostgreSQL and Redis reachable. 503 with component details otherwise. */
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe (database + redis)' })
  readiness() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma, { timeout: DB_PING_TIMEOUT_MS }),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }
}
