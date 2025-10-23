import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { Account } from "../_entities/account.entity";

export class CreateAccountDtoRequest {
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

export class CreateAccountDtoResponse extends Account {}
