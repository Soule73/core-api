import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { AuthUser, UserResponse } from './interfaces';
import type { Request, Response } from 'express';

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
};

const mockServiceResponse = {
  user: mockUser,
  sessionId: 'mock-session-uuid',
};

const mockRes: Partial<Response> = {
  cookie: vi.fn() as Response['cookie'],
  clearCookie: vi.fn() as Response['clearCookie'],
};

const mockAuthService = {
  register: vi.fn().mockResolvedValue(mockServiceResponse),
  login: vi.fn().mockResolvedValue(mockServiceResponse),
  logout: vi.fn().mockResolvedValue(undefined),
  getProfile: vi.fn().mockResolvedValue(mockUser),
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: typeof mockAuthService;

  beforeEach(async () => {
    vi.clearAllMocks();
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
    it('should register a new user, set cookie and return user', async () => {
      const registerDto = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'Password@123',
      };

      const result = await controller.register(
        registerDto,
        mockRes as Response,
      );

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'session_id',
        'mock-session-uuid',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({ user: mockUser });
    });
  });

  describe('login', () => {
    it('should login, set cookie and return user', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'Password@123',
      };

      const result = await controller.login(loginDto, mockRes as Response);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'session_id',
        'mock-session-uuid',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({ user: mockUser });
    });
  });

  describe('logout', () => {
    it('should clear the session_id cookie', async () => {
      const mockReq = { cookies: { session_id: 'some-session-id' } };
      await controller.logout(mockReq as unknown as Request, mockRes as Response);

      expect(mockRes.clearCookie).toHaveBeenCalledWith('session_id', {
        path: '/',
      });
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
