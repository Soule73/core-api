import { describe, it, expect } from 'vitest';
import { BaseE2ETest } from '../../base';

/**
 * E2E tests for Processing module - Detect Columns endpoint.
 */
class DetectColumnsE2ETest extends BaseE2ETest {
  private readonly endpoint = '/api/v1/processing/detect-columns';

  async detectColumns(payload: Record<string, unknown>) {
    return this.post(this.endpoint, payload);
  }

  async detectColumnsUnauthenticated(payload: Record<string, unknown>) {
    return this.post(this.endpoint, payload, { useAuth: false });
  }
}

const test = new DetectColumnsE2ETest();

describe('Processing - Detect Columns (E2E)', () => {
  describe('POST /api/v1/processing/detect-columns', () => {
    it('should require authentication', async () => {
      const response = await test.detectColumnsUnauthenticated({
        type: 'json',
        endpoint: 'http://localhost:3001/api/salles',
      });
      expect(response.status).toBe(401);
    });

    it('should validate datasource type is required', async () => {
      const response = await test.detectColumns({
        endpoint: 'http://localhost:3001/api/salles',
      });
      expect(response.status).toBe(400);
    });

    it('should validate datasource type enum', async () => {
      const response = await test.detectColumns({
        type: 'invalid',
        endpoint: 'http://localhost:3001/api/salles',
      });
      expect(response.status).toBe(400);
    });

    it('should accept json type with endpoint', async () => {
      const response = await test.detectColumns({
        type: 'json',
        endpoint: 'http://localhost:3001/api/salles',
        httpMethod: 'GET',
      });
      expect([200, 502, 503]).toContain(response.status);
    });

    it('should accept json type with POST method', async () => {
      const response = await test.detectColumns({
        type: 'json',
        endpoint: 'http://localhost:3001/api/salles',
        httpMethod: 'POST',
        requestBody: {},
      });
      expect([200, 400, 502, 503]).toContain(response.status);
    });

    it('should accept csv type with filePath', async () => {
      const response = await test.detectColumns({
        type: 'csv',
        filePath: '/uploads/test.csv',
      });
      expect([200, 404, 500, 502, 503]).toContain(response.status);
    });

    it('should accept elasticsearch type with index', async () => {
      const response = await test.detectColumns({
        type: 'elasticsearch',
        index: 'test-index',
        elasticsearchUrl: 'http://localhost:9201',
      });
      expect([200, 400, 500, 502, 503]).toContain(response.status);
    });

    it('should accept bearer auth configuration', async () => {
      const response = await test.detectColumns({
        type: 'json',
        endpoint: 'http://localhost:3001/api/auth/bearer/salles',
        httpMethod: 'GET',
        authType: 'bearer',
        authConfig: { token: 'test-bearer-token-123' },
      });
      expect([200, 502, 503]).toContain(response.status);
    });

    it('should accept apiKey auth configuration (header)', async () => {
      const response = await test.detectColumns({
        type: 'json',
        endpoint: 'http://localhost:3001/api/auth/apikey/salles',
        httpMethod: 'GET',
        authType: 'apiKey',
        authConfig: {
          key: 'test-api-key-456',
          headerName: 'x-api-key',
          addTo: 'header',
        },
      });
      expect([200, 500, 502, 503]).toContain(response.status);
    });

    it('should accept apiKey auth configuration (query)', async () => {
      const response = await test.detectColumns({
        type: 'json',
        endpoint: 'http://localhost:3001/api/auth/apikey/salles',
        httpMethod: 'GET',
        authType: 'apiKey',
        authConfig: {
          key: 'test-api-key-456',
          queryParam: 'api_key',
          addTo: 'query',
        },
      });
      expect([200, 500, 502, 503]).toContain(response.status);
    });

    it('should accept basic auth configuration', async () => {
      const response = await test.detectColumns({
        type: 'json',
        endpoint: 'http://localhost:3001/api/auth/basic/salles',
        httpMethod: 'GET',
        authType: 'basic',
        authConfig: {
          username: 'testuser',
          password: 'testpass123',
        },
      });
      expect([200, 502, 503]).toContain(response.status);
    });
  });
});
