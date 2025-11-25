import { Injectable, NotFoundException } from "@nestjs/common";
import { FileStorageAdapter } from "./file-storage.adapter";
import { existsSync, statSync, createReadStream, promises as fs } from "fs";
import { join, extname } from "path";
import { randomUUID } from "crypto";

@Injectable()
export class LocalStorageAdapter implements FileStorageAdapter {
  private uploadDir = join(process.cwd(), "uploads");

  constructor() {
    if (!existsSync(this.uploadDir))
      fs.mkdir(this.uploadDir, { recursive: true });
  }

  generateUniqueName(originalName: string) {
    const ext = extname(originalName);
    return `${Date.now()}-${randomUUID()}${ext}`;
  }

  async upload(file: Express.Multer.File) {
    const storedName = this.generateUniqueName(file.originalname);
    const path = join(this.uploadDir, storedName);

    await fs.writeFile(path, file.buffer);

    return {
      storedName,
      originalName: file.originalname,
      path,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  async delete(storedName: string) {
    const filePath = join(this.uploadDir, storedName);

    if (!existsSync(filePath)) {
      throw new NotFoundException("File not found");
    }

    await fs.unlink(filePath);
  }

  getStreamAndHeaders(
    storedName: string,
    rangeHeader?: string,
  ): {
    stream: NodeJS.ReadableStream;
    headers: Record<string, string>;
    statusCode: number;
  } {
    const filePath = join(this.uploadDir, storedName);

    if (!existsSync(filePath)) {
      throw new NotFoundException("File not found");
    }

    const stat = statSync(filePath);
    const fileSize = stat.size;

    const mimeType = "application/octet-stream";

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const stream = createReadStream(filePath, { start, end });

      return {
        statusCode: 206,
        stream,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": `${chunkSize}`,
          "Content-Type": mimeType,
        },
      };
    }

    const stream = createReadStream(filePath);

    return {
      stream,
      statusCode: 200,
      headers: {
        "Content-Length": `${fileSize}`,
        "Content-Type": mimeType,
        "Accept-Ranges": "bytes",
      },
    };
  }
}
