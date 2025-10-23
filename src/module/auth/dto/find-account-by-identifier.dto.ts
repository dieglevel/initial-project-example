import { IsNotEmpty, IsString } from "class-validator";
import { Account } from "../_entities/account.entity";

export class FindAccountByIdentifierDto {
  @IsString()
  @IsNotEmpty()
  identifier: string;
}

export class FindAccountByIdentifierDtoResponse extends Account {}
