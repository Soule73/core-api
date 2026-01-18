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
  UserResponse,
} from '../../helpers/test-interfaces';

describe('Users Module (E2E)', () => {
  let app: INestApplication;
  let seedData: SeedData;
  let adminToken: string;
  let userToken: string;
  let createdUserId: string;

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

  describe('POST /api/v1/users', () => {
    it('should create a user as admin', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'createduser',
          email: 'created@test.com',
          password: 'Password123!',
          roleId: seedData.roles[1]._id,
        })
        .expect(201);

      const body = response.body as UserResponse;
      expect(body).toHaveProperty('email', 'created@test.com');
      expect(body).toHaveProperty('username', 'createduser');
      createdUserId = body._id;
    });

    it('should fail to create user as regular user (no permission)', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          username: 'anotheruser',
          email: 'another@test.com',
          password: 'Password123!',
          roleId: seedData.roles[1]._id,
        })
        .expect(403);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/v1/users')
        .send({
          username: 'noauth',
          email: 'noauth@test.com',
          password: 'Password123!',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/users', () => {
    it('should get all users as admin', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as UserResponse[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(2);
    });

    it('should fail to get users as regular user', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should get a specific user as admin', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/api/v1/users/${seedData.regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('email', seedData.regularUser.email);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/v1/users/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('should update a user as admin', async () => {
      const response = await request(app.getHttpServer() as Server)
        .put(`/api/v1/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'updateduser',
        })
        .expect(200);

      expect(response.body).toHaveProperty('username', 'updateduser');
    });

    it('should fail to update user as regular user', async () => {
      await request(app.getHttpServer() as Server)
        .put(`/api/v1/users/${createdUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          username: 'hackeduser',
        })
        .expect(403);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should fail to delete user as regular user', async () => {
      await request(app.getHttpServer() as Server)
        .delete(`/api/v1/users/${createdUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should delete a user as admin', async () => {
      await request(app.getHttpServer() as Server)
        .delete(`/api/v1/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('should return 404 when deleting non-existent user', async () => {
      await request(app.getHttpServer() as Server)
        .delete('/api/v1/users/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
