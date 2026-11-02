import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { DecimalTransformer } from "@/common/util/decimal-transformer";
import { IsNumber, IsOptional, IsString, Matches } from "class-validator";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { FinancialCategoryEntity } from "./financial-category.entity";

@Entity("financial-category-budget")
@Index("UQ_financial_category_budget_category_month", ["categoryId", "month"], {
  unique: true,
})
@ApiEntity()
export class FinancialCategoryBudgetEntity extends BaseEntity {
  @Column({ type: "int" })
  @IsNumber()
  categoryId: number;

  @ManyToOne(() => FinancialCategoryEntity, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "categoryId" })
  category: FinancialCategoryEntity;

  @Column({ type: "varchar", length: 7 })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  month: string;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: DecimalTransformer,
  })
  @IsNumber()
  @IsOptional()
  amount: number | null;
}
