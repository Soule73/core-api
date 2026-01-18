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
  RoleResponse,
} from '../../helpers/test-interfaces';

describe('Roles Module (E2E)', () => {
  let app: INestApplication;
  let seedData: SeedData;
  let adminToken: string;
  let userToken: string;
  let createdRoleId: string;

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

  describe('POST /api/v1/roles', () => {
    it('should create a role as admin', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'editor',
          description: 'Editor role',
          permissions: [seedData.permissions[0]._id],
        })
        .expect(201);

      const body = response.body as RoleResponse;
      expect(body).toHaveProperty('name', 'editor');
      expect(body).toHaveProperty('description', 'Editor role');
      createdRoleId = body._id;
    });

    it('should fail to create role as regular user', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'viewer',
          permissions: [],
        })
        .expect(403);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/v1/roles')
        .send({
          name: 'norole',
          permissions: [],
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/roles', () => {
    it('should get all roles as admin', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/v1/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as RoleResponse[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(2);
    });

    it('should fail to get roles as regular user', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/v1/roles')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/roles/permissions', () => {
    it('should get all permissions as admin', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/v1/roles/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      interface PermissionItem {
        name: string;
      }
      const body = response.body as PermissionItem[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      expect(body[0]).toHaveProperty('name');
    });
  });

  describe('GET /api/v1/roles/:id', () => {
    it('should get a specific role as admin', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/api/v1/roles/${seedData.roles[0]._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'admin');
    });

    it('should return 404 for non-existent role', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/v1/roles/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/roles/:id', () => {
    it('should update a role as admin', async () => {
      const response = await request(app.getHttpServer() as Server)
        .put(`/api/v1/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Updated editor role',
        })
        .expect(200);

      expect(response.body).toHaveProperty(
        'description',
        'Updated editor role',
      );
    });

    it('should fail to update role as regular user', async () => {
      await request(app.getHttpServer() as Server)
        .put(`/api/v1/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          description: 'Hacked description',
        })
        .expect(403);
    });
  });

  describe('DELETE /api/v1/roles/:id', () => {
    it('should fail to delete role as regular user', async () => {
      await request(app.getHttpServer() as Server)
        .delete(`/api/v1/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should delete a role as admin', async () => {
      await request(app.getHttpServer() as Server)
        .delete(`/api/v1/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('should return 404 when deleting non-existent role', async () => {
      await request(app.getHttpServer() as Server)
        .delete('/api/v1/roles/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
