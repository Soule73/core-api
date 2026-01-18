import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import type { Server } from 'http';
import request from 'supertest';
import { createTestApp, closeTestApp } from '../../helpers';
import {
  seedTestData,
  cleanupTestData,
  type SeedData,
} from '../../helpers/test-data.helper';
import type {
  LoginResponse,
  DashboardResponse,
} from '../../helpers/test-interfaces';

describe('Dashboards Module (E2E)', () => {
  let app: INestApplication;
  let seedData: SeedData;
  let adminToken: string;
  let userToken: string;
  let createdDashboardId: string;
  let shareId: string;

  beforeAll(async () => {
    app = await createTestApp();
    seedData = await seedTestData(app);

    const adminLogin = await request(app.getHttpServer() as Server)
      .post('/api/v1/auth/login')
      .send({
        email: seedData.adminUser.email,
        password: seedData.adminUser.password,
      });
    adminToken = (adminLogin.body as LoginResponse).token;

    const userLogin = await request(app.getHttpServer() as Server)
      .post('/api/v1/auth/login')
      .send({
        email: seedData.regularUser.email,
        password: seedData.regularUser.password,
      });
    userToken = (userLogin.body as LoginResponse).token;
  });

  afterAll(async () => {
    await cleanupTestData(app);
    await closeTestApp(app);
  });

  describe('POST /api/v1/dashboards', () => {
    it('should create a dashboard as authenticated user', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/v1/dashboards')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test Dashboard',
          visibility: 'private',
        })
        .expect(201);

      const body = response.body as DashboardResponse;
      expect(body).toHaveProperty('title', 'Test Dashboard');
      expect(body).toHaveProperty('visibility', 'private');
      expect(body).toHaveProperty('ownerId');
      createdDashboardId = body._id;
    });

    it('should create dashboard with layout', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/v1/dashboards')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Dashboard with Layout',
          layout: [{ i: 'widget-1', widgetId: 'w1', x: 0, y: 0, w: 4, h: 3 }],
        })
        .expect(201);

      const body = response.body as DashboardResponse;
      expect(body).toHaveProperty('layout');
      expect(body.layout).toHaveLength(1);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/v1/dashboards')
        .send({
          title: 'Unauthorized Dashboard',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/dashboards', () => {
    it('should get user dashboards', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/v1/dashboards')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const body = response.body as DashboardResponse[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(1);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/v1/dashboards')
        .expect(401);
    });
  });

  describe('GET /api/v1/dashboards/:id', () => {
    it('should get own dashboard', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/api/v1/dashboards/${createdDashboardId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('title', 'Test Dashboard');
    });

    it('should fail to get other user dashboard', async () => {
      await request(app.getHttpServer() as Server)
        .get(`/api/v1/dashboards/${createdDashboardId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent dashboard', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/v1/dashboards/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/dashboards/:id', () => {
    it('should update own dashboard', async () => {
      const response = await request(app.getHttpServer() as Server)
        .put(`/api/v1/dashboards/${createdDashboardId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Updated Dashboard',
        })
        .expect(200);

      expect(response.body).toHaveProperty('title', 'Updated Dashboard');
    });

    it('should fail to update other user dashboard', async () => {
      await request(app.getHttpServer() as Server)
        .put(`/api/v1/dashboards/${createdDashboardId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Hacked Dashboard',
        })
        .expect(404);
    });
  });

  describe('PATCH /api/v1/dashboards/:id/share', () => {
    it('should enable sharing on own dashboard', async () => {
      const response = await request(app.getHttpServer() as Server)
        .patch(`/api/v1/dashboards/${createdDashboardId}/share`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const body = response.body as DashboardResponse;
      expect(body).toHaveProperty('isShared', true);
      expect(body).toHaveProperty('shareId');
      shareId = body.shareId!;
    });

    it('should disable sharing on dashboard', async () => {
      const response = await request(app.getHttpServer() as Server)
        .patch(`/api/v1/dashboards/${createdDashboardId}/share`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('isShared', false);
    });

    it('should re-enable sharing for public access test', async () => {
      const response = await request(app.getHttpServer() as Server)
        .patch(`/api/v1/dashboards/${createdDashboardId}/share`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      shareId = (response.body as DashboardResponse).shareId!;
    });
  });

  describe('GET /api/v1/dashboards/shared/:shareId', () => {
    it('should get shared dashboard without authentication', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/api/v1/dashboards/shared/${shareId}`)
        .expect(200);

      expect(response.body).toHaveProperty('title', 'Updated Dashboard');
    });

    it('should return 404 for invalid share ID', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/v1/dashboards/shared/invalid-share-id')
        .expect(404);
    });
  });

  describe('DELETE /api/v1/dashboards/:id', () => {
    it('should fail to delete other user dashboard', async () => {
      await request(app.getHttpServer() as Server)
        .delete(`/api/v1/dashboards/${createdDashboardId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should delete own dashboard', async () => {
      await request(app.getHttpServer() as Server)
        .delete(`/api/v1/dashboards/${createdDashboardId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(204);
    });

    it('should return 404 for already deleted dashboard', async () => {
      await request(app.getHttpServer() as Server)
        .get(`/api/v1/dashboards/${createdDashboardId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });
});
