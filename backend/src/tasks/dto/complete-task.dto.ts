import { IsOptional, IsInt, Min, IsString } from 'class-validator';

export class CompleteTaskDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  actual_minutes?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
