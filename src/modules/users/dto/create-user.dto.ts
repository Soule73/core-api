import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  IsMongoId,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Username for the user',
    example: 'johndoe',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  username!: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description:
      'Password for the user (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character)',
    example: 'Password123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password!: string;

  @ApiProperty({
    description: 'Role ID assigned to the user',
    example: '64b8f0f2c9e77c001f4d3a2b',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  roleId?: string;
}
