import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsUUID,
  IsArray,
} from 'class-validator';
import { TaskPriority, TaskStatus, VerificationType } from '@prisma/client';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  category_id?: string;

  @IsInt()
  @Min(5)
  @Max(1440)
  @IsOptional()
  estimated_minutes?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  actual_minutes?: number;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  difficulty?: number;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsString()
  @IsOptional()
  scheduled_date?: string;

  @IsString()
  @IsOptional()
  scheduled_start?: string;

  @IsString()
  @IsOptional()
  scheduled_end?: string;

  @IsString()
  @IsOptional()
  deadline?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(VerificationType)
  @IsOptional()
  verification_type?: VerificationType;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  depends_on_task_ids?: string[];
}
