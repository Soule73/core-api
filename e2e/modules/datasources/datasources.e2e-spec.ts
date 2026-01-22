import { describe, it, expect } from 'vitest';
import { BaseE2ETest } from '@e2e/base';
import type { Response } from 'supertest';
import { DataSourceResponse } from '@core/modules/datasources/interfaces';

interface CreateDataSourcePayload {
  name: string;
  type: 'json' | 'csv' | 'elasticsearch';
  endpoint?: string;
  filePath?: string;
  esIndex?: string;
}

/**
 * E2E test class for DataSources module.
 * Tests CRUD operations for different data source types.
 */
class DataSourcesE2ETest extends BaseE2ETest {
  private readonly basePath = '/api/v1/datasources';
  private createdDataSourceId = '';
  private adminDataSourceId = '';

  setCreatedDataSourceId(id: string): void {
    this.createdDataSourceId = id;
  }

  getCreatedDataSourceId(): string {
    return this.createdDataSourceId;
  }

  setAdminDataSourceId(id: string): void {
    this.adminDataSourceId = id;
  }

  getAdminDataSourceId(): string {
    return this.adminDataSourceId;
  }

  createDataSource(
    data: CreateDataSourcePayload,
    asAdmin = false,
  ): Promise<Response> {
    return this.post(
      this.basePath,
      data as unknown as Record<string, unknown>,
      { asAdmin },
    );
  }

  createDataSourceWithoutAuth(
    data: Partial<CreateDataSourcePayload>,
  ): Promise<Response> {
    return this.post(this.basePath, data, { useAuth: false });
  }

  getAllDataSources(asAdmin = false): Promise<Response> {
    return this.get(this.basePath, { asAdmin });
  }

  getDataSourceById(id: string, asAdmin = false): Promise<Response> {
    return this.get(`${this.basePath}/${id}`, { asAdmin });
  }

  updateDataSource(
    id: string,
    data: Record<string, unknown>,
    asAdmin = false,
  ): Promise<Response> {
    return this.put(`${this.basePath}/${id}`, data, { asAdmin });
  }

  deleteDataSource(id: string, asAdmin = false): Promise<Response> {
    return this.delete(`${this.basePath}/${id}`, { asAdmin });
  }
}

const test = new DataSourcesE2ETest();

describe('DataSources Module (E2E)', () => {
  describe('POST /api/v1/datasources', () => {
    it('should create a JSON data source', async () => {
      const response = await test.createDataSource({
        name: 'Test JSON Source',
        type: 'json',
        endpoint: 'https://api.example.com/data',
      });

      expect(response.status).toBe(201);
      const body = response.body as DataSourceResponse;
      expect(body).toHaveProperty('name', 'Test JSON Source');
      expect(body).toHaveProperty('type', 'json');
      expect(body).toHaveProperty('endpoint');
      test.setCreatedDataSourceId(body._id);
    });

    it('should create a CSV data source', async () => {
      const response = await test.createDataSource(
        {
          name: 'Test CSV Source',
          type: 'csv',
          filePath: '/uploads/test.csv',
        },
        true,
      );

      expect(response.status).toBe(201);
      const body = response.body as DataSourceResponse;
      expect(body).toHaveProperty('name', 'Test CSV Source');
      expect(body).toHaveProperty('type', 'csv');
      test.setAdminDataSourceId(body._id);
    });

    it('should create an Elasticsearch data source', async () => {
      const response = await test.createDataSource({
        name: 'Test ES Source',
        type: 'elasticsearch',
        endpoint: 'http://localhost:9200',
        esIndex: 'test-index',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('type', 'elasticsearch');
    });

    it('should fail with invalid type', async () => {
      const response = await test.post(
        '/api/v1/datasources',
        { name: 'Invalid Source', type: 'invalid' },
        { asAdmin: false },
      );

      expect(response.status).toBe(400);
    });

    it('should fail without authentication', async () => {
      const response = await test.createDataSourceWithoutAuth({
        name: 'Unauthorized Source',
        type: 'json',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/datasources', () => {
    it('should get user data sources', async () => {
      const response = await test.getAllDataSources();

      expect(response.status).toBe(200);
      const body = response.body as DataSourceResponse[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(1);
    });

    it('should not include other user data sources', async () => {
      const response = await test.getAllDataSources();

      expect(response.status).toBe(200);
      const body = response.body as DataSourceResponse[];
      const adminSource = body.find(
        (ds) => ds._id === test.getAdminDataSourceId(),
      );
      expect(adminSource).toBeUndefined();
    });

    it('should fail without authentication', async () => {
      const response = await test.get('/api/v1/datasources', {
        useAuth: false,
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/datasources/:id', () => {
    it('should get own data source', async () => {
      const response = await test.getDataSourceById(
        test.getCreatedDataSourceId(),
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Test JSON Source');
    });

    it('should fail to get other user data source', async () => {
      const response = await test.getDataSourceById(
        test.getAdminDataSourceId(),
      );

      expect(response.status).toBe(404);
    });

    it('should return 404 for non-existent data source', async () => {
      const response = await test.getDataSourceById('507f1f77bcf86cd799439011');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/v1/datasources/:id', () => {
    it('should update own data source', async () => {
      const response = await test.updateDataSource(
        test.getCreatedDataSourceId(),
        { name: 'Updated JSON Source' },
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Updated JSON Source');
    });

    it('should fail to update other user data source', async () => {
      const response = await test.updateDataSource(
        test.getAdminDataSourceId(),
        { name: 'Hacked Source' },
      );

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/datasources/:id', () => {
    it('should fail to delete other user data source', async () => {
      const response = await test.deleteDataSource(test.getAdminDataSourceId());

      expect(response.status).toBe(404);
    });

    it('should delete own data source', async () => {
      const response = await test.deleteDataSource(
        test.getCreatedDataSourceId(),
      );

      expect(response.status).toBe(204);
    });

    it('should return 404 for already deleted data source', async () => {
      const response = await test.getDataSourceById(
        test.getCreatedDataSourceId(),
      );

      expect(response.status).toBe(404);
    });
  });
});
