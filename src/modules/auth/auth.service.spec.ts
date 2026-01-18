import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from './schemas/user.schema';
import { Role } from './schemas/role.schema';
import * as bcrypt from 'bcryptjs';

const mockPermission = {
  _id: 'perm-1',
  name: 'dashboard:canView',
  description: 'View dashboards',
  toString: () => 'perm-1',
};

const mockRole = {
  _id: 'role-1',
  name: 'user',
  description: 'Standard user',
  permissions: [mockPermission],
  toString: () => 'role-1',
};

const createMockUser = (overrides = {}) => ({
  _id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  password: '$2a$10$hashedpassword',
  roleId: mockRole,
  preferences: { theme: 'light', language: 'fr' },
  passwordChangedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  toString: () => 'user-1',
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let userModelMock: Record<string, ReturnType<typeof vi.fn>>;
  let roleModelMock: Record<string, ReturnType<typeof vi.fn>>;
  let jwtServiceMock: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    userModelMock = {
      findOne: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
    };

    roleModelMock = {
      findOne: vi.fn(),
    };

    jwtServiceMock = {
      sign: vi.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: userModelMock },
        { provide: getModelToken(Role.name), useValue: roleModelMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const newUser = createMockUser({
        email: 'newuser@example.com',
        username: 'newuser',
      });

      userModelMock.findOne.mockResolvedValue(null);
      roleModelMock.findOne.mockResolvedValue(mockRole);
      userModelMock.create.mockResolvedValue(newUser);
      userModelMock.findById.mockReturnValue({
        populate: vi.fn().mockReturnValue(newUser),
      });

      const registerDto = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'Password@123',
      };

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(userModelMock.findOne).toHaveBeenCalledWith({
        email: registerDto.email,
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      userModelMock.findOne.mockResolvedValue(createMockUser());

      const registerDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password@123',
      };

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Password@123', 10);
      const userWithPassword = createMockUser({ password: hashedPassword });

      userModelMock.findOne.mockResolvedValue(userWithPassword);
      userModelMock.findById.mockReturnValue({
        populate: vi.fn().mockReturnValue(userWithPassword),
      });

      const loginDto = {
        email: 'test@example.com',
        password: 'Password@123',
      };

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      userModelMock.findOne.mockResolvedValue(null);

      const loginDto = {
        email: 'invalid@example.com',
        password: 'Password@123',
      };

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword@123', 10);
      userModelMock.findOne.mockResolvedValue(
        createMockUser({ password: hashedPassword }),
      );

      const loginDto = {
        email: 'test@example.com',
        password: 'WrongPassword@123',
      };

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile for valid user id', async () => {
      const mockUser = createMockUser();
      userModelMock.findById.mockReturnValue({
        populate: vi.fn().mockReturnValue(mockUser),
      });

      const result = await service.getProfile('user-1');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException for invalid user id', async () => {
      userModelMock.findById.mockReturnValue({
        populate: vi.fn().mockReturnValue(null),
      });

      await expect(service.getProfile('invalid-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user for valid JWT payload', async () => {
      const mockUser = createMockUser();
      userModelMock.findById.mockReturnValue({
        populate: vi.fn().mockReturnValue(mockUser),
      });

      const payload = {
        sub: 'user-1',
        email: 'test@example.com',
        role: 'user',
      };

      const result = await service.validateUser(payload);

      expect(result).not.toBeNull();
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null for invalid user id', async () => {
      userModelMock.findById.mockReturnValue({
        populate: vi.fn().mockReturnValue(null),
      });

      const payload = {
        sub: 'invalid-id',
        email: 'test@example.com',
        role: 'user',
      };

      const result = await service.validateUser(payload);

      expect(result).toBeNull();
    });
  });
});
