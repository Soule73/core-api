import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  IsMongoId,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class UserPreferencesDto {
  @ApiProperty({
    description: 'Theme preference of the user',
    example: 'dark',
    required: false,
  })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiProperty({
    description: 'Language preference of the user',
    example: 'en-US',
    required: false,
  })
  @IsOptional()
  @IsString()
  language?: string;
}

export class UpdateUserDto {
  @ApiProperty({
    description: 'Username for the user',
    example: 'johndoe',
    minLength: 3,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description:
      'Password for the user (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character)',
    example: 'Password123!',
    minLength: 8,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password?: string;

  @ApiProperty({
    description: 'Role ID assigned to the user',
    example: '64b8f0f2c9e77c001f4d3a2b',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  roleId?: string;

  @ApiProperty({
    description: 'User preferences',
    required: false,
    type: UserPreferencesDto,
    example: { theme: 'dark', language: 'en-US' },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserPreferencesDto)
  preferences?: UserPreferencesDto;
}
