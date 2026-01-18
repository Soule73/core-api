import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../../src/modules/auth';
import { UsersModule } from '../../src/modules/users';
import { RolesModule } from '../../src/modules/roles';
import { DashboardsModule } from '../../src/modules/dashboards';
import { WidgetsModule } from '../../src/modules/widgets';
import { DataSourcesModule } from '../../src/modules/datasources';
import { AIConversationsModule } from '../../src/modules/ai-conversations';
import { AppController } from '../../src/app.controller';
import { AppService } from '../../src/app.service';

let mongod: MongoMemoryServer;

export async function createTestApp(): Promise<INestApplication> {
  mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [
          () => ({
            MONGODB_URI: mongoUri,
            JWT_SECRET: 'test-secret-key-for-e2e-tests',
            JWT_EXPIRATION: 604800,
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
    ],
    controllers: [AppController],
    providers: [AppService],
  }).compile();

  const app = moduleFixture.createNestApplication();

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
    .setDescription(
      'Main API for managing dashboards, widgets, data sources and authentication',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained via /api/v1/auth/login',
      },
      'JWT-auth',
    )
    .addTag('Health', 'Health check endpoints')
    .addTag('Auth', 'Authentication and user management')
    .addTag('Dashboards', 'Dashboard management')
    .addTag('Widgets', 'Widget management')
    .addTag('Data Sources', 'Data source management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.init();

  return app;
}

export async function closeTestApp(app: INestApplication): Promise<void> {
  if (app) {
    await app.close();
  }
  if (mongod) {
    await mongod.stop();
  }
}
