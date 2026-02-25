import { Inject, Injectable } from "@nestjs/common";
import { FileStorageAdapter } from "./storage/file-storage.adapter";
import { FileProvider, FileType } from "./enum";
import { InjectRepository } from "@nestjs/typeorm";
import { File } from "./_entities/file.entity";
import { Repository } from "typeorm";
import { UploadFileDto, UploadMultipleDto } from "./dto/upload.dto";

@Injectable()
export class StaticFileService {
  constructor(
    @Inject("LocalDiskAdapter")
    private readonly localDiskService: FileStorageAdapter,

    @InjectRepository(File)
    private readonly fileRepo: Repository<File>,
  ) {}

  private getAdapter(
    provider: FileProvider = FileProvider.LOCAL_DISK,
  ): FileStorageAdapter {
    switch (provider) {
      case FileProvider.LOCAL_DISK:
      default:
        return this.localDiskService;
    }
  }

  async uploadSingle(file: Express.Multer.File, body: UploadFileDto) {
    try {
      const adapter = this.getAdapter(body.fileProvider);

      const uploadResult = await adapter.upload(file, body.fileType);

      const entity = this.fileRepo.create({
        fileType: body?.fileType || FileType.OTHER,
        provider: body?.fileProvider || FileProvider.LOCAL_DISK,
        storagePath: uploadResult.storagePath,
        size: uploadResult.size,
        mimeType: uploadResult.mimeType,
        fileKey: uploadResult.fileKey,
        originalName: uploadResult.originalName,
      });

      await this.fileRepo.manager.transaction(
        async (transactionalEntityManager) => {
          try {
            await transactionalEntityManager.save(entity);
          } catch (error) {
            console.error("Error during file upload transaction:", error);
            await adapter.delete(uploadResult.storagePath);
            throw error;
          }
        },
      );

      return entity;
    } catch (error) {
      console.error("Error in uploadSingle:", error);
      throw error;
    }
  }

  async uploadMultiple(files: Express.Multer.File[], body: UploadMultipleDto) {
    const adapter = this.getAdapter(body.fileProvider);

    const uploadResults = await Promise.all(
      files.map((file) => adapter.upload(file, body.fileType)),
    );

    const entities = uploadResults.map((result, index) =>
      this.fileRepo.create({
        fileType: body?.fileType || FileType.OTHER,
        provider: body?.fileProvider || FileProvider.LOCAL_DISK,
        storagePath: result.storagePath,
        size: result.size,
        mimeType: result.mimeType,
        fileKey: result.fileKey,
        originalName: result.originalName,
        order: index + 1,
      }),
    );

    try {
      await this.fileRepo.manager.transaction(
        async (transactionalEntityManager) => {
          await transactionalEntityManager.save(entities);
        },
      );

      return entities;
    } catch (error) {
      await Promise.all(
        uploadResults.map((result) => adapter.delete(result.storagePath)),
      );

      console.error("Error during uploadMultiple transaction:", error);
      throw error;
    }
  }

  getStream(storedName: string, range?: string) {
    return this.localDiskService.getStreamAndHeaders(storedName, range);
  }

  delete(storedName: string) {
    return this.localDiskService.delete(storedName);
  }
}
