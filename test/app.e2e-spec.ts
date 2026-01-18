import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import type { Server } from 'http';
import request from 'supertest';
import { createTestApp, closeTestApp } from './helpers';

interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
}

interface OpenApiInfo {
  title: string;
  version: string;
}

interface OpenApiResponse {
  openapi: string;
  info: OpenApiInfo;
}

describe('AppController (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe('GET /api/v1/health', () => {
    it('should return health status with correct structure', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/v1/health')
        .expect(200);

      const body = response.body as HealthResponse;
      expect(body).toHaveProperty('status', 'ok');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('service', 'core-api');
      expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
    });
  });

  describe('Swagger Documentation', () => {
    it('should serve Swagger UI at /api/docs', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/docs')
        .expect(200);

      expect(response.text).toContain('swagger-ui');
    });

    it('should serve OpenAPI JSON at /api/docs-json', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/docs-json')
        .expect(200);

      const body = response.body as OpenApiResponse;
      expect(body).toHaveProperty('openapi', '3.0.0');
      expect(body).toHaveProperty('info');
      expect(body.info).toHaveProperty('title', 'CustomDash Core API');
      expect(body.info).toHaveProperty('version', '1.0');
    });
  });
});
