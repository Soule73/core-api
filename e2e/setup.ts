import { beforeAll, afterAll } from 'vitest';
import { TestContext } from './core';

// Ensure ENCRYPTION_KEY is set for E2E tests (32 zero bytes = 64 hex chars)
if (!process.env.ENCRYPTION_KEY) {
  process.env.ENCRYPTION_KEY =
    '0000000000000000000000000000000000000000000000000000000000000000';
}

process.env.R2_ACCOUNT_ID = '';
process.env.R2_ACCESS_KEY_ID = '';
process.env.R2_SECRET_ACCESS_KEY = '';
process.env.R2_BUCKET_NAME = '';

/**
 * Global E2E test setup file.
 * Initializes the TestContext singleton before all tests
 * and destroys it after all tests complete.
 */
beforeAll(async () => {
  const context = TestContext.getInstance();
  await context.initialize();
});

afterAll(async () => {
  const context = TestContext.getInstance();
  await context.destroy();
});
