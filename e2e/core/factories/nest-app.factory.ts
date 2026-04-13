import type { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '@core/modules/auth';
import { UsersModule } from '@core/modules/users';
import { RolesModule } from '@core/modules/roles';
import { DashboardsModule } from '@core/modules/dashboards';
import { WidgetsModule } from '@core/modules/widgets';
import { DataSourcesModule } from '@core/modules/datasources';
import { AIConversationsModule } from '@core/modules/ai-conversations';
import { ProcessingModule } from '@core/modules/processing';
import { AIModule } from '@core/modules/ai';
import { AppController } from '@core/app.controller';
import { AppService } from '@core/app.service';
import type { IAppFactory } from '../interfaces';
import * as path from 'path';

/**
 * Factory class responsible for creating and destroying NestJS test applications.
 * Uses real MongoDB instance from docker-compose.e2e.yml for E2E testing.
 * Implements Single Responsibility Principle - only handles app lifecycle.
 */
export class NestAppFactory implements IAppFactory {
  async create(): Promise<INestApplication> {
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27018/datavise_test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: path.resolve(__dirname, '../../../.env.test'),
          load: [
            () => ({
              MONGODB_URI: mongoUri,
              REDIS_HOST: process.env.REDIS_HOST || 'localhost',
              REDIS_PORT: process.env.REDIS_PORT || '6380',
              ELASTICSEARCH_URL:
                process.env.ELASTICSEARCH_URL || 'http://localhost:9201',
              JWT_SECRET:
                process.env.JWT_SECRET || 'test-jwt-secret-for-e2e-testing',
              JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
            }),
          ],
        }),
        MongooseModule.forRoot(mongoUri),
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 1000 }]),
        AuthModule,
        UsersModule,
        RolesModule,
        DashboardsModule,
        WidgetsModule,
        DataSourcesModule,
        AIConversationsModule,
        ProcessingModule,
        AIModule,
      ],
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    const app = moduleFixture.createNestApplication();
    this.configureApp(app);
    await app.init();

    return app;
  }

  async destroy(app: INestApplication): Promise<void> {
    if (app) {
      await app.close();
    }
  }

  private configureApp(app: INestApplication): void {
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.setGlobalPrefix('api/v1');

    const config = new DocumentBuilder()
      .setTitle('CustomDash Core API')
      .setDescription('E2E Test API')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }
}
