import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import express from 'express';
import type { Request, Response } from 'express';
import { AppModule } from '../src/app.module.js';

const expressApp = express();

/**
 * Bootstraps the NestJS application using the Express adapter.
 * The promise is cached at module level so the initialization runs only
 * once per serverless function instance (warm starts reuse it).
 */
const bootstrapPromise = (async () => {
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
