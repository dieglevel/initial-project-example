import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { FinancialTransactionEntity } from "./financial-transaction.entity";
import { FinancialCategoryEntity } from "@/module/financial/financial-category/_entities/financial-category.entity";
import { IsNumber, IsOptional } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

@Entity("financial-transaction-item")
@ApiEntity()
export class FinancialTransactionItemEntity extends BaseEntity {
  @Column({ type: "varchar", length: 255, nullable: false })
  description: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
  amount: number;

  @ManyToOne(
    () => FinancialTransactionEntity,
    (transaction) => transaction.financialTransactionItems,
    {
      onDelete: "CASCADE",
    },
  )
  @JoinColumn({ name: "transactionId" })
  transaction: FinancialTransactionEntity;

  @Column({ type: "int", nullable: false })
  transactionId: number;

  @ManyToOne(
    () => FinancialCategoryEntity,
    (category) => category.transactionItems,
    {
      nullable: true,
      onDelete: "SET NULL",
      eager: true,
    },
  )
  @JoinColumn({ name: "categoryId" })
  @ApiPropertyOptional({
    type: () => FinancialCategoryEntity,
    default: "FinancialCategory",
  })
  category?: FinancialCategoryEntity;

  @Column({ nullable: true })
  @IsNumber()
  @IsOptional()
  categoryId?: number;
}
