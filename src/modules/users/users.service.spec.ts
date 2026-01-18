import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../auth/schemas/user.schema';
import { Role } from '../auth/schemas/role.schema';

const mockUserId = '507f1f77bcf86cd799439011';
const mockRoleId = '507f1f77bcf86cd799439012';

const mockUser = {
  _id: mockUserId,
  username: 'testuser',
  email: 'test@example.com',
  password: 'hashedPassword',
  roleId: mockRoleId,
  toObject: () => ({
    _id: mockUserId,
    username: 'testuser',
    email: 'test@example.com',
    roleId: mockRoleId,
  }),
};

const mockRole = {
  _id: mockRoleId,
  name: 'user',
  description: 'Standard user',
  permissions: [],
};

const mockUserModel = {
  findOne: vi.fn(),
  find: vi.fn(),
  findById: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  findByIdAndDelete: vi.fn(),
  create: vi.fn(),
};

const mockRoleModel = {
  findOne: vi.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Role.name), useValue: mockRoleModel },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const populatedUser = {
        ...mockUser,
        roleId: { ...mockRole, permissions: [] },
      };
      mockUserModel.findOne.mockResolvedValue(null);
      mockRoleModel.findOne.mockResolvedValue(mockRole);
      mockUserModel.create.mockResolvedValue(mockUser);
      mockUserModel.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(populatedUser),
      });

      const result = await service.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result).toHaveProperty('_id');
      expect(result.email).toBe('test@example.com');
      expect(mockUserModel.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);

      await expect(
        service.create({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const populatedUser = {
        ...mockUser,
        roleId: { ...mockRole, permissions: [] },
      };
      mockUserModel.find.mockReturnValue({
        populate: vi.fn().mockResolvedValue([populatedUser]),
      });

      const result = await service.findAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const populatedUser = {
        ...mockUser,
        roleId: { ...mockRole, permissions: [] },
      };
      mockUserModel.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(populatedUser),
      });

      const result = await service.findOne(mockUserId);

      expect(result).toHaveProperty('_id');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('invalidId')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      const updatedUser = { ...mockUser, username: 'updateduser' };
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          ...updatedUser,
          roleId: { ...mockRole, permissions: [] },
        }),
      });

      const result = await service.update(mockUserId, {
        username: 'updateduser',
      });

      expect(result.username).toBe('updateduser');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(
        service.update('invalidId', { username: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if email already in use', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockUserModel.findOne.mockResolvedValue({ ...mockUser, _id: 'otherId' });

      await expect(
        service.update(mockUserId, { email: 'other@example.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a user successfully', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockUserModel.findByIdAndDelete.mockResolvedValue(mockUser);

      await expect(service.remove(mockUserId)).resolves.not.toThrow();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.remove('invalidId')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
