import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsMongoId,
  IsObject,
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateWidgetDto {
  @ApiProperty({
    description: 'Title of the widget',
    example: 'Sales Chart',
  })
  @IsString()
  title!: string;

  @ApiProperty({
    description: 'Type of the widget',
    example: 'bar',
  })
  @IsString()
  type!: string;

  @ApiProperty({
    description: 'Data source ID for the widget',
    example: '64b8f0f2c9e77c001f4d3a2b',
  })
  @IsMongoId()
  dataSourceId!: string;

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
    description: 'Visibility of the widget',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isGeneratedByAI?: boolean;

  @ApiProperty({
    description: 'Conversation ID associated with AI-generated widgets',
    example: '64b8f0f2c9e77c001f4d3a2b',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  conversationId?: string;

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

  @ApiProperty({
    description: 'Reasoning behind the widget',
    example: 'This widget was created to analyze sales trends.',
    required: false,
  })
  @IsOptional()
  @IsString()
  reasoning?: string;

  @ApiProperty({
    description: 'AI confidence score for the widget',
    example: 0.85,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;
}
