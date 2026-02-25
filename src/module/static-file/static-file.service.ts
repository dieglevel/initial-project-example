import { Inject, Injectable } from "@nestjs/common";
import { FileStorageAdapter } from "./storage/file-storage.adapter";
import { FileProvider, FileType } from "./enum";
import { InjectRepository } from "@nestjs/typeorm";
import { FileEntity } from "./_entities/file.entity";
import { Repository } from "typeorm";
import { UploadFileDto } from "./dto/upload.dto";

@Injectable()
export class StaticFileService {
  constructor(
    @Inject("LocalDiskAdapter")
    private readonly localDiskService: FileStorageAdapter,

    @InjectRepository(FileEntity)
    private readonly fileRepo: Repository<FileEntity>,
  ) {}

  private getAdapter(
    provider: FileProvider = FileProvider.LOCAL_DISK,
  ): FileStorageAdapter {
    switch (provider) {
      case FileProvider.CLOUDINARY:
        return this.localDiskService; // Placeholder for actual Cloudinary adapter
      case FileProvider.LOCAL_DISK:
      default:
        return this.localDiskService;
    }
  }

  async uploadSingle(file: Express.Multer.File, body: UploadFileDto) {
    const adapter = this.getAdapter(body.fileProvider);

    const uploadResult = await adapter.upload(file, body.fileType);

    const entity = this.fileRepo.create({
      fileType: body?.fileType || FileType.OTHER,
      fileOriginal: file.originalname,
      fileSave: uploadResult.storedName,
      mimeType: file.mimetype,
      size: file.size,
      provider: body.fileProvider,
      fullPath: uploadResult.path,
    });

    await this.fileRepo.manager.transaction(
      async (transactionalEntityManager) => {
        try {
          await transactionalEntityManager.save(entity);
        } catch (error) {
          console.error("Error during file upload transaction:", error);
          await adapter.delete(uploadResult.storedName);
          throw error;
        }
      },
    );

    return entity;
  }

  uploadMultiple(files: Express.Multer.File[], body: UploadFileDto) {
    return Promise.all(
      files.map((f) => this.localDiskService.upload(f, body.fileType)),
    );
  }

  getStream(storedName: string, range?: string) {
    return this.localDiskService.getStreamAndHeaders(storedName, range);
  }

  delete(storedName: string) {
    return this.localDiskService.delete(storedName);
  }
}
