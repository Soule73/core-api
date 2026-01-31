import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DataSourcesController } from './datasources.controller';
import { DataSourcesService } from './datasources.service';
import { DataSource, DataSourceSchema } from './schemas/datasource.schema';
import { AuthModule } from '../auth/auth.module';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { WidgetsModule } from '../widgets/widgets.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DataSource.name, schema: DataSourceSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
    WidgetsModule,
  ],
  controllers: [DataSourcesController],
  providers: [DataSourcesService],
  exports: [DataSourcesService],
})
export class DataSourcesModule {
  /** */
}
