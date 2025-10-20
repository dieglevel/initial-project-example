export const generateResponseDto = (className: string) =>
  `
import { ApiProperty, PartialType } from "@nestjs/swagger";
import { BaseEntityDto } from "src/common/dto/swagger-schema/base-entity.dto";

export class Base${className}_ResponseDto extends PartialType(BaseEntityDto) {

}

`.trimStart();
