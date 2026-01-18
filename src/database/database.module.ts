import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Permission,
  PermissionSchema,
} from '../modules/auth/schemas/permission.schema';
import { Role, RoleSchema } from '../modules/auth/schemas/role.schema';
import { User, UserSchema } from '../modules/auth/schemas/user.schema';
import { DatabaseSeederService } from './database-seeder.service';

/**
 * Module responsible for database seeding operations.
 * Provides the DatabaseSeederService which initializes permissions, roles, and admin user.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Permission.name, schema: PermissionSchema },
      { name: Role.name, schema: RoleSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [DatabaseSeederService],
  exports: [DatabaseSeederService],
})
export class DatabaseModule {
  /**  */
}
