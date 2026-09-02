import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  timezone?: string = 'UTC';

  @IsString()
  @IsOptional()
  commitment_phrase?: string = 'I ACCEPT THE COST';
}
