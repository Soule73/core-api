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
import type { FilterOperator } from '../../processing/filters';
import { FILTER_OPERATORS } from '../../processing/filters';

export class DashboardFilterDto {
  @ApiProperty({
    description: 'Unique identifier for the filter',
    example: 'uuid-123',
  })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Field name to filter on', example: 'status' })
  @IsString()
  field!: string;

  @ApiProperty({
    description: 'Filter operator',
    example: 'equals',
    enum: FILTER_OPERATORS,
  })
  @IsEnum(FILTER_OPERATORS)
  operator!: FilterOperator;

  @ApiProperty({
    description: 'Filter value (not required for is_null / is_not_null)',
    example: 'active',
    required: false,
  })
  @IsOptional()
  value?: string | number | boolean | (string | number)[] | null;
}

class LayoutItemStylesDto {
  @ApiProperty({
    description: 'Background color of the layout item',
    example: '#ffffff',
    required: false,
  })
  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @ApiProperty({
    description: 'Background gradient of the layout item',
    example: 'linear-gradient(135deg, #667eea, #764ba2)',
    required: false,
  })
  @IsOptional()
  @IsString()
  backgroundGradient?: string;

  @ApiProperty({
    description: 'Border color of the layout item',
    example: '#e5e7eb',
    required: false,
  })
  @IsOptional()
  @IsString()
  borderColor?: string;

  @ApiProperty({
    description: 'Border width of the layout item',
    example: '1px',
    required: false,
  })
  @IsOptional()
  @IsString()
  borderWidth?: string;

  @ApiProperty({
    description: 'Border radius of the layout item',
    example: '8px',
    required: false,
  })
  @IsOptional()
  @IsString()
  borderRadius?: string;

  @ApiProperty({
    description: 'Box shadow of the layout item',
    example: '0 4px 6px rgba(0,0,0,0.1)',
    required: false,
  })
  @IsOptional()
  @IsString()
  boxShadow?: string;

  @ApiProperty({
    description: 'Padding of the layout item',
    example: '16px',
    required: false,
  })
  @IsOptional()
  @IsString()
  padding?: string;

  @ApiProperty({
    description: 'Text color for chart labels and values',
    example: '#111827',
    required: false,
  })
  @IsOptional()
  @IsString()
  textColor?: string;

  @ApiProperty({
    description: 'Label color for chart axis labels',
    example: '#6b7280',
    required: false,
  })
  @IsOptional()
  @IsString()
  labelColor?: string;

  @ApiProperty({
    description: 'Grid line color for charts',
    example: 'rgba(0, 0, 0, 0.1)',
    required: false,
  })
  @IsOptional()
  @IsString()
  gridColor?: string;
}

class DashboardStylesDto {
  @ApiProperty({
    description: 'Background color of the dashboard',
    example: '#f3f4f6',
    required: false,
  })
  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @ApiProperty({
    description: 'Background gradient of the dashboard',
    example: 'linear-gradient(to right, #4f46e5, #7c3aed)',
    required: false,
  })
  @IsOptional()
  @IsString()
  backgroundGradient?: string;

  @ApiProperty({
    description: 'Padding of the dashboard',
    example: '16px',
    required: false,
  })
  @IsOptional()
  @IsString()
  padding?: string;

  @ApiProperty({
    description: 'Gap between widgets',
    example: '8px',
    required: false,
  })
  @IsOptional()
  @IsString()
  gap?: string;

  @ApiProperty({
    description: 'Font size of the dashboard title',
    example: '24px',
    required: false,
  })
  @IsOptional()
  @IsString()
  titleFontSize?: string;

  @ApiProperty({
    description: 'Color of the dashboard title',
    example: '#111827',
    required: false,
  })
  @IsOptional()
  @IsString()
  titleColor?: string;
}

class LayoutItemDto {
  @ApiProperty({
    description: 'Unique identifier for the layout item',
    example: 'item1',
  })
  @IsString()
  i!: string;

  @ApiProperty({
    description:
      'ID of the widget associated with the layout item (ObjectId or UUID for backward compatibility)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  widgetId!: string; // Accepte string (ObjectId ou UUID pour compatibilité)

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

  @ApiProperty({
    description: 'Custom styles for the layout item',
    type: LayoutItemStylesDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LayoutItemStylesDto)
  styles?: LayoutItemStylesDto;
}

class TimeRangeDto {
  @ApiProperty({
    description: 'Start date and time of the time range',
    example: '2023-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  from?: Date;

  @ApiProperty({
    description: 'End date and time of the time range',
    example: '2023-01-31T23:59:59Z',
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

export class CreateDashboardDto {
  @ApiProperty({
    description: 'Title of the dashboard',
    example: 'Sales Dashboard',
  })
  @IsString()
  title!: string;

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

  @ApiProperty({
    description: 'Custom styles for the dashboard',
    type: DashboardStylesDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DashboardStylesDto)
  styles?: DashboardStylesDto;

  @ApiProperty({
    description: 'Skip widget validation (for testing purposes)',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  skipValidation?: boolean;

  @ApiProperty({
    description: 'Global filters applied to all widgets in the dashboard',
    type: [DashboardFilterDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DashboardFilterDto)
  globalFilters?: DashboardFilterDto[];
}
