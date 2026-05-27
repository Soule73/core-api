import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { SessionAuthGuard } from './guards';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser, AuthResponse, UserResponse } from './interfaces';

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge:
    parseInt(process.env.SESSION_TTL_DAYS ?? '7', 10) * 24 * 60 * 60 * 1000,
  path: '/',
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {
    //
  }

  @Public()
  @Throttle({ auth: { limit: 5, ttl: 900 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const { user, sessionId } = await this.authService.register(registerDto);
    res.cookie('session_id', sessionId, SESSION_COOKIE_OPTIONS);
    return { user };
  }

  @Public()
  @Throttle({ auth: { limit: 10, ttl: 900 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate user',
    description:
      'Sets an httpOnly session_id cookie on success. No token is returned in the response body.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated, session_id cookie set',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const { user, sessionId } = await this.authService.login(loginDto);
    res.cookie('session_id', sessionId, SESSION_COOKIE_OPTIONS);
    return { user };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout and invalidate session' })
  @ApiResponse({ status: 204, description: 'Successfully logged out' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const sessionId = (req.cookies as Record<string, string> | undefined)?.[
      'session_id'
    ];
    if (sessionId) {
      await this.authService.logout(sessionId);
    }
    res.clearCookie('session_id', { path: '/' });
  }

  @UseGuards(SessionAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: AuthUser): Promise<UserResponse> {
    return this.authService.getProfile(user.id);
  }
}
