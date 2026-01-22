import type { INestApplication } from '@nestjs/common';

export interface IAppFactory {
  create(): Promise<INestApplication>;
  destroy(app: INestApplication): Promise<void>;
}
