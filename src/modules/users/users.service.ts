import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Role, RoleDocument } from '../auth/schemas/role.schema';
import { CreateUserDto, UpdateUserDto } from './dto';
import {
  UserResponse,
  RoleResponse,
  PermissionResponse,
} from '../../common/interfaces';

interface PopulatedPermission {
  _id: string;
  name: string;
  description?: string;
}

interface PopulatedRole {
  _id: string;
  name: string;
  description?: string;
  permissions: PopulatedPermission[];
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponse> {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    let roleId = createUserDto.roleId;
    if (!roleId) {
      const defaultRole = await this.roleModel.findOne({ name: 'user' });
      roleId = defaultRole?._id?.toString();
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.userModel.create({
      username: createUserDto.username,
      email: createUserDto.email,
      password: hashedPassword,
      roleId,
    });

    return this.buildUserResponse(user);
  }

  async findAll(): Promise<UserResponse[]> {
    const users = await this.userModel.find().populate({
      path: 'roleId',
      populate: { path: 'permissions' },
    });

    return users.map((user) => this.buildUserResponseFromPopulated(user));
  }

  async findOne(id: string): Promise<UserResponse> {
    const user = await this.userModel.findById(id).populate({
      path: 'roleId',
      populate: { path: 'permissions' },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.buildUserResponseFromPopulated(user);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userModel.findOne({
        email: updateUserDto.email,
      });
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    const updateData: Record<string, unknown> = {};

    if (updateUserDto.username) updateData.username = updateUserDto.username;
    if (updateUserDto.email) updateData.email = updateUserDto.email;
    if (updateUserDto.roleId) updateData.roleId = updateUserDto.roleId;
    if (updateUserDto.preferences)
      updateData.preferences = updateUserDto.preferences;

    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
      updateData.passwordChangedAt = new Date();
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate({ path: 'roleId', populate: { path: 'permissions' } });

    return this.buildUserResponseFromPopulated(updatedUser!);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  private async buildUserResponse(user: UserDocument): Promise<UserResponse> {
    const populatedUser = await this.userModel.findById(user._id).populate({
      path: 'roleId',
      populate: { path: 'permissions' },
    });

    return this.buildUserResponseFromPopulated(populatedUser!);
  }

  private buildUserResponseFromPopulated(user: UserDocument): UserResponse {
    const role = user.roleId as unknown as PopulatedRole | null;

    let roleResponse: RoleResponse | null = null;
    if (role && typeof role === 'object' && 'name' in role) {
      const permissions: PermissionResponse[] = (role.permissions || []).map(
        (p) => ({
          id: p._id?.toString() || '',
          name: p.name,
          description: p.description,
        }),
      );

      roleResponse = {
        id: role._id?.toString() || '',
        name: role.name,
        description: role.description,
        permissions,
      };
    }

    return {
      _id: user._id.toString(),
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: roleResponse,
      preferences: user.preferences as { theme?: string; language?: string },
    };
  }
}
