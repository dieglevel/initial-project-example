import { Module } from "@nestjs/common";
import { AccountService } from "./account.service";
import { AccountController } from "./account.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccountEntity } from "./_entities/account.entity";
import { ProfileEntity } from "../profile/_entities/profile.entity";

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity, ProfileEntity])],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
