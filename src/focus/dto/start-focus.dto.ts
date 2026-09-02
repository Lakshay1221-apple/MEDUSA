import { IsUUID, IsOptional, IsInt, Min } from 'class-validator';

export class StartFocusDto {
  @IsUUID()
  @IsOptional()
  task_id?: string;
}

export class CompleteFocusDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  duration_seconds?: number;
}
