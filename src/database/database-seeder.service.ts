import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  Permission,
  PermissionDocument,
} from '../modules/auth/schemas/permission.schema';
import { Role, RoleDocument } from '../modules/auth/schemas/role.schema';
import { User, UserDocument } from '../modules/auth/schemas/user.schema';

const PERMISSIONS_DATA = [
  { name: 'user:canView', description: 'View users' },
  { name: 'user:canCreate', description: 'Create a user' },
  { name: 'user:canUpdate', description: 'Update a user' },
  { name: 'user:canDelete', description: 'Delete a user' },

  { name: 'dashboard:canView', description: 'View dashboards' },
  { name: 'dashboard:canCreate', description: 'Create a dashboard' },
  { name: 'dashboard:canUpdate', description: 'Update a dashboard' },
  { name: 'dashboard:canDelete', description: 'Delete a dashboard' },

  { name: 'widget:canView', description: 'View widgets' },
  { name: 'widget:canCreate', description: 'Create a widget' },
  { name: 'widget:canUpdate', description: 'Update a widget' },
  { name: 'widget:canDelete', description: 'Delete a widget' },

  { name: 'datasource:canView', description: 'View data sources' },
  { name: 'datasource:canCreate', description: 'Create a data source' },
  {
    name: 'datasource:canUpdate',
    description: 'Update a data source',
  },
  {
    name: 'datasource:canDelete',
    description: 'Delete a data source',
  },

  { name: 'role:canView', description: 'View roles' },
  { name: 'role:canCreate', description: 'Create a role' },
  { name: 'role:canUpdate', description: 'Update a role' },
  { name: 'role:canDelete', description: 'Delete a role' },
];

/**
 * Service responsible for seeding the database with initial data in development mode.
 * Initializes permissions, roles (admin/user), and a default admin user.
 */
@Injectable()
export class DatabaseSeederService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeederService.name);

  constructor(
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<PermissionDocument>,
    @InjectModel(Role.name)
    private readonly roleModel: Model<RoleDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {
    /** */
  }

  async onModuleInit(): Promise<void> {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');

    if (nodeEnv === 'development') {
      this.logger.log('Development mode detected - initializing seed data...');
      await this.seedDatabase();
    }
  }

  private async seedDatabase(): Promise<void> {
    await this.seedPermissions();
    await this.seedRoles();
    await this.seedAdminUser();
    this.logger.log('Database seeding completed successfully');
  }

  private async seedPermissions(): Promise<void> {
    for (const perm of PERMISSIONS_DATA) {
      await this.permissionModel.updateOne(
        { name: perm.name },
        { $set: perm },
        { upsert: true },
      );
    }
    this.logger.log(`Seeded ${PERMISSIONS_DATA.length} permissions`);
  }

  private async seedRoles(): Promise<void> {
    const allPerms = await this.permissionModel.find({});
    const adminPermIds = allPerms.map((p) => p._id);
    const userPermIds = allPerms
      .filter((p) => !p.name.startsWith('user:') && !p.name.startsWith('role:'))
      .map((p) => p._id);

    await this.roleModel.updateOne(
      { name: 'admin' },
      {
        $set: {
          name: 'admin',
          description: 'Administrator (all rights)',
          permissions: adminPermIds,
        },
      },
      { upsert: true },
    );

    await this.roleModel.updateOne(
      { name: 'user' },
      {
        $set: {
          name: 'user',
          description: 'Standard user',
          permissions: userPermIds,
        },
      },
      { upsert: true },
    );

    this.logger.log('Seeded admin and user roles');
  }

  private async seedAdminUser(): Promise<void> {
    const existingAdmin = await this.userModel.findOne({
      $or: [{ username: 'admin' }, { email: 'admin@customdash.com' }],
    });

    if (existingAdmin) {
      this.logger.log('Admin user already exists - skipping');
      return;
    }

    const adminRole = await this.roleModel.findOne({ name: 'admin' });
    if (!adminRole) {
      this.logger.warn('Admin role not found - cannot create admin user');
      return;
    }

    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    await this.userModel.create({
      username: 'admin',
      email: 'admin@customdash.com',
      password: hashedPassword,
      roleId: adminRole._id,
    });

    this.logger.log('Created default admin user (admin@customdash.com)');
  }
}
