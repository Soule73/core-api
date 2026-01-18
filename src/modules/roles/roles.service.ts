import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role, RoleDocument } from '../auth/schemas/role.schema';
import {
  Permission,
  PermissionDocument,
} from '../auth/schemas/permission.schema';
import { CreateRoleDto, UpdateRoleDto } from './dto';
import { RoleResponse, PermissionResponse } from '../../common/interfaces';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Permission.name)
    private permissionModel: Model<PermissionDocument>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<RoleResponse> {
    const existingRole = await this.roleModel.findOne({
      name: createRoleDto.name,
    });
    if (existingRole) {
      throw new ConflictException('Role name already exists');
    }

    const permissionIds = (createRoleDto.permissions || []).map(
      (id) => new Types.ObjectId(id),
    );

    const role = await this.roleModel.create({
      name: createRoleDto.name,
      description: createRoleDto.description,
      permissions: permissionIds,
    });

    return this.buildRoleResponse(role);
  }

  async findAll(): Promise<RoleResponse[]> {
    const roles = await this.roleModel.find().populate('permissions');
    return roles.map((role) => this.buildRoleResponseFromPopulated(role));
  }

  async findOne(id: string): Promise<RoleResponse> {
    const role = await this.roleModel.findById(id).populate('permissions');
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return this.buildRoleResponseFromPopulated(role);
  }

  async update(
    id: string,
    updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponse> {
    const role = await this.roleModel.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.roleModel.findOne({
        name: updateRoleDto.name,
      });
      if (existingRole) {
        throw new ConflictException('Role name already exists');
      }
    }

    const updateData: Record<string, unknown> = {};
    if (updateRoleDto.name) updateData.name = updateRoleDto.name;
    if (updateRoleDto.description !== undefined)
      updateData.description = updateRoleDto.description;
    if (updateRoleDto.permissions) {
      updateData.permissions = updateRoleDto.permissions.map(
        (id) => new Types.ObjectId(id),
      );
    }

    const updatedRole = await this.roleModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('permissions');

    return this.buildRoleResponseFromPopulated(updatedRole!);
  }

  async remove(id: string): Promise<void> {
    const result = await this.roleModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Role not found');
    }
  }

  async findAllPermissions(): Promise<PermissionResponse[]> {
    const permissions = await this.permissionModel.find();
    return permissions.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      description: p.description,
    }));
  }

  private async buildRoleResponse(role: RoleDocument): Promise<RoleResponse> {
    const populatedRole = await this.roleModel
      .findById(role._id)
      .populate('permissions');
    return this.buildRoleResponseFromPopulated(populatedRole!);
  }

  private buildRoleResponseFromPopulated(role: RoleDocument): RoleResponse {
    const permissions = role.permissions as unknown as PermissionDocument[];

    return {
      _id: role._id.toString(),
      id: role._id.toString(),
      name: role.name,
      description: role.description,
      permissions: (permissions || []).map((p) => ({
        id: p._id?.toString() || '',
        name: p.name,
        description: p.description,
      })),
    };
  }
}
