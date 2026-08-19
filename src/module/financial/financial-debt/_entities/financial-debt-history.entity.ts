import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { FinancialDebtEntity } from "./financial-debt.entity";
import { FINANCIAL_DEBT_HISTORY_TYPE_ENUM } from "../financial-debt-history.enum";

@Entity("financial-debt-history")
@ApiEntity()
export class FinancialDebtHistoryEntity extends BaseEntity {
  @Column({ type: "int" })
  debtId: number;

  @ManyToOne(() => FinancialDebtEntity, (debt) => debt.histories, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "debtId" })
  debt: FinancialDebtEntity;

  @Column({
    type: "enum",
    enum: FINANCIAL_DEBT_HISTORY_TYPE_ENUM,
  })
  type: FINANCIAL_DEBT_HISTORY_TYPE_ENUM;

  @Column({
    type: "decimal",
    precision: 14,
    scale: 2,
    default: 0,
  })
  amount: number;

  @Column({
    type: "decimal",
    precision: 14,
    scale: 2,
  })
  previousOutstandingAmount: number;

  @Column({
    type: "decimal",
    precision: 14,
    scale: 2,
  })
  outstandingAmount: number;

  @Column({ type: "varchar", length: 500, nullable: true })
  note?: string | null;
}
