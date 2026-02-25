import { Injectable, NotFoundException } from "@nestjs/common";
import {
  FileStorageAdapter,
  StreamFileInfo,
  UploadedFileInfo,
} from "../file-storage.adapter";
import { createReadStream, existsSync, promises as fs, statSync } from "fs";
import { join, extname } from "path";
import { randomUUID } from "crypto";
import { FileType } from "../../enum";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class LocalDiskAdapter implements FileStorageAdapter {
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    const appConfig = this.configService.get<{
      ROOT_UPLOAD_FOLDER: string;
      ROUTE_FOLDER: string;
    }>("appConfig");

    if (!appConfig) {
      throw new Error("appConfig is not defined in configuration");
    }

    this.uploadDir = join(appConfig.ROOT_UPLOAD_FOLDER, appConfig.ROUTE_FOLDER);

    void fs.mkdir(this.uploadDir, { recursive: true });
  }

  private resolvePath(...paths: string[]) {
    return join(this.uploadDir, ...paths);
  }

  private generateUniqueName(originalName: string) {
    return `${Date.now()}-${randomUUID()}${extname(originalName)}`;
  }

  private async createFolder(folder: string) {
    await fs.mkdir(this.resolvePath(folder), { recursive: true });
    return true;
  }

  async upload(
    file: Express.Multer.File,
    fileType: FileType = FileType.OTHER,
  ): Promise<UploadedFileInfo> {
    try {
      const storedName = this.generateUniqueName(file.originalname);
      const folderPath = this.resolvePath(fileType);
      const fullPath = this.resolvePath(fileType, storedName);

      await fs.mkdir(folderPath, { recursive: true });
      await fs.writeFile(fullPath, file.buffer);
      console.log(`File saved to ${fullPath}`);

      return {
        fileKey: storedName,
        storagePath: join(fileType, storedName),
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      console.error("Error uploading file to local disk:", error);
      throw error;
    }
  }

  async delete(storagePath: string): Promise<boolean> {
    const filePath = this.resolvePath(storagePath);

    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      throw new NotFoundException("File not found");
    }
  }

  getStreamAndHeaders(
    storedName: string,
    rangeHeader?: string,
  ): StreamFileInfo {
    const filePath = this.resolvePath(storedName);
    console.log(`Attempting to stream file from path: ${filePath}`);

    if (!existsSync(filePath)) {
      throw new NotFoundException("File not found");
    }

    const { size: fileSize } = statSync(filePath);
    const mimeType = "application/octet-stream";

    // Không có range → trả full file
    if (!rangeHeader) {
      return {
        statusCode: 200,
        stream: createReadStream(filePath),
        headers: {
          "Content-Length": `${fileSize}`,
          "Content-Type": mimeType,
          "Accept-Ranges": "bytes",
        },
      };
    }

    // Parse range: bytes=start-end
    const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);

    if (!match) {
      throw new NotFoundException("Invalid range header");
    }

    const start = match[1] ? parseInt(match[1], 10) : 0;
    const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      throw new NotFoundException("Range not satisfiable");
    }

    const chunkSize = end - start + 1;

    return {
      statusCode: 206,
      stream: createReadStream(filePath, { start, end }),
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": `${chunkSize}`,
        "Content-Type": mimeType,
      },
    };
  }
}
