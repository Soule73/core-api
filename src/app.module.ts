import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
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
      }),
    }),
    DatabaseModule,
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
})
export class AppModule {
  /** */
}
