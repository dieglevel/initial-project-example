import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Account } from "./_entities/account.entity";
import { Profile } from "./_entities/profile.entity";
import { AuthService } from "./auth.service";
import { AccountService } from "./account.service";
import { JwtModule } from "@nestjs/jwt";
import { InitialJwtModule } from "src/common/config/jwt.module";

@Module({
  imports: [TypeOrmModule.forFeature([Account, Profile])],
  controllers: [AuthController],
  providers: [AuthService, AccountService],
})
export class AuthModule {}
