import { Module } from "@nestjs/common";
import { AccountService } from "./account.service";
import { AccountController } from "./account.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Account } from "./_entities/account.entity";
import { Profile } from "../profile/_entities/profile.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Account, Profile])],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
