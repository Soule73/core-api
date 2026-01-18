import {
  Controller,
  Get,
  Post,
  Put,
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
import { DataSourcesService } from './datasources.service';
import { CreateDataSourceDto, UpdateDataSourceDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '../auth/guards';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DataSourceResponse } from './interfaces';
import type { AuthUser } from '../auth/interfaces';

@ApiTags('Data Sources')
@ApiBearerAuth('JWT-auth')
@Controller('datasources')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DataSourcesController {
  constructor(private readonly dataSourcesService: DataSourcesService) {}

  @Post()
  @RequirePermissions('datasource:canCreate')
  @ApiOperation({ summary: 'Create a new data source' })
  @ApiResponse({ status: 201, description: 'Data source created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createDataSourceDto: CreateDataSourceDto,
  ): Promise<DataSourceResponse> {
    return this.dataSourcesService.create(user.id, createDataSourceDto);
  }

  @Get()
  @RequirePermissions('datasource:canView')
  @ApiOperation({ summary: 'Get all data sources for current user' })
  @ApiResponse({ status: 200, description: 'List of data sources' })
  async findAll(@CurrentUser() user: AuthUser): Promise<DataSourceResponse[]> {
    return this.dataSourcesService.findAll(user.id);
  }

  @Get(':id')
  @RequirePermissions('datasource:canView')
  @ApiOperation({ summary: 'Get data source by ID' })
  @ApiParam({ name: 'id', description: 'Data source ID' })
  @ApiResponse({ status: 200, description: 'Data source found' })
  @ApiResponse({ status: 404, description: 'Data source not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<DataSourceResponse> {
    return this.dataSourcesService.findOne(id, user.id);
  }

  @Put(':id')
  @RequirePermissions('datasource:canUpdate')
  @ApiOperation({ summary: 'Update data source' })
  @ApiParam({ name: 'id', description: 'Data source ID' })
  @ApiResponse({ status: 200, description: 'Data source updated' })
  @ApiResponse({ status: 404, description: 'Data source not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() updateDataSourceDto: UpdateDataSourceDto,
  ): Promise<DataSourceResponse> {
    return this.dataSourcesService.update(id, user.id, updateDataSourceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('datasource:canDelete')
  @ApiOperation({ summary: 'Delete data source' })
  @ApiParam({ name: 'id', description: 'Data source ID' })
  @ApiResponse({ status: 204, description: 'Data source deleted' })
  @ApiResponse({ status: 404, description: 'Data source not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    await this.dataSourcesService.remove(id, user.id);
  }
}
