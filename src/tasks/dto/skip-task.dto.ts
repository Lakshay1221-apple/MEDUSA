import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SkipTaskDto {
  @IsString()
  @IsNotEmpty()
  reason_code: string;

  @IsString()
  @IsOptional()
  reason_text?: string;

  @IsString()
  @IsNotEmpty()
  commitment_phrase: string;
}
