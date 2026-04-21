import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { AggregationType } from '../aggregators';
import { FilterOperator, FILTER_OPERATORS } from '../filters';

export class MetricDto {
  @ApiProperty({ description: 'Field to aggregate' })
  @IsString()
  field!: string;

  @ApiProperty({
    enum: ['sum', 'avg', 'count', 'min', 'max'],
    description: 'Aggregation type',
  })
  @IsEnum(['sum', 'avg', 'count', 'min', 'max'] as const)
  type!: AggregationType;

  @ApiPropertyOptional({ description: 'Alias for the result field' })
  @IsOptional()
  @IsString()
  alias?: string;
}

export class BucketDto {
  @ApiProperty({ description: 'Field to group by' })
  @IsString()
  field!: string;

  @ApiPropertyOptional({
    description: 'Date format for date fields (year, month, day, week, hour)',
  })
  @IsOptional()
  @IsString()
  format?: string;
}

export class FilterDto {
  @ApiProperty({ description: 'Field to filter on' })
  @IsString()
  field!: string;

  @ApiProperty({
    enum: FILTER_OPERATORS,
    description: 'Filter operator',
  })
  @IsEnum(FILTER_OPERATORS)
  operator!: FilterOperator;

  @ApiProperty({ description: 'Value to filter with' })
  value!: unknown;
}

export class AggregateDto {
  @ApiProperty({ description: 'ID of the data source' })
  @IsString()
  dataSourceId!: string;

  @ApiProperty({
    type: [MetricDto],
    description: 'Metrics to compute',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetricDto)
  metrics!: MetricDto[];

  @ApiPropertyOptional({
    type: [BucketDto],
    description: 'Grouping buckets',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BucketDto)
  buckets?: BucketDto[];

  @ApiPropertyOptional({
    type: [FilterDto],
    description: 'Filters to apply before aggregation',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterDto)
  filters?: FilterDto[];

  @ApiPropertyOptional({ description: 'Start date for time-series filtering' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'End date for time-series filtering' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
