import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StaticFileService } from "./static-file.service";
import { StaticFileController } from "./static-file.controller";
import { LocalDiskAdapter } from "./storage/service/local-disk.adapter";
import { FileEntity } from "./_entities/file.entity";

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity])],
  controllers: [StaticFileController],
  providers: [
    StaticFileService,
    {
      provide: "LocalDiskAdapter",
      useClass: LocalDiskAdapter,
    },
  ],
})
export class StaticFileModule {}
