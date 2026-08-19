import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { Column, Entity } from "typeorm";

@Entity("financial-record")
@ApiEntity()
export class FinancialRecordEntity extends BaseEntity {
  @Column({ type: "json", nullable: true })
  record: JSON | null;
}
