import { describe, it, expect, beforeAll } from 'vitest';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { BaseE2ETest } from '@e2e/base';
import type { Response } from 'supertest';
import { WidgetResponse } from '@core/modules/widgets/interfaces';

interface DataSourceDoc {
  _id: string;
  name: string;
  type: string;
  endpoint?: string;
  ownerId: string;
}

interface CreateWidgetPayload {
  title: string;
  type: string;
  dataSourceId: string;
  config?: Record<string, unknown>;
  visibility?: 'private' | 'public';
  isGeneratedByAI?: boolean;
  isDraft?: boolean;
  reasoning?: string;
  confidence?: number;
}

/**
 * E2E test class for Widgets module.
 * Tests CRUD operations with datasource and AI generation features.
 */
class WidgetsE2ETest extends BaseE2ETest {
  private readonly basePath = '/api/v1/widgets';
  private userDataSourceId = '';
  private adminDataSourceId = '';
  private createdWidgetId = '';
  private adminWidgetId = '';

  setUserDataSourceId(id: string): void {
    this.userDataSourceId = id;
  }

  getUserDataSourceId(): string {
    return this.userDataSourceId;
  }

  setAdminDataSourceId(id: string): void {
    this.adminDataSourceId = id;
  }

  getAdminDataSourceId(): string {
    return this.adminDataSourceId;
  }

  setCreatedWidgetId(id: string): void {
    this.createdWidgetId = id;
  }

  getCreatedWidgetId(): string {
    return this.createdWidgetId;
  }

  setAdminWidgetId(id: string): void {
    this.adminWidgetId = id;
  }

  getAdminWidgetId(): string {
    return this.adminWidgetId;
  }

  getDataSourceModel(): Model<DataSourceDoc> {
    return this.context.app.get<Model<DataSourceDoc>>(
      getModelToken('DataSource'),
    );
  }

  createWidget(data: CreateWidgetPayload, asAdmin = false): Promise<Response> {
    return this.post(
      this.basePath,
      data as unknown as Record<string, unknown>,
      { asAdmin },
    );
  }

  createWidgetWithoutAuth(
    data: Partial<CreateWidgetPayload>,
  ): Promise<Response> {
    return this.post(this.basePath, data, { useAuth: false });
  }

  getAllWidgets(asAdmin = false): Promise<Response> {
    return this.get(this.basePath, { asAdmin });
  }

  getWidgetsByDataSource(
    dataSourceId: string,
    asAdmin = false,
  ): Promise<Response> {
    return this.get(`${this.basePath}?dataSourceId=${dataSourceId}`, {
      asAdmin,
    });
  }

  getWidgetById(id: string, asAdmin = false): Promise<Response> {
    return this.get(`${this.basePath}/${id}`, { asAdmin });
  }

  updateWidget(
    id: string,
    data: Record<string, unknown>,
    asAdmin = false,
  ): Promise<Response> {
    return this.put(`${this.basePath}/${id}`, data, { asAdmin });
  }

  deleteWidget(id: string, asAdmin = false): Promise<Response> {
    return this.delete(`${this.basePath}/${id}`, { asAdmin });
  }
}

const test = new WidgetsE2ETest();

describe('Widgets Module (E2E)', () => {
  beforeAll(async () => {
    const DataSourceModel = test.getDataSourceModel();

    const userDs = await DataSourceModel.create({
      name: 'User Widget Source',
      type: 'json',
      endpoint: 'https://api.test.com/widget-user',
      ownerId: test.testData.regularUser._id,
    });
    test.setUserDataSourceId(String(userDs._id));

    const adminDs = await DataSourceModel.create({
      name: 'Admin Widget Source',
      type: 'json',
      endpoint: 'https://api.test.com/widget-admin',
      ownerId: test.testData.adminUser._id,
    });
    test.setAdminDataSourceId(String(adminDs._id));
  });

  describe('POST /api/v1/widgets', () => {
    it('should create a widget', async () => {
      const response = await test.createWidget({
        title: 'Test Widget',
        type: 'bar',
        dataSourceId: test.getUserDataSourceId(),
        config: {
          xAxis: 'category',
          yAxis: 'value',
        },
        visibility: 'private',
      });

      expect(response.status).toBe(201);
      const body = response.body as WidgetResponse;
      expect(body).toHaveProperty('title', 'Test Widget');
      expect(body).toHaveProperty('type', 'bar');
      expect(body).toHaveProperty('widgetId');
      test.setCreatedWidgetId(body._id);
    });

    it('should create an AI-generated widget', async () => {
      const response = await test.createWidget(
        {
          title: 'AI Generated Widget',
          type: 'kpi',
          dataSourceId: test.getAdminDataSourceId(),
          isGeneratedByAI: true,
          isDraft: true,
          reasoning: 'Generated based on data analysis',
          confidence: 0.85,
        },
        true,
      );

      expect(response.status).toBe(201);
      const body = response.body as WidgetResponse & {
        isGeneratedByAI: boolean;
        isDraft: boolean;
        confidence: number;
      };
      expect(body).toHaveProperty('isGeneratedByAI', true);
      expect(body).toHaveProperty('isDraft', true);
      expect(body).toHaveProperty('confidence', 0.85);
      test.setAdminWidgetId(body._id);
    });

    it('should fail without dataSourceId', async () => {
      const response = await test.post(
        '/api/v1/widgets',
        { title: 'Invalid Widget', type: 'bar' },
        { asAdmin: false },
      );

      expect(response.status).toBe(400);
    });

    it('should fail without authentication', async () => {
      const response = await test.createWidgetWithoutAuth({
        title: 'Unauthorized Widget',
        type: 'bar',
        dataSourceId: test.getUserDataSourceId(),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/widgets', () => {
    it('should get user widgets', async () => {
      const response = await test.getAllWidgets();

      expect(response.status).toBe(200);
      const body = response.body as WidgetResponse[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter widgets by dataSourceId', async () => {
      const response = await test.getWidgetsByDataSource(
        test.getUserDataSourceId(),
      );

      expect(response.status).toBe(200);
      const body = response.body as WidgetResponse[];
      expect(Array.isArray(body)).toBe(true);
      body.forEach((widget) => {
        expect(widget.dataSourceId).toBe(test.getUserDataSourceId());
      });
    });

    it('should not include other user widgets', async () => {
      const response = await test.getAllWidgets();

      expect(response.status).toBe(200);
      const body = response.body as WidgetResponse[];
      const adminWidget = body.find((w) => w._id === test.getAdminWidgetId());
      expect(adminWidget).toBeUndefined();
    });

    it('should fail without authentication', async () => {
      const response = await test.get('/api/v1/widgets', { useAuth: false });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/widgets/:id', () => {
    it('should get own widget', async () => {
      const response = await test.getWidgetById(test.getCreatedWidgetId());

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', 'Test Widget');
    });

    it('should fail to get other user widget', async () => {
      const response = await test.getWidgetById(test.getAdminWidgetId());

      expect(response.status).toBe(404);
    });

    it('should return 404 for non-existent widget', async () => {
      const response = await test.getWidgetById('507f1f77bcf86cd799439011');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/v1/widgets/:id', () => {
    it('should update own widget', async () => {
      const response = await test.updateWidget(test.getCreatedWidgetId(), {
        title: 'Updated Widget',
        description: 'Updated description',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', 'Updated Widget');
      expect(response.body).toHaveProperty(
        'description',
        'Updated description',
      );
    });

    it('should fail to update other user widget', async () => {
      const response = await test.updateWidget(test.getAdminWidgetId(), {
        title: 'Hacked Widget',
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/widgets/:id', () => {
    it('should fail to delete other user widget', async () => {
      const response = await test.deleteWidget(test.getAdminWidgetId());

      expect(response.status).toBe(404);
    });

    it('should delete own widget', async () => {
      const response = await test.deleteWidget(test.getCreatedWidgetId());

      expect(response.status).toBe(204);
    });

    it('should return 404 for already deleted widget', async () => {
      const response = await test.getWidgetById(test.getCreatedWidgetId());

      expect(response.status).toBe(404);
    });
  });
});
