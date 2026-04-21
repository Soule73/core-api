import {
  Controller,
  Get,
  Post,
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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthUser,
} from '../../common/decorators/current-user.decorator';
import { DataFetcherService } from './services/data-fetcher.service';
import { FetchDataDto, DetectColumnsDto } from './dto';

@ApiTags('Processing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('processing')
export class ProcessingController {
  constructor(private readonly dataFetcherService: DataFetcherService) {
    /** */
  }

  @Get('datasources/:id/data')
  @ApiOperation({ summary: 'Fetch data from a data source' })
  @ApiParam({ name: 'id', description: 'Data source ID' })
  @ApiResponse({
    status: 200,
    description: 'Data fetched successfully',
  })
  @ApiResponse({ status: 404, description: 'Data source not found' })
  async fetchData(
    @Param('id') id: string,
    @Query() query: Omit<FetchDataDto, 'dataSourceId'>,
    @CurrentUser() user: AuthUser,
  ) {
    return this.dataFetcherService.fetchData({
      dataSourceId: id,
      userId: user.id,
      ...query,
    });
  }

  @Post('detect-columns')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Detect columns from a data source configuration',
  })
  @ApiResponse({
    status: 200,
    description: 'Columns detected successfully',
  })
  async detectColumns(@Body() config: DetectColumnsDto) {
    return this.dataFetcherService.detectColumns({
      type: config.type,
      endpoint: config.endpoint,
      filePath: config.filePath,
      httpMethod: config.httpMethod,
      authType: config.authType,
      authConfig: config.authConfig,
      esIndex: config.esIndex,
      esQuery: config.esQuery,
    });
  }
}
