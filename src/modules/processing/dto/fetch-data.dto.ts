import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class FetchDataDto {
  @ApiProperty({ description: 'ID of the data source' })
  @IsString()
  dataSourceId!: string;

  @ApiPropertyOptional({ description: 'Start date for time-series filtering' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'End date for time-series filtering' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value as string, 10) : undefined))
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value as string, 10) : undefined))
  pageSize?: number;

  @ApiPropertyOptional({
    description: 'Comma-separated list of fields to return',
  })
  @IsOptional()
  @IsString()
  fields?: string;

  @ApiPropertyOptional({
    description: 'Force refresh cache',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  forceRefresh?: boolean;
}
