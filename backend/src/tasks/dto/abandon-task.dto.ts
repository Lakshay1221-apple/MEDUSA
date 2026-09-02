import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AbandonTaskDto {
  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsNotEmpty()
  commitment_phrase: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
