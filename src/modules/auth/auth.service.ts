import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { Role, RoleDocument } from './schemas/role.schema';
import { RegisterDto, LoginDto } from './dto';
import {
  AuthResponse,
  JwtPayload,
  UserResponse,
  RoleResponse,
} from './interfaces';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
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

    const token = this.generateToken(user, defaultRole.name);
    const userResponse = await this.buildUserResponse(user);

    return { user: userResponse, token };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
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

    const role = populatedUser?.roleId as unknown as RoleDocument;
    const token = this.generateToken(user, role?.name || 'user');
    const userResponse = await this.buildUserResponse(populatedUser!);

    return { user: userResponse, token };
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

  async validateUser(payload: JwtPayload): Promise<UserDocument | null> {
    return this.userModel.findById(payload.sub).populate({
      path: 'roleId',
      populate: { path: 'permissions' },
    });
  }

  private generateToken(user: UserDocument, roleName: string): string {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: roleName,
    };

    return this.jwtService.sign(payload);
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
