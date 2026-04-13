import {
  IsMongoId,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GenerateWidgetDto {
  @ApiProperty({
    description: 'Data source ID to analyze and generate widget from',
    example: '64b8f0f2c9e77c001f4d3a2b',
  })
  @IsMongoId()
  dataSourceId!: string;

  @ApiProperty({
    description: 'Natural language prompt describing the desired widget',
    example: 'Show me sales by region as a bar chart',
    minLength: 5,
    maxLength: 500,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  userPrompt!: string;

  @ApiProperty({
    description: 'Existing conversation ID for multi-turn context',
    example: '64b8f0f2c9e77c001f4d3a2c',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  conversationId?: string;

  @ApiProperty({
    description: 'Maximum number of widgets to generate (1-10)',
    example: 3,
    required: false,
    default: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  maxWidgets?: number = 3;
}
