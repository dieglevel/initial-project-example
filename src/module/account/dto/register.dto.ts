import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { AccountEntity } from "../_entities/account.entity";
import { OmitType } from "@nestjs/swagger";

export class RegisterDtoRequest {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class RegisterDtoResponse extends OmitType(AccountEntity, []) {}
