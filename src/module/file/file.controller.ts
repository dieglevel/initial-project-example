import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "src/common/decorator/api-swagger/api-base-response.decorator";
import { FileService } from "./file.service";

@Controller("file")
@ApiBearerAuth("access-token")
export class FileController {
  constructor(private readonly fileService: FileService) {}

}
