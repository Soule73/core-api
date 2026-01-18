import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
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
import { DashboardsService } from './dashboards.service';
import { CreateDashboardDto, UpdateDashboardDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '../auth/guards';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { DashboardResponse } from './interfaces';
import type { AuthUser } from '../auth/interfaces';

@ApiTags('Dashboards')
@ApiBearerAuth('JWT-auth')
@Controller('dashboards')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Post()
  @RequirePermissions('dashboard:canCreate')
  @ApiOperation({ summary: 'Create a new dashboard' })
  @ApiResponse({ status: 201, description: 'Dashboard created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createDashboardDto: CreateDashboardDto,
  ): Promise<DashboardResponse> {
    return this.dashboardsService.create(user.id, createDashboardDto);
  }

  @Get()
  @RequirePermissions('dashboard:canView')
  @ApiOperation({ summary: 'Get all dashboards for current user' })
  @ApiResponse({ status: 200, description: 'List of dashboards' })
  async findAll(@CurrentUser() user: AuthUser): Promise<DashboardResponse[]> {
    return this.dashboardsService.findAll(user.id);
  }

  @Public()
  @Get('shared/:shareId')
  @ApiOperation({ summary: 'Get shared dashboard by share ID (public)' })
  @ApiParam({ name: 'shareId', description: 'Share ID' })
  @ApiResponse({ status: 200, description: 'Shared dashboard found' })
  @ApiResponse({
    status: 404,
    description: 'Dashboard not found or not shared',
  })
  async findByShareId(
    @Param('shareId') shareId: string,
  ): Promise<DashboardResponse> {
    return this.dashboardsService.findByShareId(shareId);
  }

  @Get(':id')
  @RequirePermissions('dashboard:canView')
  @ApiOperation({ summary: 'Get dashboard by ID' })
  @ApiParam({ name: 'id', description: 'Dashboard ID' })
  @ApiResponse({ status: 200, description: 'Dashboard found' })
  @ApiResponse({ status: 404, description: 'Dashboard not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<DashboardResponse> {
    return this.dashboardsService.findOne(id, user.id);
  }

  @Put(':id')
  @RequirePermissions('dashboard:canUpdate')
  @ApiOperation({ summary: 'Update dashboard' })
  @ApiParam({ name: 'id', description: 'Dashboard ID' })
  @ApiResponse({ status: 200, description: 'Dashboard updated' })
  @ApiResponse({ status: 404, description: 'Dashboard not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() updateDashboardDto: UpdateDashboardDto,
  ): Promise<DashboardResponse> {
    return this.dashboardsService.update(id, user.id, updateDashboardDto);
  }

  @Patch(':id/share')
  @RequirePermissions('dashboard:canUpdate')
  @ApiOperation({ summary: 'Toggle dashboard sharing' })
  @ApiParam({ name: 'id', description: 'Dashboard ID' })
  @ApiResponse({ status: 200, description: 'Sharing toggled' })
  @ApiResponse({ status: 404, description: 'Dashboard not found' })
  async toggleShare(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<DashboardResponse> {
    return this.dashboardsService.toggleShare(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('dashboard:canDelete')
  @ApiOperation({ summary: 'Delete dashboard' })
  @ApiParam({ name: 'id', description: 'Dashboard ID' })
  @ApiResponse({ status: 204, description: 'Dashboard deleted' })
  @ApiResponse({ status: 404, description: 'Dashboard not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    await this.dashboardsService.remove(id, user.id);
  }
}
