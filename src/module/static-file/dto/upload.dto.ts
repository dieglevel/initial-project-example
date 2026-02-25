import {
  ApiBody,
  ApiConsumes,
  ApiProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";
import {
  IsBase64,
  IsBoolean,
  IsBooleanString,
  IsNotEmpty,
  IsOptional,
} from "class-validator";
import { FileProvider, FileType } from "../enum";

export class UploadFileDto {
  @ApiProperty({ type: "string", format: "binary" })
  @IsOptional()
  file: Express.Multer.File;

  @ApiProperty({ type: "string", enum: FileType })
  @IsOptional()
  fileType?: FileType;

  @ApiProperty({ type: "string", enum: FileProvider })
  @IsOptional()
  fileProvider?: FileProvider;
}
