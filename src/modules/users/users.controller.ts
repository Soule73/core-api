import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UpdatePreferencesDto } from './dto';
import type { UserPreferencesResponse } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '../auth/guards';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserResponse } from '../../common/interfaces';
import type { AuthUser } from '../auth/interfaces';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {
    /** */
  }

  // ==================== User Preferences (no permission check) ====================

  @Get('me/preferences')
  @ApiOperation({ summary: 'Get current user preferences' })
  @ApiResponse({ status: 200, description: 'User preferences returned' })
  async getMyPreferences(
    @CurrentUser() user: AuthUser,
  ): Promise<UserPreferencesResponse> {
    return await this.usersService.getPreferences(user.id);
  }

  @Patch('me/preferences')
  @ApiOperation({ summary: 'Update current user preferences' })
  @ApiResponse({ status: 200, description: 'User preferences updated' })
  async updateMyPreferences(
    @CurrentUser() user: AuthUser,
    @Body() updatePreferencesDto: UpdatePreferencesDto,
  ): Promise<UserPreferencesResponse> {
    return await this.usersService.updatePreferences(
      user.id,
      updatePreferencesDto,
    );
  }

  // ==================== User CRUD (requires permissions) ====================

  @Post()
  @RequirePermissions('user:canCreate')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponse> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @RequirePermissions('user:canView')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async findAll(): Promise<UserResponse[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequirePermissions('user:canView')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string): Promise<UserResponse> {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('user:canUpdate')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('user:canDelete')
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.usersService.remove(id);
  }
}
