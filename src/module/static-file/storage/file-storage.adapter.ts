import { FileType } from "../enum";

export interface UploadedFileInfo {
  storedName: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
}

export interface StreamFileInfo {
  stream: NodeJS.ReadableStream;
  headers: Record<string, string>;
  statusCode: number;
}

export interface FileStorageAdapter {
  upload(
    file: Express.Multer.File,
    fileType?: FileType,
  ): Promise<UploadedFileInfo>;

  delete(storedName: string): Promise<boolean>;

  getStreamAndHeaders(storedName: string, rangeHeader?: string): StreamFileInfo;
  createFolder(folder: string): Promise<boolean>;
}
