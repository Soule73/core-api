import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth';
import { UsersModule } from './modules/users';
import { RolesModule } from './modules/roles';
import { DashboardsModule } from './modules/dashboards';
import { WidgetsModule } from './modules/widgets';
import { DataSourcesModule } from './modules/datasources';
import { AIConversationsModule } from './modules/ai-conversations';
import { ProcessingModule } from './modules/processing';
import { AIModule } from './modules/ai';
import { databaseConfig, jwtConfig, redisConfig, appConfig } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig, jwtConfig, redisConfig, appConfig],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('database.uri'),
        dbName: config.get<string>('database.dbName'),
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 60,
      },
    ]),
    DatabaseModule,
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
})
export class AppModule {
  /** */
}
