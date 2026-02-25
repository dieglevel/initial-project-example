import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StaticFileService } from "./static-file.service";
import { StaticFileController } from "./static-file.controller";
import { LocalDiskAdapter } from "./storage/service/local-disk.adapter";
import { File } from "./_entities/file.entity";
import { FileCleanupCron } from "./clean-temp-file.cron";

@Module({
  imports: [TypeOrmModule.forFeature([File])],
  controllers: [StaticFileController],
  providers: [
    StaticFileService,
    FileCleanupCron,
    {
      provide: "LocalDiskAdapter",
      useClass: LocalDiskAdapter,
    },
  ],
})
export class StaticFileModule {}
