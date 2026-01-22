import { describe, it, expect } from 'vitest';
import { BaseE2ETest } from '@e2e/base';
import type { Response } from 'supertest';
import { RoleResponse } from '@core/modules/auth/interfaces';

interface PermissionItem {
  _id: string;
  name: string;
}

/**
 * E2E test class for Roles module.
 * Tests CRUD operations with permission checks.
 */
class RolesE2ETest extends BaseE2ETest {
  private readonly basePath = '/api/v1/roles';
  private createdRoleId = '';

  setCreatedRoleId(id: string): void {
    this.createdRoleId = id;
  }

  getCreatedRoleId(): string {
    return this.createdRoleId;
  }

  createRole(data: {
    name: string;
    description?: string;
    permissions: string[];
  }): Promise<Response> {
    return this.post(this.basePath, data, { asAdmin: true });
  }

  createRoleAsRegular(data: {
    name: string;
    permissions: string[];
  }): Promise<Response> {
    return this.post(this.basePath, data, { asAdmin: false });
  }

  createRoleWithoutAuth(data: Record<string, unknown>): Promise<Response> {
    return this.post(this.basePath, data, { useAuth: false });
  }

  getAllRoles(): Promise<Response> {
    return this.get(this.basePath, { asAdmin: true });
  }

  getAllRolesAsRegular(): Promise<Response> {
    return this.get(this.basePath, { asAdmin: false });
  }

  getAllPermissions(): Promise<Response> {
    return this.get(`${this.basePath}/permissions`, { asAdmin: true });
  }

  getRoleById(id: string): Promise<Response> {
    return this.get(`${this.basePath}/${id}`, { asAdmin: true });
  }

  updateRole(id: string, data: Record<string, unknown>): Promise<Response> {
    return this.put(`${this.basePath}/${id}`, data, { asAdmin: true });
  }

  updateRoleAsRegular(
    id: string,
    data: Record<string, unknown>,
  ): Promise<Response> {
    return this.put(`${this.basePath}/${id}`, data, { asAdmin: false });
  }

  deleteRole(id: string): Promise<Response> {
    return this.delete(`${this.basePath}/${id}`, { asAdmin: true });
  }

  deleteRoleAsRegular(id: string): Promise<Response> {
    return this.delete(`${this.basePath}/${id}`, { asAdmin: false });
  }
}

const test = new RolesE2ETest();

describe('Roles Module (E2E)', () => {
  describe('POST /api/v1/roles', () => {
    it('should create a role as admin', async () => {
      const response = await test.createRole({
        name: 'editor',
        description: 'Editor role',
        permissions: [test.testData.permissions[0]._id],
      });

      expect(response.status).toBe(201);
      const body = response.body as RoleResponse;
      expect(body).toHaveProperty('name', 'editor');
      expect(body).toHaveProperty('description', 'Editor role');
      test.setCreatedRoleId(body.id);
    });

    it('should fail to create role as regular user', async () => {
      const response = await test.createRoleAsRegular({
        name: 'viewer',
        permissions: [],
      });

      expect(response.status).toBe(403);
    });

    it('should fail without authentication', async () => {
      const response = await test.createRoleWithoutAuth({
        name: 'norole',
        permissions: [],
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/roles', () => {
    it('should get all roles as admin', async () => {
      const response = await test.getAllRoles();

      expect(response.status).toBe(200);
      const body = response.body as RoleResponse[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(2);
    });

    it('should fail to get roles as regular user', async () => {
      const response = await test.getAllRolesAsRegular();

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/v1/roles/permissions', () => {
    it('should get all permissions as admin', async () => {
      const response = await test.getAllPermissions();

      expect(response.status).toBe(200);
      const body = response.body as PermissionItem[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      expect(body[0]).toHaveProperty('name');
    });
  });

  describe('GET /api/v1/roles/:id', () => {
    it('should get a specific role as admin', async () => {
      const response = await test.getRoleById(test.testData.roles[0]._id);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'admin');
    });

    it('should return 404 for non-existent role', async () => {
      const response = await test.getRoleById('507f1f77bcf86cd799439011');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/v1/roles/:id', () => {
    it('should update a role as admin', async () => {
      const response = await test.updateRole(test.getCreatedRoleId(), {
        description: 'Updated editor role',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        'description',
        'Updated editor role',
      );
    });

    it('should fail to update role as regular user', async () => {
      const response = await test.updateRoleAsRegular(test.getCreatedRoleId(), {
        description: 'Hacked description',
      });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/roles/:id', () => {
    it('should fail to delete role as regular user', async () => {
      const response = await test.deleteRoleAsRegular(test.getCreatedRoleId());

      expect(response.status).toBe(403);
    });

    it('should delete a role as admin', async () => {
      const response = await test.deleteRole(test.getCreatedRoleId());

      expect(response.status).toBe(204);
    });

    it('should return 404 when deleting non-existent role', async () => {
      const response = await test.deleteRole('507f1f77bcf86cd799439011');

      expect(response.status).toBe(404);
    });
  });
});
