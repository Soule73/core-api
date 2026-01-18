import type { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import type { Model, Document, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';

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

export interface TestUserData {
  _id: string;
  username: string;
  email: string;
  password: string;
  roleId: string;
}

export interface TestRoleData {
  _id: string;
  name: string;
  permissions: string[];
}

export interface TestPermissionData {
  _id: string;
  name: string;
}

export interface SeedData {
  permissions: TestPermissionData[];
  roles: TestRoleData[];
  adminUser: TestUserData;
  regularUser: TestUserData;
}

const ALL_PERMISSIONS = [
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

const USER_PERMISSIONS = [
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

export async function seedTestData(app: INestApplication): Promise<SeedData> {
  const PermissionModel = app.get<Model<PermissionDoc>>(
    getModelToken('Permission'),
  );
  const RoleModel = app.get<Model<RoleDoc>>(getModelToken('Role'));
  const UserModel = app.get<Model<UserDoc>>(getModelToken('User'));

  await PermissionModel.deleteMany({});
  await RoleModel.deleteMany({});
  await UserModel.deleteMany({});

  const permissions: TestPermissionData[] = [];
  for (const name of ALL_PERMISSIONS) {
    const perm = await PermissionModel.create({ name, description: name });
    permissions.push({
      _id: String(perm._id),
      name: perm.name,
    });
  }

  const adminPermissionIds = permissions.map((p) => p._id);
  const userPermissionIds = permissions
    .filter((p) => USER_PERMISSIONS.includes(p.name))
    .map((p) => p._id);

  const adminRole = await RoleModel.create({
    name: 'admin',
    description: 'Administrator with full access',
    permissions: adminPermissionIds,
  });

  const userRole = await RoleModel.create({
    name: 'user',
    description: 'Regular user',
    permissions: userPermissionIds,
  });

  const hashedPassword = await bcrypt.hash('Password123', 10);

  const adminUser = await UserModel.create({
    username: 'testadmin',
    email: 'admin@test.com',
    password: hashedPassword,
    roleId: adminRole._id,
    isActive: true,
  });

  const regularUser = await UserModel.create({
    username: 'testuser',
    email: 'user@test.com',
    password: hashedPassword,
    roleId: userRole._id,
    isActive: true,
  });

  return {
    permissions,
    roles: [
      {
        _id: String(adminRole._id),
        name: adminRole.name,
        permissions: adminPermissionIds,
      },
      {
        _id: String(userRole._id),
        name: userRole.name,
        permissions: userPermissionIds,
      },
    ],
    adminUser: {
      _id: String(adminUser._id),
      username: adminUser.username,
      email: adminUser.email,
      password: 'Password123',
      roleId: String(adminRole._id),
    },
    regularUser: {
      _id: String(regularUser._id),
      username: regularUser.username,
      email: regularUser.email,
      password: 'Password123',
      roleId: String(userRole._id),
    },
  };
}

export async function cleanupTestData(app: INestApplication): Promise<void> {
  const models = [
    'AIConversation',
    'Widget',
    'Dashboard',
    'DataSource',
    'User',
    'Role',
    'Permission',
  ];

  for (const modelName of models) {
    try {
      const model = app.get<Model<unknown>>(getModelToken(modelName));
      await model.deleteMany({});
    } catch {
      // Model not registered
    }
  }
}
