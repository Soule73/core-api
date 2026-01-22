import type { INestApplication } from '@nestjs/common';
import type { TestDataSet } from './test-context.interface';

export interface IDataSeeder {
  seed(app: INestApplication): Promise<TestDataSet>;
  cleanup(app: INestApplication): Promise<void>;
}
