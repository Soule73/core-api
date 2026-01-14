import { beforeAll, afterAll } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { createTestApp, closeTestApp, clearDatabase } from './helpers';

let app: INestApplication;

beforeAll(async () => {
  app = await createTestApp();
  await clearDatabase(app);
});

afterAll(async () => {
  await closeTestApp(app);
});

export { app };
