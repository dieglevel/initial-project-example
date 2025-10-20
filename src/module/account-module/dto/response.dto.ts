import { ApiProperty, PartialType } from "@nestjs/swagger";
import { BaseEntityDto } from "src/common/dto/swagger-schema/base-entity.dto";
import { Account } from "../_entities/account.entity";

export class TempResponse extends Account {
  temp: Account[];
}
