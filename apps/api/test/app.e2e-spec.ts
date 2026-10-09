import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { isApiErrorBody } from '@concr/shared';
import type { Server } from 'node:http';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

describe('API skeleton (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ bufferLogs: true });
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    // supertest leaves one keep-alive socket half-closed for ~1 s, which makes Jest print
    // "did not exit one second after the test run". Drop it explicitly.
    (app.getHttpServer() as unknown as Server).closeAllConnections();
  });

  it('GET /api/v1/health -> 200 without any dependency', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok' });
    expect(typeof res.body.version).toBe('string');
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('GET /api/v1/health/ready -> 200 with components up, or 503 envelope when infra is down', async () => {
    // CI provides PostGIS + Redis services and sets E2E_REQUIRE_INFRA; locally both outcomes are valid.
    // Readiness may flip to 200 a moment after boot (Redis connects in the background), so poll.
    const requireInfra = process.env.E2E_REQUIRE_INFRA === 'true';
    let res = await request(app.getHttpServer()).get('/api/v1/health/ready');
    for (let attempt = 0; requireInfra && res.status !== 200 && attempt < 10; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      res = await request(app.getHttpServer()).get('/api/v1/health/ready');
    }
    if (requireInfra) expect(res.status).toBe(200);
    expect([200, 503]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.status).toBe('ok');
      expect(res.body.info.database.status).toBe('up');
      expect(res.body.info.redis.status).toBe('up');
    } else {
      expect(isApiErrorBody(res.body)).toBe(true);
      expect(res.body.code).toBe('SERVICE_UNAVAILABLE');
    }
  });

  it('unknown route -> 404 error envelope with requestId', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/does-not-exist').expect(404);
    expect(isApiErrorBody(res.body)).toBe(true);
    expect(res.body).toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
    expect(res.body.requestId).toBe(res.headers['x-request-id']);
  });

  it('echoes a client-provided x-request-id', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/does-not-exist')
      .set('x-request-id', 'mobile-abc-123')
      .expect(404);
    expect(res.body.requestId).toBe('mobile-abc-123');
    expect(res.headers['x-request-id']).toBe('mobile-abc-123');
  });

  it('serves the OpenAPI document', async () => {
    const res = await request(app.getHttpServer()).get('/api/docs-json').expect(200);
    expect(res.body.openapi).toMatch(/^3\./);
    expect(res.body.paths).toHaveProperty('/api/v1/health');
  });
});
