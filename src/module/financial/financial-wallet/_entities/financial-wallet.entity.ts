import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { Entity } from "typeorm";

@Entity("financial-wallet")
@ApiEntity()
export class FinancialWalletEntity extends BaseEntity {}
