import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { ArcStatus } from '@prisma/client';

export class UpdateArcDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsInt()
  @Min(30)
  @IsOptional()
  daily_capacity_minutes?: number;

  @IsInt()
  @Min(60)
  @IsOptional()
  weekly_capacity_minutes?: number;

  @IsEnum(ArcStatus)
  @IsOptional()
  status?: ArcStatus;
}
