import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { FinancialTransactionEntity } from "../../_entities/financial-transaction.entity";

@Entity("financial-advance-transaction")
@ApiEntity()
export class FinancialAdvanceTransactionEntity extends BaseEntity {
  @Column({ type: "varchar", length: 255, nullable: false })
  description: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
  amount: number;

  @ManyToOne(
    () => FinancialTransactionEntity,
    (transaction) => transaction.financialAdvanceTransactions,
    {
      onDelete: "CASCADE",
    },
  )
  @JoinColumn({ name: "transactionId" })
  transaction: FinancialTransactionEntity;

  @Column({ type: "int", nullable: false })
  transactionId: number;
}
