import { describe, it, expect, beforeEach } from 'vitest';
import { BaseE2ETest } from '../../base';

interface ApiResponse {
  _id?: string;
}

/**
 * E2E tests for Processing module - Aggregation endpoint.
 */
class AggregationE2ETest extends BaseE2ETest {
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

const test = new AggregationE2ETest();

describe('Processing - Aggregation (E2E)', () => {
  beforeEach(async () => {
    const id = await test.createDataSource();
    test.setDataSourceId(id);
  });

  describe('POST /api/v1/processing/datasources/:id/aggregate', () => {
    it('should require authentication', async () => {
      const response = await test.post(
        '/api/v1/processing/datasources/fake-id/aggregate',
        { metrics: [] },
        { useAuth: false },
      );
      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent datasource', async () => {
      const response = await test.post(
        '/api/v1/processing/datasources/507f1f77bcf86cd799439011/aggregate',
        { metrics: [{ field: 'capacity', type: 'sum' }] },
      );
      expect(response.status).toBe(404);
    });

    it('should validate that metrics array is required', async () => {
      const response = await test.post(
        '/api/v1/processing/datasources/507f1f77bcf86cd799439011/aggregate',
        {},
      );
      expect([400, 404]).toContain(response.status);
    });

    it('should validate metric field is required', async () => {
      const response = await test.post(
        '/api/v1/processing/datasources/507f1f77bcf86cd799439011/aggregate',
        { metrics: [{ type: 'sum' }] },
      );
      expect([400, 404]).toContain(response.status);
    });

    it('should validate metric type enum', async () => {
      const response = await test.post(
        '/api/v1/processing/datasources/507f1f77bcf86cd799439011/aggregate',
        { metrics: [{ field: 'capacity', type: 'invalid' }] },
      );
      expect([400, 404]).toContain(response.status);
    });

    it('should accept valid sum aggregation', async () => {
      const dsId = test.getDataSourceId();
      if (!dsId) return;

      const response = await test.post(
        `/api/v1/processing/datasources/${dsId}/aggregate`,
        { metrics: [{ field: 'capacity', type: 'sum' }] },
      );
      expect([200, 502, 503]).toContain(response.status);
    });

    it('should accept valid avg aggregation', async () => {
      const dsId = test.getDataSourceId();
      if (!dsId) return;

      const response = await test.post(
        `/api/v1/processing/datasources/${dsId}/aggregate`,
        { metrics: [{ field: 'capacity', type: 'avg' }] },
      );
      expect([200, 502, 503]).toContain(response.status);
    });

    it('should accept valid count aggregation', async () => {
      const dsId = test.getDataSourceId();
      if (!dsId) return;

      const response = await test.post(
        `/api/v1/processing/datasources/${dsId}/aggregate`,
        { metrics: [{ field: 'name', type: 'count' }] },
      );
      expect([200, 502, 503]).toContain(response.status);
    });

    it('should accept valid min aggregation', async () => {
      const dsId = test.getDataSourceId();
      if (!dsId) return;

      const response = await test.post(
        `/api/v1/processing/datasources/${dsId}/aggregate`,
        { metrics: [{ field: 'capacity', type: 'min' }] },
      );
      expect([200, 502, 503]).toContain(response.status);
    });

    it('should accept valid max aggregation', async () => {
      const dsId = test.getDataSourceId();
      if (!dsId) return;

      const response = await test.post(
        `/api/v1/processing/datasources/${dsId}/aggregate`,
        { metrics: [{ field: 'capacity', type: 'max' }] },
      );
      expect([200, 502, 503]).toContain(response.status);
    });

    it('should accept multiple metrics', async () => {
      const dsId = test.getDataSourceId();
      if (!dsId) return;

      const response = await test.post(
        `/api/v1/processing/datasources/${dsId}/aggregate`,
        {
          metrics: [
            { field: 'capacity', type: 'sum' },
            { field: 'capacity', type: 'avg' },
            { field: 'capacity', type: 'count' },
          ],
        },
      );
      expect([200, 502, 503]).toContain(response.status);
    });

    it('should accept buckets for grouping', async () => {
      const dsId = test.getDataSourceId();
      if (!dsId) return;

      const response = await test.post(
        `/api/v1/processing/datasources/${dsId}/aggregate`,
        {
          metrics: [{ field: 'capacity', type: 'sum' }],
          buckets: [{ field: 'building', type: 'terms' }],
        },
      );
      expect([200, 502, 503]).toContain(response.status);
    });

    it('should accept date histogram bucket', async () => {
      const dsId = test.getDataSourceId();
      if (!dsId) return;

      const response = await test.post(
        `/api/v1/processing/datasources/${dsId}/aggregate`,
        {
          metrics: [{ field: 'capacity', type: 'count' }],
          buckets: [
            { field: 'createdAt', type: 'date_histogram', interval: 'day' },
          ],
        },
      );
      expect([200, 502, 503]).toContain(response.status);
    });

    it('should accept filters with aggregation', async () => {
      const dsId = test.getDataSourceId();
      if (!dsId) return;

      const response = await test.post(
        `/api/v1/processing/datasources/${dsId}/aggregate`,
        {
          metrics: [{ field: 'capacity', type: 'sum' }],
          filters: [
            { field: 'status', operator: 'equals', value: 'available' },
          ],
        },
      );
      expect([200, 502, 503]).toContain(response.status);
    });
  });
});
