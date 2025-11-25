import { ApiBody, ApiConsumes, ApiProperty } from "@nestjs/swagger";
import {
  IsBase64,
  IsBoolean,
  IsBooleanString,
  IsNotEmpty,
  IsOptional,
} from "class-validator";

export class UploadFileDto {
  @ApiProperty({ type: "string", format: "binary" })
  @IsOptional()
  file: Express.Multer.File;

  @ApiProperty({ description: "Set true to make file public", required: false })
  @IsOptional()
  @IsBooleanString()
  isPublic?: boolean;
}
