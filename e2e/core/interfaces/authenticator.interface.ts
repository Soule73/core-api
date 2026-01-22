import type { INestApplication } from '@nestjs/common';

export interface IAuthenticator {
  login(
    app: INestApplication,
    email: string,
    password: string,
  ): Promise<string>;
  logout(app: INestApplication, token: string): Promise<void>;
}
