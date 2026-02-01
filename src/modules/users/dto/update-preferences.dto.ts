import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Format configuration for numbers and dates
 */
export class FormatConfigDto {
  @ApiProperty({
    description: 'Locale for number and date formatting',
    example: 'fr-FR',
    required: false,
  })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiProperty({
    description: 'Default currency code',
    example: 'EUR',
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: 'Number of decimal places',
    example: 2,
    minimum: 0,
    maximum: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  decimals?: number;

  @ApiProperty({
    description: 'Date format style',
    example: 'long',
    enum: ['short', 'medium', 'long', 'full'],
    required: false,
  })
  @IsOptional()
  @IsString()
  dateFormat?: string;

  @ApiProperty({
    description: 'String to display for null values',
    example: '-',
    required: false,
  })
  @IsOptional()
  @IsString()
  nullValue?: string;

  @ApiProperty({
    description: 'Whether to include time in date formatting',
    example: false,
    required: false,
  })
  @IsOptional()
  includeTime?: boolean;
}

/**
 * DTO for updating user preferences
 * Contains theme, language, and format configuration
 */
export class UpdatePreferencesDto {
  @ApiProperty({
    description: 'Theme preference',
    example: 'dark',
    enum: ['light', 'dark', 'system'],
    required: false,
  })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiProperty({
    description: 'Language preference',
    example: 'fr',
    enum: ['fr', 'en'],
    required: false,
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({
    description: 'Format configuration for numbers and dates',
    required: false,
    type: FormatConfigDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FormatConfigDto)
  formatConfig?: FormatConfigDto;
}

/**
 * Response type for user preferences
 */
export interface UserPreferencesResponse {
  theme?: string;
  language?: string;
  formatConfig?: {
    locale?: string;
    currency?: string;
    decimals?: number;
    dateFormat?: string;
    nullValue?: string;
    includeTime?: boolean;
  };
}
