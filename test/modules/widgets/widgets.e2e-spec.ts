import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import type { Server } from 'http';
import request from 'supertest';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { createTestApp, closeTestApp } from '../../helpers';
import {
  seedTestData,
  cleanupTestData,
  type SeedData,
} from '../../helpers/test-data.helper';
import type {
  LoginResponse,
  WidgetResponse,
} from '../../helpers/test-interfaces';

interface DataSourceDoc {
  _id: string;
  name: string;
  type: string;
  endpoint?: string;
  ownerId: string;
}

describe('Widgets Module (E2E)', () => {
  let app: INestApplication;
  let seedData: SeedData;
  let adminToken: string;
  let userToken: string;
  let userDataSourceId: string;
  let adminDataSourceId: string;
  let createdWidgetId: string;
  let adminWidgetId: string;

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

    const DataSourceModel = app.get<Model<DataSourceDoc>>(
      getModelToken('DataSource'),
    );

    const userDs = await DataSourceModel.create({
      name: 'User Test Source',
      type: 'json',
      endpoint: 'https://api.test.com/user',
      ownerId: seedData.regularUser._id,
    });
    userDataSourceId = String(userDs._id);

    const adminDs = await DataSourceModel.create({
      name: 'Admin Test Source',
      type: 'json',
      endpoint: 'https://api.test.com/admin',
      ownerId: seedData.adminUser._id,
    });
    adminDataSourceId = String(adminDs._id);
  });

  afterAll(async () => {
    await cleanupTestData(app);
    await closeTestApp(app);
  });

  describe('POST /api/v1/widgets', () => {
    it('should create a widget', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/v1/widgets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test Widget',
          type: 'bar',
          dataSourceId: userDataSourceId,
          config: {
            xAxis: 'category',
            yAxis: 'value',
          },
          visibility: 'private',
        })
        .expect(201);

      const body = response.body as WidgetResponse;
      expect(body).toHaveProperty('title', 'Test Widget');
      expect(body).toHaveProperty('type', 'bar');
      expect(body).toHaveProperty('widgetId');
      createdWidgetId = body._id;
    });

    it('should create an AI-generated widget', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/v1/widgets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'AI Generated Widget',
          type: 'kpi',
          dataSourceId: adminDataSourceId,
          isGeneratedByAI: true,
          isDraft: true,
          reasoning: 'Generated based on data analysis',
          confidence: 0.85,
        })
        .expect(201);

      const body = response.body as WidgetResponse & {
        isGeneratedByAI: boolean;
        isDraft: boolean;
        confidence: number;
      };
      expect(body).toHaveProperty('isGeneratedByAI', true);
      expect(body).toHaveProperty('isDraft', true);
      expect(body).toHaveProperty('confidence', 0.85);
      adminWidgetId = body._id;
    });

    it('should fail without dataSourceId', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/v1/widgets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Invalid Widget',
          type: 'bar',
        })
        .expect(400);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/v1/widgets')
        .send({
          title: 'Unauthorized Widget',
          type: 'bar',
          dataSourceId: userDataSourceId,
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/widgets', () => {
    it('should get user widgets', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/v1/widgets')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const body = response.body as WidgetResponse[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter widgets by dataSourceId', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/api/v1/widgets?dataSourceId=${userDataSourceId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const body = response.body as WidgetResponse[];
      expect(Array.isArray(body)).toBe(true);
      body.forEach((widget) => {
        expect(widget.dataSourceId).toBe(userDataSourceId);
      });
    });

    it('should not include other user widgets', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/v1/widgets')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const body = response.body as WidgetResponse[];
      const adminWidget = body.find((w) => w._id === adminWidgetId);
      expect(adminWidget).toBeUndefined();
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/v1/widgets')
        .expect(401);
    });
  });

  describe('GET /api/v1/widgets/:id', () => {
    it('should get own widget', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/api/v1/widgets/${createdWidgetId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('title', 'Test Widget');
    });

    it('should fail to get other user widget', async () => {
      await request(app.getHttpServer() as Server)
        .get(`/api/v1/widgets/${adminWidgetId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent widget', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/v1/widgets/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/widgets/:id', () => {
    it('should update own widget', async () => {
      const response = await request(app.getHttpServer() as Server)
        .put(`/api/v1/widgets/${createdWidgetId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Updated Widget',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body).toHaveProperty('title', 'Updated Widget');
      expect(response.body).toHaveProperty(
        'description',
        'Updated description',
      );
    });

    it('should fail to update other user widget', async () => {
      await request(app.getHttpServer() as Server)
        .put(`/api/v1/widgets/${adminWidgetId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Hacked Widget',
        })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/widgets/:id', () => {
    it('should fail to delete other user widget', async () => {
      await request(app.getHttpServer() as Server)
        .delete(`/api/v1/widgets/${adminWidgetId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('should delete own widget', async () => {
      await request(app.getHttpServer() as Server)
        .delete(`/api/v1/widgets/${createdWidgetId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(204);
    });

    it('should return 404 for already deleted widget', async () => {
      await request(app.getHttpServer() as Server)
        .get(`/api/v1/widgets/${createdWidgetId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });
});
