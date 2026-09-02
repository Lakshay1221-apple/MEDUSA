import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsUUID,
  IsArray,
} from 'class-validator';
import { TaskOrigin, TaskPriority, TaskStatus, VerificationType } from '@prisma/client';

export class CreateTaskDto {
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

  @IsInt()
  @Min(5)
  @Max(1440)
  @IsOptional()
  estimated_minutes?: number = 30;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  difficulty?: number = 1;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority = TaskPriority.MEDIUM;

  @IsString()
  @IsOptional()
  scheduled_date?: string; // YYYY-MM-DD

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
  status?: TaskStatus = TaskStatus.BACKLOG;

  @IsEnum(TaskOrigin)
  @IsOptional()
  origin?: TaskOrigin = TaskOrigin.USER;

  @IsEnum(VerificationType)
  @IsOptional()
  verification_type?: VerificationType = VerificationType.MANUAL;

  @IsUUID()
  @IsOptional()
  source_document_id?: string;

  @IsUUID()
  @IsOptional()
  source_section_id?: string;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  depends_on_task_ids?: string[];
}
