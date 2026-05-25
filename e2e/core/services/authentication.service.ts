import type { INestApplication } from '@nestjs/common';
import type { Server } from 'http';
import request from 'supertest';
import type { IAuthenticator } from '../interfaces';

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

    const setCookieHeader = response.headers['set-cookie'] as
      | string[]
      | string
      | undefined;
    const cookies = Array.isArray(setCookieHeader)
      ? setCookieHeader
      : setCookieHeader
        ? [setCookieHeader]
        : [];

    for (const cookie of cookies) {
      const match = /session_id=([^;]+)/.exec(cookie);
      if (match) {
        return match[1];
      }
    }

    throw new Error(`No session_id cookie returned for ${email}`);
  }

  async logout(app: INestApplication, sessionId: string): Promise<void> {
    await request(app.getHttpServer() as Server)
      .post(this.logoutEndpoint)
      .set('Cookie', `session_id=${sessionId}`);
  }
}
