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
import type { LoginResponse } from '../../helpers/test-interfaces';

describe('Auth Module (E2E)', () => {
  let app: INestApplication;
  let seedData: SeedData;

  beforeAll(async () => {
    app = await createTestApp();
    seedData = await seedTestData(app);
  });

  afterAll(async () => {
    await cleanupTestData(app);
    await closeTestApp(app);
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/v1/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@test.com',
          password: 'Password123',
        })
        .expect(201);

      const body = response.body as LoginResponse;
      expect(body).toHaveProperty('token');
      expect(body).toHaveProperty('user');
      expect(body.user).toHaveProperty('email', 'newuser@test.com');
      expect(body.user).not.toHaveProperty('password');
    });

    it('should fail with invalid email', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/v1/auth/register')
        .send({
          username: 'testuser2',
          email: 'invalid-email',
          password: 'Password123',
        })
        .expect(400);
    });

    it('should fail with weak password', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/v1/auth/register')
        .send({
          username: 'testuser3',
          email: 'test3@test.com',
          password: 'weak',
        })
        .expect(400);
    });

    it('should fail with duplicate email', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/v1/auth/register')
        .send({
          username: 'duplicate',
          email: seedData.adminUser.email,
          password: 'Password123',
        })
        .expect(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/v1/auth/login')
        .send({
          email: seedData.adminUser.email,
          password: seedData.adminUser.password,
        })
        .expect(200);

      const body = response.body as LoginResponse;
      expect(body).toHaveProperty('token');
      expect(body).toHaveProperty('user');
      expect(body.user).toHaveProperty('email', seedData.adminUser.email);
    });

    it('should fail with invalid password', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/v1/auth/login')
        .send({
          email: seedData.adminUser.email,
          password: 'WrongPassword123',
        })
        .expect(401);
    });

    it('should fail with non-existent email', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Password123',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    let adminToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app.getHttpServer() as Server)
        .post('/api/v1/auth/login')
        .send({
          email: seedData.adminUser.email,
          password: seedData.adminUser.password,
        });
      adminToken = (loginResponse.body as LoginResponse).token;
    });

    it('should get profile with valid token', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('email', seedData.adminUser.email);
      expect(response.body).toHaveProperty(
        'username',
        seedData.adminUser.username,
      );
    });

    it('should fail without token', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/v1/auth/profile')
        .expect(401);
    });

    it('should fail with invalid token', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
