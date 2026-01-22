import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import type { DataSourceType } from '../connectors';

export class DetectColumnsDto {
  @ApiProperty({
    enum: ['json', 'csv', 'elasticsearch'],
    description: 'Type of data source',
  })
  @IsEnum(['json', 'csv', 'elasticsearch'] as const)
  type!: DataSourceType;

  @ApiPropertyOptional({ description: 'URL endpoint for JSON data sources' })
  @IsOptional()
  @IsString()
  endpoint?: string;

  @ApiPropertyOptional({ description: 'File path for CSV data sources' })
  @IsOptional()
  @IsString()
  filePath?: string;

  @ApiPropertyOptional({
    enum: ['GET', 'POST'],
    description: 'HTTP method for API calls',
  })
  @IsOptional()
  @IsEnum(['GET', 'POST'] as const)
  httpMethod?: 'GET' | 'POST';

  @ApiPropertyOptional({
    enum: ['none', 'bearer', 'apiKey', 'basic'],
    description: 'Authentication type',
  })
  @IsOptional()
  @IsEnum(['none', 'bearer', 'apiKey', 'basic'] as const)
  authType?: 'none' | 'bearer' | 'apiKey' | 'basic';

  @ApiPropertyOptional({ description: 'Authentication configuration' })
  @IsOptional()
  authConfig?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Elasticsearch index name' })
  @IsOptional()
  @IsString()
  esIndex?: string;

  @ApiPropertyOptional({ description: 'Elasticsearch query' })
  @IsOptional()
  esQuery?: Record<string, unknown>;
}
