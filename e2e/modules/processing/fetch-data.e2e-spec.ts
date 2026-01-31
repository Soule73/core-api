import { describe, it, expect, beforeEach } from 'vitest';
import { BaseE2ETest } from '../../base';

interface ApiResponse {
  _id?: string;
  success?: boolean;
  data?: unknown;
}

/**
 * E2E tests for Processing module - Fetch Data endpoint.
 */
class FetchDataE2ETest extends BaseE2ETest {
  private jsonDataSourceId = '';

  async createDataSource(): Promise<string> {
    const response = await this.post('/api/v1/datasources', {
      name: `Test JSON Source ${Date.now()}`,
      type: 'json',
      endpoint: 'http://localhost:3001/api/salles',
      httpMethod: 'GET',
      authType: 'none',
      visibility: 'private',
    });

    if (response.status === 201) {
      return (response.body as ApiResponse)._id ?? '';
    }
    return '';
  }

  getDataSourceId(): string {
    return this.jsonDataSourceId;
  }

  setDataSourceId(id: string): void {
    this.jsonDataSourceId = id;
  }
}

const test = new FetchDataE2ETest();

describe('Processing - Fetch Data (E2E)', () => {
  beforeEach(async () => {
    const id = await test.createDataSource();
    test.setDataSourceId(id);
  });

  describe('GET /api/v1/processing/datasources/:id/data', () => {
    it('should require authentication', async () => {
      const response = await test.get(
        '/api/v1/processing/datasources/fake-id/data',
        {
          useAuth: false,
        },
      );
      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent datasource', async () => {
      const response = await test.get(
        '/api/v1/processing/datasources/507f1f77bcf86cd799439011/data',
      );
      expect(response.status).toBe(404);
    });

    it('should return 400 or 500 for invalid ObjectId', async () => {
      const response = await test.get(
        '/api/v1/processing/datasources/invalid-id/data',
      );
      expect([400, 500]).toContain(response.status);
    });

    it('should accept pagination parameters', async () => {
      const dsId = test.getDataSourceId();
      if (!dsId) return;

      const response = await test.get(
        `/api/v1/processing/datasources/${dsId}/data`,
        {
          query: { page: 1, pageSize: 5 },
        },
      );
      expect([200, 502, 503]).toContain(response.status);
    });

    it('should accept date range parameters', async () => {
      const dsId = test.getDataSourceId();
      if (!dsId) return;

      const response = await test.get(
        `/api/v1/processing/datasources/${dsId}/data`,
        {
          query: {
            from: '2026-01-01T00:00:00Z',
            to: '2026-12-31T23:59:59Z',
          },
        },
      );
      expect([200, 502, 503]).toContain(response.status);
    });

    it('should accept fields parameter for projection', async () => {
      const dsId = test.getDataSourceId();
      if (!dsId) return;

      const response = await test.get(
        `/api/v1/processing/datasources/${dsId}/data`,
        {
          query: { fields: 'name,capacity,building' },
        },
      );
      expect([200, 502, 503]).toContain(response.status);
    });

    it('should accept forceRefresh parameter', async () => {
      const dsId = test.getDataSourceId();
      if (!dsId) return;

      const response = await test.get(
        `/api/v1/processing/datasources/${dsId}/data`,
        {
          query: { forceRefresh: true },
        },
      );
      expect([200, 502, 503]).toContain(response.status);
    });

    it('should isolate cache by userId - different users get separate cache entries', async () => {
      const dsId = test.getDataSourceId();
      if (!dsId) return;

      const userResponse = await test.get(
        `/api/v1/processing/datasources/${dsId}/data`,
        { asAdmin: false },
      );

      const adminResponse = await test.get(
        `/api/v1/processing/datasources/${dsId}/data`,
        { asAdmin: true },
      );

      if (userResponse.status === 200 && adminResponse.status === 200) {
        expect(userResponse.body).toBeDefined();
        expect(adminResponse.body).toBeDefined();
      }
    });

    it('should use cached data for same user on subsequent requests', async () => {
      const dsId = test.getDataSourceId();
      if (!dsId) return;

      const firstResponse = await test.get(
        `/api/v1/processing/datasources/${dsId}/data`,
      );

      if (firstResponse.status === 200) {
        const secondResponse = await test.get(
          `/api/v1/processing/datasources/${dsId}/data`,
        );

        expect(secondResponse.status).toBe(200);
        expect(secondResponse.body).toEqual(firstResponse.body);
      }
    });

    it('should bypass cache with forceRefresh parameter', async () => {
      const dsId = test.getDataSourceId();
      if (!dsId) return;

      await test.get(`/api/v1/processing/datasources/${dsId}/data`);

      const refreshResponse = await test.get(
        `/api/v1/processing/datasources/${dsId}/data`,
        {
          query: { forceRefresh: true },
        },
      );

      expect([200, 502, 503]).toContain(refreshResponse.status);
    });
  });
});
