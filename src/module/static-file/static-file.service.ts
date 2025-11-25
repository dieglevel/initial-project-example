import { Inject, Injectable } from "@nestjs/common";
import { FileStorageAdapter } from "./storage/file-storage.adapter";

@Injectable()
export class StaticFileService {
  constructor(
    @Inject("FileStorageAdapter")
    private readonly storage: FileStorageAdapter,
  ) {}

  uploadSingle(file: Express.Multer.File) {
    return this.storage.upload(file);
  }

  uploadMultiple(files: Express.Multer.File[]) {
    return Promise.all(files.map((f) => this.storage.upload(f)));
  }

  getStream(storedName: string, range?: string) {
    return this.storage.getStreamAndHeaders(storedName, range);
  }

  delete(storedName: string) {
    return this.storage.delete(storedName);
  }
}
