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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
