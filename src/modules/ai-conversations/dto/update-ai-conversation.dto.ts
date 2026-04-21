import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  IsNumber,
  IsMongoId,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class GeneratedWidgetSummaryDto {
  @ApiProperty({
    description: 'Widget MongoDB ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  widgetId!: string;

  @ApiProperty({ description: 'Widget type', example: 'bar' })
  @IsString()
  type!: string;

  @ApiProperty({ description: 'Widget title', example: 'Sales by Region' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Widget config object' })
  @IsObject()
  config!: Record<string, unknown>;
}

class AIMessageDto {
  @ApiProperty({
    description: 'Role of the message sender',
    example: 'user',
    enum: ['user', 'assistant'],
  })
  @IsEnum(['user', 'assistant'])
  role!: string;

  @ApiProperty({
    description: 'Content of the message',
    example: 'Hello, how can I assist you today?',
  })
  @IsString()
  content!: string;
}

class ColumnSummaryDto {
  @ApiProperty({ description: 'Column name', example: 'category' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Column type', example: 'string' })
  @IsString()
  type!: string;

  @ApiProperty({
    description: 'Number of unique values',
    example: 12,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  uniqueValues?: number;

  @ApiProperty({
    description: 'Sample values from the column',
    required: false,
    type: [Object],
  })
  @IsOptional()
  @IsArray()
  sampleValues?: unknown[];
}

class DataSourceSummaryDto {
  @ApiProperty({
    description: 'Total row count in the data source',
    example: 1000,
  })
  @IsNumber()
  totalRows!: number;

  @ApiProperty({ description: 'Column summaries', type: [ColumnSummaryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnSummaryDto)
  columns!: ColumnSummaryDto[];
}

export class UpdateAIConversationDto {
  @ApiProperty({
    description: 'Title of the AI conversation',
    example: 'My AI Conversation',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Messages in the AI conversation',
    type: [AIMessageDto],
    required: false,
    example: [
      {
        role: 'user',
        content: 'Make the chart blue',
      },
      {
        role: 'assistant',
        content: 'I am here to help you with your questions.',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AIMessageDto)
  messages?: AIMessageDto[];

  @ApiProperty({
    description: 'Suggestions for the AI conversation',
    type: [String],
    required: false,
    example: [
      'Add kpi sum sales by region',
      'Update bar chart styles',
      'Change date range to last month',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suggestions?: string[];

  @ApiProperty({
    description: 'Summary of the data source used in this conversation',
    type: DataSourceSummaryDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DataSourceSummaryDto)
  dataSourceSummary?: DataSourceSummaryDto;

  @ApiProperty({
    description: 'Widgets generated in this conversation',
    type: [GeneratedWidgetSummaryDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GeneratedWidgetSummaryDto)
  generatedWidgets?: GeneratedWidgetSummaryDto[];
}
