import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { BaseE2ETest } from '@e2e/base';
import { UserResponse, AuthResponse } from '@core/modules/auth/interfaces';

/**
 * E2E test class for Authentication module.
 * Tests registration, login, and profile endpoints.
 */
class AuthE2ETest extends BaseE2ETest {
  private readonly basePath = '/api/v1/auth';

  registerUser(data: {
    username: string;
    email: string;
    password: string;
  }): Promise<request.Response> {
    return this.post(`${this.basePath}/register`, data, { useAuth: false });
  }

  loginUser(email: string, password: string): Promise<request.Response> {
    return this.post(
      `${this.basePath}/login`,
      { email, password },
      { useAuth: false },
    );
  }

  getProfile(): Promise<request.Response> {
    return this.get(`${this.basePath}/profile`, { asAdmin: true });
  }

  getProfileWithToken(token: string): Promise<request.Response> {
    return request(this.server)
      .get(`${this.basePath}/profile`)
      .set('Authorization', `Bearer ${token}`);
  }

  getProfileWithoutAuth(): Promise<request.Response> {
    return this.get(`${this.basePath}/profile`, { useAuth: false });
  }
}

const test = new AuthE2ETest();

describe('Auth Module (E2E)', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await test.registerUser({
        username: 'authNewUser',
        email: 'authnewuser@test.com',
        password: 'Password123',
      });

      expect(response.status).toBe(201);
      const body = response.body as AuthResponse;
      expect(body).toHaveProperty('token');
      expect(body).toHaveProperty('user');
      expect(body.user).toHaveProperty('email', 'authnewuser@test.com');
      expect(body.user).not.toHaveProperty('password');
    });

    it('should fail with invalid email', async () => {
      const response = await test.registerUser({
        username: 'testuser2',
        email: 'invalid-email',
        password: 'Password123',
      });

      expect(response.status).toBe(400);
    });

    it('should fail with weak password', async () => {
      const response = await test.registerUser({
        username: 'testuser3',
        email: 'test3@test.com',
        password: 'weak',
      });

      expect(response.status).toBe(400);
    });

    it('should fail with duplicate email', async () => {
      const response = await test.registerUser({
        username: 'duplicate',
        email: test.testData.adminUser.email,
        password: 'Password123',
      });

      expect(response.status).toBe(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const { email, password } = test.testData.adminUser;
      const response = await test.loginUser(email, password);

      expect(response.status).toBe(200);
      const body = response.body as AuthResponse;
      expect(body).toHaveProperty('token');
      expect(body).toHaveProperty('user');
      expect(body.user).toHaveProperty('email', email);
    });

    it('should fail with invalid password', async () => {
      const response = await test.loginUser(
        test.testData.adminUser.email,
        'WrongPassword123',
      );

      expect(response.status).toBe(401);
    });

    it('should fail with non-existent email', async () => {
      const response = await test.loginUser(
        'nonexistent@test.com',
        'Password123',
      );

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should get profile with valid token', async () => {
      const response = await test.getProfile();

      expect(response.status).toBe(200);
      const body = response.body as UserResponse;
      expect(body).toHaveProperty('email', test.testData.adminUser.email);
      expect(body).toHaveProperty('username', test.testData.adminUser.username);
    });

    it('should fail without token', async () => {
      const response = await test.getProfileWithoutAuth();

      expect(response.status).toBe(401);
    });

    it('should fail with invalid token', async () => {
      const response = await test.getProfileWithToken('invalid-token');

      expect(response.status).toBe(401);
    });
  });
});
