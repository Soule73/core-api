import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export class UpdateDataSourceDto {
  @ApiProperty({
    description: 'Name of the data source',
    example: 'My Data Source',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Type of the data source',
    example: 'json',
    enum: ['json', 'csv', 'elasticsearch'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['json', 'csv', 'elasticsearch'])
  type?: string;

  @ApiProperty({
    description: 'Endpoint URL for the data source (if applicable)',
    example: 'https://api.example.com/data',
    required: false,
  })
  @IsOptional()
  @IsString()
  endpoint?: string;

  @ApiProperty({
    description: 'File path for the data source (if applicable)',
    example: '/path/to/datafile.csv',
    required: false,
  })
  @IsOptional()
  @IsString()
  filePath?: string;

  @ApiProperty({
    description: 'Configuration object for the data source',
    example: { delimiter: ',', header: true },
    required: false,
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiProperty({
    description: 'Visibility of the data source',
    example: 'private',
    enum: ['public', 'private'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['public', 'private'])
  visibility?: string;

  @ApiProperty({
    description: 'Timestamp field for the data source (if applicable)',
    example: 'createdAt',
    required: false,
  })
  @IsOptional()
  @IsString()
  timestampField?: string;

  @ApiProperty({
    description: 'HTTP method to access the data source (if applicable)',
    example: 'GET',
    enum: ['GET', 'POST'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['GET', 'POST'])
  httpMethod?: string;

  @ApiProperty({
    description: 'Authentication type for the data source (if applicable)',
    example: 'bearer',
    enum: ['none', 'bearer', 'apiKey', 'basic'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['none', 'bearer', 'apiKey', 'basic'])
  authType?: string;

  @ApiProperty({
    description:
      'Authentication configuration for the data source (if applicable)',
    example: { token: 'your_token_here' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  authConfig?: Record<string, unknown>;

  @ApiProperty({
    description: 'Elasticsearch index name (if applicable)',
    example: 'my-index',
    required: false,
  })
  @IsOptional()
  @IsString()
  esIndex?: string;

  @ApiProperty({
    description: 'Elasticsearch query object (if applicable)',
    example: { match_all: {} },
    required: false,
  })
  @IsOptional()
  @IsObject()
  esQuery?: Record<string, unknown>;
}
