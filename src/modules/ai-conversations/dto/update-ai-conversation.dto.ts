import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

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

  @IsOptional()
  dataSourceSummary?: {
    totalRows: number;
    columns: Array<{
      name: string;
      type: string;
      uniqueValues?: number;
      sampleValues?: unknown[];
    }>;
  };
}
