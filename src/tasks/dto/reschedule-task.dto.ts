import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RescheduleTaskDto {
  @IsString()
  @IsNotEmpty()
  scheduled_date: string; // YYYY-MM-DD

  @IsString()
  @IsOptional()
  scheduled_start?: string;

  @IsString()
  @IsOptional()
  scheduled_end?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
