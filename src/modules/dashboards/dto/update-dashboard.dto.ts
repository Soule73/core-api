import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateNested,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class LayoutItemDto {
  @ApiProperty({
    description: 'Unique identifier for the layout item',
    example: 'item1',
  })
  @IsString()
  i!: string;

  @ApiProperty({
    description: 'ID of the widget associated with the layout item',
    example: 'widget123',
  })
  @IsString()
  widgetId!: string;

  @ApiProperty({
    description: 'X coordinate of the layout item',
    example: 0,
  })
  @IsNumber()
  x!: number;

  @ApiProperty({
    description: 'Y coordinate of the layout item',
    example: 0,
  })
  @IsNumber()
  y!: number;

  @ApiProperty({
    description: 'Width of the layout item',
    example: 10,
  })
  @IsNumber()
  w!: number;

  @ApiProperty({
    description: 'Height of the layout item',
    example: 10,
  })
  @IsNumber()
  h!: number;

  @ApiProperty({
    description: 'Minimum width of the layout item',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  minW?: number;

  @ApiProperty({
    description: 'Minimum height of the layout item',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  minH?: number;

  @ApiProperty({
    description: 'Maximum width of the layout item',
    example: 15,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  maxW?: number;

  @ApiProperty({
    description: 'Maximum height of the layout item',
    example: 15,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  maxH?: number;

  @ApiProperty({
    description: 'Whether the layout item is static',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  static?: boolean;
}

class TimeRangeDto {
  @ApiProperty({
    description: 'Start date of the time range',
    example: '2023-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  from?: Date;

  @ApiProperty({
    description: 'End date of the time range',
    example: '2023-01-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  to?: Date;

  @ApiProperty({
    description: 'Interval value for the time range',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  intervalValue?: number;

  @ApiProperty({
    description: 'Interval unit for the time range',
    example: 'minutes',
    required: false,
  })
  @IsOptional()
  @IsString()
  intervalUnit?: string;
}

export class UpdateDashboardDto {
  @ApiProperty({
    description: 'Title of the dashboard',
    example: 'Sales Dashboard',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Description of the dashboard',
    example: 'Dashboard showing sales metrics',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Layout configuration of the dashboard',
    type: [LayoutItemDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LayoutItemDto)
  layout?: LayoutItemDto[];

  @ApiProperty({
    description: 'Visibility of the dashboard',
    example: 'public',
    enum: ['public', 'private'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['public', 'private'])
  visibility?: string;

  @ApiProperty({
    description: 'Auto-refresh enabled for the dashboard',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  autoRefreshEnabled?: boolean;

  @ApiProperty({
    description: 'Auto-refresh interval value for the dashboard',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  shareEnabled?: boolean;

  @ApiProperty({
    description: 'Auto-refresh interval value for the dashboard',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  autoRefreshIntervalValue?: number;

  @ApiProperty({
    description: 'Auto-refresh interval unit for the dashboard',
    example: 'minutes',
    required: false,
  })
  @IsOptional()
  @IsString()
  autoRefreshIntervalUnit?: string;

  @ApiProperty({
    description: 'Time range configuration for the dashboard',
    type: TimeRangeDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TimeRangeDto)
  timeRange?: TimeRangeDto;
}
