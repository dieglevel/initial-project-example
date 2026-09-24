import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { FinancialDebtEntity } from "./financial-debt.entity";
import { FinancialWalletEntity } from "../../financial-wallet/_entities/financial-wallet.entity";
import { FINANCIAL_DEBT_HISTORY_TYPE_ENUM } from "../financial-debt-history.enum";
import { DecimalTransformer } from "@/common/util/decimal-transformer";

@Entity("financial-debt-history")
@Index(["debtId", "occurredAt", "id"])
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

  @Column({ type: "enum", enum: FINANCIAL_DEBT_HISTORY_TYPE_ENUM })
  type: FINANCIAL_DEBT_HISTORY_TYPE_ENUM;

  @Column({
    type: "decimal",
    precision: 14,
    scale: 2,
    default: 0,
    transformer: DecimalTransformer,
  })
  amount: number;

  @Column({
    type: "decimal",
    precision: 14,
    scale: 2,
    transformer: DecimalTransformer,
  })
  previousOutstandingAmount: number;

  @Column({
    type: "decimal",
    precision: 14,
    scale: 2,
    transformer: DecimalTransformer,
  })
  outstandingAmount: number;

  /** Ngày giao dịch thực tế "YYYY-MM-DD" (khác createdAt) */
  @Column({ type: "date" })
  occurredAt: string;

  /** Ví bị ảnh hưởng. null = chỉ ghi sổ nợ, không đụng ví */
  @Column({ type: "int", nullable: true })
  walletId?: number | null;

  @ManyToOne(() => FinancialWalletEntity, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "walletId" })
  wallet?: FinancialWalletEntity | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  note?: string | null;
}
