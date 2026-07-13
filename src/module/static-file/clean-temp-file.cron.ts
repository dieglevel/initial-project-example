import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThan, Repository } from "typeorm";
import { FileEntity } from "./_entities/file.entity";
import { LocalDiskAdapter } from "./storage/service/local-disk.adapter";

@Injectable()
export class FileCleanupCron {
  private readonly logger = new Logger(FileCleanupCron.name);

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepo: Repository<FileEntity>,
    @Inject("LocalDiskAdapter")
    private readonly localDiskAdapter: LocalDiskAdapter,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredFiles() {
    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const expiredFiles = await this.fileRepo.find({
      where: {
        isTemporary: true,
        createdAt: LessThan(expiredDate),
      },
    });

    if (!expiredFiles.length) {
      return;
    }

    let totalFreedSize = 0;

    for (const file of expiredFiles) {
      try {
        await this.fileRepo.delete(file.id);
        try {
          await this.localDiskAdapter.delete(file.storagePath);
          totalFreedSize += file.size ?? 0;
        } catch {
          // Không làm gì nếu xóa vật lý lỗi
        }
      } catch {
        continue;
      }
    }

    if (totalFreedSize > 0) {
      const freedMB = (totalFreedSize / (1024 * 1024)).toFixed(2);
      this.logger.log(
        `Freed ${freedMB} MB (${totalFreedSize} bytes) from expired files.`,
      );
    }
  }
}
