import {
  IsString,
  IsMongoId,
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

export class CreateAIConversationDto {
  @ApiProperty({
    description: 'ID of the data source associated with the conversation',
    example: '64b64c4f2f9b2567e4d3c456',
  })
  @IsMongoId()
  dataSourceId!: string;

  @ApiProperty({
    description: 'Title of the AI conversation',
    example: 'My AI Conversation',
  })
  @IsString()
  title!: string;

  @ApiProperty({
    description: 'Messages in the AI conversation',
    type: [AIMessageDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AIMessageDto)
  messages?: AIMessageDto[];
}
