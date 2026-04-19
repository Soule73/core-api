import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe, type Type } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import express from 'express';
import path from 'path';
import type { Request, Response } from 'express';

const expressApp = express();

/**
 * Bootstraps the NestJS application using the Express adapter.
 * The promise is cached at module level so the initialization runs only
 * once per serverless function instance (warm starts reuse it).
 *
 * AppModule is loaded via a dynamic require so esbuild does not attempt
 * to bundle the pre-compiled dist/ output. The path is resolved from
 * process.cwd() (/var/task on Vercel) where includeFiles places dist/.
 */
const bootstrapPromise = (async () => {
  const appModulePath = path.join(process.cwd(), 'dist', 'app.module');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { AppModule } = require(appModulePath) as {
    AppModule: Type<unknown>;
  };
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    { logger: ['error', 'warn', 'log'] },
  );

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get<string[]>('app.corsOrigins'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1');

  await app.init();
})();

/**
 * Vercel serverless function handler.
 * Waits for NestJS initialization on cold start, then delegates to Express.
 */
export default async function handler(req: Request, res: Response) {
  await bootstrapPromise;
  expressApp(req, res);
}
