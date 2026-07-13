import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import {
  IsBoolean,
  IsDecimal,
  IsHexColor,
  IsNotEmpty,
  IsString,
} from "class-validator";
import { Column, Entity } from "typeorm";

@Entity("financial-category")
@ApiEntity()
export class FinancialCategoryEntity extends BaseEntity {
  @Column({ type: "varchar", length: 255, nullable: false })
  @IsString()
  @IsNotEmpty()
  name: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  @IsHexColor()
  @IsNotEmpty()
  color: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
  @IsDecimal()
  monthlyBudget: number;

  @Column({ type: "boolean", nullable: false, default: false })
  @IsBoolean()
  archived: boolean;
}
