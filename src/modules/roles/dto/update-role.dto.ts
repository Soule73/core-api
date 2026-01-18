import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsMongoId,
  MinLength,
} from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({
    description: 'Name of the role',
    example: 'Admin',
    minLength: 2,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiProperty({
    description: 'Description of the role',
    example: 'Administrator role with full permissions',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Array of permission IDs associated with the role',
    example: ['64b8f0f2c9e77c001f4d3a2b', '64b8f0f2c9e77c001f4d3a2c'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  permissions?: string[];
}
