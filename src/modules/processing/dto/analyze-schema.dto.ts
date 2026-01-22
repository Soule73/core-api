import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class AnalyzeSchemaDto {
  @ApiPropertyOptional({
    description: 'Number of sample values to extract per column',
    default: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value as string, 10) : undefined))
  sampleSize?: number;

  @ApiPropertyOptional({
    description: 'Maximum unique values to count for cardinality',
    default: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value as string, 10) : undefined))
  maxUniqueValues?: number;

  @ApiPropertyOptional({
    description: 'Whether to detect date columns',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  detectDates?: boolean;
}
