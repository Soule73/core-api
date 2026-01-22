import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { BaseE2ETest } from '@e2e/base';
import { DashboardResponse } from '@core/modules/dashboards/interfaces';
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
}

/**
 * E2E test class for Dashboards module.
 * Tests CRUD operations and sharing functionality.
 */
class DashboardsE2ETest extends BaseE2ETest {
  private readonly basePath = '/api/v1/dashboards';
  private createdDashboardId = '';
  private shareId = '';

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
      const response = await test.createDashboard(
        {
          title: 'Dashboard with Layout',
          layout: [{ i: 'widget-1', widgetId: 'w1', x: 0, y: 0, w: 4, h: 3 }],
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
