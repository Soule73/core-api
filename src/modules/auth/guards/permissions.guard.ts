import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request } from 'express';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';
import { User, UserDocument } from '../schemas/user.schema';

interface AuthUser {
  id: string;
  email: string;
  role: string;
}

interface RequestWithUser extends Request {
  user: AuthUser;
}

interface PopulatedPermission {
  _id: string;
  name: string;
}

interface PopulatedRole {
  _id: string;
  name: string;
  permissions: PopulatedPermission[];
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authUser: AuthUser | undefined = request.user;

    if (!authUser) {
      throw new ForbiddenException('User not authenticated');
    }

    const user = await this.userModel.findById(authUser.id).populate({
      path: 'roleId',
      populate: { path: 'permissions' },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const role = user.roleId as unknown as PopulatedRole;
    if (!role || !role.permissions) {
      throw new ForbiddenException('User has no permissions');
    }

    const userPermissions = role.permissions.map((p) => p.name);
    const hasAllPermissions = requiredPermissions.every((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
