import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccountEntity } from "../account/_entities/account.entity";
import { AccountModule } from "../account/account.module";
import { ProfileEntity } from "../profile/_entities/profile.entity";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [
    AccountModule,
    TypeOrmModule.forFeature([AccountEntity, ProfileEntity]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
