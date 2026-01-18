import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { WidgetsService } from './widgets.service';
import { CreateWidgetDto, UpdateWidgetDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '../auth/guards';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WidgetResponse } from './interfaces';
import type { AuthUser } from '../auth/interfaces';

@ApiTags('Widgets')
@ApiBearerAuth('JWT-auth')
@Controller('widgets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WidgetsController {
  constructor(private readonly widgetsService: WidgetsService) {}

  @Post()
  @RequirePermissions('widget:canCreate')
  @ApiOperation({ summary: 'Create a new widget' })
  @ApiResponse({ status: 201, description: 'Widget created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createWidgetDto: CreateWidgetDto,
  ): Promise<WidgetResponse> {
    return this.widgetsService.create(user.id, createWidgetDto);
  }

  @Get()
  @RequirePermissions('widget:canView')
  @ApiOperation({ summary: 'Get all widgets for current user' })
  @ApiQuery({
    name: 'dataSourceId',
    required: false,
    description: 'Filter by data source',
  })
  @ApiResponse({ status: 200, description: 'List of widgets' })
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('dataSourceId') dataSourceId?: string,
  ): Promise<WidgetResponse[]> {
    if (dataSourceId) {
      return this.widgetsService.findByDataSource(dataSourceId, user.id);
    }
    return this.widgetsService.findAll(user.id);
  }

  @Get(':id')
  @RequirePermissions('widget:canView')
  @ApiOperation({ summary: 'Get widget by ID' })
  @ApiParam({ name: 'id', description: 'Widget ID' })
  @ApiResponse({ status: 200, description: 'Widget found' })
  @ApiResponse({ status: 404, description: 'Widget not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<WidgetResponse> {
    return this.widgetsService.findOne(id, user.id);
  }

  @Put(':id')
  @RequirePermissions('widget:canUpdate')
  @ApiOperation({ summary: 'Update widget' })
  @ApiParam({ name: 'id', description: 'Widget ID' })
  @ApiResponse({ status: 200, description: 'Widget updated' })
  @ApiResponse({ status: 404, description: 'Widget not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() updateWidgetDto: UpdateWidgetDto,
  ): Promise<WidgetResponse> {
    return this.widgetsService.update(id, user.id, updateWidgetDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('widget:canDelete')
  @ApiOperation({ summary: 'Delete widget' })
  @ApiParam({ name: 'id', description: 'Widget ID' })
  @ApiResponse({ status: 204, description: 'Widget deleted' })
  @ApiResponse({ status: 404, description: 'Widget not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    await this.widgetsService.remove(id, user.id);
  }
}
