import { IsString, IsNotEmpty } from 'class-validator';

export class ConnectGithubDto {
  @IsString()
  @IsNotEmpty()
  github_username: string;

  @IsString()
  @IsNotEmpty()
  oauth_token: string;
}
