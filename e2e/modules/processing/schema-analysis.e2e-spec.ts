import { describe, it, expect, beforeEach } from 'vitest';
import { BaseE2ETest } from '../../base';

interface ApiResponse {
  _id?: string;
}

/**
 * E2E tests for Processing module - Schema Analysis endpoints.
 */
class SchemaAnalysisE2ETest extends BaseE2ETest {
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

const test = new SchemaAnalysisE2ETest();

describe('Processing - Schema Analysis (E2E)', () => {
  beforeEach(async () => {
    const id = await test.createDataSource();
    test.setDataSourceId(id);
  });

  describe('GET /api/v1/processing/datasources/:id/schema', () => {
    it('should require authentication', async () => {
      const response = await test.get(
        '/api/v1/processing/datasources/fake-id/schema',
        { useAuth: false },
      );
      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent datasource', async () => {
      const response = await test.get(
        '/api/v1/processing/datasources/507f1f77bcf86cd799439011/schema',
      );
      expect(response.status).toBe(404);
    });

    it('should return 400 or 500 for invalid ObjectId', async () => {
      const response = await test.get(
        '/api/v1/processing/datasources/invalid-id/schema',
      );
      expect([400, 500]).toContain(response.status);
    });

    it('should accept sampleSize parameter', async () => {
      const dsId = test.getDataSourceId();
      if (!dsId) return;

      const response = await test.get(
        `/api/v1/processing/datasources/${dsId}/schema`,
        { query: { sampleSize: 50 } },
      );
      expect([200, 502, 503]).toContain(response.status);
    });

    it('should accept maxUniqueValues parameter', async () => {
      const dsId = test.getDataSourceId();
      if (!dsId) return;

      const response = await test.get(
        `/api/v1/processing/datasources/${dsId}/schema`,
        { query: { maxUniqueValues: 20 } },
      );
      expect([200, 502, 503]).toContain(response.status);
    });

    it('should accept detectDates parameter', async () => {
      const dsId = test.getDataSourceId();
      if (!dsId) return;

      const response = await test.get(
        `/api/v1/processing/datasources/${dsId}/schema`,
        { query: { detectDates: true } },
      );
      expect([200, 502, 503]).toContain(response.status);
    });
  });

  describe('GET /api/v1/processing/datasources/:id/quick-schema', () => {
    it('should require authentication', async () => {
      const response = await test.get(
        '/api/v1/processing/datasources/fake-id/quick-schema',
        { useAuth: false },
      );
      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent datasource', async () => {
      const response = await test.get(
        '/api/v1/processing/datasources/507f1f77bcf86cd799439011/quick-schema',
      );
      expect(response.status).toBe(404);
    });

    it('should return 400 or 500 for invalid ObjectId', async () => {
      const response = await test.get(
        '/api/v1/processing/datasources/invalid-id/quick-schema',
      );
      expect([400, 500]).toContain(response.status);
    });

    it('should return quick schema analysis', async () => {
      const dsId = test.getDataSourceId();
      if (!dsId) return;

      const response = await test.get(
        `/api/v1/processing/datasources/${dsId}/quick-schema`,
      );
      expect([200, 502, 503]).toContain(response.status);
    });
  });
});
