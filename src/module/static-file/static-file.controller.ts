import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Res,
  Req,
  Body,
  HttpCode,
  SerializeOptions,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { StaticFileService } from "./static-file.service";
import { Response, Request } from "express";
import { ApiBody, ApiConsumes, ApiResponse } from "@nestjs/swagger";
import { UploadFileDto, UploadMultipleDto } from "./dto/upload.dto";
import { Public } from "../auth/decorator/public.decorator";
import { ApiBaseResponse } from "src/common/decorator/api-swagger/api-base-response.decorator";
import { File } from "./_entities/file.entity";

@Controller("static")
@Public()
export class StaticFileController {
  constructor(private readonly fileService: StaticFileService) {}

  @Post("upload")
  @HttpCode(200)
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @SerializeOptions({ groups: ["fileProvider"] })
  @ApiBody({ type: UploadFileDto })
  @ApiBaseResponse(File)
  uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadFileDto,
  ) {
    return this.fileService.uploadSingle(file, body);
  }

  @Post("upload-multiple")
  @HttpCode(200)
  @UseInterceptors(FilesInterceptor("files", 20))
  @SerializeOptions({ groups: ["fileProvider"] })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: UploadMultipleDto })
  @ApiBaseResponse(File, { isArray: true })
  uploadMany(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadMultipleDto,
  ) {
    return this.fileService.uploadMultiple(files, body);
  }

  @Get("stream/:storedName")
  async stream(
    @Param("storedName") storedName: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const range = req.headers.range;
    const { stream, headers, statusCode } = this.fileService.getStream(
      storedName,
      range,
    );

    res.status(statusCode);
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));

    stream.pipe(res);
  }

  @Delete(":storedName")
  delete(@Param("storedName") storedName: string) {
    return this.fileService.delete(storedName);
  }
}
