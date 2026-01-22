import type { INestApplication } from '@nestjs/common';
import type { Server } from 'http';

export interface UserCredentials {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  token: string;
  roleId: string;
}

export interface TestDataSet {
  permissions: Array<{ _id: string; name: string }>;
  roles: Array<{ _id: string; name: string; permissions: string[] }>;
  adminUser: UserCredentials & {
    _id: string;
    username: string;
    roleId: string;
  };
  regularUser: UserCredentials & {
    _id: string;
    username: string;
    roleId: string;
  };
}

export interface ITestContext {
  readonly app: INestApplication;
  readonly httpServer: Server;
  readonly testData: TestDataSet;
  readonly adminToken: string;
  readonly userToken: string;
  readonly isReady: boolean;
}
