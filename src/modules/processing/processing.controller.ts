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
import { DataFetcherService } from './services/data-fetcher.service';
import { DataProcessorService } from './services/data-processor.service';
import { SchemaAnalyzerService } from './schema-analyzer/schema-analyzer.service';
import {
  FetchDataDto,
  AggregateDto,
  DetectColumnsDto,
  AnalyzeSchemaDto,
} from './dto';

@ApiTags('Processing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('processing')
export class ProcessingController {
  constructor(
    private readonly dataFetcherService: DataFetcherService,
    private readonly dataProcessorService: DataProcessorService,
    private readonly schemaAnalyzerService: SchemaAnalyzerService,
  ) {
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
  ) {
    return this.dataFetcherService.fetchData({
      dataSourceId: id,
      ...query,
    });
  }

  @Post('datasources/:id/aggregate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aggregate data from a data source' })
  @ApiParam({ name: 'id', description: 'Data source ID' })
  @ApiResponse({
    status: 200,
    description: 'Aggregation completed successfully',
  })
  @ApiResponse({ status: 404, description: 'Data source not found' })
  async aggregate(
    @Param('id') id: string,
    @Body() body: Omit<AggregateDto, 'dataSourceId'>,
  ) {
    return this.dataProcessorService.aggregate({
      dataSourceId: id,
      metrics: body.metrics,
      buckets: body.buckets,
      filters: body.filters,
      from: body.from,
      to: body.to,
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

  @Get('datasources/:id/schema')
  @ApiOperation({ summary: 'Analyze schema of a data source' })
  @ApiParam({ name: 'id', description: 'Data source ID' })
  @ApiResponse({
    status: 200,
    description: 'Schema analyzed successfully',
  })
  @ApiResponse({ status: 404, description: 'Data source not found' })
  async analyzeSchema(
    @Param('id') id: string,
    @Query() options: AnalyzeSchemaDto,
  ) {
    const rawData = await this.dataFetcherService.fetchRawData(id);

    const result = this.schemaAnalyzerService.analyzeSchema(rawData, {
      sampleSize: options.sampleSize,
      maxUniqueValues: options.maxUniqueValues,
      detectDates: options.detectDates,
    });

    return {
      success: true,
      ...result,
      dataSourceId: id,
    };
  }

  @Get('datasources/:id/quick-schema')
  @ApiOperation({ summary: 'Quick schema analysis (names and types only)' })
  @ApiParam({ name: 'id', description: 'Data source ID' })
  @ApiResponse({
    status: 200,
    description: 'Quick analysis completed successfully',
  })
  @ApiResponse({ status: 404, description: 'Data source not found' })
  async quickAnalyzeSchema(@Param('id') id: string) {
    const rawData = await this.dataFetcherService.fetchRawData(id, 100);
    const columns = this.schemaAnalyzerService.quickAnalyze(rawData);

    return {
      success: true,
      columns,
      dataSourceId: id,
    };
  }
}
