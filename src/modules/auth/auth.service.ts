import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { User, UserDocument } from './schemas/user.schema';
import { Role, RoleDocument } from './schemas/role.schema';
import { Session, SessionDocument } from './schemas/session.schema';
import { RegisterDto, LoginDto } from './dto';
import {
  AuthServiceResponse,
  AuthUser,
  UserResponse,
  RoleResponse,
} from './interfaces';

@Injectable()
export class AuthService {
  private readonly sessionTtlMs: number;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {
    const ttlDays = parseInt(process.env.SESSION_TTL_DAYS ?? '7', 10);
    this.sessionTtlMs = ttlDays * 24 * 60 * 60 * 1000;
  }

  async register(registerDto: RegisterDto): Promise<AuthServiceResponse> {
    const { username, email, password } = registerDto;

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const defaultRole = await this.roleModel.findOne({ name: 'user' });
    if (!defaultRole) {
      throw new InternalServerErrorException("Default role 'user' not found");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userModel.create({
      username,
      email,
      password: hashedPassword,
      roleId: defaultRole._id,
    });

    const userResponse = await this.buildUserResponse(user);
    const sessionId = await this.createSession(user._id.toString());

    return { user: userResponse, sessionId };
  }

  async login(loginDto: LoginDto): Promise<AuthServiceResponse> {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const populatedUser = await this.userModel.findById(user._id).populate({
      path: 'roleId',
      populate: { path: 'permissions' },
    });

    const userResponse = await this.buildUserResponse(populatedUser!);
    const sessionId = await this.createSession(user._id.toString());

    return { user: userResponse, sessionId };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionModel.deleteOne({ _id: sessionId });
  }

  async validateSession(sessionId: string): Promise<AuthUser> {
    const session = await this.sessionModel.findById(sessionId);

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await this.sessionModel.deleteOne({ _id: sessionId });
      }
      throw new UnauthorizedException('Session expired or not found');
    }

    const user = await this.userModel.findById(session.userId).populate({
      path: 'roleId',
      populate: { path: 'permissions' },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const role = user.roleId as unknown as RoleDocument;

    return {
      id: user._id.toString(),
      email: user.email,
      role: role?.name || 'user',
    };
  }

  async getProfile(userId: string): Promise<UserResponse> {
    const user = await this.userModel.findById(userId).populate({
      path: 'roleId',
      populate: { path: 'permissions' },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.buildUserResponse(user);
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.sessionModel.deleteMany({ userId });
  }

  private async createSession(userId: string): Promise<string> {
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + this.sessionTtlMs);

    await this.sessionModel.create({
      _id: sessionId,
      userId,
      createdAt: new Date(),
      expiresAt,
    });

    return sessionId;
  }

  private async buildUserResponse(user: UserDocument): Promise<UserResponse> {
    const populatedUser = await this.userModel.findById(user._id).populate({
      path: 'roleId',
      populate: { path: 'permissions' },
    });

    const role = populatedUser?.roleId as unknown as RoleDocument & {
      permissions: Array<{ _id: string; name: string; description?: string }>;
    };

    let roleResponse: RoleResponse | null = null;

    if (role && typeof role === 'object' && 'name' in role) {
      roleResponse = {
        id: role._id?.toString() || '',
        name: role.name,
        description: role.description,
        permissions: (role.permissions || []).map((p) => ({
          id: p._id?.toString() || '',
          name: p.name,
          description: p.description,
        })),
      };
    }

    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: roleResponse,
    };
  }
}
