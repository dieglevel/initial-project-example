import { Module } from "@nestjs/common";
import { AccountController } from "./account.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Account } from "./_entities/account.entity";
import { Profile } from "./_entities/profile.entity";
import { AccountService } from "./account.service";

@Module({
  imports: [TypeOrmModule.forFeature([Account, Profile])],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
