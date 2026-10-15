import { Module } from "@nestjs/common";
import { ProfileService } from "./profile.service";
import { ProfileController } from "./profile.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProfileEntity } from "./_entities/profile.entity";
import { FileEntity } from "../static-file/_entities/file.entity";
import { StaticFileService } from "../static-file/static-file.service";
import { StaticFileModule } from "../static-file/static-file.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([ProfileEntity, FileEntity]),
    StaticFileModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
