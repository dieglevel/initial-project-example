/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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

    this.logger.log(
      `[Cleanup] Starting expired temp-file cleanup. Cutoff: ${expiredDate.toISOString()}`,
    );

    const expiredFiles = await this.fileRepo.find({
      where: {
        isTemporary: true,
        createdAt: LessThan(expiredDate),
      },
    });

    if (!expiredFiles.length) {
      this.logger.log("[Cleanup] No expired temporary files found. Skipping.");
      return;
    }

    this.logger.log(
      `[Cleanup] Found ${expiredFiles.length} expired file(s) to process.`,
    );

    let totalFreedSize = 0;
    let dbDeleted = 0;
    let diskDeleted = 0;
    let diskMissing = 0;
    let dbErrors = 0;
    let diskErrors = 0;

    for (const file of expiredFiles) {
      this.logger.debug(
        `[Cleanup] Processing file id=${file.id} path="${file.storagePath}" size=${file.size ?? 0}B`,
      );

      try {
        await this.fileRepo.delete(file.id);
        dbDeleted++;
        this.logger.debug(`[Cleanup] DB record deleted for id=${file.id}`);
      } catch (dbErr: any) {
        dbErrors++;
        this.logger.error(
          `[Cleanup] Failed to delete DB record for id=${file.id}: ${dbErr?.message ?? dbErr}`,
        );
        continue;
      }

      try {
        const deleted = await this.localDiskAdapter.delete(file.storagePath);
        if (deleted) {
          diskDeleted++;
          totalFreedSize += file.size ?? 0;
          this.logger.debug(
            `[Cleanup] Physical file removed: "${file.storagePath}"`,
          );
        } else {
          diskMissing++;
          this.logger.warn(
            `[Cleanup] Physical file not found (already gone?): "${file.storagePath}"`,
          );
        }
      } catch (diskErr: any) {
        diskErrors++;
        this.logger.error(
          `[Cleanup] Failed to delete physical file "${file.storagePath}": ${diskErr?.message ?? diskErr}`,
        );
      }
    }

    const freedMB = (totalFreedSize / (1024 * 1024)).toFixed(2);
    this.logger.log(
      `[Cleanup] Finished. DB deleted=${dbDeleted} (errors=${dbErrors}) | ` +
        `Disk deleted=${diskDeleted}, missing=${diskMissing}, errors=${diskErrors} | ` +
        `Freed=${freedMB} MB (${totalFreedSize} bytes)`,
    );
    return {
      totalFilesProcessed: expiredFiles.length,
      dbDeleted,
      dbErrors,
      diskDeleted,
      diskMissing,
      diskErrors,
      totalFreedSize,
    };
  }
}
