import type { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@core/modules/auth';
import { UsersModule } from '@core/modules/users';
import { RolesModule } from '@core/modules/roles';
import { DashboardsModule } from '@core/modules/dashboards';
import { WidgetsModule } from '@core/modules/widgets';
import { DataSourcesModule } from '@core/modules/datasources';
import { AIConversationsModule } from '@core/modules/ai-conversations';
import { ProcessingModule } from '@core/modules/processing';
import { AppController } from '@core/app.controller';
import { AppService } from '@core/app.service';
import type { IAppFactory } from '../interfaces';
import * as path from 'path';

/**
 * Factory class responsible for creating and destroying NestJS test applications.
 * Uses MongoDB Memory Server for isolated database testing.
 * Implements Single Responsibility Principle - only handles app lifecycle.
 */
export class NestAppFactory implements IAppFactory {
  private mongod: MongoMemoryServer | null = null;

  async create(): Promise<INestApplication> {
    this.mongod = await MongoMemoryServer.create();
    const mongoUri = this.mongod.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: path.resolve(__dirname, '../../../.env.test'),
          load: [
            () => ({
              MONGODB_URI: mongoUri,
            }),
          ],
        }),
        MongooseModule.forRoot(mongoUri),
        AuthModule,
        UsersModule,
        RolesModule,
        DashboardsModule,
        WidgetsModule,
        DataSourcesModule,
        AIConversationsModule,
        ProcessingModule,
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
    if (this.mongod) {
      await this.mongod.stop();
      this.mongod = null;
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
