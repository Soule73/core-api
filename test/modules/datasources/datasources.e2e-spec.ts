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
  DataSourceResponse,
} from '../../helpers/test-interfaces';

describe('DataSources Module (E2E)', () => {
  let app: INestApplication;
  let seedData: SeedData;
  let adminToken: string;
  let userToken: string;
  let createdDataSourceId: string;
  let adminDataSourceId: string;

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

  describe('POST /api/v1/datasources', () => {
    it('should create a JSON data source', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/v1/datasources')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test JSON Source',
          type: 'json',
          endpoint: 'https://api.example.com/data',
        })
        .expect(201);

      const body = response.body as DataSourceResponse;
      expect(body).toHaveProperty('name', 'Test JSON Source');
      expect(body).toHaveProperty('type', 'json');
      expect(body).toHaveProperty('endpoint');
      createdDataSourceId = body._id;
    });

    it('should create a CSV data source', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/v1/datasources')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test CSV Source',
          type: 'csv',
          filePath: '/uploads/test.csv',
        })
        .expect(201);

      const body = response.body as DataSourceResponse;
      expect(body).toHaveProperty('name', 'Test CSV Source');
      expect(body).toHaveProperty('type', 'csv');
      adminDataSourceId = body._id;
    });

    it('should create an Elasticsearch data source', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/v1/datasources')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test ES Source',
          type: 'elasticsearch',
          endpoint: 'http://localhost:9200',
          esIndex: 'test-index',
        })
        .expect(201);

      expect(response.body).toHaveProperty('type', 'elasticsearch');
    });

    it('should fail with invalid type', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/v1/datasources')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Invalid Source',
          type: 'invalid',
        })
        .expect(400);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/v1/datasources')
        .send({
          name: 'Unauthorized Source',
          type: 'json',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/datasources', () => {
    it('should get user data sources', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/v1/datasources')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const body = response.body as DataSourceResponse[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(1);
    });

    it('should not include other user data sources', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/v1/datasources')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const body = response.body as DataSourceResponse[];
      const adminSource = body.find((ds) => ds._id === adminDataSourceId);
      expect(adminSource).toBeUndefined();
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/v1/datasources')
        .expect(401);
    });
  });

  describe('GET /api/v1/datasources/:id', () => {
    it('should get own data source', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/api/v1/datasources/${createdDataSourceId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Test JSON Source');
    });

    it('should fail to get other user data source', async () => {
      await request(app.getHttpServer() as Server)
        .get(`/api/v1/datasources/${adminDataSourceId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent data source', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/v1/datasources/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/datasources/:id', () => {
    it('should update own data source', async () => {
      const response = await request(app.getHttpServer() as Server)
        .put(`/api/v1/datasources/${createdDataSourceId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Updated JSON Source',
        })
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Updated JSON Source');
    });

    it('should fail to update other user data source', async () => {
      await request(app.getHttpServer() as Server)
        .put(`/api/v1/datasources/${adminDataSourceId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Hacked Source',
        })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/datasources/:id', () => {
    it('should fail to delete other user data source', async () => {
      await request(app.getHttpServer() as Server)
        .delete(`/api/v1/datasources/${adminDataSourceId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('should delete own data source', async () => {
      await request(app.getHttpServer() as Server)
        .delete(`/api/v1/datasources/${createdDataSourceId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(204);
    });

    it('should return 404 for already deleted data source', async () => {
      await request(app.getHttpServer() as Server)
        .get(`/api/v1/datasources/${createdDataSourceId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });
});
