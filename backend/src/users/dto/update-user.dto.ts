import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  commitment_phrase?: string;

  @IsString()
  @IsOptional()
  github_username?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;
}
