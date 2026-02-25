import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  Res,
  SerializeOptions,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes } from "@nestjs/swagger";
import { Request, Response } from "express";
import { ApiBaseResponse } from "src/common/decorator/api-swagger/api-base-response.decorator";
import { Public } from "../auth/decorator/public.decorator";
import { File } from "./_entities/file.entity";
import { UploadFileDto, UploadMultipleDto } from "./dto/upload.dto";
import { StaticFileService } from "./static-file.service";

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
    const { stream, headers, statusCode } = await this.fileService.getStream(
      storedName,
      range,
    );

    res.status(statusCode);
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));

    stream.pipe(res);
  }

  @Delete(":id")
  @HttpCode(200)
  @ApiBaseResponse(File)
  delete(@Param("id") id: string) {
    return this.fileService.softDelete(id);
  }

  @Post("restore/:id")
  @HttpCode(200)
  @SerializeOptions({ groups: ["fileProvider"] })
  @ApiBaseResponse(File)
  restore(@Param("id") id: string) {
    return this.fileService.restore(id);
  }
}
