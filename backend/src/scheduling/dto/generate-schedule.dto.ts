import { IsUUID, IsNotEmpty, IsOptional, IsArray, IsString } from 'class-validator';

export class GenerateScheduleDto {
  @IsUUID()
  @IsNotEmpty()
  arc_id: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  blackout_dates?: string[]; // e.g. ["2026-09-20", "2026-09-21"]

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  pinned_task_ids?: string[];
}
