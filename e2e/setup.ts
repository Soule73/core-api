import { beforeAll, afterAll } from 'vitest';
import { TestContext } from './core';

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
