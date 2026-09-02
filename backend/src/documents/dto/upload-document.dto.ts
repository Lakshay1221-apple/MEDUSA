import { IsUUID, IsNotEmpty, IsEnum, IsString } from 'class-validator';
import { DocumentFileType } from '@prisma/client';

export class UploadDocumentDto {
  @IsUUID()
  @IsNotEmpty()
  arc_id: string;

  @IsEnum(DocumentFileType)
  @IsNotEmpty()
  file_type: DocumentFileType;

  @IsString()
  @IsNotEmpty()
  content: string; // Raw text or base64 file string

  @IsString()
  @IsNotEmpty()
  filename: string;
}
