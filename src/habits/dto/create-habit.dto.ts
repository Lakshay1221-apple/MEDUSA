import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsArray,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';
import { HabitFrequency } from '@prisma/client';

export class CreateHabitDto {
  @IsUUID()
  @IsNotEmpty()
  arc_id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsNotEmpty()
  category_id: string;

  @IsEnum(HabitFrequency)
  @IsOptional()
  frequency?: HabitFrequency = HabitFrequency.DAILY;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  target_days?: string[] = [];

  @IsInt()
  @Min(5)
  @IsOptional()
  estimated_minutes?: number = 30;

  @IsBoolean()
  @IsOptional()
  active?: boolean = true;
}

export class UpdateHabitDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  category_id?: string;

  @IsEnum(HabitFrequency)
  @IsOptional()
  frequency?: HabitFrequency;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  target_days?: string[];

  @IsInt()
  @Min(5)
  @IsOptional()
  estimated_minutes?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
