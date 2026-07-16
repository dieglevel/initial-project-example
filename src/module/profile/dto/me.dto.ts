import { OmitType } from "@nestjs/swagger";
import { ProfileEntity } from "../_entities/profile.entity";

export class MeDto {
  userId: number;
}

export class MeDtoResponse extends OmitType(ProfileEntity, ["account"]) {}
