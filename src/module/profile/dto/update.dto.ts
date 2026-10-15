import { PartialType } from "@nestjs/swagger/dist/type-helpers/partial-type.helper";
import { ProfileEntity } from "../_entities/profile.entity";
import { IsNumber, IsOptional } from "class-validator";

export class Profile_Update_Request extends PartialType(ProfileEntity) {
  @IsNumber()
  @IsOptional()
  avatarId?: number;
}

export class Profile_Update_Response extends ProfileEntity {}
