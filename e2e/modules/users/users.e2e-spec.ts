import { describe, it, expect } from 'vitest';
import { BaseE2ETest } from '@e2e/base';
import type { Response } from 'supertest';
import { UserResponse } from '@core/modules/auth/interfaces';

/**
 * E2E test class for Users module.
 * Tests CRUD operations with permission checks.
 */
class UsersE2ETest extends BaseE2ETest {
  private readonly basePath = '/api/v1/users';
  private createdUserId = '';

  setCreatedUserId(id: string): void {
    this.createdUserId = id;
  }

  getCreatedUserId(): string {
    return this.createdUserId;
  }

  createUser(data: {
    username: string;
    email: string;
    password: string;
    roleId: string;
  }): Promise<Response> {
    return this.post(this.basePath, data, { asAdmin: true });
  }

  createUserAsRegular(data: {
    username: string;
    email: string;
    password: string;
    roleId: string;
  }): Promise<Response> {
    return this.post(this.basePath, data, { asAdmin: false });
  }

  getAllUsers(): Promise<Response> {
    return this.get(this.basePath, { asAdmin: true });
  }

  getAllUsersAsRegular(): Promise<Response> {
    return this.get(this.basePath, { asAdmin: false });
  }

  getUserById(id: string): Promise<Response> {
    return this.get(`${this.basePath}/${id}`, { asAdmin: true });
  }

  updateUser(id: string, data: Record<string, unknown>): Promise<Response> {
    return this.put(`${this.basePath}/${id}`, data, { asAdmin: true });
  }

  updateUserAsRegular(
    id: string,
    data: Record<string, unknown>,
  ): Promise<Response> {
    return this.put(`${this.basePath}/${id}`, data, { asAdmin: false });
  }

  deleteUser(id: string): Promise<Response> {
    return this.delete(`${this.basePath}/${id}`, { asAdmin: true });
  }

  deleteUserAsRegular(id: string): Promise<Response> {
    return this.delete(`${this.basePath}/${id}`, { asAdmin: false });
  }

  createWithoutAuth(data: Record<string, unknown>): Promise<Response> {
    return this.post(this.basePath, data, { useAuth: false });
  }
}

const test = new UsersE2ETest();

describe('Users Module (E2E)', () => {
  describe('POST /api/v1/users', () => {
    it('should create a user as admin', async () => {
      const response = await test.createUser({
        username: 'createduser',
        email: 'created@test.com',
        password: 'Password123!',
        roleId: test.testData.roles[1]._id,
      });

      expect(response.status).toBe(201);
      const body = response.body as UserResponse;
      expect(body).toHaveProperty('email', 'created@test.com');
      expect(body).toHaveProperty('username', 'createduser');
      test.setCreatedUserId(body.id);
    });

    it('should fail to create user as regular user (no permission)', async () => {
      const response = await test.createUserAsRegular({
        username: 'anotheruser',
        email: 'another@test.com',
        password: 'Password123!',
        roleId: test.testData.roles[1]._id,
      });

      expect(response.status).toBe(403);
    });

    it('should fail without authentication', async () => {
      const response = await test.createWithoutAuth({
        username: 'noauth',
        email: 'noauth@test.com',
        password: 'Password123!',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/users', () => {
    it('should get all users as admin', async () => {
      const response = await test.getAllUsers();

      expect(response.status).toBe(200);
      const body = response.body as UserResponse[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(2);
    });

    it('should fail to get users as regular user', async () => {
      const response = await test.getAllUsersAsRegular();

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should get a specific user as admin', async () => {
      const response = await test.getUserById(test.testData.regularUser._id);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'email',
        test.testData.regularUser.email,
      );
    });

    it('should return 404 for non-existent user', async () => {
      const response = await test.getUserById('507f1f77bcf86cd799439011');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('should update a user as admin', async () => {
      const response = await test.updateUser(test.getCreatedUserId(), {
        username: 'updateduser',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', 'updateduser');
    });

    it('should fail to update user as regular user', async () => {
      const response = await test.updateUserAsRegular(test.getCreatedUserId(), {
        username: 'hackeduser',
      });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should fail to delete user as regular user', async () => {
      const response = await test.deleteUserAsRegular(test.getCreatedUserId());

      expect(response.status).toBe(403);
    });

    it('should delete a user as admin', async () => {
      const response = await test.deleteUser(test.getCreatedUserId());

      expect(response.status).toBe(204);
    });

    it('should return 404 when deleting non-existent user', async () => {
      const response = await test.deleteUser('507f1f77bcf86cd799439011');

      expect(response.status).toBe(404);
    });
  });
});
