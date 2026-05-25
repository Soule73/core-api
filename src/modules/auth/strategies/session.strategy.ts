import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import type { Request } from 'express';
import { AuthService } from '../auth.service';
import type { AuthUser } from '../interfaces';

@Injectable()
export class SessionStrategy extends PassportStrategy(
  Strategy,
  'session-cookie',
) {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(req: Request): Promise<AuthUser> {
    const sessionId = (req.cookies as Record<string, string> | undefined)?.[
      'session_id'
    ];

    if (!sessionId) {
      throw new UnauthorizedException('No session cookie');
    }

    return this.authService.validateSession(sessionId);
  }
}
