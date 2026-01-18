import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Role } from '../auth/schemas/role.schema';
import { Permission } from '../auth/schemas/permission.schema';

const mockRoleId = '507f1f77bcf86cd799439011';
const mockPermissionId = '507f1f77bcf86cd799439012';

const mockPermission = {
  _id: mockPermissionId,
  name: 'user:canView',
  description: 'View users',
};

const mockRole = {
  _id: mockRoleId,
  name: 'admin',
  description: 'Administrator role',
  permissions: [mockPermissionId],
};

const mockPopulatedRole = {
  ...mockRole,
  permissions: [mockPermission],
};

const mockRoleModel = {
  findOne: vi.fn(),
  find: vi.fn(),
  findById: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  findByIdAndDelete: vi.fn(),
  create: vi.fn(),
};

const mockPermissionModel = {
  find: vi.fn(),
};

describe('RolesService', () => {
  let service: RolesService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: getModelToken(Role.name), useValue: mockRoleModel },
        {
          provide: getModelToken(Permission.name),
          useValue: mockPermissionModel,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  describe('create', () => {
    it('should create a new role successfully', async () => {
      mockRoleModel.findOne.mockResolvedValue(null);
      mockRoleModel.create.mockResolvedValue(mockRole);
      mockRoleModel.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockPopulatedRole),
      });

      const result = await service.create({
        name: 'admin',
        description: 'Administrator role',
        permissions: [mockPermissionId],
      });

      expect(result).toHaveProperty('_id');
      expect(result.name).toBe('admin');
      expect(mockRoleModel.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if role name exists', async () => {
      mockRoleModel.findOne.mockResolvedValue(mockRole);

      await expect(
        service.create({
          name: 'admin',
          description: 'Test',
          permissions: [],
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all roles', async () => {
      mockRoleModel.find.mockReturnValue({
        populate: vi.fn().mockResolvedValue([mockPopulatedRole]),
      });

      const result = await service.findAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('admin');
    });
  });

  describe('findOne', () => {
    it('should return a role by id', async () => {
      mockRoleModel.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockPopulatedRole),
      });

      const result = await service.findOne(mockRoleId);

      expect(result).toHaveProperty('_id');
      expect(result.name).toBe('admin');
    });

    it('should throw NotFoundException if role not found', async () => {
      mockRoleModel.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('invalidId')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a role successfully', async () => {
      const updatedRole = { ...mockPopulatedRole, description: 'Updated' };
      mockRoleModel.findById.mockResolvedValue(mockRole);
      mockRoleModel.findByIdAndUpdate.mockReturnValue({
        populate: vi.fn().mockResolvedValue(updatedRole),
      });

      const result = await service.update(mockRoleId, {
        description: 'Updated',
      });

      expect(result.description).toBe('Updated');
    });

    it('should throw NotFoundException if role not found', async () => {
      mockRoleModel.findById.mockResolvedValue(null);

      await expect(
        service.update('invalidId', { description: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new name already exists', async () => {
      mockRoleModel.findById.mockResolvedValue(mockRole);
      mockRoleModel.findOne.mockResolvedValue({ ...mockRole, _id: 'otherId' });

      await expect(
        service.update(mockRoleId, { name: 'existingRole' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a role successfully', async () => {
      mockRoleModel.findByIdAndDelete.mockResolvedValue(mockRole);

      await expect(service.remove(mockRoleId)).resolves.not.toThrow();
    });

    it('should throw NotFoundException if role not found', async () => {
      mockRoleModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.remove('invalidId')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllPermissions', () => {
    it('should return all permissions', async () => {
      mockPermissionModel.find.mockResolvedValue([mockPermission]);

      const result = await service.findAllPermissions();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('user:canView');
    });
  });
});
