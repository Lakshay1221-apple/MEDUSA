import { IsString, IsNotEmpty } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;
}

export class JoinWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  invite_code: string;
}
