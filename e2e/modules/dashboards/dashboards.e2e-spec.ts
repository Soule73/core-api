import { describe, it, expect, beforeAll } from 'vitest';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import request from 'supertest';
import { BaseE2ETest } from '@e2e/base';
import { DashboardResponse } from '@core/modules/dashboards/interfaces';

interface DataSourceDoc {
  _id: string;
  name: string;
  type: string;
  endpoint?: string;
  ownerId: string;
  visibility?: string;
}

export interface LayoutItem {
  i: string;
  widgetId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface CreateDashboardPayload {
  title: string;
  visibility?: 'private' | 'public';
  layout?: LayoutItem[];
  skipValidation?: boolean;
}

/**
 * E2E test class for Dashboards module.
 * Tests CRUD operations and sharing functionality.
 */
class DashboardsE2ETest extends BaseE2ETest {
  private readonly basePath = '/api/v1/dashboards';
  private createdDashboardId = '';
  private shareId = '';
  private userDataSourceId = '';

  getDataSourceModel(): Model<DataSourceDoc> {
    return this.context.app.get<Model<DataSourceDoc>>(
      getModelToken('DataSource'),
    );
  }

  getUserId(): string {
    return this.testData.regularUser._id.toString();
  }

  setUserDataSourceId(id: string): void {
    this.userDataSourceId = id;
  }

  getUserDataSourceId(): string {
    return this.userDataSourceId;
  }

  setCreatedDashboardId(id: string): void {
    this.createdDashboardId = id;
  }

  getCreatedDashboardId(): string {
    return this.createdDashboardId;
  }

  setShareId(id: string): void {
    this.shareId = id;
  }

  getShareId(): string {
    return this.shareId;
  }

  createDashboard(
    data: CreateDashboardPayload,
    asAdmin = false,
  ): Promise<request.Response> {
    return this.post(
      this.basePath,
      data as unknown as Record<string, unknown>,
      { asAdmin },
    );
  }

  createDashboardWithoutAuth(
    data: CreateDashboardPayload,
  ): Promise<request.Response> {
    return this.post(
      this.basePath,
      data as unknown as Record<string, unknown>,
      { useAuth: false },
    );
  }

  getAllDashboards(asAdmin = false): Promise<request.Response> {
    return this.get(this.basePath, { asAdmin });
  }

  getAllDashboardsWithoutAuth(): Promise<request.Response> {
    return this.get(this.basePath, { useAuth: false });
  }

  getDashboardById(id: string, asAdmin = false): Promise<request.Response> {
    return this.get(`${this.basePath}/${id}`, { asAdmin });
  }

  updateDashboard(
    id: string,
    data: Record<string, unknown>,
    asAdmin = false,
  ): Promise<request.Response> {
    return this.put(`${this.basePath}/${id}`, data, { asAdmin });
  }

  toggleShare(id: string, asAdmin = false): Promise<request.Response> {
    return this.patch(`${this.basePath}/${id}/share`, undefined, { asAdmin });
  }

  getSharedDashboard(shareId: string): Promise<request.Response> {
    return this.get(`${this.basePath}/shared/${shareId}`, { useAuth: false });
  }

  deleteDashboard(id: string, asAdmin = false): Promise<request.Response> {
    return this.delete(`${this.basePath}/${id}`, { asAdmin });
  }
}

const test = new DashboardsE2ETest();

describe('Dashboards Module (E2E)', () => {
  beforeAll(async () => {
    const DataSourceModel = test.getDataSourceModel();

    const userDs = await DataSourceModel.create({
      name: 'User Dashboard Source',
      type: 'json',
      endpoint: 'https://api.test.com/dashboard-user',
      ownerId: test.getUserId(),
      visibility: 'private',
    });

    test.setUserDataSourceId(String(userDs._id));
  });

  describe('POST /api/v1/dashboards', () => {
    it('should create a dashboard as authenticated user', async () => {
      const response = await test.createDashboard({
        title: 'Test Dashboard',
        visibility: 'private',
      });

      expect(response.status).toBe(201);
      const body = response.body as DashboardResponse;
      expect(body).toHaveProperty('title', 'Test Dashboard');
      expect(body).toHaveProperty('visibility', 'private');
      expect(body).toHaveProperty('ownerId');
      test.setCreatedDashboardId(body._id);
    });

    it('should create dashboard with layout', async () => {
      // Use a valid ObjectId format even with skipValidation (required for MongoDB ObjectId conversion)
      const fakeWidgetId = '507f1f77bcf86cd799439011';
      const response = await test.createDashboard(
        {
          title: 'Dashboard with Layout',
          layout: [
            { i: 'widget-1', widgetId: fakeWidgetId, x: 0, y: 0, w: 4, h: 3 },
          ],
          skipValidation: true,
        },
        true,
      );

      expect(response.status).toBe(201);
      const body = response.body as DashboardResponse;
      expect(body).toHaveProperty('layout');
      expect(body.layout).toHaveLength(1);
    });

    it('should fail without authentication', async () => {
      const response = await test.createDashboardWithoutAuth({
        title: 'Unauthorized Dashboard',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/dashboards', () => {
    it('should get user dashboards', async () => {
      const response = await test.getAllDashboards();

      expect(response.status).toBe(200);
      const body = response.body as DashboardResponse[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(1);
    });

    it('should fail without authentication', async () => {
      const response = await test.getAllDashboardsWithoutAuth();

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/dashboards/:id', () => {
    it('should get own dashboard', async () => {
      const response = await test.getDashboardById(
        test.getCreatedDashboardId(),
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', 'Test Dashboard');
    });

    it('should fail to get other user dashboard', async () => {
      const response = await test.getDashboardById(
        test.getCreatedDashboardId(),
        true,
      );

      expect(response.status).toBe(404);
    });

    it('should return 404 for non-existent dashboard', async () => {
      const response = await test.getDashboardById('507f1f77bcf86cd799439011');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/v1/dashboards/:id', () => {
    it('should update own dashboard', async () => {
      const response = await test.updateDashboard(
        test.getCreatedDashboardId(),
        {
          title: 'Updated Dashboard',
        },
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', 'Updated Dashboard');
    });

    it('should fail to update other user dashboard', async () => {
      const response = await test.updateDashboard(
        test.getCreatedDashboardId(),
        { title: 'Hacked Dashboard' },
        true,
      );

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/dashboards/:id/share', () => {
    it('should enable sharing on own dashboard', async () => {
      const response = await test.toggleShare(test.getCreatedDashboardId());

      expect(response.status).toBe(200);
      const body = response.body as DashboardResponse;
      expect(body).toHaveProperty('isShared', true);
      expect(body).toHaveProperty('shareId');
      test.setShareId(body.shareId as string);
    });

    it('should disable sharing on dashboard', async () => {
      const response = await test.toggleShare(test.getCreatedDashboardId());

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isShared', false);
    });

    it('should re-enable sharing for public access test', async () => {
      const response = await test.toggleShare(test.getCreatedDashboardId());

      expect(response.status).toBe(200);
      test.setShareId((response.body as DashboardResponse).shareId as string);
    });
  });

  describe('GET /api/v1/dashboards/shared/:shareId', () => {
    it('should get shared dashboard without authentication', async () => {
      const response = await test.getSharedDashboard(test.getShareId());

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', 'Updated Dashboard');
    });

    it('should return 404 for invalid share ID', async () => {
      const response = await test.getSharedDashboard('invalid-share-id');

      expect(response.status).toBe(404);
    });
  });

  describe('Widget Validation', () => {
    it('should reject dashboard creation with non-existent widget', async () => {
      const response = await test.createDashboard({
        title: 'Dashboard with Invalid Widget',
        layout: [
          {
            i: 'invalid-1',
            widgetId: '507f1f77bcf86cd799439999',
            x: 0,
            y: 0,
            w: 4,
            h: 3,
          },
        ],
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect((response.body as { message: string }).message).toContain(
        'do not exist',
      );
    });

    it('should reject dashboard update with non-existent widget', async () => {
      const createResponse = await test.createDashboard({
        title: 'Dashboard for Update Test',
      });
      const dashboardId = (createResponse.body as DashboardResponse)._id;

      const updateResponse = await test.updateDashboard(dashboardId, {
        layout: [
          {
            i: 'invalid-1',
            widgetId: '507f1f77bcf86cd799439999',
            x: 0,
            y: 0,
            w: 4,
            h: 3,
          },
        ],
      });

      expect(updateResponse.status).toBe(400);
      expect((updateResponse.body as { message: string }).message).toContain(
        'do not exist',
      );

      await test.deleteDashboard(dashboardId);
    });

    it('should accept dashboard with ObjectId widgetId format', async () => {
      // Create widget as regular user (same as datasource owner)
      const widgetResponse = await test.post(
        '/api/v1/widgets',
        {
          title: 'Test Widget for ObjectId',
          type: 'kpi',
          dataSourceId: test.getUserDataSourceId(),
        },
        { asAdmin: false },
      );

      if (widgetResponse.status === 201) {
        const widgetId = (widgetResponse.body as { _id: string })._id;

        // Create dashboard as regular user (same user that owns the widget)
        const dashboardResponse = await test.createDashboard(
          {
            title: 'Dashboard with ObjectId Widget',
            layout: [
              {
                i: 'widget-objectid',
                widgetId: widgetId,
                x: 0,
                y: 0,
                w: 4,
                h: 3,
              },
            ],
          },
          false,
        );

        expect(dashboardResponse.status).toBe(201);
        const dashboardBody = dashboardResponse.body as DashboardResponse;
        expect(dashboardBody.layout[0].widgetId).toBe(widgetId);

        await test.deleteDashboard(dashboardBody._id, false);
        await test.delete(`/api/v1/widgets/${widgetId}`, { asAdmin: false });
      }
    });
  });

  describe('DELETE /api/v1/dashboards/:id', () => {
    it('should fail to delete other user dashboard', async () => {
      const response = await test.deleteDashboard(
        test.getCreatedDashboardId(),
        true,
      );

      expect(response.status).toBe(404);
    });

    it('should delete own dashboard', async () => {
      const response = await test.deleteDashboard(test.getCreatedDashboardId());

      expect(response.status).toBe(204);
    });

    it('should return 404 for already deleted dashboard', async () => {
      const response = await test.getDashboardById(
        test.getCreatedDashboardId(),
      );

      expect(response.status).toBe(404);
    });
  });
});
