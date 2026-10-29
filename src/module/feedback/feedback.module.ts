import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { FeedbackEntity } from "./_entities/feedback.entity";
import { FileEntity } from "@/module/static-file/_entities/file.entity";
import { AccountEntity } from "@/module/account/_entities/account.entity";
import { FeedbackService } from "./feedback.service";
import { FeedbackController } from "./feedback.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([FeedbackEntity, FileEntity, AccountEntity]),
    JwtModule,
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
