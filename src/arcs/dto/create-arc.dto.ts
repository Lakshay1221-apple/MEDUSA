import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { ArcStatus } from '@prisma/client';

export class CreateArcDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  start_date: string;

  @IsDateString()
  @IsNotEmpty()
  end_date: string;

  @IsString()
  @IsOptional()
  timezone?: string = 'UTC';

  @IsInt()
  @Min(30)
  @IsOptional()
  daily_capacity_minutes?: number = 360;

  @IsInt()
  @Min(60)
  @IsOptional()
  weekly_capacity_minutes?: number = 2160;

  @IsEnum(ArcStatus)
  @IsOptional()
  status?: ArcStatus = ArcStatus.ACTIVE;
}
