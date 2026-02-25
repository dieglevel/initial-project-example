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
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { StaticFileService } from "./static-file.service";
import { Response, Request } from "express";
import { ApiBody, ApiConsumes } from "@nestjs/swagger";
import { UploadFileDto } from "./dto/upload.dto";
import { Public } from "../auth/decorator/public.decorator";

@Controller("static")
@Public()
export class StaticFileController {
  constructor(private readonly fileService: StaticFileService) {}

  @Post("upload")
  @HttpCode(200)
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: UploadFileDto })
  uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadFileDto,
  ) {
    return this.fileService.uploadSingle(file, body);
  }

  @Post("upload-multiple")
  @HttpCode(200)
  @UseInterceptors(FilesInterceptor("files", 20))
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: [UploadFileDto] })
  uploadMany(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadFileDto,
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
