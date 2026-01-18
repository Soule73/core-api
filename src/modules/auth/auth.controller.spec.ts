import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { AuthUser, AuthResponse, UserResponse } from './interfaces';

const mockUser: UserResponse = {
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  role: {
    id: 'role-1',
    name: 'user',
    description: 'Standard user',
    permissions: [
      {
        id: 'perm-1',
        name: 'dashboard:canView',
        description: 'View dashboards',
      },
    ],
  },
  preferences: {
    theme: 'light',
    language: 'fr',
  },
  createdAt: new Date(),
};

const mockAuthResponse: AuthResponse = {
  accessToken: 'mock-jwt-token',
  user: mockUser,
};

const mockAuthService = {
  register: vi.fn().mockResolvedValue(mockAuthResponse),
  login: vi.fn().mockResolvedValue(mockAuthResponse),
  getProfile: vi.fn().mockResolvedValue(mockUser),
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: typeof mockAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('register', () => {
    it('should register a new user and return auth response', async () => {
      const registerDto = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'Password@123',
      };

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockAuthResponse);
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe('test@example.com');
    });
  });

  describe('login', () => {
    it('should login and return auth response', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Password@123',
      };

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockAuthResponse);
      expect(result.accessToken).toBe('mock-jwt-token');
    });
  });

  describe('getProfile', () => {
    it('should return user profile for authenticated user', async () => {
      const authUser: AuthUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'user',
      };

      const result = await controller.getProfile(authUser);

      expect(authService.getProfile).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUser);
      expect(result.email).toBe('test@example.com');
    });
  });
});
