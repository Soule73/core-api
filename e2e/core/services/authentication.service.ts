import type { INestApplication } from '@nestjs/common';
import type { Server } from 'http';
import request from 'supertest';
import type { IAuthenticator } from '../interfaces';

interface LoginResponse {
  token: string;
}

/**
 * Service responsible for handling authentication operations.
 * Implements Single Responsibility Principle - only handles auth.
 */
export class AuthenticationService implements IAuthenticator {
  private readonly loginEndpoint = '/api/v1/auth/login';
  private readonly logoutEndpoint = '/api/v1/auth/logout';

  async login(
    app: INestApplication,
    email: string,
    password: string,
  ): Promise<string> {
    const response = await request(app.getHttpServer() as Server)
      .post(this.loginEndpoint)
      .send({ email, password });

    if (response.status !== 200) {
      throw new Error(
        `Authentication failed for ${email}: ${response.status} - ${JSON.stringify(response.body)}`,
      );
    }

    const body = response.body as LoginResponse;
    if (!body.token) {
      throw new Error(`No token returned for ${email}`);
    }

    return body.token;
  }

  async logout(app: INestApplication, token: string): Promise<void> {
    await request(app.getHttpServer() as Server)
      .post(this.logoutEndpoint)
      .set('Authorization', `Bearer ${token}`);
  }
}
