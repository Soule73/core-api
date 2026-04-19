import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsMongoId,
  IsObject,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import * as constants from '../constants';

export class UpdateWidgetDto {
  @ApiProperty({
    description: 'Title of the widget',
    example: 'Sales Chart',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Type of the widget',
    example: 'bar',
    required: false,
    enum: constants.WIDGET_TYPES,
  })
  @IsOptional()
  @IsEnum(constants.WIDGET_TYPES)
  type?: constants.WidgetTypeValue;

  @ApiProperty({
    description: 'Data source ID for the widget',
    example: '64b8f0f2c9e77c001f4d3a2b',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  dataSourceId?: string;

  @ApiProperty({
    description: 'Configuration object for the widget',
    example: {
      metrics: [{ field: 'sales', agg: 'sum', label: 'Sales' }],
      buckets: [{ field: 'category', type: 'terms', label: 'Month' }],
    },
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
    description: 'Indicates if the widget is a draft',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;

  @ApiProperty({
    description: 'Description of the widget',
    example: 'This widget shows sales data for Q1.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
