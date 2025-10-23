import { OmitType } from "@nestjs/swagger";
import { Profile } from "../_entities/profile.entity";

export class MeDto {
  userId: string;
}

export class MeDtoResponse extends OmitType(Profile, ["account"]) {}
