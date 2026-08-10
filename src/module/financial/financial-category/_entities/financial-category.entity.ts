import { ApiEntity } from "@/common/decorator/api-swagger/api-entity-property.decorator";
import { BaseEntity } from "@/common/global-entity/base-entity.entity";
import { AccountEntity } from "@/module/account/_entities/account.entity";
import {
  IsBoolean,
  IsEnum,
  IsHexColor,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import {
  FINANCIAL_CATEGORY_SPENDING_NATURE,
  FINANCIAL_CATEGORY_TYPE,
} from "../financial-category.enum";
import { FinancialTransactionItemEntity } from "../../financial-transaction/_entities/financial-transaction-item.entity";
import { ApiPropertyOptional } from "@nestjs/swagger";

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

  @Column({ name: "icon", type: "varchar", nullable: false })
  @IsString()
  @IsOptional()
  icon: string;

  @Column({
    type: "enum",
    enum: FINANCIAL_CATEGORY_TYPE,
    nullable: false,
    default: FINANCIAL_CATEGORY_TYPE.EXPENSE,
  })
  @IsEnum(FINANCIAL_CATEGORY_TYPE)
  type: FINANCIAL_CATEGORY_TYPE;

  @Column({
    type: "enum",
    enum: FINANCIAL_CATEGORY_SPENDING_NATURE,
    nullable: true,
  })
  @IsEnum(FINANCIAL_CATEGORY_SPENDING_NATURE)
  @IsOptional()
  spendingNature?: FINANCIAL_CATEGORY_SPENDING_NATURE | null;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  @IsNumber()
  monthlyBudget: number | null;

  @Column({ type: "boolean", nullable: false, default: false })
  @IsBoolean()
  archived: boolean;

  @ManyToOne(() => FinancialCategoryEntity, (category) => category.children, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "parentId" })
  @IsOptional()
  @ApiPropertyOptional({
    type: () => FinancialCategoryEntity,
    default: null,
  })
  parent?: FinancialCategoryEntity | null;

  @Column({ nullable: true })
  @IsNumber()
  @IsOptional()
  parentId?: number | null;

  @OneToMany(() => FinancialCategoryEntity, (category) => category.parent)
  @ApiPropertyOptional({
    type: () => FinancialCategoryEntity,
    isArray: true,
  })
  @IsOptional()
  children?: FinancialCategoryEntity[];

  @OneToMany(
    () => FinancialTransactionItemEntity,
    (advanceTransaction) => advanceTransaction.category,
    {
      nullable: true,
      onDelete: "SET NULL",
    },
  )
  @ApiPropertyOptional({
    type: () => FinancialTransactionItemEntity,
    isArray: true,
    name: "transactionItems",
  })
  transactionItems?: FinancialTransactionItemEntity[];

  @ManyToOne(() => AccountEntity, (account) => account.financialCategories, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @ApiPropertyOptional({
    type: () => AccountEntity,
  })
  account: AccountEntity;
}
