import type { INestApplication } from '@nestjs/common';
import type { Model, Document, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import type { IDataSeeder, TestDataSet } from '../interfaces';

interface PermissionDoc extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
}

interface RoleDoc extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  permissions: string[];
}

interface UserDoc extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  roleId: Types.ObjectId;
  isActive: boolean;
}

/**
 * Service responsible for seeding and cleaning test data.
 * Implements Single Responsibility Principle - only handles data seeding.
 */
export class DataSeederService implements IDataSeeder {
  private static readonly ALL_PERMISSIONS = [
    'user:canCreate',
    'user:canView',
    'user:canUpdate',
    'user:canDelete',
    'role:canCreate',
    'role:canView',
    'role:canUpdate',
    'role:canDelete',
    'dashboard:canCreate',
    'dashboard:canView',
    'dashboard:canUpdate',
    'dashboard:canDelete',
    'widget:canCreate',
    'widget:canView',
    'widget:canUpdate',
    'widget:canDelete',
    'datasource:canCreate',
    'datasource:canView',
    'datasource:canUpdate',
    'datasource:canDelete',
  ];

  private static readonly USER_PERMISSIONS = [
    'dashboard:canCreate',
    'dashboard:canView',
    'dashboard:canUpdate',
    'dashboard:canDelete',
    'widget:canCreate',
    'widget:canView',
    'widget:canUpdate',
    'widget:canDelete',
    'datasource:canCreate',
    'datasource:canView',
    'datasource:canUpdate',
    'datasource:canDelete',
  ];

  private static readonly DEFAULT_PASSWORD = 'Password123';

  async seed(app: INestApplication): Promise<TestDataSet> {
    const models = this.getModels(app);
    await this.clearData(models);

    const permissions = await this.createPermissions(models.permission);
    const { adminRole, userRole } = await this.createRoles(
      models.role,
      permissions,
    );
    const { adminUser, regularUser } = await this.createUsers(
      models.user,
      adminRole._id,
      userRole._id,
    );

    return this.buildTestDataSet(
      permissions,
      adminRole,
      userRole,
      adminUser,
      regularUser,
    );
  }

  async cleanup(app: INestApplication): Promise<void> {
    const modelNames = [
      'AIConversation',
      'Widget',
      'Dashboard',
      'DataSource',
      'User',
      'Role',
      'Permission',
    ];

    for (const modelName of modelNames) {
      try {
        const model = app.get<Model<Document>>(getModelToken(modelName));
        await model.deleteMany({});
      } catch {
        // Model not registered, skip
      }
    }
  }

  private getModels(app: INestApplication) {
    return {
      permission: app.get<Model<PermissionDoc>>(getModelToken('Permission')),
      role: app.get<Model<RoleDoc>>(getModelToken('Role')),
      user: app.get<Model<UserDoc>>(getModelToken('User')),
    };
  }

  private async clearData(models: {
    permission: Model<PermissionDoc>;
    role: Model<RoleDoc>;
    user: Model<UserDoc>;
  }): Promise<void> {
    await Promise.all([
      models.permission.deleteMany({}),
      models.role.deleteMany({}),
      models.user.deleteMany({}),
    ]);
  }

  private async createPermissions(
    model: Model<PermissionDoc>,
  ): Promise<Array<{ _id: string; name: string }>> {
    const permissions: Array<{ _id: string; name: string }> = [];

    for (const name of DataSeederService.ALL_PERMISSIONS) {
      const perm = await model.create({ name, description: name });
      permissions.push({ _id: String(perm._id), name: perm.name });
    }

    return permissions;
  }

  private async createRoles(
    model: Model<RoleDoc>,
    permissions: Array<{ _id: string; name: string }>,
  ) {
    const adminPermissionIds = permissions.map((p) => p._id);
    const userPermissionIds = permissions
      .filter((p) => DataSeederService.USER_PERMISSIONS.includes(p.name))
      .map((p) => p._id);

    const adminRole = await model.create({
      name: 'admin',
      description: 'Administrator with full access',
      permissions: adminPermissionIds,
    });

    const userRole = await model.create({
      name: 'user',
      description: 'Regular user',
      permissions: userPermissionIds,
    });

    return { adminRole, userRole };
  }

  private async createUsers(
    model: Model<UserDoc>,
    adminRoleId: Types.ObjectId,
    userRoleId: Types.ObjectId,
  ) {
    const hashedPassword = await bcrypt.hash(
      DataSeederService.DEFAULT_PASSWORD,
      10,
    );

    const adminUser = await model.create({
      username: 'testadmin',
      email: 'admin@test.com',
      password: hashedPassword,
      roleId: adminRoleId,
      isActive: true,
    });

    const regularUser = await model.create({
      username: 'testuser',
      email: 'user@test.com',
      password: hashedPassword,
      roleId: userRoleId,
      isActive: true,
    });

    return { adminUser, regularUser };
  }

  private buildTestDataSet(
    permissions: Array<{ _id: string; name: string }>,
    adminRole: RoleDoc,
    userRole: RoleDoc,
    adminUser: UserDoc,
    regularUser: UserDoc,
  ): TestDataSet {
    return {
      permissions,
      roles: [
        {
          _id: String(adminRole._id),
          name: adminRole.name,
          permissions: adminRole.permissions,
        },
        {
          _id: String(userRole._id),
          name: userRole.name,
          permissions: userRole.permissions,
        },
      ],
      adminUser: {
        _id: String(adminUser._id),
        username: adminUser.username,
        email: adminUser.email,
        password: DataSeederService.DEFAULT_PASSWORD,
        roleId: String(adminUser.roleId),
      },
      regularUser: {
        _id: String(regularUser._id),
        username: regularUser.username,
        email: regularUser.email,
        password: DataSeederService.DEFAULT_PASSWORD,
        roleId: String(regularUser.roleId),
      },
    };
  }
}
