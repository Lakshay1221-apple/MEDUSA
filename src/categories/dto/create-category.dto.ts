import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  color_token?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number = 0;

  @IsInt()
  @Min(0)
  @IsOptional()
  weekly_target_minutes?: number = 0;
}
