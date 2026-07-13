import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FileEntity } from "./_entities/file.entity";
import { UploadFileDto, UploadMultipleDto } from "./dto/upload.dto";
import { FileProvider, FileType } from "./enum";
import {
  FileStorageAdapter,
  StreamFileInfo,
} from "./storage/file-storage.adapter";

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
      case FileProvider.LOCAL_DISK:
      default:
        return this.localDiskService;
    }
  }

  async uploadSingle(file: Express.Multer.File, body: UploadFileDto) {
    const adapter = this.getAdapter(body.fileProvider);

    const uploadResult = await adapter.upload(
      file,
      body.fileType ?? FileType.OTHER,
    );

    const entity = this.fileRepo.create({
      fileType: body.fileType ?? FileType.OTHER,
      provider: body.fileProvider ?? FileProvider.LOCAL_DISK,
      storagePath: uploadResult.storagePath,
      size: uploadResult.size,
      mimeType: uploadResult.mimeType,
      fileKey: uploadResult.fileKey,
      originalName: uploadResult.originalName,
    });

    try {
      return await this.fileRepo.manager.transaction(async (manager) => {
        return await manager.save(entity);
      });
    } catch (error) {
      await adapter.delete(uploadResult.storagePath);
      throw error;
    }
  }

  async uploadMultiple(files: Express.Multer.File[], body: UploadMultipleDto) {
    const adapter = this.getAdapter(body.fileProvider);
    const uploadedPaths: string[] = [];

    try {
      const entities: FileEntity[] = [];

      for (let i = 0; i < files.length; i++) {
        const result = await adapter.upload(
          files[i],
          body.fileType ?? FileType.OTHER,
        );

        uploadedPaths.push(result.storagePath);

        entities.push(
          this.fileRepo.create({
            fileType: body.fileType ?? FileType.OTHER,
            provider: body.fileProvider ?? FileProvider.LOCAL_DISK,
            storagePath: result.storagePath,
            size: result.size,
            mimeType: result.mimeType,
            fileKey: result.fileKey,
            originalName: result.originalName,
            order: i + 1,
          }),
        );
      }

      return await this.fileRepo.manager.transaction(async (manager) => {
        return await manager.save(entities);
      });
    } catch (error) {
      // rollback storage nếu DB fail hoặc upload giữa chừng fail
      await Promise.all(uploadedPaths.map((path) => adapter.delete(path)));
      throw error;
    }
  }

  async getStream(id: string, range?: string): Promise<StreamFileInfo> {
    const file = await this.fileRepo.findOneBy({ id });
    if (!file) throw new Error("File not found");

    const adapter = this.getAdapter(file.provider);
    return adapter.getStreamAndHeaders(file.storagePath, range);
  }

  delete(storedName: string) {
    return this.localDiskService.delete(storedName);
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.fileRepo.softDelete({ id });
    return true;
  }

  async restore(id: string): Promise<FileEntity> {
    await this.fileRepo.restore({ id });

    const file = await this.fileRepo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!file) throw new Error("File not found");

    return file;
  }

  async changeTemporaryStatus(
    id: string,
    isTemporary: boolean,
  ): Promise<FileEntity> {
    const file = await this.fileRepo.findOneBy({ id });
    if (!file) throw new Error("File not found");

    file.isTemporary = isTemporary;
    return this.fileRepo.save(file);
  }
}
