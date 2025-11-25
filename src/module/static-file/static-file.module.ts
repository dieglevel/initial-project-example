import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StaticFileService } from "./static-file.service";
import { StaticFileController } from "./static-file.controller";
import { LocalStorageAdapter } from "./storage/local-storage.adapter";

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [StaticFileController],
  providers: [
    StaticFileService,
    {
      provide: "FileStorageAdapter",
      useClass: LocalStorageAdapter,
    },
  ],
})
export class StaticFileModule {}
